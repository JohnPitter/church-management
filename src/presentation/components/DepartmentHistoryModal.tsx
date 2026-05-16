import React, { useEffect, useMemo, useState } from 'react';
import {
  Department,
  DepartmentEntity,
  DepartmentTransaction,
  DepartmentTransactionStatus,
  DepartmentTransactionType
} from '@modules/church-management/departments/domain/entities/Department';
import { departmentFinancialService } from '@modules/financial/department-finance/application/services/DepartmentFinancialService';

interface DepartmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
}

const COMPLETE_HISTORY_LIMIT = 10000;
const HISTORY_PAGE_SIZE = 20;
const TRANSACTION_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
};

const TRANSACTION_TYPE_STYLES: Record<DepartmentTransactionType, string> = {
  [DepartmentTransactionType.DEPOSIT]: 'bg-green-100 text-green-800',
  [DepartmentTransactionType.WITHDRAWAL]: 'bg-red-100 text-red-800',
  [DepartmentTransactionType.TRANSFER_IN]: 'bg-blue-100 text-blue-800',
  [DepartmentTransactionType.TRANSFER_OUT]: 'bg-orange-100 text-orange-800'
};

const TRANSACTION_STATUS_STYLES: Record<DepartmentTransactionStatus, string> = {
  [DepartmentTransactionStatus.APPROVED]: 'bg-green-100 text-green-800',
  [DepartmentTransactionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [DepartmentTransactionStatus.REJECTED]: 'bg-red-100 text-red-800',
  [DepartmentTransactionStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};

const isIncomingTransaction = (type: DepartmentTransactionType): boolean =>
  type === DepartmentTransactionType.DEPOSIT || type === DepartmentTransactionType.TRANSFER_IN;

export const DepartmentHistoryModal: React.FC<DepartmentHistoryModalProps> = ({
  isOpen,
  onClose,
  department
}) => {
  const [transactions, setTransactions] = useState<DepartmentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setCurrentPage(1);
        const data = await departmentFinancialService.getTransactions(
          { departmentId: department.id },
          COMPLETE_HISTORY_LIMIT
        );
        setTransactions(data);
      } catch (error) {
        console.error('Error loading department history:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [department.id, isOpen]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (accumulator, transaction) => {
        if (isIncomingTransaction(transaction.type)) {
          return {
            ...accumulator,
            entries: accumulator.entries + transaction.amount
          };
        }

        return {
          ...accumulator,
          exits: accumulator.exits + transaction.amount
        };
      },
      { entries: 0, exits: 0 }
    );
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / HISTORY_PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const paginatedTransactions = transactions.slice(pageStartIndex, pageStartIndex + HISTORY_PAGE_SIZE);
  const pageEndIndex = Math.min(pageStartIndex + paginatedTransactions.length, transactions.length);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  if (!isOpen) return null;

  const formatTransactionDate = (date: Date): string =>
    date.toLocaleDateString('pt-BR', TRANSACTION_DATE_FORMAT_OPTIONS);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Histórico Completo - {department.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Todas as movimentações registradas nesta caixinha.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Fechar histórico"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600">Saldo Inicial</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {DepartmentEntity.formatCurrency(department.initialBalance || 0)}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800">Entradas</div>
              <div className="text-xl font-bold text-green-900 mt-1">
                {DepartmentEntity.formatCurrency(totals.entries)}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm font-medium text-red-800">Saídas</div>
              <div className="text-xl font-bold text-red-900 mt-1">
                {DepartmentEntity.formatCurrency(totals.exits)}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800">Saldo Atual</div>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {DepartmentEntity.formatCurrency(department.currentBalance)}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Movimentações ({transactions.length})
              </h4>
              {department.responsibleName && (
                <span className="text-xs text-gray-500">
                  Responsável: {department.responsibleName}
                </span>
              )}
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Carregando histórico...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Nenhuma movimentação registrada nesta caixinha.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referência
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => {
                      const isIncoming = isIncomingTransaction(transaction.type);

                      return (
                        <tr key={transaction.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatTransactionDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${TRANSACTION_TYPE_STYLES[transaction.type]}`}>
                              {DepartmentEntity.getTransactionTypeLabel(transaction.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.notes && (
                              <div className="text-xs text-gray-500 mt-1">{transaction.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold">
                            <span className={isIncoming ? 'text-green-600' : 'text-red-600'}>
                              {isIncoming ? '+' : '-'}
                              {DepartmentEntity.formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${TRANSACTION_STATUS_STYLES[transaction.status]}`}>
                              {DepartmentEntity.getTransactionStatusLabel(transaction.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {transaction.reference || transaction.receiptNumber || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {transactions.length > HISTORY_PAGE_SIZE && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-600">
                Exibindo {pageStartIndex + 1}-{pageEndIndex} de {transactions.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
