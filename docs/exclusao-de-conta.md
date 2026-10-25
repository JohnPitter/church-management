# Exclusão de conta pelo próprio usuário

Qualquer usuário autenticado pode excluir a própria conta em **Perfil → Segurança → Excluir minha conta**
ou diretamente em **`/excluir-conta`** (página pública: visitantes veem a explicação e um botão para entrar).
A exclusão é **permanente e irreversível**.

Fluxo: reautenticação (senha ou Google) → digitar `EXCLUIR` → Cloud Function `deleteOwnAccount`
(`functions/src/deleteOwnAccount.ts`, regra de dados em `functions/src/accountDeletion.ts`) → página `/conta-excluida`.
A função usa somente o `uid` do token de quem chama; nunca aceita outro `uid`.

## O que é apagado

- Login (Firebase Authentication) e o perfil `users/{uid}`.
- Fotos de perfil (`profile-photos/{uid}/` no Storage).
- Notificações recebidas (`notifications`, `forumNotifications`) e preferências de notificação (`notificationPreferences/{uid}`).
- Confirmações de presença em eventos (`eventConfirmations`, pelo uid e pelo e-mail da conta).
- Inscrições em projetos (`projectRegistrations`).
- Progresso em devocionais e planos (`userDevotionalProgress`, `userPlanProgress`).
- Curtidas no blog (`likes`), perfil e atividades do fórum (`userForumProfiles`, `forumActivities`).
- Presença em transmissões ao vivo (`streamViewers/*/viewers/{uid}`).

## O que é anonimizado (o conteúdo fica, sem identificar você)

Nome trocado por **"Usuário removido"**, e-mail/telefone apagados e foto removida em:

- Tópicos e respostas do fórum (`forumTopics`, `forumReplies`).
- Comentários do blog (`comments`) e dos devocionais (`devotionalComments`).
- Pedidos de oração enviados com o e-mail da conta (`prayerRequests`).
- Notificações do fórum geradas por você para outras pessoas e o histórico de audiência das transmissões.

Seu identificador também é retirado das listas de curtidas, favoritos, inscritos em planos e "orou por" (pedidos de oração).

## O que é mantido

- Registros institucionais, financeiros, de assistência/atendimento (fichas, sessões, anamneses),
  pedagógicos, de frequência e logs de auditoria/sistema — por obrigação legal e para preservar o histórico da instituição.
- Cadastros de **membros**, **voluntários** e **liderança**: são mantidos pela secretaria e não têm vínculo com o login
  (apenas e-mail digitado pela equipe). Para corrigi-los ou removê-los, fale com a igreja.
- **Profissionais de assistência**: se o cadastro estava vinculado à conta, o vínculo é removido e o cadastro fica
  **inativo**; o histórico clínico é preservado.

## Regras de segurança

- O **último administrador** não pode excluir a própria conta: promova outro administrador antes.
- Ordem: limpeza no Firestore → Storage → `users/{uid}` → Authentication (por último). Se algo falhar no meio,
  o login continua válido e basta tentar de novo (todas as etapas são idempotentes).
- Auditoria: o servidor registra apenas o `uid` e o horário da exclusão.

Política de privacidade: [`/privacidade`](/privacidade).
