// Main Application Component
// Updated to use Clean Architecture with complete routing

import React from 'react';
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

// Pages
import Home from './modules/church-management/home/presentation/pages/HomeSimplified';
import { LoginPage } from './presentation/pages/LoginPage';
import { RegisterPage } from './presentation/pages/RegisterPage';
import { PainelPage } from './presentation/pages/PainelPage';
import { EventsPage } from './presentation/pages/EventsPage';
import { BlogPage } from './presentation/pages/BlogPage';
import { ProjectsPage } from './presentation/pages/ProjectsPage';
import { LivePage } from './presentation/pages/LivePage';
import { ProfilePage } from './presentation/pages/ProfilePage';
import { UserManagementPage } from './presentation/pages/UserManagementPage';
import { AdminDashboardPage } from './presentation/pages/AdminDashboardPage';
import { AdminLiveManagementPage } from './presentation/pages/AdminLiveManagementPage';
import { AdminBlogManagementPage } from './presentation/pages/AdminBlogManagementPage';
import { AdminProjectsManagementPage } from './presentation/pages/AdminProjectsManagementPage';
import { AdminEventsManagementPage } from './presentation/pages/AdminEventsManagementPage';
import { AdminSettingsPage } from './presentation/pages/AdminSettingsPage';
import PrayerRequests from './presentation/pages/PrayerRequests';
import { AdminVisitorsPage } from './presentation/pages/AdminVisitorsPage';
import { VisitorsPage } from './presentation/pages/VisitorsPage';
import { AdminReportsPage } from './presentation/pages/AdminReportsPage';
import { AdminBackupPage } from './presentation/pages/AdminBackupPage';
import { AdminFinancialPage } from './presentation/pages/AdminFinancialPage';
import { AdminLogsPage } from './presentation/pages/AdminLogsPage';
import AdminHomeSettingsPage from './presentation/pages/AdminHomeSettingsPage';
import AdminDataMigrationPage from './presentation/pages/AdminDataMigrationPage';
import { AdminDevotionalPage } from './presentation/pages/AdminDevotionalPage';
import { Devotionals } from './presentation/pages/Devotionals';
import { AdminForumPage } from './presentation/pages/AdminForumPage';
import { Forum } from './presentation/pages/Forum';
import { PendingApprovalPage } from './presentation/pages/PendingApprovalPage';
import { NotificationsPage } from './presentation/pages/NotificationsPage';
import { AdminNotificationsPage } from './presentation/pages/AdminNotificationsPage';
import AssistidosManagementPage from './presentation/pages/AssistidosManagementPage';
import MembersManagementPage from './presentation/pages/MembersManagementPage';
import { PermissionsManagementPage } from './presentation/pages/PermissionsManagementPage';
import { SystemModule, PermissionAction } from './domain/entities/Permission';
import AssistenciaManagementPage from './presentation/pages/AssistenciaManagementPage';
import { ProfessionalDashboardPage } from './presentation/pages/ProfessionalDashboardPage';
import ProfessionalAssistenciaPage from './presentation/pages/ProfessionalAssistenciaPage';
import ProfessionalFichasPage from './presentation/pages/ProfessionalFichasPage';
import FichasManagementPage from './presentation/pages/FichasManagementPage';
import { ProfessionalHelpRequestsPage } from './presentation/pages/ProfessionalHelpRequestsPage';
import SetupPage from './presentation/pages/SetupPage';
import SetupPageAlternative from './presentation/pages/SetupPageAlternative';
import SetupPageSimple from './presentation/pages/SetupPageSimple';
import WelcomePage from './presentation/pages/WelcomePage';
import ONGSettingsPage from './presentation/pages/ONGSettingsPage';
import ONGVolunteersPage from './presentation/pages/ONGVolunteersPage';
import ONGActivitiesPage from './presentation/pages/ONGActivitiesPage';
import ONGReportsPage from './presentation/pages/ONGReportsPage';
import ONGFinancialPage from './presentation/pages/ONGFinancialPage';
import AssetsManagementPage from './presentation/pages/AssetsManagementPage';

// Components
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { PublicRoute } from './presentation/components/PublicRoute';
import { Layout } from './presentation/components/Layout';
import AdminSetupGuard from './presentation/components/AdminSetupGuard';
import { PublicPage } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

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
            <DynamicFavicon />
            <AdminSetupGuard>
              <Outlet />
            </AdminSetupGuard>
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
          <ProtectedRoute>
            <Layout>
              <ComingSoon title="Liderança" />
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
      { path: '*', element: <Navigate to="/" /> }
    ]
  }
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
