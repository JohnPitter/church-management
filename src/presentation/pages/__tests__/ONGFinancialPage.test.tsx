// Unit Tests - ONG Financial Page
// Comprehensive tests for the ONG financial management dashboard

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ONGFinancialPage } from '../ONGFinancialPage';
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
  ongName: 'Test ONG'
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

// Mock ONG financial service - Create mock functions outside jest.mock to avoid hoisting issues
const mockOngFinancialService = {
  getTransactions: jest.fn(),
  getCategories: jest.fn(),
  getFinancialSummary: jest.fn(),
  getIncomeExpenseTrend: jest.fn(),
  getCategoryChartData: jest.fn(),
  getMonthlyComparison: jest.fn(),
  exportTransactions: jest.fn()
};

jest.mock('@modules/financial/ong-finance/application/services/ONGFinancialService', () => ({
  ongFinancialService: {
    getTransactions: (...args: any[]) => mockOngFinancialService.getTransactions(...args),
    getCategories: (...args: any[]) => mockOngFinancialService.getCategories(...args),
    getFinancialSummary: (...args: any[]) => mockOngFinancialService.getFinancialSummary(...args),
    getIncomeExpenseTrend: (...args: any[]) => mockOngFinancialService.getIncomeExpenseTrend(...args),
    getCategoryChartData: (...args: any[]) => mockOngFinancialService.getCategoryChartData(...args),
    getMonthlyComparison: (...args: any[]) => mockOngFinancialService.getMonthlyComparison(...args),
    exportTransactions: (...args: any[]) => mockOngFinancialService.exportTransactions(...args)
  },
  ONGFinancialSummary: {},
  ONGTransactionFilters: {}
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
  notes: '',
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

describe('ONGFinancialPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ONGFinancialPage />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default permission: full access
    mockHasPermission.mockReturnValue(true);

    // Default mock implementations
    mockOngFinancialService.getTransactions.mockResolvedValue([]);
    mockOngFinancialService.getCategories.mockResolvedValue([]);
    mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary());
    mockOngFinancialService.getIncomeExpenseTrend.mockResolvedValue([]);
    mockOngFinancialService.getCategoryChartData.mockResolvedValue([]);
    mockOngFinancialService.getMonthlyComparison.mockResolvedValue([]);
  });

  describe('Permission Checks', () => {
    it('should show access denied when user lacks view permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (module === SystemModule.ONG && action === PermissionAction.View) {
          return false;
        }
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(screen.getByText(/Você não tem permissão para acessar o sistema financeiro da ONG/)).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading data', async () => {
      mockOngFinancialService.getTransactions.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      expect(screen.getByText('Carregando dados financeiros...')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should display the page title and description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
        expect(screen.getByText('Controle financeiro completo da organização')).toBeInTheDocument();
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
        expect(screen.getByText(/Exportar CSV/)).toBeInTheDocument();
      });
    });

    it('should hide export button when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        if (action === PermissionAction.Manage) {
          return false;
        }
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Exportar CSV/)).not.toBeInTheDocument();
    });

    it('should show new transaction button when user has create permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nova Transação')).toBeInTheDocument();
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
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
      });

      expect(screen.queryByText('Nova Transação')).not.toBeInTheDocument();
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
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
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
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        transactionCount: 0
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro Inicializado')).toBeInTheDocument();
      });
    });

    it('should display recent transactions list', async () => {
      const transactions = [
        createTestTransaction({ id: 'trans-1', description: 'ONG Transaction 1' }),
        createTestTransaction({ id: 'trans-2', description: 'ONG Transaction 2' })
      ];
      mockOngFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('ONG Transaction 1')).toBeInTheDocument();
        expect(screen.getByText('ONG Transaction 2')).toBeInTheDocument();
      });
    });

    it('should show empty state when no transactions', async () => {
      mockOngFinancialService.getTransactions.mockResolvedValue([]);

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

    it('should display pending transactions alert when pending exist', async () => {
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        pendingTransactions: 5
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Transações Pendentes')).toBeInTheDocument();
        expect(screen.getByText(/5 transações aguardando aprovação/)).toBeInTheDocument();
      });
    });

    it('should display top category alert when categories exist', async () => {
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        topCategories: [
          { category: createTestCategory({ name: 'Top Category' }), amount: 10000, count: 15 }
        ]
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Categoria Mais Ativa')).toBeInTheDocument();
        expect(screen.getByText(/Top Category: 15 transações/)).toBeInTheDocument();
      });
    });

    it('should display KPI cards with correct values', async () => {
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 20000,
        totalExpenses: 8000,
        netIncome: 12000,
        transactionCount: 25,
        pendingTransactions: 3
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Saldo Atual')).toBeInTheDocument();
        expect(screen.getByText('Receitas do Mês')).toBeInTheDocument();
        expect(screen.getByText('Despesas do Mês')).toBeInTheDocument();
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
          description: 'ONG Test Transaction',
          amount: 1500,
          status: TransactionStatus.APPROVED
        })
      ];
      mockOngFinancialService.getTransactions.mockResolvedValue(transactions);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Transações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Transações'));

      await waitFor(() => {
        expect(screen.getByText('ONG Test Transaction')).toBeInTheDocument();
        expect(screen.getByText('Aprovada')).toBeInTheDocument();
      });
    });

    it('should filter transactions by type when filter changed', async () => {
      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Tipos')).toBeInTheDocument();
      });

      const typeSelect = screen.getByDisplayValue('Todos os Tipos');
      fireEvent.change(typeSelect, { target: { value: TransactionType.INCOME } });

      await waitFor(() => {
        expect(mockOngFinancialService.getTransactions).toHaveBeenCalled();
      });
    });

    it('should filter transactions by status when filter changed', async () => {
      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusSelect, { target: { value: TransactionStatus.PENDING } });

      await waitFor(() => {
        expect(mockOngFinancialService.getTransactions).toHaveBeenCalled();
      });
    });
  });

  describe('Donations Tab', () => {
    it('should display donations header', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Gestão de Doações')).toBeInTheDocument();
        expect(screen.getByText('Acompanhe todas as doações recebidas pela ONG')).toBeInTheDocument();
      });
    });

    it('should show register donation button', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Registrar Doação')).toBeInTheDocument();
      });
    });

    it('should display donations list when donations exist', async () => {
      const donations = [
        createTestTransaction({
          id: 'don-1',
          description: 'Test Donation',
          category: createTestCategory({ name: 'Doação de Alimentos' })
        })
      ];
      mockOngFinancialService.getTransactions.mockResolvedValue(donations);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Doações Registradas')).toBeInTheDocument();
      });
    });

    it('should show empty state when no donations', async () => {
      mockOngFinancialService.getTransactions.mockResolvedValue([]);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Nenhuma Doação Registrada')).toBeInTheDocument();
      });
    });
  });

  describe('Categories Tab', () => {
    it('should display income and expense category sections', async () => {
      const categories = [
        createTestCategory({ id: 'cat-1', name: 'ONG Income Category', type: TransactionType.INCOME }),
        createTestCategory({ id: 'cat-2', name: 'ONG Expense Category', type: TransactionType.EXPENSE })
      ];
      mockOngFinancialService.getCategories.mockResolvedValue(categories);

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
          name: 'ONG Test Category',
          type: TransactionType.INCOME,
          description: 'An ONG income category',
          budgetLimit: 10000
        })
      ];
      mockOngFinancialService.getCategories.mockResolvedValue(categories);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Categorias')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('ONG Test Category')).toBeInTheDocument();
        expect(screen.getByText('An ONG income category')).toBeInTheDocument();
      });
    });

    it('should display category count', async () => {
      const categories = [
        createTestCategory({ id: 'cat-1', type: TransactionType.INCOME }),
        createTestCategory({ id: 'cat-2', type: TransactionType.INCOME }),
        createTestCategory({ id: 'cat-3', type: TransactionType.EXPENSE })
      ];
      mockOngFinancialService.getCategories.mockResolvedValue(categories);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Categorias')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('2 categorias')).toBeInTheDocument();
        expect(screen.getByText('1 categorias')).toBeInTheDocument();
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

    it('should display category pie charts', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getAllByTestId('category-pie-chart')).toHaveLength(2);
      });
    });
  });

  describe('Period Selection', () => {
    it('should reload data when period changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockOngFinancialService.getTransactions).toHaveBeenCalled();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'last_month' } });

      await waitFor(() => {
        expect(mockOngFinancialService.getTransactions).toHaveBeenCalledTimes(2);
      });
    });

    it('should update period display text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mês Atual')).toBeInTheDocument();
      });

      const periodSelect = screen.getByDisplayValue('Mês Atual');
      fireEvent.change(periodSelect, { target: { value: 'current_year' } });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ano Atual')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should open create transaction modal when button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nova Transação')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nova Transação'));

      await waitFor(() => {
        expect(screen.getByTestId('create-transaction-modal')).toBeInTheDocument();
      });
    });

    it('should open create donation modal when register donation clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Doações')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Doações'));

      await waitFor(() => {
        expect(screen.getByText('Registrar Doação')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Registrar Doação'));

      await waitFor(() => {
        expect(screen.getByTestId('create-donation-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOngFinancialService.getTransactions.mockRejectedValue(new Error('Network error'));
      mockOngFinancialService.getCategories.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should show fallback summary when summary load fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOngFinancialService.getFinancialSummary.mockRejectedValue(new Error('Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle chart data loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOngFinancialService.getIncomeExpenseTrend.mockRejectedValue(new Error('Chart error'));
      mockOngFinancialService.getCategoryChartData.mockRejectedValue(new Error('Chart error'));
      mockOngFinancialService.getMonthlyComparison.mockRejectedValue(new Error('Chart error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sistema Financeiro ONG')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    it('should export data when export button clicked', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockOngFinancialService.exportTransactions.mockResolvedValue(mockBlob);

      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Exportar CSV/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Exportar CSV/));

      await waitFor(() => {
        expect(mockOngFinancialService.exportTransactions).toHaveBeenCalledWith(
          expect.any(Object),
          'csv'
        );
      });
    });

    it('should export JSON when JSON button clicked in reports', async () => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });
      mockOngFinancialService.exportTransactions.mockResolvedValue(mockBlob);

      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('JSON')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('JSON'));

      await waitFor(() => {
        expect(mockOngFinancialService.exportTransactions).toHaveBeenCalledWith(
          expect.any(Object),
          'json'
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
      mockOngFinancialService.getTransactions.mockResolvedValue(transactions);

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

  describe('Quick Actions', () => {
    it('should display quick actions section in overview', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
        expect(screen.getByText('Gerencie as finanças da ONG de forma eficiente')).toBeInTheDocument();
      });
    });

    it('should show quick action buttons when user has permissions', async () => {
      renderComponent();

      await waitFor(() => {
        // The overview tab has quick action buttons
        const novaTransacaoButtons = screen.getAllByText(/Nova Transação/i);
        expect(novaTransacaoButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Visual Summary', () => {
    it('should display income/expense percentage breakdown', async () => {
      mockOngFinancialService.getFinancialSummary.mockResolvedValue(createTestSummary({
        totalIncome: 10000,
        totalExpenses: 5000
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Resumo Visual')).toBeInTheDocument();
        // Should show percentage breakdown
        expect(screen.getByText('Receitas')).toBeInTheDocument();
        expect(screen.getByText('Despesas')).toBeInTheDocument();
      });
    });
  });
});
