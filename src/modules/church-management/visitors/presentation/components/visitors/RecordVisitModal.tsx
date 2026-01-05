// Component - Record Visit Modal
// Modal for recording new visits from existing visitors

import React, { useState } from 'react';
import { visitorService } from 'infrastructure/services/VisitorService';
import {
  Visitor,
  ServiceType
} from '../../domain/entities/Visitor';

interface RecordVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: Visitor;
  currentUser: any;
  onVisitRecorded: () => void;
}

export const RecordVisitModal: React.FC<RecordVisitModalProps> = ({
  isOpen,
  onClose,
  visitor,
  currentUser,
  onVisitRecorded
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    service: ServiceType.SUNDAY_MORNING,
    notes: '',
    broughtBy: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceTypes = [
    { value: ServiceType.SUNDAY_MORNING, label: 'Culto Dominical Manhã' },
    { value: ServiceType.SUNDAY_EVENING, label: 'Culto Dominical Noite' },
    { value: ServiceType.WEDNESDAY_PRAYER, label: 'Reunião de Oração (Quarta)' },
    { value: ServiceType.BIBLE_STUDY, label: 'Estudo Bíblico' },
    { value: ServiceType.YOUTH_SERVICE, label: 'Culto de Jovens' },
    { value: ServiceType.CHILDREN_SERVICE, label: 'Culto Infantil' },
    { value: ServiceType.SPECIAL_EVENT, label: 'Evento Especial' },
    { value: ServiceType.OTHER, label: 'Outro' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.visitDate) {
      newErrors.visitDate = 'Data da visita é obrigatória';
    } else if (new Date(formData.visitDate) > new Date()) {
      newErrors.visitDate = 'Data da visita não pode ser futura';
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
      const visitData = {
        visitorId: visitor.id,
        visitDate: new Date(formData.visitDate),
        service: formData.service,
        registeredBy: currentUser?.id || 'system',
        notes: formData.notes.trim() || undefined,
        broughtBy: formData.broughtBy.trim() || undefined
      };

      await visitorService.recordVisit(visitData);
      onVisitRecorded();
      onClose();
      
      // Reset form
      setFormData({
        visitDate: new Date().toISOString().split('T')[0],
        service: ServiceType.SUNDAY_MORNING,
        notes: '',
        broughtBy: ''
      });
    } catch (error) {
      console.error('Error recording visit:', error);
      alert('Erro ao registrar visita. Tente novamente.');
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
            <h3 className="text-lg font-semibold text-gray-900">Registrar Nova Visita</h3>
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

        {/* Visitor Summary */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">Histórico do Visitante</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-indigo-700">Total de Visitas:</span>
              <span className="ml-2 text-indigo-900">{visitor.totalVisits}</span>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Primeira Visita:</span>
              <span className="ml-2 text-indigo-900">
                {new Date(visitor.firstVisitDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Última Visita:</span>
              <span className="ml-2 text-indigo-900">
                {visitor.lastVisitDate 
                  ? new Date(visitor.lastVisitDate).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Data da Visita *</label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.visitDate ? 'border-red-300' : ''
                }`}
              />
              {errors.visitDate && <p className="text-red-500 text-sm mt-1">{errors.visitDate}</p>}
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Culto/Evento *</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {serviceTypes.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brought By */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Trazido por (Opcional)</label>
            <input
              type="text"
              name="broughtBy"
              value={formData.broughtBy}
              onChange={handleInputChange}
              placeholder="Nome do membro que trouxe o visitante"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Se o visitante foi trazido por algum membro, informe o nome aqui.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observações (Opcional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Observações sobre a visita: como o visitante se sentiu, se demonstrou interesse em algo específico, etc."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Registre informações relevantes sobre esta visita específica.
            </p>
          </div>

          {/* Quick Templates */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">💡 Sugestões de Observações</h4>
            <div className="space-y-1 text-sm text-green-700">
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante participou ativamente do culto, cantou os hinos e demonstrou interesse na mensagem.'})}
                className="block text-left hover:text-green-900 underline"
              >
                • Participação ativa no culto
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Primeira visita do visitante, pareceu um pouco tímido mas ficou até o final. Foi bem recebido pelos membros.'})}
                className="block text-left hover:text-green-900 underline"
              >
                • Primeira visita - tímido
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante retornou! Demonstrou muito interesse em conhecer mais sobre os ministérios da igreja.'})}
                className="block text-left hover:text-green-900 underline"
              >
                • Retorno com interesse em ministérios
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante conversou com pastor após culto, interessado em estudos bíblicos e batismo.'})}
                className="block text-left hover:text-green-900 underline"
              >
                • Interesse em batismo/estudos
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, notes: 'Visitante veio em família, crianças participaram do culto infantil. Família demonstrou interesse em retornar.'})}
                className="block text-left hover:text-green-900 underline"
              >
                • Visita em família
              </button>
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Lembrete</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Após registrar a visita, considere fazer um follow-up com o visitante em alguns dias 
                  para agradecê-lo pela presença e convidá-lo para retornar.
                </p>
              </div>
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
              {loading ? 'Registrando...' : 'Registrar Visita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
