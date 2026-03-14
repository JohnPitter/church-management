<div align="center">

# Church Management

**Sistema completo de gestao para igrejas e ONGs — cadastro, financas e assistencia social em um so lugar.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.9-DD2C00?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#)

[Funcionalidades](#-funcionalidades) · [Arquitetura](#-arquitetura) · [Modulos](#-modulos) · [Quick Start](#-quick-start) · [Tech Stack](#-tech-stack)

</div>

---

## O que e o Church Management?

Church Management e um **sistema web completo** para administracao de igrejas e ONGs. Ele centraliza o gerenciamento de membros, eventos, financas, assistencia social, conteudo e permissoes em uma unica plataforma. Construido com **React 19**, **TypeScript** e **Firebase**, seguindo **Clean Architecture** e **Domain-Driven Design**.

Funciona tanto para **igrejas** quanto para **ONGs** — basta escolher o tipo de organizacao no setup inicial.

---

## Funcionalidades

| Categoria | O que voce tem |
|---|---|
| **Membros** | Cadastro completo, historico de batismo, status, exportacao CSV/XLS/DOCX |
| **Eventos** | Agendamento, calendario, check-in, inscricao publica anonima |
| **Financas Igreja** | Receitas, despesas, doacoes, dizimos, ofertas, categorias, relatorios |
| **Financas ONG** | Sistema financeiro separado com categorias e relatorios proprios |
| **Caixinhas** | Departamentos financeiros com depositos, saques e saldo independente |
| **Assistencia Social** | Cadastro de assistidos, familiares, fichas de acompanhamento, prontuarios |
| **Agendamentos** | Marcacao de consultas com profissionais, horarios configurados por profissional |
| **Profissionais** | Psicologos, advogados, nutricionistas, fisioterapeutas — com horarios e especialidades |
| **Blog** | Publicacao de artigos com editor rich-text |
| **Devocionais** | Devocionais diarios com versiculo do dia automatico |
| **Transmissoes** | Gerenciamento de lives e transmissoes |
| **Projetos** | Acompanhamento de projetos sociais |
| **Forum** | Topicos de discussao com prioridade e tags |
| **Pedidos de Oracao** | Membros podem enviar e acompanhar pedidos |
| **Visitantes** | Registro de visitantes com historico de visitas |
| **Permissoes** | RBAC granular — 6 papeis, 26 modulos, 5 acoes por modulo |
| **Usuarios** | Cadastro, aprovacao, papeis customizados |
| **Logs** | Auditoria completa de operacoes do sistema |
| **Backups** | Exportacao de dados via interface admin |
| **Notificacoes** | Sistema de notificacoes internas |
| **Pagina Publica** | Home customizavel, pagina de contato, pagina de doacoes |
| **Multi-tema** | Cores primaria/secundaria configuraveis por organizacao |
| **i18n Ready** | Preparado para internacionalizacao |

---

## Arquitetura

```
Browser ──> Firebase Hosting ──> React SPA ──> Firebase Services
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              Firestore       Cloud Functions    Storage
            (banco de dados)   (backend logic)   (arquivos)
```

### Como as camadas se conectam

| Camada | Responsabilidade | Tecnologia |
|---|---|---|
| **Presentation** | Paginas, componentes, hooks, contextos | React + Tailwind |
| **Application** | Servicos, casos de uso, orquestracao | TypeScript Services |
| **Domain** | Entidades, regras de negocio, validacoes | TypeScript Entities |
| **Infrastructure** | Repositorios Firebase, APIs externas | Firestore + Firebase SDK |

O projeto segue **Clean Architecture** com **inversao de dependencia** — camadas internas nao conhecem as externas. Cada modulo tem suas proprias entidades, servicos e repositorios.

---

## Modulos

```
src/modules/
├── church-management/          # Membros, eventos, departamentos, oracoes, visitantes, devocionais
├── content-management/         # Blog, forum, lives, projetos, home builder, paginas publicas
├── assistance/                 # Assistidos, agendamentos, profissionais, fichas, prontuarios
├── financial/                  # Financas igreja + financas ONG (sistemas independentes)
├── user-management/            # Autenticacao, permissoes, papeis
├── ong-management/             # Configuracoes especificas de ONG
├── shared-kernel/              # DI container, event bus, logging, migracoes, module registry
└── analytics/                  # Tracking e metricas
```

| Modulo | Arquivos | Descricao |
|---|---|---|
| **church-management** | 59 | Core da igreja — membros, eventos, departamentos, oracoes, visitantes, devocionais |
| **content-management** | 46 | CMS — blog, forum, transmissoes, projetos, home builder, paginas publicas |
| **assistance** | 40 | Assistencia social — assistidos, agendamentos, profissionais, anamneses |
| **shared-kernel** | 23 | Infraestrutura compartilhada — DI, event bus, logging, migracoes |
| **user-management** | 19 | Auth, permissoes RBAC, papeis customizados |
| **financial** | 17 | Dois sistemas financeiros independentes (igreja + ONG), caixinhas |
| **ong-management** | 6 | Configuracoes e settings de ONG |
| **analytics** | 3 | Tracking de uso e metricas |

---

## Quick Start

### Pre-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase com projeto configurado

### Desenvolvimento

```bash
# Clone
git clone https://github.com/JohnPitter/church-management.git
cd church-management

# Instale as dependencias
npm install

# Configure o Firebase
cp .env.example .env.local
# Edite .env.local com suas credenciais Firebase

# Inicie o servidor de desenvolvimento
npm start

# Acesse: http://localhost:3000
```

### Producao

```bash
# Build
npm run build

# Deploy para Firebase
npm run deploy
```

---

## Tech Stack

<div align="center">

| Camada | Tecnologia |
|:---:|:---:|
| **Frontend** | React 19, TypeScript 4.9, Tailwind CSS 3 |
| **Roteamento** | React Router v6 |
| **Estado** | React Context + Custom Hooks |
| **Backend** | Firebase Cloud Functions |
| **Banco de Dados** | Cloud Firestore |
| **Autenticacao** | Firebase Auth (email/senha + Google OAuth) |
| **Storage** | Firebase Storage |
| **Hosting** | Firebase Hosting |
| **Testes** | Jest + React Testing Library |
| **CI/CD** | GitHub Actions |

</div>

---

## Estrutura do Projeto

```
church-management/
  package.json
  tsconfig.json
  firebase.json
  .github/workflows/              # CI/CD pipeline

  src/
    modules/                      # Modulos DDD (dominio + aplicacao + infraestrutura)
      church-management/          # Membros, eventos, departamentos, visitantes, devocionais
      content-management/         # Blog, forum, lives, projetos, home builder
      assistance/                 # Assistidos, agendamentos, profissionais, fichas
        assistencia/              #   Entidades, servicos e repos de assistencia
        assistidos/               #   Cadastro e gestao de assistidos
        agendamento/              #   Agendamento de consultas
        professional/             #   Gestao de profissionais
        help-requests/            #   Pedidos de ajuda
      financial/                  # Sistemas financeiros
        church-finance/           #   Financas da igreja (receitas, despesas, doacoes)
        ong-finance/              #   Financas da ONG (sistema independente)
      user-management/            # Auth + permissoes RBAC
      ong-management/             # Settings de ONG
      shared-kernel/              # Event bus, DI, logging, migracoes
      analytics/                  # Tracking

    presentation/                 # Camada de apresentacao
      pages/                      # ~97 paginas (admin, publica, configuracoes)
      components/                 # ~99 componentes (modais, charts, layout, forms)
      contexts/                   # AuthContext, SettingsContext, PermissionsContext
      hooks/                      # useAuth, usePermissions, useEvents, useTheme
      utils/                      # dateUtils, prontuarioExport, formatters

    config/                       # Firebase config
    utils/                        # Utilitarios compartilhados
    services/                     # Servicos globais (logging)

  docs/                           # Documentacao tecnica
    architecture.md               # Clean Architecture + DDD
    modules.md                    # Detalhamento dos modulos
    firebase.md                   # Firestore, Functions, Storage
    permissions.md                # RBAC — 6 papeis, 26 modulos, 5 acoes
    ci-cd.md                      # GitHub Actions pipeline
    development.md                # Guia de desenvolvimento
```

---

## Variaveis de Ambiente

| Variavel | Descricao | Obrigatoria |
|---|---|---|
| `REACT_APP_FIREBASE_API_KEY` | Chave da API do Firebase | Sim |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Dominio de autenticacao | Sim |
| `REACT_APP_FIREBASE_PROJECT_ID` | ID do projeto Firebase | Sim |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Bucket do Storage | Sim |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | ID do sender FCM | Sim |
| `REACT_APP_FIREBASE_APP_ID` | App ID do Firebase | Sim |

---

## Comandos

| Comando | Descricao |
|---|---|
| `npm start` | Servidor de desenvolvimento (localhost:3000) |
| `npm test` | Testes em watch mode (Jest) |
| `npm run build` | Build de producao |
| `npm run lint` | Verificacao ESLint |
| `npm run lint:fix` | Correcao automatica de lint |
| `npm run typecheck` | Verificacao de tipos TypeScript |
| `npm run deploy` | Deploy completo para Firebase |
| `npm run setup:indexes` | Configurar indices do Firestore |
| `npm run migrate:permissions` | Migrar sistema de permissoes |

---

## Documentacao

| Documento | Descricao |
|---|---|
| [Arquitetura](docs/architecture.md) | Clean Architecture, DDD, camadas e padroes |
| [Modulos](docs/modules.md) | 8 modulos DDD com servicos e entidades |
| [CI/CD Pipeline](docs/ci-cd.md) | GitHub Actions, jobs e deploy automatico |
| [Firebase](docs/firebase.md) | Firestore, Cloud Functions, Storage e regras |
| [Permissoes](docs/permissions.md) | RBAC com 6 papeis, 26 modulos e 5 acoes |
| [Desenvolvimento](docs/development.md) | Setup, workflow, padroes e troubleshooting |

---

<div align="center">

**Built with React and TypeScript by [@JohnPitter](https://github.com/JohnPitter)**

</div>
