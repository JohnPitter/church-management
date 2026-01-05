# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Development Principles

### Master Principles

1. **Clean Architecture** - Maintain strict separation between layers (Presentation, Domain, Application, Data, Infrastructure)
2. **Performance Based on Big O Notation** - Optimize algorithms and data structures with time/space complexity in mind
3. **Mitigated Against Major CVEs** - Follow security best practices and keep dependencies updated
4. **Service Resilience and Cache Usage** - Implement caching strategies and handle failures gracefully
5. **Modern Context-Based Design** - UI/UX follows current design trends and user expectations
6. **Functionality Guaranteed Through Test Pyramid** - Comprehensive testing (unit, integration, e2e)
7. **Security Against Data Leaks** - Validate inputs, sanitize outputs, protect sensitive data
8. **Logging Across All Flows and Observability Concepts** - Implement structured logging for monitoring and debugging
9. **Design System Principles** - Consistent UI components, spacing, typography, and colors
10. **Create a Plan and Build in Phases and Sub-Phases** - Break complex tasks into manageable steps
11. **Changes Documented in CHANGELOG.md** - Track all significant changes with version history
12. **Application Changes with Functional Build and Unused Imports Removed** - Ensure code compiles and is clean

### Agent Behavior

1. **If a Command Takes Too Long, Cancel or Transform into a Background Task** - Don't block progress on slow operations
2. **If a Solution Doesn't Work, Try a New Approach by Researching on the Internet** - Be resourceful and adaptive
3. **Token Economy: Focus on Implementation, Less on Summaries** - Prioritize code delivery over verbose explanations

## Common Commands

### Development
```bash
npm start              # Start dev server (localhost:3000)
npm test               # Run tests in watch mode
npm run build          # Production build
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix ESLint issues
npm run typecheck      # Run TypeScript compiler check
```

### Deployment
```bash
npm run deploy                # Run deployment script
npm run deploy:preview        # Deploy to Firebase preview channel
npm run deploy:production     # Deploy to Firebase production hosting
npm run predeploy            # Pre-deployment checks (lint + typecheck + build)
```

### Firebase
```bash
npm run setup:indexes        # Setup Firestore indexes
firebase deploy --only firestore:rules    # Deploy Firestore rules only
firebase deploy --only functions          # Deploy Cloud Functions only
```

### Testing
```bash
npm test                     # Run all tests in watch mode
npm test -- --coverage       # Run tests with coverage report
npm test -- --watchAll=false # Run tests once without watch
```

## Architecture Overview

This is a **Clean Architecture** church management system built with React and Firebase.

### Core Architectural Pattern

**Layered Architecture** with strict dependency rules:
- **Presentation Layer** (`src/presentation/`) - React components, hooks, contexts
- **Domain Layer** (`src/domain/`, `src/modules/*/domain/`) - Entities, repository interfaces, business rules
- **Application Layer** (`src/modules/*/application/`) - Use cases and service implementations
- **Data Layer** (`src/data/`) - Firebase repository implementations
- **Infrastructure Layer** (`src/infrastructure/`) - DI container, external services

**Flow**: Presentation → Domain (interfaces) ← Data (implementations) ← Infrastructure

### Module Structure

The codebase uses **Domain-Driven Design** with feature modules:

```
modules/
├── shared-kernel/              # Cross-module utilities
│   ├── event-bus/             # Pub/sub for module communication
│   ├── di/                    # Dependency injection (tsyringe)
│   └── module-registry/       # Module lifecycle management
├── church-management/
│   ├── members/               # Member CRUD and management
│   ├── events/                # Event scheduling
│   ├── devotionals/           # Daily devotionals
│   ├── visitors/              # Visitor tracking
│   └── prayer-requests/       # Prayer request management
├── content-management/        # Blog, announcements, media
├── financial/                 # Church/department/ONG finances
├── assistance/                # Social assistance programs
├── analytics/                 # Reports and dashboards
└── ong-management/            # NGO-specific features
```

Each module follows this internal structure:
```
module-name/
├── domain/
│   └── entities/              # Business rules and domain models
├── application/
│   └── services/              # Business logic (CRUD operations)
├── presentation/
│   └── components/            # UI components
└── index.ts                   # Public API exports
```

### Dependency Injection

**Two DI systems coexist**:

1. **Manual DI Container** (`src/infrastructure/di/container.ts`)
   - Singleton pattern
   - Used for legacy repositories and services
   ```typescript
   import { getUserRepository } from '@/infrastructure/di/container';
   const userRepo = getUserRepository();
   ```

2. **tsyringe** (`src/modules/shared-kernel/di/Container.ts`)
   - Modern approach with decorator support
   - Used for newer modules
   ```typescript
   Container.registerSingleton('IMemberService', MemberService);
   const service = Container.resolve<IMemberService>('IMemberService');
   ```

### Event-Driven Communication

**EventBus** (`src/modules/shared-kernel/event-bus/EventBus.ts`) enables decoupled module communication:

```typescript
// Subscribe to events
eventBus.subscribe('member.created', (event) => {
  // Handle event
});

// Publish events
eventBus.publish({
  eventType: 'member.created',
  eventId: generateId(),
  occurredAt: new Date(),
  payload: { memberId: '123' }
});
```

## Firebase Integration

### Configuration
- **Region**: `southamerica-east1` (São Paulo, Brazil)
- **Config file**: `src/config/firebase.ts`
- **Environment variables**: Create `.env.local` with Firebase credentials

### Repository Pattern

All data access goes through repositories implementing domain interfaces:

```typescript
// Domain interface (src/domain/repositories/)
export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  create(data: CreateMemberDTO): Promise<Member>;
  // ...
}

// Implementation (src/data/repositories/)
export class FirebaseMemberRepository implements IMemberRepository {
  async findById(id: string): Promise<Member | null> {
    const docRef = doc(db, 'members', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? this.mapToEntity(docSnap) : null;
  }
}
```

### Cloud Functions (Server-Side)

Location: `functions/src/index.ts`

**Key Functions**:
- `createUserAccount()` - Creates user in Auth + Firestore (admin-only)
- `deleteUserAccount()` - Deletes user from Auth + Firestore
- `uploadStreamThumbnail()` - Handles live stream thumbnail uploads
- `uploadProfilePhoto()` - Handles profile photo uploads

All functions run in `southamerica-east1` region.

### Security Rules

**File**: `firestore.rules`

**Role-Based Access Control (RBAC)**:
- Roles: `admin`, `secretary`, `leader`, `member`
- Helper functions available in rules:
  - `isAuthenticated()` - Check if user is logged in
  - `getUserData()` - Get current user document
  - `hasRole(role)` - Check specific role
  - `hasAnyRole(roles)` - Check multiple roles

**Key collections**:
- `/users` - Authenticated users can read all, update own
- `/members` - Admin/secretary can CRUD
- `/events` - Public read, admin/secretary/leader create
- `/blogPosts` - Public read, admin/secretary create

## TypeScript Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Member } from '@modules/church-management/members/domain/entities/Member';
import { EventBus } from '@shared-kernel/event-bus/EventBus';
import { MemberService } from '@church-management/members/application/services/MemberService';
import { FinancialService } from '@financial/church-finance/application/services/ChurchFinancialService';
import { AssistidoService } from '@assistance/assistidos/application/services/AssistidoService';
import { Analytics } from '@analytics/services/AnalyticsService';
```

## State Management

**No global state library** (Redux/Zustand) - Instead uses:

1. **React Context API** - For app-wide state
   - `AuthContext` - User authentication and permissions
   - `SettingsContext` - App settings (theme, language)
   - `NotificationContext` - Toast notifications

2. **Component State** - Local UI state

3. **Firebase Real-time Listeners** - Live data sync

### Using Auth Context

```typescript
import { useAuth } from '@/presentation/hooks/useAuth';

const MyComponent = () => {
  const { user, loading, isAdmin, canApproveUsers, login, logout } = useAuth();

  if (!isAdmin()) {
    return <div>Access denied</div>;
  }
  // ...
};
```

## Routing

**React Router v6** with data router API (`createBrowserRouter`)

**Route Guards**:
- `<ProtectedRoute>` - Requires authentication
- `<PublicRoute>` - Redirects authenticated users
- `<AdminSetupGuard>` - Ensures admin setup is complete

All routes defined in `src/App.tsx`.

## User Roles & Permissions

### Roles
- `admin` - Full system access
- `secretary` - Content and member management
- `leader` - Event and prayer request management
- `member` - Basic authenticated user

### Permission System
Granular permission system defined in `src/domain/entities/Permission.ts`:

**Modules**:
- `users`, `members`, `events`, `blog`, `financial`, `assistance`, etc.

**Actions**:
- `view`, `create`, `edit`, `delete`, `approve`, `export`

Check permissions:
```typescript
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// In components using useAuth hook
const { user } = useAuth();
const canEditMembers = user?.permissions?.some(p =>
  p.module === SystemModule.MEMBERS && p.actions.includes(PermissionAction.EDIT)
);
```

## Domain Entities

Core entities in `src/domain/entities/`:

- **User** - System users with roles and permissions
- **Member** - Church members (baptized, active, inactive, etc.)
- **Event** - Church events (services, meetings, special events)
- **Assistencia** - Social assistance cases
- **Asset** - Church assets (property, equipment)
- **Department** - Church departments
- **Notification** - System notifications
- **Permission** - Role-based permissions
- **PublicPageSettings** - Public-facing page configurations

## Important Patterns to Follow

### 1. When Adding New Features

1. **Define domain entity** in appropriate module's `domain/entities/`
2. **Create repository interface** in `domain/repositories/`
3. **Implement repository** in `data/repositories/Firebase*Repository.ts`
4. **Register in DI container** (`src/infrastructure/di/container.ts` or module's DI)
5. **Create service** in module's `application/services/`
6. **Build UI** in module's `presentation/components/`
7. **Add route** in `src/App.tsx` (if needed)

### 2. When Modifying Firestore Schema

1. Update entity in `domain/entities/`
2. Update repository mapper methods
3. Update Firestore rules in `firestore.rules`
4. Update indexes in `firestore.indexes.json` (if needed)
5. Run `npm run setup:indexes` to deploy indexes

### 3. When Adding Cloud Functions

1. Add function to `functions/src/index.ts`
2. Ensure region is set to `southamerica-east1`
3. Use Firebase Admin SDK for privileged operations
4. Deploy with `firebase deploy --only functions`

### 4. When Working with Modules

- Modules are **isolated** - use EventBus for cross-module communication
- Never import from another module's internals - use public API (`index.ts`)
- Register module in `ModuleRegistry` if it needs initialization

## Common Gotchas

1. **Two DI systems**: Older code uses manual container, newer uses tsyringe. When in doubt, follow the pattern of surrounding code.

2. **Firebase region**: All functions and queries must respect `southamerica-east1` region.

3. **User status**: Users have both `role` and `status`. Only `approved` users can access the system.

4. **Public pages**: Some pages (Home, Events, Blog) can be public or require auth based on `PublicPageSettings`.

5. **Decorators**: TypeScript decorators are enabled for tsyringe. Ensure `experimentalDecorators` and `emitDecoratorMetadata` are true.

6. **Path aliases**: Always use TypeScript path aliases (`@modules/*`, `@shared-kernel/*`, etc.) for imports.

7. **Firebase Auth vs User doc**: Firebase Auth provides authentication, but user metadata (role, permissions, status) is in Firestore `/users` collection.

## Testing Strategy

- Unit tests for domain entities and services
- Integration tests for repositories (mocked Firebase)
- Component tests with React Testing Library
- Test files colocated with source: `__tests__` folders

## Key Dependencies

- **React 19** - UI framework
- **React Router v6** - Routing with data router API
- **Firebase 12** - Backend (Auth, Firestore, Storage, Functions)
- **tsyringe** - Dependency injection
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Analytics and reporting
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **date-fns** - Date manipulation
- **docx** - Document generation

## Development Workflow

1. **Start dev server**: `npm start`
2. **Make changes** to code
3. **Lint and typecheck**: `npm run lint && npm run typecheck`
4. **Test**: `npm test`
5. **Build**: `npm run build`
6. **Deploy**: `npm run deploy:preview` (for testing) or `npm run deploy:production`

## Troubleshooting

### Build Errors
- Run `npm run typecheck` to see TypeScript errors
- Check path aliases are configured correctly
- Ensure all dependencies are installed

### Firebase Errors
- Verify `.env.local` has correct Firebase config
- Check Firestore rules allow the operation
- Ensure user has `approved` status
- Verify Cloud Functions region matches

### Auth Issues
- Check user exists in both Firebase Auth AND `/users` collection
- Verify user status is `approved`
- Check user role has required permissions

### Module Loading
- Ensure module is registered in `ModuleRegistry`
- Check circular dependencies
- Verify DI container has required services registered
