import React from 'react';
import {
  FinancialEntity
} from '@modules/financial/church-finance/domain/entities/Financial';
import type { FinancialTabProps } from './types';
export const FinancialOverviewTab: React.FC<FinancialTabProps> = (props) => {
  const {
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
    handleEditTransaction,

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
  } = props;

  return (
          <div className="space-y-6">
            {/* Info Message for First Time Users */}
            {summary.transactionCount === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-xl">ℹ️</span>
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
                    <p className="text-white text-opacity-80">Gerencie as finanças da igreja de forma eficiente</p>
                  </div>
                  <div className="flex space-x-3">
                    {canCreate && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <span className="mr-2">➕</span>
                        Nova Transação
                      </button>
                    )}
                    {canCreate && (
                      <button
                        onClick={() => setShowDonationModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <span className="mr-2">➕</span>
                        Nova Doação
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                      >
                        <span className="mr-2">➕</span>
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

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Doações</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {FinancialEntity.formatCurrency(
                          chartData.donationData.reduce((sum, d) => sum + d.amount, 0)
                        )}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {chartData.donationData.reduce((sum, d) => sum + d.count, 0)} doações
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl">🎁</div>
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
  );
};
