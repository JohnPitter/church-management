// Presentation Component - Create Transaction Modal
// Modal for creating new financial transactions

import React, { useState, useEffect } from 'react';
import { 
  FinancialCategory, 
  TransactionType, 
  PaymentMethod,
  TransactionStatus 
} from '@modules/financial/church-finance/domain/entities/Financial';
import { financialService } from '@modules/financial/church-finance/application/services/FinancialService';

interface FinancialServiceLike {
  getCategories(type?: any): Promise<FinancialCategory[]>;
  createTransaction(data: any): Promise<string>;
  updateTransaction?(id: string, data: any): Promise<void>;
}

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: () => void;
  currentUser: any;
  service?: FinancialServiceLike;
  editTransaction?: any;
}

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionCreated,
  currentUser,
  service,
  editTransaction
}) => {
  const activeService = service || financialService;
  const isEditing = !!editTransaction;
  const [formData, setFormData] = useState({
    type: editTransaction?.type || TransactionType.EXPENSE,
    categoryId: editTransaction?.category?.id || '',
    amount: editTransaction?.amount?.toString() || '',
    description: editTransaction?.description || '',
    date: editTransaction?.date ? new Date(editTransaction.date.seconds ? editTransaction.date.seconds * 1000 : editTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: editTransaction?.paymentMethod || PaymentMethod.CASH,
    reference: editTransaction?.reference || '',
    notes: editTransaction?.notes || ''
  });
  
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Dinheiro' },
    { value: PaymentMethod.PIX, label: 'PIX' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência Bancária' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
    { value: PaymentMethod.CHECK, label: 'Cheque' },
    { value: PaymentMethod.BOLETO, label: 'Boleto' },
    { value: PaymentMethod.OTHER, label: 'Outro' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.type]);

  const loadCategories = async () => {
    try {
      const categoriesData = await activeService.getCategories(formData.type);
      setCategories(categoriesData);
      
      // Auto-select first category if none selected
      if (categoriesData.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
    
    // If type changes, reset category
    if (field === 'type') {
      setFormData(prev => ({ ...prev, categoryId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.description.trim()) {
      newErrors.push('Descrição é obrigatória');
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.push('Valor deve ser maior que zero');
    }
    
    if (!formData.categoryId) {
      newErrors.push('Categoria é obrigatória');
    }
    
    if (!formData.date) {
      newErrors.push('Data é obrigatória');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (!selectedCategory) {
        setErrors(['Categoria não encontrada']);
        return;
      }
      
      const transactionData: any = {
        type: formData.type,
        category: selectedCategory,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod,
        createdBy: currentUser?.email || 'unknown',
        status: TransactionStatus.APPROVED // Auto-approve for now
      };
      
      // Only add optional fields if they have values
      if (formData.reference.trim()) {
        transactionData.reference = formData.reference.trim();
      }
      if (formData.notes.trim()) {
        transactionData.notes = formData.notes.trim();
      }
      
      if (isEditing && activeService.updateTransaction) {
        await activeService.updateTransaction(editTransaction.id, transactionData);
      } else {
        await activeService.createTransaction(transactionData);
      }
      
      // Reset form
      setFormData({
        type: TransactionType.EXPENSE,
        categoryId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: PaymentMethod.CASH,
        reference: '',
        notes: ''
      });
      
      onTransactionCreated();
      onClose();
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      setErrors(['Erro ao criar transação. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: TransactionType.EXPENSE,
      categoryId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: ''
    });
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editar Transação' : 'Nova Transação Financeira'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Corrija os seguintes erros:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Transação *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="type"
                    value={TransactionType.INCOME}
                    checked={formData.type === TransactionType.INCOME}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                    formData.type === TransactionType.INCOME
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <div className="text-2xl mb-2">⬆️</div>
                    <div className="font-medium">Receita</div>
                    <div className="text-sm">Entrada de dinheiro</div>
                  </div>
                </label>
                
                <label className="relative">
                  <input
                    type="radio"
                    name="type"
                    value={TransactionType.EXPENSE}
                    checked={formData.type === TransactionType.EXPENSE}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                    formData.type === TransactionType.EXPENSE
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <div className="text-2xl mb-2">⬇️</div>
                    <div className="font-medium">Despesa</div>
                    <div className="text-sm">Saída de dinheiro</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0,00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descreva a transação..."
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referência (Opcional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Número da nota, recibo, etc."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (Opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Informações adicionais..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  isEditing ? 'Salvar Alterações' : 'Criar Transação'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};