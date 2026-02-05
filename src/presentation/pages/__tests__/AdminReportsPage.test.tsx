// Unit Tests - Admin Reports Page
// Comprehensive tests for reports and analytics functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminReportsPage } from '../AdminReportsPage';
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

// Mock ReportsService
const mockReportData = {
  userGrowth: [
    { month: 'Janeiro', totalUsers: 100, newUsers: 10, activeUsers: 80 },
    { month: 'Fevereiro', totalUsers: 110, newUsers: 12, activeUsers: 85 },
    { month: 'Marco', totalUsers: 120, newUsers: 15, activeUsers: 90 }
  ],
  eventStats: {
    totalEvents: 25,
    avgAttendance: 45,
    popularCategories: [
      { name: 'Cultos', count: 12 },
      { name: 'Reunioes', count: 8 },
      { name: 'Eventos Especiais', count: 5 }
    ]
  },
  projectStats: {
    activeProjects: 5,
    completedProjects: 10,
    totalBudget: 50000
  },
  engagementStats: {
    blogPosts: 30,
    blogViews: 5000,
    avgSessionTime: '4:30'
  }
};

const mockGenerateReportData = jest.fn();
const mockExportReport = jest.fn();

jest.mock('@modules/ong-management/settings/application/services/ReportsService', () => ({
  reportsService: {
    generateReportData: (...args: any[]) => mockGenerateReportData(...args),
    exportReport: (...args: any[]) => mockExportReport(...args)
  }
}));

describe('AdminReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
      if (module === SystemModule.Reports) {
        return action === PermissionAction.View || action === PermissionAction.Manage;
      }
      return false;
    });
    mockPermissionsLoading = false;
    mockGenerateReportData.mockResolvedValue(mockReportData);
    mockExportReport.mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }));
    // Mock window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>
    );
  };

  describe('Permission Checks', () => {
    it('should show loading spinner while checking permissions', () => {
      mockPermissionsLoading = true;
      renderComponent();

      expect(screen.getByText('Verificando permissoes...')).toBeInTheDocument();
    });

    it('should show access denied when user cannot view reports', () => {
      mockHasPermission.mockReturnValue(false);
      renderComponent();

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText('Voce nao tem permissao para visualizar relatorios.')).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Relatorios')).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('should render the page header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Relatorios')).toBeInTheDocument();
        expect(screen.getByText('Analises e relatorios do sistema')).toBeInTheDocument();
      });
    });

    it('should render period selector', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toHaveValue('3months');
    });

    it('should render report type navigation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Visao Geral')).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Eventos')).toBeInTheDocument();
        expect(screen.getByText('Projetos')).toBeInTheDocument();
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
        expect(screen.getByText('Financeiro')).toBeInTheDocument();
      });
    });

    it('should render export buttons when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });
    });

    it('should hide export buttons when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Exportar PDF')).not.toBeInTheDocument();
        expect(screen.queryByText('Exportar Excel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      mockGenerateReportData.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      expect(screen.getByText('Carregando dados dos relatorios...')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load report data on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3); // Default is 3 months
      });
    });

    it('should reload data when period changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3);
      });

      const periodSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(periodSelect, '6months');

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(6);
      });
    });

    it('should show error state when data loading fails', async () => {
      mockGenerateReportData.mockRejectedValueOnce(new Error('Load failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      mockGenerateReportData.mockRejectedValueOnce(new Error('Load failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });

      mockGenerateReportData.mockResolvedValueOnce(mockReportData);
      await userEvent.click(screen.getByText('Tentar Novamente'));

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Overview Report', () => {
    it('should display key metrics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Metricas Principais')).toBeInTheDocument();
        expect(screen.getByText('Total de Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
        expect(screen.getByText('Projetos Ativos')).toBeInTheDocument();
        expect(screen.getByText('Posts do Blog')).toBeInTheDocument();
      });
    });

    it('should display user growth data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Crescimento de Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Janeiro')).toBeInTheDocument();
        expect(screen.getByText('Fevereiro')).toBeInTheDocument();
        expect(screen.getByText('Marco')).toBeInTheDocument();
      });
    });

    it('should display event categories', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Categorias de Eventos Mais Populares')).toBeInTheDocument();
        expect(screen.getByText('Cultos')).toBeInTheDocument();
        expect(screen.getByText('Reunioes')).toBeInTheDocument();
      });
    });

    it('should display correct metric values', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('120')).toBeInTheDocument(); // Total users from last month
        expect(screen.getByText('25')).toBeInTheDocument(); // Total events
        expect(screen.getByText('5')).toBeInTheDocument(); // Active projects
        expect(screen.getByText('30')).toBeInTheDocument(); // Blog posts
      });
    });
  });

  describe('Report Type Navigation', () => {
    it('should switch to Users report', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Usuarios'));

      await waitFor(() => {
        expect(screen.getByText('Relatorio de Usuarios')).toBeInTheDocument();
      });
    });

    it('should switch to Events report', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Eventos'));

      await waitFor(() => {
        expect(screen.getByText('Relatorio de Eventos')).toBeInTheDocument();
      });
    });

    it('should switch to Projects report', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Projetos')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Projetos'));

      await waitFor(() => {
        expect(screen.getByText('Relatorio de Projetos')).toBeInTheDocument();
      });
    });

    it('should switch to Engagement report', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Engajamento'));

      await waitFor(() => {
        expect(screen.getByText('Relatorio de Engajamento')).toBeInTheDocument();
      });
    });

    it('should switch to Financial report', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Financeiro')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Financeiro'));

      await waitFor(() => {
        expect(screen.getByText('Relatorio Financeiro')).toBeInTheDocument();
        expect(screen.getByText('Em Desenvolvimento')).toBeInTheDocument();
      });
    });
  });

  describe('Events Report', () => {
    it('should display event statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Eventos'));

      await waitFor(() => {
        expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
        expect(screen.getByText('Presenca Media')).toBeInTheDocument();
      });
    });
  });

  describe('Projects Report', () => {
    it('should display project statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Projetos')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Projetos'));

      await waitFor(() => {
        expect(screen.getByText('Projetos Ativos')).toBeInTheDocument();
        expect(screen.getByText('Concluidos')).toBeInTheDocument();
        expect(screen.getByText('Orcamento Total')).toBeInTheDocument();
      });
    });
  });

  describe('Engagement Report', () => {
    it('should display engagement statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Engajamento'));

      await waitFor(() => {
        expect(screen.getByText('Visualizacoes do Blog')).toBeInTheDocument();
        expect(screen.getByText('Tempo Medio de Sessao')).toBeInTheDocument();
      });
    });
  });

  describe('Period Selection', () => {
    it('should have all period options', async () => {
      renderComponent();

      await waitFor(() => {
        const periodSelect = screen.getByRole('combobox');
        const options = Array.from((periodSelect as HTMLSelectElement).options).map(opt => opt.value);

        expect(options).toContain('1month');
        expect(options).toContain('3months');
        expect(options).toContain('6months');
        expect(options).toContain('1year');
      });
    });

    it('should call generateReportData with correct months for each period', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3); // Default
      });

      const periodSelect = screen.getByRole('combobox');

      // Test 1 month
      await userEvent.selectOptions(periodSelect, '1month');
      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(1);
      });

      // Test 6 months
      await userEvent.selectOptions(periodSelect, '6months');
      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(6);
      });

      // Test 1 year
      await userEvent.selectOptions(periodSelect, '1year');
      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(12);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export PDF when button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(mockExportReport).toHaveBeenCalledWith('pdf', mockReportData);
      });
    });

    it('should export Excel when button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar Excel'));

      await waitFor(() => {
        expect(mockExportReport).toHaveBeenCalledWith('excel', mockReportData);
      });
    });

    it('should show success alert on successful export', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Relatorio exportado em PDF com sucesso!');
      });
    });

    it('should show error alert on export failure', async () => {
      mockExportReport.mockRejectedValueOnce(new Error('Export failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao exportar relatorio.');
      });
    });

    it('should show alert when trying to export without data', async () => {
      mockGenerateReportData.mockResolvedValueOnce(null);
      renderComponent();

      // Wait for the error state to appear
      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Acoes Rapidas')).toBeInTheDocument();
      });
    });

    it('should show schedule report button when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Agendar Relatorio')).toBeInTheDocument();
      });
    });

    it('should show update data button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar Dados')).toBeInTheDocument();
      });
    });

    it('should refresh data when update button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar Dados')).toBeInTheDocument();
      });

      mockGenerateReportData.mockClear();
      await userEvent.click(screen.getByText('Atualizar Dados'));

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalled();
      });
    });

    it('should show send by email button when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Enviar por Email')).toBeInTheDocument();
      });
    });

    it('should hide manage actions when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Agendar Relatorio')).not.toBeInTheDocument();
        expect(screen.queryByText('Enviar por Email')).not.toBeInTheDocument();
      });
    });
  });

  describe('Schedule Report', () => {
    it('should show coming soon alert when schedule is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Agendar Relatorio')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Agendar Relatorio'));

      expect(window.alert).toHaveBeenCalledWith('Funcionalidade de agendamento sera implementada em breve!');
    });
  });

  describe('Loading Button States', () => {
    it('should disable period select while loading', async () => {
      let resolvePromise: (value: any) => void;
      mockGenerateReportData.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderComponent();

      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toBeDisabled();

      await act(async () => {
        resolvePromise!(mockReportData);
      });

      expect(periodSelect).not.toBeDisabled();
    });

    it('should disable export buttons while loading', async () => {
      let resolvePromise: (value: any) => void;
      mockGenerateReportData.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderComponent();

      const pdfButton = screen.getByText('Exportar PDF');
      const excelButton = screen.getByText('Exportar Excel');

      expect(pdfButton).toBeDisabled();
      expect(excelButton).toBeDisabled();

      await act(async () => {
        resolvePromise!(mockReportData);
      });

      expect(pdfButton).not.toBeDisabled();
      expect(excelButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible navigation buttons', async () => {
      renderComponent();

      await waitFor(() => {
        const navButtons = screen.getAllByRole('button');
        expect(navButtons.length).toBeGreaterThan(0);
      });
    });

    it('should have proper headings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Relatorios' })).toBeInTheDocument();
      });
    });
  });
});
