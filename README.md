# Church Management

Uma aplicação completa para gerenciamento de igrejas, construída com princípios de Clean Architecture, React e Firebase. Este sistema fornece ferramentas para gerenciar membros, eventos, finanças, programas de assistência social e publicação de conteúdo.

## Funcionalidades

### Módulos Principais

- **Gestão da Igreja**
  - Base de dados de membros com rastreamento de batismo e status
  - Agendamento de eventos e calendário
  - Registro e acompanhamento de visitantes
  - Gestão de pedidos de oração
  - Devocionais diários

- **Gestão de Conteúdo**
  - Blog e comunicados
  - Biblioteca de mídia
  - Gerenciamento de transmissões ao vivo
  - Configuração de páginas públicas
  - Sistema simplificado de configuração de home page com 3 estilos profissionais (Canva, Apple, Enterprise)

- **Gestão Financeira**
  - Controle de finanças da igreja
  - Orçamentos de departamentos
  - Gestão financeira de ONGs
  - Relatórios de transações e análises

- **Assistência Social**
  - Base de dados de assistidos
  - Fichas de acompanhamento
  - Gestão de pedidos de ajuda
  - Coordenação de serviços profissionais

- **Análises e Relatórios**
  - Dashboard com métricas principais
  - Geração de relatórios customizados
  - Capacidades de exportação de dados

- **Administração**
  - Gestão de usuários com controle de acesso baseado em papéis
  - Sistema de permissões granulares
  - Configurações e ajustes do sistema
  - Logs de auditoria e monitoramento

## Stack Tecnológico

### Frontend
- **React 19** - Framework de UI
- **TypeScript** - Segurança de tipos e experiência do desenvolvedor
- **React Router v6** - Roteamento client-side
- **Tailwind CSS** - Estilização utility-first
- **Chart.js** - Visualização de dados
- **Lucide React** - Biblioteca de ícones
- **React Hot Toast** - Notificações

### Backend
- **Firebase 12**
  - Authentication - Autenticação de usuários e gestão de sessões
  - Firestore - Banco de dados NoSQL
  - Cloud Storage - Upload de arquivos
  - Cloud Functions - Operações server-side
  - Hosting - Hospedagem de site estático

### Arquitetura
- **Clean Architecture** - Design em camadas com inversão de dependência
- **Domain-Driven Design** - Organização modular por domínios de negócio
- **Dependency Injection** - tsyringe para DI moderna, container manual para legado
- **Event-Driven** - EventBus para comunicação desacoplada entre módulos

## Pré-requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior
- Conta e projeto no Firebase
- Firebase CLI (`npm install -g firebase-tools`)

## Começando

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd church-management-new
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Ambiente

Crie um arquivo `.env.local` no diretório raiz:

```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

### 4. Inicializar Firebase

```bash
firebase login
firebase use --add
```

Selecione seu projeto Firebase quando solicitado.

### 5. Deploy das Regras e Índices do Firestore

```bash
firebase deploy --only firestore:rules
npm run setup:indexes
```

### 6. Deploy das Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 7. Iniciar Servidor de Desenvolvimento

```bash
npm start
```

A aplicação abrirá em `http://localhost:3000`.

## Desenvolvimento

### Scripts Disponíveis

```bash
npm start              # Inicia servidor de desenvolvimento
npm test               # Executa testes em modo watch
npm run build          # Build de produção
npm run lint           # Executa ESLint
npm run lint:fix       # Corrige problemas do ESLint automaticamente
npm run typecheck      # Verificação de tipos do TypeScript
```

### Estrutura do Projeto

```
src/
├── config/              # Configuração do Firebase e app
├── domain/              # Entidades de domínio e interfaces
├── data/                # Implementações de repositórios
├── infrastructure/      # Container DI e serviços externos
├── modules/             # Módulos de funcionalidades (DDD)
│   ├── shared-kernel/   # Utilitários cross-module
│   ├── church-management/
│   ├── content-management/
│   ├── financial/
│   ├── assistance/
│   ├── analytics/
│   └── ong-management/
├── presentation/        # Componentes React e UI
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Provedores de React Context
│   ├── hooks/           # Hooks customizados
│   └── pages/           # Componentes de página
└── types/               # Definições de tipos TypeScript
```

### Estrutura de Módulos

Cada módulo segue Clean Architecture:

```
nome-do-modulo/
├── domain/
│   └── entities/        # Regras de negócio e modelos
├── application/
│   └── services/        # Casos de uso e lógica de negócio
├── presentation/
│   └── components/      # Componentes de UI
└── index.ts             # API pública
```

## Papéis de Usuário

- **Admin** - Acesso completo ao sistema, gestão de usuários, configuração do sistema
- **Secretary** - Gestão de conteúdo e membros, agendamento de eventos
- **Leader** - Gestão de eventos, pedidos de oração
- **Member** - Acesso básico de usuário autenticado

## Segurança

### Controle de Acesso Baseado em Papéis (RBAC)

O sistema implementa RBAC abrangente com:
- Papéis de usuário (admin, secretary, leader, member)
- Permissões granulares por módulo e ação
- Aplicação de regras de segurança do Firestore
- Integração com Firebase Authentication

### Proteção de Dados

- Validação e sanitização de inputs
- Regras de segurança do Firestore
- Upload seguro de arquivos via Cloud Functions
- Workflow de aprovação de usuários
- Logging de auditoria

## Deploy

### Deploy de Preview

```bash
npm run deploy:preview
```

### Deploy de Produção

```bash
npm run deploy:production
```

Ou use o script completo de deployment:

```bash
npm run deploy
```

Isso executa:
1. Linting
2. Verificação de tipos
3. Build de produção
4. Deploy no Firebase (hosting, functions, rules)

## Configuração do Firebase

### Região
Todos os serviços Firebase estão configurados para `southamerica-east1` (São Paulo, Brasil) para conformidade com residência de dados.

### Cloud Functions

Funções principais em `functions/src/index.ts`:
- `createUserAccount` - Criação de usuário (apenas admin)
- `deleteUserAccount` - Exclusão de usuário (apenas admin)
- `uploadStreamThumbnail` - Thumbnails de transmissões ao vivo
- `uploadProfilePhoto` - Upload de fotos de perfil

### Coleções do Firestore

Principais coleções:
- `/users` - Usuários do sistema com papéis e permissões
- `/members` - Membros da igreja
- `/events` - Eventos e calendário da igreja
- `/blogPosts` - Artigos do blog
- `/prayerRequests` - Pedidos de oração
- `/assistidos` - Beneficiários de assistência
- `/financial` - Transações financeiras
- E mais...

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm test -- --coverage

# Executar testes uma vez (modo CI)
npm test -- --watchAll=false
```

Os testes estão organizados em pastas `__tests__` junto aos arquivos de origem.

## Contribuindo

### Princípios de Desenvolvimento

1. **Clean Architecture** - Manter separação de camadas
2. **Performance** - Considerar notação Big O para algoritmos
3. **Segurança** - Seguir práticas recomendadas da OWASP
4. **Testes** - Seguir a pirâmide de testes
5. **Documentação** - Atualizar CHANGELOG.md para mudanças significativas
6. **Qualidade de Código** - Lint, verificação de tipos e remoção de imports não utilizados antes de commitar

Veja [CLAUDE.md](CLAUDE.md) para diretrizes detalhadas de desenvolvimento.

## Documentação

- [CLAUDE.md](CLAUDE.md) - Guia de desenvolvimento para assistentes de IA
- [CHANGELOG.md](CHANGELOG.md) - Histórico de versões e mudanças

## Licença

Este projeto é privado e proprietário.

## Suporte

Para problemas ou questões, entre em contato com a equipe de desenvolvimento.
