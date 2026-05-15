// Presentation Component - Department Report Modal
// Modal for viewing department transactions and generating reports

import React, { useState, useEffect } from 'react';
import {
  Department,
  DepartmentTransaction,
  DepartmentTransactionType,
  DepartmentEntity
} from '@modules/church-management/departments/domain/entities/Department';
import {
  DepartmentTransactionFilters,
  departmentFinancialService
} from '@modules/financial/department-finance/application/services/DepartmentFinancialService';
import { downloadBlob } from '../../utils/dateUtils';
import { exportRowsToXlsx, XlsxCellValue } from '../../utils/xlsxExport';

interface DepartmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
}

const REPORT_FILENAME_PREFIX = 'relatorio-caixinha';
const REPORT_SHEET_NAME = 'Relatorio';
const REPORT_COLUMN_WIDTHS = [14, 28, 36, 18, 16, 18, 34];
type DepartmentReportFilterType = 'all' | DepartmentTransactionType;

export const DepartmentReportModal: React.FC<DepartmentReportModalProps> = ({
  isOpen,
  onClose,
  department
}) => {
  const [transactions, setTransactions] = useState<DepartmentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterType, setFilterType] = useState<DepartmentReportFilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedMonth, filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const filters: DepartmentTransactionFilters = {
        departmentId: department.id,
        startDate,
        endDate
      };

      if (filterType !== 'all') {
        filters.type = filterType;
      }

      const data = await departmentFinancialService.getTransactions(filters, 1000);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatLongDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatMonth = (month: string) => {
    return new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const buildReportRows = (): XlsxCellValue[][] => {
    const totals = getTotals();
    const monthLabel = formatMonth(selectedMonth);
    const typeLabel = filterType === 'all' ? 'Todas' : DepartmentEntity.getTransactionTypeLabel(filterType);

    return [
      [`Relatório - ${department.name}`],
      ['Mês', monthLabel],
      ['Tipo', typeLabel],
      ['Saldo atual', DepartmentEntity.formatCurrency(department.currentBalance)],
      ['Gerado em', formatDateTime(new Date())],
      [],
      ['Resumo'],
      ['Total de entradas', DepartmentEntity.formatCurrency(totals.deposits)],
      ['Total de saídas', DepartmentEntity.formatCurrency(totals.withdrawals)],
      ['Saldo do período', DepartmentEntity.formatCurrency(totals.balance)],
      [],
      ['Data', 'Tipo', 'Descrição', 'Valor', 'Status', 'Recibo', 'Observações'],
      ...transactions.map(transaction => [
        formatDate(transaction.date),
        DepartmentEntity.getTransactionTypeLabel(transaction.type),
        transaction.description,
        DepartmentEntity.formatCurrency(transaction.amount),
        DepartmentEntity.getTransactionStatusLabel(transaction.status),
        transaction.receiptNumber || '',
        transaction.notes || ''
      ])
    ];
  };

  const exportReport = async () => {
    setExporting(true);
    const safeDepartmentName = department.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      const blob = await exportRowsToXlsx(buildReportRows(), {
        sheetName: REPORT_SHEET_NAME,
        columnWidths: REPORT_COLUMN_WIDTHS
      });

      downloadBlob(blob, `${REPORT_FILENAME_PREFIX}-${safeDepartmentName}-${selectedMonth}.xlsx`);
    } catch (error) {
      console.error('Error exporting department report:', error);
    } finally {
      setExporting(false);
    }
  };

  const getTotals = () => {
    const deposits = transactions
      .filter(t => t.type === DepartmentTransactionType.DEPOSIT || t.type === DepartmentTransactionType.TRANSFER_IN)
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter(t => t.type === DepartmentTransactionType.WITHDRAWAL || t.type === DepartmentTransactionType.TRANSFER_OUT)
      .reduce((sum, t) => sum + t.amount, 0);

    return { deposits, withdrawals, balance: deposits - withdrawals };
  };

  const getTransactionIcon = (type: DepartmentTransactionType) => {
    switch (type) {
      case DepartmentTransactionType.DEPOSIT:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case DepartmentTransactionType.WITHDRAWAL:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case DepartmentTransactionType.TRANSFER_IN:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </div>
        );
      case DepartmentTransactionType.TRANSFER_OUT:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  const totals = getTotals();

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Relatório - {department.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Saldo atual: {DepartmentEntity.formatCurrency(department.currentBalance)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mês
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DepartmentReportFilterType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todas</option>
                <option value={DepartmentTransactionType.DEPOSIT}>Depósitos</option>
                <option value={DepartmentTransactionType.WITHDRAWAL}>Retiradas</option>
                <option value={DepartmentTransactionType.TRANSFER_IN}>Transferências Recebidas</option>
                <option value={DepartmentTransactionType.TRANSFER_OUT}>Transferências Enviadas</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800">Total de Entradas</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {DepartmentEntity.formatCurrency(totals.deposits)}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm font-medium text-red-800">Total de Saídas</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {DepartmentEntity.formatCurrency(totals.withdrawals)}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800">Saldo do Período</div>
              <div className={`text-2xl font-bold mt-1 ${totals.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                {DepartmentEntity.formatCurrency(totals.balance)}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Transações ({transactions.length})
            </h4>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Carregando transações...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Nenhuma transação encontrada neste período
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {getTransactionIcon(transaction.type)}
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {DepartmentEntity.getTransactionTypeLabel(transaction.type)} •{' '}
                            {formatLongDate(transaction.date)}
                          </p>
                          {transaction.receiptNumber && (
                            <p className="text-xs text-gray-500 mt-1">
                              Recibo: {transaction.receiptNumber}
                            </p>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`text-base font-semibold ${
                              transaction.type === DepartmentTransactionType.DEPOSIT ||
                              transaction.type === DepartmentTransactionType.TRANSFER_IN
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === DepartmentTransactionType.DEPOSIT ||
                            transaction.type === DepartmentTransactionType.TRANSFER_IN
                              ? '+'
                              : '-'}
                            {DepartmentEntity.formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {DepartmentEntity.getTransactionStatusLabel(transaction.status)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={exportReport}
              disabled={loading || exporting}
              className="px-4 py-2 border border-green-600 rounded-md text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
