import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminLogsPage } from '../AdminLogsPage';
import { PermissionAction, SystemModule } from '@/domain/entities/Permission';
import { UserRole, UserStatus } from '@/domain/entities/User';

jest.mock('../../components/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: jest.fn(async (options?: any) => global.confirm(options?.message ?? '')),
    prompt: jest.fn().mockResolvedValue(''),
  }),
  ConfirmDialogProvider: ({ children }: any) => children,
}));

jest.mock('react-hot-toast', () => {
  const toast = (message: string) => global.alert(message);
  toast.success = (message: string) => global.alert(message);
  toast.error = (message: string) => global.alert(message);
  return { __esModule: true, default: toast };
});

jest.mock('@/config/firebase', () => ({
  db: {},
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM-dd') {
      return date.toISOString().slice(0, 10);
    }
    if (formatStr === 'dd/MM/yyyy HH:mm:ss') {
      return '15/01/2024 10:30:45';
    }
    if (formatStr === 'yyyy-MM-dd-HH-mm-ss') {
      return '2024-01-15-10-30-45';
    }
    return '2024-01-15';
  }),
}));

var mockCurrentUser = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Test Admin',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}));

var mockHasPermission = jest.fn();
var mockUsePermissions = jest.fn(() => ({
  hasPermission: mockHasPermission,
  loading: false,
  permissions: [],
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: (...args: unknown[]) => (mockUsePermissions as jest.Mock)(...args),
}));

const baseLogs = [
  {
    id: 'log-1',
    timestamp: new Date('2024-01-15T10:30:00'),
    level: 'info',
    category: 'auth',
    message: 'User logged in',
    details: 'Successful login',
    userEmail: 'user@example.com',
    ipAddress: '192.168.1.1',
  },
  {
    id: 'log-2',
    timestamp: new Date('2024-01-15T11:00:00'),
    level: 'error',
    category: 'database',
    message: 'Database connection failed',
    details: 'Connection timeout',
    userEmail: null,
    ipAddress: null,
  },
  {
    id: 'log-3',
    timestamp: new Date('2024-01-15T12:00:00'),
    level: 'warning',
    category: 'security',
    message: 'Multiple failed login attempts',
    details: '5 failed attempts',
    userEmail: 'attacker@example.com',
    ipAddress: '10.0.0.1',
  },
  {
    id: 'log-4',
    timestamp: new Date('2024-01-15T13:00:00'),
    level: 'debug',
    category: 'api',
    message: 'API request received',
    details: 'GET /api/users',
    userEmail: 'dev@example.com',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'log-5',
    timestamp: new Date('2024-01-15T14:00:00'),
    level: 'info',
    category: 'user_action',
    message: 'User updated profile',
    details: 'Changed display name',
    userEmail: 'user2@example.com',
    ipAddress: '192.168.1.2',
  },
];

const mockFindAll = jest.fn();
const mockClearAll = jest.fn();

jest.mock('@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository', () => ({
  FirebaseLogRepository: function () {
    return {
      findAll: mockFindAll,
      clearAll: mockClearAll,
    };
  },
}));

jest.mock('@modules/shared-kernel/logging/infrastructure/services/LogSeederService', () => ({
  LogSeederService: jest.fn().mockImplementation(() => ({})),
}));

describe('AdminLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
      if (module !== SystemModule.Logs) return false;
      return action === PermissionAction.View || action === PermissionAction.Manage;
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      loading: false,
      permissions: [],
    });
    mockFindAll.mockResolvedValue([...baseLogs]);
    mockClearAll.mockResolvedValue(undefined);

    jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AdminLogsPage />
      </MemoryRouter>
    );

  it('mostra loading de permissao', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      loading: true,
      permissions: [],
    });

    renderComponent();

    expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
  });

  it('bloqueia acesso sem permissao de visualizacao', () => {
    mockHasPermission.mockReturnValue(false);

    renderComponent();

    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    expect(screen.getByText('Você não tem permissão para acessar esta página.')).toBeInTheDocument();
  });

  it('renderiza cabecalho, estatisticas, filtros e tabela', async () => {
    renderComponent();

    expect(await screen.findByText('Logs do Sistema')).toBeInTheDocument();
    expect(screen.getByText('Total de Logs')).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar logs...')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getAllByText('Nível').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Categoria').length).toBeGreaterThan(0);
    expect(screen.getByText('Mensagem')).toBeInTheDocument();
    expect(screen.getByText('User logged in')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('filtra logs por busca, nivel e categoria', async () => {
    renderComponent();
    await screen.findByText('User logged in');

    await userEvent.type(screen.getByPlaceholderText('Buscar logs...'), 'database');

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], 'warning');
    await userEvent.clear(screen.getByPlaceholderText('Buscar logs...'));

    await waitFor(() => {
      expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
      expect(screen.queryByText('Database connection failed')).not.toBeInTheDocument();
    });

    await userEvent.selectOptions(selects[1], 'security');
    expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
  });

  it('atualiza os logs quando o usuario clica em atualizar', async () => {
    renderComponent();
    await screen.findByText('User logged in');

    await userEvent.click(screen.getByRole('button', { name: /Atualizar/i }));

    expect(mockFindAll).toHaveBeenCalledTimes(2);
  });

  it('limpa logs quando o usuario tem permissao de gerenciamento', async () => {
    renderComponent();
    await screen.findByText('User logged in');

    await userEvent.click(screen.getByRole('button', { name: /Limpar Logs/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockClearAll).toHaveBeenCalledTimes(1);
      expect(window.alert).toHaveBeenCalledWith('Logs limpos com sucesso!');
    });
  });

  it('exporta logs em json quando o usuario tem permissao de gerenciamento', async () => {
    const mockClick = jest.fn();
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLAnchorElement;
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      }) as any);

    renderComponent();
    await screen.findByText('User logged in');

    await userEvent.click(screen.getByRole('button', { name: /Exportar/i }));

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith('Logs exportados em JSON com sucesso!');

    createElementSpy.mockRestore();
  });

  it('nao mostra botoes de exportar e limpar sem permissao de gerenciamento', async () => {
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
      if (module !== SystemModule.Logs) return false;
      return action === PermissionAction.View;
    });

    renderComponent();
    await screen.findByText('User logged in');

    expect(screen.queryByRole('button', { name: /Exportar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Limpar Logs/i })).not.toBeInTheDocument();
    expect(screen.getByText('Sem permissão para limpar')).toBeInTheDocument();
  });

  it('pagina resultados quando ha mais de 10 logs', async () => {
    const manyLogs = Array.from({ length: 12 }, (_, index) => ({
      ...baseLogs[index % baseLogs.length],
      id: `log-${index + 1}`,
      message: `Mensagem ${index + 1}`,
    }));
    mockFindAll.mockResolvedValue(manyLogs);

    renderComponent();

    expect(await screen.findByText('Mensagem 1')).toBeInTheDocument();
    expect(screen.getByText('Primeira')).toBeInTheDocument();
    expect(screen.getByText('Última')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Próxima/i }));

    await waitFor(() => {
      expect(screen.getByText('Mensagem 11')).toBeInTheDocument();
    });
  });
});
