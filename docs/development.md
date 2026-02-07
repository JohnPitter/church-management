# Guia de Desenvolvimento

Guia completo para desenvolvedores que vao trabalhar no sistema de gerenciamento de igreja.

---

## Pre-requisitos

Antes de comecar, certifique-se de ter instalado:

- **Node.js 16+** - Runtime JavaScript ([download](https://nodejs.org/))
- **npm 7+** - Gerenciador de pacotes (vem com o Node.js)
- **Firebase CLI** - Ferramentas de linha de comando do Firebase
  ```bash
  npm install -g firebase-tools
  ```
- **Git** - Controle de versao ([download](https://git-scm.com/))

Para verificar as versoes instaladas:

```bash
node --version    # v16.x ou superior
npm --version     # 7.x ou superior
firebase --version
git --version
```

---

## Setup Inicial

1. **Clone o repositorio**
   ```bash
   git clone <url-do-repositorio>
   cd church-management-new
   ```

2. **Instale as dependencias**
   ```bash
   npm install
   ```

3. **Crie o arquivo `.env.local`** na raiz do projeto com as variaveis do Firebase:
   ```env
   REACT_APP_FIREBASE_API_KEY=sua-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=seu-projeto
   REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

4. **Configure o Firebase CLI**
   ```bash
   firebase login
   firebase use --add
   ```
   Selecione o projeto Firebase correspondente quando solicitado.

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm start
   ```
   Acesse em [http://localhost:3000](http://localhost:3000).

---

## Comandos do Dia a Dia

| Comando | O que faz |
|---------|-----------|
| `npm start` | Dev server (localhost:3000) |
| `npm test` | Testes em modo watch |
| `npm test -- --coverage` | Testes com cobertura |
| `npm test -- --watchAll=false` | Testes sem watch |
| `npm run build` | Build de producao |
| `npm run lint` | ESLint |
| `npm run lint:fix` | Auto-fix ESLint |
| `npm run typecheck` | Verificacao TypeScript |
| `npm run deploy` | Deploy completo |
| `npm run deploy:preview` | Deploy preview |
| `npm run deploy:production` | Deploy producao |
| `npm run setup:indexes` | Indices Firestore |

### Comandos Firebase (diretos)

| Comando | O que faz |
|---------|-----------|
| `firebase deploy --only firestore:rules` | Deploy somente regras do Firestore |
| `firebase deploy --only functions` | Deploy somente Cloud Functions |
| `firebase emulators:start` | Inicia emuladores locais |

---

## Workflow de Desenvolvimento

1. Crie uma branch (ou trabalhe em main para mudancas pequenas)
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. Faca suas alteracoes no codigo

3. Verifique o TypeScript - garanta zero erros
   ```bash
   npm run typecheck
   ```

4. Execute os testes - garanta que estao passando
   ```bash
   npm test
   ```

5. Faca o build - garanta que a aplicacao compila
   ```bash
   npm run build
   ```

6. Commit e push
   ```bash
   git add .
   git commit -m "feat: descricao da mudanca"
   git push origin feature/nome-da-feature
   ```

7. Pipeline CI/CD executa automaticamente

---

## Como Adicionar uma Nova Feature

Siga o passo a passo abaixo respeitando a Clean Architecture do projeto:

### 1. Entidade de Dominio

Crie a entidade em `src/modules/{modulo}/domain/entities/`.

```typescript
// src/modules/church-management/members/domain/entities/MinhaEntidade.ts
export interface MinhaEntidade {
  id: string;
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Interface de Repositorio

Crie em `src/domain/repositories/` (global) ou no modulo.

```typescript
// src/domain/repositories/IMinhaEntidadeRepository.ts
export interface IMinhaEntidadeRepository {
  findById(id: string): Promise<MinhaEntidade | null>;
  findAll(): Promise<MinhaEntidade[]>;
  create(data: CreateMinhaEntidadeDTO): Promise<MinhaEntidade>;
  update(id: string, data: UpdateMinhaEntidadeDTO): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 3. Repositorio Firebase

Implemente em `src/data/repositories/FirebaseMinhaEntidadeRepository.ts`.

```typescript
// src/data/repositories/FirebaseMinhaEntidadeRepository.ts
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export class FirebaseMinhaEntidadeRepository implements IMinhaEntidadeRepository {
  private collectionRef = collection(db, 'minhaColecao');

  async findById(id: string): Promise<MinhaEntidade | null> {
    const docSnap = await getDoc(doc(this.collectionRef, id));
    return docSnap.exists() ? this.mapToEntity(docSnap) : null;
  }

  // ... demais metodos
}
```

### 4. Registre no DI Container

Em `src/infrastructure/di/container.ts` (legacy) ou no modulo DI.

```typescript
// src/infrastructure/di/container.ts
import { FirebaseMinhaEntidadeRepository } from '@/data/repositories/FirebaseMinhaEntidadeRepository';

let minhaEntidadeRepository: IMinhaEntidadeRepository | null = null;

export function getMinhaEntidadeRepository(): IMinhaEntidadeRepository {
  if (!minhaEntidadeRepository) {
    minhaEntidadeRepository = new FirebaseMinhaEntidadeRepository();
  }
  return minhaEntidadeRepository;
}
```

### 5. Service (Camada de Aplicacao)

Crie em `src/modules/{modulo}/application/services/`.

```typescript
// src/modules/{modulo}/application/services/MinhaEntidadeService.ts
export class MinhaEntidadeService {
  private repository: IMinhaEntidadeRepository;

  constructor() {
    this.repository = getMinhaEntidadeRepository();
  }

  async listarTodos(): Promise<MinhaEntidade[]> {
    return this.repository.findAll();
  }

  // ... demais metodos de negocio
}
```

### 6. Componente UI

Crie em `src/modules/{modulo}/presentation/components/` ou `src/presentation/components/`.

### 7. Pagina

Crie em `src/presentation/pages/`.

### 8. Rota

Adicione em `src/App.tsx` com o guard apropriado:

```tsx
// src/App.tsx
<Route
  path="/minha-feature"
  element={
    <ProtectedRoute>
      <MinhaFeaturePage />
    </ProtectedRoute>
  }
/>
```

### 9. Permissao

Adicione o modulo em `SystemModule` e configure em `DEFAULT_ROLE_PERMISSIONS`:

```typescript
// src/domain/entities/Permission.ts
export enum SystemModule {
  // ... modulos existentes
  MINHA_FEATURE = 'minha_feature',
}
```

### 10. Firestore Rules

Atualize `firestore.rules` se houver nova colecao:

```
match /minhaColecao/{docId} {
  allow read: if isAuthenticated();
  allow write: if hasAnyRole(['admin', 'secretary']);
}
```

---

## Padroes de UX Obrigatorios

### Notificacoes

Use `toast` de react-hot-toast para feedback ao usuario:

```typescript
import toast from 'react-hot-toast';

// Sucesso
toast.success('Salvo com sucesso');

// Erro
toast.error('Erro ao salvar');

// Loading
const toastId = toast.loading('Salvando...');
// ... apos a operacao
toast.dismiss(toastId);
toast.success('Salvo!');
```

### Confirmacoes

Use `useConfirmDialog()` para dialogos de confirmacao:

```typescript
import { useConfirmDialog } from '../components/ConfirmDialog';

const { confirm, prompt } = useConfirmDialog();

// Confirmacao simples
const ok = await confirm({
  title: 'Confirmar',
  message: 'Deseja excluir este item?',
  variant: 'danger',
});

if (ok) {
  // executar acao
}

// Input do usuario
const value = await prompt({
  title: 'Nome',
  message: 'Digite o nome:',
  inputPlaceholder: 'Ex: Departamento de Louvor',
});

if (value) {
  // usar o valor
}
```

### O que NUNCA usar

**NAO use dialogos nativos do navegador.** Eles quebram a experiencia do usuario e nao seguem o design system:

- `alert()` - Use `toast.success()` ou `toast.error()`
- `window.confirm()` - Use `useConfirmDialog().confirm()`
- `window.prompt()` - Use `useConfirmDialog().prompt()`

---

## Path Aliases (TypeScript)

O projeto usa aliases de caminho para imports mais limpos. Configurados em `tsconfig.json` e resolvidos pelo CRACO em runtime.

| Alias | Caminho |
|-------|---------|
| `@modules/*` | `src/modules/*` |
| `@shared-kernel/*` | `src/modules/shared-kernel/*` |
| `@church-management/*` | `src/modules/church-management/*` |
| `@financial/*` | `src/modules/financial/*` |
| `@assistance/*` | `src/modules/assistance/*` |
| `@analytics/*` | `src/modules/analytics/*` |
| `@/` | `src/` |

### Exemplos de uso

```typescript
// Ao inves de:
import { Member } from '../../../modules/church-management/members/domain/entities/Member';

// Use:
import { Member } from '@modules/church-management/members/domain/entities/Member';
import { EventBus } from '@shared-kernel/event-bus/EventBus';
import { getUserRepository } from '@/infrastructure/di/container';
```

---

## Testes

### Estrutura

- Arquivos de teste ficam em pastas `__tests__/` junto ao codigo fonte
- Nomenclatura: `NomeDoArquivo.test.ts` ou `NomeDoArquivo.test.tsx`
- Framework: Jest + React Testing Library

### Executando testes

```bash
# Modo watch (desenvolvimento)
npm test

# Com relatorio de cobertura
npm test -- --coverage

# Execucao unica (CI/CD)
npm test -- --watchAll=false

# Arquivo especifico
npm test -- --testPathPattern="MemberService"
```

### Padroes de teste

**Mock do Firebase:**

```typescript
jest.mock('@/config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));
```

**Mock do useAuth (retorne o AuthContextType completo com 13 propriedades):**

```typescript
jest.mock('@/presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: '1', role: 'admin', status: 'approved' },
    loading: false,
    isAdmin: () => true,
    isSecretary: () => false,
    isLeader: () => false,
    isMember: () => false,
    canApproveUsers: () => true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));
```

**Fake timers:**

```typescript
// Use advanceTimersByTime em vez de runAllTimers para setInterval
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.useRealTimers();
```

**userEvent v13.5.0:**

```typescript
import userEvent from '@testing-library/user-event';

// NAO use .setup() - nao disponivel nesta versao
// Correto:
await userEvent.click(botao);
await userEvent.type(input, 'texto');

// Incorreto:
// const user = userEvent.setup();
```

---

## Troubleshooting Comum

### TypeScript errors com path aliases

- Verifique se `tsconfig.json` tem os paths configurados corretamente
- CRACO resolve os aliases em runtime
- Se o IDE nao reconhece, reinicie o servidor TypeScript

### Firebase Auth vs Firestore

- **Auth** = autenticacao (login/logout/tokens)
- **`/users` collection** = metadata do usuario (role, status, permissions)
- Ambos devem existir para o usuario funcionar no sistema
- So usuarios com `status: 'approved'` conseguem acessar

### Dois sistemas de DI

O projeto possui dois sistemas de injecao de dependencia que coexistem:

| Sistema | Localizacao | Quando usar |
|---------|-------------|-------------|
| Container manual (legacy) | `src/infrastructure/di/container.ts` | Codigo existente que ja usa |
| tsyringe (moderno) | `src/modules/shared-kernel/di/Container.ts` | Novos modulos |

**Regra**: siga o padrao do codigo ao redor. Se o modulo usa container manual, continue usando. Se usa tsyringe, use tsyringe.

### Cloud Functions nao deployam

- Use o import de 1st Gen:
  ```typescript
  import * as functions from 'firebase-functions/v1';
  ```
- **NAO** use o import default (`firebase-functions`)
- Functions sao 1st Gen e nao podem ser migradas para 2nd Gen
- Regiao obrigatoria: `southamerica-east1`

### Firestore rules falham no deploy (erro 503)

- O arquivo de rules tem um limite de aproximadamente 500 linhas
- Mantenha as regras compactas
- Logica granular de permissao deve ficar no lado da aplicacao (app-side)

### Componentes instanciam services com `new Service()`

- Isso dificulta mocking nos testes
- Use o constructor pattern para jest.mock:
  ```typescript
  jest.mock('./MinhaService', () => {
    return jest.fn().mockImplementation(() => ({
      listar: jest.fn().mockResolvedValue([]),
      criar: jest.fn().mockResolvedValue({ id: '1' }),
    }));
  });
  ```

### Build falha com imports nao utilizados

- O projeto exige zero imports nao utilizados
- Execute `npm run lint:fix` para remover automaticamente
- Ou remova manualmente antes do commit

### Erros de regiao no Firebase

- Todas as funcoes e queries devem usar a regiao `southamerica-east1` (Sao Paulo)
- Verifique a configuracao em `src/config/firebase.ts`
- Cloud Functions devem especificar a regiao explicitamente

---

## Estrutura de Pastas

```
church-management-new/
├── docs/                          # Documentacao do projeto
├── functions/                     # Cloud Functions (server-side)
│   └── src/
│       └── index.ts               # Funcoes Firebase
├── public/                        # Arquivos estaticos
├── src/
│   ├── config/                    # Configuracao (Firebase, etc.)
│   ├── data/                      # Camada de Dados
│   │   └── repositories/         # Implementacoes Firebase
│   ├── domain/                    # Camada de Dominio
│   │   ├── entities/             # Entidades globais
│   │   └── repositories/        # Interfaces de repositorio
│   ├── infrastructure/           # Infraestrutura
│   │   └── di/                   # Container de DI manual
│   ├── modules/                  # Modulos DDD
│   │   ├── shared-kernel/        # Utilitarios compartilhados
│   │   ├── church-management/    # Gestao da igreja
│   │   ├── content-management/   # Gestao de conteudo
│   │   ├── financial/            # Financeiro
│   │   ├── assistance/           # Assistencia social
│   │   ├── analytics/            # Relatorios e dashboards
│   │   └── ong-management/       # Gestao de ONG
│   ├── presentation/             # Camada de Apresentacao
│   │   ├── components/           # Componentes reutilizaveis
│   │   ├── contexts/             # React Contexts
│   │   ├── hooks/                # Custom hooks
│   │   └── pages/                # Paginas da aplicacao
│   └── App.tsx                   # Rotas e setup principal
├── firestore.rules                # Regras de seguranca Firestore
├── firestore.indexes.json         # Indices Firestore
├── .env.local                     # Variaveis de ambiente (NAO commitar)
├── tsconfig.json                  # Configuracao TypeScript
├── craco.config.js                # Configuracao CRACO (aliases)
└── package.json                   # Dependencias e scripts
```

---

## Roles e Permissoes

### Roles disponiveis

| Role | Descricao | Nivel de acesso |
|------|-----------|-----------------|
| `admin` | Administrador | Acesso total ao sistema |
| `secretary` | Secretario(a) | Gestao de membros e conteudo |
| `leader` | Lider | Eventos e pedidos de oracao |
| `member` | Membro | Acesso basico autenticado |

### Verificando permissoes no codigo

```typescript
import { useAuth } from '@/presentation/hooks/useAuth';

const MeuComponente = () => {
  const { user, isAdmin, isSecretary } = useAuth();

  if (!isAdmin()) {
    return <div>Acesso negado</div>;
  }

  return <div>Conteudo administrativo</div>;
};
```

### Permissoes granulares

```typescript
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

const temPermissao = user?.permissions?.some(p =>
  p.module === SystemModule.MEMBERS &&
  p.actions.includes(PermissionAction.EDIT)
);
```

---

## Dependencias Principais

| Pacote | Versao | Uso |
|--------|--------|-----|
| React | 19 | Framework UI |
| React Router | v6 | Roteamento (data router API) |
| Firebase | 12 | Backend (Auth, Firestore, Storage, Functions) |
| tsyringe | - | Injecao de dependencia |
| Tailwind CSS | - | Estilizacao utility-first |
| Chart.js | - | Graficos e relatorios |
| Lucide React | - | Biblioteca de icones |
| React Hot Toast | - | Notificacoes toast |
| date-fns | - | Manipulacao de datas |
| docx | - | Geracao de documentos Word |
