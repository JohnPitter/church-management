# Seguranca — RBAC nas Firestore/Storage Rules

## Problema

O app tinha RBAC rico no React (`Permission.ts`), mas as **Firestore Rules**
aceitavam quase qualquer usuario `status == approved` em financas, membros e
fichas. A UI nao e fronteira de seguranca.

## Solucao (P0)

Helpers em `firestore.rules`:

| Helper | Roles |
|--------|--------|
| `isStaff()` | admin, secretary |
| `canWriteContent()` | staff |
| `canWriteEventsOrProjects()` | staff + leader |
| `canWriteMembers()` | staff |
| `canReadMembers()` | qualquer approved (diretorio / aniversarios) |
| `canAccessFinance()` | admin, finance |
| `canAccessAssistance()` | staff + professional |
| `canAccessFichas()` | admin, secretary, professional |
| `canManageVisitors()` | staff |
| `canManageOng()` | staff |

### Users

- **create**: auto-registro (`role=member`, `status=pending`, proprio uid) **ou** admin
- **update**: admin (qualquer campo) **ou** dono **sem** alterar `role`/`status`
- **Primeiro admin**: Cloud Function `bootstrapFirstAdmin` (Admin SDK)

### Storage

Writes exigem role + `contentType` + limite de tamanho (`storage.rules`).

## Deploy

```bash
firebase deploy --only firestore:rules,storage,functions
```

## Testes

- Contrato TS: `src/modules/user-management/permissions/domain/entities/__tests__/RbacMatrix.rules-alignment.test.ts`
- Emulator de rules (P2 no README)

## Segredos

Nao commitar: `serviceAccountKey.json`, keystores Play, `.env`.
Verificar com `git log --all --full-history -- serviceAccountKey.json`.
