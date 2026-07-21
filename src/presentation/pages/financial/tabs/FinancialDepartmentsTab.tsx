import React from 'react';
import { DepartmentEntity } from '@modules/church-management/departments/domain/entities/Department';
import { DepartmentActionsMenu } from '../../../components/DepartmentActionsMenu';
import type { FinancialTabProps } from './types';
export const FinancialDepartmentsTab: React.FC<FinancialTabProps> = (props) => {
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
            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-xl">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Sistema de Caixinhas Departamentais
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      As caixinhas são fundos independentes para cada departamento da igreja.
                      As transações das caixinhas <strong>não afetam o caixa geral mensal</strong> da igreja,
                      mas você pode visualizar os saldos e movimentações a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-3xl">🏦</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Departamentos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {departmentSummary?.totalDepartments || 0}
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
                      <div className="text-3xl">💰</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Saldo Total</dt>
                        <dd className="text-lg font-medium text-green-600">
                          {DepartmentEntity.formatCurrency(departmentSummary?.totalBalance || 0)}
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
                      <div className="text-3xl">📊</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Departamentos Ativos</dt>
                        <dd className="text-lg font-medium text-blue-600">
                          {departmentSummary?.activeDepartments || 0}
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
                      <div className="text-3xl">💳</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Saldo Médio</dt>
                        <dd className="text-lg font-medium text-purple-600">
                          {DepartmentEntity.formatCurrency(
                            departmentSummary?.activeDepartments > 0
                              ? (departmentSummary?.totalBalance || 0) / departmentSummary.activeDepartments
                              : 0
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department List or Empty State */}
            {departments.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Caixinhas dos Departamentos</h3>
                  {canCreate && (
                    <button
                      onClick={() => setShowCreateDepartmentModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <span className="mr-2">➕</span>
                      Novo Departamento
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏦</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Sistema de Caixinhas Departamentais</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-2xl mx-auto">
                    Crie caixinhas independentes para cada departamento da igreja. Cada departamento pode
                    gerenciar suas próprias receitas e despesas sem afetar o caixa geral da igreja.
                  </p>

                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <div className="text-3xl mb-3">💰</div>
                        <h3 className="font-medium text-blue-900 mb-2">Controle Independente</h3>
                        <p className="text-sm text-blue-700">
                          Cada departamento tem seu próprio saldo e histórico de transações completamente isolado do caixa geral.
                        </p>
                      </div>

                      <div className="bg-green-50 p-6 rounded-lg">
                        <div className="text-3xl mb-3">📊</div>
                        <h3 className="font-medium text-green-900 mb-2">Relatórios Mensais</h3>
                        <p className="text-sm text-green-700">
                          Visualize o saldo mensal de cada departamento sem misturar com as finanças gerais da igreja.
                        </p>
                      </div>

                      <div className="bg-purple-50 p-6 rounded-lg">
                        <div className="text-3xl mb-3">🔄</div>
                        <h3 className="font-medium text-purple-900 mb-2">Transferências Entre Caixinhas</h3>
                        <p className="text-sm text-purple-700">
                          Transfira recursos entre departamentos com controle total e histórico completo.
                        </p>
                      </div>

                      <div className="bg-orange-50 p-6 rounded-lg">
                        <div className="text-3xl mb-3">👤</div>
                        <h3 className="font-medium text-orange-900 mb-2">Responsável Definido</h3>
                        <p className="text-sm text-orange-700">
                          Atribua um responsável para cada departamento gerenciar sua caixinha.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <p>✓ Cada departamento tem saldo e transações independentes</p>
                      <p>✓ Não afeta o caixa geral mensal da igreja</p>
                      <p>✓ Registro de depósitos, retiradas e transferências</p>
                      <p>✓ Visualização de saldo mensal por departamento</p>
                      <p>✓ Aprovação de transações para controle</p>
                    </div>

                    {canCreate && (
                      <button
                        onClick={() => setShowCreateDepartmentModal(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <span className="mr-2">➕</span>
                        Criar Primeiro Departamento
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            ) : (
            /* Department List View */
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Caixinhas dos Departamentos</h3>
                  <div className="flex space-x-2">
                    {canCreate && (
                      <button
                        onClick={() => setShowCreateDepartmentModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <span className="mr-2">➕</span>
                        Novo Departamento
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: department.color ? `${department.color}20` : '#E5E7EB' }}
                          >
                            {department.icon || '🏦'}
                          </div>
                          <div className="ml-3">
                            <h4 className="text-lg font-semibold text-gray-900">{department.name}</h4>
                            {department.responsibleName && (
                              <p className="text-xs text-gray-500">👤 {department.responsibleName}</p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            department.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {department.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {department.description && (
                        <p className="text-sm text-gray-600 mb-4">{department.description}</p>
                      )}

                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Saldo Atual</span>
                          <span className={`text-xl font-bold ${
                            department.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {DepartmentEntity.formatCurrency(department.currentBalance)}
                          </span>
                        </div>
                        {department.initialBalance !== undefined && department.initialBalance > 0 && (
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">Saldo Inicial</span>
                            <span className="text-xs text-gray-600">
                              {DepartmentEntity.formatCurrency(department.initialBalance)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenTransactionModal(department)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          💰 Transação
                        </button>
                        <button
                          onClick={() => handleOpenReportModal(department)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          📊 Relatório
                        </button>
                        <DepartmentActionsMenu
                          department={department}
                          onEdit={handleEditDepartment}
                          onToggleActive={handleToggleActiveDepartment}
                          onOpenHistory={handleOpenHistoryModal}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
  );
};
