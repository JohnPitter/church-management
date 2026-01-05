# Como Corrigir o Erro 412 ao Fazer Upload de Fotos

⚠️ **ERRO IDENTIFICADO:** O erro 412 ("Precondition Failed") ocorre devido à falta de configuração CORS no bucket do Firebase Storage.

✅ **STATUS DO CÓDIGO:** O código já foi atualizado e está funcionando corretamente. Ele está detectando o erro e mostrando a mensagem: *"Erro no servidor de armazenamento (CORS)"*.

🔧 **SOLUÇÃO:** Você precisa aplicar a configuração CORS no bucket manualmente via console.

## Solução: Aplicar CORS via Console do Google Cloud

### Opção 1: Via Google Cloud Console (Recomendado)

1. Acesse o [Google Cloud Console - Storage](https://console.cloud.google.com/storage/browser?project=church-management-ibc)

2. Localize e clique no bucket: `church-management-ibc.firebasestorage.app`

3. Clique na aba **"Configuration"** (Configuração)

4. Na seção **"CORS"**, clique em **"Edit CORS configuration"** (Editar configuração CORS)

5. Cole a seguinte configuração JSON:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
```

6. Clique em **"Save"** (Salvar)

### Opção 2: Via Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/project/church-management-ibc/storage)

2. Vá para **Storage** no menu lateral

3. Clique em **"Files"** e depois em **"Rules"** ou **"Configuration"**

4. Procure pela opção de CORS e aplique a configuração acima

### Opção 3: Via Linha de Comando (Requer Faturamento Ativo)

Se você tiver uma conta de faturamento ativa, pode usar o comando:

```bash
gsutil cors set cors.json gs://church-management-ibc.firebasestorage.app
```

O arquivo `cors.json` já está criado na raiz do projeto.

## Verificar se CORS foi Aplicado

Depois de aplicar a configuração CORS, aguarde alguns minutos e tente fazer upload de uma foto novamente.

Se o erro persistir:

1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Faça logout e login novamente no sistema
3. Tente fazer upload novamente

## Configuração Alternativa (Mais Restritiva)

Se você quiser permitir CORS apenas para domínios específicos, use:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "https://church-management-ibc.web.app",
      "https://church-management-ibc.firebaseapp.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
```

## Notas Importantes

- A configuração CORS com `"origin": ["*"]` permite requisições de qualquer domínio
- Isso é seguro para arquivos públicos como fotos de perfil
- As regras de segurança do Storage ainda protegem quem pode fazer UPLOAD
- Apenas usuários autenticados podem fazer upload de suas próprias fotos

## Código Atualizado

O código em `ProfilePage.tsx` já foi atualizado para:

1. Usar `uploadBytesResumable` ao invés de `uploadBytes` (melhor tratamento de erros)
2. Incluir metadados personalizados no upload
3. Melhorar mensagens de erro, incluindo detecção específica do erro 412/CORS
4. Adicionar logging do progresso do upload

## Suporte

Se o problema persistir após aplicar o CORS:

1. Verifique se a conta de faturamento do projeto está ativa
2. Verifique se as Storage Rules estão corretas (já foram deployadas com sucesso)
3. Verifique se há bloqueios de firewall ou proxy na sua rede
