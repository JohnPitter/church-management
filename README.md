# Church Management

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.9-orange?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**Sistema completo de gestao para igrejas**

*Clean Architecture, Domain-Driven Design e Firebase*

[Instalacao](#instalacao) |
[Funcionalidades](#funcionalidades) |
[Arquitetura](#arquitetura) |
[Comandos](#comandos) |
[Deploy](#deploy)

</div>

---

## Overview

Sistema de gerenciamento de igrejas com modulos para membros, eventos, financas, assistencia social, conteudo e muito mais. Construido com React 19, TypeScript e Firebase 12 seguindo Clean Architecture e DDD.

**O que voce consegue:**

- **Membros** - Cadastro, batismo, status, historico
- **Eventos** - Agendamento, calendario, check-in
- **Financas** - Igreja, departamentos e ONG
- **Assistencia Social** - Assistidos, fichas, profissionais
- **Conteudo** - Blog, devocionais, transmissoes ao vivo
- **Administracao** - Usuarios, permissoes, logs, backups

---

## Instalacao

### Requisitos

| Requisito | Versao |
|-----------|--------|
| Node.js | 16+ |
| npm | 7+ |
| Firebase CLI | Latest |

### Setup

```bash
git clone https://github.com/JohnPitter/church-management.git
cd church-management
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

**Pronto!** Execute `npm start` e acesse `http://localhost:3000`

---

## Funcionalidades

| Modulo | Descricao |
|--------|-----------|
| **Gestao de Membros** | Cadastro completo, batismo, status, historico |
| **Eventos** | Agendamento, calendario, check-in de presenca |
| **Visitantes** | Registro, acompanhamento, conversao |
| **Pedidos de Oracao** | Criacao, acompanhamento, resposta |
| **Devocionais** | Publicacao diaria, leitura, progresso |
| **Blog** | Artigos, comunicados, midia |
| **Transmissoes** | Live streaming com thumbnails |
| **Financas da Igreja** | Transacoes, relatorios, graficos |
| **Financas de Departamento** | Orcamento por departamento |
| **Financas ONG** | Gestao financeira para ONGs |
| **Assistidos** | Cadastro de beneficiarios |
| **Fichas de Acompanhamento** | Prontuarios e evolucao |
| **Profissionais** | Coordenacao de servicos |
| **Projetos** | Gestao de projetos da igreja |
| **Permissoes** | RBAC granular por modulo e acao |
| **Dashboard** | Metricas, graficos, relatorios |
| **Backup** | Exportacao e restauracao de dados |
| **Logs** | Auditoria de acoes do sistema |

---

## Arquitetura

### Clean Architecture - Fluxo de Dependencias

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │  Hooks   │  │ Contexts │  │  Components   │  │
│  │  (58)    │  │ useAuth  │  │ Auth     │  │  Modals       │  │
│  │          │  │ usePerms │  │ Settings │  │  Forms        │  │
│  │          │  │ useTheme │  │ Confirm  │  │  Layouts (3)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │             │               │            │
│       └──────────────┴─────────────┴───────────────┘            │
│                              │                                  │
│                              │ usa interfaces                   │
│                              ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                        DOMAIN LAYER                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  Entities    │  │  Repository    │  │  Business Rules    │  │
│  │  User        │  │  Interfaces    │  │  Permission        │  │
│  │  Member      │  │  IUserRepo     │  │  Validation        │  │
│  │  Event       │  │  IMemberRepo   │  │  SystemModule      │  │
│  │  Department  │  │  IEventRepo    │  │  PermissionAction  │  │
│  │  Asset       │  │  ...           │  │  ...               │  │
│  └──────────────┘  └───────┬────────┘  └────────────────────┘  │
│                            │                                    │
│                            │ implementa                         │
│                            ▼                                    │
├─────────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Services (por modulo)                   │  │
│  │  MemberService  EventService  FinancialService  ...       │  │
│  │  VisitorService  DevotionalService  ProjectsService       │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│                              │ acessa dados via                 │
│                              ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               Firebase Repositories                       │  │
│  │  FirebaseUserRepo  FirebaseMemberRepo  FirebaseEventRepo  │  │
│  │  Mappers (Entity <-> Firestore Document)                  │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│                              │ conecta                          │
│                              ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │  DI Container│  │  Firebase     │  │  Cloud Functions  │     │
│  │  tsyringe    │  │  Config       │  │  (1st Gen, v1)    │     │
│  │  + manual    │  │  Auth/DB/     │  │  southamerica-    │     │
│  │              │  │  Storage      │  │  east1            │     │
│  └──────────────┘  └──────────────┘  └───────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Domain-Driven Design - Modulos

```
┌─────────────────────────────────────────────────────────────────┐
│                        modules/                                  │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐                    │
│  │  shared-kernel   │    │ church-management │                   │
│  │  ───────────────│    │  ────────────────│                    │
│  │  EventBus       │◄───│  members/        │                    │
│  │  DI Container   │    │  events/         │                    │
│  │  ModuleRegistry │    │  visitors/       │                    │
│  └────────┬────────┘    │  devotionals/    │                    │
│           │             │  prayer-requests/│                    │
│           │             │  home/           │                    │
│           │             └──────────────────┘                    │
│           │                                                      │
│           │  ┌──────────────────┐    ┌──────────────────┐       │
│           ├──│content-management│    │    financial      │       │
│           │  │  ────────────────│    │  ────────────────│       │
│           │  │  blog/           │    │  church-finance/ │       │
│           │  │  home-builder/   │    │  dept-finance/   │       │
│           │  │  home-settings/  │    │  ong-finance/    │       │
│           │  │  live-streaming/ │    └──────────────────┘       │
│           │  └──────────────────┘                                │
│           │                                                      │
│           │  ┌──────────────────┐    ┌──────────────────┐       │
│           ├──│   assistance     │    │  ong-management   │       │
│           │  │  ────────────────│    │  ────────────────│       │
│           │  │  assistidos/     │    │  volunteers/      │       │
│           │  │  fichas/         │    │  activities/      │       │
│           │  │  help-requests/  │    │  settings/        │       │
│           │  └──────────────────┘    └──────────────────┘       │
│           │                                                      │
│           │  ┌──────────────────┐    ┌──────────────────┐       │
│           └──│    analytics     │    │  user-management  │       │
│              │  ────────────────│    │  ────────────────│       │
│              │  dashboards/     │    │  permissions/     │       │
│              │  reports/        │    │  roles/           │       │
│              └──────────────────┘    └──────────────────┘       │
│                                                                  │
│  Cada modulo:  domain/entities/                                  │
│                application/services/                             │
│                presentation/components/                          │
│                index.ts (API publica)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Comunicacao entre Modulos

```
┌──────────┐     EventBus      ┌──────────┐
│ Modulo A │ ──── publish ───► │ Modulo B │
│          │ ◄── subscribe ─── │          │
└──────────┘                   └──────────┘
     ▲                              ▲
     │        Regra de Ouro         │
     └──── Nunca importar ──────────┘
           internals de outro
           modulo diretamente
```

### Seguranca - Duas Camadas

```
┌─────────────────────────────────────────────────┐
│              CAMADA 1: Firestore Rules           │
│  Barreira de seguranca (auth, approved, admin)   │
│  ~460 linhas, role-based, compact                │
│                                                   │
│  isAuthenticated() → isApproved() → isAdmin()    │
│  isOwner() → isDocOwner() → hasRole()            │
├─────────────────────────────────────────────────┤
│         CAMADA 2: App PermissionService          │
│  Logica de negocio granular                      │
│                                                   │
│  SystemModule × PermissionAction                 │
│  users.view  members.edit  events.create  ...    │
│  financial.export  assistance.approve  ...       │
└─────────────────────────────────────────────────┘
```

### Principios

| Principio | Implementacao |
|-----------|---------------|
| **Clean Architecture** | Camadas com inversao de dependencia |
| **Domain-Driven Design** | 8 modulos isolados por dominio |
| **Event-Driven** | EventBus para comunicacao entre modulos |
| **Repository Pattern** | Interfaces no dominio, Firebase na data |
| **RBAC** | Permissoes granulares por modulo e acao |
| **Dependency Injection** | tsyringe + container manual |

### Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 19, Tailwind CSS, Lucide React, Chart.js |
| Roteamento | React Router v6 (data router API) |
| Backend | Firebase 12.9 (Auth, Firestore, Storage, Functions, Hosting) |
| Linguagem | TypeScript 4.9 |
| Build | CRACO |
| Testes | Jest, React Testing Library |
| Notificacoes | React Hot Toast + ConfirmDialog (modal) |
| Regiao | `southamerica-east1` (Sao Paulo) |

---

## Papeis e Permissoes

| Papel | Acesso |
|-------|--------|
| `admin` | Acesso total, gestao de usuarios, configuracoes |
| `secretary` | Membros, conteudo, eventos |
| `leader` | Eventos, pedidos de oracao |
| `member` | Acesso basico autenticado |

Permissoes granulares por modulo (`users`, `members`, `events`, `blog`, `financial`, `assistance`) e acao (`view`, `create`, `edit`, `delete`, `approve`, `export`).

---

## Comandos

### Desenvolvimento

```bash
npm start              # Dev server (localhost:3000)
npm test               # Testes em modo watch
npm test -- --coverage # Testes com cobertura
npm run build          # Build de producao
```

### Qualidade

```bash
npm run lint           # ESLint
npm run lint:fix       # Auto-fix ESLint
npm run typecheck      # Verificacao TypeScript
```

### Deploy

```bash
npm run deploy             # Deploy completo (lint + typecheck + build + Firebase)
npm run deploy:preview     # Deploy em canal preview
npm run deploy:production  # Deploy em producao
```

---

## Estrutura do Projeto

```
src/
  config/                # Configuracao Firebase
  domain/                # Entidades e interfaces de dominio
  data/                  # Implementacoes de repositorios (Firebase)
  infrastructure/        # Container DI, servicos externos
  modules/               # 8 modulos DDD
  presentation/
    components/          # 54 componentes reutilizaveis
    contexts/            # AuthContext, SettingsContext, NotificationContext, ConfirmDialog
    hooks/               # useAuth, usePermissions, useEvents, useTheme, etc.
    pages/               # 58 paginas
  types/                 # Definicoes de tipos globais
functions/               # Cloud Functions (1st Gen, southamerica-east1)
firestore.rules          # Regras de seguranca Firestore (~460 linhas)
```

---

## Cloud Functions

Todas rodam em `southamerica-east1` usando **1st Gen** (`firebase-functions/v1`).

| Funcao | Descricao |
|--------|-----------|
| `createUserAccount` | Cria usuario no Auth + Firestore (admin) |
| `deleteUserAccount` | Remove usuario do Auth + Firestore (admin) |
| `uploadStreamThumbnail` | Upload de thumbnails de transmissao |
| `uploadProfilePhoto` | Upload de fotos de perfil |

---

## Numeros

| Metrica | Valor |
|---------|-------|
| Arquivos fonte | 290 |
| Arquivos de teste | 108 |
| Linhas de codigo | ~165k |
| Modulos DDD | 8 |
| Paginas | 58 |
| Componentes | 54 |
| Dependencias | 34 prod / 10 dev |

---

## Licenca

Projeto privado e proprietario.

---

## Suporte

- **Issues:** [GitHub Issues](https://github.com/JohnPitter/church-management/issues)
