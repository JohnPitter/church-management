# GitHub Secrets Configuration

Este arquivo documenta os secrets necessários para o CI/CD funcionar corretamente.

## Secrets Necessários

Configure os seguintes secrets no GitHub (Settings > Secrets and variables > Actions):

### Firebase Credentials

1. **FIREBASE_API_KEY**
   - Descrição: Firebase API Key
   - Obtido em: Firebase Console > Project Settings > General > Web App

2. **FIREBASE_AUTH_DOMAIN**
   - Descrição: Firebase Auth Domain
   - Formato: `seu-projeto.firebaseapp.com`
   - Obtido em: Firebase Console > Project Settings > General > Web App

3. **FIREBASE_PROJECT_ID**
   - Descrição: Firebase Project ID
   - Obtido em: Firebase Console > Project Settings > General

4. **FIREBASE_STORAGE_BUCKET**
   - Descrição: Firebase Storage Bucket
   - Formato: `seu-projeto.appspot.com`
   - Obtido em: Firebase Console > Project Settings > General > Web App

5. **FIREBASE_MESSAGING_SENDER_ID**
   - Descrição: Firebase Cloud Messaging Sender ID
   - Obtido em: Firebase Console > Project Settings > Cloud Messaging

6. **FIREBASE_APP_ID**
   - Descrição: Firebase App ID
   - Obtido em: Firebase Console > Project Settings > General > Web App

### Firebase Deployment

7. **FIREBASE_TOKEN**
   - Descrição: Firebase CI Token para deploy
   - Como obter: Execute `firebase login:ci` no terminal local
   - Importante: Este token permite deploy automático

8. **FIREBASE_SERVICE_ACCOUNT** (opcional, mas recomendado)
   - Descrição: Service Account JSON do Firebase para autenticação
   - Como obter:
     1. Vá para Firebase Console > Project Settings > Service Accounts
     2. Clique em "Generate new private key"
     3. Copie todo o conteúdo do arquivo JSON
     4. Cole como secret (todo o JSON em uma linha)

## Como Configurar os Secrets

1. Acesse seu repositório no GitHub
2. Vá para **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret acima com seu respectivo valor

## Verificação

Após configurar todos os secrets, o workflow CI/CD será executado automaticamente em:
- Push para branch `main`
- Push para branch `develop`
- Pull Requests para `main` ou `develop`

## Segurança

⚠️ **NUNCA** commite os valores dos secrets no código fonte!

- Os secrets são criptografados pelo GitHub
- Apenas workflows autorizados podem acessá-los
- Logs do GitHub mascaram automaticamente valores de secrets
- Rotacione os tokens regularmente

## Troubleshooting

Se o deploy falhar:

1. Verifique se todos os secrets estão configurados corretamente
2. Verifique se o FIREBASE_TOKEN ainda é válido (gere um novo com `firebase login:ci`)
3. Verifique os logs do workflow no GitHub Actions
4. Verifique as permissões do service account no Firebase Console

## Comandos Úteis

```bash
# Gerar novo Firebase token
firebase login:ci

# Testar deploy localmente
firebase deploy --only hosting --project SEU_PROJECT_ID

# Listar projetos Firebase
firebase projects:list
```
