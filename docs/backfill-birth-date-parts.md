# Backfill `birthMonth` / `birthDay`

## Por quê

A query de aniversários (`findBirthdays`) usa o campo denormalizado `birthMonth`
(UTC, alinhado ao mobile). Create/update já gravam esses campos; documentos
legados só com `birthDate` / `dataNascimento` caem no fallback de full-scan
enquanto o índice estiver incompleto.

## Lógica

Reutiliza a mesma regra de `getBirthDateParts` em
`src/modules/church-management/members/domain/birthDateParts.ts`:

- `birthMonth` = `getUTCMonth() + 1` (1–12)
- `birthDay` = `getUTCDate()`

Planejamento puro (testável sem Firestore):

- `src/modules/church-management/members/application/backfillBirthDateParts.ts`

## Como rodar

Dry-run (padrão; com Admin SDK se houver credenciais, senão fixtures locais):

```bash
node scripts/backfill-birth-date-parts.mjs
```

Aplicar em Firestore (requer `GOOGLE_APPLICATION_CREDENTIALS` ou ADC + permissão):

```bash
node scripts/backfill-birth-date-parts.mjs --apply
```

## Testes

```bash
CI=true npm test -- --watchAll=false --testPathPattern=backfillBirthDateParts
```
