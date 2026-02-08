# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                                    # Dev server (localhost:3000) - uses CRACO
npm run build                                # Production build
npm run lint                                 # ESLint (unused-imports plugin enforced as error)
npm run lint:fix                             # Auto-fix ESLint issues
npm run typecheck                            # TypeScript compiler check (tsc --noEmit)
npm test                                     # All tests in watch mode
npm test -- --watchAll=false                 # Run tests once (CI mode)
npm test -- --coverage                       # Tests with coverage report
npm test -- --testPathPattern=MyService      # Run single test file
npm run deploy                               # Full deploy (lint + typecheck + build + Firebase)
npm run deploy:preview                       # Firebase preview channel
npm run deploy:production                    # Firebase production hosting
firebase deploy --only firestore:rules       # Deploy Firestore rules only
firebase deploy --only functions             # Deploy Cloud Functions only
```

## Architecture

**Clean Architecture** church management system with React 19, TypeScript and Firebase.

**Layers** (strict dependency direction: Presentation → Domain ← Data ← Infrastructure):
- **Presentation** (`src/presentation/`) - Pages, hooks, contexts, components
- **Domain** (`src/domain/`, `src/modules/*/domain/`) - Entities, repository interfaces
- **Application** (`src/modules/*/application/`) - Services with business logic
- **Data** (`src/data/`) - Firebase repository implementations
- **Infrastructure** (`src/infrastructure/`) - DI container, external services

**DDD Modules** (`src/modules/`): shared-kernel, church-management, content-management, financial, assistance, analytics, ong-management, user-management. Each module has `domain/entities/`, `application/services/`, `presentation/components/`, and `index.ts` public API.

**State Management**: React Context API (AuthContext, SettingsContext, NotificationContext, ConfirmDialogContext) + component state + Firebase real-time listeners. No Redux/Zustand.

**Routing**: React Router v6 with data router API (`createBrowserRouter`). Route guards: `<ProtectedRoute>`, `<PublicRoute>`, `<AdminSetupGuard>`. All routes in `src/App.tsx`.

## Dependency Injection

Two DI systems coexist - follow the pattern of surrounding code:

1. **Manual container** (`src/infrastructure/di/container.ts`) - Legacy, singleton pattern
2. **tsyringe** (`src/modules/shared-kernel/di/Container.ts`) - Modern, decorator-based

## Module Communication

**EventBus** (`src/modules/shared-kernel/event-bus/EventBus.ts`) for decoupled cross-module communication. Never import from another module's internals - use public API (`index.ts`).

## Firebase

- **Region**: `southamerica-east1` (all functions and queries)
- **Config**: `src/config/firebase.ts`, credentials in `.env.local`
- **Repository pattern**: Domain interfaces in `src/domain/repositories/`, Firebase implementations in `src/data/repositories/`
- **Cloud Functions** (`functions/src/`): **1st Gen only**. Always import `firebase-functions/v1`:
  ```typescript
  import * as functions from 'firebase-functions/v1';
  // NOT: import * as functions from 'firebase-functions'; (resolves to v2 in v7.x)
  ```
- **Security**: Two-layer model - Firestore rules (~460 lines, compact role-based) as security barrier + app-side PermissionService for granular business logic

## UX Patterns

**NEVER use `alert()`, `window.confirm()`, or `window.prompt()`**:

```typescript
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

toast.success('Item criado com sucesso');
toast.error('Erro ao salvar');

const { confirm } = useConfirmDialog();
const ok = await confirm({
  title: 'Confirmacao',
  message: 'Tem certeza que deseja excluir?',
  variant: 'danger', // 'danger' | 'warning' | 'info'
  confirmText: 'Excluir',
});

const { prompt } = useConfirmDialog();
const value = await prompt({
  title: 'Nome',
  message: 'Digite o nome do item:',
  inputPlaceholder: 'Nome...',
});
```

## Logging

Use `loggingService` for audit logging on all CRUD operations:

```typescript
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

// In success path:
await loggingService.logDatabase('info', 'Entity created', `Name: "${name}", ID: ${id}`, currentUser);

// In catch block:
await loggingService.logDatabase('error', 'Failed to create entity', `Error: ${error}`, currentUser);
```

Methods: `logDatabase`, `logSecurity`, `logSystem`, `logAuth`, `logUserAction`, `logApi`.

## Path Aliases

```typescript
import { X } from '@modules/church-management/members/domain/entities/Member';
import { X } from '@shared-kernel/event-bus/EventBus';
import { X } from '@church-management/members/application/services/MemberService';
import { X } from '@financial/church-finance/application/services/ChurchFinancialService';
import { X } from '@assistance/assistidos/application/services/AssistidoService';
import { X } from '@analytics/services/AnalyticsService';
import { X } from '@content/blog/application/services/BlogService';
import { X } from '@ong/volunteers/application/services/VolunteerService';
```

## Permissions

6 roles (`admin`, `secretary`, `professional`, `leader`, `member`, `finance`), 26 SystemModules, 5 PermissionActions (`view`, `create`, `update`, `delete`, `manage`). Defined in `src/modules/user-management/permissions/domain/entities/Permission.ts`. Per-user overrides supported.

```typescript
import { useAuth } from '@/presentation/hooks/useAuth';
const { user, isAdmin } = useAuth();
```

## Patterns to Follow

**New features**: Entity in `domain/entities/` → Repository interface in `domain/repositories/` → Firebase implementation in `data/repositories/` → Register in DI → Service in `application/services/` → UI in `presentation/` → Route in `App.tsx`

**Firestore schema changes**: Update entity → Update repository mappers → Update `firestore.rules` → Update `firestore.indexes.json` if needed

**Cloud Functions**: Use `firebase-functions/v1` import → Set region `southamerica-east1` → Use Admin SDK for privileged ops

## Gotchas

1. **Two DI systems**: Manual container (legacy) vs tsyringe (modern). Follow surrounding code patterns.
2. **Firebase region**: Always `southamerica-east1` for functions and queries.
3. **User status**: Check both `role` AND `status === 'approved'`. Firebase Auth provides auth, user metadata lives in Firestore `/users` collection.
4. **firebase-functions v7+**: Default import resolves to v2. Always use `firebase-functions/v1` for 1st Gen. Do NOT upgrade to 2nd Gen in-place.
5. **No alert/confirm/prompt**: Use `toast` + `useConfirmDialog()`. Never browser native dialogs.
6. **Firestore rules size**: Keep compact (~460 lines). Granular logic belongs in app-side PermissionService.
7. **Path aliases**: Always use `@modules/*`, `@shared-kernel/*`, etc. Configured in `tsconfig.json`, resolved by CRACO.
8. **Public pages**: Some pages (Home, Events, Blog) can be public or auth-required based on `PublicPageSettings`.
9. **Unused imports**: ESLint `unused-imports/no-unused-imports` is set to `error`. Build will fail with unused imports.
10. **Test files**: Colocated in `__tests__` folders next to source files.
11. **Build tool**: Uses CRACO (`craco.config.js`), not plain react-scripts, for path alias resolution.
