// Component - Contact Visitor Modal
// Modal for adding contact attempts with visitors

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { visitorService } from '@modules/church-management/visitors/application/services/VisitorService';
import {
  Visitor,
  ContactType,
  ContactMethod
} from '@modules/church-management/visitors/domain/entities/Visitor';

interface ContactVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: Visitor;
  currentUser: any;
  onContactAdded: () => void;
}

export const ContactVisitorModal: React.FC<ContactVisitorModalProps> = ({
  isOpen,
  onClose,
  visitor,
  currentUser,
  onContactAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: ContactType.FOLLOW_UP,
    method: ContactMethod.PHONE,
    notes: '',
    successful: false,
    nextContactDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactTypes = [
    { value: ContactType.WELCOME, label: 'Boas-vindas' },
    { value: ContactType.FOLLOW_UP, label: 'Acompanhamento' },
    { value: ContactType.INVITATION, label: 'Convite para Evento' },
    { value: ContactType.PRAYER_REQUEST, label: 'Pedido de Oração' },
    { value: ContactType.OTHER, label: 'Outro' }
  ];

  const contactMethods = [
    { value: ContactMethod.PHONE, label: 'Telefone' },
    { value: ContactMethod.EMAIL, label: 'Email' },
    { value: ContactMethod.WHATSAPP, label: 'WhatsApp' },
    { value: ContactMethod.IN_PERSON, label: 'Pessoalmente' },
    { value: ContactMethod.LETTER, label: 'Carta' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.notes.trim()) {
      newErrors.notes = 'Observações são obrigatórias';
    }

    if (formData.nextContactDate && new Date(formData.nextContactDate) <= new Date()) {
      newErrors.nextContactDate = 'Data do próximo contato deve ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const contactAttempt = {
        date: new Date(),
        type: formData.type,
        method: formData.method,
        notes: formData.notes.trim(),
        successful: formData.successful,
        nextContactDate: formData.nextContactDate ? new Date(formData.nextContactDate) : undefined,
        contactedBy: currentUser?.displayName || currentUser?.email || 'Sistema'
      };

      await visitorService.addContactAttempt(visitor.id, contactAttempt);
      onContactAdded();
      onClose();
      
      // Reset form
      setFormData({
        type: ContactType.FOLLOW_UP,
        method: ContactMethod.PHONE,
        notes: '',
        successful: false,
        nextContactDate: ''
      });
    } catch (error) {
      console.error('Error adding contact attempt:', error);
      toast.error('Erro ao registrar contato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registrar Contato</h3>
            <p className="text-sm text-gray-600">Visitante: <span className="font-medium">{visitor.name}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Contato *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {contactTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Meio de Contato *</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {contactMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Informações de Contato do Visitante</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Telefone:</span>
                <span className="ml-2 text-gray-900">{visitor.phone || 'Não informado'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{visitor.email || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observações do Contato *</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Descreva como foi o contato, o que foi conversado, reações do visitante, etc."
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.notes ? 'border-red-300' : ''
              }`}
            />
            {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Seja específico sobre o resultado do contato e próximos passos necessários.
            </p>
          </div>

          {/* Success Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="successful"
                checked={formData.successful}
                onChange={handleInputChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="successful" className="font-medium text-gray-700">
                Contato bem-sucedido
              </label>
              <p className="text-gray-500">
                Marque se conseguiu falar com o visitante e teve uma conversa produtiva.
              </p>
            </div>
          </div>

          {/* Next Contact Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Próximo Contato (Opcional)</label>
            <input
              type="datetime-local"
              name="nextContactDate"
              value={formData.nextContactDate}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.nextContactDate ? 'border-red-300' : ''
              }`}
            />
            {errors.nextContactDate && <p className="text-red-500 text-sm mt-1">{errors.nextContactDate}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Agende quando deve ser feito o próximo contato com este visitante.
            </p>
          </div>

          {/* Quick Templates */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Sugestões de Observações</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Conversei com o visitante, demonstrou interesse em participar mais da igreja. Convidei para o próximo culto.'})}
                className="block text-left hover:text-blue-900 underline"
              >
                • Interesse em participar mais
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante não atendeu. Deixei recado pedindo para retornar a ligação.'})}
                className="block text-left hover:text-blue-900 underline"
              >
                • Não atendeu - deixou recado
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Conversa muito boa! Visitante interessado em grupos pequenos e ministério de louvor. Vou conectar com liderança.'})}
                className="block text-left hover:text-blue-900 underline"
              >
                • Interesse em ministérios específicos
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante agradeceu pelo contato mas está passando por momento difícil. Ofereci oração e apoio pastoral.'})}
                className="block text-left hover:text-blue-900 underline"
              >
                • Necessidade de apoio pastoral
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
