import React from 'react';
import {
  TransactionType,
  TransactionStatus,
  FinancialEntity
} from '@modules/financial/church-finance/domain/entities/Financial';
import { Pagination } from '../../../components/common/Pagination';
import type { FinancialTabProps } from './types';
export const FinancialTransactionsTab: React.FC<FinancialTabProps> = (props) => {
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
                          Comece registrando receitas e despesas da igreja.
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <span className="mr-2">➕</span>
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

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalTransactions}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              itemLabel="transações"
            />

            {/* Loading overlay for page changes */}
            {loadingTransactions && !loading && (
              <div className="px-6 py-3 text-center text-sm text-gray-500">
                Carregando transações...
              </div>
            )}
          </div>
  );
};
