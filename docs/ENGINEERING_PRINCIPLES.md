## Princípios Mestres

### 1. Arquitetura e Código Limpo

**Código altamente legível, sem duplicação, com máximo reuso.**

- **Separação de responsabilidades:** routes → services → database (3 camadas); UI → state → domain no frontend
- **Middleware pipeline ordenada:** cors → parsers → cookie → logger → rateLimiter → auth → routes → errorHandler
- **Shared types entre frontend e backend** via package compartilhado — nunca duplicar interfaces
- Sem lógica de negócio em routes/controllers — delegar para services/managers
- **DRY:** extrair utilitários para `lib/` quando padrão se repete 2+ vezes
- **Single Responsibility:** cada arquivo/função faz UMA coisa bem feita
- Nomes descritivos: `fetchTasksByProject()` > `getData()`, `isTaskCompleted()` > `check()`
- Funções curtas (< 50 linhas); se exceder, extrair sub-funções
- Evitar `any` — usar tipos específicos ou generics; `unknown` quando tipo é realmente desconhecido
- Barrel exports (`index.ts`) em cada package para API pública limpa
- Constantes em módulo dedicado — nunca hardcodar strings/números mágicos no código
- Imports organizados: 1) bibliotecas externas, 2) packages internos, 3) imports relativos

### 2. Performance Baseada na Teoria do Big O Notation

**Toda operação deve ser analisada pela complexidade algorítmica.**

- **O(1) preferível:** usar Maps/Sets para lookups ao invés de `Array.find()` em listas grandes
- **Evitar O(n²):** nunca loops aninhados sobre a mesma coleção; usar index/hash maps
- **Queries SQL otimizadas:** sempre WHERE + índices; nunca `SELECT *` seguido de filtro em memória
- **Paginação obrigatória:** todo endpoint que retorna lista deve aceitar `limit` + `offset` (ou cursor)
- **Debounce/Throttle:** eventos de alta frequência (socket, input, resize, scroll) com 100-300ms
- **Lazy loading:** componentes pesados (editores de código, gráficos, diagramas) com code-splitting
- **Memoização:** memo de cálculos caros e callbacks em listas grandes
- **Batch operations:** agrupar updates de DB quando possível (ex: `INSERT INTO ... VALUES (...), (...)`)
- **Evitar re-renders desnecessários:** state selectors granulares (selecionar campo, não objeto inteiro)
- **Índices no DB:** toda coluna usada em WHERE, JOIN ou ORDER BY deve ter índice

### 3. Mitigação Contra Principais CVEs

**Proteção ativa contra OWASP Top 10 e CVEs conhecidas.**

- **Command Injection (CWE-78):** usar APIs que recebem args como array (`execFile`, `spawn`); nunca `exec`/`execSync` com string concatenada
- **Path Traversal (CWE-22):** normalizar paths com `path.resolve()` e validar que resultado está dentro do diretório permitido
- **SQL Injection (CWE-89):** ORM com parameterized queries (Drizzle, Prisma, SQLAlchemy, etc.); nunca interpolar strings em SQL
- **XSS (CWE-79):** renderizadores que escapam por padrão; nunca injetar HTML raw no DOM; sanitizar dados do banco antes de renderizar
- **SSRF (CWE-918):** validar URLs fornecidas pelo usuário; whitelist de hosts permitidos
- **Broken Auth (CWE-287):** JWT com expiração curta (24h), refresh token rotation, cookie httpOnly+secure
- **Sensitive Data Exposure (CWE-200):** API nunca retorna campos sensíveis (tokens, credentials, encryption keys)
- **Dependency vulnerabilities:** audit antes de cada release; CI com gate de severity moderate+
- **Rate limiting:** toda rota API protegida contra brute force
- **CORS restrito:** apenas origens explícitas (dev e prod), nunca `*` em produção

### 4. Resiliência dos Serviços e Uso de Cache

**Serviços devem sobreviver a falhas parciais e minimizar operações repetidas.**

- **Retry com backoff exponencial:** operações de rede com 3 tentativas (1s, 2s, 4s delay)
- **Timeout protection:** operações locais ~5s, remotas ~30-60s, jobs longos com limite explícito
- **Circuit breaker pattern:** se serviço externo falha 3x consecutivas, parar de chamar por 30s
- **Graceful degradation:** falha de dependência não-crítica não derruba feature principal
- **Error boundaries (React):** cada rota/página isolada; falha em uma não afeta as outras
- **Preservação de work-in-progress:** stash automático antes de operações destrutivas (pull, checkout)
- **Cache de dados estáticos:** configs, listas raramente mutáveis — store com TTL
- **Cache de API:** respostas idempotentes com `Cache-Control: max-age=N`
- **Deduplicação de requests:** flag `loading` para prevenir fetch duplicado
- **Reconnect automático:** websockets/integrações persistentes com backoff e restore de estado

### 5. Design System — Postura Visual e Rigor Sistêmico

**Aplicações no nível de craft de Apple, Google, Microsoft, Uber, Nvidia, Linear, Stripe.** O que essas big techs têm em comum não é estilo — é **rigor sistêmico**. Cada projeto declara UMA postura visual e a executa com disciplina.

#### 5.1 Declaração de Postura Visual (obrigatório no kickoff)

Antes de escrever a primeira linha de UI, declarar em `docs/DESIGN_POSTURE.md` uma das direções abaixo (ou variante explícita). **Misturar posturas no mesmo produto é o que gera o "SaaS genérico"**:

- **Editorial** (Stripe, Linear): tipografia protagonista, espaço branco generoso, hierarquia jornalística, ilustrações custom
- **Minimal-tech** (Apple, Vercel): redução radical, neutros profundos, micro-detalhes premium, foco em produto não em UI
- **Industrial/Functional** (Bloomberg, Figma, IDEs): density alta, monospace para dados, cor como sinal não decoração
- **Bold-typographic** (Uber, MoMA): tipografia extrema (display + tight tracking), preto+branco+1 acento, layout assimétrico
- **Tech-editorial** (Nvidia, Anthropic): preto profundo + acento elétrico, grids quebrados, tom científico/técnico
- **Material-systemic** (Google, Microsoft Fluent): tokens explícitos, motion choreographed, density configurável
- **Soft-pro** (Notion, Things): superfícies quentes, raios suaves, microcopy humana, sem dureza

A postura define paleta-base, tipografia, density, motion language, elevation system. Todo componente novo é validado contra ela.

#### 5.2 Tokens — Single Source of Truth

**Nenhum valor hardcoded em componente.** Tudo via tokens nomeados:

- **Color tokens** semânticos, não literais: `--color-surface`, `--color-surface-raised`, `--color-text-primary`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-success`, `--color-danger`, `--color-warning`, `--color-info`. Componente nunca conhece hex.
- **Spacing scale** opinativa (não múltiplos arbitrários): `--space-1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (24px), `6` (32px), `7` (48px), `8` (64px), `9` (96px). Pular escala = decisão consciente.
- **Type scale** com hierarquia brutal — contraste extremo entre níveis: `--text-display` (48-64px), `--text-h1` (32-40px), `--text-h2` (24-28px), `--text-body` (14-15px), `--text-caption` (12-13px), `--text-micro` (11px). Nunca usar 4 tamanhos próximos (16/17/18/19 = ruído).
- **Font weights** com salto: 400 body, 600 emphasis, 700-800 display. Nunca 500 (zona morta sem personalidade).
- **Radius scale:** `--radius-sm` (4px), `--md` (8px), `--lg` (12-16px), `--xl` (20-24px), `--full`. Postura define qual domina.
- **Elevation system** (sombras como camadas hierárquicas, não decoração): `--elevation-0` (flat), `--elevation-1` (raised: card), `--elevation-2` (overlay: dropdown), `--elevation-3` (modal), `--elevation-4` (popover). Cada nível com sombra E borda E background calibrados.
- **Motion tokens:** duração (`--motion-fast` 120ms, `--standard` 200ms, `--emphasized` 320ms, `--slow` 480ms) + curve (`--ease-standard` cubic-bezier(0.2, 0, 0, 1), `--ease-emphasized` cubic-bezier(0.3, 0, 0, 1), `--ease-decelerate` cubic-bezier(0, 0, 0, 1) para entradas). **Nunca `ease` ou `linear` default.**
- **Z-index scale** explícita: `--z-base`, `--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal`, `--z-popover`, `--z-toast`. Nunca números soltos.

#### 5.3 Tipografia — Hierarquia Brutal

- **Contraste extremo de tamanho e peso:** display 48px/800 ao lado de body 14px/400 — não 24/600 ao lado de 18/500
- **Tracking calibrado por tamanho:** display = `tracking-tight` ou negativo (-0.02em); body = normal; caption uppercase = `tracking-wider` (+0.05em)
- **Line-height inverso ao tamanho:** display 1.0-1.1; headings 1.2; body 1.5-1.6; nunca 1.4 em corpo (sufoca leitura)
- **Números tabulares** (`font-variant-numeric: tabular-nums`) em qualquer dado numérico em coluna/lista
- **Mono para dados técnicos:** IDs, hashes, código, métricas precisas — nunca para body
- **Máximo 2 famílias** no produto (display + text), idealmente 1. Variable fonts preferidas.

#### 5.4 Density e Espaço

- **Density declarada:** comfortable (consumo) vs compact (dados) vs dense (terminal/IDE) — escolhida por contexto, não misturada na mesma view
- **Espaço como hierarquia:** seções separadas por `--space-7+`, grupos por `--space-5`, itens por `--space-3`. Espaço comunica relação.
- **Breathing room generoso em hero/marketing**, density alta em data-heavy. Saber qual é qual.
- **Optical alignment, não matemático:** ícones e texto alinhados visualmente (ajuste fino), não por bounding box

#### 5.5 Motion — Choreographed, não Decorativo

- **Toda animação comunica:** entrada (decelerate), saída (accelerate), mudança de estado (standard), enfase (emphasized)
- **Transform + opacity apenas** — nunca animar `width`, `height`, `top`, `left` (jank garantido)
- **Stagger em listas:** itens aparecem com delay incremental (40-80ms entre cada) — não todos juntos
- **Shared element transitions** entre estados relacionados (card → detail view)
- **Reduced motion respeitado:** `prefers-reduced-motion` desativa parallax, stagger, scale; mantém fade essencial
- **Spring physics** para interações diretas (drag, swipe), curves para transições de estado

#### 5.6 Componentes — Estados Completos Obrigatórios

Todo componente interativo tem **6 estados visíveis e calibrados**: default, hover, focus-visible (ring), active/pressed, disabled, loading. Faltar um = bug.

- **Focus visible obrigatório:** ring de 2px com offset, cor de acento, nunca outline default do browser nem `outline: none` sem substituto
- **Loading state com skeleton** que espelha layout final — nunca spinner solo centralizado em área grande
- **Empty state com personalidade:** ilustração ou ícone proposital + copy específica do contexto + CTA claro. Nunca "No data" + ícone genérico.
- **Error state acionável:** o que aconteceu + por que + o que fazer agora. Nunca "Something went wrong".
- **Success feedback proporcional:** toast curto para ação leve, inline confirmation para ação no fluxo, full-screen apenas para milestones reais

#### 5.7 Cor — Sinal, não Decoração

- **Paleta semântica imutável:** success/danger/warning/info com tokens próprios; nunca usar verde para "ativo" e também para "sucesso" no mesmo produto
- **Acento usado pontualmente:** CTAs primários, indicadores de estado ativo, focus rings. Nunca como background dominante.
- **Neutros profundos** (não cinza médio chapado): escala de 10+ neutros do quase-branco ao quase-preto, com tom (warm/cool) consistente
- **Dark mode não é inversão:** repensa elevation (sombra vira luz), saturação (cores reduzem ~15%), contraste (texto puro #FFF queima — usar #E8E8E8)

#### 5.8 Anti-padrões Proibidos

- **Card branco + sombra suave + título 16px semibold + ícone à esquerda** — esse é o template SaaS que faz tudo parecer igual
- **Gradient roxo→rosa** como acento default
- **Emoji em UI de produto sério** (em buttons, headings, empty states)
- **"Oops! Something went wrong"** ou copy infantilizada em produto profissional
- **Spinner solo centralizado** em área que vai ter conteúdo estruturado
- **Drop shadow fofa** (`shadow-2xl`) em produto enterprise/técnico
- **Border radius inconsistente** no mesmo produto (cards 12px, buttons 6px, inputs 4px sem razão sistêmica)
- **Cores semânticas reaproveitadas** (verde = "ativo" e "sucesso" e "online" e "saldo positivo" — vira ruído)
- **Tooltip que repete o label** do botão ("Save" → tooltip "Save")
- **Toast de sucesso para tudo** ("File loaded successfully", "Page changed successfully")
- **Ilustração de stock** (undraw, storyset) — mata a personalidade instantaneamente
- **Loading > 200ms sem feedback,** ou feedback que só aparece depois de 1s
- **Layout que apenas encolhe no mobile** ao invés de adaptar arquitetura de informação

#### 5.9 Voz e Microcopy

- **Copy é design.** Empty state, error message, button label, tooltip — escritos com a mesma intenção que o visual
- **Específico > genérico:** "No projects yet — create your first to get started" > "No data"
- **Verbos em CTAs:** "Create project" > "Submit"; "Delete forever" > "OK"
- **Tom da postura:** editorial = frases completas; minimal-tech = ultra-curto; industrial = direto/imperativo
- **Números humanizados quando apropriado:** "2 minutes ago" vs "2024-01-15T10:23:42Z" — depende do contexto

### 6. Garantia das Funcionalidades Através da Pirâmide de Testes

**Cada camada da aplicação deve ter cobertura proporcional.**

- **Base — Unit Tests (~70%):** services, utils, helpers, pure functions, state machines
  - Mock de dependências externas (DB, API, SDK)
  - Cada service novo DEVE ter testes unitários antes de merge
- **Meio — Integration Tests (~20%):** API endpoints, middleware, database queries
  - DB in-memory ou container efêmero para isolamento
  - Testar happy path + error cases + edge cases
- **Topo — E2E Tests (~10%):** fluxos críticos de usuário
  - Framework headless (Playwright, Cypress)
  - Apenas golden paths que se quebrados invalidam o produto
- **Coverage mínimo:** 60% geral, 80% para módulos críticos (auth, billing, dados financeiros, segurança)
- **Testes rodam no CI:** gate obrigatório em cada PR
- **Naming convention:** `*.test.ts` para unit, `*.integration.test.ts` para integration, `*.e2e.ts` para E2E
- **Princípio:** nenhuma feature é "completa" sem teste que valide o comportamento esperado

### 7. Segurança Contra Vazamento de Dados

**Dados sensíveis nunca devem ser expostos em logs, respostas API, ou código-fonte.**

- **Criptografia em repouso:** tokens de acesso, credentials de integração, segredos — AES-256-GCM
- **Encryption module dedicado** com `encrypt()` / `decrypt()` centralizados
- **Encryption key obrigatória em produção,** derivada de env var, nunca hardcoded
- **`.env` no `.gitignore`:** nunca commitar secrets, API keys, tokens
- **Tokens efêmeros:** injetados em URLs/contextos temporariamente com cleanup automático após uso
- **API response sanitization:** nunca retornar campos sensíveis (tokens, credentials, configs com secrets)
- **Logs seguros:** nunca logar tokens, senhas, ou dados pessoais decriptados; mascarar (`***`)
- **Cookie security:** `httpOnly`, `secure` (prod), `sameSite: strict`, expiração curta
- **Rate limiting** em endpoints de autenticação (proteção contra brute force)
- **Segregação de dados:** queries sempre filtram por escopo do usuário/tenant
- **Audit trail:** toda operação sobre dados sensíveis registrada com ator, ação, recurso, timestamp

### 8. Aplicação de Logs em Todos os Fluxos e Conceitos de Observabilidade

**Todo fluxo de execução deve ser rastreável do início ao fim.**

- **Logger estruturado** com levels: `info`, `warn`, `error`, `debug`
- **Context tags obrigatórias:** `logger.info("mensagem", "contexto")` — ex: contexto por domínio (`auth`, `db`, `integration`, etc.)
- **Request logging:** middleware logando `method`, `path`, `statusCode`, `duration(ms)` para toda requisição
- **Lifecycle logging** de entidades-chave: toda transição de estado registrada (audit trail)
- **Operações externas logadas:** chamadas a APIs, jobs, integrações — com resultado e duração
- **EventBus tracing:** eventos emitidos com tipo, payload resumido, timestamp
- **Error logging enriquecido:** stack trace + contexto (IDs relevantes) em toda exceção
- **Métricas:** duração, custo, consumo — armazenados para analytics/observabilidade
- **Padrão:** se um fluxo não tem log, é um bug — todo ponto de decisão deve ter pelo menos `debug`

### 9. Implementação do Design System

**Como o sistema da seção 5 vira código reutilizável, sem virar abstração genérica.**

- **Tokens em CSS variables** (ou equivalente nativo do framework) — fonte única, consumida por todo componente
- **Componentes base** (primitivos não-opinativos) construídos uma vez: Button, Input, Select, Checkbox, Radio, Switch, Slider, Dialog, Drawer, Popover, Tooltip, Toast, Tabs, Accordion, Card, Badge, Avatar, Skeleton, Separator, ScrollArea
- **Composição > prop explosion:** preferir slots/children a 30 props booleanas (`<Card><Card.Header/></Card>` > `<Card hasHeader headerSize="lg" headerVariant="primary"/>`)
- **Headless quando faz sentido:** lógica em hooks/primitives (Radix, Headless UI, Ark), estilo aplicado no nível do projeto
- **Variants tipadas** (CVA, tailwind-variants, ou equivalente) — nunca strings de classe duplicadas em chamadas
- **Iconografia única:** UM icon set no produto inteiro (Lucide, Phosphor, custom) — nunca misturar
- **Tamanho de ícone proporcional ao contexto:** inline no texto = `1em`; em buttons = 16-20px; em empty states = 48-64px
- **Layout primitives** acima de utility classes soltas: `<Stack/>`, `<Cluster/>`, `<Grid/>`, `<Container/>` encapsulam spacing tokens
- **Estados visuais padronizados** (def, hover, focus, active, disabled, loading) implementados nos primitivos — nunca refeitos por componente
- **Density configurável** quando o produto exige (data-heavy + marketing no mesmo app): prop `density` ou contexto
- **Documentação viva:** Storybook/Ladle/equivalente com cada componente, variants, e estados visíveis
- **Audit periódico:** PR de design system não pode introduzir token novo sem justificativa; tokens órfãos removidos a cada release

### 10. Construção Por Fases e SubFases

**Desenvolvimento incremental, planejado e verificável.**

- Cada feature é uma **Fase numerada** (ex: Fase 18)
- Fases complexas divididas em **SubFases com letras** (ex: 18A, 18B, 18C)
- **Antes de implementar:** plano documentado em `docs/DEVELOPMENT_PLAN.md` com:
  - Objetivo e justificativa
  - Arquivos a criar e modificar
  - Interfaces/tipos novos
  - Critérios de verificação
- **Cada SubFase termina com:**
  - Build passando sem erros
  - Funcionalidade testável
  - Sem regressões em features existentes
- **Incrementos pequenos:** cada SubFase = 1-3 horas de trabalho, deployável independentemente
- **Ordem de dependência:** sempre tipos antes de tudo, backend antes de frontend, primitivos antes de composições

### 11. Alterações Documentadas no Arquivo CHANGELOG.md

**Toda alteração deve ser rastreável no histórico.**

- **Formato:** `## [x.y.z] - YYYY-MM-DD` seguido de `### Fase N: Título`
- **SubFases:** `#### Fase NA: Subtítulo` com seções Added/Changed/Fixed/Security
- **Conteúdo obrigatório:**
  - Arquivos criados (com path completo)
  - Arquivos modificados (com descrição da mudança)
  - Dependências adicionadas/removidas
  - Breaking changes (se houver)
  - Detalhes técnicos relevantes para debug futuro
- **Versionamento semântico:**
  - Major (x.0.0): breaking changes, redesign, mudança de modelo de dados
  - Minor (0.x.0): nova feature/fase completa
  - Patch (0.0.x): bug fixes, hardening, polish
- **Quando atualizar:** ao final de cada SubFase, antes do commit

### 12. Build Funcional e Código Limpo

**A aplicação deve compilar sem erros e estar livre de código morto.**

- **Build deve passar** após qualquer alteração — sem exceções
- **Zero imports não utilizados:** remover antes de cada commit
- **Zero variáveis unused:** TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`)
- **Zero `any` desnecessário:** usar tipos específicos; `unknown` quando incerto, generics quando flexível
- **Zero warnings do compilador:** tratar warnings como erros
- **Formatação consistente:** indentação 2 espaços, semicolons obrigatórios, trailing commas
- **Dead code removal:** código comentado deve ser removido (git tem o histórico)
- **Verificação pré-commit:** rodar **TODOS** os gates do CI localmente antes de push, não só o build:
  - **Build:** `go build ./...` + `npm run build` (ou equivalente do framework)
  - **Lint:** se o projeto tem config de lint, rodar e zerar warnings
  - **Type-check:** `tsc --noEmit` se TS, `go vet ./...` se Go
  - **Tests:** `go test ./...` / `npm test` / `pytest`
  - **Coverage:** se o projeto tem gate de coverage no CI, rodar coverage local com o mesmo escopo do CI e confirmar acima do gate
  - **Audit/security:** `npm audit --audit-level=moderate`, `govulncheck ./...`, etc, se existir gate
- **Saber qual gate o CI tem:** ler workflow YAML (`.github/workflows/`, `.gitlab-ci.yml`) e replicar todos localmente
- **README sempre atualizado:** atualizar no mesmo commit ao mudar funcionalidade, dependência, comando, versão ou caminho

---

## Regras do Agente

### 1. Análise e Planejamento de Alterações

- **Antes de implementar**, classificar a alteração:
  - **Simples** (1-3 arquivos, sem impacto arquitetural): implementar direto
  - **Complexa** (múltiplos arquivos, novo fluxo, refactoring cross-package): criar plano em `docs/plans/<nome>.md` antes
- **Plano deve conter:** objetivo, arquivos afetados (tabela), snippets de código, ordem de implementação, como testar, key details (nomes exatos, imports, edge cases, env vars)
- **Salvar plano ANTES de escrever código**

### 2. Quando Usar Agent Teams

- **Usar** para: trabalho paralelo full-stack, code review multi-foco, tarefas independentes em arquivos diferentes, refactoring grande cross-package
- **Não usar** para: tarefas simples, single-file, ou sequenciais
- Preferir subagents (Task tool) para delegação leve

---

## Engineering Mindset

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- Multiple interpretations → present them, don't pick silently.
- Simpler approach exists → say so.

### Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- 200 lines that could be 50 → rewrite.

### Surgical Changes
- Touch only what you must.
- Don't refactor adjacent code that isn't broken.
- Match existing style.
- Remove imports YOUR changes orphaned; don't delete pre-existing dead code unless asked.

### Goal-Driven Execution
- Transform tasks into verifiable goals ("Add validation" → "Write tests for invalid inputs, then make them pass").
- Multi-step tasks: state plan with verification per step.
