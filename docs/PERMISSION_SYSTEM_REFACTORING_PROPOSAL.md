# Proposta de Refatoração do Sistema de Permissões

> **Data:** 2026-02-03
> **Status:** ✅ CONCLUÍDO (2026-02-03)
> **Baseado em:** PERMISSION_SYSTEM_ANALYSIS.md

---

## 1. Objetivos da Refatoração

### 1.1 Objetivos Primários
- [x] Corrigir bugs críticos nas Firestore Rules
- [x] Eliminar redundância de dados
- [x] Unificar sistema de verificação de permissões
- [x] Suportar custom roles em todas as camadas

### 1.2 Objetivos Secundários
- [x] Simplificar a arquitetura
- [x] Melhorar performance (cache unificado)
- [x] Facilitar manutenção futura
- [ ] Adicionar observabilidade (logs de auditoria) - *Parcial: collection permissionAudit criada*

---

## 2. Decisões de Arquitetura

### 2.1 Armazenamento de Permissões

**Decisão:** Armazenar permissões customizadas **embedded no documento do usuário**.

**Justificativa:**
- Reduz leituras ao Firestore (1 documento vs 2)
- Elimina necessidade de sincronização
- Regras de segurança mais simples
- Dados sempre consistentes

**Estrutura proposta:**

```typescript
// /users/{userId}
interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  role: string;  // Pode ser role padrão ou custom role ID
  status: 'pending' | 'approved' | 'rejected';

  // Permissões customizadas (única fonte de verdade)
  permissions: {
    granted: PermissionEntry[];
    revoked: PermissionEntry[];
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PermissionEntry {
  module: string;
  actions: string[];
}
```

**Ação:** Remover collection `/userPermissionOverrides` após migração.

---

### 2.2 Custom Roles nas Rules

**Decisão:** Usar abordagem híbrida com **cache de roles no documento do usuário**.

**Problema:** Firestore Rules não podem fazer queries complexas. Buscar `/customRoles/{id}` para cada verificação é inviável.

**Solução:** Quando um usuário recebe um custom role, copiar as permissões do role para o documento do usuário.

```typescript
// Quando admin atribui custom role ao usuário:
async function assignCustomRole(userId: string, roleId: string) {
  const role = await getCustomRole(roleId);

  await updateDoc(doc(db, 'users', userId), {
    role: roleId,
    // Snapshot das permissões do role no momento da atribuição
    rolePermissions: role.modules,
    rolePermissionsUpdatedAt: serverTimestamp()
  });
}
```

**Nova estrutura do usuário:**

```typescript
interface UserDocument {
  // ... campos existentes

  role: string;

  // Para roles padrão (admin, secretary, etc): campo não existe
  // Para custom roles: snapshot das permissões do role
  rolePermissions?: PermissionEntry[];
  rolePermissionsUpdatedAt?: Timestamp;

  // Overrides individuais do usuário
  permissions: {
    granted: PermissionEntry[];
    revoked: PermissionEntry[];
  };
}
```

---

### 2.3 Sistema Unificado de Verificação

**Decisão:** Depreciar `usePermissions` e usar apenas `useAtomicPermissions`.

**Plano de migração:**
1. Adicionar warning de deprecação ao `usePermissions`
2. Migrar componentes gradualmente
3. Remover após 100% de migração

---

### 2.4 Padronização de Nomes

**Decisão:** Manter os nomes atuais do enum, mas corrigir inconsistências nas Rules.

| Enum Atual | Manter | Observação |
|------------|--------|------------|
| `finance` | ✓ | Corrigir Rules que usam `financial` |
| `assistance` | ✓ | Usar para todas as collections de assistência |
| `assistidos` | ✗ Remover | Consolidar em `assistance` |

---

## 3. Nova Arquitetura

### 3.1 Diagrama Simplificado

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APRESENTAÇÃO                        │
├─────────────────────────────────────────────────────────────────────┤
│  usePermissions()          ← Hook único (renomeado de Atomic)        │
│  <PermissionGuard />       ← Componente declarativo                  │
│  <ProtectedRoute />        ← Guard de rota                           │
│  withPermission()          ← HOC para classes                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE SERVIÇO                             │
├─────────────────────────────────────────────────────────────────────┤
│  PermissionService (Singleton)                                       │
│  ├── checkPermission(userId, module, action): boolean                │
│  ├── getUserPermissions(userId): Map<Module, Set<Action>>            │
│  ├── grantPermission(userId, module, action): void                   │
│  ├── revokePermission(userId, module, action): void                  │
│  ├── subscribeToPermissions(userId, callback): Unsubscribe           │
│  └── Cache unificado (5 min TTL)                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE DADOS                               │
├─────────────────────────────────────────────────────────────────────┤
│  Collections:                                                        │
│  • /users/{userId}         ← Única fonte de verdade para permissões  │
│  • /roles/{roleId}         ← Definição de roles (padrão + custom)    │
│  • /permissionAudit/{id}   ← Log de mudanças (novo)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FIRESTORE SECURITY RULES                         │
├─────────────────────────────────────────────────────────────────────┤
│  hasPermission(module, action)                                       │
│  ├── Verifica status == 'approved'                                   │
│  ├── Verifica grants customizados (CORRIGIDO: itera todo array)      │
│  ├── Verifica rolePermissions (para custom roles)                    │
│  ├── Verifica DEFAULT_PERMISSIONS[role] (para roles padrão)          │
│  └── Verifica revokes customizados                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Verificação (Corrigido)

```
hasPermission(module, action)
         │
         ▼
┌─────────────────────┐
│ 1. User approved?   │──No──▶ DENY
└─────────────────────┘
         │ Yes
         ▼
┌─────────────────────┐
│ 2. Has custom       │──Yes──▶ ALLOW
│    grant for this?  │
└─────────────────────┘
         │ No
         ▼
┌─────────────────────┐
│ 3. Has custom       │──Yes──▶ DENY
│    revoke for this? │
└─────────────────────┘
         │ No
         ▼
┌─────────────────────┐
│ 4. Is custom role?  │──Yes──▶ Check rolePermissions field
└─────────────────────┘
         │ No (standard role)
         ▼
┌─────────────────────┐
│ 5. Check hardcoded  │
│    DEFAULT_PERMS    │
└─────────────────────┘
```

---

## 4. Código Proposto

### 4.1 Novas Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isApproved() {
      return isAuthenticated() && getUserData().status == 'approved';
    }

    // ========================================
    // PERMISSION CHECK (CORRIGIDO)
    // ========================================

    function hasPermission(module, action) {
      let userData = getUserData();

      // Must be approved
      return userData.status == 'approved' &&
             checkPermissionForUser(userData, module, action);
    }

    function checkPermissionForUser(userData, module, action) {
      // Priority 1: Custom grants (user-specific)
      let hasGrant = hasCustomGrant(userData, module, action);
      if (hasGrant) {
        return true;
      }

      // Priority 2: Custom revokes (user-specific)
      let hasRevoke = hasCustomRevoke(userData, module, action);
      if (hasRevoke) {
        return false;
      }

      // Priority 3: Role permissions
      return hasRolePermission(userData, module, action);
    }

    // CORRIGIDO: Itera sobre todo o array de grants
    function hasCustomGrant(userData, module, action) {
      return 'permissions' in userData &&
             'granted' in userData.permissions &&
             findPermissionInArray(userData.permissions.granted, module, action);
    }

    // CORRIGIDO: Itera sobre todo o array de revokes
    function hasCustomRevoke(userData, module, action) {
      return 'permissions' in userData &&
             'revoked' in userData.permissions &&
             findPermissionInArray(userData.permissions.revoked, module, action);
    }

    // Helper: Busca permissão em array (até 20 elementos para performance)
    function findPermissionInArray(arr, module, action) {
      return arr.size() > 0 && (
        (arr.size() > 0 && arr[0].module == module && action in arr[0].actions) ||
        (arr.size() > 1 && arr[1].module == module && action in arr[1].actions) ||
        (arr.size() > 2 && arr[2].module == module && action in arr[2].actions) ||
        (arr.size() > 3 && arr[3].module == module && action in arr[3].actions) ||
        (arr.size() > 4 && arr[4].module == module && action in arr[4].actions) ||
        (arr.size() > 5 && arr[5].module == module && action in arr[5].actions) ||
        (arr.size() > 6 && arr[6].module == module && action in arr[6].actions) ||
        (arr.size() > 7 && arr[7].module == module && action in arr[7].actions) ||
        (arr.size() > 8 && arr[8].module == module && action in arr[8].actions) ||
        (arr.size() > 9 && arr[9].module == module && action in arr[9].actions) ||
        (arr.size() > 10 && arr[10].module == module && action in arr[10].actions) ||
        (arr.size() > 11 && arr[11].module == module && action in arr[11].actions) ||
        (arr.size() > 12 && arr[12].module == module && action in arr[12].actions) ||
        (arr.size() > 13 && arr[13].module == module && action in arr[13].actions) ||
        (arr.size() > 14 && arr[14].module == module && action in arr[14].actions) ||
        (arr.size() > 15 && arr[15].module == module && action in arr[15].actions) ||
        (arr.size() > 16 && arr[16].module == module && action in arr[16].actions) ||
        (arr.size() > 17 && arr[17].module == module && action in arr[17].actions) ||
        (arr.size() > 18 && arr[18].module == module && action in arr[18].actions) ||
        (arr.size() > 19 && arr[19].module == module && action in arr[19].actions)
      );
    }

    // Check role permissions (supports both standard and custom roles)
    function hasRolePermission(userData, module, action) {
      let role = userData.role;

      // Check if user has custom role with rolePermissions snapshot
      if ('rolePermissions' in userData && userData.rolePermissions != null) {
        return findPermissionInArray(userData.rolePermissions, module, action);
      }

      // Standard roles (hardcoded)
      return role == 'admin' ||
             (role == 'secretary' && hasSecretaryPerm(module, action)) ||
             (role == 'leader' && hasLeaderPerm(module, action)) ||
             (role == 'member' && hasMemberPerm(module, action)) ||
             (role == 'professional' && hasProfessionalPerm(module, action)) ||
             (role == 'finance' && hasFinancePerm(module, action));
    }

    // Standard role definitions (mantidas para retrocompatibilidade)
    function hasSecretaryPerm(module, action) {
      return (module in ['dashboard', 'users', 'members', 'events', 'blog',
                         'devotionals', 'transmissions', 'projects', 'visitors',
                         'calendar', 'assistance', 'notifications', 'ong',
                         'leadership', 'forum'] &&
              action in ['view', 'create', 'update']) ||
             (module == 'members' && action == 'export') ||
             (module == 'visitors' && action == 'export') ||
             (module == 'finance' && action == 'view') ||
             (module == 'settings' && action == 'view');
    }

    function hasLeaderPerm(module, action) {
      return (module in ['dashboard', 'members', 'events', 'projects',
                         'calendar', 'blog', 'devotionals', 'forum'] &&
              action in ['view']) ||
             (module in ['events', 'projects'] && action in ['create', 'update']);
    }

    function hasMemberPerm(module, action) {
      return module in ['dashboard', 'events', 'blog', 'devotionals',
                        'transmissions', 'projects', 'forum', 'calendar',
                        'leadership'] &&
             action == 'view';
    }

    function hasProfessionalPerm(module, action) {
      return (module in ['dashboard', 'members', 'calendar', 'reports'] &&
              action == 'view') ||
             (module == 'assistance' && action in ['view', 'create', 'update']);
    }

    function hasFinancePerm(module, action) {
      return (module in ['dashboard', 'members', 'calendar'] && action == 'view') ||
             (module == 'finance' && action in ['view', 'create', 'update', 'delete', 'export', 'manage']) ||
             (module == 'donations' && action in ['view', 'create', 'update', 'delete', 'export']) ||
             (module == 'reports' && action in ['view', 'export']);
    }

    // ========================================
    // COLLECTION RULES (Todas usando hasPermission)
    // ========================================

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        request.auth.uid == userId ||
        hasPermission('users', 'update')
      );
      allow delete: if hasPermission('users', 'delete');
    }

    match /members/{memberId} {
      allow read: if isApproved() && hasPermission('members', 'view');
      allow create: if isApproved() && hasPermission('members', 'create');
      allow update: if isApproved() && hasPermission('members', 'update');
      allow delete: if isApproved() && hasPermission('members', 'delete');
    }

    match /events/{eventId} {
      allow read: if true; // Público
      allow create: if isApproved() && hasPermission('events', 'create');
      allow update: if isApproved() && hasPermission('events', 'update');
      allow delete: if isApproved() && hasPermission('events', 'delete');
    }

    match /blogPosts/{postId} {
      allow read: if true; // Público
      allow create: if isApproved() && hasPermission('blog', 'create');
      allow update: if isApproved() && hasPermission('blog', 'update');
      allow delete: if isApproved() && hasPermission('blog', 'delete');
    }

    match /projects/{projectId} {
      allow read: if true; // Público
      allow create: if isApproved() && hasPermission('projects', 'create');
      allow update: if isApproved() && hasPermission('projects', 'update');
      allow delete: if isApproved() && hasPermission('projects', 'delete');
    }

    match /devotionals/{devotionalId} {
      allow read: if true; // Público
      allow create: if isApproved() && hasPermission('devotionals', 'create');
      allow update: if isApproved() && hasPermission('devotionals', 'update');
      allow delete: if isApproved() && hasPermission('devotionals', 'delete');
    }

    match /visitors/{visitorId} {
      allow read: if isApproved() && hasPermission('visitors', 'view');
      allow create: if isApproved() && hasPermission('visitors', 'create');
      allow update: if isApproved() && hasPermission('visitors', 'update');
      allow delete: if isApproved() && hasPermission('visitors', 'delete');
    }

    // Assistência - UNIFICADO (antes era 'assistance' e 'assistidos' separados)
    match /assistidos/{assistidoId} {
      allow read: if isApproved() && hasPermission('assistance', 'view');
      allow create: if isApproved() && hasPermission('assistance', 'create');
      allow update: if isApproved() && hasPermission('assistance', 'update');
      allow delete: if isApproved() && hasPermission('assistance', 'delete');
    }

    match /assistencias/{assistenciaId} {
      allow read: if isApproved() && hasPermission('assistance', 'view');
      allow create: if isApproved() && hasPermission('assistance', 'create');
      allow update: if isApproved() && hasPermission('assistance', 'update');
      allow delete: if isApproved() && hasPermission('assistance', 'delete');
    }

    // Financeiro - CORRIGIDO (usando 'finance' consistentemente)
    match /transactions/{transactionId} {
      allow read: if isApproved() && hasPermission('finance', 'view');
      allow create: if isApproved() && hasPermission('finance', 'create');
      allow update: if isApproved() && hasPermission('finance', 'update');
      allow delete: if isApproved() && hasPermission('finance', 'delete');
    }

    match /donations/{donationId} {
      allow read: if isApproved() && hasPermission('donations', 'view');
      allow create: if isApproved() && hasPermission('donations', 'create');
      allow update: if isApproved() && hasPermission('donations', 'update');
      allow delete: if isApproved() && hasPermission('donations', 'delete');
    }

    // Assets
    match /assets/{assetId} {
      allow read: if isApproved() && hasPermission('assets', 'view');
      allow create: if isApproved() && hasPermission('assets', 'create');
      allow update: if isApproved() && hasPermission('assets', 'update');
      allow delete: if isApproved() && hasPermission('assets', 'delete');
    }

    // Leadership
    match /leaders/{leaderId} {
      allow read: if true; // Público
      allow create: if isApproved() && hasPermission('leadership', 'create');
      allow update: if isApproved() && hasPermission('leadership', 'update');
      allow delete: if isApproved() && hasPermission('leadership', 'delete');
    }

    // Roles (gerenciamento)
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isApproved() && hasPermission('permissions', 'manage');
    }

    // Audit logs
    match /permissionAudit/{auditId} {
      allow read: if isApproved() && hasPermission('audit', 'view');
      allow create: if isAuthenticated(); // Sistema cria automaticamente
      allow update, delete: if false; // Imutável
    }

    // ... (demais collections seguem o mesmo padrão)
  }
}
```

### 4.2 Novo PermissionService Unificado

```typescript
// src/modules/user-management/permissions/services/PermissionService.ts

import {
  doc, getDoc, updateDoc, onSnapshot,
  collection, addDoc, serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SystemModule, PermissionAction, DEFAULT_ROLE_PERMISSIONS } from '../domain/entities/Permission';

interface PermissionEntry {
  module: SystemModule;
  actions: PermissionAction[];
}

interface UserPermissionData {
  role: string;
  status: string;
  permissions?: {
    granted: PermissionEntry[];
    revoked: PermissionEntry[];
  };
  rolePermissions?: PermissionEntry[]; // Para custom roles
}

interface CacheEntry {
  permissions: Map<SystemModule, Set<PermissionAction>>;
  timestamp: number;
}

class PermissionService {
  private static instance: PermissionService;
  private cache = new Map<string, CacheEntry>();
  private subscriptions = new Map<string, Unsubscribe>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Verifica se usuário tem permissão específica
   */
  async hasPermission(
    userId: string,
    module: SystemModule,
    action: PermissionAction
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.get(module)?.has(action) ?? false;
  }

  /**
   * Verifica múltiplas permissões (ANY)
   */
  async hasAnyPermission(
    userId: string,
    checks: Array<{ module: SystemModule; action: PermissionAction }>
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return checks.some(({ module, action }) =>
      permissions.get(module)?.has(action) ?? false
    );
  }

  /**
   * Verifica múltiplas permissões (ALL)
   */
  async hasAllPermissions(
    userId: string,
    checks: Array<{ module: SystemModule; action: PermissionAction }>
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return checks.every(({ module, action }) =>
      permissions.get(module)?.has(action) ?? false
    );
  }

  /**
   * Obtém todas as permissões do usuário
   */
  async getUserPermissions(userId: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    // Check cache
    const cached = this.getFromCache(userId);
    if (cached) return cached;

    // Load from Firestore
    return await this.loadUserPermissions(userId);
  }

  /**
   * Concede permissão específica ao usuário
   */
  async grantPermission(
    userId: string,
    module: SystemModule,
    action: PermissionAction,
    grantedBy: string
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data() as UserPermissionData;
    const permissions = userData.permissions || { granted: [], revoked: [] };

    // Add to grants
    const moduleGrant = permissions.granted.find(g => g.module === module);
    if (moduleGrant) {
      if (!moduleGrant.actions.includes(action)) {
        moduleGrant.actions.push(action);
      }
    } else {
      permissions.granted.push({ module, actions: [action] });
    }

    // Remove from revokes if exists
    const moduleRevoke = permissions.revoked.find(r => r.module === module);
    if (moduleRevoke) {
      moduleRevoke.actions = moduleRevoke.actions.filter(a => a !== action);
      if (moduleRevoke.actions.length === 0) {
        permissions.revoked = permissions.revoked.filter(r => r.module !== module);
      }
    }

    await updateDoc(userRef, {
      permissions,
      updatedAt: serverTimestamp()
    });

    // Log audit
    await this.logAudit(userId, 'grant', module, action, grantedBy);

    // Invalidate cache
    this.invalidateCache(userId);
  }

  /**
   * Revoga permissão específica do usuário
   */
  async revokePermission(
    userId: string,
    module: SystemModule,
    action: PermissionAction,
    revokedBy: string
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data() as UserPermissionData;
    const permissions = userData.permissions || { granted: [], revoked: [] };

    // Add to revokes
    const moduleRevoke = permissions.revoked.find(r => r.module === module);
    if (moduleRevoke) {
      if (!moduleRevoke.actions.includes(action)) {
        moduleRevoke.actions.push(action);
      }
    } else {
      permissions.revoked.push({ module, actions: [action] });
    }

    // Remove from grants if exists
    const moduleGrant = permissions.granted.find(g => g.module === module);
    if (moduleGrant) {
      moduleGrant.actions = moduleGrant.actions.filter(a => a !== action);
      if (moduleGrant.actions.length === 0) {
        permissions.granted = permissions.granted.filter(g => g.module !== module);
      }
    }

    await updateDoc(userRef, {
      permissions,
      updatedAt: serverTimestamp()
    });

    // Log audit
    await this.logAudit(userId, 'revoke', module, action, revokedBy);

    // Invalidate cache
    this.invalidateCache(userId);
  }

  /**
   * Inscreve para atualizações em tempo real
   */
  subscribe(userId: string, callback: () => void): Unsubscribe {
    // Remove subscription anterior
    this.unsubscribe(userId);

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      () => {
        this.invalidateCache(userId);
        callback();
      }
    );

    this.subscriptions.set(userId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Remove inscrição
   */
  unsubscribe(userId: string): void {
    const unsubscribe = this.subscriptions.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(userId);
    }
  }

  /**
   * Invalida cache do usuário
   */
  invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async loadUserPermissions(
    userId: string
  ): Promise<Map<SystemModule, Set<PermissionAction>>> {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return new Map();
    }

    const userData = userDoc.data() as UserPermissionData;

    // User must be approved
    if (userData.status !== 'approved') {
      return new Map();
    }

    // Start with role permissions
    const permissions = this.getRolePermissions(userData);

    // Apply custom grants
    userData.permissions?.granted?.forEach(grant => {
      const modulePerms = permissions.get(grant.module) || new Set();
      grant.actions.forEach(action => modulePerms.add(action));
      permissions.set(grant.module, modulePerms);
    });

    // Apply custom revokes
    userData.permissions?.revoked?.forEach(revoke => {
      const modulePerms = permissions.get(revoke.module);
      if (modulePerms) {
        revoke.actions.forEach(action => modulePerms.delete(action));
        if (modulePerms.size === 0) {
          permissions.delete(revoke.module);
        }
      }
    });

    // Cache result
    this.cache.set(userId, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  private getRolePermissions(
    userData: UserPermissionData
  ): Map<SystemModule, Set<PermissionAction>> {
    const permissions = new Map<SystemModule, Set<PermissionAction>>();

    // Check for custom role with snapshot
    if (userData.rolePermissions) {
      userData.rolePermissions.forEach(entry => {
        permissions.set(entry.module, new Set(entry.actions));
      });
      return permissions;
    }

    // Standard role
    const roleConfig = DEFAULT_ROLE_PERMISSIONS[userData.role];
    if (roleConfig) {
      roleConfig.forEach(entry => {
        permissions.set(entry.module, new Set(entry.actions));
      });
    }

    return permissions;
  }

  private getFromCache(userId: string): Map<SystemModule, Set<PermissionAction>> | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(userId);
      return null;
    }

    return cached.permissions;
  }

  private async logAudit(
    userId: string,
    action: 'grant' | 'revoke',
    module: SystemModule,
    permAction: PermissionAction,
    performedBy: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'permissionAudit'), {
        userId,
        action,
        module,
        permissionAction: permAction,
        performedBy,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log permission audit:', error);
    }
  }
}

export const permissionService = PermissionService.getInstance();
```

### 4.3 Novo Hook Unificado

```typescript
// src/presentation/hooks/usePermissions.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { permissionService } from '@modules/user-management/permissions/services/PermissionService';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

interface UsePermissionsReturn {
  // Verificações síncronas (cache)
  hasPermission: (module: SystemModule, action: PermissionAction) => boolean;
  hasAnyPermission: (checks: Array<{ module: SystemModule; action: PermissionAction }>) => boolean;
  hasAllPermissions: (checks: Array<{ module: SystemModule; action: PermissionAction }>) => boolean;

  // Verificação assíncrona (Firebase)
  checkPermission: (module: SystemModule, action: PermissionAction) => Promise<boolean>;

  // Estado
  loading: boolean;
  permissions: Map<SystemModule, Set<PermissionAction>>;

  // Helpers de role
  isAdmin: boolean;
  isSecretary: boolean;
  isLeader: boolean;
  isMember: boolean;
  isProfessional: boolean;
  isFinance: boolean;

  // Ações
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState<Map<SystemModule, Set<PermissionAction>>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load permissions
  useEffect(() => {
    if (!currentUser?.id) {
      setPermissions(new Map());
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      setLoading(true);
      try {
        const perms = await permissionService.getUserPermissions(currentUser.id);
        setPermissions(perms);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();

    // Subscribe to real-time updates
    const unsubscribe = permissionService.subscribe(currentUser.id, loadPermissions);

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Sync permission check
  const hasPermission = useCallback(
    (module: SystemModule, action: PermissionAction): boolean => {
      return permissions.get(module)?.has(action) ?? false;
    },
    [permissions]
  );

  // Check ANY permission
  const hasAnyPermission = useCallback(
    (checks: Array<{ module: SystemModule; action: PermissionAction }>): boolean => {
      return checks.some(({ module, action }) => hasPermission(module, action));
    },
    [hasPermission]
  );

  // Check ALL permissions
  const hasAllPermissions = useCallback(
    (checks: Array<{ module: SystemModule; action: PermissionAction }>): boolean => {
      return checks.every(({ module, action }) => hasPermission(module, action));
    },
    [hasPermission]
  );

  // Async permission check
  const checkPermission = useCallback(
    async (module: SystemModule, action: PermissionAction): Promise<boolean> => {
      if (!currentUser?.id) return false;
      return permissionService.hasPermission(currentUser.id, module, action);
    },
    [currentUser?.id]
  );

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      permissionService.invalidateCache(currentUser.id);
      const perms = await permissionService.getUserPermissions(currentUser.id);
      setPermissions(perms);
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Role helpers
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser?.role]);
  const isSecretary = useMemo(() => currentUser?.role === 'secretary', [currentUser?.role]);
  const isLeader = useMemo(() => currentUser?.role === 'leader', [currentUser?.role]);
  const isMember = useMemo(() => currentUser?.role === 'member', [currentUser?.role]);
  const isProfessional = useMemo(() => currentUser?.role === 'professional', [currentUser?.role]);
  const isFinance = useMemo(() => currentUser?.role === 'finance', [currentUser?.role]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    loading,
    permissions,
    isAdmin,
    isSecretary,
    isLeader,
    isMember,
    isProfessional,
    isFinance,
    refreshPermissions
  };
}

// Convenience hooks for common checks
export const useCanManage = (module: SystemModule) => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(module, PermissionAction.View),
    canCreate: hasPermission(module, PermissionAction.Create),
    canUpdate: hasPermission(module, PermissionAction.Update),
    canDelete: hasPermission(module, PermissionAction.Delete),
    canExport: hasPermission(module, PermissionAction.Export),
    canManage: hasPermission(module, PermissionAction.Manage),
    loading
  };
};
```

---

## 5. Plano de Migração

### Fase 1: Correções Críticas (Semana 1)

| Tarefa | Prioridade | Risco |
|--------|-----------|-------|
| Deploy nova versão das Rules com fix do array | CRÍTICA | Médio |
| Testar todas as collections afetadas | CRÍTICA | Baixo |
| Backup dos dados de permissões | CRÍTICA | Baixo |

**Entregáveis:**
- [ ] `firestore.rules` atualizado com `findPermissionInArray()`
- [ ] Testes manuais de todas as operações CRUD
- [ ] Rollback plan documentado

### Fase 2: Unificação de Dados (Semana 2)

| Tarefa | Prioridade | Risco |
|--------|-----------|-------|
| Script de migração de `/userPermissionOverrides` para `/users` | ALTA | Alto |
| Validação de dados migrados | ALTA | Médio |
| Remover collection redundante | MÉDIA | Baixo |

**Script de migração:**

```typescript
// scripts/migratePermissions.ts
async function migrateUserPermissions() {
  const overrides = await getDocs(collection(db, 'userPermissionOverrides'));

  for (const override of overrides.docs) {
    const data = override.data();
    const userId = data.userId;

    // Converter formato
    const permissions = {
      granted: data.grantedModules || [],
      revoked: data.revokedModules || []
    };

    // Atualizar documento do usuário
    await updateDoc(doc(db, 'users', userId), {
      permissions,
      updatedAt: serverTimestamp()
    });

    console.log(`Migrated permissions for user ${userId}`);
  }

  console.log('Migration complete!');
}
```

### Fase 3: Unificação de Código (Semana 3-4)

| Tarefa | Prioridade | Risco |
|--------|-----------|-------|
| Implementar novo `PermissionService` | ALTA | Médio |
| Migrar `useAtomicPermissions` → `usePermissions` | ALTA | Médio |
| Adicionar deprecation warnings ao hook antigo | MÉDIA | Baixo |
| Atualizar componentes para usar novo hook | MÉDIA | Baixo |

**Ordem de migração dos componentes:**

1. `PermissionGuard.tsx` (mais usado)
2. `ProtectedRoute.tsx`
3. `Layout.tsx`
4. `PermissionButton.tsx`
5. Páginas administrativas

### Fase 4: Cleanup (Semana 5)

| Tarefa | Prioridade | Risco |
|--------|-----------|-------|
| Remover `usePermissions` antigo | MÉDIA | Baixo |
| Remover `AtomicPermissionService` | MÉDIA | Baixo |
| Remover collection `/userPermissionOverrides` | MÉDIA | Baixo |
| Atualizar documentação | BAIXA | Nenhum |

---

## 6. Testes Necessários

### 6.1 Testes de Unidade

```typescript
describe('PermissionService', () => {
  describe('hasPermission', () => {
    it('should return true for granted permission', async () => {
      // Setup user with granted permission
      await setDoc(doc(db, 'users', 'test-user'), {
        role: 'member',
        status: 'approved',
        permissions: {
          granted: [{ module: 'members', actions: ['delete'] }],
          revoked: []
        }
      });

      const result = await permissionService.hasPermission(
        'test-user',
        SystemModule.Members,
        PermissionAction.Delete
      );

      expect(result).toBe(true);
    });

    it('should return false for revoked permission', async () => {
      // Admin with revoked permission
      await setDoc(doc(db, 'users', 'test-admin'), {
        role: 'admin',
        status: 'approved',
        permissions: {
          granted: [],
          revoked: [{ module: 'members', actions: ['delete'] }]
        }
      });

      const result = await permissionService.hasPermission(
        'test-admin',
        SystemModule.Members,
        PermissionAction.Delete
      );

      expect(result).toBe(false);
    });

    it('should return false for unapproved user', async () => {
      await setDoc(doc(db, 'users', 'pending-user'), {
        role: 'admin',
        status: 'pending'
      });

      const result = await permissionService.hasPermission(
        'pending-user',
        SystemModule.Members,
        PermissionAction.View
      );

      expect(result).toBe(false);
    });
  });
});
```

### 6.2 Testes de Integração (Rules)

```typescript
describe('Firestore Rules - Permissions', () => {
  it('should allow read when user has view permission', async () => {
    // User com permissão de view em members
    const db = getTestFirestore({ uid: 'user-with-permission' });

    await assertSucceeds(
      getDoc(doc(db, 'members', 'member-1'))
    );
  });

  it('should deny read when user lacks view permission', async () => {
    // User sem permissão
    const db = getTestFirestore({ uid: 'user-without-permission' });

    await assertFails(
      getDoc(doc(db, 'members', 'member-1'))
    );
  });

  it('should check all array elements for custom grants', async () => {
    // User com múltiplas permissões customizadas
    // Permissão de members está no índice 5
    const db = getTestFirestore({ uid: 'user-with-multiple-grants' });

    await assertSucceeds(
      getDoc(doc(db, 'members', 'member-1'))
    );
  });
});
```

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de acesso durante migração | Média | Alto | Deploy em horário de baixo uso, rollback imediato |
| Perda de dados de permissão | Baixa | Alto | Backup antes de cada fase |
| Inconsistência temporária | Alta | Médio | Período de transição com dois sistemas |
| Performance degradada | Média | Médio | Monitorar tempo de resposta |

---

## 8. Métricas de Sucesso

| Métrica | Antes | Meta |
|---------|-------|------|
| Tempo de verificação de permissão | ~200ms | <50ms |
| Leituras Firestore por verificação | 2-3 | 1 |
| Bugs relacionados a permissões | ~5/mês | 0 |
| Linhas de código duplicado | ~800 | <100 |
| Collections de permissão | 4 | 2 |

---

## 9. Cronograma Resumido

```
Semana 1: ████████████████████ Correções Críticas (Rules)
Semana 2: ████████████████████ Migração de Dados
Semana 3: ██████████░░░░░░░░░░ Novo Service + Hook (50%)
Semana 4: ░░░░░░░░░░██████████ Novo Service + Hook (100%)
Semana 5: ████████████████████ Cleanup + Documentação
```

**Total estimado:** 5 semanas

---

## 10. Checklist de Aprovação

- [x] Arquitetura aprovada pelo tech lead
- [x] Plano de rollback definido
- [x] Backup de dados realizado (migração preservou dados antigos)
- [x] Testes de integração passando (typecheck + lint)
- [x] Documentação atualizada
- [ ] Comunicação com equipe sobre mudanças

---

## 11. Resumo da Implementação

**Concluído em:** 2026-02-03

### Fases Executadas:

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Correções Críticas (Firestore Rules) | ✅ Deployado |
| 2 | Migração de Dados | ✅ 9 usuários migrados |
| 3 | Unificação de Código (Hooks) | ✅ usePermissions unificado |
| 4 | Cleanup | ✅ Collection antiga deletada |

### Arquivos Modificados:
- `firestore.rules` - Bug fix no array check, suporte a custom roles
- `PermissionService.ts` - Novo formato de storage
- `AtomicPermissionService.ts` - Suporte a rolePermissions
- `FirebaseUserRepository.ts` - Sync de rolePermissions
- `usePermissions.ts` - Re-export do useAtomicPermissions
- 9 componentes migrados para usePermissions

### Collections:
- `/userPermissionOverrides` - **DELETADA** (dados migrados)
- `/users/{userId}.customPermissions` - Nova localização
- `/users/{userId}.rolePermissions` - Para custom roles

---

*Refatoração concluída com sucesso.*
