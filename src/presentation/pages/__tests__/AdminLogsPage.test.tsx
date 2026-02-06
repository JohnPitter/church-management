// Unit Tests - Admin Logs Page
// Comprehensive tests for system logs and activity monitoring

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminLogsPage } from '../AdminLogsPage';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return '2024-01-15';
    }
    if (formatStr === 'dd/MM/yyyy HH:mm:ss') {
      return '15/01/2024 10:30:45';
    }
    if (formatStr === 'yyyy-MM-dd-HH-mm-ss') {
      return '2024-01-15-10-30-45';
    }
    return '2024-01-15';
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
const mockHasPermission = jest.fn();
const mockUsePermissions = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions()
}));

// Mock log data
const mockLogs = [
  {
    id: 'log-1',
    timestamp: new Date('2024-01-15T10:30:00'),
    level: 'info',
    category: 'auth',
    message: 'User logged in',
    details: 'Successful login',
    userEmail: 'user@example.com',
    ipAddress: '192.168.1.1'
  },
  {
    id: 'log-2',
    timestamp: new Date('2024-01-15T11:00:00'),
    level: 'error',
    category: 'database',
    message: 'Database connection failed',
    details: 'Connection timeout',
    userEmail: null,
    ipAddress: null
  },
  {
    id: 'log-3',
    timestamp: new Date('2024-01-15T12:00:00'),
    level: 'warning',
    category: 'security',
    message: 'Multiple failed login attempts',
    details: '5 failed attempts',
    userEmail: 'attacker@example.com',
    ipAddress: '10.0.0.1'
  },
  {
    id: 'log-4',
    timestamp: new Date('2024-01-15T13:00:00'),
    level: 'debug',
    category: 'api',
    message: 'API request received',
    details: 'GET /api/users',
    userEmail: 'dev@example.com',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-5',
    timestamp: new Date('2024-01-15T14:00:00'),
    level: 'info',
    category: 'user_action',
    message: 'User updated profile',
    details: 'Changed display name',
    userEmail: 'user2@example.com',
    ipAddress: '192.168.1.2'
  }
];

// Mock FirebaseLogRepository
const mockFindAll = jest.fn();
const mockClearAll = jest.fn();

jest.mock('@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository', () => {
  return {
    FirebaseLogRepository: function() {
      return {
        findAll: mockFindAll,
        clearAll: mockClearAll
      };
    }
  };
});

// Mock LogSeederService
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LogSeederService', () => ({
  LogSeederService: jest.fn().mockImplementation(() => ({}))
}));

describe('AdminLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock permissions - default: has all permissions
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
      if (module === SystemModule.Logs) {
        return action === PermissionAction.View || action === PermissionAction.Manage;
      }
      return false;
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      loading: false
    });

    // Mock repository methods
    mockFindAll.mockResolvedValue([...mockLogs]);
    mockClearAll.mockResolvedValue(undefined);

    // Mock window methods
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminLogsPage />
      </MemoryRouter>
    );
  };

  describe('Permission Checks', () => {
    it('should show loading spinner while checking permissions', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: true
      });

      renderComponent();

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
    });

    it('should show access denied when user cannot view logs', () => {
      mockHasPermission.mockReturnValue(false);
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: false
      });

      renderComponent();

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText('Voce nao tem permissao para acessar esta pagina.')).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Logs && action === PermissionAction.View;
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: false
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Logs do Sistema')).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('should render the page header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Logs do Sistema')).toBeInTheDocument();
        expect(screen.getByText('Monitore atividades e eventos do sistema')).toBeInTheDocument();
      });
    });

    it('should render statistics cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Logs')).toBeInTheDocument();
        expect(screen.getByText('Erros')).toBeInTheDocument();
        expect(screen.getByText('Avisos')).toBeInTheDocument();
        expect(screen.getByText('Hoje')).toBeInTheDocument();
      });
    });

    it('should render filter section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Buscar logs...')).toBeInTheDocument();
      });
    });

    it('should render logs table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
        expect(screen.getByText('Nivel')).toBeInTheDocument();
        expect(screen.getByText('Categoria')).toBeInTheDocument();
        expect(screen.getByText('Mensagem')).toBeInTheDocument();
        expect(screen.getByText('Usuario')).toBeInTheDocument();
        expect(screen.getByText('IP')).toBeInTheDocument();
      });
    });

    it('should render action buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });

    it('should render auto-refresh checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Auto-atualizar')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics', () => {
    it('should display correct total logs count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total logs
      });
    });

    it('should display correct error count', async () => {
      renderComponent();

      await waitFor(() => {
        const errorsCard = screen.getByText('Erros').closest('div');
        expect(errorsCard).toContainElement(screen.getByText('1')); // 1 error log
      });
    });

    it('should display correct warning count', async () => {
      renderComponent();

      await waitFor(() => {
        const warningsCard = screen.getByText('Avisos').closest('div');
        expect(warningsCard).toContainElement(screen.getByText('1')); // 1 warning log
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching logs', () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      expect(screen.getByText('Carregando logs...')).toBeInTheDocument();
    });
  });

  describe('Log Display', () => {
    it('should display log messages', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
      });
    });

    it('should display log details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Successful login')).toBeInTheDocument();
        expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      });
    });

    it('should display user emails', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
        expect(screen.getByText('dev@example.com')).toBeInTheDocument();
      });
    });

    it('should display IP addresses', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
        expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
      });
    });

    it('should display dash for missing user email', async () => {
      renderComponent();

      await waitFor(() => {
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Level Display', () => {
    it('should display error level with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const errorBadge = screen.getByText('ERROR');
        expect(errorBadge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should display warning level with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const warningBadge = screen.getByText('WARNING');
        expect(warningBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display info level with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const infoBadges = screen.getAllByText('INFO');
        expect(infoBadges[0]).toHaveClass('bg-blue-100', 'text-blue-800');
      });
    });

    it('should display debug level with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const debugBadge = screen.getByText('DEBUG');
        expect(debugBadge).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });
  });

  describe('Category Display', () => {
    it('should display auth category with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const authBadge = screen.getByText('auth');
        expect(authBadge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display security category with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const securityBadge = screen.getByText('security');
        expect(securityBadge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should display database category with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const databaseBadge = screen.getByText('database');
        expect(databaseBadge).toHaveClass('bg-purple-100', 'text-purple-800');
      });
    });

    it('should display api category with correct styling', async () => {
      renderComponent();

      await waitFor(() => {
        const apiBadge = screen.getByText('api');
        expect(apiBadge).toHaveClass('bg-indigo-100', 'text-indigo-800');
      });
    });
  });

  describe('Filtering', () => {
    it('should filter logs by search term', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
      });
    });

    it('should filter logs by level', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
      await userEvent.selectOptions(levelSelect, 'error');

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
      });
    });

    it('should filter logs by category', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText('Categoria') as HTMLSelectElement;
      await userEvent.selectOptions(categorySelect, 'security');

      await waitFor(() => {
        expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
        expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
      });
    });

    it('should filter logs by date', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText('Data') as HTMLInputElement;
      await userEvent.type(dateInput, '2024-01-15');

      // Since our mock returns '2024-01-15' for all dates, all logs should still be visible
      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });
    });

    it('should show no results message when filters match nothing', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'nonexistent log message xyz');

      await waitFor(() => {
        expect(screen.getByText('Nenhum log encontrado')).toBeInTheDocument();
        expect(screen.getByText('Tente ajustar os filtros ou fazer uma nova busca.')).toBeInTheDocument();
      });
    });

    it('should reset page to 1 when filters change', async () => {
      // Add more logs to test pagination
      const manyLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: `Details ${i}`,
        userEmail: `user${i}@example.com`,
        ipAddress: '192.168.1.1'
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByText('Próxima →');
      await userEvent.click(nextButton);

      // Change filter
      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'Log');

      // Should be back on page 1
      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      // Add more logs to trigger pagination
      const manyLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: `Details ${i}`,
        userEmail: `user${i}@example.com`,
        ipAddress: '192.168.1.1'
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Primeira')).toBeInTheDocument();
        expect(screen.getByText('← Anterior')).toBeInTheDocument();
        expect(screen.getByText('Próxima →')).toBeInTheDocument();
        expect(screen.getByText('Ultima')).toBeInTheDocument();
      });
    });

    it('should change items per page', async () => {
      const manyLogs = Array.from({ length: 30 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mostrar')).toBeInTheDocument();
      });

      const itemsPerPageSelect = screen.getByRole('combobox', { name: '' });
      await userEvent.selectOptions(itemsPerPageSelect, '25');

      await waitFor(() => {
        // Should now show more items per page
        expect(screen.getByText('Log message 24')).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const manyLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Próxima →'));

      await waitFor(() => {
        expect(screen.getByText('Log message 10')).toBeInTheDocument();
        expect(screen.queryByText('Log message 0')).not.toBeInTheDocument();
      });
    });

    it('should navigate to previous page', async () => {
      const manyLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Go to page 2
      await userEvent.click(screen.getByText('Próxima →'));

      await waitFor(() => {
        expect(screen.getByText('Log message 10')).toBeInTheDocument();
      });

      // Go back to page 1
      await userEvent.click(screen.getByText('← Anterior'));

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('← Anterior')).toBeDisabled();
        expect(screen.getByText('Primeira')).toBeDisabled();
      });
    });
  });

  describe('Refresh', () => {
    it('should refresh logs when refresh button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(1);
      });

      await userEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(2);
      });
    });

    it('should toggle auto-refresh', async () => {
      jest.useFakeTimers();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Auto-atualizar')).toBeInTheDocument();
      });

      const autoRefreshCheckbox = screen.getByRole('checkbox');
      await userEvent.click(autoRefreshCheckbox);

      expect(autoRefreshCheckbox).toBeChecked();

      jest.useRealTimers();
    });

    it('should auto-refresh logs every 30 seconds when enabled', async () => {
      jest.useFakeTimers();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Auto-atualizar')).toBeInTheDocument();
      });

      // Enable auto-refresh
      const autoRefreshCheckbox = screen.getByRole('checkbox');
      await userEvent.click(autoRefreshCheckbox);

      expect(autoRefreshCheckbox).toBeChecked();

      // Initial load
      expect(mockFindAll).toHaveBeenCalledTimes(1);

      // Advance timer by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(2);
      });

      // Advance another 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(3);
      });

      jest.useRealTimers();
    });

    it('should stop auto-refresh when disabled', async () => {
      jest.useFakeTimers();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Auto-atualizar')).toBeInTheDocument();
      });

      // Enable auto-refresh
      const autoRefreshCheckbox = screen.getByRole('checkbox');
      await userEvent.click(autoRefreshCheckbox);

      expect(mockFindAll).toHaveBeenCalledTimes(1);

      // Advance timer by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(2);
      });

      // Disable auto-refresh
      await userEvent.click(autoRefreshCheckbox);

      // Advance timer again
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not call again
      expect(mockFindAll).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should disable refresh button while loading', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeDisabled();
      });
    });
  });

  describe('Clear Logs', () => {
    it('should show clear logs button when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
      });
    });

    it('should hide clear logs button when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Logs && action === PermissionAction.View;
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: false
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sem permissao para limpar')).toBeInTheDocument();
        expect(screen.queryByText('Limpar Logs')).not.toBeInTheDocument();
      });
    });

    it('should show confirmation dialog when clear is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Limpar Logs'));

      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja limpar todos os logs? Esta acao nao pode ser desfeita.');
    });

    it('should clear logs when confirmed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Limpar Logs'));

      await waitFor(() => {
        expect(mockClearAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Logs limpos com sucesso!');
      });
    });

    it('should not clear logs when cancelled', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Limpar Logs'));

      expect(mockClearAll).not.toHaveBeenCalled();
    });

    it('should show error alert when clear fails', async () => {
      mockClearAll.mockRejectedValueOnce(new Error('Clear failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Limpar Logs'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao limpar logs.');
      });
    });
  });

  describe('Export Logs', () => {
    let mockCreateElement: jest.SpyInstance;
    let mockClick: jest.Mock;

    beforeEach(() => {
      mockClick = jest.fn();
      mockCreateElement = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = document.createElement.bind(document)(tagName) as HTMLAnchorElement;
        element.click = mockClick;
        return element;
      });
    });

    afterEach(() => {
      mockCreateElement.mockRestore();
    });

    it('should show export button when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });

    it('should hide export button when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Logs && action === PermissionAction.View;
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: false
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Exportar')).not.toBeInTheDocument();
      });
    });

    it('should export logs as JSON when export is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar'));

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Logs exportados em JSON com sucesso!');
      });
    });

    it('should export filtered logs when filters are applied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      // Apply filter
      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });

      // Export
      await userEvent.click(screen.getByText('Exportar'));

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Logs exportados em JSON com sucesso!');
      });
    });

    it('should handle export error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      URL.createObjectURL = jest.fn(() => {
        throw new Error('Export failed');
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao exportar logs.');
      });

      consoleSpy.mockRestore();
      URL.createObjectURL = jest.fn(() => 'blob:test');
    });

    it('should export all logs when no filters are applied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar'));

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });
  });

  describe('Level Filter Options', () => {
    it('should have all level options', async () => {
      renderComponent();

      await waitFor(() => {
        const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
        const options = Array.from(levelSelect.options).map(opt => opt.value);

        expect(options).toContain('all');
        expect(options).toContain('error');
        expect(options).toContain('warning');
        expect(options).toContain('info');
        expect(options).toContain('debug');
      });
    });
  });

  describe('Category Filter Options', () => {
    it('should have all category options', async () => {
      renderComponent();

      await waitFor(() => {
        const categorySelect = screen.getByLabelText('Categoria') as HTMLSelectElement;
        const options = Array.from(categorySelect.options).map(opt => opt.value);

        expect(options).toContain('all');
        expect(options).toContain('auth');
        expect(options).toContain('database');
        expect(options).toContain('api');
        expect(options).toContain('system');
        expect(options).toContain('user_action');
        expect(options).toContain('security');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no logs exist', async () => {
      mockFindAll.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum log encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle log loading error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockRejectedValueOnce(new Error('Load failed'));
      renderComponent();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading logs:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should set empty logs array on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockRejectedValueOnce(new Error('Load failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum log encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table headers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should have accessible filter labels', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
        expect(screen.getByLabelText('Nivel')).toBeInTheDocument();
        expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
        expect(screen.getByLabelText('Data')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Search Functionality', () => {
    it('should search in message field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'logged in');

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
        expect(screen.queryByText('Database connection failed')).not.toBeInTheDocument();
      });
    });

    it('should search in details field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'Connection timeout');

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
      });
    });

    it('should search in user email field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'attacker@example.com');

      await waitFor(() => {
        expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
        expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'DATABASE');

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      // Apply level filter
      const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
      await userEvent.selectOptions(levelSelect, 'info');

      // Apply search
      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'logged');

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
        expect(screen.queryByText('Database connection failed')).not.toBeInTheDocument();
        expect(screen.queryByText('Multiple failed login attempts')).not.toBeInTheDocument();
      });
    });

    it('should apply level and category filters together', async () => {
      const testLogs = [
        ...mockLogs,
        {
          id: 'log-6',
          timestamp: new Date('2024-01-15T15:00:00'),
          level: 'error',
          category: 'security',
          message: 'Security error',
          details: 'Critical security issue',
          userEmail: 'admin@example.com',
          ipAddress: '192.168.1.100'
        }
      ];
      mockFindAll.mockResolvedValue(testLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      // Apply level filter
      const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
      await userEvent.selectOptions(levelSelect, 'error');

      // Apply category filter
      const categorySelect = screen.getByLabelText('Categoria') as HTMLSelectElement;
      await userEvent.selectOptions(categorySelect, 'security');

      await waitFor(() => {
        expect(screen.getByText('Security error')).toBeInTheDocument();
        expect(screen.queryByText('Database connection failed')).not.toBeInTheDocument();
      });
    });

    it('should apply all filters together', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });

      // Apply all filters
      const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
      await userEvent.selectOptions(levelSelect, 'info');

      const categorySelect = screen.getByLabelText('Categoria') as HTMLSelectElement;
      await userEvent.selectOptions(categorySelect, 'auth');

      const searchInput = screen.getByPlaceholderText('Buscar logs...');
      await userEvent.type(searchInput, 'logged');

      await waitFor(() => {
        expect(screen.getByText('User logged in')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination Advanced', () => {
    it('should navigate to first page', async () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Go to page 3
      await userEvent.click(screen.getByText('Próxima →'));
      await userEvent.click(screen.getByText('Próxima →'));

      await waitFor(() => {
        expect(screen.queryByText('Log message 0')).not.toBeInTheDocument();
      });

      // Go to first page
      await userEvent.click(screen.getByText('Primeira'));

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });
    });

    it('should navigate to last page', async () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Go to last page
      await userEvent.click(screen.getByText('Ultima'));

      await waitFor(() => {
        expect(screen.getByText('Log message 49')).toBeInTheDocument();
        expect(screen.queryByText('Log message 0')).not.toBeInTheDocument();
      });
    });

    it('should disable next button on last page', async () => {
      const manyLogs = Array.from({ length: 15 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Go to last page
      await userEvent.click(screen.getByText('Ultima'));

      await waitFor(() => {
        expect(screen.getByText('Próxima →')).toBeDisabled();
        expect(screen.getByText('Ultima')).toBeDisabled();
      });
    });

    it('should display correct page numbers', async () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Should show page buttons
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should navigate by clicking page number', async () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log message 0')).toBeInTheDocument();
      });

      // Click page 2
      const page2Button = screen.getByRole('button', { name: '2' });
      await userEvent.click(page2Button);

      await waitFor(() => {
        expect(screen.getByText('Log message 10')).toBeInTheDocument();
        expect(screen.queryByText('Log message 0')).not.toBeInTheDocument();
      });
    });

    it('should show correct range info', async () => {
      const manyLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(),
        level: 'info',
        category: 'system',
        message: `Log message ${i}`,
        details: null,
        userEmail: null,
        ipAddress: null
      }));
      mockFindAll.mockResolvedValue(manyLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/de/)).toBeInTheDocument();
      });
    });
  });

  describe('Date Filter', () => {
    it('should filter by specific date', async () => {
      // Mock format to return different dates
      const mockFormat = require('date-fns').format as jest.Mock;
      mockFormat.mockImplementation((date: Date, formatStr: string) => {
        if (formatStr === 'yyyy-MM-dd') {
          const time = date.getTime();
          if (time === new Date('2024-01-15T10:30:00').getTime()) {
            return '2024-01-15';
          }
          return '2024-01-16';
        }
        if (formatStr === 'dd/MM/yyyy HH:mm:ss') {
          return '15/01/2024 10:30:45';
        }
        return '2024-01-15';
      });

      const testLogs = [
        {
          id: 'log-1',
          timestamp: new Date('2024-01-15T10:30:00'),
          level: 'info',
          category: 'auth',
          message: 'Log from Jan 15',
          details: null,
          userEmail: null,
          ipAddress: null
        },
        {
          id: 'log-2',
          timestamp: new Date('2024-01-16T10:30:00'),
          level: 'info',
          category: 'auth',
          message: 'Log from Jan 16',
          details: null,
          userEmail: null,
          ipAddress: null
        }
      ];
      mockFindAll.mockResolvedValue(testLogs);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Log from Jan 15')).toBeInTheDocument();
        expect(screen.getByText('Log from Jan 16')).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText('Data') as HTMLInputElement;
      await userEvent.type(dateInput, '2024-01-15');

      await waitFor(() => {
        expect(screen.getByText('Log from Jan 15')).toBeInTheDocument();
        expect(screen.queryByText('Log from Jan 16')).not.toBeInTheDocument();
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate today logs correctly', async () => {
      const mockFormat = require('date-fns').format as jest.Mock;
      mockFormat.mockImplementation((date: Date, formatStr: string) => {
        if (formatStr === 'yyyy-MM-dd') {
          return '2024-01-15';
        }
        if (formatStr === 'dd/MM/yyyy HH:mm:ss') {
          return '15/01/2024 10:30:45';
        }
        return '2024-01-15';
      });

      renderComponent();

      await waitFor(() => {
        const todayCard = screen.getByText('Hoje').closest('div');
        expect(todayCard).toContainElement(screen.getByText('5')); // All logs are "today"
      });
    });

    it('should update statistics after filtering', async () => {
      renderComponent();

      await waitFor(() => {
        // Initially shows count including filtered out items
        const logsCount = screen.getByText(/Logs \(/);
        expect(logsCount).toHaveTextContent('5');
      });

      // Apply filter
      const levelSelect = screen.getByLabelText('Nivel') as HTMLSelectElement;
      await userEvent.selectOptions(levelSelect, 'error');

      await waitFor(() => {
        const logsCount = screen.getByText(/Logs \(/);
        expect(logsCount).toHaveTextContent('1');
      });
    });
  });

  describe('Button States', () => {
    it('should disable export button while loading', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeDisabled();
      });
    });

    it('should disable clear logs button while loading', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Logs')).toBeDisabled();
      });
    });
  });
});
