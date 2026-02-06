# Church Management

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**Sistema completo de gestao para igrejas**

*Clean Architecture, Domain-Driven Design e Firebase*

[Instalacao](#instalacao) •
[Funcionalidades](#funcionalidades) •
[Arquitetura](#arquitetura) •
[Comandos](#comandos) •
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

```
Presentation  -->  Domain (interfaces)  <--  Data (implementacoes)  <--  Infrastructure
   React           Entidades, repos          Firebase repos              DI, configs
   Hooks           Regras de negocio         Mappers
   Contexts
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
| Backend | Firebase 12 (Auth, Firestore, Storage, Functions, Hosting) |
| Linguagem | TypeScript 4.9 |
| Build | CRACO |
| Testes | Jest, React Testing Library |
| Regiao | `southamerica-east1` (Sao Paulo) |

### Modulos

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

Cada modulo segue:

```
modulo/
  domain/entities/          # Regras de negocio
  application/services/     # Casos de uso
  presentation/components/  # UI
  index.ts                  # API publica
```

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
    components/          # 30 componentes reutilizaveis
    contexts/            # AuthContext, SettingsContext, NotificationContext
    hooks/               # useAuth, usePermissions, useEvents, etc.
    pages/               # 58 paginas
  types/                 # Definicoes de tipos globais
functions/               # Cloud Functions (southamerica-east1)
firestore.rules          # Regras de seguranca Firestore
```

---

## Cloud Functions

Todas rodam em `southamerica-east1`. Definidas em `functions/src/index.ts`:

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
| Arquivos fonte | 291 |
| Arquivos de teste | 110 |
| Linhas de codigo | ~103k |
| Modulos DDD | 8 |
| Paginas | 58 |
| Componentes | 30 |
| Dependencias | 34 prod / 10 dev |

---

## Licenca

Projeto privado e proprietario.

---

## Suporte

- **Issues:** [GitHub Issues](https://github.com/JohnPitter/church-management/issues)
