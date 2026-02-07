# Firebase - Documentacao Completa

Documentacao de toda a integracao com Firebase no sistema de gerenciamento da igreja.

---

## Indice

1. [Configuracao](#configuracao)
2. [Servicos Utilizados](#servicos-utilizados)
3. [Padrao Repository](#padrao-repository)
4. [Colecoes do Firestore](#colecoes-do-firestore)
5. [Cloud Functions (1a Geracao)](#cloud-functions-1a-geracao)
6. [Regras de Seguranca](#regras-de-seguranca)
7. [Deploy](#deploy)

---

## Configuracao

### Regiao

Todas as operacoes do Firebase utilizam a regiao **`southamerica-east1`** (Sao Paulo, Brasil).

A constante esta definida em `src/config/firebase.ts`:

```typescript
export const FUNCTIONS_REGION = 'southamerica-east1';
```

### Arquivo de Configuracao

O arquivo principal de configuracao do Firebase esta em `src/config/firebase.ts`. Ele inicializa todos os servicos:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);
```

### Variaveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as credenciais do Firebase:

```env
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

| Variavel | Descricao |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | Chave da API do projeto Firebase |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Dominio de autenticacao |
| `REACT_APP_FIREBASE_PROJECT_ID` | ID do projeto no Firebase |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Bucket do Firebase Storage |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens |
| `REACT_APP_FIREBASE_APP_ID` | ID do aplicativo Firebase |

> **Importante:** Nunca commite o arquivo `.env.local` no repositorio. Ele esta listado no `.gitignore`.

---

## Servicos Utilizados

### 1. Firebase Authentication

- **Metodo de autenticacao:** Email e senha
- **Criacao de usuarios:** Feita exclusivamente via Cloud Functions (nao pelo cliente)
- **Fluxo:** O admin/secretario chama a Cloud Function `createUserAccount`, que cria o usuario no Auth e no Firestore simultaneamente
- **Dados no Auth:** `uid`, `email`, `displayName`, `photoURL`, `emailVerified`
- **Dados complementares:** Metadados do usuario (role, status, permissoes) ficam na colecao `/users` do Firestore

### 2. Cloud Firestore

- **Tipo:** Banco de dados NoSQL baseado em documentos
- **Uso:** Armazenamento principal de todos os dados da aplicacao
- **Regras de seguranca:** Definidas em `firestore.rules` (~460 linhas)
- **Indices:** Configurados em `firestore.indexes.json`
- **Padrao de acesso:** Exclusivamente via Repository Pattern

### 3. Firebase Storage

- **Uso:** Armazenamento de arquivos binarios
- **Conteudos:**
  - Fotos de perfil dos usuarios (`profile-photos/{userId}/`)
  - Thumbnails de transmissoes ao vivo (`streams/thumbnails/`)
  - Midias gerais
- **Upload:** Feito via Cloud Functions para evitar problemas de CORS
- **Acesso:** Arquivos sao publicos apos upload (URL publica)
- **Limite:** Fotos de perfil tem limite de 5MB
- **Formatos aceitos:** JPEG, PNG, GIF, WebP

### 4. Cloud Functions (1a Geracao)

- **Runtime:** Node.js
- **Regiao:** `southamerica-east1`
- **Import:** `firebase-functions/v1` (obrigatorio, ver secao de avisos)
- **Uso:** Operacoes que requerem privilegios de administrador (Admin SDK)
- **Funcoes:** 4 funcoes exportadas (detalhadas abaixo)

### 5. Firebase Hosting

- **Uso:** Hospedagem da aplicacao web (SPA React)
- **Deploy:** Via `firebase deploy --only hosting`
- **Preview:** Suporte a canais de preview para testes

---

## Padrao Repository

Todo acesso a dados segue o **Repository Pattern**, mantendo separacao entre dominio e infraestrutura.

### Estrutura

```
src/
├── domain/
│   └── repositories/           # Interfaces (contratos)
│       ├── IMemberRepository.ts
│       ├── IEventRepository.ts
│       └── ...
└── data/
    └── repositories/           # Implementacoes Firebase
        ├── FirebaseMemberRepository.ts
        ├── FirebaseEventRepository.ts
        └── ...
```

### Exemplo de Interface (Dominio)

```typescript
// src/domain/repositories/IMemberRepository.ts
export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  findAll(): Promise<Member[]>;
  create(data: CreateMemberDTO): Promise<Member>;
  update(id: string, data: UpdateMemberDTO): Promise<Member>;
  delete(id: string): Promise<void>;
}
```

### Exemplo de Implementacao (Dados)

```typescript
// src/data/repositories/FirebaseMemberRepository.ts
export class FirebaseMemberRepository implements IMemberRepository {
  async findById(id: string): Promise<Member | null> {
    const docRef = doc(db, 'members', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? this.mapToEntity(docSnap) : null;
  }

  private mapToEntity(docSnap: DocumentSnapshot): Member {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      email: data.email,
      // ... mapeamento de campos
    };
  }
}
```

### Registro no Container DI

Os repositorios sao registrados no container de injecao de dependencias:

```typescript
// src/infrastructure/di/container.ts
import { FirebaseMemberRepository } from '@/data/repositories/FirebaseMemberRepository';

export function getMemberRepository(): IMemberRepository {
  return new FirebaseMemberRepository();
}
```

### Principios

1. **Todo acesso a dados passa por repositorios** - Nunca acesse o Firestore diretamente nos componentes
2. **Mappers convertem entre documentos e entidades** - Metodos `mapToEntity()` e `mapToDocument()`
3. **Interfaces no dominio, implementacoes nos dados** - Inversao de dependencia
4. **Repositorios sao singletons** - Registrados via DI container

---

## Colecoes do Firestore

### Leitura Publica (Public Read)

Colecoes que qualquer pessoa pode ler, mesmo sem autenticacao. Escrita requer usuario aprovado.

| Colecao | Descricao | Leitura | Escrita |
|---|---|---|---|
| `events` | Eventos da igreja | Publica | Usuarios aprovados |
| `blogPosts` | Artigos do blog | Publica | Usuarios aprovados |
| `devotionals` | Devocionais diarios | Publica | Usuarios aprovados |
| `devotionalCategories` | Categorias de devocionais | Publica | Usuarios aprovados |
| `devotionalPlans` | Planos de leitura devocional | Publica | Usuarios aprovados |
| `eventCategories` | Categorias de eventos | Publica | Usuarios aprovados |
| `projects` | Projetos da igreja | Publica | Usuarios aprovados |
| `liveStreams` | Transmissoes ao vivo | Publica | Usuarios aprovados |
| `leaders` | Lideres da igreja | Publica | Usuarios aprovados |
| `homeLayouts` | Layouts da pagina inicial | Publica | Somente admin |
| `homeSettings` | Configuracoes da home | Publica | Admin ou secretario |
| `settings` | Configuracoes da igreja | Publica | Somente admin |
| `publicPageSettings` | Configuracoes de paginas publicas | Publica (create tambem) | Admin (update/delete) |

### Interacao de Usuarios Autenticados

Colecoes publicas para leitura onde usuarios autenticados podem interagir (criar, editar seus proprios itens).

| Colecao | Descricao | Leitura | Criar | Editar | Deletar |
|---|---|---|---|---|---|
| `forumCategories` | Categorias do forum | Publica | Aprovados | Aprovados | Aprovados |
| `forumTopics` | Topicos do forum | Publica | Autenticados | Dono ou aprovados | Aprovados |
| `forumReplies` | Respostas do forum | Publica | Autenticados | Dono ou aprovados | Aprovados |
| `comments` | Comentarios em posts | Publica | Autenticados | Dono ou aprovados | Aprovados |
| `devotionalComments` | Comentarios em devocionais | Publica | Autenticados | Dono ou aprovados | Aprovados |
| `likes` | Curtidas | Publica | Autenticados | - | Somente dono |
| `prayerRequests` | Pedidos de oracao | Autenticados | Autenticados | Aprovados | Aprovados |

### Totalmente Publicas (Streams/Viewers)

Colecoes sem restricao de acesso, usadas para contagem de espectadores em transmissoes ao vivo.

| Colecao | Descricao | Acesso |
|---|---|---|
| `liveViewers` | Espectadores ativos | Leitura e escrita publica |
| `streamViewers/{streamId}/viewers` | Espectadores por transmissao | Leitura, criacao e edicao publica |
| `streamViewers/{streamId}/totalViewers` | Total de espectadores | Leitura, criacao e edicao publica (sem delete) |

### Usuarios Aprovados (status = approved)

Colecoes que requerem usuario autenticado E com status `approved`.

| Colecao | Descricao | Acesso |
|---|---|---|
| `users` | Perfis de usuarios | Leitura: autenticados. Criar: autenticados. Editar: dono ou admin. Deletar: admin |
| `members` | Membros da igreja | CRUD completo por aprovados |
| `visitors` | Registro de visitantes | CRUD completo por aprovados |
| `voluntarios` | Voluntarios | Leitura: autenticados. Escrita: aprovados |
| `departments` | Departamentos | Referenciado via subcampos |
| `assets` | Patrimonio da igreja | CRUD completo por aprovados |

### Colecoes Financeiras

Todas requerem usuario aprovado para qualquer operacao.

| Colecao | Descricao |
|---|---|
| `transactions` | Transacoes financeiras gerais |
| `donations` | Doacoes recebidas |
| `budgets` | Orcamentos |
| `financialCategories` | Categorias financeiras |
| `church_budgets` | Orcamentos da igreja |
| `church_categories` | Categorias financeiras da igreja |
| `church_transactions` | Transacoes da igreja |
| `church_donations` | Doacoes da igreja |
| `church_departments` | Departamentos financeiros |
| `church_department_transactions` | Transacoes por departamento |
| `church_department_transfers` | Transferencias entre departamentos |

### Colecoes ONG

Todas requerem usuario aprovado para qualquer operacao.

| Colecao | Descricao |
|---|---|
| `ongSettings` | Configuracoes da ONG |
| `ongVolunteers` | Voluntarios da ONG |
| `ongActivities` | Atividades da ONG |
| `atividadesONG` | Atividades da ONG (legado) |
| `doacoesONG` | Doacoes para a ONG |
| `ongInfo` | Informacoes gerais da ONG |
| `ong_budgets` | Orcamentos da ONG |
| `ong_categories` | Categorias financeiras da ONG |
| `ong_transactions` | Transacoes da ONG |

### Colecoes de Assistencia Social

Todas requerem usuario aprovado, exceto `professional_help_requests` que tem regras especiais.

| Colecao | Descricao | Acesso Especial |
|---|---|---|
| `assistidos` | Beneficiarios cadastrados | Aprovados |
| `assistencias` | Registros de assistencia | Aprovados |
| `agendamentosAssistencia` | Agendamentos de assistencia | Aprovados |
| `profissionaisAssistencia` | Profissionais de assistencia | Aprovados |
| `atendimentos` | Atendimentos realizados | Aprovados |
| `professional_help_requests` | Solicitacoes de ajuda profissional | Leitura/edicao: solicitante, destinatario ou aprovados |
| `professional_help_request_comments` | Comentarios em solicitacoes | Leitura/criacao: autenticados. Edicao: dono ou aprovados |
| `fichasAcompanhamento` | Fichas de acompanhamento | Aprovados (inclui subcol `sessoes`) |

### Colecoes Baseadas no Dono (Owner-based)

Usuarios so acessam seus proprios documentos.

| Colecao | Descricao | Leitura | Escrita |
|---|---|---|---|
| `notificationPreferences` | Preferencias de notificacao | Somente dono | Somente dono |
| `notifications` | Notificacoes do usuario | Dono ou aprovados | Criar: aprovados. Editar: dono. Deletar: aprovados |
| `eventConfirmations` | Confirmacoes de presenca | Autenticados | Criar: autenticados. Editar/deletar: dono |
| `projectRegistrations` | Inscricoes em projetos | Autenticados | Criar: autenticados. Editar/deletar: dono |
| `userDevotionalProgress` | Progresso em devocionais | Dono ou aprovados | Criar: autenticados. Editar/deletar: dono |
| `userPlanProgress` | Progresso em planos | Dono ou aprovados | Criar: autenticados. Editar/deletar: dono |

### Colecoes do Forum (User-specific)

| Colecao | Descricao | Acesso |
|---|---|---|
| `forumActivities` | Atividades do forum | Leitura/criacao: autenticados. Edicao/exclusao: aprovados |
| `forumNotifications` | Notificacoes do forum | Leitura/criacao: autenticados. Edicao/exclusao: dono |
| `userForumProfiles` | Perfis do forum | Leitura: autenticados. Criar/editar: dono. Deletar: aprovados |

### Colecoes de Permissoes

| Colecao | Descricao | Leitura | Escrita |
|---|---|---|---|
| `rolePermissions` | Permissoes por role | Autenticados | Somente admin |
| `userPermissionOverrides` | Overrides de permissao por usuario | Autenticados | Somente admin |
| `customRoles` | Roles customizadas | Autenticados | Somente admin |

### Colecoes Somente Admin

| Colecao | Descricao | Leitura | Escrita |
|---|---|---|---|
| `auditLogs` | Logs de auditoria | Somente admin | Criar: autenticados. Editar/deletar: nunca |
| `systemLogs` | Logs do sistema | Somente admin | Criar: autenticados. Editar: nunca. Deletar: admin |
| `permissionAudit` | Auditoria de permissoes | Somente admin | Criar: autenticados. Editar/deletar: nunca |
| `system_backups` | Backups do sistema | Somente admin | Somente admin |
| `backups` | Dados de backup | Somente admin | Somente admin |
| `backup_metadata` | Metadados de backup | Somente admin | Somente admin |

### Regra Padrao

Qualquer colecao nao listada explicitamente e **negada por padrao**:

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

---

## Cloud Functions (1a Geracao)

Todas as Cloud Functions rodam na regiao `southamerica-east1` e utilizam o import `firebase-functions/v1`.

### 1. createUserAccount

Cria um novo usuario no Firebase Auth e no Firestore simultaneamente. Somente admin e secretario podem executar.

**Parametros:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `email` | string | Sim | Email do novo usuario |
| `password` | string | Sim | Senha do novo usuario |
| `displayName` | string | Sim | Nome de exibicao |
| `role` | string | Nao | Role do usuario (padrao: `member`) |

**Fluxo:**

1. Verifica se o chamador esta autenticado
2. Verifica se o chamador tem role `admin` ou `secretary`
3. Valida os dados de entrada
4. Cria o usuario no Firebase Auth
5. Cria o documento na colecao `/users` com:
   - `email` (lowercase)
   - `displayName`
   - `role` (padrao: `member`)
   - `status`: `approved`
   - `createdAt`: timestamp do servidor
   - `updatedAt`: timestamp do servidor
   - `createdBy`: email do admin/secretario

**Resposta de sucesso:**

```json
{
  "success": true,
  "userId": "abc123",
  "message": "Usuario criado com sucesso"
}
```

**Erros possiveis:**

| Codigo | Descricao |
|---|---|
| `unauthenticated` | Usuario nao autenticado |
| `permission-denied` | Chamador nao e admin/secretario |
| `invalid-argument` | Dados obrigatorios faltando |
| `already-exists` | Email ja cadastrado |
| `internal` | Erro interno |

### 2. deleteUserAccount

Remove um usuario do Firebase Auth e do Firestore. Somente admin pode executar.

**Parametros:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `userId` | string | Sim | UID do usuario a ser deletado |

**Fluxo:**

1. Verifica autenticacao do chamador
2. Verifica se o chamador tem role `admin`
3. Impede auto-exclusao (admin nao pode deletar a si mesmo)
4. Busca dados do usuario para logging
5. Remove do Firebase Auth
6. Remove do Firestore (`/users/{userId}`)
7. Se o usuario nao existe no Auth mas existe no Firestore, remove so do Firestore

**Resposta de sucesso:**

```json
{
  "success": true,
  "message": "Usuario deletado com sucesso",
  "deletedUser": {
    "email": "usuario@email.com",
    "displayName": "Nome",
    "role": "member"
  }
}
```

### 3. uploadProfilePhoto

Faz upload da foto de perfil do usuario para o Firebase Storage.

**Parametros:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `imageData` | string | Sim | Imagem em base64 |
| `fileName` | string | Sim | Nome original do arquivo |
| `contentType` | string | Sim | Tipo MIME (image/jpeg, image/png, etc.) |

**Fluxo:**

1. Verifica autenticacao (qualquer usuario autenticado)
2. Valida tipo de conteudo (JPEG, PNG, GIF, WebP)
3. Remove prefixo data URL se presente
4. Converte base64 para buffer
5. Valida tamanho (maximo 5MB)
6. Faz upload para `profile-photos/{userId}/profile-{timestamp}.{ext}`
7. Atualiza campo `photoURL` no documento do Firestore (`/users/{userId}`)
8. Atualiza `photoURL` no Firebase Auth

**Resposta de sucesso:**

```json
{
  "success": true,
  "photoURL": "https://storage.googleapis.com/bucket/profile-photos/uid/profile-123.jpg",
  "message": "Foto de perfil atualizada com sucesso"
}
```

### 4. uploadStreamThumbnail

Faz upload de thumbnail para transmissoes ao vivo. Contorna problemas de CORS fazendo o upload server-side.

**Parametros:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `fileData` | string | Sim | Imagem em base64 |
| `fileName` | string | Sim | Nome do arquivo |
| `contentType` | string | Sim | Tipo MIME do arquivo |

**Fluxo:**

1. Verifica autenticacao
2. Valida dados obrigatorios
3. Sanitiza nome do arquivo (remove caracteres especiais)
4. Converte base64 para buffer
5. Faz upload para `streams/thumbnails/{timestamp}_{fileName}`
6. Gera URL publica e URL assinada
7. Retorna ambas as URLs

**Resposta de sucesso:**

```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket/streams/thumbnails/123_thumb.jpg",
  "signedUrl": "https://storage.googleapis.com/..."
}
```

---

## Regras de Seguranca

### Modelo de Duas Camadas

O sistema utiliza um modelo de seguranca em duas camadas:

**Camada 1: Regras do Firestore (Barreira de Autenticacao)**

Arquivo: `firestore.rules` (~460 linhas, formato compacto)

As regras do Firestore atuam como primeira barreira, controlando:
- Quem pode ler/escrever em cada colecao
- Verificacao de autenticacao
- Verificacao de status `approved`
- Verificacao de role
- Verificacao de propriedade (dono do documento)

**Camada 2: PermissionService (Logica de Negocio)**

Lado da aplicacao, o `PermissionService` implementa:
- Verificacao granular de permissoes por modulo e acao
- Sistema de overrides por usuario
- Cache de permissoes com atualizacao em tempo real
- Integracao com o sistema de roles

### Funcoes Auxiliares nas Regras

```javascript
// Verifica se o usuario esta autenticado
function isAuthenticated() {
  return request.auth != null;
}

// Busca dados do usuario no Firestore
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

// Verifica se o usuario esta aprovado
function isApproved() {
  return isAuthenticated() && getUserData().status == 'approved';
}

// Verifica se o usuario tem uma role especifica
function hasRole(role) {
  return isAuthenticated() && getUserData().role == role;
}

// Verifica se o usuario e admin
function isAdmin() {
  return hasRole('admin');
}

// Verifica se o usuario e dono (por parametro userId na rota)
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Verifica se o usuario e dono do documento (campo userId no documento)
function isDocOwner() {
  return isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

### Hierarquia de Acesso

```
Admin > Aprovado > Autenticado > Publico
```

- **Publico:** Qualquer pessoa, sem necessidade de login
- **Autenticado (`isAuthenticated`):** Usuario logado, independente do status
- **Aprovado (`isApproved`):** Usuario logado com `status == 'approved'`
- **Admin (`isAdmin`):** Usuario com `role == 'admin'`

---

## Deploy

### Comandos de Deploy

```bash
# Deploy de regras do Firestore
firebase deploy --only firestore:rules

# Deploy de indices do Firestore
firebase deploy --only firestore:indexes

# Deploy de Cloud Functions
firebase deploy --only functions

# Deploy da aplicacao web (Hosting)
firebase deploy --only hosting

# Deploy de regras do Storage
firebase deploy --only storage

# Deploy completo (tudo)
firebase deploy

# Deploy com preview (canal de testes)
npm run deploy:preview

# Deploy de producao
npm run deploy:production
```

### Setup de Indices

```bash
npm run setup:indexes
```

### Pre-deploy (Verificacoes)

O comando `npm run predeploy` executa na ordem:
1. `npm run lint` - Verificacao de linting
2. `npm run typecheck` - Verificacao de tipos TypeScript
3. `npm run build` - Build de producao

---

## Avisos Importantes

### Import do firebase-functions

A partir do `firebase-functions` v7+, o import padrao (`import * as functions from 'firebase-functions'`) resolve para a API v2 (2a Geracao). Este projeto utiliza funcoes de **1a Geracao**, portanto o import deve ser explicitamente da v1:

```typescript
// CORRETO - 1a Geracao
import * as functions from 'firebase-functions/v1';

// INCORRETO - Resolveria para 2a Geracao
import * as functions from 'firebase-functions';
```

### Regiao

Todas as funcoes e queries devem respeitar a regiao `southamerica-east1`. Ao chamar funcoes do cliente:

```typescript
import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';

// A regiao ja esta configurada no objeto 'functions'
const createUser = httpsCallable(functions, 'createUserAccount');
```

### Auth vs Firestore

O Firebase Auth gerencia apenas autenticacao (login/logout/token). Todos os metadados do usuario (role, status, permissoes, etc.) ficam no documento Firestore em `/users/{uid}`.

Ao verificar acesso, sempre verifique **ambos**:
1. O usuario esta autenticado? (Firebase Auth)
2. O usuario esta aprovado? (Firestore: `status == 'approved'`)

### Status do Usuario

Novos usuarios criados via Cloud Function recebem `status: 'approved'` automaticamente. Usuarios que se registram diretamente comecam como `pending` ate serem aprovados por um admin.
