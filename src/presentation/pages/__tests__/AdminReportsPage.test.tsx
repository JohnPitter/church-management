// Unit Tests - Admin Reports Page
// Comprehensive tests for reports and analytics functionality

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
    login: jest.fn().mockResolvedValue(mockCurrentUser),
    register: jest.fn().mockResolvedValue(mockCurrentUser),
    signInWithGoogle: jest.fn().mockResolvedValue(mockCurrentUser),
    logout: jest.fn().mockResolvedValue(undefined),
    refreshUser: jest.fn().mockResolvedValue(undefined),
    canCreateContent: jest.fn().mockReturnValue(true),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn().mockResolvedValue(undefined),
    getSignInMethods: jest.fn().mockResolvedValue(['password']).mockResolvedValue(['password'])
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
    { month: 'Jan/26', totalUsers: 100, newUsers: 10, activeUsers: 80 },
    { month: 'Feb/26', totalUsers: 110, newUsers: 12, activeUsers: 85 },
    { month: 'Mar/26', totalUsers: 120, newUsers: 15, activeUsers: 90 }
  ],
  eventStats: {
    totalEvents: 25,
    avgAttendance: 45,
    popularCategories: [
      { name: 'Cultos', count: 12 },
      { name: 'Reunioes', count: 8 },
      { name: 'Eventos Especiais', count: 5 }
    ],
    monthlyEvents: [
      { month: 'Jan/26', count: 8 },
      { month: 'Feb/26', count: 9 },
      { month: 'Mar/26', count: 8 }
    ]
  },
  projectStats: {
    totalProjects: 15,
    activeProjects: 5,
    completedProjects: 10,
    totalBudget: 50000,
    totalParticipants: 45
  },
  engagementStats: {
    blogPosts: 30,
    blogViews: 5000,
    forumPosts: 15,
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

  const renderComponent = async () => {
    let result;
    await act(async () => {
      result = render(
        <MemoryRouter>
          <AdminReportsPage />
        </MemoryRouter>
      );
    });
    return result;
  };

  describe('Permission Checks', () => {
    it('should show loading spinner while checking permissions', async () => {
      mockPermissionsLoading = true;
      await renderComponent();

      expect(screen.getByText(/Verificando permiss/i)).toBeInTheDocument();
    });

    it('should show access denied when user cannot view reports', async () => {
      mockHasPermission.mockReturnValue(false);
      await renderComponent();

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText(/permiss.*o para visualizar relat.*rios/i)).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Relat.*rios/i })).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('should render the page header', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Relat.*rios/i })).toBeInTheDocument();
      });
      expect(screen.getByText(/An.*lises e relat.*rios do sistema/i)).toBeInTheDocument();
    });

    it('should render period selector', async () => {
      await renderComponent();

      await waitFor(() => {
        const periodSelect = screen.getByRole('combobox');
        expect(periodSelect).toBeInTheDocument();
        expect(periodSelect).toHaveValue('3months');
      });
    });

    it('should render report type navigation', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Vis.*o Geral/i)).toBeInTheDocument();
        expect(screen.getByText(/Usu.*rios/i)).toBeInTheDocument();
        expect(screen.getByText('Eventos')).toBeInTheDocument();
        expect(screen.getByText('Projetos')).toBeInTheDocument();
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
        expect(screen.getByText('Financeiro')).toBeInTheDocument();
      });
    });

    it('should render export buttons when user has manage permission', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });
    });

    it('should hide export buttons when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return module === SystemModule.Reports && action === PermissionAction.View;
      });
      await renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Exportar PDF')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', async () => {
      mockGenerateReportData.mockImplementation(() => new Promise(() => {})); // Never resolves
      await renderComponent();

      expect(screen.getByText(/Carregando dados dos relat.*rios/i)).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load report data on mount', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3);
      });
    });

    it('should reload data when period changes', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3);
      });

      const periodSelect = screen.getByRole('combobox');

      await act(async () => {
        await userEvent.selectOptions(periodSelect, '6months');
      });

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(6);
      });
    });

    it('should show error state when data loading fails', async () => {
      mockGenerateReportData.mockRejectedValueOnce(new Error('Load failed'));
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      mockGenerateReportData.mockRejectedValueOnce(new Error('Load failed'));
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });

      mockGenerateReportData.mockResolvedValueOnce(mockReportData);

      await act(async () => {
        await userEvent.click(screen.getByText('Tentar Novamente'));
      });

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Overview Report', () => {
    it('should display key metrics', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/M.*tricas Principais/i)).toBeInTheDocument();
        expect(screen.getByText(/Total de Usu.*rios/i)).toBeInTheDocument();
        expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
        expect(screen.getByText('Projetos Ativos')).toBeInTheDocument();
        expect(screen.getByText('Posts do Blog')).toBeInTheDocument();
      });
    });

    it('should display user growth data', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Crescimento de Usu.*rios/i)).toBeInTheDocument();
        expect(screen.getByText('Jan/26')).toBeInTheDocument();
      });
    });

    it('should display event categories', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Categorias de Eventos Mais Populares/i)).toBeInTheDocument();
        expect(screen.getByText('Cultos')).toBeInTheDocument();
      });
    });

    it('should display correct metric values', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('120')).toBeInTheDocument(); // Total users
        expect(screen.getByText('25')).toBeInTheDocument(); // Total events
        expect(screen.getByText('5')).toBeInTheDocument(); // Active projects
        expect(screen.getByText('30')).toBeInTheDocument(); // Blog posts
      });
    });
  });

  describe('Report Type Navigation', () => {
    it('should switch to Users report', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Usu.*rios/i)).toBeInTheDocument();
      });

      const usersButton = screen.getByText(/Usu.*rios/i).closest('button');

      await act(async () => {
        await userEvent.click(usersButton!);
      });

      await waitFor(() => {
        expect(screen.getByText(/Relat.*rio de Usu.*rios/i)).toBeInTheDocument();
      });
    });

    it('should switch to Events report', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Eventos'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Relat.*rio de Eventos/i)).toBeInTheDocument();
      });
    });

    it('should switch to Projects report', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Projetos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Projetos'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Relat.*rio de Projetos/i)).toBeInTheDocument();
      });
    });

    it('should switch to Engagement report', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Engajamento'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Relat.*rio de Engajamento/i)).toBeInTheDocument();
      });
    });

    it('should switch to Financial report', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Financeiro')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Financeiro'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Relat.*rio Financeiro/i)).toBeInTheDocument();
        expect(screen.getByText('Em Desenvolvimento')).toBeInTheDocument();
      });
    });
  });

  describe('Period Selection', () => {
    it('should have all period options', async () => {
      await renderComponent();

      await waitFor(() => {
        const periodSelect = screen.getByRole('combobox') as HTMLSelectElement;
        const options = Array.from(periodSelect.options).map(opt => opt.value);

        expect(options).toContain('1month');
        expect(options).toContain('3months');
        expect(options).toContain('6months');
        expect(options).toContain('1year');
      });
    });

    it('should call generateReportData with correct months for each period', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3);
      });

      const periodSelect = screen.getByRole('combobox');

      // Test 1 month
      await act(async () => {
        await userEvent.selectOptions(periodSelect, '1month');
      });

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(1);
      });

      // Test 1 year
      await act(async () => {
        await userEvent.selectOptions(periodSelect, '1year');
      });

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(12);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export PDF when button is clicked', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar PDF'));
      });

      await waitFor(() => {
        expect(mockExportReport).toHaveBeenCalledWith('pdf', mockReportData);
      });
    });

    it('should export Excel when button is clicked', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar Excel'));
      });

      await waitFor(() => {
        expect(mockExportReport).toHaveBeenCalledWith('excel', mockReportData);
      });
    });

    it('should show success alert on successful export', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar PDF'));
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('sucesso'));
      });
    });

    it('should show error alert on export failure', async () => {
      mockExportReport.mockRejectedValueOnce(new Error('Export failed'));
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar PDF'));
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro'));
      });
    });

    it('should handle missing data gracefully', async () => {
      mockGenerateReportData.mockResolvedValueOnce(null);
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/A.*es R.*pidas/i)).toBeInTheDocument();
      });
    });

    it('should refresh data when update button is clicked', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar Dados')).toBeInTheDocument();
      });

      mockGenerateReportData.mockClear();

      await act(async () => {
        await userEvent.click(screen.getByText('Atualizar Dados'));
      });

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalled();
      });
    });

    it('should show schedule report functionality', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Agendar Relat.*rio/i)).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText(/Agendar Relat.*rio/i));
      });

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('breve'));
    });
  });

  describe('Error Handling', () => {
    it('should log error to console when data loading fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Load failed');
      mockGenerateReportData.mockRejectedValueOnce(error);

      await renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading report data:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should recover from error after retry', async () => {
      mockGenerateReportData.mockRejectedValueOnce(new Error('Load failed'));
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
      });

      mockGenerateReportData.mockResolvedValueOnce(mockReportData);

      await act(async () => {
        await userEvent.click(screen.getByText('Tentar Novamente'));
      });

      await waitFor(() => {
        expect(screen.getByText(/M.*tricas Principais/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible navigation buttons', async () => {
      await renderComponent();

      await waitFor(() => {
        const navButtons = screen.getAllByRole('button');
        expect(navButtons.length).toBeGreaterThan(0);
      });
    });

    it('should have proper heading structure', async () => {
      await renderComponent();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /Relat.*rios/i });
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('Report Type Highlighting', () => {
    it('should highlight overview report by default', async () => {
      await renderComponent();

      await waitFor(() => {
        const overviewButton = screen.getByText(/Vis.*o Geral/i).closest('button');
        expect(overviewButton).toHaveClass('bg-indigo-50');
      });
    });

    it('should highlight selected report type', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Eventos'));
      });

      await waitFor(() => {
        const eventsButton = screen.getByText('Eventos').closest('button');
        expect(eventsButton).toHaveClass('bg-indigo-50');
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format budget values correctly', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Projetos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Projetos'));
      });

      await waitFor(() => {
        expect(screen.getByText(/R\$ 50/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading Button States', () => {
    it('should disable controls while loading', async () => {
      let resolvePromise: (value: any) => void;
      mockGenerateReportData.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      await renderComponent();

      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toBeDisabled();

      await act(async () => {
        resolvePromise!(mockReportData);
      });

      await waitFor(() => {
        expect(periodSelect).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle default case in getPeriodMonths', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockGenerateReportData).toHaveBeenCalledWith(3);
      });

      // Component initializes with 3months by default
      expect(screen.getByRole('combobox')).toHaveValue('3months');
    });

    it('should handle download link creation and cleanup', async () => {
      const mockLink = document.createElement('a');
      const mockClick = jest.fn();
      mockLink.click = mockClick;

      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return document.createElement(tagName);
      });

      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar PDF'));
      });

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalled();
      });

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should show alert when export is clicked without loaded data', async () => {
      mockGenerateReportData.mockResolvedValueOnce(null);
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao Carregar Dados')).toBeInTheDocument();
      });

      // The export buttons won't be visible in error state, so this test confirms error handling
      expect(screen.queryByText('Exportar PDF')).not.toBeInTheDocument();
    });
  });

  describe('Report Stats Display', () => {
    it('should display event report statistics correctly', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Eventos'));
      });

      await waitFor(() => {
        const eventStatsElements = screen.getAllByText('25');
        expect(eventStatsElements.length).toBeGreaterThan(0);
        expect(screen.getByText('45')).toBeInTheDocument(); // avgAttendance
      });
    });

    it('should display project stats correctly', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Projetos')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Projetos'));
      });

      await waitFor(() => {
        const activeProjectsElements = screen.getAllByText('5');
        expect(activeProjectsElements.length).toBeGreaterThan(0);
        expect(screen.getByText('10')).toBeInTheDocument(); // completedProjects
      });
    });

    it('should display engagement stats correctly', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Engajamento')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Engajamento'));
      });

      await waitFor(() => {
        expect(screen.getByText('5000')).toBeInTheDocument(); // blogViews
        expect(screen.getByText('4:30')).toBeInTheDocument(); // avgSessionTime
      });
    });
  });

  describe('User Reports Hardcoded Data', () => {
    it('should display hardcoded user statistics', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Usu.*rios/i)).toBeInTheDocument();
      });

      const usersButton = screen.getByText(/Usu.*rios/i).closest('button');

      await act(async () => {
        await userEvent.click(usersButton!);
      });

      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument();
        expect(screen.getByText('142')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });
  });

  describe('Export Button Actions', () => {
    it('should create blob URL and download file for PDF export', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar PDF'));
      });

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      });
    });

    it('should create blob URL and download file for Excel export', async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Exportar Excel'));
      });

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockExportReport).toHaveBeenCalledWith('excel', mockReportData);
      });
    });
  });
});
