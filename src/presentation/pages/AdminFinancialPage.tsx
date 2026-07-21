// Presentation Page - Admin Financial
// Main financial management dashboard for church administrators

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { format as formatDate, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Transaction,
  FinancialCategory,
  TransactionType,
  TransactionStatus,
  FinancialEntity
} from '@modules/financial/church-finance/domain/entities/Financial';
import {
  financialService,
  FinancialSummary,
  TransactionFilters
} from '@modules/financial/church-finance/application/services/FinancialService';
import {
  Department
} from '@modules/church-management/departments/domain/entities/Department';
import {
  departmentFinancialService
} from '@modules/financial/department-finance/application/services/DepartmentFinancialService';
import { CreateTransactionModal } from '../components/CreateTransactionModal';
import { CreateDonationModal } from '../components/CreateDonationModal';
import { CreateCategoryModal } from '../components/CreateCategoryModal';
import { CreateDepartmentModal } from '../components/CreateDepartmentModal';
import { DepartmentTransactionModal } from '../components/DepartmentTransactionModal';
import { DepartmentReportModal } from '../components/DepartmentReportModal';
import { DepartmentHistoryModal } from '../components/DepartmentHistoryModal';
import PageShell from '../components/common/PageShell';
import {
  FinancialOverviewTab,
  FinancialTransactionsTab,
  FinancialCategoriesTab,
  FinancialDonationsTab,
  FinancialDepartmentsTab,
  FinancialReportsTab,
} from './financial/tabs';
import type { FinancialTabProps } from './financial/tabs/types';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

export const AdminFinancialPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canView = hasPermission(SystemModule.Finance, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.Finance, PermissionAction.Create);
  const canUpdate = hasPermission(SystemModule.Finance, PermissionAction.Update);
  const canDelete = hasPermission(SystemModule.Finance, PermissionAction.Delete);
  const canManage = hasPermission(SystemModule.Finance, PermissionAction.Manage);

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { confirm } = useConfirmDialog();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<any>(null);
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [showDepartmentTransactionModal, setShowDepartmentTransactionModal] = useState(false);
  const [showDepartmentReportModal, setShowDepartmentReportModal] = useState(false);
  const [showDepartmentHistoryModal, setShowDepartmentHistoryModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Chart data states
  const [chartData, setChartData] = useState({
    incomeExpenseTrend: [] as { date: Date; income: number; expense: number }[],
    incomeCategories: [] as { category: FinancialCategory; amount: number; count: number }[],
    expenseCategories: [] as { category: FinancialCategory; amount: number; count: number }[],
    monthlyComparison: [] as { month: Date; income: number; expense: number; netIncome: number }[],
    donationData: [] as { type: any; amount: number; count: number; label: string }[],
    memberFidelity: { contributingMembers: 0, totalActiveMembers: 0, percentage: 0 },
    trendPeriod: 'monthly' as 'daily' | 'weekly' | 'monthly'
  });

  const periods = [
    { value: 'current_month', label: 'Mês Atual' },
    { value: 'last_month', label: 'Mês Passado' },
    { value: 'last_3_months', label: 'Últimos 3 Meses' },
    { value: 'current_year', label: 'Ano Atual' },
    { value: 'custom', label: 'Período Personalizado' }
  ];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'transactions', label: 'Transações', icon: '💳' },
    { id: 'categories', label: 'Categorias', icon: '🏷️' },
    { id: 'donations', label: 'Doações', icon: '🎁' },
    { id: 'departments', label: 'Caixinhas', icon: '🏦' },
    { id: 'reports', label: 'Relatórios', icon: '📈' }
  ];

  useEffect(() => {
    if (selectedPeriod === 'custom' && (!customStartDate || !customEndDate)) return;
    setCurrentPage(1);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, filters, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedTab === 'departments') {
      loadDepartmentData();
    }
  }, [selectedTab]);

  const getPeriodDates = (period: string): { startDate: Date; endDate: Date } => {
    const now = new Date();
    
    switch (period) {
      case 'current_month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'last_3_months':
        return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
      case 'current_year':
        return { startDate: new Date(now.getFullYear(), 0, 1), endDate: new Date(now.getFullYear(), 11, 31) };
      case 'custom':
        if (customStartDate && customEndDate) {
          const [sy, sm, sd] = customStartDate.split('-').map(Number);
          const [ey, em, ed] = customEndDate.split('-').map(Number);
          return { startDate: new Date(sy, sm - 1, sd, 0, 0, 0), endDate: new Date(ey, em - 1, ed, 23, 59, 59) };
        }
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  };

  const loadTransactionsPage = async (page?: number) => {
    setLoadingTransactions(true);
    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod);
      const targetPage = page ?? currentPage;
      const result = await financialService.getTransactionsPaginated(
        { ...filters, startDate, endDate },
        targetPage,
        itemsPerPage
      );
      setTransactions(result.data);
      setTotalTransactions(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading transactions page:', error);
      setTransactions([]);
      setTotalTransactions(0);
      setTotalPages(0);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Reload transactions when page or page size changes (not on initial load)
  useEffect(() => {
    if (!loading) {
      loadTransactionsPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod);

      // Load paginated transactions and categories in parallel
      const [paginatedResult, categoriesData] = await Promise.all([
        financialService.getTransactionsPaginated(
          { ...filters, startDate, endDate },
          1,
          itemsPerPage
        ).catch(err => {
          console.error('Error loading transactions:', err);
          return { data: [] as Transaction[], total: 0, page: 1, pageSize: itemsPerPage, totalPages: 0 };
        }),
        financialService.getCategories().catch(err => {
          console.error('Error loading categories:', err);
          return [];
        })
      ]);

      // Load summary separately with fallback
      let summaryData;
      try {
        summaryData = await financialService.getFinancialSummary(startDate, endDate);
      } catch (error) {
        console.error('Error loading summary:', error);
        summaryData = {
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          transactionCount: paginatedResult.total,
          pendingTransactions: 0,
          topCategories: []
        };
      }

      setTransactions(paginatedResult.data);
      setTotalTransactions(paginatedResult.total);
      setTotalPages(paginatedResult.totalPages);
      setCategories(categoriesData);
      setSummary(summaryData);

      // Load chart data
      await loadChartData(startDate, endDate);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setTransactions([]);
      setTotalTransactions(0);
      setTotalPages(0);
      setCategories([]);
      setSummary({
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        pendingTransactions: 0,
        topCategories: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionCreated = () => {
    loadData(); // Reload data after transaction is created
    loggingService.logDatabase('info', 'Financial transaction created',
      'New transaction created via financial page', currentUser as any);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowCreateModal(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    const ok = await confirm({
      title: 'Excluir Transação',
      message: `Tem certeza que deseja excluir a transação "${transaction.description}" no valor de ${FinancialEntity.formatCurrency(transaction.amount)}?`,
      variant: 'danger',
      confirmText: 'Excluir',
    });
    if (!ok) return;
    try {
      await financialService.deleteTransaction(transaction.id);
      toast.success('Transação excluída com sucesso');
      loadData();
      loggingService.logDatabase('warning', 'Financial transaction deleted',
        `Transaction "${transaction.description}" (ID: ${transaction.id}) deleted`, currentUser as any);
    } catch (error) {
      toast.error('Erro ao excluir transação');
      loggingService.logDatabase('error', 'Failed to delete transaction',
        `Error: ${error}`, currentUser as any);
    }
  };

  const handleDonationCreated = () => {
    loadData(); // Reload data after donation is created
    loggingService.logDatabase('info', 'Donation created',
      'New donation created via financial page', currentUser as any);
  };

  const handleEditCategory = (category: FinancialCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category: FinancialCategory) => {
    const ok = await confirm({
      title: 'Excluir Categoria',
      message: `Tem certeza que deseja excluir a categoria "${category.name}"? As transações já registradas com ela não serão alteradas.`,
      variant: 'danger',
      confirmText: 'Excluir',
    });
    if (!ok) return;
    try {
      await financialService.deleteCategory(category.id);
      toast.success('Categoria excluída com sucesso');
      loadData();
      loggingService.logDatabase('warning', 'Financial category deleted',
        `Category "${category.name}" (ID: ${category.id}) deleted`, currentUser as any);
    } catch (error) {
      toast.error('Erro ao excluir categoria');
      loggingService.logDatabase('error', 'Failed to delete category',
        `Category "${category.name}" (ID: ${category.id}), Error: ${error}`, currentUser as any);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const loadChartData = async (startDate: Date, endDate: Date) => {
    try {
      // Auto-select trend period: daily for <= 2 months, weekly for <= 6 months, monthly otherwise
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const trendPeriod: 'daily' | 'weekly' | 'monthly' = diffDays <= 62 ? 'daily' : diffDays <= 180 ? 'weekly' : 'monthly';

      const [trendData, incomeCatData, expenseCatData, monthlyData, donationChartData, fidelityData] = await Promise.all([
        financialService.getIncomeExpenseTrend(startDate, endDate, trendPeriod).catch(() => []),
        financialService.getCategoryChartData(startDate, endDate, TransactionType.INCOME).catch(() => []),
        financialService.getCategoryChartData(startDate, endDate, TransactionType.EXPENSE).catch(() => []),
        financialService.getMonthlyComparison(startDate, endDate).catch(() => []),
        financialService.getDonationChartData(startDate, endDate).catch(() => []),
        financialService.getMemberFidelityData(startDate, endDate).catch(() => ({ contributingMembers: 0, totalActiveMembers: 0, percentage: 0 }))
      ]);

      setChartData({
        incomeExpenseTrend: trendData,
        incomeCategories: incomeCatData,
        expenseCategories: expenseCatData,
        monthlyComparison: monthlyData,
        donationData: donationChartData,
        memberFidelity: fidelityData,
        trendPeriod
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadDepartmentData = async () => {
    try {
      setLoading(true);
      const [departmentsData, summaryData] = await Promise.all([
        departmentFinancialService.getDepartments({ isActive: true }).catch(() => []),
        departmentFinancialService.getDepartmentSummary().catch(() => ({
          totalDepartments: 0,
          activeDepartments: 0,
          totalBalance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          departments: []
        }))
      ]);

      setDepartments(departmentsData);
      setDepartmentSummary(summaryData);
    } catch (error) {
      console.error('Error loading department data:', error);
      setDepartments([]);
      setDepartmentSummary({
        totalDepartments: 0,
        activeDepartments: 0,
        totalBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        departments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransactionModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentTransactionModal(true);
  };

  const handleOpenReportModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentReportModal(true);
  };

  const handleOpenHistoryModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentHistoryModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setShowCreateDepartmentModal(true);
  };

  const handleToggleActiveDepartment = async (department: Department) => {
    try {
      await departmentFinancialService.updateDepartment(department.id, {
        isActive: !department.isActive,
        updatedAt: new Date()
      });
      loadDepartmentData();
      await loggingService.logDatabase('info', 'Department status changed',
        `Department: "${department.name}", ID: ${department.id}, New status: ${!department.isActive ? 'Active' : 'Inactive'}`, currentUser as any);
    } catch (error) {
      console.error('Error toggling department status:', error);
      await loggingService.logDatabase('error', 'Failed to change department status',
        `Department: "${department.name}", ID: ${department.id}, Error: ${error}`, currentUser as any);
      toast.error('Erro ao atualizar status do departamento');
    }
  };

  const handleDepartmentModalClose = () => {
    setShowCreateDepartmentModal(false);
    setEditingDepartment(null);
  };

  const handleExportData = async (format: 'xlsx' | 'json') => {
    try {
      setLoading(true);
      const { startDate, endDate } = getPeriodDates(selectedPeriod);
      const blob = await financialService.exportTransactions(
        { ...filters, startDate, endDate },
        format
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes-${format}-${formatDate(new Date(), 'yyyy-MM-dd')}.${format}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loggingService.logUserAction('Financial data exported',
        `Format: ${format.toUpperCase()}, Period: ${selectedPeriod}`, currentUser as any);

      toast.success(`Dados exportados em ${format.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      await loggingService.logDatabase('error', 'Failed to export financial data',
        `Format: ${format.toUpperCase()}, Period: ${selectedPeriod}, Error: ${error}`, currentUser as any);
      toast.error('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED: return 'bg-green-100 text-green-800';
      case TransactionStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.REJECTED: return 'bg-red-100 text-red-800';
      case TransactionStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED: return 'Aprovada';
      case TransactionStatus.PENDING: return 'Pendente';
      case TransactionStatus.REJECTED: return 'Rejeitada';
      case TransactionStatus.CANCELLED: return 'Cancelada';
      default: return status;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME: return 'text-green-600';
      case TransactionType.EXPENSE: return 'text-red-600';
      case TransactionType.TRANSFER: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME: return '⬆️';
      case TransactionType.EXPENSE: return '⬇️';
      case TransactionType.TRANSFER: return '🔄';
      default: return '💱';
    }
  };

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check view permission
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar o sistema financeiro.</p>
        </div>
      </div>
    );
  }

  const financialTabProps: FinancialTabProps = {
    summary,
    transactions,
    categories,
    filters,
    setFilters,
    setSelectedTab,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
    setShowCreateModal,
    setShowDonationModal,
    setShowCategoryModal,
    setEditingCategory,
    setEditingTransaction,
    openCategoryMenuId,
    setOpenCategoryMenuId,
    handleDeleteTransaction,
    handleDeleteCategory,
    handleEditCategory,
    handleEditTransaction,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalTransactions,
    totalPages,
    loadingTransactions,
    loadTransactionsPage,
    departments,
    departmentSummary,
    setShowCreateDepartmentModal,
    setShowDepartmentTransactionModal,
    setShowDepartmentReportModal,
    setShowDepartmentHistoryModal,
    setSelectedDepartment,
    setEditingDepartment,
    selectedDepartment,
    editingDepartment,
    handleOpenTransactionModal,
    handleOpenReportModal,
    handleOpenHistoryModal,
    handleEditDepartment,
    handleToggleActiveDepartment,
    chartData,
    selectedPeriod,
    getPeriodDates,
    handleExportData,
    formatDate,
    settings,
    loading,
    getTypeIcon,
    getTypeColor,
    getStatusColor,
    getStatusText,
  };

  return (
    <PageShell
      title="Sistema Financeiro"
      subtitle="Controle financeiro completo da igreja"
      actions={
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            disabled={loading}
            className="px-3 py-2 sm:px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          {selectedPeriod === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Data inicial"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Data final"
              />
            </>
          )}
          {canManage && (
            <button
              onClick={() => handleExportData('xlsx')}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 sm:px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              📊 <span className="hidden sm:inline ml-1">Exportar Excel</span>
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <span className="sm:mr-2">➕</span>
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden ml-1">Nova</span>
            </button>
          )}
        </div>
      }
    >
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white shadow rounded-lg p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados financeiros...</p>
            </div>
          </div>
        )}

        {/* Tabs (extraídas de AdminFinancialPage) */}
        {!loading && selectedTab === 'overview' && summary && (
          <FinancialOverviewTab {...financialTabProps} />
        )}
        {!loading && selectedTab === 'transactions' && (
          <FinancialTransactionsTab {...financialTabProps} />
        )}
        {!loading && selectedTab === 'categories' && (
          <FinancialCategoriesTab {...financialTabProps} />
        )}
        {!loading && selectedTab === 'donations' && (
          <FinancialDonationsTab {...financialTabProps} />
        )}
        {!loading && selectedTab === 'departments' && (
          <FinancialDepartmentsTab {...financialTabProps} />
        )}
        {!loading && selectedTab === 'reports' && (
          <FinancialReportsTab {...financialTabProps} />
        )}

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingTransaction(null); }}
        onTransactionCreated={() => { handleTransactionCreated(); setEditingTransaction(null); }}
        currentUser={currentUser}
        editTransaction={editingTransaction}
      />
      
      {/* Create Donation Modal */}
      <CreateDonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onDonationCreated={handleDonationCreated}
        currentUser={currentUser}
      />

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={handleCloseCategoryModal}
        onCategoryCreated={loadData}
        currentUser={currentUser}
        category={editingCategory}
      />

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateDepartmentModal}
        onClose={handleDepartmentModalClose}
        onDepartmentCreated={loadDepartmentData}
        currentUser={currentUser}
        editDepartment={editingDepartment}
      />

      {/* Department Transaction Modal */}
      {selectedDepartment && (
        <DepartmentTransactionModal
          isOpen={showDepartmentTransactionModal}
          onClose={() => {
            setShowDepartmentTransactionModal(false);
            setSelectedDepartment(null);
          }}
          onTransactionCreated={loadDepartmentData}
          department={selectedDepartment}
          currentUser={currentUser}
        />
      )}

      {/* Department Report Modal */}
      {selectedDepartment && (
        <DepartmentReportModal
          isOpen={showDepartmentReportModal}
          onClose={() => {
            setShowDepartmentReportModal(false);
            setSelectedDepartment(null);
          }}
          department={selectedDepartment}
        />
      )}

      {/* Department History Modal */}
      {selectedDepartment && (
        <DepartmentHistoryModal
          isOpen={showDepartmentHistoryModal}
          onClose={() => {
            setShowDepartmentHistoryModal(false);
            setSelectedDepartment(null);
          }}
          department={selectedDepartment}
        />
      )}
    </PageShell>
  );
};
