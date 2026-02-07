# Documentacao - Church Management System

Documentacao tecnica completa do sistema de gestao para igrejas.

---

## Indice

| Documento | Descricao |
|-----------|-----------|
| [Arquitetura](architecture.md) | Clean Architecture, DDD, camadas, padroes de design, state management |
| [Modulos](modules.md) | Referencia dos 8 modulos DDD com sub-modulos, servicos e entidades |
| [CI/CD Pipeline](ci-cd.md) | GitHub Actions, jobs, secrets, deploy automatico e preview de PRs |
| [Firebase](firebase.md) | Configuracao, Firestore, Cloud Functions, Storage, regras de seguranca |
| [Permissoes](permissions.md) | RBAC com 6 papeis, 26 modulos, 5 acoes, overrides por usuario |
| [Desenvolvimento](development.md) | Guia de setup, comandos, workflow, padroes de UX, troubleshooting |

---

## Visao Geral da Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Presentation │────►│    Domain    │◄────│     Data     │
│ React, Hooks │     │  Entities,   │     │  Firebase    │
│ Contexts     │     │  Interfaces  │     │  Repos       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                          ┌───────▼───────┐
                                          │Infrastructure │
                                          │ DI, Config    │
                                          └───────────────┘
```

## Stack Tecnologica

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| React | 19 | UI framework |
| TypeScript | 4.9 | Linguagem |
| Firebase | 12.9 | Backend (Auth, Firestore, Storage, Functions, Hosting) |
| Tailwind CSS | 3 | Estilizacao |
| React Router | v6 | Roteamento (data router API) |
| Chart.js | - | Graficos e relatorios |
| React Hot Toast | 2.5 | Notificacoes toast |
| tsyringe | - | Injecao de dependencia |
| Jest + RTL | - | Testes |
| GitHub Actions | - | CI/CD |

## Numeros do Projeto

| Metrica | Valor |
|---------|-------|
| Arquivos fonte | 290 |
| Arquivos de teste | 108 |
| Linhas de codigo | ~165k |
| Modulos DDD | 8 |
| Paginas | 58 |
| Componentes | 54 |
| Colecoes Firestore | 20+ |
| Cloud Functions | 4 |
| Papeis de usuario | 6 |
| Modulos de permissao | 26 |

## Links Rapidos

- **Repositorio**: [GitHub](https://github.com/JohnPitter/church-management)
- **Producao**: [church-management-ibc.web.app](https://church-management-ibc.web.app)
- **CI/CD**: [GitHub Actions](https://github.com/JohnPitter/church-management/actions)
