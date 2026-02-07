// Component - Create Visitor Modal
// Modal for creating new church visitors

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { visitorService } from '@modules/church-management/visitors/application/services/VisitorService';
import {
  VisitorStatus,
  FollowUpStatus
} from '@modules/church-management/visitors/domain/entities/Visitor';

interface CreateVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitorCreated: () => void;
  currentUser: any;
}

export const CreateVisitorModal: React.FC<CreateVisitorModalProps> = ({
  isOpen,
  onClose,
  onVisitorCreated,
  currentUser
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    birthDate: '',
    gender: '',
    maritalStatus: '',
    profession: '',
    howDidYouKnow: '',
    interests: [] as string[],
    observations: '',
    firstVisitDate: new Date().toISOString().split('T')[0],
    broughtBy: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const interestOptions = [
    'Cultos',
    'Estudos Bíblicos',
    'Ministério de Louvor',
    'Trabalho Social',
    'Ministério Infantil',
    'Ministério de Jovens',
    'Grupos de Oração',
    'Evangelismo',
    'Discipulado',
    'Aconselhamento'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone deve estar no formato (11) 99999-9999';
    }

    if (!formData.firstVisitDate) {
      newErrors.firstVisitDate = 'Data da primeira visita é obrigatória';
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
      const visitorData: any = {
        name: formData.name.trim(),
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: new Date(formData.firstVisitDate),
        lastVisitDate: new Date(formData.firstVisitDate),
        interests: formData.interests,
        isMember: false,
        createdBy: currentUser?.id || 'system'
      };

      // Only add optional fields if they have values
      if (formData.email.trim()) visitorData.email = formData.email.trim();
      if (formData.phone.trim()) visitorData.phone = formData.phone.trim();
      if (formData.address.street.trim()) visitorData.address = formData.address;
      if (formData.birthDate) visitorData.birthDate = new Date(formData.birthDate);
      if (formData.gender) visitorData.gender = formData.gender as 'masculino' | 'feminino';
      if (formData.maritalStatus) visitorData.maritalStatus = formData.maritalStatus as 'solteiro' | 'casado' | 'divorciado' | 'viuvo';
      if (formData.profession.trim()) visitorData.profession = formData.profession.trim();
      if (formData.howDidYouKnow.trim()) visitorData.howDidYouKnow = formData.howDidYouKnow.trim();
      if (formData.observations.trim()) visitorData.observations = formData.observations.trim();

      await visitorService.createVisitor(visitorData);
      onVisitorCreated();
      onClose();
    } catch (error) {
      console.error('Error creating visitor:', error);
      toast.error('Erro ao criar visitante. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Novo Visitante</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">Informações Pessoais</h4>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.phone ? 'border-red-300' : ''
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Sexo</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                </select>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Profissão</label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">Informações Adicionais</h4>
              
              {/* First Visit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da Primeira Visita *</label>
                <input
                  type="date"
                  name="firstVisitDate"
                  value={formData.firstVisitDate}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.firstVisitDate ? 'border-red-300' : ''
                  }`}
                />
                {errors.firstVisitDate && <p className="text-red-500 text-sm mt-1">{errors.firstVisitDate}</p>}
              </div>

              {/* How did you know */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Como conheceu a igreja?</label>
                <input
                  type="text"
                  name="howDidYouKnow"
                  value={formData.howDidYouKnow}
                  onChange={handleInputChange}
                  placeholder="Ex: Convite de amigo, internet, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Brought by */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Trazido por (membro)</label>
                <input
                  type="text"
                  name="broughtBy"
                  value={formData.broughtBy}
                  onChange={handleInputChange}
                  placeholder="Nome do membro que trouxe"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Áreas de Interesse</label>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestToggle(interest)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Informações adicionais sobre o visitante..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Rua</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
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
              {loading ? 'Salvando...' : 'Salvar Visitante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
