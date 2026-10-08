# Avaliação do Desenvolvimento

Os trechos amarelos do documento “melhoria na área pedagogica.docx” foram utilizados como requisitos para ampliar o acompanhamento dos assistidos. A aba “Dificuldades” foi substituída por “Avaliação” nas áreas do arte-educador e da Coordenação Pedagógica. Os registros anteriores continuam consultáveis, sem conversão artificial em indicadores.

## Coleta

O formulário seleciona a chamada, o assistido nela registrado e a turma. A idade é digitada; o responsável é obtido da conta autenticada no servidor. O ciclo é selecionado manualmente, inclusive quando a equipe considerar apropriado um ciclo diferente da faixa etária nominal.

| Ciclo | Faixa etária | Perguntas |
| --- | --- | --- |
| 1 | 4 a 6 anos | 9 |
| 2 | 7 a 11 anos | 9 |
| 3 | 12 a 17 anos | 9 |
| 4 | 18 a 59 anos | 9 |
| 5 | 60 anos ou mais | 9 |

As 45 perguntas e seus exemplos estão centralizados em `functions/src/pedagogy/instrument.json`. As perguntas seguem as nove dimensões dos eixos EU, OUTRO e MUNDO. O backend fornece o instrumento versionado ao navegador.

Cada avaliação identifica data, ano/semestre e momento Inicial, Intermediário ou Final. Todas as nove respostas são obrigatórias. Os três textos de observação são opcionais. A necessidade de encaminhamento é obrigatória, admite múltiplas opções e impede combinar “Sem necessidade” com um encaminhamento. O texto de “Outro encaminhamento” permanece opcional, conforme o documento.

## Indicadores e relatórios

O backend valida o contrato e calcula os indicadores. A = 2 pontos, B = 1, C = 0. N/O não soma pontos nem integra o máximo possível. Sem questões observadas, o resultado é `null`, apresentado como “Não calculado”, nunca como 0%.

IDG considera todas as dimensões observadas. IDE considera as dimensões observadas de cada eixo. IDD considera a dimensão correspondente. Nos relatórios coletivos, divide-se a soma dos pontos pela soma dos máximos observados; não se usa uma média simples de percentuais com denominadores diferentes.

Os relatórios permitem filtrar organização, semestre, ciclo, turma e assistido. Para cada assistido e momento, os gráficos utilizam a avaliação mais recente pela data de avaliação e, em caso de empate, pela data de registro. O histórico completo das observações permanece no relatório. Momentos ausentes são apresentados como “Não calculado”, sem ligar lacunas no gráfico.

Os gráficos exibem IDG, IDE e IDD nos três momentos. As observações complementares e os encaminhamentos aparecem no histórico e nas exportações, sem pontuação ou gráfico. PDF e DOCX compartilham o mesmo conteúdo, incluindo identificação, metodologia, gráficos, respostas, narrativas e encaminhamentos.

## Acesso e persistência

As avaliações são documentos imutáveis em `developmentEvaluations`. Novas avaliações corrigidas podem ser registradas sem apagar o histórico. O navegador não pode ler ou escrever diretamente nessa coleção; utiliza três funções autenticadas em `southamerica-east1`:

- `getDevelopmentEvaluationInstrument`
- `createDevelopmentEvaluation`
- `getDevelopmentEvaluationReport`

Os contratos ficam em `functions/src/pedagogy/contracts.ts`; o frontend importa somente os tipos. A gravação confirma o assistido na chamada e a organização, identifica o autor pela sessão e utiliza transação com identificador de solicitação para impedir duplicação em uma repetição da mesma chamada.

Educadores consultam somente avaliações de sua autoria. Administradores e coordenação acessam o conjunto conforme suas permissões. Profissionais de Psicologia devem receber a ação **Visualizar** no módulo **Coordenação Pedagógica**, usando a administração de permissões existente. Essa concessão permite consultar e exportar, sem conceder criação de avaliações. O menu “Avaliações do Desenvolvimento” abre `/avaliacoes-desenvolvimento` para usuários autorizados. Revogações individuais são respeitadas pelo backend.

As regras também impedem alteração das próprias permissões e a troca da autoria de uma chamada por outro educador. Os logs de consulta e falha não incluem nomes, respostas ou observações dos assistidos.

## Validação e publicação

Foram verificados os cálculos, a validação do formulário, a preservação dos dados após falha, a troca de perguntas por ciclo, os contratos de exportação e a matriz de permissões. Os emuladores validaram autenticação, gravação, idempotência, autoria no servidor, consulta individual/coletiva, concessão ao profissional, isolamento entre educadores e bloqueio de operações diretas pelas regras.

Para repetir as verificações:

```text
npm run typecheck
npm run lint
npm test -- --watchAll=false --runInBand --testPathPattern="Evaluation|Pedagogy|RbacMatrix.rules-alignment|attendanceReportExport"
npm --prefix functions test
npm --prefix functions run test:emulator
npm run build
```

O teste com emuladores requer Firebase CLI e Java 21 ou superior. Usa exclusivamente o projeto fictício `demo-pedagogy`, e o script recusa execução sem as variáveis dos emuladores. Nenhum dado de produção foi alterado.

A publicação inclui as três funções, as regras, os índices e o frontend. O envio à `main` aciona o fluxo de CI/CD do repositório; a versão servida pode ser conferida em `/build-version.json`.

## Limitações e revisão

- A chamada existente identifica alunos por nome. O acompanhamento considera organização, turma e nome normalizado; não une automaticamente a mesma pessoa entre turmas, renomeações ou transferências. Para consolidar a trajetória institucional entre turmas, evoluir as chamadas e os cadastros para um identificador estável do assistido. Nomes repetidos na mesma chamada são rejeitados para evitar associação ambígua.
- Os gráficos coletivos indicam a quantidade avaliada em cada momento. Mudanças na composição do grupo não devem ser interpretadas como evolução de um grupo fixo.
- Consultas com mais de 5.000 avaliações são recusadas com orientação para restringir o escopo, evitando exportação incompleta.
- O navegador baixou PDF e DOCX individuais e coletivos com dados fictícios. O PDF foi renderizado para inspeção. O DOCX teve pacote, conteúdo e imagens conferidos, mas a revisão visual no Word permanece pendente: o renderizador disponível não encontrou LibreOffice neste Windows.
- Na suíte ampliada há uma falha fora deste módulo: `AssistenciaService.test.ts`, teste `syncFichasForProfissionalAgenda`, espera uma ficha e recebe zero. Ela foi reproduzida com o arquivo de teste original de `HEAD`; a implementação desse serviço não foi alterada.
- As duas páginas pedagógicas existentes ainda superam o alvo de 400 linhas e contêm componentes longos. Os novos formulários, filtros, gráficos e consultas foram extraídos; recomenda-se continuar a divisão dos formulários antigos de diretrizes, encontros e feedback em componentes próprios.
