# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-02-07

### Added
- **ErrorBoundary component** for graceful error handling across the app
- **`useDebouncedValue` hook** for optimized search inputs (300ms debounce)
- **Audit logging** in 11 pages previously without logging (ONG, Forum, Register, Contact, Prayer, Fichas, HomeSettings)
- **Toast & confirmation modals** replacing all `alert()`/`confirm()`/`prompt()` calls across 48 files
- **Welcome message with article detection** (`getChurchArticle`) in all 4 home layouts
- **Comprehensive Unit Tests for AuthContext**: 44 tests, 100% coverage
- **Comprehensive `docs/` folder** with 7 documentation files (architecture, modules, CI/CD, Firebase, permissions, development)

### Changed
- **Blog page**: Parallelized like-status checks with `Promise.allSettled` (O(n) sequential to parallel)
- **Search inputs**: Added debounce to 8 management pages (Members, Users, Assistidos, Blog, Events, Assets, Logs, BlogPage)
- **README.md**: Simplified to essentials, links to `docs/` for detailed documentation
- **Cloud Functions**: Migrated imports to `firebase-functions/v1` for 1st Gen compatibility
- **Firestore rules**: Simplified and compacted to ~460 lines

### Fixed
- **XSS vulnerability**: Added DOMPurify sanitization to all HTML rendering (BlogPage, ComponentRenderer)
- **ESLint errors**: Removed 4 unused imports in AssetsManagementPage.test.tsx
- **Calendar**: Restored on main panel, removed from admin dashboard
- **Welcome text**: Proper Portuguese article (a/ao) based on church name gender

### Security
- Installed `dompurify` library for HTML sanitization against XSS attacks
- All user-generated HTML content now sanitized before rendering

### Documentation
- Created comprehensive `docs/` folder with 7 documentation files
- Removed 25 legacy ad-hoc documentation files
- Updated CLAUDE.md with concise project-specific guidance

### Removed
- `scripts/` folder from git tracking (added to .gitignore)
- Browser native dialogs (`alert`, `confirm`, `prompt`) - replaced with toast/modals

## [1.2.0] - 2026-01-07

### Added
- **Simplified Home Page Configuration System**: Complete redesign of home page management
  - Removed complex drag-and-drop builder in favor of simple style selection
  - Three pre-designed professional layouts:
    - **Canva Design**: Vibrant, colorful with bold gradients (pink, purple, orange)
    - **Apple Design**: Minimalist, elegant inspired by Apple's iPhone pages (black, white, blue)
    - **Enterprise Design**: Professional, structured inspired by Lagoinha Global (corporate blues and greens)
  - New `AdminHomeSettingsPage` with intuitive style selector and section toggles
  - Visual color palette display for each design style
  - Section visibility controls (hero, verse of day, quick actions, features, events, etc.)
  - Real-time preview of selected style
- New domain entities in `home-settings` module:
  - `HomeSettings`: Configuration model with layout style and section visibility
  - `HomeLayoutStyle` enum: CANVA, APPLE, ENTERPRISE
  - `HomeSectionVisibility`: Toggle controls for 10 different sections
  - `LAYOUT_STYLE_INFO`: Detailed metadata for each design style
- New service layer:
  - `HomeSettingsService`: CRUD operations for home configuration
  - Firestore collection `homeSettings` with real-time updates
- Complete layout implementations:
  - `CanvaHomeLayout.tsx`: Vibrant design with colorful gradients and animations
  - `AppleHomeLayout.tsx`: Minimalist design with massive typography and white space
  - `EnterpriseHomeLayout.tsx`: Professional design with statistics, testimonials, and structured layout
  - `HomeSimplified.tsx`: Dynamic layout renderer based on configuration

### Changed
- Replaced `/admin/home-builder` route with `/admin/home-settings`
- Updated admin dashboard to link to new home settings page
- Modified home page import to use `HomeSimplified` instead of complex builder
- Enhanced color palette visibility with inline styles to avoid Tailwind conflicts
- Updated admin dashboard card for home configuration:
  - New title: "Configurar Home Page"
  - New description: "Escolher estilo e configurar seções da home"
  - New icon: 🎨
  - Permission changed to `SystemModule.Settings` with `PermissionAction.Update`

### Fixed
- Firestore rules syntax errors: Moved `homeSettings` collection rules to correct position
- Added missing service closing brace in `firestore.rules`
- Color display issues in admin interface by using pure inline styles
- Dynamic Tailwind class generation issues (text-${color}-600) by using complete class names
- App.tsx route syntax error (missing comma and closing brace)

### Removed
- Complex home builder system with 30+ draggable components
- `AdminHomeBuilderPage.tsx` and related builder infrastructure
- `/admin/home-builder` route and associated imports

## [1.1.0] - 2026-01-06

### Added
- **Atomic Permission System**: Complete rebuild of permission system with atomicity and better database security
  - `AtomicPermissionService`: Singleton service with 5-minute TTL cache and real-time Firebase subscriptions
  - `useAtomicPermissions` hook: Modern React hook with sync/async permission checks
  - Support for multiple permission checks (hasAnyPermission, hasAllPermissions)
  - Real-time permission updates via Firebase onSnapshot
  - Batch permission operations for better performance
  - Role-based helper flags (isAdmin, isSecretary, isLeader, isMember)
- Enhanced `PermissionGuard` component with support for multiple permissions (any/all logic)
- `usePermissionCheck` hook for conditional rendering
- `withPermission` HOC for protecting entire components
- Comprehensive documentation in `docs/ATOMIC_PERMISSIONS_SYSTEM.md`
- Member deletion functionality in Members Management page
- Volunteer birthdays display in dashboard calendar
- User search and filtering by role in Notifications page
- "Others" field in assisted persons' needs form
- Configurable observability system with Firebase-based logging configuration

### Changed
- **Firestore Security Rules**: Complete overhaul with atomic permission validation
  - Server-side permission checking functions (hasPermission, hasModuleAction, etc.)
  - Role-based permission validation (hasSecretaryPermission, hasLeaderPermission, etc.)
  - Support for custom permission grants and revokes
  - Applied to all major collections (members, events, blog, financial, visitors, assistance, etc.)
- Migrated all pages and components from `usePermissions` to `useAtomicPermissions`:
  - AdminDashboardPage, ONGSettingsPage, PermissionsManagementPage
  - Layout, ProtectedRoute, PublicRoute, PermissionButton
- Updated volunteer permissions to allow all authenticated users to read (for calendar birthdays)
- Improved error handling in FirebaseONGRepository for graceful permission denial
- Enhanced EventsCalendar to silently handle permission errors for volunteers
- Event time editing now properly combines date and time in both create and edit modals
- Logo display now uses configured church logo from admin settings

### Fixed
- Volunteer loading error: "Missing or insufficient permissions" in EventsCalendar
- Events not appearing in dashboard calendar
- Inability to change event time in event management
- TypeScript errors related to SystemModule.Financial (changed to SystemModule.Finance)
- Admin dashboard not showing all options: Added `PermissionAction.Manage` to all admin modules
- Admin dashboard missing logs module: Added `SystemModule.Logs` to admin permissions
- Console log pollution from verse services: Removed all console.log statements
- Permission denied errors across multiple collections:
  - Added Firestore security rules for 20+ missing collections
  - Financial collections: budgets, financialCategories, church_budgets, church_categories, church_transactions, church_donations, church_departments, church_department_transactions, church_department_transfers, ong_budgets, ong_categories, ong_transactions
  - Assistance collections: profissionaisAssistencia, atendimentos, agendamentosAssistencia
  - Forum collections: forumActivities, forumNotifications, userForumProfiles
  - Event collections: eventCategories
  - Devotional collections: devotionalComments, userPlanProgress
  - System collections: customRoles
- Error handling improved in all repositories to return empty arrays on permission errors (fail-safe design)
- FinancialService donation chart errors: Added graceful error handling for missing donations collection
- AssistenciaService statistics errors: Improved FirebaseAgendamentoAssistenciaRepository.findAll() error handling

### Security
- **Fail-secure design**: System denies access by default on errors
- **Multi-layer validation**: Client-side (UI/UX) + Service Layer + Server-side (Firestore Rules)
- Atomic permission checks ensure consistency across all layers
- Custom permission grants/revokes with proper precedence (Custom Grants > Role Permissions > Custom Revokes)
- Server-side validation cannot be bypassed by client code

### Performance
- 5-minute client-side cache reduces Firebase calls
- Batch permission operations minimize network requests
- Real-time subscriptions only for active users
- Synchronous permission checks (cached) for instant UI updates

### Documentation
- Added comprehensive atomic permissions system documentation
- Migration guide from old permission system
- Troubleshooting section for common issues
- Complete API reference with examples

## [1.0.0] - 2026-01-05

### Added
- Clean Architecture implementation with layered structure (Presentation, Domain, Application, Data, Infrastructure)
- Domain-Driven Design with modular organization
- Dependency Injection using both manual container and tsyringe
- EventBus for decoupled cross-module communication
- Firebase integration (Auth, Firestore, Storage, Functions) in southamerica-east1 region
- User authentication and role-based access control (admin, secretary, leader, member)
- Granular permission system with modules and actions
- Church management features:
  - Member management (CRUD, baptism tracking, status management)
  - Event scheduling and management
  - Daily devotionals
  - Visitor tracking
  - Prayer request management
- Content management system (Blog, announcements, media)
- Financial management (Church, department, and ONG finances)
- Social assistance programs (assistidos, fichas, help requests)
- Analytics and reporting dashboard
- ONG management features (volunteers, activities, reports, finances)
- Assets management system
- Public and protected routing with route guards
- React Context API for state management (Auth, Settings, Notifications)
- TypeScript path aliases for cleaner imports
- Tailwind CSS for styling with Design System principles
- Comprehensive Firestore security rules with RBAC
- Cloud Functions for privileged operations (user creation/deletion, file uploads)
- Real-time data synchronization with Firebase listeners
- Toast notifications system
- Profile management with photo upload
- Multi-language support structure
- Responsive modern UI design

### Security
- Role-based access control (RBAC) implementation
- Firestore security rules for data protection
- Firebase Auth integration with user status validation
- Input validation and sanitization
- Secure file upload handling via Cloud Functions

### Infrastructure
- Firebase Hosting configuration
- Cloud Functions deployment in São Paulo region
- Firestore indexes optimization
- Storage CORS configuration
- Build and deployment scripts
- ESLint and TypeScript configuration
- Testing setup with React Testing Library

[Unreleased]: https://github.com/JohnPitter/church-management/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/JohnPitter/church-management/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/JohnPitter/church-management/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JohnPitter/church-management/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JohnPitter/church-management/releases/tag/v1.0.0
