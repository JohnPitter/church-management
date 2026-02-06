// Unit Tests - PermissionsManagementPage
// Comprehensive tests for permissions and role management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PermissionsManagementPage } from '../PermissionsManagementPage';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock PermissionService
const mockGetAllRoles = jest.fn();
const mockGetAllRolesSync = jest.fn();
const mockGetRoleDisplayNameSync = jest.fn();
const mockGetUserPermissions = jest.fn();
const mockHasPermission = jest.fn();
const mockGetRolePermissions = jest.fn();
const mockSaveRolePermissions = jest.fn();
const mockGetUserPermissionOverrides = jest.fn();
const mockSaveUserPermissionOverrides = jest.fn();
const mockClearAllCaches = jest.fn();
const mockGetAllCustomRoles = jest.fn();
const mockCreateCustomRole = jest.fn();
const mockUpdateCustomRole = jest.fn();
const mockDeleteCustomRole = jest.fn();
const mockGetPermissionMatrix = jest.fn();
const mockGetAllUserOverrides = jest.fn();
const mockUpdateRolePermissions = jest.fn();
const mockResetRolePermissionsToDefault = jest.fn();
const mockUpdateUserPermissionOverrides = jest.fn();

jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => {
  return {
    PermissionService: function() {
      return {
        getAllRoles: (...args: any[]) => mockGetAllRoles(...args),
        getAllRolesSync: (...args: any[]) => mockGetAllRolesSync(...args),
        getRoleDisplayNameSync: (...args: any[]) => mockGetRoleDisplayNameSync(...args),
        getUserPermissions: (...args: any[]) => mockGetUserPermissions(...args),
        hasPermission: (...args: any[]) => mockHasPermission(...args),
        getRolePermissions: (...args: any[]) => mockGetRolePermissions(...args),
        saveRolePermissions: (...args: any[]) => mockSaveRolePermissions(...args),
        getUserPermissionOverrides: (...args: any[]) => mockGetUserPermissionOverrides(...args),
        saveUserPermissionOverrides: (...args: any[]) => mockSaveUserPermissionOverrides(...args),
        clearAllCaches: (...args: any[]) => mockClearAllCaches(...args),
        clearAllCache: (...args: any[]) => mockClearAllCaches(...args),
        getAllCustomRoles: (...args: any[]) => mockGetAllCustomRoles(...args),
        createCustomRole: (...args: any[]) => mockCreateCustomRole(...args),
        updateCustomRole: (...args: any[]) => mockUpdateCustomRole(...args),
        deleteCustomRole: (...args: any[]) => mockDeleteCustomRole(...args),
        getPermissionMatrix: (...args: any[]) => mockGetPermissionMatrix(...args),
        getAllUserOverrides: (...args: any[]) => mockGetAllUserOverrides(...args),
        updateRolePermissions: (...args: any[]) => mockUpdateRolePermissions(...args),
        resetRolePermissionsToDefault: (...args: any[]) => mockResetRolePermissionsToDefault(...args),
        updateUserPermissionOverrides: (...args: any[]) => mockUpdateUserPermissionOverrides(...args)
      };
    }
  };
});

// Mock FirebaseUserRepository
const mockFindAll = jest.fn();
const mockUpdateRole = jest.fn();
const mockApproveUser = jest.fn();
const mockSuspendUser = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => {
  return {
    FirebaseUserRepository: function() {
      return {
        findAll: (...args: any[]) => mockFindAll(...args),
        updateRole: (...args: any[]) => mockUpdateRole(...args),
        approveUser: (...args: any[]) => mockApproveUser(...args),
        suspendUser: (...args: any[]) => mockSuspendUser(...args),
        delete: (...args: any[]) => mockDelete(...args),
        create: (...args: any[]) => mockCreate(...args),
        update: (...args: any[]) => mockUpdate(...args)
      };
    }
  };
});

// Mock PublicPageService
const mockGetPublicPageConfig = jest.fn();
const mockGetPublicPageConfigs = jest.fn();
const mockUpdatePublicPageConfig = jest.fn();
const mockUpdatePageVisibility = jest.fn();
const mockUpdatePageRegistrationSetting = jest.fn();

jest.mock('@modules/content-management/public-pages/application/services/PublicPageService', () => {
  return {
    PublicPageService: function() {
      return {
        getPublicPageConfig: (...args: any[]) => mockGetPublicPageConfig(...args),
        getPublicPageConfigs: (...args: any[]) => mockGetPublicPageConfigs(...args),
        updatePublicPageConfig: (...args: any[]) => mockUpdatePublicPageConfig(...args),
        updatePageVisibility: (...args: any[]) => mockUpdatePageVisibility(...args),
        updatePageRegistrationSetting: (...args: any[]) => mockUpdatePageRegistrationSetting(...args)
      };
    }
  };
});

// Mock AuthContext
let mockCurrentUser: User | null = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    user: mockCurrentUser,
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
const mockRefreshPermissions = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    refreshPermissions: mockRefreshPermissions,
    hasPermission: jest.fn().mockReturnValue(true),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    loading: false
  })
}));

// Mock CreateRoleModal
jest.mock('../../components/CreateRoleModal', () => ({
  CreateRoleModal: ({ isOpen, onClose, onCreateRole, loading }: any) => (
    isOpen ? (
      <div data-testid='create-role-modal'>
        <button onClick={onClose} data-testid='close-role-modal'>Close</button>
        <button
          onClick={() => onCreateRole({ 
            roleId: 'custom-role-1', 
            displayName: 'Custom Role',
            description: 'A custom role',
            permissions: []
          })}
          data-testid='submit-role-modal'
          disabled={loading}
        >
          Create Role
        </button>
      </div>
    ) : null
  )
}));

// Test data factories
const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-06-01'),
  ...overrides
});

describe('PermissionsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default current user (admin)
    mockCurrentUser = createTestUser({
      id: 'admin-1',
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: UserRole.Admin,
      status: UserStatus.Approved
    });

    // Default permission service responses
    mockGetAllRoles.mockResolvedValue(['admin', 'secretary', 'professional', 'leader', 'member']);
    mockGetAllRolesSync.mockReturnValue(['admin', 'secretary', 'professional', 'leader', 'member']);
    mockGetRoleDisplayNameSync.mockImplementation((role: string) => {
      const displayNames: Record<string, string> = {
        admin: 'Administrador',
        secretary: 'Secretário',
        professional: 'Profissional',
        leader: 'Líder',
        member: 'Membro'
      };
      return displayNames[role] || role;
    });
    mockGetUserPermissions.mockResolvedValue([]);
    mockHasPermission.mockReturnValue(false);
    mockGetRolePermissions.mockResolvedValue(new Map());
    mockSaveRolePermissions.mockResolvedValue(undefined);
    mockGetUserPermissionOverrides.mockResolvedValue([]);
    mockSaveUserPermissionOverrides.mockResolvedValue(undefined);
    mockClearAllCaches.mockImplementation(() => {});
    mockGetAllCustomRoles.mockResolvedValue([]);
    mockCreateCustomRole.mockResolvedValue(undefined);
    mockUpdateCustomRole.mockResolvedValue(undefined);
    mockDeleteCustomRole.mockResolvedValue(undefined);
    mockGetPermissionMatrix.mockResolvedValue(new Map());
    mockGetPublicPageConfigs.mockResolvedValue({});
    mockUpdatePageVisibility.mockResolvedValue(undefined);
    mockUpdatePageRegistrationSetting.mockResolvedValue(undefined);
    mockGetAllUserOverrides.mockResolvedValue([]);
    mockUpdateRolePermissions.mockResolvedValue(undefined);
    mockResetRolePermissionsToDefault.mockResolvedValue(undefined);
    mockUpdateUserPermissionOverrides.mockResolvedValue(undefined);

    // Default repository responses
    mockFindAll.mockResolvedValue([]);
    
    // Default public page config
    mockGetPublicPageConfig.mockResolvedValue({
      home: { isPublic: true, requireAuth: false },
      events: { isPublic: true, requireAuth: false },
      blog: { isPublic: true, requireAuth: false },
      devotionals: { isPublic: false, requireAuth: true },
      forum: { isPublic: false, requireAuth: true },
      prayerRequests: { isPublic: false, requireAuth: true }
    });
    mockUpdatePublicPageConfig.mockResolvedValue(undefined);
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching data', async () => {
      mockGetRolePermissions.mockImplementation(() => new Promise(() => {}));

      render(<PermissionsManagementPage />);

      expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
    });

    it('should hide loading spinner after data is loaded', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockFindAll.mockResolvedValue([createTestUser()]);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });
    });

    it('should show saving state when updating permissions', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Salvando/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // TAB NAVIGATION
  // ===========================================
  describe('Tab Navigation', () => {
    it('should render all four tabs', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Permissões por Função/i)).toBeInTheDocument();
      });
    });

    it('should switch to users tab when clicked', async () => {
      mockFindAll.mockResolvedValue([createTestUser()]);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalled();
      });
    });

    it('should switch to custom roles tab when clicked', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const customRolesTab = screen.getByText(/Funções Personalizadas/i);
      fireEvent.click(customRolesTab);

      await waitFor(() => {
        expect(mockGetAllCustomRoles).toHaveBeenCalled();
      });
    });

    it('should switch to public pages tab when clicked', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const publicPagesTab = screen.getByText(/Páginas Públicas/i);
      fireEvent.click(publicPagesTab);

      await waitFor(() => {
        expect(mockGetPublicPageConfig).toHaveBeenCalled();
      });
    });
  });

  // ===========================================
  // ROLES TAB
  // ===========================================
  describe('Roles Tab', () => {
    it('should display role selector', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const roleSelect = screen.getByRole('combobox', { name: /função/i });
      expect(roleSelect).toBeInTheDocument();
    });

    it('should load permissions when role is selected', async () => {
      const mockPermissions = new Map([
        [SystemModule.Members, [PermissionAction.View]]
      ]);
      mockGetRolePermissions.mockResolvedValue(mockPermissions);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const roleSelect = screen.getByRole('combobox', { name: /função/i });
      fireEvent.change(roleSelect, { target: { value: 'leader' } });

      await waitFor(() => {
        expect(mockGetRolePermissions).toHaveBeenCalledWith('leader');
      });
    });

    it('should display system modules', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Membros/i)).toBeInTheDocument();
      expect(screen.getByText(/Eventos/i)).toBeInTheDocument();
    });

    it('should display permission checkboxes', async () => {
      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should toggle permission when checkbox is clicked', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(mockSaveRolePermissions).toHaveBeenCalled();
      });
    });

    it('should save permissions after toggling', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(mockSaveRolePermissions).toHaveBeenCalledWith(
          'member',
          expect.any(Map)
        );
      });
    });

    it('should show error message if save fails', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockRejectedValue(new Error('Save failed'));

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao salvar permissões/i)).toBeInTheDocument();
      });
    });

    it('should refresh permissions after successful save', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(mockRefreshPermissions).toHaveBeenCalled();
      });
    });

    it('should clear cache after save', async () => {
      mockGetRolePermissions.mockResolvedValue(new Map());
      mockSaveRolePermissions.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(mockClearAllCaches).toHaveBeenCalled();
      });
    });
  });

  // ===========================================
  // USERS TAB
  // ===========================================
  describe('Users Tab', () => {
    it('should load and display users when switching to users tab', async () => {
      const users = [
        createTestUser({ id: 'user-1', displayName: 'User One' }),
        createTestUser({ id: 'user-2', displayName: 'User Two' })
      ];
      mockFindAll.mockResolvedValue(users);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });

    it('should show search input for filtering users', async () => {
      const users = [createTestUser()];
      mockFindAll.mockResolvedValue(users);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Buscar usuário/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should filter users based on search term', async () => {
      const users = [
        createTestUser({ id: 'user-1', displayName: 'Alice', email: 'alice@test.com' }),
        createTestUser({ id: 'user-2', displayName: 'Bob', email: 'bob@test.com' })
      ];
      mockFindAll.mockResolvedValue(users);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar usuário/i);
      fireEvent.change(searchInput, { target: { value: 'alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });
    });

    it('should select user when clicked', async () => {
      const users = [createTestUser({ id: 'user-1', displayName: 'Alice' })];
      mockFindAll.mockResolvedValue(users);
      mockGetUserPermissionOverrides.mockResolvedValue([]);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const userCard = screen.getByText('Alice');
        fireEvent.click(userCard);
      });

      await waitFor(() => {
        expect(mockGetUserPermissionOverrides).toHaveBeenCalledWith('user-1');
      });
    });

    it('should show permission checkboxes for selected user', async () => {
      const users = [createTestUser({ id: 'user-1', displayName: 'Alice' })];
      mockFindAll.mockResolvedValue(users);
      mockGetUserPermissionOverrides.mockResolvedValue([]);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const userCard = screen.getByText('Alice');
        fireEvent.click(userCard);
      });

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('should save user permission overrides when checkbox is toggled', async () => {
      const users = [createTestUser({ id: 'user-1', displayName: 'Alice' })];
      mockFindAll.mockResolvedValue(users);
      mockGetUserPermissionOverrides.mockResolvedValue([]);
      mockSaveUserPermissionOverrides.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const userCard = screen.getByText('Alice');
        fireEvent.click(userCard);
      });

      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(mockSaveUserPermissionOverrides).toHaveBeenCalledWith(
          'user-1',
          expect.any(Array)
        );
      });
    });

    it('should show error message if saving user overrides fails', async () => {
      const users = [createTestUser({ id: 'user-1', displayName: 'Alice' })];
      mockFindAll.mockResolvedValue(users);
      mockGetUserPermissionOverrides.mockResolvedValue([]);
      mockSaveUserPermissionOverrides.mockRejectedValue(new Error('Save failed'));

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const userCard = screen.getByText('Alice');
        fireEvent.click(userCard);
      });

      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(screen.getByText(/Erro ao salvar permissões/i)).toBeInTheDocument();
      });
    });

    it('should refresh permissions after saving user overrides', async () => {
      const users = [createTestUser({ id: 'user-1', displayName: 'Alice' })];
      mockFindAll.mockResolvedValue(users);
      mockGetUserPermissionOverrides.mockResolvedValue([]);
      mockSaveUserPermissionOverrides.mockResolvedValue(undefined);

      render(<PermissionsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
      });

      const usersTab = screen.getByText(/Permissões por Usuário/i);
      fireEvent.click(usersTab);

      await waitFor(() => {
        const userCard = screen.getByText('Alice');
        fireEvent.click(userCard);
      });

      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(mockRefreshPermissions).toHaveBeenCalled();
      });
    });
  });
});
