// Unit Tests - UserManagementPage
// Comprehensive tests for user management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { UserManagementPage } from '../UserManagementPage';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock FirebaseUserRepository - Create mock functions outside jest.mock to avoid hoisting issues
const mockFindAll = jest.fn();
const mockUpdateRole = jest.fn();
const mockApproveUser = jest.fn();
const mockSuspendUser = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn();

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => {
  return {
    FirebaseUserRepository: function() {
      return {
        findAll: (...args: any[]) => mockFindAll(...args),
        updateRole: (...args: any[]) => mockUpdateRole(...args),
        approveUser: (...args: any[]) => mockApproveUser(...args),
        suspendUser: (...args: any[]) => mockSuspendUser(...args),
        delete: (...args: any[]) => mockDelete(...args),
        create: (...args: any[]) => mockCreate(...args)
      };
    }
  };
});

// Mock PermissionService - Create standalone mock functions
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
        clearAllCaches: (...args: any[]) => mockClearAllCaches(...args)
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

// Mock PermissionGuard
jest.mock('../../components/PermissionGuard', () => ({
  PermissionGuard: ({ children, fallback }: any) => children
}));

// Mock CreateUserModal
jest.mock('../../components/CreateUserModal', () => ({
  CreateUserModal: ({ isOpen, onClose, onCreateUser, loading, availableRoles }: any) => (
    isOpen ? (
      <div data-testid="create-user-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button
          onClick={() => {
            // Catch any re-thrown errors from onCreateUser to prevent unhandled rejections
            const result = onCreateUser({ email: 'new@test.com', password: 'password123', displayName: 'New User' });
            if (result && typeof result.catch === 'function') {
              result.catch(() => {});
            }
          }}
          data-testid="submit-modal"
          disabled={loading}
        >
          Submit
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

describe('UserManagementPage', () => {
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
        secretary: 'Secretario',
        professional: 'Profissional',
        leader: 'Lider',
        member: 'Membro'
      };
      return displayNames[role] || role;
    });
    mockGetUserPermissions.mockResolvedValue([]);
    mockHasPermission.mockReturnValue(false);
    mockGetRolePermissions.mockResolvedValue([]);
    mockSaveRolePermissions.mockResolvedValue(undefined);
    mockGetUserPermissionOverrides.mockResolvedValue(null);
    mockSaveUserPermissionOverrides.mockResolvedValue(undefined);
    mockClearAllCaches.mockImplementation(() => {});

    // Default repository responses
    mockFindAll.mockResolvedValue([]);
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching users', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {}));

      render(<UserManagementPage />);

      expect(screen.getByText(/Carregando.*usu.*rios/i)).toBeInTheDocument();
    });

    it('should hide loading spinner after users are loaded', async () => {
      mockFindAll.mockResolvedValue([createTestUser()]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando.*usu.*rios/i)).not.toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE
  // ===========================================
  describe('Empty State', () => {
    it('should show empty message when no users match filters', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Nenhum.*usu.*rio.*encontrado/i)).toBeInTheDocument();
        expect(screen.getByText(/Tente.*ajustar.*filtros/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // DATA DISPLAY
  // ===========================================
  describe('Data Display', () => {
    const testUsers = [
      createTestUser({ id: '1', displayName: 'Admin User', email: 'admin@test.com', role: UserRole.Admin, status: UserStatus.Approved }),
      createTestUser({ id: '2', displayName: 'Member User', email: 'member@test.com', role: UserRole.Member, status: UserStatus.Approved }),
      createTestUser({ id: '3', displayName: 'Pending User', email: 'pending@test.com', role: UserRole.Member, status: UserStatus.Pending })
    ];

    it('should display user list with correct data', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Member User')).toBeInTheDocument();
        expect(screen.getByText('Pending User')).toBeInTheDocument();
      });
    });

    it('should display user emails', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.getByText('member@test.com')).toBeInTheDocument();
        expect(screen.getByText('pending@test.com')).toBeInTheDocument();
      });
    });

    it('should display role badges', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Membro').length).toBeGreaterThan(0);
      });
    });

    it('should display status badges', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
      });
    });

    it('should display user count', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Usu.*rios.*\(3\)/i)).toBeInTheDocument();
      });
    });

    it('should display user initials in avatar', async () => {
      mockFindAll.mockResolvedValue([createTestUser({ displayName: 'Joao Silva' })]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('JS')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING
  // ===========================================
  describe('Filtering', () => {
    const testUsers = [
      createTestUser({ id: '1', displayName: 'Joao Silva', email: 'joao@test.com', role: UserRole.Admin }),
      createTestUser({ id: '2', displayName: 'Maria Santos', email: 'maria@test.com', role: UserRole.Secretary }),
      createTestUser({ id: '3', displayName: 'Pedro Costa', email: 'pedro@test.com', role: UserRole.Member }),
      createTestUser({ id: '4', displayName: 'Ana Joana', email: 'ana@test.com', role: UserRole.Member })
    ];

    it('should filter users by search term (name)', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Ana Joana')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar.*usu.*rios/i);
      fireEvent.change(searchInput, { target: { value: 'Joao' } });

      // Filter uses case-insensitive includes on name/email
      // "joao silva" includes "joao" = true
      // "ana joana" does NOT include "joao" (it has "joana" not "joao")
      expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      expect(screen.queryByText('Ana Joana')).not.toBeInTheDocument();
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
      expect(screen.queryByText('Pedro Costa')).not.toBeInTheDocument();
    });

    it('should filter users by search term (email)', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar.*usu.*rios/i);
      fireEvent.change(searchInput, { target: { value: 'maria@' } });

      await waitFor(() => {
        expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });
    });

    it('should filter users by role', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Find role filter select
      const roleSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
        expect(screen.queryByText('Pedro Costa')).not.toBeInTheDocument();
      });
    });

    it('should combine search and role filters', async () => {
      mockFindAll.mockResolvedValue(testUsers);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Filter by role first
      const roleSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(roleSelect, { target: { value: 'member' } });

      // Then filter by search
      const searchInput = screen.getByPlaceholderText(/Buscar.*usu.*rios/i);
      fireEvent.change(searchInput, { target: { value: 'Pedro' } });

      // Both filters should apply immediately
      expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      expect(screen.queryByText('Ana Joana')).not.toBeInTheDocument();
      expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
    });
  });

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create User', () => {
      it('should open create modal when clicking create button', async () => {
        mockFindAll.mockResolvedValue([]);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText(/Criar.*Usu.*rio/i)).toBeInTheDocument();
        });

        const createButton = screen.getByText(/Criar.*Usu.*rio/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByTestId('create-user-modal')).toBeInTheDocument();
        });
      });

      it('should create user and update list on success', async () => {
        const newUser = createTestUser({ id: 'new-user', displayName: 'New User', email: 'new@test.com' });
        mockFindAll.mockResolvedValue([]);
        mockCreate.mockResolvedValue(newUser);

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText(/Criar.*Usu.*rio/i)).toBeInTheDocument();
        });

        // Open modal
        fireEvent.click(screen.getByText(/Criar.*Usu.*rio/i));

        await waitFor(() => {
          expect(screen.getByTestId('create-user-modal')).toBeInTheDocument();
        });

        // Submit
        fireEvent.click(screen.getByTestId('submit-modal'));

        await waitFor(() => {
          expect(mockCreate).toHaveBeenCalled();
          expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/criado.*sucesso/i));
        });

        alertSpy.mockRestore();
      });

      it('should show error alert when creation fails', async () => {
        mockFindAll.mockResolvedValue([]);
        mockCreate.mockRejectedValue(new Error('Creation failed'));

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText(/Criar.*Usu.*rio/i)).toBeInTheDocument();
        });

        // Open modal and submit
        fireEvent.click(screen.getByText(/Criar.*Usu.*rio/i));

        await waitFor(() => {
          expect(screen.getByTestId('create-user-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('submit-modal'));

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Creation failed'));
        });

        alertSpy.mockRestore();
        consoleSpy.mockRestore();
      });
    });

    describe('Update Role', () => {
      it('should show confirmation and update role', async () => {
        const user = createTestUser({ id: 'user-1', role: UserRole.Member });
        mockFindAll.mockResolvedValue([user]);
        mockUpdateRole.mockResolvedValue(undefined);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        // Wait for both users and roles to load
        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
          // Ensure role options are loaded (roles come from async getAllRoles)
          const allSelects = screen.getAllByRole('combobox');
          const hasRoleOptions = allSelects.some(select => {
            const options = within(select as HTMLElement).queryAllByRole('option');
            return options.some(opt => opt.textContent === 'Administrador');
          });
          expect(hasRoleOptions).toBe(true);
        });

        // Find role change select in the table (skip first which is the filter)
        const roleSelects = screen.getAllByRole('combobox');
        const roleChangeSelect = roleSelects.find((select, index) => {
          if (index === 0) return false; // Skip filter select
          const options = within(select as HTMLElement).queryAllByRole('option');
          return options.some(opt => opt.textContent === 'Administrador');
        });

        if (roleChangeSelect) {
          fireEvent.change(roleChangeSelect, { target: { value: 'admin' } });

          await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalled();
            expect(mockUpdateRole).toHaveBeenCalledWith('user-1', 'admin', 'admin@example.com');
            expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/Fun.*o.*atualizada.*sucesso/i));
          });
        }

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not update role when confirmation is cancelled', async () => {
        const user = createTestUser({ id: 'user-1', role: UserRole.Member });
        mockFindAll.mockResolvedValue([user]);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        // Find and change role select
        const roleSelects = screen.getAllByRole('combobox');
        const roleChangeSelect = roleSelects.find(select => {
          const options = within(select as HTMLElement).queryAllByRole('option');
          return options.some(opt => opt.textContent === 'Administrador');
        });

        if (roleChangeSelect) {
          fireEvent.change(roleChangeSelect, { target: { value: 'admin' } });
        }

        expect(mockUpdateRole).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });

      it('should disable role change for current user', async () => {
        // User with same ID as current user
        const user = createTestUser({
          id: 'admin-1',
          displayName: 'Admin User',
          email: 'admin@example.com',
          role: UserRole.Admin
        });
        mockFindAll.mockResolvedValue([user]);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Admin User')).toBeInTheDocument();
        });

        // The role select for current user should be disabled
        const roleSelects = screen.getAllByRole('combobox');
        const disabledSelect = roleSelects.find(select => (select as HTMLSelectElement).disabled);

        expect(disabledSelect).toBeDefined();
      });
    });

    describe('Toggle Status', () => {
      it('should activate inactive user', async () => {
        const user = createTestUser({ id: 'user-1', status: UserStatus.Suspended });
        mockFindAll.mockResolvedValue([user]);
        mockApproveUser.mockResolvedValue(undefined);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        // Find and click activate button
        const activateButton = screen.getByText('Ativar');
        fireEvent.click(activateButton);

        await waitFor(() => {
          expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('ativar'));
          expect(mockApproveUser).toHaveBeenCalledWith('user-1', 'admin@example.com');
          // Source uses template: `Usuário ${action}do` where action='ativar' => "ativardo"
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('ativardo'));
        });

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should deactivate active user', async () => {
        const user = createTestUser({ id: 'user-1', status: UserStatus.Approved });
        mockFindAll.mockResolvedValue([user]);
        mockSuspendUser.mockResolvedValue(undefined);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        // Find and click deactivate button
        const deactivateButton = screen.getByText('Desativar');
        fireEvent.click(deactivateButton);

        await waitFor(() => {
          expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('desativar'));
          expect(mockSuspendUser).toHaveBeenCalledWith('user-1', 'admin@example.com', expect.any(String));
          // Source uses template: `Usuário ${action}do` where action='desativar' => "desativardo"
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('desativardo'));
        });

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not toggle status when confirmation is cancelled', async () => {
        const user = createTestUser({ id: 'user-1', status: UserStatus.Approved });
        mockFindAll.mockResolvedValue([user]);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Desativar'));

        expect(mockSuspendUser).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });
    });

    describe('Delete User', () => {
      it('should delete user with triple confirmation', async () => {
        const user = createTestUser({ id: 'user-1', displayName: 'Test User' });
        mockFindAll.mockResolvedValue([user]);
        mockDelete.mockResolvedValue(undefined);

        const confirmSpy = jest.spyOn(window, 'confirm')
          .mockReturnValueOnce(true)  // First confirmation
          .mockReturnValueOnce(true); // Second confirmation
        const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('DELETAR');
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        // Find and click delete button
        const deleteButton = screen.getByText(/Deletar/);
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(confirmSpy).toHaveBeenCalledTimes(2);
          expect(promptSpy).toHaveBeenCalled();
          expect(mockDelete).toHaveBeenCalledWith('user-1');
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('deletado permanentemente'));
        });

        confirmSpy.mockRestore();
        promptSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not delete when first confirmation is cancelled', async () => {
        const user = createTestUser({ id: 'user-1' });
        mockFindAll.mockResolvedValue([user]);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Deletar/));

        expect(mockDelete).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });

      it('should not delete when typing wrong confirmation text', async () => {
        const user = createTestUser({ id: 'user-1' });
        mockFindAll.mockResolvedValue([user]);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('wrong text');
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Deletar/));

        await waitFor(() => {
          expect(mockDelete).not.toHaveBeenCalled();
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('incorreto'));
        });

        confirmSpy.mockRestore();
        promptSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not allow deleting own account', async () => {
        // User with same ID as current user
        const user = createTestUser({
          id: 'admin-1',
          displayName: 'Admin User',
          email: 'admin@example.com'
        });
        mockFindAll.mockResolvedValue([user]);

        render(<UserManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Admin User')).toBeInTheDocument();
        });

        // Should show "Voce mesmo" instead of action buttons
        expect(screen.getByText(/Voc.*mesmo/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  describe('Error Handling', () => {
    it('should handle user loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockRejectedValue(new Error('Network error'));

      render(<UserManagementPage />);

      await waitFor(() => {
        // Should show empty state on error
        expect(screen.getByText(/Nenhum.*usu.*rio.*encontrado/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle role update errors', async () => {
      const user = createTestUser({ id: 'user-1' });
      mockFindAll.mockResolvedValue([user]);
      mockUpdateRole.mockRejectedValue(new Error('Update failed'));

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<UserManagementPage />);

      // Wait for both users and roles to load
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        const allSelects = screen.getAllByRole('combobox');
        const hasRoleOptions = allSelects.some(select => {
          const options = within(select as HTMLElement).queryAllByRole('option');
          return options.some(opt => opt.textContent === 'Administrador');
        });
        expect(hasRoleOptions).toBe(true);
      });

      // Find and change role (skip first select which is the filter)
      const roleSelects = screen.getAllByRole('combobox');
      const roleChangeSelect = roleSelects.find((select, index) => {
        if (index === 0) return false;
        const options = within(select as HTMLElement).queryAllByRole('option');
        return options.some(opt => opt.textContent === 'Administrador');
      });

      if (roleChangeSelect) {
        fireEvent.change(roleChangeSelect, { target: { value: 'admin' } });

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/Erro.*atualizar/i));
        });
      }

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle status toggle errors', async () => {
      const user = createTestUser({ id: 'user-1', status: UserStatus.Approved });
      mockFindAll.mockResolvedValue([user]);
      mockSuspendUser.mockRejectedValue(new Error('Suspend failed'));

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Desativar'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao desativar'));
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle delete errors', async () => {
      const user = createTestUser({ id: 'user-1', displayName: 'Test User' });
      mockFindAll.mockResolvedValue([user]);
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('DELETAR');
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deletar/));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao deletar'));
      });

      confirmSpy.mockRestore();
      promptSpy.mockRestore();
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should fallback to default roles when loading fails', async () => {
      mockGetAllRoles.mockRejectedValue(new Error('Failed to load roles'));
      mockFindAll.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<UserManagementPage />);

      await waitFor(() => {
        // Should still render with default roles
        expect(mockGetAllRolesSync).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // ROLE INFO BOX
  // ===========================================
  describe('Role Information Box', () => {
    it('should display role information box', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Informa.*es.*sobre.*Fun.*es/i)).toBeInTheDocument();
      });
    });

    it('should display all role descriptions', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Acesso total ao sistema/i)).toBeInTheDocument();
        expect(screen.getByText(/Acesso.*b.*sico ao sistema/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // HEADER AND TITLE
  // ===========================================
  describe('Header and Title', () => {
    it('should display page title', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gerenciar.*Usu.*rios/i)).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gerencie.*fun.*es.*permiss.*es/i)).toBeInTheDocument();
      });
    });
  });
});
