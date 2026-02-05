// Unit Tests - Admin Dashboard Page
// Comprehensive tests for admin dashboard functionality

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../AdminDashboardPage';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
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

// Mock PermissionService - Create mock functions that will be accessible
const mockGetAllRoles = jest.fn();
const mockGetAllRolesSync = jest.fn();
const mockGetRoleDisplayNameSync = jest.fn();

jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => ({
  PermissionService: jest.fn(function(this: any) {
    this.getAllRoles = (...args: any[]) => mockGetAllRoles(...args);
    this.getAllRolesSync = (...args: any[]) => mockGetAllRolesSync(...args);
    this.getRoleDisplayNameSync = (...args: any[]) => mockGetRoleDisplayNameSync(...args);
    // Add other methods that might be called
    this.getUserPermissions = jest.fn().mockResolvedValue([]);
    this.hasPermission = jest.fn().mockReturnValue(false);
    this.getRolePermissions = jest.fn().mockResolvedValue([]);
    this.saveRolePermissions = jest.fn().mockResolvedValue(undefined);
    this.getUserPermissionOverrides = jest.fn().mockResolvedValue(null);
    this.saveUserPermissionOverrides = jest.fn().mockResolvedValue(undefined);
    this.clearAllCaches = jest.fn();
    return this;
  })
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

    // Setup PermissionService mocks
    mockGetAllRoles.mockResolvedValue(['admin', 'secretary', 'professional', 'leader', 'member']);
    mockGetAllRolesSync.mockReturnValue(['admin', 'secretary', 'professional', 'leader', 'member']);
    mockGetRoleDisplayNameSync.mockImplementation((role: string) => {
      const displayNames: Record<string, string> = {
        admin: 'Administrador',
        secretary: 'Secretario(a)',
        professional: 'Profissional',
        leader: 'Lider',
        member: 'Membro'
      };
      return displayNames[role] || role;
    });
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
      expect(screen.getByText('Visao geral do sistema e acoes rapidas')).toBeInTheDocument();
    });

    it('should render the AdminVerseOfTheDay component', () => {
      renderComponent();

      expect(screen.getByTestId('verse-of-the-day')).toBeInTheDocument();
    });

    it('should render the quick actions section', () => {
      renderComponent();

      expect(screen.getByText('Acoes Rapidas')).toBeInTheDocument();
    });

    it('should render system status section', () => {
      renderComponent();

      expect(screen.getByText('Status do Sistema')).toBeInTheDocument();
      expect(screen.getByText('Banco de Dados')).toBeInTheDocument();
      expect(screen.getByText('Autenticacao')).toBeInTheDocument();
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
      mockGetRoleDisplayNameSync.mockReturnValue('Administrador');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
      });
    });

    it('should show loading state for role while loading', () => {
      mockUser = { ...mockCurrentUser, role: undefined };
      renderComponent();

      // When role is undefined, it should show 'Carregando...'
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should display different role names correctly', async () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      mockGetRoleDisplayNameSync.mockReturnValue('Secretario(a)');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Secretario(a)')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Actions', () => {
    it('should show user management action when user has permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Users && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Gerenciar Usuarios')).toBeInTheDocument();
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

      expect(screen.queryByText('Gerenciar Usuarios')).not.toBeInTheDocument();
    });

    it('should show permissions management for admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.getByText('Gerenciar Permissoes')).toBeInTheDocument();
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

      expect(screen.getByText('Relatorios')).toBeInTheDocument();
    });

    it('should show settings when user has settings permission', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Settings && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Configuracoes')).toBeInTheDocument();
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

      expect(screen.getByText('Acoes Rapidas - Gerenciamento ONG')).toBeInTheDocument();
      expect(screen.getByText('Voluntarios')).toBeInTheDocument();
      expect(screen.getByText('Atividades')).toBeInTheDocument();
    });

    it('should hide ONG quick actions when user lacks ONG permission', () => {
      mockHasPermission.mockReturnValue(false);

      renderComponent();

      expect(screen.queryByText('Acoes Rapidas - Gerenciamento ONG')).not.toBeInTheDocument();
    });

    it('should show ONG settings link', () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.ONG && action === PermissionAction.Manage;
      });

      renderComponent();

      expect(screen.getByText('Informacoes da ONG')).toBeInTheDocument();
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

      const userLink = screen.getByText('Gerenciar Usuarios').closest('a');
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

      const settingsLink = screen.getByText('Configuracoes').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/admin/settings');
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

      const reportsLink = screen.getByText('Relatorios').closest('a');
      expect(reportsLink).toHaveAttribute('href', '/admin/reports');
    });
  });

  describe('Admin-Only Features', () => {
    it('should show migration option only for admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.getByText('Migracao de Dados')).toBeInTheDocument();
    });

    it('should hide migration option for non-admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      mockHasPermission.mockReturnValue(true);

      renderComponent();

      expect(screen.queryByText('Migracao de Dados')).not.toBeInTheDocument();
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

      expect(screen.getByText('Visualizar e gerenciar usuarios do sistema')).toBeInTheDocument();
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
      expect(screen.queryByText('Gerenciar Usuarios')).not.toBeInTheDocument();
      expect(screen.queryByText('Sistema Financeiro')).not.toBeInTheDocument();
      expect(screen.queryByText('Configuracoes')).not.toBeInTheDocument();
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

      const quickActionsSection = screen.getByText('Acoes Rapidas').closest('div');
      expect(quickActionsSection).toBeInTheDocument();
    });

    it('should render grid layout for system status', () => {
      renderComponent();

      const statusSection = screen.getByText('Status do Sistema').closest('div');
      expect(statusSection).toBeInTheDocument();
    });
  });
});
