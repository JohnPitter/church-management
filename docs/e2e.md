# Testes E2E (Playwright)

Testes de ponta a ponta que abrem o app num navegador real (Chromium) e exercitam os fluxos
como um usuário: login, cadastro, controle de acesso e a gestão pedagógica (turmas e chamada).

**Nada aqui toca em produção.** O app é compilado apontando para os **emulators do Firebase**
(Auth e Firestore locais, projeto fictício `demo-e2e`) e roda com as **regras reais** de
`firestore.rules`. A semeadura de dados é feita direto nos emulators.

## Como rodar

```bash
npm ci
npm run test:e2e:install   # uma vez: baixa o Chromium do Playwright
npm run test:e2e           # sobe os emulators, roda os testes e derruba tudo
```

Requisitos: Node 20+ e **Java 21+** (o emulator do Firestore). O `firebase-tools` é executado via
`npx` (versão fixada em `package.json`), então não precisa instalar nada global.

Na primeira execução o app é compilado (`npm run build`) para `e2e/.build` (ignorado pelo git),
o que leva alguns minutos; as seguintes reaproveitam o build. Para forçar um novo build depois
de mudar o código do app:

```bash
E2E_REBUILD=1 npm run test:e2e
```

Para rodar só um arquivo ou teste: `npm run test:e2e -- e2e/auth.spec.ts -g "senha incorreta"`.

Se já houver um Chromium instalado no sistema: `PW_CHROMIUM_PATH=/caminho/do/chromium npm run test:e2e`.

## O que está coberto

| Arquivo | Cobertura |
| --- | --- |
| `e2e/auth.spec.ts` | Páginas públicas, login (ok/senha errada), conta pendente, rota protegida, cadastro grava no Firestore, acesso negado a membro, tela de configuração inicial |
| `e2e/pedagogy-rosters.spec.ts` | Turmas: cadastrar, salvar alterações (nome + alunos + aluno novo), adicionar por botão/Enter, rascunhos preservados, duplicadas/vazias, mover/copiar, remover/apagar, Igreja↔ONG, permissões (secretaria pode, educador não) |
| `e2e/pedagogy-attendance.spec.ts` | Fluxo entre perfis: coordenação cadastra a turma, arte-educador puxa a chamada e a presença é gravada |
| `e2e/smoke-admin.spec.ts` | Administrador abre ~44 rotas do painel sem erro de JavaScript, sem tela de acesso negado e sem permissão negada pelo Firestore |

Os testes de turmas incluem o cenário de regressão do bug "Salvar alterações da turma não
salvava os alunos" (corrigido no PR #9): eles falham no código anterior à correção.

## Como escrever um teste novo

- Importe `test`, `expect`, `login` e `users` de `e2e/support/fixtures.ts`. Cada teste começa com
  Auth e Firestore **limpos** e com `settings/system.initialized = true`
  (use `test.use({ systemInitialized: false })` para testar a configuração inicial).
- Crie perfis com `users.admin()`, `users.coordinator()`, `users.secretary()`, `users.educator()`,
  `users.member()`, `users.pending()` ou `seedUser({...})` em `e2e/support/emulator.ts`.
- Semeie e confira dados com `setDoc`, `getDoc` e `listDocs` (acesso "owner", ignora regras): assim o
  teste prova que algo foi **gravado de verdade**, não só que apareceu na tela.
- Depois de `login()`, a sessão já está persistida; pode usar `page.goto(...)` à vontade.

## Observações

- `npm start` (servidor de desenvolvimento) **não sobe** hoje: o override de `webpack-dev-server ^5`
  no `package.json` é incompatível com `react-scripts@5`. Por isso o E2E usa o build de produção
  servido por `e2e/support/serve.cjs`.
- No CI o job `e2e` roda em paralelo e **ainda não bloqueia o deploy**; depois de algumas execuções
  estáveis vale incluí-lo em `needs` do `deploy-firebase`.
