# Sistema de Permissões Atômicas

## Visão Geral

O sistema de permissões atômicas foi implementado para garantir verificações de permissão consistentes, em tempo real e com alta performance em toda a aplicação. Este sistema substitui o antigo `usePermissions` por uma solução mais robusta com cache inteligente, validação server-side e atualizações em tempo real.

## Arquitetura

### Camadas do Sistema

1. **Client-Side (React)**
   - `useAtomicPermissions` hook - Interface principal para components React
   - `PermissionGuard` component - Proteção de UI baseada em permissões
   - `PermissionButton` - Botões com verificação de permissão integrada
   - Cache local com TTL de 5 minutos

2. **Service Layer**
   - `AtomicPermissionService` - Singleton service com cache e real-time subscriptions
   - Validação com Firebase Firestore
   - Gerenciamento de cache com invalidação automática

3. **Server-Side (Firebase)**
   - Firestore Security Rules com validação atômica de permissões
   - Funções helper para verificação de permissões customizadas
   - Validação de role-based permissions

## Componentes Principais

### 1. AtomicPermissionService

Singleton service que gerencia todas as operações de permissão:

```typescript
// Singleton instance
export const atomicPermissionService = AtomicPermissionService.getInstance();

// Principais métodos
await atomicPermissionService.hasPermission(userId, module, action);
await atomicPermissionService.getUserPermissions(userId);
atomicPermissionService.subscribeToUserPermissions(userId, callback);
atomicPermissionService.invalidateCache(userId);
```

**Características:**
- Cache de 5 minutos (TTL configurável)
- Subscriptions em tempo real via Firebase onSnapshot
- Batch operations para múltiplas verificações
- Fail-secure: nega acesso em caso de erro

### 2. useAtomicPermissions Hook

Hook React para uso em components:

```typescript
const {
  hasPermission,        // (module, action) => boolean - verificação síncrona
  hasAnyPermission,     // (checks[]) => boolean - verifica se tem alguma das permissões
  hasAllPermissions,    // (checks[]) => boolean - verifica se tem todas as permissões
  checkPermission,      // async (module, action) => Promise<boolean> - validação com Firebase
  isAdmin,              // boolean - helper para role admin
  isSecretary,          // boolean - helper para role secretary
  isLeader,             // boolean - helper para role leader
  isMember,             // boolean - helper para role member
  loading,              // boolean - estado de carregamento
  permissions,          // Map<Module, Set<Action>> - todas as permissões
  refreshPermissions    // () => Promise<void> - recarregar permissões
} = useAtomicPermissions();
```

**Exemplo de uso:**

```typescript
import { useAtomicPermissions } from '@/presentation/hooks/useAtomicPermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

function MemberManagementPage() {
  const { hasPermission, loading } = useAtomicPermissions();

  if (loading) return <LoadingSpinner />;

  const canCreate = hasPermission(SystemModule.Members, PermissionAction.CREATE);
  const canEdit = hasPermission(SystemModule.Members, PermissionAction.UPDATE);

  return (
    <div>
      {canCreate && <button>Adicionar Membro</button>}
      {canEdit && <button>Editar Membro</button>}
    </div>
  );
}
```

### 3. PermissionGuard Component

Componente wrapper para proteger UI baseado em permissões:

```typescript
// Verificação simples
<PermissionGuard
  module={SystemModule.MEMBERS}
  action={PermissionAction.CREATE}
  fallback={<AccessDenied />}
>
  <AddMemberButton />
</PermissionGuard>

// Múltiplas permissões (qualquer uma)
<PermissionGuard
  permissions={[
    { module: SystemModule.MEMBERS, action: PermissionAction.CREATE },
    { module: SystemModule.MEMBERS, action: PermissionAction.UPDATE }
  ]}
>
  <EditOrAddButton />
</PermissionGuard>

// Múltiplas permissões (todas obrigatórias)
<PermissionGuard
  requireAll
  permissions={[
    { module: SystemModule.MEMBERS, action: PermissionAction.VIEW },
    { module: SystemModule.FINANCE, action: PermissionAction.VIEW }
  ]}
>
  <AdminDashboard />
</PermissionGuard>
```

### 4. ProtectedRoute Component

Proteção de rotas com verificação atômica:

```typescript
<ProtectedRoute
  requireModule={SystemModule.MEMBERS}
  requireAction={PermissionAction.VIEW}
>
  <MembersPage />
</ProtectedRoute>
```

## Firestore Security Rules

### Estrutura de Validação

As regras Firestore foram atualizadas para validar permissões server-side:

```javascript
// Helper function - verifica permissão atômica
function hasPermission(module, action) {
  return isAuthenticated() &&
         getUserData().status == 'approved' &&
         hasModuleAction(getUserData().role, module, action, getUserData());
}

// Uso em collections
match /members/{memberId} {
  allow read: if hasPermission('members', 'view');
  allow create: if hasPermission('members', 'create');
  allow update: if hasPermission('members', 'update');
  allow delete: if hasPermission('members', 'delete');
}
```

### Lógica de Permissões

1. **Verificação de Status**: Usuário deve estar aprovado (`status == 'approved'`)
2. **Permissões de Role**: Permissões base definidas por role
3. **Custom Grants**: Permissões adicionais concedidas manualmente
4. **Custom Revokes**: Permissões revogadas manualmente (sobrescreve role)

**Ordem de precedência:**
```
Custom Grants > Role Permissions > Custom Revokes
```

## Módulos e Ações

### SystemModule Enum

```typescript
enum SystemModule {
  Dashboard = 'dashboard',
  Users = 'users',
  Members = 'members',
  Blog = 'blog',
  Events = 'events',
  Devotionals = 'devotionals',
  Transmissions = 'transmissions',
  Projects = 'projects',
  Forum = 'forum',
  Visitors = 'visitors',
  Calendar = 'calendar',
  Assistance = 'assistance',
  Notifications = 'notifications',
  Communication = 'communication',
  ONG = 'ong',
  Finance = 'finance',
  Donations = 'donations',
  Reports = 'reports',
  Assets = 'assets',
  Settings = 'settings',
  Permissions = 'permissions',
  Logs = 'logs'
}
```

### PermissionAction Enum

```typescript
enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  MANAGE = 'manage'
}
```

## Permissões Padrão por Role

### Admin
- **Todos os módulos**: todas as ações (view, create, update, delete, export, import, approve, manage)

### Secretary
- **Dashboard, Users, Members, Events, Blog, Devotionals, Projects, Visitors, Prayer-Requests, Forum, Notifications, Settings, Assistance, ONG**: view, create, update, delete
- **Finance**: view

### Leader
- **Dashboard, Events, Prayer-Requests, Members, Blog, Devotionals, Forum, Projects**: view, create, update

### Member
- **Dashboard, Events, Blog, Devotionals, Forum, Prayer-Requests**: view

### Professional
- **Dashboard, Assistance**: view, create, update

### Finance
- **Dashboard, Finance**: view, create, update, delete, export

## Cache e Performance

### Estratégia de Cache

1. **Local Cache (Client)**
   - TTL: 5 minutos
   - Invalidação automática em mudanças
   - Verificação síncrona (sem latência)

2. **Real-time Updates**
   - Firebase onSnapshot para mudanças em `/users/{userId}`
   - Invalidação de cache automática
   - Re-fetch de permissões

3. **Batch Operations**
   - Verificação de múltiplas permissões em uma única operação
   - Reduz chamadas ao Firebase

### Otimizações

```typescript
// ❌ Ruim - múltiplas verificações
const canView = await hasPermission(userId, 'members', 'view');
const canCreate = await hasPermission(userId, 'members', 'create');
const canUpdate = await hasPermission(userId, 'members', 'update');

// ✅ Bom - batch operation
const [canView, canCreate, canUpdate] = await hasPermissions(userId, [
  { module: 'members', action: 'view' },
  { module: 'members', action: 'create' },
  { module: 'members', action: 'update' }
]);

// ✅ Melhor - use o hook que já tem cache
const { hasPermission } = useAtomicPermissions();
const canView = hasPermission(SystemModule.Members, PermissionAction.VIEW);
```

## Migrando do Sistema Antigo

### Mudanças de Import

```typescript
// ❌ Antigo
import { usePermissions } from '@/hooks/usePermissions';

// ✅ Novo
import { useAtomicPermissions } from '@/hooks/useAtomicPermissions';
```

### Mudanças de API

```typescript
// ❌ Antigo
const { hasPermission, hasAnyManagePermission } = usePermissions();

// ✅ Novo
const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
} = useAtomicPermissions();

// Para hasAnyManagePermission, criar helper:
const hasAnyManagePermission = () => {
  const modules = [
    SystemModule.Users, SystemModule.Members, SystemModule.Events,
    SystemModule.Blog, SystemModule.Finance, SystemModule.Assistance
  ];
  return modules.some(module => hasPermission(module, PermissionAction.Manage));
};
```

## Segurança

### Fail-Secure Design

O sistema foi projetado para **negar acesso por padrão** em caso de erro:

```typescript
try {
  return await validatePermission();
} catch (error) {
  console.error('Permission check failed:', error);
  return false; // ❌ Nega acesso
}
```

### Validação em Múltiplas Camadas

1. **Client-Side** (UI/UX)
   - Esconde botões/features sem permissão
   - Rápido feedback visual
   - Não é seguro por si só

2. **Firebase Security Rules** (Server-Side)
   - Validação autoritativa
   - Não pode ser bypassada
   - Última linha de defesa

3. **Service Layer**
   - Validação antes de operações críticas
   - Logs de auditoria
   - Business logic validation

### Auditoria

Todas as verificações de permissão podem ser logadas:

```typescript
// AtomicPermissionService já loga erros automaticamente
console.error('Error checking permission:', error);

// Para auditoria adicional, use o AuditService
const auditService = new AuditService();
await auditService.logPermissionCheck(userId, module, action, granted);
```

## Troubleshooting

### Problema: Permissões não atualizam em tempo real

**Solução:**
```typescript
// Forçar refresh manual
const { refreshPermissions } = useAtomicPermissions();
await refreshPermissions();

// Ou invalidar cache
import { atomicPermissionService } from '@/services/AtomicPermissionService';
atomicPermissionService.invalidateCache(userId);
```

### Problema: "Missing or insufficient permissions" no Firestore

**Causa:** Firestore rules bloqueando acesso

**Solução:**
1. Verificar se usuário está aprovado (`status === 'approved'`)
2. Verificar role e permissões customizadas no Firestore
3. Testar regras no Firebase Console

### Problema: Performance lenta

**Solução:**
```typescript
// Use verificações síncronas (cache)
const canEdit = hasPermission(module, action); // ✅ Rápido

// Evite verificações assíncronas desnecessárias
const canEdit = await checkPermission(module, action); // ❌ Lento
```

## Exemplos Completos

### Página de Gerenciamento

```typescript
import React from 'react';
import { useAtomicPermissions } from '@/hooks/useAtomicPermissions';
import { PermissionGuard } from '@/components/PermissionGuard';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

export const MembersPage: React.FC = () => {
  const { hasPermission, loading } = useAtomicPermissions();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Gerenciamento de Membros</h1>

      {/* Botão protegido */}
      <PermissionGuard
        module={SystemModule.Members}
        action={PermissionAction.CREATE}
      >
        <button onClick={handleCreate}>Adicionar Membro</button>
      </PermissionGuard>

      {/* Lista com ações condicionais */}
      <MemberList>
        {members.map(member => (
          <MemberCard key={member.id}>
            <h3>{member.name}</h3>

            {hasPermission(SystemModule.Members, PermissionAction.UPDATE) && (
              <button onClick={() => handleEdit(member)}>Editar</button>
            )}

            {hasPermission(SystemModule.Members, PermissionAction.DELETE) && (
              <button onClick={() => handleDelete(member)}>Excluir</button>
            )}
          </MemberCard>
        ))}
      </MemberList>
    </div>
  );
};
```

### Rota Protegida

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

<Route
  path="/admin/members"
  element={
    <ProtectedRoute
      requireModule={SystemModule.Members}
      requireAction={PermissionAction.VIEW}
    >
      <MembersPage />
    </ProtectedRoute>
  }
/>
```

## Referências

- **AtomicPermissionService**: `src/modules/user-management/permissions/infrastructure/services/AtomicPermissionService.ts`
- **useAtomicPermissions**: `src/presentation/hooks/useAtomicPermissions.ts`
- **PermissionGuard**: `src/presentation/components/PermissionGuard.tsx`
- **Firestore Rules**: `firestore.rules`
- **Permission Entities**: `src/modules/user-management/permissions/domain/entities/Permission.ts`
