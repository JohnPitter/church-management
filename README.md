# Church Management System

Sistema completo de gestao para igrejas, construido com Clean Architecture, React 19 e Firebase 12. Gerencia membros, eventos, financas, assistencia social, conteudo e muito mais.

## Numeros do Projeto

| Metrica | Valor |
|---|---|
| Arquivos fonte | 291 |
| Arquivos de teste | 110 |
| Linhas de codigo | ~103k |
| Modulos DDD | 8 |
| Paginas | 58 |
| Componentes | 30 |
| Dependencias | 34 prod / 10 dev |

## Stack Tecnologico

| Camada | Tecnologia |
|---|---|
| UI | React 19, Tailwind CSS, Lucide React, Chart.js |
| Roteamento | React Router v6 (data router API) |
| Backend | Firebase 12 (Auth, Firestore, Storage, Functions, Hosting) |
| Linguagem | TypeScript 4.9 |
| Build | CRACO (Create React App Configuration Override) |
| DI | tsyringe (moderno) + container manual (legado) |
| Regiao | `southamerica-east1` (Sao Paulo) |

## Modulos

```
modules/
  shared-kernel/         # EventBus, DI, ModuleRegistry
  church-management/     # Membros, eventos, visitantes, oracoes, devocionais
  content-management/    # Blog, midia, transmissoes, paginas publicas
  financial/             # Financas da igreja, departamentos, ONG
  assistance/            # Assistidos, fichas, profissionais, pedidos de ajuda
  analytics/             # Dashboards e relatorios
  ong-management/        # Funcionalidades especificas de ONG
  user-management/       # Usuarios e permissoes
```

Cada modulo segue a estrutura:
```
modulo/
  domain/entities/       # Regras de negocio
  application/services/  # Casos de uso
  presentation/components/  # UI
  index.ts               # API publica
```

## Arquitetura

```
Presentation  -->  Domain (interfaces)  <--  Data (implementacoes)  <--  Infrastructure
   React           Entidades, repos          Firebase repos              DI, configs
   Hooks           Regras de negocio         Mappers
   Contexts
```

**Principios:**
- Clean Architecture com inversao de dependencia
- Domain-Driven Design com modulos isolados
- EventBus para comunicacao entre modulos (nunca import direto)
- Repository pattern para todo acesso a dados
- RBAC (Role-Based Access Control) com permissoes granulares

## Papeis e Permissoes

| Papel | Acesso |
|---|---|
| `admin` | Acesso total, gestao de usuarios, configuracoes |
| `secretary` | Membros, conteudo, eventos |
| `leader` | Eventos, pedidos de oracao |
| `member` | Acesso basico autenticado |

Permissoes granulares por modulo (`users`, `members`, `events`, `blog`, `financial`, `assistance`) e acao (`view`, `create`, `edit`, `delete`, `approve`, `export`).

## Configuracao

### Pre-requisitos

- Node.js 16+
- npm 7+
- Firebase CLI (`npm install -g firebase-tools`)
- Projeto Firebase configurado

### Instalacao

```bash
git clone <repository-url>
cd church-management-new
npm install
```

### Variaveis de Ambiente

Crie `.env.local` na raiz:

```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

### Firebase

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
npm run setup:indexes
```

## Comandos

```bash
npm start                  # Dev server (localhost:3000)
npm test                   # Testes em modo watch
npm test -- --coverage     # Testes com cobertura
npm test -- --watchAll=false  # Testes modo CI
npm run build              # Build de producao
npm run lint               # ESLint
npm run lint:fix           # Auto-fix ESLint
npm run typecheck          # Verificacao TypeScript
npm run deploy             # Deploy completo (lint + typecheck + build + Firebase)
npm run deploy:preview     # Deploy em canal preview
npm run deploy:production  # Deploy em producao
```

## Estrutura de Pastas

```
src/
  config/                # Configuracao Firebase
  domain/                # Entidades e interfaces de dominio
  data/                  # Implementacoes de repositorios (Firebase)
  infrastructure/        # Container DI, servicos externos
  modules/               # Modulos DDD (ver secao Modulos)
  presentation/
    components/          # 30 componentes reutilizaveis
    contexts/            # AuthContext, SettingsContext, NotificationContext
    hooks/               # useAuth, usePermissions, useEvents, etc.
    pages/               # 58 paginas
  types/                 # Definicoes de tipos globais
functions/               # Cloud Functions (southamerica-east1)
firestore.rules          # Regras de seguranca
firestore.indexes.json   # Indices do Firestore
craco.config.js          # Configuracao de build (path aliases)
```

## Cloud Functions

Todas rodam em `southamerica-east1`. Definidas em `functions/src/index.ts`:

- `createUserAccount` - Cria usuario no Auth + Firestore (admin)
- `deleteUserAccount` - Remove usuario do Auth + Firestore (admin)
- `uploadStreamThumbnail` - Upload de thumbnails de transmissao
- `uploadProfilePhoto` - Upload de fotos de perfil

## Testes

Testes colocalizados em pastas `__tests__` junto ao codigo fonte. Usa Jest + React Testing Library.

```bash
npm test                       # Watch mode
npm test -- --coverage         # Relatorio de cobertura
npm test -- --watchAll=false   # Execucao unica (CI)
```

## Licenca

Projeto privado e proprietario.
