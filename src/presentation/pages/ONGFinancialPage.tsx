// Presentation Page - ONG Financial
// Financial management dashboard for ONG administrators

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
  ongFinancialService,
  ONGFinancialSummary as FinancialSummary,
  ONGTransactionFilters as TransactionFilters
} from '@modules/financial/ong-finance/application/services/ONGFinancialService';
import { CreateTransactionModal } from '../components/CreateTransactionModal';
import { CreateDonationModal } from '../components/CreateDonationModal';
import { CreateCategoryModal } from '../components/CreateCategoryModal';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { MonthlyComparisonChart } from '../components/charts/MonthlyComparisonChart';
import { DonationDonutChart } from '../components/charts/DonationDonutChart';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

export const ONGFinancialPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks (uses ONG module permissions)
  const canView = hasPermission(SystemModule.ONG, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.ONG, PermissionAction.Create);
  const canUpdate = hasPermission(SystemModule.ONG, PermissionAction.Update);
  const canDelete = hasPermission(SystemModule.ONG, PermissionAction.Delete);
  const canManage = hasPermission(SystemModule.ONG, PermissionAction.Manage);

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { confirm } = useConfirmDialog();

  // Chart data states
  const [chartData, setChartData] = useState({
    incomeExpenseTrend: [] as { date: Date; income: number; expense: number }[],
    incomeCategories: [] as { category: FinancialCategory; amount: number; count: number }[],
    expenseCategories: [] as { category: FinancialCategory; amount: number; count: number }[],
    monthlyComparison: [] as { month: Date; income: number; expense: number; netIncome: number }[],
    donationData: [] as { type: any; amount: number; count: number; label: string }[]
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
    { id: 'reports', label: 'Relatórios', icon: '📈' }
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, filters]);

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
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod);

      // Load data with individual error handling
      const [transactionsData, categoriesData] = await Promise.all([
        ongFinancialService.getTransactions({ ...filters, startDate, endDate }).catch(err => {
          console.error('Error loading ONG transactions:', err);
          return [];
        }),
        ongFinancialService.getCategories().catch(err => {
          console.error('Error loading ONG categories:', err);
          return [];
        })
      ]);

      // Load summary separately with fallback
      let summaryData;
      try {
        summaryData = await ongFinancialService.getFinancialSummary(startDate, endDate);
      } catch (error) {
        console.error('Error loading summary:', error);
        // Create fallback summary
        summaryData = {
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          transactionCount: transactionsData.length,
          pendingTransactions: 0,
          topCategories: []
        };
      }

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setSummary(summaryData);

      // Load chart data
      await loadChartData(startDate, endDate);
    } catch (error) {
      console.error('Error loading financial data:', error);
      // Set fallback data instead of showing alert
      setTransactions([]);
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

  const handleTransactionCreated = async () => {
    await loggingService.logONG('info', 'ONG transaction created',
      `Type: transaction, Value: N/A`, currentUser as any);
    loadData(); // Reload data after transaction is created
  };

  const handleDonationCreated = async () => {
    await loggingService.logONG('info', 'ONG donation created',
      `Value: N/A`, currentUser as any);
    loadData(); // Reload data after donation is created
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
      await ongFinancialService.deleteTransaction(transaction.id);
      toast.success('Transação excluída com sucesso');
      loadData();
      await loggingService.logONG('warning', 'ONG transaction deleted',
        `Transaction "${transaction.description}" (ID: ${transaction.id}) deleted`, currentUser as any);
    } catch (error) {
      toast.error('Erro ao excluir transação');
      await loggingService.logONG('error', 'Failed to delete ONG transaction',
        `Error: ${error}`, currentUser as any);
    }
  };

  const loadChartData = async (startDate: Date, endDate: Date) => {
    try {
      const [trendData, incomeCatData, expenseCatData, monthlyData] = await Promise.all([
        ongFinancialService.getIncomeExpenseTrend(startDate, endDate, 'monthly').catch(() => []),
        ongFinancialService.getCategoryChartData(startDate, endDate, TransactionType.INCOME).catch(() => []),
        ongFinancialService.getCategoryChartData(startDate, endDate, TransactionType.EXPENSE).catch(() => []),
        ongFinancialService.getMonthlyComparison(startDate, endDate).catch(() => [])
      ]);

      setChartData({
        incomeExpenseTrend: trendData,
        incomeCategories: incomeCatData,
        expenseCategories: expenseCatData,
        monthlyComparison: monthlyData,
        donationData: [] // ONG donations data placeholder
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      setLoading(true);
      const { startDate, endDate } = getPeriodDates(selectedPeriod);
      const blob = await ongFinancialService.exportTransactions(
        { ...filters, startDate, endDate },
        format
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ong-transacoes-${format}-${formatDate(new Date(), 'yyyy-MM-dd')}.${format}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loggingService.logONG('info', 'ONG financial data exported',
        `Format: ${format.toUpperCase()}`, currentUser as any);
      toast.success(`Dados exportados em ${format.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      await loggingService.logONG('error', 'Failed to export ONG financial data',
        `Format: ${format.toUpperCase()}, Error: ${error}`, currentUser as any);
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
          <p className="text-gray-600">Você não tem permissão para acessar o sistema financeiro da ONG.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema Financeiro ONG</h1>
              <p className="mt-1 text-sm text-gray-600">
                Controle financeiro completo da organização
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              {canManage && (
                <button
                  onClick={() => handleExportData('csv')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  📊 Exportar CSV
                </button>
              )}
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nova Transação
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

        {/* Overview Tab */}
        {!loading && selectedTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Info Message for First Time Users */}
            {summary.transactionCount === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Sistema Financeiro Inicializado
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Bem-vindo ao sistema financeiro! Comece criando suas primeiras transações usando o botão "Nova Transação" no topo da página.
                        As categorias financeiras já estão pré-configuradas para você.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">💰</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Receitas</dt>
                        <dd className="text-lg font-medium text-green-600">
                          {FinancialEntity.formatCurrency(summary.totalIncome)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">💸</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Despesas</dt>
                        <dd className="text-lg font-medium text-red-600">
                          {FinancialEntity.formatCurrency(summary.totalExpenses)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">📈</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Saldo Líquido</dt>
                        <dd className={`text-lg font-medium ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {FinancialEntity.formatCurrency(summary.netIncome)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">⏳</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                        <dd className="text-lg font-medium text-yellow-600">
                          {summary.pendingTransactions}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Dashboard */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div
                className="rounded-lg p-6 text-white"
                style={{
                  background: `linear-gradient(to right, ${settings?.primaryColor || '#3B82F6'}, ${settings?.secondaryColor || '#8B5CF6'})`
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ações Rápidas</h3>
                    <p className="text-white text-opacity-80">Gerencie as finanças da ONG de forma eficiente</p>
                  </div>
                  <div className="flex space-x-3">
                    {canCreate && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nova Transação
                      </button>
                    )}
                    {canCreate && (
                      <button
                        onClick={() => setShowDonationModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nova Doação
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Nova Categoria
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                      <p className={`text-2xl font-bold ${
                        summary && summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {summary ? FinancialEntity.formatCurrency(summary.netIncome) : 'R$ 0,00'}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          summary && summary.netIncome >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {summary && summary.netIncome >= 0 ? '📈 Positivo' : '📉 Negativo'}
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary ? FinancialEntity.formatCurrency(summary.totalIncome) : 'R$ 0,00'}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {summary ? summary.transactionCount : 0} transações
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl">📈</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Despesas do Mês</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary ? FinancialEntity.formatCurrency(summary.totalExpenses) : 'R$ 0,00'}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {summary ? summary.pendingTransactions : 0} pendentes
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl">📉</div>
                  </div>
                </div>

              </div>

              {/* Recent Activity and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Transações Recentes</h3>
                  </div>
                  <div className="p-6">
                    {transactions.length > 0 ? (
                      <div className="space-y-4">
                        {transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-xs text-gray-500">{transaction.category.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {FinancialEntity.formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(transaction.date, 'dd/MM')}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setSelectedTab('transactions')}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Ver todas as transações →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-400 text-4xl mb-2">💳</div>
                        <p className="text-sm text-gray-500">Nenhuma transação encontrada</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Health & Alerts */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Status Financeiro</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Health Score */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="text-2xl">✅</div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">
                            Situação Saudável
                          </h4>
                          <p className="text-sm text-green-700">
                            {summary && summary.netIncome >= 0
                              ? 'Receitas superiores às despesas'
                              : 'Atenção: Despesas superiores às receitas'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pending Actions */}
                    {summary && summary.pendingTransactions > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="text-2xl">⏳</div>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-yellow-800">
                              Transações Pendentes
                            </h4>
                            <p className="text-sm text-yellow-700">
                              {summary.pendingTransactions} transações aguardando aprovação
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Category Alert */}
                    {summary && summary.topCategories.length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="text-2xl">📊</div>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">
                              Categoria Mais Ativa
                            </h4>
                            <p className="text-sm text-blue-700">
                              {summary.topCategories[0].category.name}: {summary.topCategories[0].count} transações
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Chart Preview */}
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Resumo Visual</h4>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {((summary?.totalIncome || 0) / ((summary?.totalIncome || 0) + (summary?.totalExpenses || 1)) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-green-800">Receitas</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-600">
                            {((summary?.totalExpenses || 0) / ((summary?.totalIncome || 1) + (summary?.totalExpenses || 0)) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-red-800">Despesas</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => setSelectedTab('reports')}
                          className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Ver análise detalhada →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {!loading && selectedTab === 'transactions' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Transações Recentes</h3>
                <div className="flex space-x-2">
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as TransactionType || undefined })}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value={TransactionType.INCOME}>Receitas</option>
                    <option value={TransactionType.EXPENSE}>Despesas</option>
                    <option value={TransactionType.TRANSFER}>Transferências</option>
                  </select>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as TransactionStatus || undefined })}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Todos os Status</option>
                    <option value={TransactionStatus.APPROVED}>Aprovadas</option>
                    <option value={TransactionStatus.PENDING}>Pendentes</option>
                    <option value={TransactionStatus.REJECTED}>Rejeitadas</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-4xl mb-4">💳</div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Transação Encontrada</h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Comece registrando receitas e despesas da ONG.
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Criar Primeira Transação
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date, 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getTypeIcon(transaction.type)}</span>
                          <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                            {transaction.type === TransactionType.INCOME ? 'Receita' :
                             transaction.type === TransactionType.EXPENSE ? 'Despesa' : 'Transferência'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.notes && (
                            <div className="text-gray-500 text-xs">{transaction.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: transaction.category.color }}
                          ></div>
                          <span className="text-sm text-gray-900">{transaction.category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={getTypeColor(transaction.type)}>
                          {transaction.type === TransactionType.EXPENSE ? '-' : '+'}
                          {FinancialEntity.formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(canUpdate || canManage) && (
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Editar
                          </button>
                        )}
                        {(canDelete || canManage) && (
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Donations Tab */}
        {!loading && selectedTab === 'donations' && (
          <div className="space-y-6">
            {/* Donations Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Gestão de Doações</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhe todas as doações recebidas pela ONG
                  </p>
                </div>
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Registrar Doação
                </button>
              </div>
            </div>

            {/* Donation Visualization */}
            {chartData.donationData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Doações por Tipo</h3>
                <DonationDonutChart data={chartData.donationData} />
              </div>
            )}

            {/* Donations List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Doações Registradas</h3>
              </div>
              <div className="p-6">
                {transactions.filter(t => t.category.name.includes('Doação')).length > 0 ? (
                  <div className="space-y-4">
                    {transactions
                      .filter(t => t.category.name.includes('Doação'))
                      .map((donation) => (
                        <div key={donation.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="text-2xl mr-3">🎁</span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{donation.description}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(donation.date, 'dd/MM/yyyy')}
                                  </p>
                                </div>
                              </div>
                              {donation.notes && (
                                <p className="text-sm text-gray-600 ml-11">{donation.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {FinancialEntity.formatCurrency(donation.amount)}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                                {getStatusText(donation.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎁</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Doação Registrada</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Comece registrando as doações recebidas pela ONG.
                    </p>
                    <button
                      onClick={() => setShowDonationModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Registrar Primeira Doação
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {!loading && selectedTab === 'categories' && (
          <div className="space-y-6">
            {/* Add Category Button */}
            {(canCreate || canManage) && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  + Nova Categoria
                </button>
              </div>
            )}

            {/* Income Categories */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Categorias de Receita</h3>
                  <span className="text-sm text-gray-500">
                    {categories.filter(c => c.type === TransactionType.INCOME).length} categorias
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories
                    .filter(category => category.type === TransactionType.INCOME)
                    .map(category => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            {category.icon}
                          </div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Receita
                          </span>
                          {category.budgetLimit && (
                            <span className="text-xs text-gray-500">
                              Orçamento: R$ {category.budgetLimit.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Categorias de Despesa</h3>
                  <span className="text-sm text-gray-500">
                    {categories.filter(c => c.type === TransactionType.EXPENSE).length} categorias
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories
                    .filter(category => category.type === TransactionType.EXPENSE)
                    .map(category => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            {category.icon}
                          </div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Despesa
                          </span>
                          {category.budgetLimit && (
                            <span className="text-xs text-gray-500">
                              Orçamento: R$ {category.budgetLimit.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Reports Tab */}
        {!loading && selectedTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Relatório Financeiro Detalhado</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Período: {getPeriodDates(selectedPeriod).startDate.toLocaleDateString()} - {getPeriodDates(selectedPeriod).endDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportData('csv')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    📊 CSV
                  </button>
                  <button
                    onClick={() => handleExportData('json')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    📋 JSON
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {summary ? FinancialEntity.formatCurrency(summary.totalIncome) : 'R$ 0,00'}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Receitas Totais</div>
                  <div className="text-xs text-green-600 mt-1">
                    {transactions.filter(t => t.type === 'income').length} transações
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {summary ? FinancialEntity.formatCurrency(summary.totalExpenses) : 'R$ 0,00'}
                  </div>
                  <div className="text-sm text-red-800 font-medium">Despesas Totais</div>
                  <div className="text-xs text-red-600 mt-1">
                    {transactions.filter(t => t.type === 'expense').length} transações
                  </div>
                </div>

                <div className={`text-center p-4 rounded-lg border ${
                  summary && summary.netIncome >= 0
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    summary && summary.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {summary ? FinancialEntity.formatCurrency(summary.netIncome) : 'R$ 0,00'}
                  </div>
                  <div className={`text-sm font-medium ${
                    summary && summary.netIncome >= 0 ? 'text-blue-800' : 'text-orange-800'
                  }`}>
                    Resultado Líquido
                  </div>
                  <div className={`text-xs mt-1 ${
                    summary && summary.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {summary && summary.netIncome >= 0 ? '✓ Positivo' : '⚠ Negativo'}
                  </div>
                </div>

              </div>
            </div>

            {/* Financial Analysis Charts */}
            <div className="space-y-8">
              {/* Trend Analysis */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Análise de Tendências</h3>
                <IncomeExpenseChart
                  data={chartData.incomeExpenseTrend}
                  period="monthly"
                />
              </div>

              {/* Monthly Performance */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Performance Mensal Comparativa</h3>
                <MonthlyComparisonChart data={chartData.monthlyComparison} />
              </div>

              {/* Category Deep Dive */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">🏷️ Análise Detalhada por Categoria</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryPieChart
                    data={chartData.incomeCategories}
                    title="Distribuição de Receitas"
                    type="income"
                  />
                  <CategoryPieChart
                    data={chartData.expenseCategories}
                    title="Distribuição de Despesas"
                    type="expense"
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingTransaction(null); }}
        onTransactionCreated={() => { handleTransactionCreated(); setEditingTransaction(null); }}
        currentUser={currentUser}
        service={ongFinancialService}
        editTransaction={editingTransaction}
      />

      {/* Create Donation Modal */}
      <CreateDonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onDonationCreated={handleDonationCreated}
        currentUser={currentUser}
        service={ongFinancialService}
      />

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={loadData}
        currentUser={currentUser}
        service={ongFinancialService}
      />
    </div>
  );
};

export default ONGFinancialPage;
