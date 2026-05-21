import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PermissionsManagementPage } from '../PermissionsManagementPage';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import { PermissionAction, SystemModule } from '@/domain/entities/Permission';
import { PublicPage } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

const mockConfirmDialogConfirm = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockRefreshPermissions = jest.fn();

const mockGetAllRolesSync = jest.fn();
const mockGetRoleDisplayNameSync = jest.fn();
const mockGetPermissionMatrix = jest.fn();
const mockGetAllUserOverrides = jest.fn();
const mockGetAllCustomRoles = jest.fn();
const mockUpdateRolePermissions = jest.fn();
const mockResetRolePermissionsToDefault = jest.fn();
const mockUpdateUserPermissionOverrides = jest.fn();
const mockCreateCustomRole = jest.fn();
const mockDeleteCustomRole = jest.fn();
const mockClearAllCache = jest.fn();

const mockFindAll = jest.fn();
const mockGetPublicPageConfigs = jest.fn();
const mockUpdatePageVisibility = jest.fn();
const mockUpdatePageRegistrationSetting = jest.fn();

jest.mock('../../components/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: mockConfirmDialogConfirm,
    prompt: jest.fn().mockResolvedValue('')
  }),
  ConfirmDialogProvider: ({ children }: any) => children
}));

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'admin-1',
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin',
      status: 'approved'
    },
    user: null,
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

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    refreshPermissions: mockRefreshPermissions,
    hasPermission: jest.fn().mockReturnValue(true),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    loading: false
  })
}));

jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logSecurity: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args)
  }
}));

jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => {
  const mockInstance = {
    getAllRolesSync: (...args: any[]) => mockGetAllRolesSync(...args),
    getRoleDisplayNameSync: (...args: any[]) => mockGetRoleDisplayNameSync(...args),
    getPermissionMatrix: (...args: any[]) => mockGetPermissionMatrix(...args),
    getAllUserOverrides: (...args: any[]) => mockGetAllUserOverrides(...args),
    getAllCustomRoles: (...args: any[]) => mockGetAllCustomRoles(...args),
    updateRolePermissions: (...args: any[]) => mockUpdateRolePermissions(...args),
    resetRolePermissionsToDefault: (...args: any[]) => mockResetRolePermissionsToDefault(...args),
    updateUserPermissionOverrides: (...args: any[]) => mockUpdateUserPermissionOverrides(...args),
    createCustomRole: (...args: any[]) => mockCreateCustomRole(...args),
    deleteCustomRole: (...args: any[]) => mockDeleteCustomRole(...args),
    clearAllCache: (...args: any[]) => mockClearAllCache(...args)
  };

  return {
    permissionService: mockInstance,
    PermissionService: function PermissionService() {
      return mockInstance;
    },
    UserPermissionConfig: {},
    CustomRoleConfig: {}
  };
});

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => ({
  FirebaseUserRepository: function FirebaseUserRepository() {
    return {
      findAll: (...args: any[]) => mockFindAll(...args)
    };
  }
}));

jest.mock('@modules/content-management/public-pages/application/services/PublicPageService', () => ({
  PublicPageService: function PublicPageService() {
    return {
      getPublicPageConfigs: (...args: any[]) => mockGetPublicPageConfigs(...args),
      updatePageVisibility: (...args: any[]) => mockUpdatePageVisibility(...args),
      updatePageRegistrationSetting: (...args: any[]) => mockUpdatePageRegistrationSetting(...args)
    };
  }
}));

jest.mock('../../components/CreateRoleModal', () => ({
  CreateRoleModal: ({ isOpen, onClose, onCreateRole, loading }: any) =>
    isOpen ? (
      <div data-testid="create-role-modal">
        <button onClick={onClose}>Fechar</button>
        <button
          disabled={loading}
          onClick={() =>
            onCreateRole({
              roleName: 'custom-role-1',
              displayName: 'Custom Role',
              description: 'A custom role',
              modules: [{ module: 'members', actions: ['view'] }]
            })
          }
        >
          Criar
        </button>
      </div>
    ) : null
}));

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides
});

const createMatrix = () =>
  new Map<string, Map<SystemModule, PermissionAction[]>>([
    [
      'member',
      new Map<SystemModule, PermissionAction[]>([
        [SystemModule.Members, [PermissionAction.View]]
      ])
    ]
  ]);

const publicConfigs = [
  {
    page: PublicPage.Home,
    isPublic: true,
    description: 'Página inicial da igreja'
  },
  {
    page: PublicPage.Events,
    isPublic: true,
    allowRegistration: true,
    description: 'Lista de eventos da igreja'
  }
];

describe('PermissionsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirmDialogConfirm.mockResolvedValue(true);
    mockGetAllRolesSync.mockReturnValue(['admin', 'member']);
    mockGetRoleDisplayNameSync.mockImplementation((role: string) => {
      const labels: Record<string, string> = {
        admin: 'Administrador',
        member: 'Membro'
      };
      return labels[role] || role;
    });
    mockGetPermissionMatrix.mockResolvedValue(createMatrix());
    mockGetAllUserOverrides.mockResolvedValue([]);
    mockGetAllCustomRoles.mockResolvedValue([]);
    mockUpdateRolePermissions.mockResolvedValue(undefined);
    mockResetRolePermissionsToDefault.mockResolvedValue(undefined);
    mockUpdateUserPermissionOverrides.mockResolvedValue(undefined);
    mockCreateCustomRole.mockResolvedValue(undefined);
    mockDeleteCustomRole.mockResolvedValue(undefined);
    mockClearAllCache.mockImplementation(() => {});
    mockFindAll.mockResolvedValue([
      createUser(),
      createUser({ id: 'user-2', displayName: 'Bob', email: 'bob@example.com' })
    ]);
    mockGetPublicPageConfigs.mockResolvedValue(publicConfigs);
    mockUpdatePageVisibility.mockResolvedValue(undefined);
    mockUpdatePageRegistrationSetting.mockResolvedValue(undefined);
  });

  it('shows a loading spinner while data is loading', () => {
    mockGetPermissionMatrix.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<PermissionsManagementPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the header and main tabs after loading', async () => {
    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Gerenciar Permissões/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Permissões por Função/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Permissões por Usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Funções Personalizadas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Páginas Públicas/i })).toBeInTheDocument();
  });

  it('saves role permissions from the roles tab', async () => {
    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/Permissões: Membro/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(mockUpdateRolePermissions).toHaveBeenCalledWith('member', expect.any(Array), 'admin@example.com');
    });
    expect(mockRefreshPermissions).toHaveBeenCalled();
    expect(mockClearAllCache).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('funcao atualizadas'));
  });

  it('saves user permission overrides from the users tab', async () => {
    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Gerenciar Permissões/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Permissões por Usuário/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'user-1' }
    });

    await waitFor(() => {
      expect(screen.getByText(/Permissões Personalizadas/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle('Conceder')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(mockUpdateUserPermissionOverrides).toHaveBeenCalledWith(
        'user-1',
        'alice@example.com',
        'Alice',
        expect.any(Array),
        expect.any(Array),
        'admin@example.com'
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('usuario atualizadas'));
  });

  it('opens the create-role modal and creates a custom role', async () => {
    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Gerenciar Permissões/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Funções Personalizadas/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Criar Nova Função/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar Nova Função/i }));

    await waitFor(() => {
      expect(screen.getByTestId('create-role-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => {
      expect(mockCreateCustomRole).toHaveBeenCalledWith(
        'custom-role-1',
        'Custom Role',
        'A custom role',
        [{ module: SystemModule.Members, actions: [PermissionAction.View] }],
        'admin@example.com'
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('personalizada criada'));
  });

  it('updates public page visibility from the public pages tab', async () => {
    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Gerenciar Permissões/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Páginas Públicas/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Páginas Públicas/i })).toBeInTheDocument();
    });

    const eventsRow = screen.getByText('Eventos').closest('tr');
    expect(eventsRow).not.toBeNull();

    const eventsVisibilityToggle = within(eventsRow as HTMLElement).getAllByRole('checkbox')[0];
    fireEvent.click(eventsVisibilityToggle);

    await waitFor(() => {
      expect(mockUpdatePageVisibility).toHaveBeenCalledWith(PublicPage.Events, false);
    });
  });

  it('shows a toast error when saving role permissions fails', async () => {
    mockUpdateRolePermissions.mockRejectedValueOnce(new Error('Save failed'));

    render(<PermissionsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/Permissões: Membro/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao salvar permissoes da funcao');
    });
  });
});
