# Arquitetura do Sistema

Documento de referencia da arquitetura do sistema de gestao de igrejas.

---

## Indice

1. [Clean Architecture](#clean-architecture)
2. [Detalhamento das Camadas](#detalhamento-das-camadas)
3. [Organizacao em Modulos (DDD)](#organizacao-em-modulos-ddd)
4. [Padroes de Comunicacao](#padroes-de-comunicacao)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Design Patterns Utilizados](#design-patterns-utilizados)

---

## Clean Architecture

O sistema segue os principios de **Clean Architecture** com 5 camadas bem definidas:

- **Presentation** - Componentes React, hooks, contexts
- **Domain** - Entidades, interfaces de repositorio, regras de negocio
- **Application** - Casos de uso e servicos de aplicacao
- **Data** - Implementacoes Firebase dos repositorios
- **Infrastructure** - Container de DI, configuracoes externas

### Regra de Dependencia

As camadas externas dependem das camadas internas, nunca o inverso (Inversao de Dependencia). A camada de Domain e o nucleo central e nao conhece nenhuma implementacao concreta.

```
+------------------------------------------------------------------+
|                        Infrastructure                             |
|  +------------------------------------------------------------+  |
|  |                         Data                                |  |
|  |  +------------------------------------------------------+  |  |
|  |  |                     Application                      |  |  |
|  |  |  +------------------------------------------------+  |  |  |
|  |  |  |                    Domain                       |  |  |  |
|  |  |  |                                                 |  |  |  |
|  |  |  |   Entities, Repository Interfaces,              |  |  |  |
|  |  |  |   Business Rules                                |  |  |  |
|  |  |  +------------------------------------------------+  |  |  |
|  |  |  Services, Use Cases                                  |  |  |
|  |  +------------------------------------------------------+  |  |
|  |  Firebase Repositories, Document Mappers                    |  |
|  +------------------------------------------------------------+  |
|  DI Container, Firebase Config, External Services                 |
+------------------------------------------------------------------+
```

### Fluxo de Dados

```
Presentation  --->  Domain (interfaces)  <---  Data (implementacoes)  <---  Infrastructure
     |                    ^                          |                           |
     |                    |                          |                           |
  React UI          Entidades e            Firebase Repos              DI Container,
  Hooks             Interfaces de          Firestore Mappers           Firebase Config
  Contexts          Repositorio
```

O fluxo segue a regra: componentes de apresentacao chamam servicos da camada Application, que utilizam interfaces do Domain. A camada Data fornece implementacoes concretas dessas interfaces usando Firebase, e a Infrastructure gerencia a injecao de dependencias.

---

## Detalhamento das Camadas

### 1. Presentation (`src/presentation/`)

Responsavel por toda a interface com o usuario.

| Recurso       | Quantidade | Localizacao                        |
|---------------|------------|------------------------------------|
| Pages         | 58         | `src/presentation/pages/`          |
| Components    | 54+        | `src/presentation/components/`     |
| Contexts      | 3 + 1      | `src/presentation/contexts/`       |
| Hooks         | 8          | `src/presentation/hooks/`          |

**Contexts:**
- `AuthContext` - Autenticacao, roles, permissoes do usuario
- `NotificationContext` - Notificacoes in-app (toast)
- `SettingsContext` - Configuracoes da igreja (nome, cores, pagamento, etc.)
- `ConfirmDialog` - Modal de confirmacao reutilizavel (substitui window.confirm)

**Hooks:**
- `useAuth` - Acesso ao contexto de autenticacao
- `usePermissions` - Verificacao de permissoes por modulo/acao
- `useAtomicPermissions` - Permissoes atomicas por modulo/acao (granular)
- `useTheme` - Tema da aplicacao (claro/escuro)
- `useEvents` - Dados de eventos com listeners em tempo real
- `useAdminCheck` - Verificacao rapida de role admin
- `useMemberService` - Instancia do MemberService
- `useNotificationActions` - Acoes de notificacao (marcar como lida, etc.)

### 2. Domain (`src/domain/` + `src/modules/*/domain/`)

Nucleo do sistema com entidades e regras de negocio. Nao possui dependencia de frameworks.

**Entidades globais** (`src/domain/entities/`):
- `User` - Usuarios do sistema com roles e status
- `Member` - Membros da igreja com dados completos
- `Event` - Eventos (cultos, reunioes, eventos especiais)
- `Permission` - Sistema RBAC com 26 modulos e 5 acoes

**Entidades por modulo** (`src/modules/*/domain/entities/`):
- `Assistido` - Beneficiarios de programas sociais
- `Assistencia` - Casos de assistencia social
- `FichaAcompanhamento` - Fichas de acompanhamento
- `HelpRequest` - Solicitacoes de ajuda
- `ProfessionalHelpRequest` - Solicitacoes para profissionais
- `Financial` - Transacoes, categorias, doacoes
- `HomeBuilder` - Layouts e componentes da home
- `ONG` - Configuracoes e dados da ONG

**Interfaces de Repositorio** (`src/domain/repositories/`):
- `IUserRepository` - Operacoes de usuario
- `IMemberRepository` - Operacoes de membro
- `IEventRepository` - Operacoes de evento

### 3. Application (`src/modules/*/application/`)

Servicos que orquestram regras de negocio. Cada modulo possui seus proprios servicos.

**Exemplos de servicos:**

| Modulo               | Servico                      | Responsabilidade                      |
|----------------------|------------------------------|---------------------------------------|
| church-management    | MemberService                | CRUD de membros, estatisticas         |
| church-management    | DevotionalService            | Devocionais diarios                   |
| church-management    | VisitorService               | Registro e acompanhamento             |
| church-management    | PrayerRequestService         | Pedidos de oracao                     |
| church-management    | AssetService                 | Patrimonio da igreja                  |
| financial            | ChurchFinancialService       | Transacoes, orcamentos, relatorios    |
| financial            | DepartmentFinancialService   | Financas por departamento             |
| financial            | ONGFinancialService          | Financas da ONG                       |
| assistance           | AssistidoService             | Gestao de beneficiarios               |
| assistance           | FichaAcompanhamentoService   | Fichas de acompanhamento              |
| assistance           | HelpRequestService           | Solicitacoes de ajuda                 |
| content-management   | HomeBuilderService           | Construtor da pagina inicial          |
| content-management   | ProjectsService              | Gestao de projetos                    |
| content-management   | LeadershipService            | Gestao de lideranca                   |
| user-management      | PermissionService            | RBAC e permissoes granulares          |
| analytics            | BackupService                | Backup e restauracao de dados         |

### 4. Data (`src/data/` + `src/modules/*/infrastructure/repositories/`)

Implementacoes concretas dos repositorios usando Firebase/Firestore.

```
Domain Interface                    Firebase Implementation
---------------------------------------------------------
IUserRepository          --->       FirebaseUserRepository
IMemberRepository        --->       FirebaseMemberRepository
IEventRepository         --->       FirebaseEventRepository
IAssistidoService        --->       FirebaseAssistidoRepository
INotificationRepository  --->       FirebaseNotificationRepository
```

Cada repositorio Firebase:
- Converte entre entidades de dominio e documentos Firestore
- Gerencia Timestamps do Firestore (conversao Date <-> Timestamp)
- Implementa queries com filtros, ordenacao e paginacao
- Trata erros e loga operacoes

### 5. Infrastructure (`src/infrastructure/`)

Configuracoes externas e injecao de dependencias.

**DI Container Manual** (`src/infrastructure/di/container.ts`):
- Usado pelo codigo legado
- Padrao Singleton
- Registra repositorios, servicos e use cases manualmente
- Exporta getters tipados: `getUserRepository()`, `getMemberRepository()`, etc.

```typescript
// Uso do container manual
import { getUserRepository } from '@/infrastructure/di/container';
const userRepo = getUserRepository();
```

**DI Container tsyringe** (`src/modules/shared-kernel/di/Container.ts`):
- Usado pelos modulos mais novos
- Wrapper sobre o tsyringe
- Suporta singleton, transient e instance
- Resolucao por token string

```typescript
// Uso do container tsyringe
import { DIContainer } from '@shared-kernel/di/Container';
DIContainer.registerSingleton('IMemberService', MemberService);
const service = DIContainer.resolve<IMemberService>('IMemberService');
```

**Firebase Config** (`src/config/firebase.ts`):
- Regiao: `southamerica-east1` (Sao Paulo, Brasil)
- Servicos: Auth, Firestore, Storage, Functions
- Variaveis de ambiente em `.env.local`

---

## Organizacao em Modulos (DDD)

O sistema esta organizado em **8 modulos de topo**, seguindo principios de Domain-Driven Design.

```
src/modules/
|
+-- shared-kernel/               # Utilitarios cross-module
|   +-- event-bus/               # Pub/sub para comunicacao
|   +-- di/                      # Container DI (tsyringe)
|   +-- module-registry/         # Ciclo de vida dos modulos
|   +-- audit/                   # Servico de auditoria
|   +-- notifications/           # Sistema de notificacoes
|   +-- logging/                 # Logging estruturado
|   +-- migration/               # Migracoes de dados
|
+-- church-management/           # Operacoes centrais da igreja
|   +-- members/                 # Membros da igreja
|   +-- events/                  # Eventos e calendario
|   +-- visitors/                # Visitantes
|   +-- devotionals/             # Devocionais diarios
|   +-- prayer-requests/         # Pedidos de oracao
|   +-- assets/                  # Patrimonio
|
+-- content-management/          # Conteudo e midia
|   +-- blog/                    # Artigos e anuncios
|   +-- home-builder/            # Construtor da home
|   +-- home-settings/           # Configuracoes da home
|   +-- live-streaming/          # Transmissoes ao vivo
|   +-- projects/                # Projetos da igreja
|   +-- forum/                   # Forum de discussao
|   +-- leadership/              # Lideranca
|   +-- public-pages/            # Paginas publicas
|
+-- financial/                   # Gestao financeira
|   +-- church-finance/          # Financas da igreja
|   +-- department-finance/      # Financas departamentais
|   +-- ong-finance/             # Financas da ONG
|
+-- assistance/                  # Programas de assistencia
|   +-- assistidos/              # Beneficiarios
|   +-- assistencia/             # Casos de assistencia
|   +-- fichas/                  # Fichas de acompanhamento
|   +-- help-requests/           # Solicitacoes de ajuda
|   +-- professional/            # Profissionais
|
+-- analytics/                   # Relatorios e dashboards
|   +-- backup/                  # Backup de dados
|
+-- ong-management/              # Funcionalidades ONG
|   +-- settings/                # Configuracoes e relatorios
|
+-- user-management/             # Usuarios e controle de acesso
    +-- permissions/             # RBAC e permissoes
    +-- users/                   # Gestao de usuarios
    +-- auth/                    # Autenticacao
```

### Estrutura Interna de Cada Modulo

Cada modulo segue a mesma estrutura interna padronizada:

```
modulo/
+-- domain/
|   +-- entities/         # Modelos de dominio e regras de negocio
|   +-- services/         # Interfaces de servico (contratos)
|   +-- repositories/     # Interfaces de repositorio (contratos)
|
+-- application/
|   +-- services/         # Implementacao da logica de negocio
|   +-- usecases/         # Casos de uso (quando existem)
|
+-- infrastructure/
|   +-- repositories/     # Implementacoes Firebase
|   +-- services/         # Servicos de infraestrutura
|
+-- presentation/
|   +-- components/       # Componentes React do modulo
|
+-- index.ts              # API publica do modulo
```

---

## Padroes de Comunicacao

### EventBus (Pub/Sub)

O `EventBus` e o mecanismo central para comunicacao entre modulos. Implementado como Singleton no `shared-kernel`.

```
+-------------------+                    +-------------------+
|  Modulo A         |                    |  Modulo B         |
|                   |    EventBus        |                   |
|  publish(event) --+--->  [handler] --->+-- handler(event)  |
|                   |                    |                   |
+-------------------+                    +-------------------+
```

**Contrato do Evento:**

```typescript
interface DomainEvent {
  eventType: string;    // Ex: 'member.created'
  eventId: string;      // Identificador unico
  occurredAt: Date;     // Timestamp do evento
  payload: unknown;     // Dados do evento
}
```

**Operacoes disponives:**
- `subscribe(eventType, handler)` - Registra handler para um tipo de evento
- `unsubscribe(eventType, handler)` - Remove handler
- `publish(event)` - Publica evento para todos os handlers registrados
- `clear()` - Limpa todos os handlers (util em testes)
- `getHandlerCount(eventType)` - Retorna numero de handlers

### ModuleRegistry

Gerencia o ciclo de vida dos modulos com resolucao de dependencias em profundidade (depth-first).

```
Registro          Inicializacao (depth-first)
---------         --------------------------
Modulo A  ----+   1. Resolver dependencias
Modulo B  ----|   2. Inicializar dependencias primeiro
Modulo C  ----+   3. Inicializar modulo
                  4. Marcar como inicializado
```

**Contrato do Modulo:**

```typescript
interface ModuleDefinition {
  config: {
    name: string;
    version: string;
    dependencies: string[];
  };
  register(): void;        // Hook de registro
  initialize(): Promise<void>;  // Hook de inicializacao
}
```

### Regras de Isolamento

1. Modulos **nunca** importam de internos de outro modulo
2. Comunicacao cross-module usa **EventBus** exclusivamente
3. Cada modulo exporta sua API publica via `index.ts`
4. Dependencias compartilhadas ficam no `shared-kernel`

---

## Gerenciamento de Estado

O sistema **nao utiliza** bibliotecas de estado global como Redux ou Zustand. Em vez disso, combina tres abordagens:

### React Context API

```
+------------------------------------------------------+
|  App                                                  |
|                                                       |
|  +-- AuthContext                                      |
|  |   user, loading, isAdmin, canApproveUsers,         |
|  |   login, logout, hasPermission                     |
|  |                                                    |
|  +-- SettingsContext                                   |
|  |   settings (nome, cores, PIX, banco, WhatsApp),    |
|  |   updateSettings, loading                          |
|  |                                                    |
|  +-- NotificationContext                               |
|  |   notifications, unreadCount,                      |
|  |   markAsRead, clearAll                             |
|  |                                                    |
|  +-- ConfirmDialogContext                              |
|      show, hide, isOpen, message, onConfirm           |
|                                                       |
+------------------------------------------------------+
```

**AuthContext** - Contexto mais critico do sistema:
- Gerencia autenticacao Firebase Auth
- Carrega dados do usuario do Firestore (`/users`)
- Expoe verificacoes de role: `isAdmin()`, `isSecretary()`, `isLeader()`
- Verifica status: apenas usuarios com `status === 'approved'` acessam o sistema
- Fornece `hasPermission(module, action)` para verificacao granular

**SettingsContext** - Configuracoes da igreja:
- Documento Firestore: `settings/church`
- Inclui: nome da igreja, cores (primaria/secundaria), logo, configuracoes de pagamento
- Injecao de CSS variables para temas dinamicos
- Atualizacao parcial via `updateSettings(Partial<ChurchSettings>)`

### Estado Local de Componentes

Componentes gerenciam seu proprio estado para:
- Formularios e validacao
- Modais e overlays
- Filtros e paginacao
- Loading states

### Firebase Real-time Listeners

Dados que precisam de atualizacao em tempo real utilizam `onSnapshot` do Firestore:
- Notificacoes do usuario
- Eventos do calendario
- Permissoes (PermissionService com listener em tempo real)

---

## Design Patterns Utilizados

### Repository Pattern

Separa a logica de acesso a dados da logica de negocio.

```
+----------------+          +-------------------+          +-----------+
| Service        | -------> | IRepository       | <------- | Firebase  |
| (Application)  |          | (Domain Interface)|          | Repository|
+----------------+          +-------------------+          +-----------+
                             findById(id)                  Firestore
                             findAll()                     queries,
                             create(data)                  mappers
                             update(id, data)
                             delete(id)
```

### Dependency Injection

Dois sistemas coexistem:

| Sistema          | Localizacao                          | Uso                |
|------------------|--------------------------------------|--------------------|
| Manual Container | `src/infrastructure/di/container.ts` | Codigo legado      |
| tsyringe         | `src/modules/shared-kernel/di/`      | Modulos novos      |

**Regra**: siga o padrao do codigo ao redor. Se o modulo usa tsyringe, use tsyringe. Se usa container manual, use container manual.

### Observer Pattern (EventBus)

O `EventBus` implementa o padrao Observer para desacoplar modulos:

```
Publisher                    Subscriber
---------                    ----------
MemberService                AnalyticsModule
  |                            |
  +-- publish('member.created') --> handler(event)
  |                            |     +-- updateDashboard()
  |                            |     +-- sendNotification()
```

### Singleton Pattern

Usado em:
- `EventBus.getInstance()` - Instancia unica do barramento de eventos
- `DIContainer.getInstance()` - Container de DI manual
- Servicos exportados como singletons: `churchFinancialService`, `eventBus`

### Guard Pattern

Protecao de rotas com componentes wrapper:

```
<ProtectedRoute>       - Exige autenticacao
  <AdminSetupGuard>    - Verifica se admin setup esta completo
    <PageComponent />  - Pagina protegida
  </AdminSetupGuard>
</ProtectedRoute>

<PublicRoute>          - Redireciona usuarios autenticados
  <LoginPage />
</PublicRoute>
```

### Service Pattern

Servicos encapsulam logica de negocio e orquestram operacoes:

```
+------------------+     +--------------------+     +-----------------------+
| Component        | --> | Service            | --> | Repository            |
| (Presentation)   |     | (Application)      |     | (Infrastructure)      |
+------------------+     +--------------------+     +-----------------------+
                          - Validacao                 - Persistencia
                          - Regras de negocio         - Queries
                          - Orquestracao              - Mappers
                          - Notificacoes              - Cache
```

---

## Resumo das Tecnologias

| Tecnologia        | Versao | Uso                                        |
|-------------------|--------|--------------------------------------------|
| React             | 19     | Framework de UI                            |
| React Router      | v6     | Roteamento com data router API             |
| Firebase          | 12     | Backend (Auth, Firestore, Storage, Functions) |
| TypeScript        | 5.x    | Tipagem estatica                           |
| tsyringe          | -      | Injecao de dependencias                    |
| Tailwind CSS      | -      | Estilizacao utility-first                  |
| Chart.js          | -      | Graficos e relatorios                      |
| Lucide React      | -      | Biblioteca de icones                       |
| React Hot Toast   | -      | Notificacoes toast                         |
| date-fns          | -      | Manipulacao de datas                       |

---

## Firebase

- **Regiao**: `southamerica-east1` (Sao Paulo, Brasil)
- **Auth**: Autenticacao de usuarios
- **Firestore**: Banco de dados principal (NoSQL)
- **Storage**: Upload de fotos e thumbnails
- **Functions**: Cloud Functions (1a e 2a geracao)
- **Hosting**: Deploy do frontend (SPA)
- **Rules**: Regras de seguranca RBAC no Firestore
