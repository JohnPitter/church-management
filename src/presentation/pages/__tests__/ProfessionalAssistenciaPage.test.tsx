// Unit Tests - Admin Dashboard Page
// Comprehensive tests for admin dashboard functionality
// Tests: Dashboard layout, permission-based rendering, role displays, navigation links,
//        ONG quick actions, system status, and accessibility

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../AdminDashboardPage';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
      churchName: 'Test Church'
    },
    loading: false,
    updateSettings: jest.fn()
  })
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Test Admin',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date()
};

let mockUser: any = mockCurrentUser;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockUser,
    user: mockUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(true),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  })
}));

// Mock usePermissions hook
const mockHasPermission = jest.fn();
jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    loading: false
  })
}));

// Mock PermissionService
jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => ({
  PermissionService: class MockPermissionService {
    getRoleDisplayNameSync(role: string): string {
      const displayNames: Record<string, string> = {
        admin: 'Administrador',
        secretary: 'Secretario(a)',
        professional: 'Profissional',
        leader: 'Lider',
        member: 'Membro'
      };
      return displayNames[role] || role;
    }

    getAllRoles() {
      return Promise.resolve(['admin', 'secretary', 'professional', 'leader', 'member']);
    }

    getAllRolesSync() {
      return ['admin', 'secretary', 'professional', 'leader', 'member'];
    }

    getUserPermissions() {
      return Promise.resolve([]);
    }

    hasPermission() {
      return false;
    }

    getRolePermissions() {
      return Promise.resolve([]);
    }

    saveRolePermissions() {
      return Promise.resolve();
    }

    getUserPermissionOverrides() {
      return Promise.resolve(null);
    }

    saveUserPermissionOverrides() {
      return Promise.resolve();
    }

    clearAllCaches() {
      return;
    }
  }
}));

// Mock AdminVerseOfTheDay component
jest.mock('../../components/AdminVerseOfTheDay', () => ({
  AdminVerseOfTheDay: () => <div data-testid="verse-of-the-day">Verse of the Day</div>
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = mockCurrentUser;
    mockHasPermission.mockReturnValue(true);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the page header', () => {
      renderComponent();

      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Visão geral do sistema e ações rápidas')).toBeInTheDocument();
    });

    it('should render the AdminVerseOfTheDay component', () => {
      renderComponent();

      expect(screen.getByTestId('verse-of-the-day')).toBeInTheDocument();
    });

    it('should render the quick actions section', () => {
      renderComponent();

      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    });

    it('should render system status section', () => {
      renderComponent();

      expect(screen.getByText('Status do Sistema')).toBeInTheDocument();
      expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
      expect(screen.getByText('Autenticação')).toBeInTheDocument();
      expect(screen.getByText('Armazenamento')).toBeInTheDocument();
    });

    it('should display system status as functioning', () => {
      renderComponent();

      const functioningTexts = screen.getAllByText('Funcionando');
      expect(functioningTexts).toHaveLength(3);
    });
  });

  describe('Role Display', () => {
    it('should display the user role in the header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
      });
    });

    it('should show loading state initially before role is set', () => {
      mockUser = { ...mockCurrentUser, role: undefined };
      renderComponent();

      // When role is undefined, it should show 'Carregando...'
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should display different role names correctly', async () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Secretário(a)')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Actions', () => {
    it('should show user management action when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Users && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument();
    });

    it('should show member management action when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Members && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Membros')).toBeInTheDocument();
    });

    it('should hide user management action when user lacks permission', () => {
      mockHasPermission.mockReturnValue(false);
      mockUser = { ...mockCurrentUser, role: UserRole.Member };

      renderComponent();

      expect(screen.queryByText('Gerenciar Usuários')).not.toBeInTheDocument();
    });

    it('should show permissions management for admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.getByText('Gerenciar Permissões')).toBeInTheDocument();
    });

    it('should show blog management when user has blog permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Blog && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Blog')).toBeInTheDocument();
    });

    it('should show events management when user has events permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Events && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
    });

    it('should show financial system when user has finance permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Finance && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
    });

    it('should show reports when user has reports permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });

      renderComponent();

      expect(screen.getByText('Relatórios')).toBeInTheDocument();
    });

    it('should show settings when user has settings permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Settings && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    it('should show logs when user has logs permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Logs && action === PermissionAction.View;
      });

      renderComponent();

      expect(screen.getByText('Logs do Sistema')).toBeInTheDocument();
    });
  });

  describe('ONG Quick Actions', () => {
    it('should show ONG quick actions when user has ONG permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Ações Rápidas - Gerenciamento ONG')).toBeInTheDocument();
      expect(screen.getByText('Voluntários')).toBeInTheDocument();
      expect(screen.getByText('Atividades')).toBeInTheDocument();
    });

    it('should hide ONG quick actions when user lacks ONG permission', () => {
      mockHasPermission.mockReturnValue(false);

      renderComponent();

      expect(screen.queryByText('Ações Rápidas - Gerenciamento ONG')).not.toBeInTheDocument();
    });

    it('should show ONG settings link', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Informações da ONG')).toBeInTheDocument();
    });

    it('should show ONG financial link', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Controle financeiro')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for user management', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const userLink = screen.getByText('Gerenciar Usuários').closest('a');
      expect(userLink).toHaveAttribute('href', '/admin/users');
    });

    it('should have correct href for member management', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const memberLink = screen.getByText('Gerenciar Membros').closest('a');
      expect(memberLink).toHaveAttribute('href', '/admin/members');
    });

    it('should have correct href for settings', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const settingsLinks = screen.getAllByText('Configurações');
      const systemSettingsLink = settingsLinks.find(link =>
        link.closest('a')?.getAttribute('href') === '/admin/settings'
      );
      expect(systemSettingsLink?.closest('a')).toHaveAttribute('href', '/admin/settings');
    });

    it('should have correct href for logs', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const logsLink = screen.getByText('Logs do Sistema').closest('a');
      expect(logsLink).toHaveAttribute('href', '/admin/logs');
    });

    it('should have correct href for reports', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const reportsLinks = screen.getAllByText('Relatórios');
      const systemReportsLink = reportsLinks.find(link =>
        link.closest('a')?.getAttribute('href') === '/admin/reports'
      );
      expect(systemReportsLink?.closest('a')).toHaveAttribute('href', '/admin/reports');
    });
  });

  describe('Admin-Only Features', () => {
    it('should show migration option only for admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.getByText('Migração de Dados')).toBeInTheDocument();
    });

    it('should hide migration option for non-admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.queryByText('Migração de Dados')).not.toBeInTheDocument();
    });

    it('should show backup option when user has backup permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Backup && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Backup & Dados')).toBeInTheDocument();
    });
  });

  describe('Action Cards', () => {
    it('should display action descriptions', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      expect(screen.getByText('Visualizar e gerenciar usuários do sistema')).toBeInTheDocument();
      expect(screen.getByText('Administrar membros da igreja e seus dados')).toBeInTheDocument();
    });

    it('should display action icons', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      // Check for emoji icons in the document
      const actions = screen.getAllByRole('link');
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  describe('Member Role View', () => {
    it('should show limited actions for member role', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Member };
      mockHasPermission.mockReturnValue(false);

      renderComponent();

      // Should not show admin-only actions
      expect(screen.queryByText('Gerenciar Usuários')).not.toBeInTheDocument();
      expect(screen.queryByText('Sistema Financeiro')).not.toBeInTheDocument();
      expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
    });
  });

  describe('Secretary Role View', () => {
    it('should show appropriate actions for secretary role', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        // Secretary typically has access to members, blog, events
        const secretaryPermissions = [
          { module: SystemModule.Members, action: PermissionAction.Manage },
          { module: SystemModule.Blog, action: PermissionAction.Manage },
          { module: SystemModule.Events, action: PermissionAction.Manage }
        ];
        return secretaryPermissions.some(p => p.module === module && p.action === action);
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Membros')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Blog')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render grid layout for quick actions', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const quickActionsSection = screen.getByText('Ações Rápidas').closest('div');
      expect(quickActionsSection).toBeInTheDocument();
    });

    it('should render grid layout for system status', () => {
      renderComponent();

      const statusSection = screen.getByText('Status do Sistema').closest('div');
      expect(statusSection).toBeInTheDocument();
    });
  });

  describe('Content Management Actions', () => {
    it('should show devotionals management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Devotionals && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Devocionais')).toBeInTheDocument();
      expect(screen.getByText('Criar e gerenciar devocionais diários')).toBeInTheDocument();
    });

    it('should show transmissions management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Transmissions && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Transmissões')).toBeInTheDocument();
      expect(screen.getByText('Administrar transmissões ao vivo')).toBeInTheDocument();
    });

    it('should show projects management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Projects && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Projetos')).toBeInTheDocument();
      expect(screen.getByText('Administrar projetos e participantes')).toBeInTheDocument();
    });

    it('should show forum management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Forum && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Fórum')).toBeInTheDocument();
      expect(screen.getByText('Administrar discussões e categorias do fórum')).toBeInTheDocument();
    });

    it('should show leadership management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Leadership && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Liderança')).toBeInTheDocument();
      expect(screen.getByText('Administrar líderes e equipe pastoral')).toBeInTheDocument();
    });
  });

  describe('Church Management Actions', () => {
    it('should show visitors management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Visitors && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Visitantes')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar visitantes e acompanhamento')).toBeInTheDocument();
    });

    it('should show calendar when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Calendar && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Calendário')).toBeInTheDocument();
      expect(screen.getByText('Visualizar e gerenciar calendário da igreja')).toBeInTheDocument();
    });

    it('should show assistance management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Assistance && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciamento de Assistências')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar assistência psicológica, social, jurídica e médica')).toBeInTheDocument();
    });

    it('should show assistidos management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Assistidos && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Assistidos')).toBeInTheDocument();
      expect(screen.getByText('Administrar pessoas assistidas pela igreja')).toBeInTheDocument();
    });

    it('should show notifications management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Notifications && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Notificações')).toBeInTheDocument();
      expect(screen.getByText('Criar e enviar notificações personalizadas')).toBeInTheDocument();
    });

    it('should show prayer requests when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Communication && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Pedidos de Oração')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar pedidos de oração recebidos')).toBeInTheDocument();
    });
  });

  describe('Financial Actions', () => {
    it('should show assets management when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Assets && action === PermissionAction.View;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Patrimônio')).toBeInTheDocument();
      expect(screen.getByText('Administrar bens e ativos da igreja')).toBeInTheDocument();
    });

    it('should have correct href for financial system', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Finance && action === PermissionAction.Manage;
      });

      renderComponent();

      const financialLink = screen.getByText('Sistema Financeiro').closest('a');
      expect(financialLink).toHaveAttribute('href', '/admin/financial');
    });

    it('should have correct href for assets', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Assets && action === PermissionAction.View;
      });

      renderComponent();

      const assetsLink = screen.getByText('Gerenciar Patrimônio').closest('a');
      expect(assetsLink).toHaveAttribute('href', '/admin/assets');
    });
  });

  describe('System Actions', () => {
    it('should show home settings when user has update permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Settings && action === PermissionAction.Update;
      });

      renderComponent();

      expect(screen.getByText('Configurar Home Page')).toBeInTheDocument();
      expect(screen.getByText('Escolher estilo e configurar seções da home')).toBeInTheDocument();
    });

    it('should have correct href for home settings', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Settings && action === PermissionAction.Update;
      });

      renderComponent();

      const homeSettingsLink = screen.getByText('Configurar Home Page').closest('a');
      expect(homeSettingsLink).toHaveAttribute('href', '/admin/home-settings');
    });

    it('should have correct href for backup', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Backup && action === PermissionAction.Manage;
      });

      renderComponent();

      const backupLink = screen.getByText('Backup & Dados').closest('a');
      expect(backupLink).toHaveAttribute('href', '/admin/backup');
    });

    it('should have correct href for migration', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      const migrationLink = screen.getByText('Migração de Dados').closest('a');
      expect(migrationLink).toHaveAttribute('href', '/admin/migration');
    });
  });

  describe('ONG Navigation', () => {
    it('should have correct href for ONG settings', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      const ongSettingsLink = screen.getByText('Configurações').closest('a');
      expect(ongSettingsLink?.getAttribute('href')).toContain('/admin/ong/settings');
    });

    it('should have correct href for ONG volunteers', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      const volunteerLink = screen.getByText('Voluntários').closest('a');
      expect(volunteerLink?.getAttribute('href')).toContain('/admin/ong/volunteers');
    });

    it('should have correct href for ONG activities', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      const activitiesLink = screen.getByText('Atividades').closest('a');
      expect(activitiesLink?.getAttribute('href')).toContain('/admin/ong/activities');
    });

    it('should have correct href for ONG financial', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      const ongFinancialLinks = screen.getAllByText('Financeiro');
      const ongFinancialLink = ongFinancialLinks.find(link =>
        link.closest('a')?.getAttribute('href')?.includes('/admin/ong/financial')
      );
      expect(ongFinancialLink?.closest('a')).toHaveAttribute('href', '/admin/ong/financial');
    });

    it('should have correct href for ONG reports', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      const ongReportsLinks = screen.getAllByText('Relatórios');
      const ongReportsLink = ongReportsLinks.find(link =>
        link.closest('a')?.getAttribute('href')?.includes('/admin/ong/reports')
      );
      expect(ongReportsLink?.closest('a')).toHaveAttribute('href', '/admin/ong/reports');
    });
  });

  describe('Permission Service Integration', () => {
    it('should display role correctly for admin', async () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
      });
    });

    it('should handle null user role gracefully', () => {
      mockUser = { ...mockCurrentUser, role: undefined };
      renderComponent();

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should update role display when user role changes', async () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };

      const { rerender } = render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
      });

      // Change role
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };

      rerender(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Secretário(a)')).toBeInTheDocument();
      });
    });
  });

  describe('All Quick Actions Categories', () => {
    it('should show all core management actions when user has all permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      // Core Management
      expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Membros')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Permissões')).toBeInTheDocument();
    });

    it('should show all content management actions when user has all permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      // Content Management
      expect(screen.getByText('Gerenciar Blog')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Devocionais')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Transmissões')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Projetos')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Fórum')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Liderança')).toBeInTheDocument();
    });

    it('should show all church management actions when user has all permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      // Church Management
      expect(screen.getByText('Gerenciar Visitantes')).toBeInTheDocument();
      expect(screen.getByText('Calendário')).toBeInTheDocument();
      expect(screen.getByText('Gerenciamento de Assistências')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Assistidos')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Notificações')).toBeInTheDocument();
      expect(screen.getByText('Pedidos de Oração')).toBeInTheDocument();
    });

    it('should show all financial actions when user has all permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      // Financial
      expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Patrimônio')).toBeInTheDocument();
      expect(screen.getAllByText('Relatórios')[0]).toBeInTheDocument();
    });

    it('should show all system actions when user has all permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      // System
      expect(screen.getAllByText('Configurações')[0]).toBeInTheDocument();
      expect(screen.getByText('Logs do Sistema')).toBeInTheDocument();
      expect(screen.getByText('Backup & Dados')).toBeInTheDocument();
      expect(screen.getByText('Migração de Dados')).toBeInTheDocument();
      expect(screen.getByText('Configurar Home Page')).toBeInTheDocument();
    });
  });

  describe('Action Filtering', () => {
    it('should filter actions correctly based on permissions', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        // Only allow blog and events
        return (module === SystemModule.Blog && action === PermissionAction.Manage) ||
               (module === SystemModule.Events && action === PermissionAction.Manage);
      });

      renderComponent();

      // Should show allowed actions
      expect(screen.getByText('Gerenciar Blog')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();

      // Should not show disallowed actions
      expect(screen.queryByText('Gerenciar Usuários')).not.toBeInTheDocument();
      expect(screen.queryByText('Sistema Financeiro')).not.toBeInTheDocument();
    });

    it('should show no quick actions when user has no permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Member };
      mockHasPermission.mockReturnValue(false);

      renderComponent();

      // Should still render the quick actions section header
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();

      // But should have no action links
      const quickActionsSection = screen.getByText('Ações Rápidas').closest('.bg-white');
      const links = quickActionsSection?.querySelectorAll('a') || [];
      expect(links.length).toBe(0);
    });
  });

  describe('Visual Elements', () => {
    it('should display system status icons', () => {
      renderComponent();

      // Check for status emojis
      const statusSection = screen.getByText('Status do Sistema').closest('.bg-white');
      expect(statusSection).toBeInTheDocument();

      // Status indicators should be visible
      expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
      expect(screen.getByText('Autenticação')).toBeInTheDocument();
      expect(screen.getByText('Armazenamento')).toBeInTheDocument();
    });

    it('should display role badge in header', async () => {
      renderComponent();

      await waitFor(() => {
        const roleBadge = screen.getByText('Administrador');
        expect(roleBadge).toBeInTheDocument();
        expect(roleBadge.closest('span')).toHaveClass('inline-flex', 'items-center');
      });
    });

    it('should display ONG section header with emoji', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Ações Rápidas - Gerenciamento ONG')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const h1 = screen.getByText('Painel Administrativo');
      expect(h1.tagName).toBe('H1');

      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible link descriptions', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const userManagementLink = screen.getByText('Gerenciar Usuários').closest('a');
      expect(userManagementLink).toHaveTextContent('Visualizar e gerenciar usuários do sistema');
    });

    it('should render all links as proper anchor elements', () => {
      mockHasPermission.mockReturnValue(true);
      renderComponent();

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Leader Role View', () => {
    it('should show appropriate actions for leader role', () => {
      mockUser = { ...mockCurrentUser, role: 'leader' as any };
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        // Leader typically has access to events, prayer requests, communication
        const leaderPermissions = [
          { module: SystemModule.Events, action: PermissionAction.Manage },
          { module: SystemModule.Communication, action: PermissionAction.Manage },
          { module: SystemModule.Calendar, action: PermissionAction.Manage }
        ];
        return leaderPermissions.some(p => p.module === module && p.action === action);
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
      expect(screen.getByText('Pedidos de Oração')).toBeInTheDocument();
      expect(screen.getByText('Calendário')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user object', () => {
      mockUser = null;
      renderComponent();

      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should render correctly without any permissions', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Member };
      mockHasPermission.mockReturnValue(false);

      renderComponent();

      // Basic structure should still render
      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Status do Sistema')).toBeInTheDocument();
      expect(screen.getByTestId('verse-of-the-day')).toBeInTheDocument();
    });
  });
});
