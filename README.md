# Church Management

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.9-orange?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss)

**Sistema completo de gestao para igrejas**

Clean Architecture | Domain-Driven Design | Firebase

</div>

---

## Sobre

Sistema de gerenciamento para igrejas com modulos para membros, eventos, financas, assistencia social, conteudo e administracao. Construido com React 19, TypeScript e Firebase seguindo Clean Architecture e DDD.

## Quick Start

```bash
git clone https://github.com/JohnPitter/church-management.git
cd church-management
npm install
cp .env.example .env.local   # Configure suas credenciais Firebase
npm start                     # http://localhost:3000
```

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm start` | Dev server |
| `npm test` | Testes em watch mode |
| `npm run build` | Build de producao |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificacao TypeScript |
| `npm run deploy` | Deploy completo |

## Funcionalidades

| Modulo | Descricao |
|--------|-----------|
| Membros | Cadastro, batismo, status, historico |
| Eventos | Agendamento, calendario, check-in |
| Financas | Igreja, departamentos e ONG |
| Assistencia Social | Assistidos, fichas, profissionais |
| Conteudo | Blog, devocionais, transmissoes |
| Administracao | Usuarios, permissoes, logs, backups |

## Documentacao

Para detalhes completos sobre arquitetura, modulos, deploy e mais, consulte a [documentacao tecnica](docs/README.md):

| Documento | Descricao |
|-----------|-----------|
| [Arquitetura](docs/architecture.md) | Clean Architecture, DDD, camadas e padroes |
| [Modulos](docs/modules.md) | 8 modulos DDD com servicos e entidades |
| [CI/CD Pipeline](docs/ci-cd.md) | GitHub Actions, jobs e deploy automatico |
| [Firebase](docs/firebase.md) | Firestore, Cloud Functions, Storage e regras |
| [Permissoes](docs/permissions.md) | RBAC com 6 papeis, 26 modulos e 5 acoes |
| [Desenvolvimento](docs/development.md) | Setup, workflow, padroes e troubleshooting |

## Licenca

Projeto privado e proprietario.
