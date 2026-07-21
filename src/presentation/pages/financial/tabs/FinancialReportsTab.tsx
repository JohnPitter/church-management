import React from 'react';
import {
  Transaction,
  FinancialCategory,
  TransactionType,
  TransactionStatus,
  FinancialEntity
} from '@modules/financial/church-finance/domain/entities/Financial';
import type { FinancialSummary, TransactionFilters } from '@modules/financial/church-finance/application/services/FinancialService';
import {
  Department,
  DepartmentEntity
} from '@modules/church-management/departments/domain/entities/Department';
import { Pagination } from '../../../components/common/Pagination';
import { DepartmentActionsMenu } from '../../../components/DepartmentActionsMenu';
import { IncomeExpenseChart } from '../../../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../../../components/charts/CategoryPieChart';
import { MonthlyComparisonChart } from '../../../components/charts/MonthlyComparisonChart';
import { DonationDonutChart } from '../../../components/charts/DonationDonutChart';
import type { FinancialTabProps } from './types';

export const FinancialReportsTab: React.FC<FinancialTabProps> = (props) => {
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
                    onClick={() => handleExportData('xlsx')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    📊 Excel
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
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {FinancialEntity.formatCurrency(
                      chartData.donationData.reduce((sum, d) => sum + d.amount, 0)
                    )}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Doações</div>
                  <div className="text-xs text-purple-600 mt-1">
                    {chartData.donationData.reduce((sum, d) => sum + d.count, 0)} doações
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
                  period={chartData.trendPeriod}
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

              {/* Donations Analysis */}
              {chartData.donationData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎁 Análise de Doações e Contribuições</h3>
                  <DonationDonutChart data={chartData.donationData} />
                </div>
              )}

              {/* Detailed Category Breakdown */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Breakdown Detalhado por Categoria</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income Categories Table */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-medium text-gray-900">Receitas por Categoria</h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {chartData.incomeCategories.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: item.category.color }}
                              ></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.category.name}</p>
                                <p className="text-xs text-gray-500">{item.count} transações</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-green-600">
                                {FinancialEntity.formatCurrency(item.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((item.amount / (summary?.totalIncome || 1)) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expense Categories Table */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-medium text-gray-900">Despesas por Categoria</h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {chartData.expenseCategories.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: item.category.color }}
                              ></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.category.name}</p>
                                <p className="text-xs text-gray-500">{item.count} transações</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-red-600">
                                {FinancialEntity.formatCurrency(item.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((item.amount / (summary?.totalExpenses || 1)) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health Score */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">💡 Indicadores de Saúde Financeira</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {summary && summary.netIncome >= 0 ? '🟢' : '🔴'}
                    </div>
                    <h4 className="font-medium text-gray-900">Situação Geral</h4>
                    <p className="text-sm text-gray-600">
                      {summary && summary.netIncome >= 0 
                        ? 'Igreja com saldo positivo'
                        : 'Igreja com déficit - atenção necessária'
                      }
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {summary && (summary.totalExpenses / (summary.totalIncome || 1)) < 0.8 ? '🟢' : 
                       summary && (summary.totalExpenses / (summary.totalIncome || 1)) < 1 ? '🟡' : '🔴'}
                    </div>
                    <h4 className="font-medium text-gray-900">Controle de Gastos</h4>
                    <p className="text-sm text-gray-600">
                      {summary ? 
                        `${((summary.totalExpenses / (summary.totalIncome || 1)) * 100).toFixed(1)}% das receitas` :
                        '0% das receitas'
                      }
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {chartData.memberFidelity.percentage >= 50 ? '🟢' :
                       chartData.memberFidelity.percentage >= 25 ? '🟡' : '🔴'}
                    </div>
                    <h4 className="font-medium text-gray-900">Fidelidade dos Membros</h4>
                    <p className="text-sm text-gray-600">
                      {chartData.memberFidelity.contributingMembers} de {chartData.memberFidelity.totalActiveMembers} membros contribuíram ({chartData.memberFidelity.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};
