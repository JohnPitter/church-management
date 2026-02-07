# CI/CD Pipeline

## Visao Geral

O projeto utiliza **GitHub Actions** para CI/CD automatizado. O pipeline e acionado em pushes para `main`/`develop` e em Pull Requests.

**Arquivo**: `.github/workflows/ci-cd.yml`

---

## Diagrama do Pipeline

```
                    Push main/develop
                    Pull Request
                         │
                         ▼
              ┌─────────────────────┐
              │   build-and-test    │
              │                     │
              │  1. Checkout        │
              │  2. Setup Node 20   │
              │  3. npm ci          │
              │  4. Security audit  │
              │  5. Lint            │
              │  6. TypeScript      │  ◄── Bloqueia se falhar
              │  7. Tests + cover   │
              │  8. Build           │  ◄── Bloqueia se falhar
              │  9. Upload artifacts│
              └────────┬────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
  ┌──────────────────┐  ┌──────────────────┐
  │  security-audit  │  │  deploy-preview  │
  │                  │  │  (somente PRs)   │
  │  npm audit       │  │                  │
  │  npm outdated    │  │  Build + Deploy  │
  └────────┬─────────┘  │  Preview Channel │
           │            │  Comenta URL no  │
           │            │  Pull Request    │
           │            └──────────────────┘
           ▼
  ┌──────────────────┐
  │  deploy-firebase │
  │  (somente main)  │
  │                  │
  │  1. Rules        │
  │  2. Indexes      │
  │  3. Storage      │
  │  4. Functions    │
  │  5. Hosting      │
  └──────────────────┘
```

---

## Jobs Detalhados

### Job 1: Build and Test

**Roda em**: Todo push e PR
**Runner**: `ubuntu-latest`
**Node**: `20.x`

| Step | Comando | Bloqueia? |
|------|---------|-----------|
| Checkout | `actions/checkout@v3` | Sim |
| Setup Node | `actions/setup-node@v3` | Sim |
| Install | `npm ci` | Sim |
| Security | `npm audit --audit-level=moderate` | Nao |
| Lint | `npm run lint` | Nao |
| TypeScript | `npm run typecheck` | **Sim** |
| Tests | `npm test -- --coverage --watchAll=false` | Nao |
| Build | `npm run build` | **Sim** |
| Artifacts | Upload `build/` e `coverage/` | Sim |

**Variaveis de ambiente no build**:
- `CI: false` - Permite warnings sem falhar o build
- `REACT_APP_FIREBASE_*` - Injetadas dos GitHub Secrets

**Artifacts gerados** (retidos por 7 dias):
- `build/` - Aplicacao compilada para deploy
- `coverage/` - Relatorios de cobertura de testes

---

### Job 2: Security Audit

**Roda em**: Apos `build-and-test` passar
**Objetivo**: Verificar vulnerabilidades e dependencias desatualizadas

| Step | Comando | Bloqueia? |
|------|---------|-----------|
| Security audit | `npm audit --production` | Nao |
| Outdated check | `npm outdated` | Nao |

Este job e informativo - nao bloqueia o deploy.

---

### Job 3: Deploy to Firebase (Producao)

**Roda em**: Somente push na branch `main`
**Depende de**: `build-and-test` + `security-audit`

| Step | Comando | O que faz |
|------|---------|-----------|
| Download artifacts | `actions/download-artifact@v4` | Baixa o build do Job 1 |
| Firebase CLI | `npm install -g firebase-tools` | Instala CLI |
| Service Account | Cria arquivo JSON temporario | Autenticacao |
| Firestore Rules | `firebase deploy --only firestore:rules` | Regras de seguranca |
| Firestore Indexes | `firebase deploy --only firestore:indexes` | Indices de consulta |
| Storage Rules | `firebase deploy --only storage` | Regras do Storage |
| Cloud Functions | Build + `firebase deploy --only functions --force` | Functions 1st Gen |
| Hosting | `firebase deploy --only hosting` | App web |
| Cleanup | Remove service account JSON | Seguranca |

**Ordem de deploy**:
1. Rules primeiro (seguranca antes de dados)
2. Indexes (consultas otimizadas)
3. Storage (regras de upload)
4. Functions (backend)
5. Hosting (frontend - por ultimo)

---

### Job 4: Deploy Preview (PRs)

**Roda em**: Somente em Pull Requests
**Depende de**: `build-and-test`

| Step | O que faz |
|------|-----------|
| Build | Compila a app com variaveis de producao |
| Preview Channel | Deploya em `pr-{numero}` no Firebase Hosting |
| Comment | Comenta URL de preview no PR |

**URL do preview**: `https://{project-id}--pr-{numero}.web.app`
**Expira em**: 7 dias

---

## Secrets Necessarios

Configure em **GitHub > Settings > Secrets and variables > Actions**:

### Credenciais Firebase (para build)

| Secret | Descricao | Onde obter |
|--------|-----------|------------|
| `FIREBASE_API_KEY` | API Key | Firebase Console > Project Settings > Web App |
| `FIREBASE_AUTH_DOMAIN` | Auth Domain | Formato: `projeto.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Project ID | Firebase Console > Project Settings |
| `FIREBASE_STORAGE_BUCKET` | Storage Bucket | Formato: `projeto.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging ID | Firebase Console > Cloud Messaging |
| `FIREBASE_APP_ID` | App ID | Firebase Console > Web App |

### Credenciais de Deploy

| Secret | Descricao | Como obter |
|--------|-----------|------------|
| `FIREBASE_TOKEN` | CI Token | Executar `firebase login:ci` no terminal |
| `FIREBASE_SERVICE_ACCOUNT` | Service Account JSON | Firebase Console > Service Accounts > Generate Key |

---

## Fluxo de Trabalho

### Deploy em Producao (automatico)

```bash
# 1. Desenvolva na branch main ou crie PR
git checkout main
# ... faca suas alteracoes ...

# 2. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 3. Pipeline executa automaticamente:
#    build-and-test → security-audit → deploy-firebase
```

### Preview de PR (automatico)

```bash
# 1. Crie uma branch
git checkout -b feature/minha-feature

# 2. Faca alteracoes, commit e push
git push origin feature/minha-feature

# 3. Abra PR no GitHub
# 4. Pipeline executa: build-and-test → deploy-preview
# 5. Bot comenta URL de preview no PR
```

### Deploy Manual (fallback)

Caso o pipeline falhe, use deploy manual:

```bash
# Build local
npm run build

# Deploy tudo
firebase deploy --project SEU_PROJECT_ID

# Ou deploy parcial
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

---

## Troubleshooting

### Build falha no typecheck

```
Error: npm run typecheck failed
```

**Solucao**: Execute `npx tsc --noEmit` localmente e corrija os erros.

### Deploy de Functions falha

```
Error: Upgrading from 1st Gen to 2nd Gen is not yet supported
```

**Solucao**: As Cloud Functions usam 1st Gen. Certifique-se de importar `firebase-functions/v1`.

### Deploy de Rules falha (HTTP 503)

```
Error: HTTP Error: 503
```

**Solucao**: O arquivo `firestore.rules` pode estar muito grande. Mantenha abaixo de ~500 linhas.

### Firebase Token expirado

```
Error: Authentication Error
```

**Solucao**: Gere um novo token com `firebase login:ci` e atualize o secret `FIREBASE_TOKEN`.
