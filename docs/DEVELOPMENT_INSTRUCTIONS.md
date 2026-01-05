# Instruções de Desenvolvimento - Sistema de Gerenciamento da Igreja

**Data de Criação**: 28/11/2025
**Versão**: 1.0
**Aplicável a**: Todas as funcionalidades e telas do sistema

---

## 📋 Checklist Obrigatório para Nova Funcionalidade

**SEMPRE** que criar uma nova tela ou funcionalidade, você **DEVE** seguir este checklist completo:

---

### ✅ 1. Configuração Firebase (OBRIGATÓRIO)

#### 1.1. Atualizar `firestore.rules`
**Localização**: `/firestore.rules`

**O que fazer**:
- [ ] Adicionar regras de segurança para a nova coleção
- [ ] Definir permissões de leitura (read)
- [ ] Definir permissões de criação (create)
- [ ] Definir permissões de atualização (update)
- [ ] Definir permissões de exclusão (delete)
- [ ] Validar tipos de dados
- [ ] Validar campos obrigatórios
- [ ] Verificar permissões baseadas em role do usuário

**Exemplo**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Nova coleção: assets (patrimônio)
    match /assets/{assetId} {
      // Leitura: usuários autenticados com role admin ou secretary
      allow read: if request.auth != null &&
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'secretary']);

      // Criação e edição: admin e secretary com validação de dados
      allow create, update: if request.auth != null &&
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'secretary'] &&
                               request.resource.data.name is string &&
                               request.resource.data.name.size() >= 2 &&
                               request.resource.data.name.size() <= 200 &&
                               request.resource.data.acquisitionValue >= 0;

      // Exclusão: apenas admin
      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### 1.2. Atualizar `firestore.indexes.json` (se necessário)
**Localização**: `/firestore.indexes.json`

**Quando necessário**:
- Queries com `orderBy` em múltiplos campos
- Queries com `where` + `orderBy` em campos diferentes
- Queries complexas (o Firebase mostrará erro com link para criar o índice)

**Exemplo**:
```json
{
  "indexes": [
    {
      "collectionGroup": "assets",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "assets",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

#### 1.3. Atualizar `storage.rules` (se usar upload de arquivos)
**Localização**: `/storage.rules`

**Exemplo**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Imagens de patrimônio
    match /asset-images/{assetId}/{fileName} {
      allow read: if true; // Leitura pública

      allow write: if request.auth != null &&
                      request.resource.contentType.matches('image/.*') &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'secretary'];
    }
  }
}
```

#### 1.4. Deploy das Regras Firebase
```bash
# Deploy das regras do Firestore
firebase deploy --only firestore:rules

# Deploy dos índices (se atualizou)
firebase deploy --only firestore:indexes

# Deploy das regras de Storage (se atualizou)
firebase deploy --only storage

# Ou deploy completo
firebase deploy
```

---

### ✅ 2. Sistema de Permissões (OBRIGATÓRIO)

#### 2.1. Adicionar Módulo em `Permission.ts`
**Localização**: `/src/modules/user-management/permissions/domain/entities/Permission.ts`

**O que fazer**:
- [ ] Adicionar novo módulo no enum `SystemModule`
- [ ] Adicionar permissões para role `admin` no `DEFAULT_ROLE_PERMISSIONS`
- [ ] Adicionar permissões para outros roles se necessário
- [ ] Adicionar label em português no método `getModuleLabel()`

**Exemplo**:
```typescript
export enum SystemModule {
  // ... módulos existentes
  Assets = 'assets', // ✅ ADICIONAR AQUI
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, ...> = {
  admin: [
    // ... permissões existentes
    {
      module: SystemModule.Assets,
      actions: [
        PermissionAction.View,
        PermissionAction.Create,
        PermissionAction.Update,
        PermissionAction.Delete,
        PermissionAction.Export,
        PermissionAction.Manage
      ]
    }, // ✅ ADICIONAR AQUI
  ],

  secretary: [
    // ... permissões existentes
    {
      module: SystemModule.Assets,
      actions: [
        PermissionAction.View,
        PermissionAction.Create,
        PermissionAction.Update
      ]
    }, // ✅ ADICIONAR SE NECESSÁRIO
  ]
};

static getModuleLabel(module: SystemModule): string {
  const labels: Record<SystemModule, string> = {
    // ... labels existentes
    [SystemModule.Assets]: 'Patrimônio', // ✅ ADICIONAR AQUI
  };
  return labels[module];
}
```

#### 2.2. Adicionar Rota Protegida em `App.tsx`
**Localização**: `/src/App.tsx`

**O que fazer**:
- [ ] Importar a nova página
- [ ] Adicionar rota com `ProtectedRoute`
- [ ] Configurar módulo e ação de permissão necessários

**Exemplo**:
```tsx
// Importação
import AssetsManagementPage from './presentation/pages/AssetsManagementPage';

// No router
{
  path: 'admin/assets',
  element: (
    <ProtectedRoute
      requireModule={SystemModule.Assets}
      requireAction={PermissionAction.View}
    >
      <Layout>
        <AssetsManagementPage />
      </Layout>
    </ProtectedRoute>
  )
}
```

#### 2.3. Adicionar Card no Painel Admin
**Localização**: `/src/presentation/pages/AdminDashboardPage.tsx`

**O que fazer**:
- [ ] Adicionar novo card no array `allActions`
- [ ] Definir título, descrição, ícone e cor
- [ ] Configurar permissão necessária com `hasPermission()`
- [ ] Categorizar corretamente (core, content, church, financial, system)

**Exemplo**:
```tsx
{
  title: 'Gerenciar Patrimônio',
  description: 'Administrar bens e ativos da igreja',
  href: '/admin/assets',
  icon: '🏛️',
  color: 'bg-purple-600 hover:bg-purple-700',
  category: 'financial',
  show: hasPermission(SystemModule.Assets, PermissionAction.View)
}
```

---

### ✅ 3. Sistema de Logs e Auditoria (OBRIGATÓRIO)

#### 3.1. Registrar Ações em Logs
**Quando**: Toda ação importante (criar, editar, excluir, exportar)

**Como implementar**:
```typescript
import { AuditService } from '../../infrastructure/services/AuditService';

const auditService = new AuditService();

// Ao criar
await auditService.logAction({
  userId: currentUser.id,
  userName: currentUser.displayName || currentUser.email,
  action: 'create',
  module: 'assets',
  entityId: newAssetId,
  entityType: 'asset',
  description: `Criado patrimônio: ${assetData.name}`,
  metadata: {
    assetName: assetData.name,
    category: assetData.category,
    value: assetData.acquisitionValue
  },
  timestamp: new Date()
});

// Ao editar
await auditService.logAction({
  userId: currentUser.id,
  userName: currentUser.displayName || currentUser.email,
  action: 'update',
  module: 'assets',
  entityId: asset.id,
  entityType: 'asset',
  description: `Atualizado patrimônio: ${asset.name}`,
  changes: {
    before: { status: oldStatus },
    after: { status: newStatus }
  },
  timestamp: new Date()
});

// Ao excluir
await auditService.logAction({
  userId: currentUser.id,
  userName: currentUser.displayName || currentUser.email,
  action: 'delete',
  module: 'assets',
  entityId: asset.id,
  entityType: 'asset',
  description: `Excluído patrimônio: ${asset.name}`,
  metadata: {
    assetName: asset.name,
    value: asset.acquisitionValue
  },
  timestamp: new Date()
});

// Ao exportar
await auditService.logAction({
  userId: currentUser.id,
  userName: currentUser.displayName || currentUser.email,
  action: 'export',
  module: 'assets',
  description: 'Exportados dados de patrimônio',
  metadata: {
    recordCount: assets.length,
    format: 'excel'
  },
  timestamp: new Date()
});
```

#### 3.2. Checklist de Logs
- [ ] Log ao **CRIAR** novo registro
- [ ] Log ao **EDITAR** registro existente
- [ ] Log ao **EXCLUIR** registro
- [ ] Log ao **EXPORTAR** dados
- [ ] Log ao **IMPORTAR** dados (se aplicável)
- [ ] Log de ações administrativas importantes
- [ ] Incluir metadata relevante (valores alterados, quantidade de registros, etc.)

---

### ✅ 4. Validação Completa de Formulários

**Siga todas as instruções do arquivo**: `VALIDATION_INSTRUCTIONS.md`

**Checklist rápido**:
- [ ] Todos os campos têm validação
- [ ] Campos obrigatórios marcados com `*` vermelho
- [ ] Botão salvar desabilitado quando inválido
- [ ] Validação em tempo real
- [ ] Painel de erros no topo do formulário
- [ ] Mensagens de erro claras e em português
- [ ] Validação também no backend (entidade de domínio)

---

### ✅ 5. Feedback Visual ao Usuário (Toast)

**IMPORTANTE**: Use **Toast notifications** ao invés de `alert()` e `confirm()` para melhor UX.

#### 5.1. Instalação da Biblioteca (se ainda não estiver instalado)
```bash
npm install react-toastify
```

#### 5.2. Configuração no App.tsx
```typescript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      {/* Resto do app */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
```

#### 5.3. Uso nos Componentes
**Checklist**:
- [ ] Usar `toast.success()` para operações bem-sucedidas
- [ ] Usar `toast.error()` para erros
- [ ] Usar `toast.warning()` para avisos
- [ ] Usar `toast.info()` para informações
- [ ] NUNCA usar `alert()` ou `window.alert()`
- [ ] Para confirmações, usar modal customizado ou `toast.promise()`

**Exemplo - Substituir alert por toast**:
```typescript
import { toast } from 'react-toastify';

// ❌ ERRADO - NÃO usar alert
alert('✅ Item salvo com sucesso!');

// ✅ CORRETO - Usar toast
toast.success('Item salvo com sucesso!');

// ❌ ERRADO - NÃO usar alert para erros
alert('❌ Erro ao salvar item');

// ✅ CORRETO - Usar toast para erros
toast.error('Erro ao salvar item');

// ✅ CORRETO - Usar toast com promise
toast.promise(
  saveItem(),
  {
    pending: 'Salvando...',
    success: 'Item salvo com sucesso!',
    error: 'Erro ao salvar item'
  }
);
```

**Exemplo - Substituir confirm por modal ou toast personalizado**:
```typescript
import { toast } from 'react-toastify';

// ❌ ERRADO - NÃO usar confirm
const confirmed = window.confirm('Deseja excluir este item?');
if (confirmed) {
  deleteItem();
}

// ✅ CORRETO - Usar toast customizado com botões
const showDeleteConfirmation = (itemId: string) => {
  toast.warning(
    <div>
      <p>Deseja realmente excluir este item?</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            handleDelete(itemId);
            toast.dismiss();
          }}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Excluir
        </button>
        <button
          onClick={() => toast.dismiss()}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Cancelar
        </button>
      </div>
    </div>,
    {
      autoClose: false,
      closeButton: false
    }
  );
};

// ✅ OU MELHOR AINDA - Usar modal customizado
const [showDeleteModal, setShowDeleteModal] = useState(false);
// ... implementar modal com confirmação
```

**Vantagens do Toast**:
- ✅ Não bloqueia a interface
- ✅ Melhor experiência visual
- ✅ Mais profissional
- ✅ Pode empilhar múltiplas notificações
- ✅ Pode ter ações (botões) integradas
- ✅ Pode mostrar progresso de operações assíncronas

---

### ✅ 6. Estrutura de Arquivos

#### 6.1. Camada de Domínio
**Localização**: `/src/domain/entities/`

- [ ] Criar interface da entidade
- [ ] Criar enums necessários
- [ ] Criar classe com métodos de validação
- [ ] Criar métodos helpers (formatação, cálculos, etc.)

**Exemplo**: `Asset.ts`, `AssetCategory`, `AssetStatus`, `AssetEntity`

#### 6.2. Camada de Infraestrutura
**Localização**: `/src/infrastructure/services/`

- [ ] Criar serviço com métodos CRUD
- [ ] Implementar conversão Firestore ↔ Entity
- [ ] Adicionar métodos de busca e filtro
- [ ] Adicionar validação antes de salvar
- [ ] Tratar erros adequadamente

**Exemplo**: `AssetService.ts`

#### 6.3. Camada de Apresentação
**Localização**: `/src/presentation/pages/`

- [ ] Criar página com formulário completo
- [ ] Implementar validação em tempo real
- [ ] Adicionar filtros e busca
- [ ] Implementar paginação (se necessário)
- [ ] Adicionar feedback visual (loading, erros, sucesso)
- [ ] Tornar responsivo para mobile

**Exemplo**: `AssetsManagementPage.tsx`

---

### ✅ 7. Testes Manuais Obrigatórios

Antes de considerar a funcionalidade completa, teste:

- [ ] **Criar** novo registro com dados válidos
- [ ] **Criar** com dados inválidos (deve mostrar erros)
- [ ] **Editar** registro existente
- [ ] **Excluir** registro
- [ ] **Buscar** registros
- [ ] **Filtrar** por categoria/status
- [ ] **Paginação** funciona corretamente
- [ ] **Permissões** - usuário sem permissão não acessa
- [ ] **Logs** - ações estão sendo registradas
- [ ] **Mobile** - interface responsiva
- [ ] **Validação** - botão desabilitado quando inválido
- [ ] **Firebase Rules** - regras de segurança funcionando

---

## 📚 Resumo dos Arquivos a Atualizar

Para cada nova funcionalidade, você **DEVE** atualizar:

### Configuração Firebase:
1. ✅ `firestore.rules` - Regras de segurança
2. ✅ `firestore.indexes.json` - Índices (se necessário)
3. ✅ `storage.rules` - Upload de arquivos (se necessário)

### Sistema de Permissões:
4. ✅ `src/modules/user-management/permissions/domain/entities/Permission.ts` - Adicionar módulo
5. ✅ `src/App.tsx` - Adicionar rota protegida
6. ✅ `src/presentation/pages/AdminDashboardPage.tsx` - Adicionar card

### Código da Funcionalidade:
7. ✅ `src/domain/entities/[Entity].ts` - Entidade de domínio
8. ✅ `src/infrastructure/services/[Entity]Service.ts` - Serviço
9. ✅ `src/presentation/pages/[Entity]ManagementPage.tsx` - Página

### Logs e Auditoria:
10. ✅ Implementar logs em todas as ações (create, update, delete, export)

---

## 🚫 Erros Comuns a Evitar

### ❌ NÃO fazer:
- Criar funcionalidade sem atualizar Firebase Rules
- Esquecer de adicionar permissões no sistema
- Não registrar logs de ações importantes
- Criar formulários sem validação completa
- Não fazer deploy das regras do Firebase
- Copiar e colar código sem adaptar validações
- Permitir acesso sem verificar permissões

### ✅ SEMPRE fazer:
- Seguir este checklist completamente
- Testar com diferentes roles de usuário
- Validar no frontend E no backend (Firebase Rules)
- Registrar todas as ações importantes em logs
- Fazer deploy das configurações Firebase
- Documentar decisões importantes
- Testar em mobile

---

## 🔄 Fluxo de Trabalho Recomendado

```
1. Planejar funcionalidade
   ↓
2. Criar entidade de domínio com validação
   ↓
3. Adicionar módulo em Permission.ts
   ↓
4. Criar serviço de infraestrutura
   ↓
5. ⚠️ ATUALIZAR firestore.rules
   ↓
6. ⚠️ ATUALIZAR firestore.indexes.json (se necessário)
   ↓
7. ⚠️ FAZER DEPLOY Firebase
   ↓
8. Criar página de apresentação
   ↓
9. Adicionar rota em App.tsx
   ↓
10. Adicionar card no AdminDashboard
   ↓
11. ⚠️ IMPLEMENTAR LOGS em todas as ações
   ↓
12. Testar completamente
   ↓
13. ✅ Funcionalidade pronta!
```

---

## 📞 Dúvidas?

- Consulte `VALIDATION_INSTRUCTIONS.md` para validação de formulários
- Consulte `PROJECT_ISOLATION_REPORT.md` para arquitetura do projeto
- Veja exemplos em páginas existentes (ex: `AssetsManagementPage.tsx`)

---

**Última Atualização**: 28/11/2025
**Versão**: 1.0
**Responsável**: Sistema de Gerenciamento da Igreja
