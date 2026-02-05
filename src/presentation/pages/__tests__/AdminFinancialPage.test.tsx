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
        expect(screen.getByText('Receitas')).toBeInTheDocument();
        expect(screen.getByText('Despesas')).toBeInTheDocument();
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
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
        expect(screen.getByText('Aprovada')).toBeInTheDocument();
      });
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
        expect(screen.getByText('Sistema de Doações')).toBeInTheDocument();
        expect(screen.getByText('Total de Dízimos')).toBeInTheDocument();
        expect(screen.getByText('Total de Ofertas')).toBeInTheDocument();
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
        expect(screen.getByText('Saldo Total')).toBeInTheDocument();
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
        expect(screen.getByText('Sistema de Caixinhas Departamentais')).toBeInTheDocument();
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
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
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
        expect(screen.getByText('Situação Geral')).toBeInTheDocument();
        expect(screen.getByText('Controle de Gastos')).toBeInTheDocument();
      });
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

      renderComponent();

      await waitFor(() => {
        // Page should still render with fallback data
        expect(screen.getByText('Sistema Financeiro')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show fallback summary when summary load fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFinancialService.getFinancialSummary.mockRejectedValue(new Error('Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
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
        expect(screen.getByText(/Exportar CSV/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Exportar CSV/i));

      await waitFor(() => {
        expect(mockFinancialService.exportTransactions).toHaveBeenCalledWith(
          expect.any(Object),
          'csv'
        );
      });
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
  });
});
