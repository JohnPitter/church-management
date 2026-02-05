// Presentation Component - Department Transaction Modal
// Modal for creating department deposits and withdrawals

import React, { useState } from 'react';
import {
  Department,
  DepartmentTransactionType,
  DepartmentTransactionStatus,
  DepartmentEntity
} from '@modules/church-management/departments/domain/entities/Department';
import { departmentFinancialService } from '@modules/financial/department-finance/application/services/DepartmentFinancialService';

interface DepartmentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: () => void;
  department: Department;
  currentUser: any;
}

export const DepartmentTransactionModal: React.FC<DepartmentTransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionCreated,
  department,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    type: DepartmentTransactionType.DEPOSIT,
    amount: 0,
    description: '',
    notes: '',
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const transactionData: any = {
        departmentId: department.id,
        departmentName: department.name,
        type: formData.type,
        amount: formData.amount,
        description: formData.description.trim(),
        date: new Date(formData.date),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: currentUser?.uid || 'system'
      };

      // Only add optional fields if they have values
      if (formData.notes.trim()) {
        transactionData.notes = formData.notes.trim();
      }
      if (formData.receiptNumber.trim()) {
        transactionData.receiptNumber = formData.receiptNumber.trim();
      }

      // Validate
      const validationErrors = DepartmentEntity.validateTransaction(transactionData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      await departmentFinancialService.createTransaction(transactionData);

      onTransactionCreated();
      onClose();

      // Reset form
      setFormData({
        type: DepartmentTransactionType.DEPOSIT,
        amount: 0,
        description: '',
        notes: '',
        receiptNumber: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao criar transação']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Nova Transação
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {department.name} • Saldo atual: {DepartmentEntity.formatCurrency(department.currentBalance)}
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

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro ao criar transação
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Transação *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: DepartmentTransactionType.DEPOSIT })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.type === DepartmentTransactionType.DEPOSIT
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Depósito</div>
                      <div className="text-xs text-gray-500">Entrada de dinheiro</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: DepartmentTransactionType.WITHDRAWAL })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.type === DepartmentTransactionType.WITHDRAWAL
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Retirada</div>
                      <div className="text-xs text-gray-500">Saída de dinheiro</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  R$
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0,00"
                />
              </div>
              {formData.type === DepartmentTransactionType.WITHDRAWAL && formData.amount > department.currentBalance && (
                <p className="mt-1 text-sm text-red-600">
                  ⚠️ Valor maior que o saldo disponível
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Oferta do culto, Compra de materiais, etc."
              />
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Recibo (Opcional)
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: REC-001"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (Opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Informações adicionais sobre a transação..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (formData.type === DepartmentTransactionType.WITHDRAWAL && formData.amount > department.currentBalance)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Registrar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
