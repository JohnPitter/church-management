# Permissoes - Documentacao Completa

Documentacao do sistema de controle de acesso baseado em roles (RBAC) do sistema de gerenciamento da igreja.

---

## Indice

1. [Visao Geral](#visao-geral)
2. [Roles](#roles)
3. [Modulos do Sistema](#modulos-do-sistema)
4. [Acoes de Permissao](#acoes-de-permissao)
5. [Matriz de Permissoes](#matriz-de-permissoes)
6. [Sistema de Override](#sistema-de-override)
7. [Fluxo de Verificacao](#fluxo-de-verificacao)
8. [Uso no Codigo](#uso-no-codigo)
9. [Status do Usuario](#status-do-usuario)

---

## Visao Geral

O sistema implementa **Role-Based Access Control (RBAC)** com suporte a overrides individuais por usuario. Cada usuario tem uma role padrao que define suas permissoes base, e opcionalmente pode ter permissoes extras concedidas ou revogadas individualmente.

**Arquivo principal:** `src/modules/user-management/permissions/domain/entities/Permission.ts`

**Componentes do sistema:**
- `SystemModule` - Enum com os 26 modulos do sistema
- `PermissionAction` - Enum com as 5 acoes possiveis
- `PermissionManager` - Classe estatica para verificacao de permissoes
- `DEFAULT_ROLE_PERMISSIONS` - Mapa de permissoes padrao por role
- `UserPermissionOverride` - Interface para overrides por usuario

---

## Roles

O sistema possui **6 roles** com diferentes niveis de acesso.

### 1. Admin (`admin`)

Acesso total ao sistema. Possui todas as 5 acoes em todos os 26 modulos, incluindo a acao `Manage` (Gerenciar).

- **Modulos:** 26 (todos)
- **Uso tipico:** Administrador do sistema, pastor principal
- **Privilegios exclusivos:** Gerenciar configuracoes, permissoes, backups, logs, auditoria, criar/deletar usuarios

### 2. Secretario (`secretary`)

Gerenciamento de conteudo e membros. Acesso a 15 modulos com acoes de visualizacao, criacao e edicao (sem exclusao na maioria).

- **Modulos:** 15
- **Uso tipico:** Secretaria da igreja, auxiliar administrativo
- **Destaque:** Pode criar usuarios via Cloud Function, gerenciar calendario (`Manage`), visualizar configuracoes e relatorios

### 3. Profissional (`professional`)

Acesso focado em assistencia social e consultas. Modulos limitados a assistencia, membros (somente visualizar), calendario e relatorios.

- **Modulos:** 5
- **Uso tipico:** Psicologo, assistente social, profissional de saude
- **Destaque:** Pode criar e editar registros de assistencia, visualizar membros para referencia

### 4. Lider (`leader`)

Acesso a eventos e projetos. Pode criar eventos e projetos, mas nao editar ou excluir.

- **Modulos:** 5
- **Uso tipico:** Lider de celula, coordenador de ministerio
- **Destaque:** Pode criar eventos e projetos, visualizar membros para referencia

### 5. Membro (`member`)

Acesso basico de visualizacao. Pode interagir no forum (criar topicos).

- **Modulos:** 9
- **Uso tipico:** Membro regular da igreja
- **Destaque:** Visualizacao de eventos, blog, devocionais, transmissoes, projetos, calendario, lideranca. Pode criar no forum.

### 6. Financeiro (`finance`)

Acesso completo ao modulo financeiro com controle total de transacoes, doacoes e relatorios.

- **Modulos:** 6
- **Uso tipico:** Tesoureiro, contador da igreja
- **Destaque:** CRUD completo em financas (incluindo `Manage`) e doacoes, visualizacao de membros, calendario e relatorios

---

## Modulos do Sistema

O sistema possui **26 modulos** (`SystemModule`), cada um representando uma area funcional.

| Enum | Valor | Label (PT-BR) | Categoria |
|---|---|---|---|
| `Dashboard` | `dashboard` | Dashboard | Core |
| `Users` | `users` | Usuarios | Core |
| `Members` | `members` | Membros | Core |
| `Blog` | `blog` | Blog | Conteudo |
| `Events` | `events` | Eventos | Conteudo |
| `Devotionals` | `devotionals` | Devocionais | Conteudo |
| `Transmissions` | `transmissions` | Transmissoes | Conteudo |
| `Projects` | `projects` | Projetos | Conteudo |
| `Forum` | `forum` | Forum | Conteudo |
| `Leadership` | `leadership` | Lideranca | Conteudo |
| `Visitors` | `visitors` | Visitantes | Gestao |
| `Calendar` | `calendar` | Calendario | Gestao |
| `Assistance` | `assistance` | Assistencia | Gestao |
| `Assistidos` | `assistidos` | Assistidos | Gestao |
| `Notifications` | `notifications` | Notificacoes | Gestao |
| `Communication` | `communication` | Comunicacao | Gestao |
| `ONG` | `ong` | Gerenciamento ONG | Gestao |
| `Finance` | `finance` | Financas | Financeiro |
| `Donations` | `donations` | Doacoes | Financeiro |
| `Reports` | `reports` | Relatorios | Financeiro |
| `Assets` | `assets` | Patrimonio | Financeiro |
| `Settings` | `settings` | Configuracoes | Sistema |
| `Permissions` | `permissions` | Permissoes | Sistema |
| `Audit` | `audit` | Auditoria | Sistema |
| `Logs` | `logs` | Logs do Sistema | Sistema |
| `Backup` | `backup` | Backup & Dados | Sistema |
| `HomeBuilder` | `home_builder` | Construtor da Home | Sistema |

---

## Acoes de Permissao

O sistema define **5 acoes** (`PermissionAction`) que podem ser aplicadas em cada modulo.

| Enum | Valor | Label (PT-BR) | Descricao |
|---|---|---|---|
| `View` | `view` | Visualizar | Permissao para visualizar dados do modulo |
| `Create` | `create` | Criar | Permissao para criar novos registros |
| `Update` | `update` | Editar | Permissao para editar registros existentes |
| `Delete` | `delete` | Excluir | Permissao para remover registros |
| `Manage` | `manage` | Gerenciar | Permissao administrativa do modulo (configurar, aprovar, etc.) |

> **Nota:** A acao `Manage` e a mais privilegiada. Ela indica que o usuario pode administrar o modulo como um todo, nao apenas operar sobre registros individuais. No `ProtectedRoute`, o acesso ao painel administrativo requer pelo menos uma permissao `Manage` em qualquer modulo.

---

## Matriz de Permissoes

### Legenda

- **V** = View (Visualizar)
- **C** = Create (Criar)
- **U** = Update (Editar)
- **D** = Delete (Excluir)
- **M** = Manage (Gerenciar)
- **-** = Sem acesso

### Tabela Completa

| Modulo | Admin | Secretary | Professional | Leader | Member | Finance |
|---|---|---|---|---|---|---|
| Dashboard | V M | V | V | V | V | V |
| Users | V C U D M | V U | - | - | - | - |
| Members | V C U D M | V C U | V | V | - | V |
| Blog | V C U D M | V C U | - | - | V | - |
| Events | V C U D M | V C U | - | V C | V | - |
| Devotionals | V C U D M | V C U | - | - | V | - |
| Transmissions | V C U D M | V C U | - | - | V | - |
| Projects | V C U D M | V C U | - | V C | V | - |
| Forum | V C U D M | V C U | - | - | V C | - |
| Leadership | V C U D M | - | - | - | V | - |
| Visitors | V C U D M | V C U | - | - | - | - |
| Calendar | V C U M | V M | V | V | V | V |
| Assistance | V C U D M | - | V C U | - | - | - |
| Assistidos | V C U D M | V C U | - | - | - | - |
| Notifications | V C U M | V C | - | - | - | - |
| Communication | V C U D M | - | - | - | - | - |
| ONG | V C U D M | - | - | - | - | - |
| Finance | V C U D M | - | - | - | - | V C U D M |
| Donations | V C U D M | - | - | - | - | V C U D |
| Reports | V M | V | V | - | - | V |
| Assets | V C U D M | - | - | - | - | - |
| Settings | V U M | V | - | - | - | - |
| Permissions | V U M | - | - | - | - | - |
| Audit | V M | - | - | - | - | - |
| Logs | V M | - | - | - | - | - |
| Backup | V C M | - | - | - | - | - |
| HomeBuilder | V C U D M | - | - | - | - | - |

### Resumo por Role

| Role | Total de Modulos | Total de Permissoes |
|---|---|---|
| Admin | 26 | 122 |
| Secretary | 15 | 37 |
| Professional | 5 | 8 |
| Leader | 5 | 8 |
| Member | 9 | 10 |
| Finance | 6 | 14 |

---

## Sistema de Override

O sistema permite sobrescrever permissoes individualmente por usuario, sem alterar a role padrao. Isso e util para conceder acesso especial a um usuario sem promove-lo de role, ou para restringir acesso a um modulo especifico.

### Interface

```typescript
export interface UserPermissionOverride {
  userId: string;
  grantedPermissions: Permission[];   // Permissoes extras concedidas
  revokedPermissions: Permission[];   // Permissoes removidas do padrao da role
}
```

### Como Funciona

**`grantedPermissions`** - Permissoes adicionais alem do padrao da role:
- Exemplo: Um `member` que precisa de acesso `View` ao modulo `Finance`
- A permissao e adicionada ao usuario sem mudar sua role

**`revokedPermissions`** - Permissoes removidas do padrao da role:
- Exemplo: Um `secretary` que nao deve ter acesso ao modulo `Blog`
- A permissao `Blog.View`, `Blog.Create`, `Blog.Update` sao revogadas

### Armazenamento

Os overrides sao armazenados no Firestore na colecao `userPermissionOverrides`:
- **Leitura:** Qualquer usuario autenticado
- **Escrita:** Somente admin

---

## Fluxo de Verificacao

Quando o sistema precisa verificar se um usuario tem permissao para uma acao, o seguinte fluxo e executado:

```
Requisicao do Usuario
         |
         v
  [1] Verificar Overrides Revogados
         |
    Permissao esta na lista de revogados?
    SIM -> NEGAR acesso
    NAO -> continuar
         |
         v
  [2] Verificar Overrides Concedidos
         |
    Permissao esta na lista de concedidos?
    SIM -> PERMITIR acesso
    NAO -> continuar
         |
         v
  [3] Verificar Permissoes Padrao da Role
         |
    A role do usuario tem essa permissao?
    SIM -> PERMITIR acesso
    NAO -> NEGAR acesso
```

### Implementacao

```typescript
export class PermissionManager {
  static hasPermission(
    userRole: string,
    module: SystemModule,
    action: PermissionAction,
    overrides?: UserPermissionOverride
  ): boolean {
    // 1. Verificar se esta revogado
    if (overrides?.revokedPermissions) {
      const isRevoked = overrides.revokedPermissions.some(
        p => p.module === module && p.action === action
      );
      if (isRevoked) return false;
    }

    // 2. Verificar se esta concedido via override
    if (overrides?.grantedPermissions) {
      const isGranted = overrides.grantedPermissions.some(
        p => p.module === module && p.action === action
      );
      if (isGranted) return true;
    }

    // 3. Verificar permissoes padrao da role
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
    if (!rolePermissions) return false;

    const modulePermission = rolePermissions.find(p => p.module === module);
    if (!modulePermission) return false;

    return modulePermission.actions.includes(action);
  }
}
```

### Prioridade

A ordem de prioridade e:

1. **Revogados** (maior prioridade) - Se uma permissao esta revogada, e NEGADA independente de qualquer outra coisa
2. **Concedidos** - Se uma permissao esta concedida via override, e PERMITIDA mesmo que a role padrao nao tenha
3. **Role padrao** - Caso nao haja override, as permissoes da role sao utilizadas

---

## Uso no Codigo

### 1. Hook `usePermissions()`

O hook principal para verificacao de permissoes em componentes React. Internamente utiliza o `useAtomicPermissions`.

**Arquivo:** `src/presentation/hooks/usePermissions.ts`

```typescript
import { usePermissions } from '@/presentation/hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

const MeuComponente = () => {
  const {
    hasPermission,       // (module, action) => boolean
    hasAnyPermission,    // (checks[]) => boolean (OR)
    hasAllPermissions,   // (checks[]) => boolean (AND)
    checkPermission,     // (module, action) => Promise<boolean> (async, valida com Firebase)
    isAdmin,             // boolean
    isSecretary,         // boolean
    isLeader,            // boolean
    isMember,            // boolean
    loading,             // boolean
    permissions,         // Map<SystemModule, Set<PermissionAction>>
    refreshPermissions   // () => Promise<void>
  } = usePermissions();

  // Verificacao sincrona (usa cache local)
  if (!hasPermission(SystemModule.Members, PermissionAction.View)) {
    return <p>Sem acesso ao modulo de membros</p>;
  }

  // Verificacao de multiplas permissoes (OR - precisa de pelo menos uma)
  const podeGerenciar = hasAnyPermission([
    { module: SystemModule.Members, action: PermissionAction.Manage },
    { module: SystemModule.Users, action: PermissionAction.Manage }
  ]);

  // Verificacao de multiplas permissoes (AND - precisa de todas)
  const podeCriarEEditar = hasAllPermissions([
    { module: SystemModule.Events, action: PermissionAction.Create },
    { module: SystemModule.Events, action: PermissionAction.Update }
  ]);

  return <div>...</div>;
};
```

### 2. `PermissionManager.hasPermission()`

Metodo estatico para verificacao de permissoes fora de componentes React. Util em servicos e utilitarios.

**Arquivo:** `src/modules/user-management/permissions/domain/entities/Permission.ts`

```typescript
import {
  PermissionManager,
  SystemModule,
  PermissionAction,
  UserPermissionOverride
} from '@/domain/entities/Permission';

// Verificacao simples (sem overrides)
const podeVisualizar = PermissionManager.hasPermission(
  'secretary',                    // role do usuario
  SystemModule.Members,           // modulo
  PermissionAction.View           // acao
);
// Resultado: true

// Verificacao com overrides
const overrides: UserPermissionOverride = {
  userId: 'user123',
  grantedPermissions: [],
  revokedPermissions: [
    { id: 'members_view', module: SystemModule.Members, action: PermissionAction.View, description: '' }
  ]
};

const podeVisualizar2 = PermissionManager.hasPermission(
  'secretary',
  SystemModule.Members,
  PermissionAction.View,
  overrides
);
// Resultado: false (revogado via override)
```

### Metodos Auxiliares do PermissionManager

```typescript
// Obter todas as permissoes de uma role
const permissoes = PermissionManager.getRolePermissions('secretary');
// Retorna: Permission[] com todas as permissoes da role

// Listar todos os modulos
const modulos = PermissionManager.getAllModules();
// Retorna: SystemModule[]

// Listar todas as acoes
const acoes = PermissionManager.getAllActions();
// Retorna: PermissionAction[]

// Obter label de um modulo
const label = PermissionManager.getModuleLabel(SystemModule.Members);
// Retorna: 'Membros'

// Obter label de uma acao
const labelAcao = PermissionManager.getActionLabel(PermissionAction.Create);
// Retorna: 'Criar'
```

### 3. Componente `ProtectedRoute`

Protege rotas inteiras com verificacao de permissoes. Redireciona ou mostra tela de erro se o usuario nao tem acesso.

**Arquivo:** `src/presentation/components/ProtectedRoute.tsx`

```tsx
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// Proteger rota com modulo + acao
<Route path="/membros" element={
  <ProtectedRoute
    requireModule={SystemModule.Members}
    requireAction={PermissionAction.View}
  >
    <MembrosPage />
  </ProtectedRoute>
} />

// Proteger rota com multiplas permissoes (precisa de TODAS)
<Route path="/membros/novo" element={
  <ProtectedRoute
    requirePermissions={[
      { module: SystemModule.Members, action: PermissionAction.View },
      { module: SystemModule.Members, action: PermissionAction.Create }
    ]}
  >
    <NovoMembroPage />
  </ProtectedRoute>
} />

// Permitir acesso irrestrito para admin
<Route path="/configuracoes" element={
  <ProtectedRoute allowAdminAccess>
    <ConfiguracoesPage />
  </ProtectedRoute>
} />

// Exigir pelo menos uma permissao Manage (para painel admin)
<Route path="/admin" element={
  <ProtectedRoute requireAnyManagePermission>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

**Props do ProtectedRoute:**

| Prop | Tipo | Descricao |
|---|---|---|
| `requireModule` | `SystemModule` | Modulo requerido (usar junto com `requireAction`) |
| `requireAction` | `PermissionAction` | Acao requerida no modulo |
| `requirePermissions` | `Array<{module, action}>` | Lista de permissoes necessarias (AND - todas sao requeridas) |
| `allowAdminAccess` | `boolean` | Se `true`, admin acessa sem verificacao de permissoes |
| `requireAnyManagePermission` | `boolean` | Requer pelo menos uma permissao `Manage` em qualquer modulo |

**Comportamentos do ProtectedRoute:**

1. Se carregando: mostra spinner
2. Se nao autenticado: redireciona para `/login`
3. Se sistema em manutencao e nao e admin: mostra tela de manutencao
4. Se nao aprovado: redireciona para `/pending-approval`
5. Se nao tem permissao: mostra tela de "Acesso Negado" com detalhes da permissao necessaria

### 4. Regras do Firestore (Server-side)

As regras do Firestore atuam como uma camada adicional de seguranca no servidor. Elas verificam autenticacao, status e role diretamente no banco de dados.

```javascript
// firestore.rules

// Verificar autenticacao
function isAuthenticated() {
  return request.auth != null;
}

// Verificar status aprovado
function isApproved() {
  return isAuthenticated() && getUserData().status == 'approved';
}

// Verificar role admin
function isAdmin() {
  return hasRole('admin');
}

// Exemplo de regra em uma colecao
match /members/{docId} {
  allow read, write: if isApproved();
}

// Exemplo de regra com verificacao de dono
match /notifications/{docId} {
  allow read: if isAuthenticated() && (isDocOwner() || isApproved());
  allow update: if isDocOwner();
}

// Exemplo de regra somente admin
match /rolePermissions/{docId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

> **Importante:** As regras do Firestore verificam `role` e `status` mas nao verificam permissoes granulares (modulo + acao). A verificacao granular e feita no lado do cliente pelo `PermissionManager` e `usePermissions`. As regras do Firestore sao a "barreira" de seguranca; o PermissionService e a "logica de negocio".

---

## Status do Usuario

### Campos Relevantes

Cada usuario possui dois campos essenciais no documento Firestore (`/users/{uid}`):

| Campo | Tipo | Valores | Descricao |
|---|---|---|---|
| `role` | string | `admin`, `secretary`, `professional`, `leader`, `member`, `finance` | Define as permissoes padrao do usuario |
| `status` | string | `approved`, `pending`, `blocked` | Define se o usuario pode acessar o sistema |

### Regras de Acesso por Status

| Status | Pode Acessar? | Descricao |
|---|---|---|
| `approved` | Sim | Usuario aprovado com acesso total baseado em sua role |
| `pending` | Nao | Usuario aguardando aprovacao do admin |
| `blocked` | Nao | Usuario bloqueado por decisao do admin |

### Fluxo de Aprovacao

```
Registro do Usuario
       |
       v
  Status: pending
  (Nao pode acessar o sistema)
       |
       v
  Admin aprova o usuario
       |
       v
  Status: approved
  (Acesso liberado conforme role)
```

### Excecao: Criacao via Cloud Function

Quando um admin ou secretario cria um usuario via Cloud Function `createUserAccount`, o usuario e criado ja com `status: 'approved'`, pulando a etapa de aprovacao.

### Verificacao no Codigo

```typescript
// No AuthContext
const canAccessSystem = () => {
  return currentUser?.status === 'approved';
};

// No ProtectedRoute
if (!canAccessSystem()) {
  return <Navigate to="/pending-approval" />;
}
```

### Verificacao no Firestore

```javascript
// Funcao auxiliar nas regras
function isApproved() {
  return isAuthenticated() && getUserData().status == 'approved';
}

// Uso em regras de colecao
match /members/{docId} {
  allow read, write: if isApproved();
}
```

> **Importante:** A verificacao de `status` e feita tanto no lado do cliente (React) quanto no servidor (Firestore rules), garantindo que mesmo que alguem tente acessar diretamente a API do Firestore, o acesso sera bloqueado se o status nao for `approved`.
