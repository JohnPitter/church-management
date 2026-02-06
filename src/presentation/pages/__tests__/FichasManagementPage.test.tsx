// Unit Tests - Admin Backup Page
// Comprehensive tests for backup and data management functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminBackupPage } from '../AdminBackupPage';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { UserRole, UserStatus } from '@/domain/entities/User';
import { BackupInfo, DatabaseStats } from '@modules/analytics/backup/application/services/BackupService';

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
let mockPermissionsLoading = false;

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    loading: mockPermissionsLoading
  })
}));

// Mock BackupService
const mockBackups: BackupInfo[] = [
  {
    id: 'backup-1',
    name: 'Backup Completo - 05/02/2026',
    type: 'full',
    size: '125.5 MB',
    createdAt: new Date('2026-02-05T10:00:00'),
    status: 'completed',
    description: 'Todos os dados e arquivos',
    createdBy: 'admin@example.com'
  },
  {
    id: 'backup-2',
    name: 'Backup Base de Dados - 04/02/2026',
    type: 'database',
    size: '45.2 MB',
    createdAt: new Date('2026-02-04T15:30:00'),
    status: 'completed',
    description: 'Apenas dados do Firestore',
    createdBy: 'admin@example.com'
  },
  {
    id: 'backup-3',
    name: 'Backup Incremental - 03/02/2026',
    type: 'incremental',
    size: '12.8 MB',
    createdAt: new Date('2026-02-03T09:00:00'),
    status: 'in_progress',
    description: 'Apenas alterações recentes',
    createdBy: 'admin@example.com'
  },
  {
    id: 'backup-4',
    name: 'Backup Arquivos - 02/02/2026',
    type: 'files',
    size: '0 B',
    createdAt: new Date('2026-02-02T14:00:00'),
    status: 'failed',
    description: 'Apenas arquivos de mídia',
    createdBy: 'admin@example.com'
  }
];

const mockDatabaseStats: DatabaseStats = {
  totalRecords: 1547,
  totalSize: '45.2 MB',
  collections: [
    { name: 'users', records: 125, size: '256 KB', lastUpdated: new Date() },
    { name: 'events', records: 89, size: '133.4 KB', lastUpdated: new Date() },
    { name: 'projects', records: 45, size: '45 KB', lastUpdated: new Date() },
    { name: 'blogPosts', records: 234, size: '701.3 KB', lastUpdated: new Date() },
    { name: 'notifications', records: 654, size: '490.5 KB', lastUpdated: new Date() },
    { name: 'systemLogs', records: 400, size: '400 KB', lastUpdated: new Date() }
  ],
  lastCalculated: new Date('2026-02-05T12:00:00')
};

const mockGetBackups = jest.fn();
const mockGetDatabaseStats = jest.fn();
const mockCreateBackup = jest.fn();
const mockDownloadBackup = jest.fn();
const mockDeleteBackup = jest.fn();

jest.mock('@modules/analytics/backup/application/services/BackupService', () => ({
  backupService: {
    getBackups: (...args: any[]) => mockGetBackups(...args),
    getDatabaseStats: (...args: any[]) => mockGetDatabaseStats(...args),
    createBackup: (...args: any[]) => mockCreateBackup(...args),
    downloadBackup: (...args: any[]) => mockDownloadBackup(...args),
    deleteBackup: (...args: any[]) => mockDeleteBackup(...args)
  }
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy HH:mm') {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('pt-BR');
  }
}));

// Mock window.confirm and window.alert
global.confirm = jest.fn();
global.alert = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('AdminBackupPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionsLoading = false;
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
      if (module === SystemModule.Backup) {
        return action === PermissionAction.View ||
               action === PermissionAction.Create ||
               action === PermissionAction.Manage;
      }
      return false;
    });
    mockGetBackups.mockResolvedValue(mockBackups);
    mockGetDatabaseStats.mockResolvedValue(mockDatabaseStats);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminBackupPage />
      </MemoryRouter>
    );
  };

  describe('Permission Checks', () => {
    it('should show loading state while checking permissions', async () => {
      mockPermissionsLoading = true;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/verificando permissões/i)).toBeInTheDocument();
      });
    });

    it('should show access denied when user lacks view permission', async () => {
      mockHasPermission.mockReturnValue(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/acesso negado/i)).toBeInTheDocument();
        expect(screen.getByText(/você não tem permissão para acessar esta página/i)).toBeInTheDocument();
      });
    });

    it('should load page when user has view permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/backup & dados/i)).toBeInTheDocument();
      });
    });
  });

  describe('Page Rendering', () => {
    it('should render page header with title and description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/backup & dados/i)).toBeInTheDocument();
        expect(screen.getByText(/gerencie backups e dados do sistema/i)).toBeInTheDocument();
      });
    });

    it('should show "Novo Backup" button when user has create permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });
    });

    it('should hide "Novo Backup" button when user lacks create permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (module === SystemModule.Backup && action === PermissionAction.View) {
          return true;
        }
        return false;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/backup & dados/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /novo backup/i })).not.toBeInTheDocument();
    });
  });

  describe('Database Statistics', () => {
    it('should load and display database statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/estatísticas da base de dados/i)).toBeInTheDocument();
        expect(screen.getByText('1.547')).toBeInTheDocument();
        expect(screen.getAllByText('45.2 MB').length).toBeGreaterThan(0);
      });

      expect(mockGetDatabaseStats).toHaveBeenCalledTimes(1);
    });

    it('should show loading state while fetching statistics', async () => {
      mockGetDatabaseStats.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockDatabaseStats), 100)));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/carregando estatísticas/i)).toBeInTheDocument();
      });
    });

    it('should display collection breakdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/detalhamento por coleção/i)).toBeInTheDocument();
        expect(screen.getByText('users')).toBeInTheDocument();
        expect(screen.getByText('125')).toBeInTheDocument();
        expect(screen.getByText('events')).toBeInTheDocument();
        expect(screen.getByText('89')).toBeInTheDocument();
      });
    });

    it('should handle error loading statistics gracefully', async () => {
      mockGetDatabaseStats.mockRejectedValue(new Error('Failed to load stats'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/erro ao carregar estatísticas/i)).toBeInTheDocument();
      });
    });

    it('should allow retrying failed statistics load', async () => {
      mockGetDatabaseStats.mockRejectedValueOnce(new Error('Failed')).mockResolvedValue(mockDatabaseStats);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/erro ao carregar estatísticas/i)).toBeInTheDocument();
      });

      const retryButtons = screen.getAllByRole('button', { name: /tentar novamente/i });
      fireEvent.click(retryButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('1.547')).toBeInTheDocument();
      });

      expect(mockGetDatabaseStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('Backup List', () => {
    it('should load and display list of backups', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/histórico de backups/i)).toBeInTheDocument();
        expect(screen.getByText(/backup completo - 05\/02\/2026/i)).toBeInTheDocument();
        expect(screen.getByText(/backup base de dados - 04\/02\/2026/i)).toBeInTheDocument();
      });

      expect(mockGetBackups).toHaveBeenCalledTimes(1);
    });

    it('should display backup details correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('125.5 MB')).toBeInTheDocument();
        expect(screen.getAllByText('45.2 MB').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/concluído/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/em progresso/i)).toBeInTheDocument();
        expect(screen.getByText(/falhou/i)).toBeInTheDocument();
      });
    });

    it('should show correct status colors', async () => {
      renderComponent();

      await waitFor(() => {
        const completedStatus = screen.getAllByText(/concluído/i)[0];
        expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800');

        const inProgressStatus = screen.getByText(/em progresso/i);
        expect(inProgressStatus).toHaveClass('bg-blue-100', 'text-blue-800');

        const failedStatus = screen.getByText(/falhou/i);
        expect(failedStatus).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should show correct type badges', async () => {
      renderComponent();

      await waitFor(() => {
        // Wait for the table to be rendered
        expect(screen.getByText(/histórico de backups/i)).toBeInTheDocument();
      });

      // Check for type badges in the table
      const table = screen.getByRole('table');
      expect(within(table).getAllByText(/backup completo/i).length).toBeGreaterThan(0);
      expect(within(table).getAllByText(/backup base de dados/i).length).toBeGreaterThan(0);
    });

    it('should show empty state when no backups exist', async () => {
      mockGetBackups.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/nenhum backup encontrado/i)).toBeInTheDocument();
        expect(screen.getByText(/crie seu primeiro backup para começar a proteger seus dados/i)).toBeInTheDocument();
      });
    });

    it('should show "Criar Primeiro Backup" button in empty state with create permission', async () => {
      mockGetBackups.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar primeiro backup/i })).toBeInTheDocument();
      });
    });
  });

  describe('Create Backup', () => {
    it('should open create backup modal when clicking "Novo Backup"', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /novo backup/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/criar novo backup/i)).toBeInTheDocument();
        expect(screen.getByText(/tipo de backup/i)).toBeInTheDocument();
      });
    });

    it('should display all backup type options in modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();

        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(4);
        expect(options[0]).toHaveTextContent(/backup completo/i);
        expect(options[1]).toHaveTextContent(/base de dados/i);
        expect(options[2]).toHaveTextContent(/arquivos/i);
        expect(options[3]).toHaveTextContent(/incremental/i);
      });
    });

    it('should allow selecting backup type', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'database');

      expect((select.querySelector('option[value="database"]') as HTMLOptionElement).selected).toBe(true);
    });

    it('should create backup when clicking "Criar Backup"', async () => {
      mockCreateBackup.mockResolvedValue('backup-new');
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^criar backup$/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /^criar backup$/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledWith(
          'full',
          'Todos os dados e arquivos',
          'admin@example.com'
        );
      });

      expect(global.alert).toHaveBeenCalledWith('Backup iniciado com sucesso!');
    });

    it('should close modal after successful backup creation', async () => {
      mockCreateBackup.mockResolvedValue('backup-new');
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^criar backup$/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /^criar backup$/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.queryByText(/criar novo backup/i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state while creating backup', async () => {
      mockCreateBackup.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('backup-new'), 100)));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^criar backup$/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /^criar backup$/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled();
      });
    });

    it('should handle backup creation error', async () => {
      mockCreateBackup.mockRejectedValue(new Error('Failed to create backup'));
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^criar backup$/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /^criar backup$/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erro ao criar backup');
      });
    });

    it('should allow canceling backup creation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/criar novo backup/i)).not.toBeInTheDocument();
      });
    });

    it('should refresh backup list after creation', async () => {
      mockCreateBackup.mockResolvedValue('backup-new');
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo backup/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /novo backup/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^criar backup$/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /^criar backup$/i });

      await act(async () => {
        fireEvent.click(createButton);
        await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for setTimeout
      });

      // Initial load + refresh after creation
      await waitFor(() => {
        expect(mockGetBackups.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Download Backup', () => {
    it('should download backup when clicking download button', async () => {
      const mockBlob = new Blob(['backup data'], { type: 'application/json' });
      mockDownloadBackup.mockResolvedValue(mockBlob);

      // Render FIRST, before mocking document.createElement
      renderComponent();

      // Mock document.createElement and document.body AFTER render
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        style: { display: '' }
      };
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockLink as any;
        return originalCreateElement(tag);
      });
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await waitFor(() => {
        expect(screen.getAllByText(/download/i).length).toBeGreaterThan(0);
      });

      const downloadButtons = screen.getAllByText(/download/i);
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockDownloadBackup).toHaveBeenCalledWith('backup-1');
      });

      expect(mockLink.download).toBe('Backup_Completo_-_05/02/2026.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle download error', async () => {
      mockDownloadBackup.mockRejectedValue(new Error('Download failed'));
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/download/i).length).toBeGreaterThan(0);
      });

      const downloadButtons = screen.getAllByText(/download/i);
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erro ao baixar backup');
      });
    });

    it('should only show download button for completed backups', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/download/i).length).toBe(2);
      });
    });
  });

  describe('Restore Backup', () => {
    it('should show confirmation dialog when clicking restore', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/restaurar/i).length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByText(/restaurar/i);
      fireEvent.click(restoreButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        'ATENÇÃO: Esta ação irá substituir todos os dados atuais. Tem certeza que deseja continuar?'
      );
    });

    it('should show development alert when confirming restore', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/restaurar/i).length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByText(/restaurar/i);
      fireEvent.click(restoreButtons[0]);

      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Funcionalidade de restauração em desenvolvimento')
      );
    });

    it('should not proceed if user cancels restore', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/restaurar/i).length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByText(/restaurar/i);
      fireEvent.click(restoreButtons[0]);

      expect(global.alert).not.toHaveBeenCalled();
    });

    it('should only show restore button for completed backups', async () => {
      renderComponent();

      await waitFor(() => {
        // Should have 2 completed backups with restore buttons
        const restoreButtons = screen.getAllByText(/restaurar/i);
        expect(restoreButtons).toHaveLength(2);
      });
    });
  });

  describe('Delete Backup', () => {
    it('should show confirmation dialog when clicking delete', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByText(/excluir/i);
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        'Tem certeza que deseja excluir o backup "Backup Completo - 05/02/2026"?'
      );
    });

    it('should delete backup when confirmed', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});
      mockDeleteBackup.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByText(/excluir/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteBackup).toHaveBeenCalledWith('backup-1');
      });

      expect(global.alert).toHaveBeenCalledWith('Backup excluído com sucesso');
    });

    it('should not delete if user cancels', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByText(/excluir/i);
      fireEvent.click(deleteButtons[0]);

      expect(mockDeleteBackup).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});
      mockDeleteBackup.mockRejectedValue(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByText(/excluir/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erro ao excluir backup');
      });
    });

    it('should disable delete button for in-progress backups', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/em progresso/i)).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row').slice(1);
      const inProgressRow = rows[2]; // Third backup is in_progress

      const buttons = within(inProgressRow).getAllByRole('button');
      const deleteButton = buttons[buttons.length - 1];
      expect(deleteButton).toBeDisabled();
    });

    it('should refresh backup list after deletion', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});
      mockDeleteBackup.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByText(/excluir/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        // Initial load + refresh after deletion
        expect(mockGetBackups).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/ações rápidas/i)).toBeInTheDocument();
      });
    });

    it('should show export buttons when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar dados \(json\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /exportar dados \(csv\)/i })).toBeInTheDocument();
      });
    });

    it('should hide export buttons when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (module === SystemModule.Backup && action === PermissionAction.View) {
          return true;
        }
        return false;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /exportar dados \(json\)/i })).not.toBeInTheDocument();
        expect(screen.getByText(/você não tem permissão para exportar dados/i)).toBeInTheDocument();
      });
    });

    it('should export data as JSON', async () => {
      (global.alert as jest.Mock).mockImplementation(() => {});

      // Render FIRST, then mock createElement
      renderComponent();

      // Mock document.createElement and document.body AFTER render
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        style: { display: 'none' }
      };
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockLink as any;
        return originalCreateElement(tag);
      });
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar dados \(json\)/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar dados \(json\)/i });

      await act(async () => {
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(mockLink.download).toContain('.json');
        expect(mockLink.click).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Dados exportados em JSON com sucesso!');
      });
    });

    it('should export data as CSV', async () => {
      (global.alert as jest.Mock).mockImplementation(() => {});

      // Render FIRST, then mock createElement
      renderComponent();

      // Mock document.createElement and document.body AFTER render
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        style: { display: 'none' }
      };
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockLink as any;
        return originalCreateElement(tag);
      });
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar dados \(csv\)/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar dados \(csv\)/i });

      await act(async () => {
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(mockLink.download).toContain('.csv');
        expect(mockLink.click).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Dados exportados em CSV com sucesso!');
      });
    });

    it('should handle export error', async () => {
      mockGetDatabaseStats.mockResolvedValue(null as any);
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar dados \(json\)/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar dados \(json\)/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Aguarde o carregamento das estatísticas do banco de dados.');
      });
    });
  });

  describe('Permission-Based UI', () => {
    it('should hide action buttons when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (module === SystemModule.Backup && action === PermissionAction.View) {
          return true;
        }
        return false;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/histórico de backups/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/download/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/restaurar/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/sem permissão/i).length).toBeGreaterThan(0);
    });

    it('should show all actions when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/download/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/restaurar/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/excluir/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading backups', async () => {
      mockGetBackups.mockRejectedValue(new Error('Failed to load backups'));
      console.error = jest.fn();
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading backup data:', expect.any(Error));
      });
    });

    it('should handle error loading database stats', async () => {
      mockGetDatabaseStats.mockRejectedValue(new Error('Failed to load stats'));
      console.error = jest.fn();
      (global.alert as jest.Mock).mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading backup data:', expect.any(Error));
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching initial data', async () => {
      mockGetBackups.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockBackups), 100)));
      mockGetDatabaseStats.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockDatabaseStats), 100)));

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/carregando/i).length).toBeGreaterThan(0);
      });
    });

    it('should hide loading spinner after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/carregando histórico de backups/i)).not.toBeInTheDocument();
      });
    });
  });
});
