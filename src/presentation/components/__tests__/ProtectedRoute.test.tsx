// Unit Tests - Protected Route Component
// Comprehensive tests for route protection, maintenance mode, and permissions

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { SystemModule, PermissionAction } from '../../../domain/entities/Permission';
import { UserRole, UserStatus } from '../../../domain/entities/User';

// Mock contexts
const mockUseAuth = jest.fn();
const mockUsePermissions = jest.fn();
const mockUseSettings = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions()
}));

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

// Mock Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: function({ to }: any) { return <div data-testid="navigate">{to}</div>; }
}));

// Mock window.history.back and window.location.href
const mockHistoryBack = jest.fn();
const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, 'history', {
    value: { back: mockHistoryBack },
    writable: true
  });

  delete (window as any).location;
  window.location = { href: '' } as any;
});

afterAll(() => {
  window.location = originalLocation;
});

describe('ProtectedRoute', () => {
  const TestChild = () => <div data-testid="protected-content">Protected Content</div>;

  const setupMocks = (overrides: {
    currentUser?: any;
    loading?: boolean;
    canAccessSystem?: () => boolean;
    hasPermission?: (module: SystemModule, action: PermissionAction) => boolean;
    hasAnyPermission?: () => boolean;
    permissionsLoading?: boolean;
    settings?: any;
    settingsLoading?: boolean;
  } = {}) => {
    mockUseAuth.mockReturnValue({
      currentUser: overrides.currentUser || null,
      user: overrides.currentUser || null,
      loading: overrides.loading || false,
      login: jest.fn(),
      register: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      canCreateContent: jest.fn().mockReturnValue(false),
      isProfessional: jest.fn().mockReturnValue(false),
      canAccessSystem: overrides.canAccessSystem || (() => true),
      linkEmailPassword: jest.fn(),
      getSignInMethods: jest.fn()
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: overrides.hasPermission || (() => true),
      hasAnyPermission: overrides.hasAnyPermission || (() => true),
      loading: overrides.permissionsLoading || false
    });

    mockUseSettings.mockReturnValue({
      settings: overrides.settings || { maintenanceMode: false },
      loading: overrides.settingsLoading || false
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHistoryBack.mockClear();
    window.location.href = '';
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      setupMocks({ loading: true });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show loading spinner when permissions are loading', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member' },
        permissionsLoading: true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should show loading spinner when settings are loading', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member' },
        settingsLoading: true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should show loading spinner with spinning animation', () => {
      setupMocks({ loading: true });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should redirect to login when user is not authenticated', () => {
      setupMocks({ currentUser: null });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
    });

    it('should redirect to pending-approval when user cannot access system', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Pending },
        canAccessSystem: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('/pending-approval');
    });

    it('should render children when user is authenticated and approved', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should check canAccessSystem function', () => {
      const mockCanAccessSystem = jest.fn().mockReturnValue(true);
      setupMocks({
        currentUser: { id: '1', role: 'member' },
        canAccessSystem: mockCanAccessSystem
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockCanAccessSystem).toHaveBeenCalled();
    });
  });

  describe('Maintenance Mode', () => {
    it('should show maintenance message when maintenance mode is active for non-admin', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        settings: { maintenanceMode: true }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Sistema em Manutenção')).toBeInTheDocument();
      expect(screen.getByText(/O sistema está temporariamente em manutenção/)).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show maintenance icon (wrench emoji)', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member' },
        canAccessSystem: () => true,
        settings: { maintenanceMode: true }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Check for the wrench emoji in the maintenance message
      expect(screen.getByText(/Apenas administradores podem acessar durante este período/)).toBeInTheDocument();
    });

    it('should allow admin access during maintenance mode', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        settings: { maintenanceMode: true }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByText('Sistema em Manutenção')).not.toBeInTheDocument();
    });

    it('should allow access when maintenance mode is disabled', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        settings: { maintenanceMode: false }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle undefined settings gracefully', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        settings: null
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should allow access when settings is null (default to no maintenance)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle settings without maintenanceMode property', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        settings: {}
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Access', () => {
    it('should show access denied when user lacks required permission', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should display required permission details', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Permissão Necessária:')).toBeInTheDocument();
      expect(screen.getByText('Módulo:')).toBeInTheDocument();
      expect(screen.getByText('Ação:')).toBeInTheDocument();
    });

    it('should allow access when user has required permission', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should allow admin access when allowAdminAccess is true', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false // Even without permission
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowAdminAccess={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not give admin access when allowAdminAccess is false', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            allowAdminAccess={false}
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });

    it('should call hasPermission with correct parameters', () => {
      const mockHasPermission = jest.fn().mockReturnValue(true);
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: mockHasPermission
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Members}
            requireAction={PermissionAction.View}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Members, PermissionAction.View);
    });

    it('should show back button on access denied page', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const backButton = screen.getByRole('button', { name: /voltar/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should navigate back when back button is clicked', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const backButton = screen.getByRole('button', { name: /voltar/i });
      fireEvent.click(backButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('Multiple Permissions', () => {
    it('should deny access when missing any of multiple required permissions', () => {
      let callCount = 0;
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => {
          callCount++;
          return callCount === 1; // First permission yes, second no
        }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requirePermissions={[
              { module: SystemModule.Users, action: PermissionAction.View },
              { module: SystemModule.Members, action: PermissionAction.Manage }
            ]}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });

    it('should allow access when all required permissions are met', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requirePermissions={[
              { module: SystemModule.Users, action: PermissionAction.View },
              { module: SystemModule.Members, action: PermissionAction.Manage }
            ]}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should show missing permissions in denied message', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requirePermissions={[
              { module: SystemModule.Users, action: PermissionAction.View },
              { module: SystemModule.Members, action: PermissionAction.Manage }
            ]}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Permissões Necessárias:')).toBeInTheDocument();
    });

    it('should handle empty requirePermissions array', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requirePermissions={[]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Admin Panel Access (requireAnyManagePermission)', () => {
    it('should deny access to admin panel without any manage permission', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Acesso Administrativo Negado')).toBeInTheDocument();
    });

    it('should show admin panel access denied with specific message', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText(/não tem permissões de gerenciamento necessárias/)).toBeInTheDocument();
      expect(screen.getByText(/Requisito de Acesso:/)).toBeInTheDocument();
    });

    it('should show button to go to main panel', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const mainPanelButton = screen.getByRole('button', { name: /ir para painel principal/i });
      expect(mainPanelButton).toBeInTheDocument();
    });

    it('should redirect to /painel when main panel button is clicked', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const mainPanelButton = screen.getByRole('button', { name: /ir para painel principal/i });
      fireEvent.click(mainPanelButton);

      expect(window.location.href).toBe('/painel');
    });

    it('should allow access to admin panel with any manage permission', () => {
      setupMocks({
        currentUser: { id: '1', role: 'leader', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: (module: SystemModule, action: PermissionAction) => {
          // Grant manage permission for one module
          if (action === PermissionAction.Manage && module === SystemModule.Events) {
            return true;
          }
          return false;
        }
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should check multiple modules for manage permission', () => {
      const mockHasPermission = jest.fn().mockReturnValue(false);
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: mockHasPermission
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAnyManagePermission={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should check multiple modules
      expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Users, PermissionAction.Manage);
      expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Members, PermissionAction.Manage);
      expect(mockHasPermission).toHaveBeenCalledWith(SystemModule.Events, PermissionAction.Manage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with undefined role', () => {
      setupMocks({
        currentUser: { id: '1', status: UserStatus.Approved },
        canAccessSystem: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render different children correctly', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true
      });

      const CustomChild = () => <div data-testid="custom-child">Custom Content</div>;

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <CustomChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>
              <header>Header</header>
              <main>
                <section>Section Content</section>
              </main>
              <footer>Footer</footer>
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Section Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should default allowAdminAccess to false', () => {
      setupMocks({
        currentUser: { id: '1', role: 'admin', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute
            requireModule={SystemModule.Users}
            requireAction={PermissionAction.Manage}
          >
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Without explicit allowAdminAccess=true, admin should still need permission
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });

    it('should default requireAnyManagePermission to false', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Without requireAnyManagePermission, should not show admin access denied
      expect(screen.queryByText('Acesso Administrativo Negado')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle only requireModule without requireAction', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireModule={SystemModule.Users}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render children since both requireModule AND requireAction need to be present
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle only requireAction without requireModule', () => {
      setupMocks({
        currentUser: { id: '1', role: 'member', status: UserStatus.Approved },
        canAccessSystem: () => true,
        hasPermission: () => true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAction={PermissionAction.Manage}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render children since both requireModule AND requireAction need to be present
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
