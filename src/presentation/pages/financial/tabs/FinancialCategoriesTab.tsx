import React from 'react';
import {
  TransactionType
} from '@modules/financial/church-finance/domain/entities/Financial';
import type { FinancialTabProps } from './types';
export const FinancialCategoriesTab: React.FC<FinancialTabProps> = (props) => {
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
            {openCategoryMenuId && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenCategoryMenuId(null)}
              />
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
                          <h4 className="flex-1 font-medium text-gray-900">{category.name}</h4>
                          {(canManage || canDelete) && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenCategoryMenuId(openCategoryMenuId === category.id ? null : category.id)}
                                className={`p-1.5 rounded-lg ${
                                  openCategoryMenuId === category.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Ações"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              {openCategoryMenuId === category.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                                  <div className="py-1">
                                    {canManage && (
                                      <button
                                        onClick={() => { setOpenCategoryMenuId(null); handleEditCategory(category); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        ✏️ Editar
                                      </button>
                                    )}
                                    {(canDelete || canManage) && (
                                      <button
                                        onClick={() => { setOpenCategoryMenuId(null); handleDeleteCategory(category); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        🗑️ Excluir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
                          <h4 className="flex-1 font-medium text-gray-900">{category.name}</h4>
                          {(canManage || canDelete) && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenCategoryMenuId(openCategoryMenuId === category.id ? null : category.id)}
                                className={`p-1.5 rounded-lg ${
                                  openCategoryMenuId === category.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Ações"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              {openCategoryMenuId === category.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                                  <div className="py-1">
                                    {canManage && (
                                      <button
                                        onClick={() => { setOpenCategoryMenuId(null); handleEditCategory(category); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        ✏️ Editar
                                      </button>
                                    )}
                                    {(canDelete || canManage) && (
                                      <button
                                        onClick={() => { setOpenCategoryMenuId(null); handleDeleteCategory(category); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        🗑️ Excluir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
  );
};
