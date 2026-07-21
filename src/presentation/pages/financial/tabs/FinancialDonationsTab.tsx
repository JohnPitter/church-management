import React from 'react';
import {
  FinancialEntity
} from '@modules/financial/church-finance/domain/entities/Financial';
import { DonationDonutChart } from '../../../components/charts/DonationDonutChart';
import type { FinancialTabProps } from './types';
export const FinancialDonationsTab: React.FC<FinancialTabProps> = (props) => {
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
                <h3 className="text-lg font-medium text-gray-900">Sistema de Doações</h3>
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <span className="mr-2">➕</span>
                  Nova Doação
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Donation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">R$ 0,00</div>
                  <div className="text-sm text-blue-800">Total de Dízimos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
                  <div className="text-sm text-green-800">Total de Ofertas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-purple-800">Doadores Ativos</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">R$ 0,00</div>
                  <div className="text-sm text-orange-800">Média por Doação</div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Donation Chart */}
                {chartData.donationData.length > 0 ? (
                  <DonationDonutChart data={chartData.donationData} />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎁</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Sistema de Doações</h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Gerencie dízimos, ofertas e doações da igreja. As doações serão integradas automaticamente
                      com o sistema financeiro como transações de receita.
                    </p>

                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-blue-50 p-6 rounded-lg">
                          <div className="text-3xl mb-3">🙏</div>
                          <h3 className="font-medium text-blue-900 mb-2">Dízimos</h3>
                          <p className="text-sm text-blue-700">
                            Registre dízimos dos membros com controle automático de 10% da renda.
                          </p>
                        </div>

                        <div className="bg-green-50 p-6 rounded-lg">
                          <div className="text-3xl mb-3">💝</div>
                          <h3 className="font-medium text-green-900 mb-2">Ofertas</h3>
                          <p className="text-sm text-green-700">
                            Gerencie ofertas voluntárias e campanhas especiais da igreja.
                          </p>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-lg">
                          <div className="text-3xl mb-3">🌍</div>
                          <h3 className="font-medium text-purple-900 mb-2">Missões</h3>
                          <p className="text-sm text-purple-700">
                            Controle doações destinadas ao apoio missionário.
                          </p>
                        </div>

                        <div className="bg-orange-50 p-6 rounded-lg">
                          <div className="text-3xl mb-3">🏗️</div>
                          <h3 className="font-medium text-orange-900 mb-2">Obras</h3>
                          <p className="text-sm text-orange-700">
                            Registre contribuições para construção e reformas.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <p>✓ Registro de dízimos e ofertas com controle por membro</p>
                        <p>✓ Opção de doações anônimas quando necessário</p>
                        <p>✓ Geração automática de recibos de doação</p>
                        <p>✓ Integração total com o sistema financeiro</p>
                        <p>✓ Relatórios detalhados de contribuições</p>
                      </div>

                      <button
                        onClick={() => setShowDonationModal(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <span className="mr-2">➕</span>
                        Registrar Primeira Doação
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Cards for Donations */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {FinancialEntity.formatCurrency(
                        chartData.donationData
                          .filter(d => d.type === 'tithe')
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </div>
                    <div className="text-sm text-blue-800">Total de Dízimos</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {FinancialEntity.formatCurrency(
                        chartData.donationData
                          .filter(d => ['offering', 'special_offering'].includes(d.type))
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </div>
                    <div className="text-sm text-green-800">Total de Ofertas</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.donationData.reduce((sum, d) => sum + d.count, 0)}
                    </div>
                    <div className="text-sm text-purple-800">Total de Doações</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {chartData.donationData.length > 0 ? FinancialEntity.formatCurrency(
                        chartData.donationData.reduce((sum, d) => sum + d.amount, 0) /
                        chartData.donationData.reduce((sum, d) => sum + d.count, 0)
                      ) : 'R$ 0,00'}
                    </div>
                    <div className="text-sm text-orange-800">Média por Doação</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};
