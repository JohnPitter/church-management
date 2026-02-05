# Análise do Sistema de Permissões

> Documento de análise técnica para refatoração do sistema de permissões.
> **Data:** 2026-02-03
> **Status:** Análise Inicial

---

## 1. Visão Geral do Sistema Atual

O sistema de permissões atual é **complexo e fragmentado**, com múltiplas camadas que tentam resolver o mesmo problema de formas diferentes.

### 1.1 Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APRESENTAÇÃO                        │
├─────────────────────────────────────────────────────────────────────┤
│  useAtomicPermissions (NOVO)  │  usePermissions (LEGADO)            │
│  PermissionGuard              │  useCanManage* hooks                │
│  PermissionButton             │  AuthContext (role checks)          │
│  ProtectedRoute               │  UserEntity (role helpers)          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE SERVIÇO                             │
├─────────────────────────────────────────────────────────────────────┤
│  AtomicPermissionService      │  PermissionService                  │
│  (Singleton, 5min cache)      │  (Global cache, 10min TTL)          │
│  Real-time subscriptions      │  CRUD de permissões                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE DADOS                               │
├─────────────────────────────────────────────────────────────────────┤
│  Firestore Collections:                                              │
│  • /users/{userId}           - customPermissions (embedded)          │
│  • /rolePermissions/{roleId} - Permissões customizadas de role       │
│  • /userPermissionOverrides  - Overrides por usuário (REDUNDANTE)    │
│  • /customRoles/{roleId}     - Roles customizados                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FIRESTORE SECURITY RULES                         │
├─────────────────────────────────────────────────────────────────────┤
│  • hasPermission(module, action) - Verifica permissão atômica        │
│  • hasModuleAction() - Lógica duplicada de grant/revoke              │
│  • hasRole(role) - Verificação simples de role                       │
│  • hasAnyRole([roles]) - Verificação múltipla                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Problemas Identificados

### 2.1 Duplicação de Código e Lógica

| Problema | Localização | Impacto |
|----------|-------------|---------|
| **Dois hooks para verificação** | `useAtomicPermissions` vs `usePermissions` | Componentes usam hooks diferentes, comportamentos inconsistentes |
| **Dois serviços de permissão** | `AtomicPermissionService` vs `PermissionService` | Caches separados, lógica duplicada |
| **Permissões em dois lugares** | `/users/{id}.customPermissions` vs `/userPermissionOverrides/{id}` | Dados inconsistentes, sincronização necessária |
| **Lógica duplicada nas Rules** | `hasModuleAction()` reimplementa lógica do client | Difícil manter sincronizado |

### 2.2 Inconsistência nos Nomes de Módulos

As Firestore Rules usam **strings diferentes** dos enums do TypeScript:

| TypeScript Enum | Firestore Rules | Usado Na Collection |
|-----------------|-----------------|---------------------|
| `SystemModule.Members` = `'members'` | `'members'` | `/members` ✓ |
| `SystemModule.Assistance` = `'assistance'` | `'assistance'` | `/assistidos`, `/assistencias` ✗ |
| `SystemModule.Finance` = `'finance'` | `'financial'` | `/transactions` ✗ |

**Exemplo do problema nas Rules:**

```javascript
// firestore.rules linha 79-83
function hasSecretaryPermission(module, action) {
  return (module in ['dashboard', 'users', 'members', 'events', 'blog', 'devotionals',
                      'projects', 'visitors', 'prayer-requests', 'forum', 'notifications',
                      'settings', 'assistance', 'ong', 'leadership'] // ...
```

Mas o enum define:
```typescript
// Permission.ts
SystemModule.Assistance = 'assistance'  // OK
SystemModule.Assistidos = 'assistidos'  // Diferente do módulo usado nas rules
```

### 2.3 Armazenamento Redundante de Permissões

**Estrutura atual no documento do usuário:**

```typescript
// /users/{userId}
{
  role: 'secretary',
  status: 'approved',
  customPermissions: {  // Embedded no documento do usuário
    granted: [
      { module: 'members', actions: ['delete'] }
    ],
    revoked: [
      { module: 'blog', actions: ['create'] }
    ]
  }
}
```

**E TAMBÉM em collection separada:**

```typescript
// /userPermissionOverrides/{userId}
{
  userId: 'abc123',
  userEmail: 'user@email.com',
  userName: 'User Name',
  grantedModules: [...],  // Mesmo dado!
  revokedModules: [...],  // Mesmo dado!
  updatedBy: 'admin@email.com',
  updatedAt: Timestamp
}
```

**Problema:** Dois lugares para o mesmo dado = inconsistência garantida.

### 2.4 Cache Fragmentado

```typescript
// AtomicPermissionService.ts - Cache próprio
private cache: Map<string, PermissionCacheEntry> = new Map();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// PermissionService.ts - Cache global separado
const GLOBAL_PERMISSION_CACHE = {
  rolePermissionsCache: new Map<string, RolePermissionConfig>(),
  userOverridesCache: new Map<string, UserPermissionConfig | null>(),
  customRolesCache: new Map<string, CustomRoleConfig>(),
  allPermissionsCache: new Map<string, Map<string, boolean>>(),
  cacheExpiry: new Map<string, number>()
};
private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (diferente!)
```

**Problemas:**
- TTLs diferentes (5 min vs 10 min)
- Invalidação não sincronizada
- Consumo de memória duplicado

### 2.5 Firestore Rules - Bugs Críticos

#### Bug 1: Verificação apenas do primeiro elemento do array

```javascript
// firestore.rules linha 47-51
function hasGrantedPermission(granted, module, action) {
  return granted.size() > 0 &&
         granted[0].module == module &&  // SÓ VERIFICA O PRIMEIRO!
         action in granted[0].actions;
}
```

**Consequência:** Se o usuário tem permissões para `members` e `events`, apenas `members` (se for o primeiro) será verificado. Permissões de `events` serão ignoradas.

#### Bug 2: Roles hardcoded nas Rules

```javascript
// firestore.rules linha 68-74
function hasRolePermission(role, module, action) {
  return role == 'admin' ||
         (role == 'secretary' && hasSecretaryPermission(module, action)) ||
         (role == 'leader' && hasLeaderPermission(module, action)) ||
         (role == 'member' && hasMemberPermission(module, action)) ||
         (role == 'professional' && hasProfessionalPermission(module, action)) ||
         (role == 'finance' && hasFinancePermission(module, action));
}
```

**Problema:** Roles customizados criados via interface **não funcionam** nas Rules!

#### Bug 3: Inconsistência role-based vs permission-based

Algumas collections usam `hasPermission()`:
```javascript
// firestore.rules - Usa sistema de permissão
match /members/{memberId} {
  allow read: if isAuthenticated() && hasPermission('members', 'view');
}
```

Outras usam `hasAnyRole()` diretamente:
```javascript
// firestore.rules - Ignora sistema de permissão
match /projects/{projectId} {
  allow create: if hasAnyRole(['admin', 'secretary', 'leader']);  // Hardcoded!
}
```

### 2.6 Componentes com Verificações Mistas

```tsx
// Layout.tsx - Usa hook atômico
const { hasPermission } = useAtomicPermissions();

// AdminDashboardPage.tsx - Também usa atômico (OK)
const { hasPermission } = useAtomicPermissions();

// Mas alguns componentes ainda usam:
// AuthContext.tsx
const { canCreateContent } = useAuth();  // Verificação por role, não permissão
```

---

## 3. Mapeamento de Componentes

### 3.1 Componentes que Verificam Permissões

| Componente | Hook/Método Usado | Tipo de Verificação |
|------------|-------------------|---------------------|
| `Layout.tsx` | `useAtomicPermissions` | Module + Action |
| `ProtectedRoute.tsx` | `useAtomicPermissions` | Module + Action |
| `PermissionGuard.tsx` | `useAtomicPermissions` | Module + Action |
| `PermissionButton.tsx` | `useAtomicPermissions` | Module + Action |
| `AdminDashboardPage.tsx` | `useAtomicPermissions` | Module + Action |
| `PermissionsManagementPage.tsx` | `useAtomicPermissions` | Module + Action |
| `AuthContext.tsx` | Verificação direta de `role` | Role-based |
| `UserEntity.ts` | Métodos estáticos | Role-based |

### 3.2 Collections e suas Regras de Acesso

| Collection | Método de Verificação | Observação |
|------------|----------------------|------------|
| `/users` | `hasRole('admin')` | Admin-only para delete |
| `/members` | `hasPermission('members', action)` | Sistema atômico ✓ |
| `/events` | `hasPermission('events', action)` | Sistema atômico ✓ |
| `/blogPosts` | `hasPermission('blog', action)` | Sistema atômico ✓ |
| `/projects` | `hasAnyRole([...])` | **Hardcoded** ✗ |
| `/devotionals` | `hasAnyRole([...])` | **Hardcoded** ✗ |
| `/forumCategories` | `hasAnyRole([...])` | **Hardcoded** ✗ |
| `/visitors` | `hasPermission('visitors', action)` | Sistema atômico ✓ |
| `/assistidos` | `hasPermission('assistance', action)` | Módulo diferente do nome |
| `/transactions` | `hasPermission('financial', action)` | **Nome errado!** Deveria ser 'finance' |
| `/assets` | `hasAnyRole(['admin', 'secretary'])` | **Hardcoded** ✗ |
| `/ongSettings` | `hasAnyRole([...])` | **Hardcoded** ✗ |
| `/leaders` | `hasPermission('leadership', action)` | Sistema atômico ✓ |

---

## 4. Fluxo de Dados Atual

### 4.1 Verificação de Permissão (Client-Side)

```
┌──────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│   Componente     │────▶│ useAtomicPermissions│────▶│ AtomicPermission    │
│   (Layout, etc)  │     │      Hook           │     │      Service        │
└──────────────────┘     └────────────────────┘     └─────────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────────┐
                                                    │   Verifica Cache    │
                                                    │   (5 min TTL)       │
                                                    └─────────────────────┘
                                                              │
                                              Cache Miss      │      Cache Hit
                                              ┌───────────────┼───────────────┐
                                              ▼                               ▼
                                    ┌─────────────────┐            ┌─────────────────┐
                                    │ Firestore       │            │ Retorna do      │
                                    │ /users/{id}     │            │ Cache           │
                                    └─────────────────┘            └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────────────────────┐
                                    │ 1. Busca role do usuário            │
                                    │ 2. Aplica DEFAULT_ROLE_PERMISSIONS  │
                                    │ 3. Aplica customPermissions.granted │
                                    │ 4. Remove customPermissions.revoked │
                                    │ 5. Retorna Map<Module, Set<Action>> │
                                    └─────────────────────────────────────┘
```

### 4.2 Verificação de Permissão (Server-Side / Rules)

```
┌──────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│   Operação       │────▶│   Firestore Rules  │────▶│   hasPermission()   │
│   (read/write)   │     │                    │     │   Function          │
└──────────────────┘     └────────────────────┘     └─────────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────────┐
                                                    │ 1. getUserData()    │
                                                    │ 2. Check status     │
                                                    │ 3. hasModuleAction()│
                                                    └─────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────┐
                                    │ hasModuleAction():                  │
                                    │ 1. hasCustomGrant() → só [0]! BUG   │
                                    │ 2. hasRolePermission() (hardcoded)  │
                                    │ 3. !hasCustomRevoke() → só [0]! BUG │
                                    └─────────────────────────────────────┘
```

---

## 5. Estrutura de Dados no Firestore

### 5.1 Documento do Usuário (`/users/{userId}`)

```typescript
interface UserDocument {
  // Dados básicos
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;

  // Role e status
  role: 'admin' | 'secretary' | 'leader' | 'member' | 'professional' | 'finance' | string;
  status: 'pending' | 'approved' | 'rejected';

  // Permissões customizadas (embedded)
  customPermissions?: {
    granted: Array<{
      module: SystemModule;
      actions: PermissionAction[];
    }>;
    revoked: Array<{
      module: SystemModule;
      actions: PermissionAction[];
    }>;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.2 Role Permissions (`/rolePermissions/{roleId}`)

```typescript
interface RolePermissionDocument {
  role: string;
  modules: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>;
  updatedBy: string;
  updatedAt: Timestamp;
}
```

### 5.3 User Permission Overrides (`/userPermissionOverrides/{userId}`)

```typescript
// REDUNDANTE com customPermissions no documento do usuário!
interface UserPermissionOverrideDocument {
  userId: string;
  userEmail: string;
  userName: string;
  grantedModules: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>;
  revokedModules: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>;
  updatedBy: string;
  updatedAt: Timestamp;
}
```

### 5.4 Custom Roles (`/customRoles/{roleId}`)

```typescript
interface CustomRoleDocument {
  roleId: string;
  roleName: string;
  displayName: string;
  description: string;
  modules: Array<{
    module: SystemModule;
    actions: PermissionAction[];
  }>;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy?: string;
  updatedAt?: Timestamp;
}
```

---

## 6. Módulos e Ações Disponíveis

### 6.1 SystemModule (27 módulos)

```typescript
enum SystemModule {
  // Core
  Dashboard = 'dashboard',
  Users = 'users',
  Members = 'members',

  // Content
  Blog = 'blog',
  Events = 'events',
  Devotionals = 'devotionals',
  Transmissions = 'transmissions',
  Projects = 'projects',
  Forum = 'forum',
  Leadership = 'leadership',

  // Church Management
  Visitors = 'visitors',
  Calendar = 'calendar',
  Assistance = 'assistance',
  Assistidos = 'assistidos',  // Duplicado com Assistance?
  Notifications = 'notifications',
  Communication = 'communication',
  ONG = 'ong',

  // Financial
  Finance = 'finance',
  Donations = 'donations',
  Reports = 'reports',
  Assets = 'assets',

  // System
  Settings = 'settings',
  Permissions = 'permissions',
  Audit = 'audit',
  Logs = 'logs',
  Backup = 'backup',
  HomeBuilder = 'home_builder'
}
```

### 6.2 PermissionAction (8 ações)

```typescript
enum PermissionAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Import = 'import',
  Approve = 'approve',
  Manage = 'manage'
}
```

---

## 7. Resumo dos Problemas Críticos

| # | Problema | Severidade | Arquivo Principal |
|---|----------|------------|-------------------|
| 1 | Bug nas Rules: só verifica `[0]` do array | **CRÍTICO** | `firestore.rules:47-51` |
| 2 | Custom roles não funcionam nas Rules | **CRÍTICO** | `firestore.rules:68-74` |
| 3 | Dados duplicados (customPermissions vs userPermissionOverrides) | **ALTO** | Múltiplos |
| 4 | Dois sistemas de verificação coexistindo | **ALTO** | Hooks/Services |
| 5 | Caches com TTLs diferentes (5 vs 10 min) | **MÉDIO** | Services |
| 6 | Inconsistência nos nomes de módulos (finance vs financial) | **MÉDIO** | Rules + Enums |
| 7 | Mix de verificação por role e por permissão | **MÉDIO** | Rules |
| 8 | Módulos redundantes (Assistance vs Assistidos) | **BAIXO** | Permission.ts |

---

## 8. Arquivos Relacionados

### Core do Sistema de Permissões

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/modules/user-management/permissions/domain/entities/Permission.ts` | ~270 | Entidade, enums, DEFAULT_ROLE_PERMISSIONS |
| `src/modules/user-management/permissions/application/services/PermissionService.ts` | ~900 | CRUD de permissões, cache |
| `src/modules/user-management/permissions/infrastructure/services/AtomicPermissionService.ts` | ~274 | Verificação atômica, cache, subscriptions |
| `firestore.rules` | ~777 | Regras de segurança |

### Hooks e Componentes

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/presentation/hooks/useAtomicPermissions.ts` | ~120 | Hook principal (recomendado) |
| `src/presentation/hooks/usePermissions.ts` | ~253 | Hook legado |
| `src/presentation/components/PermissionGuard.tsx` | ~171 | Guard declarativo |
| `src/presentation/components/PermissionButton.tsx` | ~94 | Botão com verificação |
| `src/presentation/components/ProtectedRoute.tsx` | ~230 | Guard de rota |

### Páginas Administrativas

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/presentation/pages/PermissionsManagementPage.tsx` | ~1200 | Interface de gestão |
| `src/presentation/components/CreateRoleModal.tsx` | ~150 | Modal de criação de role |

---

## 9. Próximos Passos Recomendados

### Fase 1: Correções Críticas (Urgente)
1. Corrigir bug do `[0]` nas Firestore Rules
2. Adicionar suporte a custom roles nas Rules
3. Unificar armazenamento de permissões (remover redundância)

### Fase 2: Consolidação
4. Depreciar `usePermissions` em favor de `useAtomicPermissions`
5. Unificar cache em um único serviço
6. Padronizar nomes de módulos (finance vs financial)

### Fase 3: Modernização
7. Migrar todas as Rules para usar `hasPermission()`
8. Implementar auditoria de mudanças de permissão
9. Adicionar testes automatizados para o sistema de permissões

---

## 10. Decisões de Arquitetura Necessárias

Antes da refatoração, precisamos decidir:

1. **Onde armazenar permissões customizadas?**
   - Embedded no documento do usuário (`customPermissions`)
   - Ou em collection separada (`/userPermissionOverrides`)

2. **Como lidar com custom roles nas Rules?**
   - Buscar do Firestore (impacto em performance)
   - Ou manter lista de roles permitidos atualizada

3. **Unificar ou manter dois hooks?**
   - Depreciar `usePermissions` completamente
   - Ou manter para retrocompatibilidade

4. **Renomear módulos inconsistentes?**
   - `Assistance` vs `Assistidos`
   - `Finance` vs `Financial`

---

*Documento gerado para análise e planejamento de refatoração.*
