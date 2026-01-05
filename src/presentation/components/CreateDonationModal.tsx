// Presentation Component - Create Donation Modal
// Modal for creating new donations (tithes, offerings, etc.)

import React, { useState, useEffect } from 'react';
import { 
  Donation, 
  FinancialCategory, 
  DonationType, 
  PaymentMethod,
  TransactionType 
} from '../../modules/financial/church-finance/domain/entities/Financial';
import { financialService } from '../../infrastructure/services/FinancialService';

interface CreateDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonationCreated: () => void;
  currentUser: any;
}

export const CreateDonationModal: React.FC<CreateDonationModalProps> = ({
  isOpen,
  onClose,
  onDonationCreated,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    type: DonationType.TITHE,
    categoryId: '',
    amount: '',
    memberName: '',
    memberEmail: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: PaymentMethod.CASH,
    isAnonymous: false,
    notes: ''
  });
  
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const donationTypes = [
    { value: DonationType.TITHE, label: 'Dízimo', icon: '🙏', description: '10% da renda' },
    { value: DonationType.OFFERING, label: 'Oferta', icon: '💝', description: 'Doação voluntária' },
    { value: DonationType.SPECIAL_OFFERING, label: 'Oferta Especial', icon: '✨', description: 'Campanha específica' },
    { value: DonationType.MISSION, label: 'Missões', icon: '🌍', description: 'Apoio missionário' },
    { value: DonationType.BUILDING_FUND, label: 'Obra', icon: '🏗️', description: 'Construção/reforma' },
    { value: DonationType.CHARITY, label: 'Caridade', icon: '🤝', description: 'Ajuda social' }
  ];

  const paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Dinheiro' },
    { value: PaymentMethod.PIX, label: 'PIX' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência Bancária' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      // Get income categories for donations
      const categoriesData = await financialService.getCategories(TransactionType.INCOME);
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.push('Valor deve ser maior que zero');
    }
    
    if (!formData.categoryId) {
      newErrors.push('Categoria é obrigatória');
    }
    
    if (!formData.date) {
      newErrors.push('Data é obrigatória');
    }

    if (!formData.isAnonymous && !formData.memberName.trim()) {
      newErrors.push('Nome do membro é obrigatório para doações não anônimas');
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
      
      const donationData: any = {
        type: formData.type,
        category: selectedCategory,
        amount: parseFloat(formData.amount),
        memberName: formData.isAnonymous ? 'Anônimo' : formData.memberName.trim(),
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod,
        isAnonymous: formData.isAnonymous,
        createdBy: currentUser?.email || 'unknown'
      };
      
      // Only add optional fields if they have values
      if (!formData.isAnonymous && formData.memberEmail.trim()) {
        donationData.memberEmail = formData.memberEmail.trim();
      }
      if (formData.notes.trim()) {
        donationData.notes = formData.notes.trim();
      }
      
      await financialService.createDonation(donationData);
      
      // Reset form
      setFormData({
        type: DonationType.TITHE,
        categoryId: '',
        amount: '',
        memberName: '',
        memberEmail: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: PaymentMethod.CASH,
        isAnonymous: false,
        notes: ''
      });
      
      onDonationCreated();
      onClose();
      
    } catch (error) {
      console.error('Error creating donation:', error);
      setErrors(['Erro ao criar doação. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: DonationType.TITHE,
      categoryId: '',
      amount: '',
      memberName: '',
      memberEmail: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      isAnonymous: false,
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
              Nova Doação
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
            {/* Donation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Doação *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {donationTypes.map(type => (
                  <label key={type.value} className="relative">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-colors ${
                      formData.type === type.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}>
                      <div className="text-xl mb-1">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={formData.isAnonymous}
                onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-900">
                Doação anônima
              </label>
            </div>

            {/* Member Info - Only shown if not anonymous */}
            {!formData.isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Membro *
                  </label>
                  <input
                    type="text"
                    value={formData.memberName}
                    onChange={(e) => handleInputChange('memberName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nome completo"
                    required={!formData.isAnonymous}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.memberEmail}
                    onChange={(e) => handleInputChange('memberEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            )}

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

            {/* Category and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="Informações adicionais sobre a doação..."
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
                  'Criar Doação'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};