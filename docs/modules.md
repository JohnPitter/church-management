# Referencia de Modulos

Documento de referencia detalhado de cada modulo do sistema de gestao de igrejas.

---

## Indice

1. [shared-kernel](#1-shared-kernel)
2. [church-management](#2-church-management)
3. [content-management](#3-content-management)
4. [financial](#4-financial)
5. [assistance](#5-assistance)
6. [analytics](#6-analytics)
7. [ong-management](#7-ong-management)
8. [user-management](#8-user-management)

---

## 1. shared-kernel

**Proposito:** Fornece utilitarios e servicos compartilhados entre todos os modulos. Funciona como o nucleo de infraestrutura cross-cutting, garantindo que os modulos se comuniquem sem acoplamento direto.

### Sub-modulos

#### event-bus
Barramento de eventos pub/sub para comunicacao desacoplada entre modulos.

**Classe:** `EventBus` (Singleton)

**Metodos principais:**
- `subscribe(eventType, handler)` - Registra um handler para um tipo de evento
- `unsubscribe(eventType, handler)` - Remove um handler registrado
- `publish(event)` - Publica evento para todos os handlers (execucao paralela)
- `clear()` - Limpa todos os handlers (usado em testes)
- `getHandlerCount(eventType)` - Retorna quantidade de handlers registrados

**Contrato de evento:**
```typescript
interface DomainEvent {
  eventType: string;    // Ex: 'member.created', 'donation.received'
  eventId: string;
  occurredAt: Date;
  payload: unknown;
}
```

#### di (Dependency Injection)
Container de injecao de dependencias baseado em tsyringe.

**Classe:** `DIContainer` (wrapper sobre tsyringe)

**Metodos principais:**
- `registerSingleton(token, implementation)` - Registra singleton
- `register(token, implementation)` - Registra transient (nova instancia por resolucao)
- `registerInstance(token, instance)` - Registra instancia especifica
- `resolve<T>(token)` - Resolve dependencia pelo token
- `isRegistered(token)` - Verifica se token esta registrado
- `clear()` - Limpa instancias (para testes)

#### module-registry
Gerenciamento do ciclo de vida dos modulos com resolucao de dependencias.

**Classe:** `ModuleRegistry` (estatica)

**Metodos principais:**
- `register(module)` - Registra modulo e executa hook de registro
- `initialize(moduleName)` - Inicializa modulo e suas dependencias (depth-first)
- `initializeAll()` - Inicializa todos os modulos registrados
- `getModule(moduleName)` - Busca definicao de modulo
- `listModules()` - Lista configuracoes de todos os modulos
- `clear()` - Limpa estado do registry

#### audit
Servico de auditoria para rastrear operacoes no sistema.

**Implementacao:** `FirebaseAuditService`

#### notifications
Sistema de notificacoes internas do sistema.

**Entidade:** `Notification`
**Servico:** `FirebaseNotificationService`
**Repositorio:** `FirebaseNotificationRepository`

#### logging
Logging estruturado para monitoramento e debugging.

**Servicos:** `LoggingService`, `LogSeederService`
**Repositorio:** `FirebaseLogRepository`

#### migration
Servico para migracoes de dados entre versoes do schema.

**Servico:** `DataMigrationService`

### Comunicacao com outros modulos
O shared-kernel e **consumido** por todos os outros modulos. Ele nao depende de nenhum modulo - apenas fornece infraestrutura. Todos os modulos utilizam o EventBus e o DIContainer deste kernel.

---

## 2. church-management

**Proposito:** Operacoes centrais da igreja - gestao de membros, eventos, visitantes, devocionais e pedidos de oracao. E o modulo mais extenso do sistema.

### Sub-modulos

#### members
Gestao completa de membros da igreja.

**Servico:** `MemberService`

**Metodos principais:**
- `getAllMembers()` - Lista todos os membros
- `getMemberById(id)` - Busca membro por ID
- `getMembersByStatus(status)` - Filtra por status (Active, Inactive, Transferred, Disciplined)
- `searchMembers(query)` - Busca textual
- `createMember(data)` - Cria novo membro
- `updateMember(id, updates)` - Atualiza dados do membro
- `updateMemberStatus(id, status)` - Altera status
- `deleteMember(id)` - Remove membro
- `transferMember(memberId, toChurch, transferredBy)` - Transfere para outra igreja
- `disciplineMember(memberId, reason, disciplinedBy)` - Aplica disciplina
- `restoreMember(memberId, restoredBy)` - Restaura membro disciplinado
- `getStatistics()` - Estatisticas (total, ativos, inativos, distribuicao etaria, crescimento mensal)
- `getBirthdays(month?)` - Aniversariantes do mes
- `getMembersByMinistry(ministry)` - Membros por ministerio
- `exportMembers()` - Exporta dados para relatorio
- `generateReport(type)` - Gera relatorio por tipo (active, inactive, birthdays, all)

**Entidade:** `Member`
- Status: Active, Inactive, Transferred, Disciplined
- Dados: nome, email, telefone, endereco, estado civil, data de batismo, ministerios

#### events
Agendamento e gestao de eventos da igreja.

**Entidade:** `Event`
- Tipos: cultos, reunioes, eventos especiais
- Dados: titulo, descricao, data/hora, local, categoria

**Repositorio:** `FirebaseEventRepository`

#### visitors
Registro e acompanhamento de visitantes.

**Servico:** `VisitorService`

**Metodos principais:**
- Registro de visitantes
- Acompanhamento pos-visita (follow-up)
- Rastreamento de conversao (visitante -> membro)
- Estatisticas de visitacao

#### devotionals
Publicacao e leitura de devocionais diarios.

**Servicos:**
- `DevotionalService` - CRUD de devocionais
- `VerseOfTheDayService` - Versiculo do dia
- `DailyVerseUpdateService` - Atualizacao automatica do versiculo

#### prayer-requests
Sistema de pedidos de oracao.

**Servico:** `PrayerRequestService`

**Metodos principais:**
- Criacao de pedidos de oracao
- Acompanhamento de status (aberto, respondido, encerrado)
- Respostas e interacoes

#### assets
Gestao de patrimonio da igreja.

**Servico:** `AssetService`

**Metodos principais:**
- CRUD de bens (imoveis, equipamentos, veiculos)
- Rastreamento de estado e localizacao
- Historico de manutencao

### Comunicacao com outros modulos
- Publica eventos via EventBus: `member.created`, `member.updated`, `event.created`
- Consumido pelo modulo `analytics` para dashboards e relatorios
- Consumido pelo modulo `financial` para vincular membros a doacoes

---

## 3. content-management

**Proposito:** Gestao de conteudo publicado pela igreja - blog, pagina inicial, transmissoes ao vivo, projetos, forum e lideranca.

### Sub-modulos

#### blog
Publicacao de artigos, anuncios e conteudo de midia.

**Metodos principais:**
- CRUD de posts do blog
- Categorias e tags
- Upload de imagens
- Publicacao programada

#### home-builder
Construtor visual da pagina inicial com biblioteca de componentes.

**Servico:** `HomeBuilderService`

**Metodos principais:**
- `createLayout(layout)` - Cria novo layout com validacao e reordenacao de componentes
- `updateLayout(id, updates)` - Atualiza layout (incrementa versao automaticamente)
- Validacao de layout via `HomeBuilderEntity.validateLayout()`
- Reordenacao automatica de componentes

**Entidade:** `HomeLayout`
- Composto por `HomeComponent[]` com tipos (`ComponentType`)
- Templates pre-definidos em `COMPONENT_TEMPLATES`
- Versionamento de layouts

#### home-settings
Configuracoes de visibilidade e layout da pagina inicial.

**Servico:** `HomeSettingsService`

**Funcionalidades:**
- Visibilidade de secoes (mostrar/ocultar)
- Selecao de template de layout (Apple, Canva, Enterprise)
- Personalizacao de cores e tipografia

#### live-streaming
Gestao de transmissoes ao vivo.

**Funcionalidades:**
- Gerenciamento de streams
- Upload de thumbnails
- Integracao com plataformas de streaming

#### projects
Gestao de projetos da igreja.

**Servico:** `ProjectsService`

**Metodos principais:**
- CRUD de projetos
- Acompanhamento de progresso
- Gestao de participantes
- Orcamentos de projeto

#### forum
Forum de discussao para a comunidade.

**Servico:** `ForumService`

**Funcionalidades:**
- Criacao de topicos
- Respostas e interacoes
- Moderacao de conteudo

#### leadership
Gestao de informacoes sobre lideranca da igreja.

**Servico:** `LeadershipService`

**Funcionalidades:**
- Cadastro de lideres e pastores
- Estrutura organizacional
- Biografias e fotos

#### public-pages
Gestao de paginas publicas do site.

**Servico:** `PublicPageService`

**Funcionalidades:**
- Configuracao de quais paginas sao publicas
- Controle de acesso (publica vs. autenticada)

### Comunicacao com outros modulos
- Publica eventos: `blog.published`, `project.created`
- Utiliza `SettingsContext` para obter configuracoes visuais da igreja
- Consome dados de `church-management/members` para exibir lideranca

---

## 4. financial

**Proposito:** Gestao financeira completa com separacao entre financas da igreja, departamentos e ONG. Cada sub-modulo utiliza colecoes Firestore independentes para isolamento total dos dados.

### Sub-modulos

#### church-finance
Financas centrais da igreja.

**Servico:** `ChurchFinancialService`

**Colecoes Firestore:**
- `church_transactions` - Transacoes financeiras da igreja
- `church_categories` - Categorias financeiras
- `church_budgets` - Planejamento orcamentario
- `church_donations` - Doacoes (dizimos, ofertas, etc.)

**Metodos principais - Transacoes:**
- `createTransaction(transaction)` - Cria transacao com validacao
- `updateTransaction(id, updates)` - Atualiza transacao
- `deleteTransaction(id)` - Remove transacao
- `getTransaction(id)` - Busca transacao por ID
- `getTransactions(filters, limit)` - Lista com filtros (tipo, categoria, status, metodo de pagamento, periodo, valor)

**Metodos principais - Categorias:**
- `createCategory(category)` - Cria categoria financeira
- `getCategories(type?)` - Lista categorias (filtro por tipo: receita/despesa)

**Metodos principais - Doacoes:**
- `createDonation(donation)` - Registra doacao (gera transacao correspondente automaticamente)
- `getDonationSummary(startDate, endDate)` - Resumo: total de doacoes, dizimos, ofertas, numero de doadores, media, crescimento mensal

**Metodos principais - Relatorios:**
- `getFinancialSummary(startDate, endDate)` - Resumo financeiro (receitas, despesas, saldo, top categorias)
- `getIncomeExpenseTrend(startDate, endDate, period)` - Tendencia receita vs despesa (diario/semanal/mensal)
- `getCategoryChartData(startDate, endDate, type)` - Dados para grafico por categoria
- `getMonthlyComparison(startDate, endDate)` - Comparacao mensal
- `getDonationChartData(startDate, endDate)` - Dados de doacoes por tipo
- `exportTransactions(filters, format)` - Exporta transacoes (CSV ou JSON)

**Entidades:**
- `Transaction` - Transacao financeira (receita/despesa)
- `FinancialCategory` - Categoria financeira
- `Donation` - Doacao (dizimo, oferta, missao, etc.)
- `TransactionType` - INCOME, EXPENSE
- `TransactionStatus` - PENDING, APPROVED, REJECTED
- `PaymentMethod` - Dinheiro, PIX, cartao, transferencia, etc.
- `DonationType` - TITHE, OFFERING, SPECIAL_OFFERING, MISSION, BUILDING_FUND, CHARITY, OTHER

#### department-finance
Financas por departamento da igreja.

**Servico:** `DepartmentFinancialService`

**Funcionalidades:**
- Orcamentos por departamento
- Transacoes departamentais
- Relatorios por departamento

#### ong-finance
Financas especificas da ONG vinculada a igreja.

**Servico:** `ONGFinancialService`

**Funcionalidades:**
- Gestao financeira independente da ONG
- Colecoes Firestore separadas com prefixo `ong_`
- Relatorios especificos para prestacao de contas

### Comunicacao com outros modulos
- Consome dados de `church-management/members` para vincular membros a doacoes
- Publica eventos: `transaction.created`, `donation.received`
- Consumido pelo modulo `analytics` para relatorios financeiros

---

## 5. assistance

**Proposito:** Programas de assistencia social da igreja - gestao de beneficiarios, acompanhamento, solicitacoes de ajuda e coordenacao com profissionais (psicologos, assistentes sociais).

### Sub-modulos

#### assistidos
Registro e gestao de beneficiarios dos programas sociais.

**Servico:** `AssistidoService` (implementa `IAssistidoService`)

**Metodos principais:**
- `createAssistido(data)` - Cadastra beneficiario (valida CPF, telefone, verifica duplicidade)
- `updateAssistido(id, data)` - Atualiza dados
- `getAssistidoById(id)` - Busca por ID
- `getAllAssistidos()` - Lista todos
- `getAssistidosByStatus(status)` - Filtra por status (Ativo, Inativo)
- `getAssistidosByNecessidade(necessidade)` - Filtra por tipo de necessidade
- `getAssistidosByResponsible(responsible)` - Filtra por responsavel
- `getAssistidosNeedingAttention()` - Lista os que precisam de atencao
- `updateAssistidoStatus(id, status)` - Altera status
- `deactivateAssistido(id)` - Desativa beneficiario
- `deleteAssistido(id)` - Exclui permanentemente
- `addAtendimento(assistidoId, atendimento)` - Registra atendimento (envia notificacao para roles especificas em casos criticos)
- `addFamiliar(assistidoId, familiar)` - Adiciona familiar
- `getStatistics()` - Estatisticas: ativos, inativos, necessidade mais comum, atendimentos nos ultimos 30 dias, familias, renda media, idade media, distribuicao de necessidades
- `generateReport(filters?)` - Relatorio com filtros de status, necessidade, responsavel, periodo

**Entidade:** `Assistido`
- Dados pessoais: nome, CPF, telefone, data de nascimento, endereco
- Dados sociais: renda familiar, composicao familiar, necessidades
- Status: Ativo, Inativo
- Colecoes internas: atendimentos[], familiares[]

**Entidade auxiliar:** `AtendimentoAssistido`
- Tipos: Auxilio Financeiro, Encaminhamento Medico, Visita, Doacao, etc.
- Dados: descricao, responsavel, itens doados, valor da doacao

#### assistencia
Gestao de casos de assistencia social.

**Servico:** `AssistenciaService` (implementa `IAssistenciaService`)

**Entidade:** `Assistencia`

#### fichas
Fichas de acompanhamento e anamnese psicologica.

**Servicos:**
- `FichaAcompanhamentoService` - Fichas de acompanhamento periodico
- `AnamnesesPsicologicaService` - Anamnese psicologica detalhada

**Entidade:** `FichaAcompanhamento`

**Funcionalidades:**
- Registro de evolucao do caso
- Anotacoes por profissional
- Historico de acompanhamento

#### help-requests
Sistema de solicitacoes de ajuda.

**Servico:** `HelpRequestService`

**Entidade:** `HelpRequest`

**Funcionalidades:**
- Criacao de solicitacoes de ajuda
- Classificacao por prioridade e tipo
- Acompanhamento de status

#### professional
Coordenacao de profissionais envolvidos na assistencia.

**Servico:** `ProfessionalHelpRequestService`

**Entidade:** `ProfessionalHelpRequest`

**Funcionalidades:**
- Gestao de profissionais (psicologos, assistentes sociais)
- Atribuicao de casos
- Agendamento de atendimentos

### Comunicacao com outros modulos
- Utiliza `NotificationService` do shared-kernel para alertas sobre atendimentos criticos
- Publica eventos: `assistido.created`, `atendimento.registered`
- Consome dados de `user-management` para verificar roles de profissionais

---

## 6. analytics

**Proposito:** Relatorios, dashboards e backup de dados do sistema.

### Sub-modulos

#### backup
Backup e restauracao de dados do Firestore.

**Servico:** `BackupService`

**Funcionalidades:**
- Backup completo ou parcial das colecoes do Firestore
- Restauracao de dados a partir de backup
- Agendamento de backups automaticos

### Servico de Relatorios (em `ong-management/settings`)

**Servico:** `ReportsService`

**Metodo principal:** `generateReportData(periodMonths)`

**Dados gerados:**
- `userGrowth` - Crescimento de usuarios (total, novos, ativos por mes)
- `eventStats` - Estatisticas de eventos (total, presenca media, categorias populares, eventos mensais)
- `projectStats` - Estatisticas de projetos (total, ativos, concluidos, orcamento, participantes)
- `engagementStats` - Engajamento (visualizacoes de blog, posts, forum)

### Comunicacao com outros modulos
- Consome dados de todos os outros modulos para gerar relatorios consolidados
- Utiliza dados do `church-management` (membros, eventos)
- Utiliza dados do `financial` (transacoes, doacoes)
- Utiliza dados do `assistance` (assistidos, atendimentos)

---

## 7. ong-management

**Proposito:** Funcionalidades especificas para ONGs vinculadas a igreja, incluindo gestao de voluntarios, atividades e configuracoes.

### Sub-modulos

#### settings
Configuracoes e dados especificos da ONG.

**Entidade:** `ONG`
**Repositorio:** `FirebaseONGRepository`
**Servico:** `ReportsService` (relatorios da ONG)

**Funcionalidades:**
- Cadastro e configuracao da ONG
- CNPJ, razao social, endereco
- Configuracoes especificas

#### volunteers (via pages)
Gestao de voluntarios da ONG.

**Pagina:** `ONGVolunteersPage`

**Funcionalidades:**
- Cadastro de voluntarios
- Atribuicao de atividades
- Controle de horas e participacao

#### activities (via pages)
Atividades da ONG.

**Pagina:** `ONGActivitiesPage`

**Funcionalidades:**
- Agendamento de atividades
- Registro de participantes
- Acompanhamento de execucao

### Comunicacao com outros modulos
- Utiliza `financial/ong-finance` para gestao financeira da ONG
- Utiliza `assistance` para vincular programas sociais
- Publica eventos: `volunteer.registered`, `activity.completed`

---

## 8. user-management

**Proposito:** Gestao de usuarios, autenticacao e controle de acesso baseado em roles e permissoes (RBAC).

### Sub-modulos

#### permissions
Sistema de RBAC (Role-Based Access Control) com permissoes granulares.

**Servico:** `PermissionService`

**Metodos principais:**
- Gestao de permissoes por role
- Override de permissoes por usuario (grant/revoke)
- Listener em tempo real para atualizacao de permissoes
- Verificacao de acesso: `hasPermission(role, module, action, overrides?)`

**Entidade:** `Permission`

**26 Modulos do sistema (SystemModule):**

| Modulo          | Descricao                |
|-----------------|--------------------------|
| Dashboard       | Dashboard principal      |
| Users           | Usuarios                 |
| Members         | Membros                  |
| Blog            | Blog                     |
| Events          | Eventos                  |
| Devotionals     | Devocionais              |
| Transmissions   | Transmissoes ao vivo     |
| Projects        | Projetos                 |
| Forum           | Forum                    |
| Leadership      | Lideranca                |
| Visitors        | Visitantes               |
| Calendar        | Calendario               |
| Assistance      | Assistencia              |
| Assistidos      | Assistidos               |
| Notifications   | Notificacoes             |
| Communication   | Comunicacao              |
| ONG             | Gerenciamento ONG        |
| Finance         | Financas                 |
| Donations       | Doacoes                  |
| Reports         | Relatorios               |
| Assets          | Patrimonio               |
| Settings        | Configuracoes            |
| Permissions     | Permissoes               |
| Audit           | Auditoria                |
| Logs            | Logs do Sistema          |
| Backup          | Backup e Dados           |
| HomeBuilder     | Construtor da Home       |

**5 Acoes de permissao (PermissionAction):**

| Acao    | Descricao   |
|---------|-------------|
| View    | Visualizar  |
| Create  | Criar       |
| Update  | Editar      |
| Delete  | Excluir     |
| Manage  | Gerenciar   |

**Classe:** `PermissionManager`
- `hasPermission(role, module, action, overrides?)` - Verifica permissao considerando overrides
- `getRolePermissions(role)` - Lista todas as permissoes de uma role
- `getAllModules()` - Lista todos os modulos
- `getAllActions()` - Lista todas as acoes
- `getModuleLabel(module)` - Label legivel do modulo
- `getActionLabel(action)` - Label legivel da acao

#### roles
Definicoes de roles e suas permissoes padrao.

**6 Roles do sistema:**

| Role         | Descricao                        | Nivel de Acesso              |
|--------------|----------------------------------|------------------------------|
| admin        | Administrador do sistema         | Acesso total (Manage em tudo)|
| secretary    | Secretaria da igreja             | Gestao de conteudo e membros |
| leader       | Lider (de celula, ministerio)    | Eventos e projetos           |
| member       | Membro comum                     | Visualizacao basica          |
| professional | Profissional de assistencia      | Assistencia e membros        |
| finance      | Responsavel financeiro           | Financas e doacoes           |

**Permissoes por role (exemplos):**

- **admin**: Manage em todos os 26 modulos
- **secretary**: View/Create/Update em Members, Blog, Events, Devotionals, Visitors, Assistidos
- **professional**: View/Create/Update em Assistance; View em Members, Calendar, Reports
- **leader**: View em Members; View/Create em Events e Projects
- **member**: View em Events, Blog, Devotionals, Transmissions, Projects, Forum, Calendar, Leadership
- **finance**: Full access em Finance e Donations; View em Reports e Members

#### users
Gestao de contas de usuario.

**Servico:** `FirebaseAuthService`

**Funcionalidades:**
- Integracao com Firebase Auth
- CRUD de documentos de usuario no Firestore (`/users`)
- Gestao de status: pendente, aprovado, rejeitado
- Vinculacao entre Firebase Auth e documento Firestore

**User Overrides:**
- `UserPermissionOverride` permite conceder ou revogar permissoes especificas para um usuario individual, sobrepondo as permissoes padrao da role

### Comunicacao com outros modulos
- Consumido por **todos** os outros modulos para verificacao de permissoes
- `AuthContext` (Presentation) consome este modulo para estado de autenticacao
- Publica eventos: `user.created`, `user.approved`, `user.role_changed`
- Consome `shared-kernel/notifications` para notificar sobre aprovacoes

---

## Diagrama de Dependencias entre Modulos

```
                    +------------------+
                    |  shared-kernel   |
                    |  (EventBus, DI,  |
                    |   Notifications, |
                    |   Logging, Audit)|
                    +--------+---------+
                             |
              Consumido por todos os modulos
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +-------v--------+  +-------v--------+
| user-management|  |   analytics    |  | ong-management |
| (auth, roles,  |  | (backup,       |  | (volunteers,   |
|  permissions)  |  |  reports)      |  |  activities,   |
+--------+-------+  +-------+--------+  |  settings)     |
         |                   |           +-------+--------+
         |                   |                   |
  Consumido por todos        |                   |
         |          Consome dados de:            |
         |                   |                   |
+--------v-------+  +-------v--------+  +-------v--------+
| church-        |  |   financial    |  |  assistance    |
| management     |  | (church-fin,   |  | (assistidos,   |
| (members,      |  |  dept-fin,     |  |  fichas,       |
|  events,       |  |  ong-fin)      |  |  help-requests,|
|  visitors,     |  +----------------+  |  professionals)|
|  devotionals,  |                      +----------------+
|  prayer-req,   |
|  assets)       |
+--------+-------+
         |
+--------v-------+
| content-       |
| management     |
| (blog, home-   |
|  builder,      |
|  live-stream,  |
|  projects,     |
|  forum,        |
|  leadership)   |
+----------------+
```

**Regras de dependencia:**
1. Todos os modulos dependem do `shared-kernel`
2. Todos os modulos dependem do `user-management` para verificacao de permissoes
3. `analytics` consome dados de todos os outros modulos
4. `financial` e `assistance` consomem dados de `church-management`
5. `ong-management` consome `financial/ong-finance` e `assistance`
6. Comunicacao entre modulos e feita exclusivamente via EventBus
7. Nenhum modulo importa de internos de outro modulo - apenas pela API publica (`index.ts`)
