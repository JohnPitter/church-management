// Main Application Component
// Updated to use Clean Architecture with complete routing

import React, { Suspense } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate,
  Outlet 
} from 'react-router-dom';
import { AuthProvider } from './presentation/contexts/AuthContext';
import { SettingsProvider } from './presentation/contexts/SettingsContext';
import { NotificationProvider } from './presentation/contexts/NotificationContext';
import { DynamicFavicon } from './presentation/components/DynamicFavicon';
import { Toaster } from 'react-hot-toast';
import { ConfirmDialogProvider } from './presentation/components/ConfirmDialog';
import ErrorBoundary from './presentation/components/ErrorBoundary';

import { SystemModule, PermissionAction } from './domain/entities/Permission';

// Components
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { PublicRoute } from './presentation/components/PublicRoute';
import { Layout } from './presentation/components/Layout';
import AdminSetupGuard from './presentation/components/AdminSetupGuard';
import { PublicPage } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

const Home = React.lazy(() => import('./modules/church-management/home/presentation/pages/HomeSimplified'));
const LoginPage = React.lazy(() => import('./presentation/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('./presentation/pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const PainelPage = React.lazy(() => import('./presentation/pages/PainelPage').then(module => ({ default: module.PainelPage })));
const EventsPage = React.lazy(() => import('./presentation/pages/EventsPage').then(module => ({ default: module.EventsPage })));
const BlogPage = React.lazy(() => import('./presentation/pages/BlogPage').then(module => ({ default: module.BlogPage })));
const ProjectsPage = React.lazy(() => import('./presentation/pages/ProjectsPage').then(module => ({ default: module.ProjectsPage })));
const LivePage = React.lazy(() => import('./presentation/pages/LivePage').then(module => ({ default: module.LivePage })));
const ProfilePage = React.lazy(() => import('./presentation/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const UserManagementPage = React.lazy(() => import('./presentation/pages/UserManagementPage').then(module => ({ default: module.UserManagementPage })));
const AdminDashboardPage = React.lazy(() => import('./presentation/pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminLiveManagementPage = React.lazy(() => import('./presentation/pages/AdminLiveManagementPage').then(module => ({ default: module.AdminLiveManagementPage })));
const AdminBlogManagementPage = React.lazy(() => import('./presentation/pages/AdminBlogManagementPage').then(module => ({ default: module.AdminBlogManagementPage })));
const AdminProjectsManagementPage = React.lazy(() => import('./presentation/pages/AdminProjectsManagementPage').then(module => ({ default: module.AdminProjectsManagementPage })));
const AdminEventsManagementPage = React.lazy(() => import('./presentation/pages/AdminEventsManagementPage').then(module => ({ default: module.AdminEventsManagementPage })));
const AdminSettingsPage = React.lazy(() => import('./presentation/pages/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })));
const PrayerRequests = React.lazy(() => import('./presentation/pages/PrayerRequests'));
const AdminVisitorsPage = React.lazy(() => import('./presentation/pages/AdminVisitorsPage').then(module => ({ default: module.AdminVisitorsPage })));
const VisitorsPage = React.lazy(() => import('./presentation/pages/VisitorsPage').then(module => ({ default: module.VisitorsPage })));
const AdminReportsPage = React.lazy(() => import('./presentation/pages/AdminReportsPage').then(module => ({ default: module.AdminReportsPage })));
const AdminBackupPage = React.lazy(() => import('./presentation/pages/AdminBackupPage').then(module => ({ default: module.AdminBackupPage })));
const AdminFinancialPage = React.lazy(() => import('./presentation/pages/AdminFinancialPage').then(module => ({ default: module.AdminFinancialPage })));
const AdminLogsPage = React.lazy(() => import('./presentation/pages/AdminLogsPage').then(module => ({ default: module.AdminLogsPage })));
const AdminHomeSettingsPage = React.lazy(() => import('./presentation/pages/AdminHomeSettingsPage'));
const AdminDataMigrationPage = React.lazy(() => import('./presentation/pages/AdminDataMigrationPage'));
const AdminDevotionalPage = React.lazy(() => import('./presentation/pages/AdminDevotionalPage').then(module => ({ default: module.AdminDevotionalPage })));
const Devotionals = React.lazy(() => import('./presentation/pages/Devotionals').then(module => ({ default: module.Devotionals })));
const AdminForumPage = React.lazy(() => import('./presentation/pages/AdminForumPage').then(module => ({ default: module.AdminForumPage })));
const Forum = React.lazy(() => import('./presentation/pages/Forum').then(module => ({ default: module.Forum })));
const PendingApprovalPage = React.lazy(() => import('./presentation/pages/PendingApprovalPage').then(module => ({ default: module.PendingApprovalPage })));
const NotificationsPage = React.lazy(() => import('./presentation/pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const AdminNotificationsPage = React.lazy(() => import('./presentation/pages/AdminNotificationsPage').then(module => ({ default: module.AdminNotificationsPage })));
const AssistidosManagementPage = React.lazy(() => import('./presentation/pages/AssistidosManagementPage'));
const MembersManagementPage = React.lazy(() => import('./presentation/pages/MembersManagementPage'));
const PermissionsManagementPage = React.lazy(() => import('./presentation/pages/PermissionsManagementPage').then(module => ({ default: module.PermissionsManagementPage })));
const AssistenciaManagementPage = React.lazy(() => import('./presentation/pages/AssistenciaManagementPage'));
const ProfessionalDashboardPage = React.lazy(() => import('./presentation/pages/ProfessionalDashboardPage').then(module => ({ default: module.ProfessionalDashboardPage })));
const ProfessionalAssistenciaPage = React.lazy(() => import('./presentation/pages/ProfessionalAssistenciaPage'));
const ProfessionalFichasPage = React.lazy(() => import('./presentation/pages/ProfessionalFichasPage'));
const ProfessionalSessoesPage = React.lazy(() => import('./presentation/pages/ProfessionalSessoesPage'));
const FichasManagementPage = React.lazy(() => import('./presentation/pages/FichasManagementPage'));
const ProfessionalHelpRequestsPage = React.lazy(() => import('./presentation/pages/ProfessionalHelpRequestsPage').then(module => ({ default: module.ProfessionalHelpRequestsPage })));
const SetupPage = React.lazy(() => import('./presentation/pages/SetupPage'));
const SetupPageAlternative = React.lazy(() => import('./presentation/pages/SetupPageAlternative'));
const SetupPageSimple = React.lazy(() => import('./presentation/pages/SetupPageSimple'));
const WelcomePage = React.lazy(() => import('./presentation/pages/WelcomePage'));
const ONGSettingsPage = React.lazy(() => import('./presentation/pages/ONGSettingsPage'));
const ONGVolunteersPage = React.lazy(() => import('./presentation/pages/ONGVolunteersPage'));
const ONGActivitiesPage = React.lazy(() => import('./presentation/pages/ONGActivitiesPage'));
const ONGReportsPage = React.lazy(() => import('./presentation/pages/ONGReportsPage'));
const ONGFinancialPage = React.lazy(() => import('./presentation/pages/ONGFinancialPage'));
const AssetsManagementPage = React.lazy(() => import('./presentation/pages/AssetsManagementPage'));
const LeadershipPage = React.lazy(() => import('./presentation/pages/LeadershipPage').then(module => ({ default: module.LeadershipPage })));
const AdminLeadershipPage = React.lazy(() => import('./presentation/pages/AdminLeadershipPage').then(module => ({ default: module.AdminLeadershipPage })));
const PermissionTestPage = React.lazy(() => import('./presentation/pages/PermissionTestPage').then(module => ({ default: module.PermissionTestPage })));
const AboutPage = React.lazy(() => import('./presentation/pages/AboutPage').then(module => ({ default: module.AboutPage })));
const DonatePage = React.lazy(() => import('./presentation/pages/DonatePage').then(module => ({ default: module.DonatePage })));
const PrayerPage = React.lazy(() => import('./presentation/pages/PrayerPage').then(module => ({ default: module.PrayerPage })));
const ContactPage = React.lazy(() => import('./presentation/pages/ContactPage').then(module => ({ default: module.ContactPage })));

const PageFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
    Carregando...
  </div>
);

// Placeholder component for pages not yet migrated
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">Esta página está sendo migrada para a nova arquitetura.</p>
      <p className="text-gray-600 mt-2">Em breve estará disponível!</p>
    </div>
  </div>
);

// Create router with future flags
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <ConfirmDialogProvider>
              <ErrorBoundary>
                <DynamicFavicon />
                <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
                <AdminSetupGuard>
                  <Suspense fallback={<PageFallback />}>
                    <Outlet />
                  </Suspense>
                </AdminSetupGuard>
              </ErrorBoundary>
            </ConfirmDialogProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    ),
    children: [
      { 
        index: true, 
        element: <Home />
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'pending-approval', element: <PendingApprovalPage /> },
      { path: 'setup', element: <SetupPage /> },
      { path: 'setup-redirect', element: <SetupPageAlternative /> },
      { path: 'setup-simple', element: <SetupPageSimple /> },
      { path: 'welcome', element: <WelcomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'donate', element: <DonatePage /> },
      { path: 'prayer', element: <PrayerPage /> },
      { path: 'contact', element: <ContactPage /> },
      {
        path: 'painel',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Dashboard} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <PainelPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'events',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Events}
            requireModule={SystemModule.Events} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <EventsPage />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'devotionals',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Devotionals}
            requireModule={SystemModule.Devotionals} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <Devotionals />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'forum',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Forum}
            requireModule={SystemModule.Forum} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <Forum />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'forum/:categorySlug',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Forum}
            requireModule={SystemModule.Forum} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <Forum />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'forum/:categorySlug/:topicId',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Forum}
            requireModule={SystemModule.Forum} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <Forum />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'blog',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Blog}
            requireModule={SystemModule.Blog} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <BlogPage />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'projects',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Projects}
            requireModule={SystemModule.Projects} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ProjectsPage />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'live',
        element: (
          <PublicRoute 
            publicPage={PublicPage.Live}
            requireModule={SystemModule.Transmissions} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <LivePage />
            </Layout>
          </PublicRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'birthdays',
        element: (
          <ProtectedRoute>
            <Layout>
              <ComingSoon title="Aniversariantes" />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'leadership',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Leadership}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <LeadershipPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute
            requireAnyManagePermission={true}
          >
            <Layout>
              <AdminDashboardPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Users} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <UserManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/live',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Transmissions} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminLiveManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/blog',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Blog} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminBlogManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'visitors',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Visitors} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <VisitorsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/projects',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Projects} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminProjectsManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/events',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Events} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminEventsManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/prayer-requests',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Communication} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <PrayerRequests />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/visitors',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Visitors} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminVisitorsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Settings} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminSettingsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/reports',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Reports} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <AdminReportsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/backup',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Backup}
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminBackupPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/migration',
        element: (
          <ProtectedRoute
            allowAdminAccess={true}
          >
            <Layout>
              <AdminDataMigrationPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/financial',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Finance} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminFinancialPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/devotionals',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Devotionals}
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminDevotionalPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/leadership',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Leadership}
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminLeadershipPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/forum',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Forum} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminForumPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/logs',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Audit} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <AdminLogsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/notifications',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Notifications} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AdminNotificationsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/assistidos',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Assistidos} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AssistidosManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/members',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Members} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <MembersManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/permissions',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Permissions} 
            requireAction={PermissionAction.Manage}
            allowAdminAccess={true}
          >
            <Layout>
              <PermissionsManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/assistencias',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Assistance} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <AssistenciaManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/fichas',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Assistance} 
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <FichasManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/ong/settings',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.ONG} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ONGSettingsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/ong/volunteers',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.ONG} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ONGVolunteersPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/ong/activities',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.ONG} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ONGActivitiesPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/ong/reports',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.ONG}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ONGReportsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/ong/financial',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.ONG}
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <ONGFinancialPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/home-settings',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Settings}
            requireAction={PermissionAction.Update}
          >
            <Layout>
              <AdminHomeSettingsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/assets',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Assets}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <AssetsManagementPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'professional',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Assistance} 
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ProfessionalDashboardPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'professional/assistencias',
        element: (
          <ProtectedRoute 
            requireModule={SystemModule.Assistance} 
            requireAction={PermissionAction.Create}
          >
            <Layout>
              <ProfessionalAssistenciaPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'professional/fichas',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Assistance}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ProfessionalFichasPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'professional/sessoes',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Assistance}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ProfessionalSessoesPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      {
        path: 'professional/help-requests',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Assistance}
            requireAction={PermissionAction.View}
          >
            <Layout>
              <ProfessionalHelpRequestsPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      // Permission Test Page (Admin only)
      {
        path: '/admin/permission-test',
        element: (
          <ProtectedRoute
            requireModule={SystemModule.Permissions}
            requireAction={PermissionAction.Manage}
          >
            <Layout>
              <PermissionTestPage />
            </Layout>
          </ProtectedRoute>
        )
      },
      { path: '*', element: <Navigate to="/" /> }
    ]
  }
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
