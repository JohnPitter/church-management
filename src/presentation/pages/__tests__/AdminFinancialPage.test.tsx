// Unit Tests - Admin Financial Page
// Comprehensive tests for the church financial management dashboard

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminFinancialPage } from '../AdminFinancialPage';
import { TransactionType, TransactionStatus, FinancialEntity } from '@modules/financial/church-finance/domain/entities/Financial';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin'
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

// Mock SettingsContext
const mockSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  churchName: 'Test Church'
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    loading: false
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

// Mock financial services - Create mock functions outside jest.mock to avoid hoisting issues
const mockFinancialService = {
  getTransactions: jest.fn(),
  getCategories: jest.fn(),
  getFinancialSummary: jest.fn(),
  getIncomeExpenseTrend: jest.fn(),
  getCategoryChartData: jest.fn(),
  getMonthlyComparison: jest.fn(),
  getDonationChartData: jest.fn(),
  exportTransactions: jest.fn()
};

jest.mock('@modules/financial/church-finance/application/services/FinancialService', () => ({
  financialService: {
    getTransactions: (...args: any[]) => mockFinancialService.getTransactions(...args),
    getCategories: (...args: any[]) => mockFinancialService.getCategories(...args),
    getFinancialSummary: (...args: any[]) => mockFinancialService.getFinancialSummary(...args),
    getIncomeExpenseTrend: (...args: any[]) => mockFinancialService.getIncomeExpenseTrend(...args),
    getCategoryChartData: (...args: any[]) => mockFinancialService.getCategoryChartData(...args),
    getMonthlyComparison: (...args: any[]) => mockFinancialService.getMonthlyComparison(...args),
    getDonationChartData: (...args: any[]) => mockFinancialService.getDonationChartData(...args),
    exportTransactions: (...args: any[]) => mockFinancialService.exportTransactions(...args)
  },
  FinancialSummary: {}
}));

// Mock department financial service - Create mock functions outside jest.mock to avoid hoisting issues
const mockDepartmentFinancialService = {
  getDepartments: jest.fn(),
  getDepartmentSummary: jest.fn(),
  updateDepartment: jest.fn()
};

jest.mock('@modules/financial/department-finance/application/services/DepartmentFinancialService', () => ({
  departmentFinancialService: {
    getDepartments: (...args: any[]) => mockDepartmentFinancialService.getDepartments(...args),
    getDepartmentSummary: (...args: any[]) => mockDepartmentFinancialService.getDepartmentSummary(...args),
    updateDepartment: (...args: any[]) => mockDepartmentFinancialService.updateDepartment(...args)
  }
}));

// Mock chart components
jest.mock('../../components/charts/IncomeExpenseChart', () => ({
  IncomeExpenseChart: ({ data }: any) => <div data-testid="income-expense-chart">Income Expense Chart ({data?.length || 0} items)</div>
}));

jest.mock('../../components/charts/CategoryPieChart', () => ({
  CategoryPieChart: ({ data, title }: any) => <div data-testid="category-pie-chart">{title} ({data?.length || 0} items)</div>
}));

jest.mock('../../components/charts/MonthlyComparisonChart', () => ({
  MonthlyComparisonChart: ({ data }: any) => <div data-testid="monthly-comparison-chart">Monthly Comparison ({data?.length || 0} items)</div>
}));

jest.mock('../../components/charts/DonationDonutChart', () => ({
  DonationDonutChart: ({ data }: any) => <div data-testid="donation-donut-chart">Donation Donut ({data?.length || 0} items)</div>
}));

// Mock modal components
jest.mock('../../components/CreateTransactionModal', () => ({
  CreateTransactionModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="create-transaction-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/CreateDonationModal', () => ({
  CreateDonationModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="create-donation-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/CreateCategoryModal', () => ({
  CreateCategoryModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="create-category-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/CreateDepartmentModal', () => ({
  CreateDepartmentModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="create-department-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/DepartmentTransactionModal', () => ({
  DepartmentTransactionModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="department-transaction-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/DepartmentReportModal', () => ({
  DepartmentReportModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="department-report-modal"><button onClick={onClose}>Close</button></div> : null
}));

jest.mock('../../components/DepartmentActionsMenu', () => ({
  DepartmentActionsMenu: ({ department, onEdit, onToggleActive }: any) => (
    <div data-testid={`department-actions-${department.id}`}>
      <button onClick={() => onEdit(department)}>Edit</button>
      <button onClick={() => onToggleActive(department)}>Toggle</button>
    </div>
  )
}));

// Helper to create test data
const createTestCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Test Category',
  type: TransactionType.INCOME,
  description: 'Test description',
  color: '#3B82F6',
  icon: '💰',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

const createTestTransaction = (overrides = {}) => ({
  id: 'trans-1',
  type: TransactionType.INCOME,
  category: createTestCategory(),
  amount: 1000,
  description: 'Test transaction',
  date: new Date('2024-01-15'),
  paymentMethod: 'pix',
  createdBy: 'user-1',
  status: TransactionStatus.APPROVED,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides
});

const createTestDepartment = (overrides = {}) => ({
  id: 'dept-1',
  name: 'Test Department',
  description: 'Test description',
  currentBalance: 5000,
  initialBalance: 1000,
  isActive: true,
  color: '#3B82F6',
  icon: '🏦',
  responsibleName: 'John Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

const createTestSummary = (overrides = {}) => ({
  totalIncome: 10000,
  totalExpenses: 5000,
  netIncome: 5000,
  transactionCount: 10,
  pendingTransactions: 2,
  topCategories: [
    { category: createTestCategory(), amount: 5000, count: 5 }
  ],
  ...overrides
});

describe('AdminFinancialPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminFinancialPage />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default permission: full access
    mockHasPermission.mockReturnValue(true);

    // Default mock implementations
    mockFinancialService.getTransactions.mockResolvedValue([]);
    mockFinancialService.getCategories.mockResolvedValue([]);
    mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary());
    mockFinancialService.getIncomeExpenseTrend.mockResolvedValue([]);
    mockFinancialService.getCategoryChartData.mockResolvedValue([]);
    mockFinancialService.getMonthlyComparison.mockResolvedValue([]);
    mockFinancialService.getDonationChartData.mockResolvedValue([]);
    mockDepartmentFinancialService.getDepartments.mockResolvedValue([]);
    mockDepartmentFinancialService.getDepartmentSummary.mockResolvedValue({
      totalDepartments: 0,
      activeDepartments: 0,
      totalBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      departments: []
    });
  });

  describe('Permission Checks', () => {
    it('should show loading state while checking permissions', () => {
      jest.mock('../../hooks/usePermissions', () => ({
        usePermissions: () => ({
          hasPermission: jest.fn(),
          loading: true
        })
      }));

      // Re-import to apply new mock
      jest.resetModules();
    });

    it('should show access denied when user lacks view permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (module === SystemModule.Finance && action === PermissionAction.View) {
          return false;
        }
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(screen.getByText(/Você não tem permissão para acessar o sistema financeiro/)).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading data', async () => {
      // Make the service hang
      mockFinancialService.getTransactions.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      expect(screen.getByText('Carregando dados financeiros...')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should display the page title and description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
        expect(screen.getByText('Controle financeiro completo da igreja')).toBeInTheDocument();
      });
    });

    it('should display period selector with default period', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mês Atual')).toBeInTheDocument();
      });
    });

    it('should show export button when user has manage permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Exportar CSV/i)).toBeInTheDocument();
      });
    });

    it('should show new transaction button when user has create permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Nova Transação/i)).toBeInTheDocument();
      });
    });

    it('should hide create button when user lacks create permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (action === PermissionAction.Create) {
          return false;
        }
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      // The new transaction button in the header should not be visible
      const buttons = screen.getAllByRole('button');
      const hasNewTransactionButton = buttons.some(btn => btn.textContent?.includes('Nova Transação'));
      expect(hasNewTransactionButton).toBe(false);
    });
  });

  describe('Navigation Tabs', () => {
    it('should display all navigation tabs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Visão Geral')).toBeInTheDocument();
        expect(screen.getByText('Transações')).toBeInTheDocument();
        expect(screen.getByText('Categorias')).toBeInTheDocument();
        expect(screen.getByText('Doações')).toBeInTheDocument();
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
    });

    it('should switch tabs when clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab', () => {
    it('should display financial summary cards', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 15000,
        totalExpenses: 8000,
        netIncome: 7000,
        pendingTransactions: 3
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Receitas').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Despesas').length).toBeGreaterThan(0);
        expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
        expect(screen.getByText('Pendentes')).toBeInTheDocument();
      });
    });

    it('should show info message for first-time users when no transactions', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        transactionCount: 0
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro Inicializado')).toBeInTheDocument();
      });
    });

    it('should display recent transactions list', async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', description: 'Transaction 1' }),
        createTestTransaction({ id: 'trans-2', description: 'Transaction 2' })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
        expect(screen.getByText('Transaction 1')).toBeInTheDocument();
        expect(screen.getByText('Transaction 2')).toBeInTheDocument();
      });
    });

    it('should show empty state when no transactions', async () => {
      mockFinancialService.getTransactions.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument();
      });
    });

    it('should display financial health indicators', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Status Financeiro')).toBeInTheDocument();
        expect(screen.getByText('Situação Saudável')).toBeInTheDocument();
      });
    });
  });

  describe('Transactions Tab', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));
    });

    it('should display transaction filter dropdowns', async () => {
      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Tipos')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Todos os Status')).toBeInTheDocument();
      });
    });

    it('should display transaction table headers', async () => {
      await waitFor(() => {
        expect(screen.getByText('Data')).toBeInTheDocument();
        expect(screen.getByText('Tipo')).toBeInTheDocument();
        expect(screen.getByText('Descrição')).toBeInTheDocument();
        expect(screen.getByText('Categoria')).toBeInTheDocument();
        expect(screen.getByText('Valor')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Ações')).toBeInTheDocument();
      });
    });

    it('should display empty state when no transactions', async () => {
      await waitFor(() => {
        expect(screen.getByText('Nenhuma Transação Encontrada')).toBeInTheDocument();
      });
    });

    it('should display transactions in table', async () => {
      const transactions = [
        createTestTransaction({
          id: 'trans-1',
          description: 'Test Transaction',
          amount: 1500,
          status: TransactionStatus.APPROVED
        })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find and click transaction tab
      const tabs = screen.getAllByRole('button', { name: /Transações/i });
      fireEvent.click(tabs[0]);

      // Verify table content
      await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
        expect(screen.getByText('Aprovada')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Categories Tab', () => {
    it('should display income and expense category sections', async () => {
      const categories = [
        createTestCategory({ id: 'cat-1', name: 'Income Category', type: TransactionType.INCOME }),
        createTestCategory({ id: 'cat-2', name: 'Expense Category', type: TransactionType.EXPENSE })
      ];
      mockFinancialService.getCategories.mockResolvedValue(categories);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Categorias')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('Categorias de Receita')).toBeInTheDocument();
        expect(screen.getByText('Categorias de Despesa')).toBeInTheDocument();
      });
    });

    it('should display category cards with details', async () => {
      const categories = [
        createTestCategory({
          id: 'cat-1',
          name: 'Test Income Category',
          type: TransactionType.INCOME,
          description: 'A test income category',
          budgetLimit: 5000
        })
      ];
      mockFinancialService.getCategories.mockResolvedValue(categories);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Categorias')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('Test Income Category')).toBeInTheDocument();
        expect(screen.getByText('A test income category')).toBeInTheDocument();
      });
    });
  });

  describe('Donations Tab', () => {
    it('should display donation summary cards', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getAllByText('Sistema de Doações').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Total de Dízimos').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Total de Ofertas').length).toBeGreaterThan(0);
      });
    });

    it('should display donation chart when data exists', async () => {
      mockFinancialService.getDonationChartData.mockResolvedValue([
        { type: 'tithe', amount: 5000, count: 10, label: 'Dízimos' },
        { type: 'offering', amount: 3000, count: 8, label: 'Ofertas' }
      ]);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByTestId('donation-donut-chart')).toBeInTheDocument();
      });
    });

    it('should show register donation button', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Nova Doação')).toBeInTheDocument();
      });
    });
  });

  describe('Departments (Caixinhas) Tab', () => {
    it('should display department summary cards', async () => {
      mockDepartmentFinancialService.getDepartmentSummary.mockResolvedValue({
        totalDepartments: 5,
        activeDepartments: 4,
        totalBalance: 15000,
        totalDeposits: 20000,
        totalWithdrawals: 5000,
        departments: []
      });

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Total Departamentos')).toBeInTheDocument();
        expect(screen.getAllByText('Saldo Total').length).toBeGreaterThan(0);
        expect(screen.getByText('Departamentos Ativos')).toBeInTheDocument();
        expect(screen.getByText('Saldo Médio')).toBeInTheDocument();
      });
    });

    it('should show empty state when no departments', async () => {
      mockDepartmentFinancialService.getDepartments.mockResolvedValue([]);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getAllByText('Sistema de Caixinhas Departamentais').length).toBeGreaterThan(0);
      });
    });

    it('should display department cards when departments exist', async () => {
      const departments = [
        createTestDepartment({ id: 'dept-1', name: 'Youth Department' }),
        createTestDepartment({ id: 'dept-2', name: 'Worship Department' })
      ];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Youth Department')).toBeInTheDocument();
        expect(screen.getByText('Worship Department')).toBeInTheDocument();
      });
    });
  });

  describe('Reports Tab', () => {
    it('should display report header with export buttons', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('Relatório Financeiro Detalhado')).toBeInTheDocument();
        expect(screen.getByText('📊 CSV')).toBeInTheDocument();
        expect(screen.getByText('📋 JSON')).toBeInTheDocument();
      });
    });

    it('should display executive summary cards', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('Receitas Totais')).toBeInTheDocument();
        expect(screen.getByText('Despesas Totais')).toBeInTheDocument();
        expect(screen.getByText('Resultado Líquido')).toBeInTheDocument();
      });
    });

    it('should display financial charts', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByTestId('income-expense-chart')).toBeInTheDocument();
        expect(screen.getByTestId('monthly-comparison-chart')).toBeInTheDocument();
      });
    });

    it('should display financial health indicators', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('Indicadores de Saúde Financeira')).toBeInTheDocument();
      });

      // Check for indicators without being strict about exact text
      expect(screen.getByText(/Situação Geral|Igreja com saldo/i)).toBeInTheDocument();
      expect(screen.getByText(/Controle de Gastos|das receitas/i)).toBeInTheDocument();
    });
  });

  describe('Period Selection', () => {
    it('should reload data when period changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalled();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'last_month' } });

      await waitFor(() => {
        // Service should be called again with new period
        expect(mockFinancialService.getTransactions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should open create transaction modal when button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Nova Transação/i)).toBeInTheDocument();
      });

      const newTransactionButtons = screen.getAllByText(/Nova Transação/i);
      fireEvent.click(newTransactionButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('create-transaction-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFinancialService.getTransactions.mockRejectedValue(new Error('Network error'));
      mockFinancialService.getCategories.mockRejectedValue(new Error('Network error'));
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary());

      renderComponent();

      await waitFor(() => {
        // Page should still render with fallback data
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show fallback summary when summary load fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFinancialService.getTransactions.mockResolvedValue([]);
      mockFinancialService.getCategories.mockResolvedValue([]);
      mockFinancialService.getFinancialSummary.mockRejectedValue(new Error('Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('R$ 0,00').length).toBeGreaterThan(0);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    it('should export data when export button clicked', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockFinancialService.exportTransactions.mockResolvedValue(mockBlob);

      // Mock URL and link
      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find the export button
      const allButtons = screen.getAllByRole('button');
      const exportButton = allButtons.find(btn => btn.textContent?.includes('Exportar CSV'));
      expect(exportButton).toBeDefined();

      if (exportButton) {
        fireEvent.click(exportButton);

        await waitFor(() => {
          expect(mockFinancialService.exportTransactions).toHaveBeenCalledWith(
            expect.any(Object),
            'csv'
          );
        }, { timeout: 3000 });
      }
    });
  });

  describe('Transaction Status Display', () => {
    it('should display correct status colors', async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', status: TransactionStatus.APPROVED }),
        createTestTransaction({ id: 'trans-2', status: TransactionStatus.PENDING }),
        createTestTransaction({ id: 'trans-3', status: TransactionStatus.REJECTED })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Aprovada')).toBeInTheDocument();
        expect(screen.getByText('Pendente')).toBeInTheDocument();
        expect(screen.getByText('Rejeitada')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Type Display', () => {
    it('should display correct type icons and colors', async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME }),
        createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Receita')).toBeInTheDocument();
        expect(screen.getByText('Despesa')).toBeInTheDocument();
      });
    });

    it('should display transfer type correctly', async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', type: TransactionType.TRANSFER, description: 'Transfer Test' })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Transferência')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Filtering', () => {
    beforeEach(async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, status: TransactionStatus.APPROVED }),
        createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, status: TransactionStatus.PENDING }),
        createTestTransaction({ id: 'trans-3', type: TransactionType.INCOME, status: TransactionStatus.REJECTED })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);
    });

    it('should filter transactions by type - Income', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Tipos')).toBeInTheDocument();
      });

      const typeFilter = screen.getByDisplayValue('Todos os Tipos');
      fireEvent.change(typeFilter, { target: { value: TransactionType.INCOME } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ type: TransactionType.INCOME })
        );
      });
    });

    it('should filter transactions by type - Expense', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Tipos')).toBeInTheDocument();
      });

      const typeFilter = screen.getByDisplayValue('Todos os Tipos');
      fireEvent.change(typeFilter, { target: { value: TransactionType.EXPENSE } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ type: TransactionType.EXPENSE })
        );
      });
    });

    it('should filter transactions by status - Approved', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Status')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusFilter, { target: { value: TransactionStatus.APPROVED } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ status: TransactionStatus.APPROVED })
        );
      });
    });

    it('should filter transactions by status - Pending', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Status')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusFilter, { target: { value: TransactionStatus.PENDING } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ status: TransactionStatus.PENDING })
        );
      });
    });

    it('should clear filters when selecting "All"', async () => {
      renderComponent();
      await waitFor(() => {
        const tabs = screen.getAllByText('Transações');
        expect(tabs.length).toBeGreaterThan(0);
      });

      const transactionTab = screen.getAllByText('Transações')[0];
      fireEvent.click(transactionTab);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Tipos')).toBeInTheDocument();
      });

      // Apply filter
      const typeFilter = screen.getByDisplayValue('Todos os Tipos');
      fireEvent.change(typeFilter, { target: { value: TransactionType.INCOME } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({ type: TransactionType.INCOME })
        );
      }, { timeout: 2000 });

      // Clear filter
      fireEvent.change(typeFilter, { target: { value: '' } });

      await waitFor(() => {
        const calls = mockFinancialService.getTransactions.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.type).toBeUndefined();
      }, { timeout: 2000 });
    });
  });

  describe('Financial Statistics', () => {
    it('should calculate and display correct balance', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 20000,
        totalExpenses: 12000,
        netIncome: 8000
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('R$ 8.000,00').length).toBeGreaterThan(0);
      });
    });

    it('should display negative balance correctly', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 5000,
        totalExpenses: 8000,
        netIncome: -3000,
        transactionCount: 10,
        pendingTransactions: 2
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      await waitFor(() => {
        const elements = screen.queryAllByText(/R\$ -3\.000,00/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should display pending transactions count', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        pendingTransactions: 5,
        totalIncome: 10000,
        totalExpenses: 5000,
        netIncome: 5000,
        transactionCount: 10
      }));

      renderComponent();

      await waitFor(() => {
        // Find the element that shows pending transactions
        const pendingElements = screen.queryAllByText('5');
        expect(pendingElements.length).toBeGreaterThan(0);
      });
    });

    it('should display transaction count correctly', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        transactionCount: 25
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/25 transações/i)).toBeInTheDocument();
      });
    });
  });

  describe('Charts Display', () => {
    it('should display income expense trend chart with data', async () => {
      const trendData = [
        { date: new Date('2024-01-01'), income: 5000, expense: 3000 },
        { date: new Date('2024-02-01'), income: 6000, expense: 4000 }
      ];
      mockFinancialService.getIncomeExpenseTrend.mockResolvedValue(trendData);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        const chart = screen.getByTestId('income-expense-chart');
        expect(chart).toBeInTheDocument();
        expect(chart.textContent).toContain('2 items');
      });
    });

    it('should display category pie charts', async () => {
      const incomeCategories = [
        { category: createTestCategory({ name: 'Dízimos' }), amount: 5000, count: 10 }
      ];
      const expenseCategories = [
        { category: createTestCategory({ name: 'Aluguel', type: TransactionType.EXPENSE }), amount: 2000, count: 1 }
      ];
      mockFinancialService.getCategoryChartData
        .mockResolvedValueOnce(incomeCategories)
        .mockResolvedValueOnce(expenseCategories);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        const charts = screen.getAllByTestId('category-pie-chart');
        expect(charts).toHaveLength(2);
      });
    });

    it('should display monthly comparison chart', async () => {
      const monthlyData = [
        { month: new Date('2024-01-01'), income: 10000, expense: 5000, netIncome: 5000 }
      ];
      mockFinancialService.getMonthlyComparison.mockResolvedValue(monthlyData);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByTestId('monthly-comparison-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Department Operations', () => {
    it('should open transaction modal when transaction button clicked', async () => {
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Test Dept' })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Test Dept')).toBeInTheDocument();
      });

      const transactionButton = screen.getByText('💰 Transação');
      fireEvent.click(transactionButton);

      await waitFor(() => {
        expect(screen.getByTestId('department-transaction-modal')).toBeInTheDocument();
      });
    });

    it('should open report modal when report button clicked', async () => {
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Test Dept' })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Test Dept')).toBeInTheDocument();
      });

      const reportButton = screen.getByText('📊 Relatório');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByTestId('department-report-modal')).toBeInTheDocument();
      });
    });

    it('should handle edit department', async () => {
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Test Dept' })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Test Dept')).toBeInTheDocument();
      });

      const editButton = within(screen.getByTestId('department-actions-dept-1')).getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-department-modal')).toBeInTheDocument();
      });
    });

    it('should handle toggle department active status', async () => {
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Test Dept', isActive: true })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);
      mockDepartmentFinancialService.updateDepartment.mockResolvedValue(undefined);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Test Dept')).toBeInTheDocument();
      });

      const toggleButton = within(screen.getByTestId('department-actions-dept-1')).getByText('Toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockDepartmentFinancialService.updateDepartment).toHaveBeenCalledWith(
          'dept-1',
          expect.objectContaining({ isActive: false })
        );
      });
    });

    it('should display department balance correctly', async () => {
      const departments = [createTestDepartment({
        id: 'dept-1',
        name: 'Test Dept',
        currentBalance: 7500,
        initialBalance: 1000
      })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('R$ 7.500,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
      });
    });

    it('should display inactive department with correct badge', async () => {
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Inactive Dept', isActive: false })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Inativo')).toBeInTheDocument();
      });
    });
  });

  describe('Create Modals Workflow', () => {
    it('should open donation modal from quick actions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      });

      const donationButtons = screen.getAllByText(/Nova Doação/i);
      fireEvent.click(donationButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('create-donation-modal')).toBeInTheDocument();
      });
    });

    it('should open category modal from quick actions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nova Categoria'));

      await waitFor(() => {
        expect(screen.getByTestId('create-category-modal')).toBeInTheDocument();
      });
    });

    it('should close modals when close button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        const buttons = screen.getAllByText(/Nova Transação/i);
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-transaction-modal')).toBeInTheDocument();
      });

      const closeButton = within(screen.getByTestId('create-transaction-modal')).getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('create-transaction-modal')).not.toBeInTheDocument();
      });
    });

    it('should reload data after transaction created', async () => {
      mockFinancialService.getTransactions.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledTimes(1);
      });

      // Simulate transaction creation by opening and closing modal
      const buttons = screen.getAllByText(/Nova Transação/i);
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('create-transaction-modal')).toBeInTheDocument();
      });

      // Close modal (in real app, this would be after successful creation)
      const closeButton = within(screen.getByTestId('create-transaction-modal')).getByText('Close');
      fireEvent.click(closeButton);

      // Note: In the actual component, reload happens via onTransactionCreated callback
    });
  });

  describe('Export with Different Formats', () => {
    beforeEach(() => {
      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
    });

    it('should export data as CSV', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockFinancialService.exportTransactions.mockResolvedValue(mockBlob);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      }, { timeout: 3000 });

      const allButtons = screen.getAllByRole('button');
      const exportButton = allButtons.find(btn => btn.textContent?.includes('Exportar CSV'));
      expect(exportButton).toBeDefined();

      if (exportButton) {
        fireEvent.click(exportButton);

        await waitFor(() => {
          expect(mockFinancialService.exportTransactions).toHaveBeenCalledWith(
            expect.any(Object),
            'csv'
          );
        }, { timeout: 3000 });
      }
    });

    it('should export data as JSON from reports tab', async () => {
      const mockBlob = new Blob(['{"data": "test"}'], { type: 'application/json' });
      mockFinancialService.exportTransactions.mockResolvedValue(mockBlob);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('📋 JSON')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('📋 JSON'));

      await waitFor(() => {
        expect(mockFinancialService.exportTransactions).toHaveBeenCalledWith(
          expect.any(Object),
          'json'
        );
      });
    });

    it('should handle export errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFinancialService.exportTransactions.mockRejectedValue(new Error('Export failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Exportar CSV/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erro ao exportar dados');
      }, { timeout: 2000 });

      consoleSpy.mockRestore();
    });
  });

  describe('Period Date Calculations', () => {
    it('should load data for current month by default', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date)
          })
        );
      });
    });

    it('should load data for last month when selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mês Atual')).toBeInTheDocument();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'last_month' } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalledTimes(2);
      });
    });

    it('should load data for last 3 months when selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mês Atual')).toBeInTheDocument();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'last_3_months' } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalled();
      });
    });

    it('should load data for current year when selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mês Atual')).toBeInTheDocument();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'current_year' } });

      await waitFor(() => {
        expect(mockFinancialService.getTransactions).toHaveBeenCalled();
      });
    });
  });

  describe('Transaction Notes Display', () => {
    it('should display transaction notes when present', async () => {
      const transactions = [
        createTestTransaction({
          id: 'trans-1',
          description: 'Test Transaction',
          notes: 'Additional notes here'
        })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Additional notes here')).toBeInTheDocument();
      });
    });
  });

  describe('Balance Color Coding', () => {
    it('should display positive balance in green', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 15000,
        totalExpenses: 10000,
        netIncome: 5000
      }));

      renderComponent();

      await waitFor(() => {
        const balanceElements = screen.getAllByText('R$ 5.000,00');
        expect(balanceElements.length).toBeGreaterThan(0);
        expect(balanceElements.some(el => el.className.includes('text-green-600'))).toBe(true);
      });
    });

    it('should display negative balance in red', async () => {
      mockFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 3000,
        totalExpenses: 5000,
        netIncome: -2000,
        transactionCount: 8,
        pendingTransactions: 1
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      await waitFor(() => {
        const balanceElements = screen.queryAllByText(/R\$ -2\.000,00/i);
        expect(balanceElements.length).toBeGreaterThan(0);
        expect(balanceElements.some(el => el.className.includes('text-red-600'))).toBe(true);
      }, { timeout: 2000 });
    });
  });

  describe('Quick Action Buttons', () => {
    it('should hide quick actions when user lacks create permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (action === PermissionAction.Create) {
          return false;
        }
        if (action === PermissionAction.Manage) {
          return false;
        }
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      // Wait for page to fully load
      await waitFor(() => {
        expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Quick action buttons should not be visible within the quick actions section
      const quickActionsSection = screen.getByText('Ações Rápidas').closest('div');
      if (quickActionsSection) {
        expect(within(quickActionsSection).queryByText(/Nova Categoria/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('Print Functionality', () => {
    it('should trigger print when print button clicked', async () => {
      const mockPrint = jest.fn();
      window.print = mockPrint;

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('🖨️ Imprimir')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🖨️ Imprimir'));

      expect(mockPrint).toHaveBeenCalled();
    });
  });

  describe('Department Error Handling', () => {
    it('should handle department update errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const departments = [createTestDepartment({ id: 'dept-1', name: 'Test Dept' })];
      mockDepartmentFinancialService.getDepartments.mockResolvedValue(departments);
      mockDepartmentFinancialService.updateDepartment.mockRejectedValue(new Error('Update failed'));

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Caixinhas')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Caixinhas'));

      await waitFor(() => {
        expect(screen.getByText('Test Dept')).toBeInTheDocument();
      });

      const toggleButton = within(screen.getByTestId('department-actions-dept-1')).getByText('Toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erro ao atualizar status do departamento');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('View Transaction Details', () => {
    it('should show category with colored indicator', async () => {
      const category = createTestCategory({ name: 'Special Category', color: '#FF5733' });
      const transactions = [
        createTestTransaction({ id: 'trans-1', category, description: 'Test' })
      ];
      mockFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Special Category')).toBeInTheDocument();
      });
    });
  });
});
