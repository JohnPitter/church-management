// Presentation Component - Create Member Modal
// Modal for registering new church members with complete information

import React, { useState } from 'react';
import { Member, MaritalStatus, MemberStatus } from 'domain/entities/Member';
import { useMemberService } from 'presentation/hooks/useMemberService';
import { useAuth } from 'presentation/contexts/AuthContext';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member?: Member | null; // Optional member for editing
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member
}) => {
  const memberService = useMemberService();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEditMode = !!member;

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    maritalStatus: MaritalStatus.Single,
    photoURL: '',

    // Address
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',

    // Church Information
    baptismDate: '',
    conversionDate: '',
    ministries: [] as string[],
    role: '',

    // Additional
    observations: '',
    status: MemberStatus.Active
  });

  const [ministryInput, setMinistryInput] = useState('');

  // Load member data when editing
  React.useEffect(() => {
    if (member && isOpen) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
        maritalStatus: member.maritalStatus || MaritalStatus.Single,
        photoURL: member.photoURL || '',
        street: member.address?.street || '',
        number: member.address?.number || '',
        complement: member.address?.complement || '',
        neighborhood: member.address?.neighborhood || '',
        city: member.address?.city || '',
        state: member.address?.state || '',
        zipCode: member.address?.zipCode || '',
        baptismDate: member.baptismDate ? new Date(member.baptismDate).toISOString().split('T')[0] : '',
        conversionDate: member.conversionDate ? new Date(member.conversionDate).toISOString().split('T')[0] : '',
        ministries: member.ministries || [],
        role: member.role || '',
        observations: member.observations || '',
        status: member.status || MemberStatus.Active
      });
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        maritalStatus: MaritalStatus.Single,
        photoURL: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        baptismDate: '',
        conversionDate: '',
        ministries: [],
        role: '',
        observations: '',
        status: MemberStatus.Active
      });
      setError(null);
      setFieldErrors({});
    }
  }, [member, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMinistry = () => {
    if (ministryInput.trim() && !formData.ministries.includes(ministryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        ministries: [...prev.ministries, ministryInput.trim()]
      }));
      setMinistryInput('');
    }
  };

  const handleRemoveMinistry = (ministry: string) => {
    setFormData(prev => ({
      ...prev,
      ministries: prev.ministries.filter(m => m !== ministry)
    }));
  };

  // Validação em tempo real
  const checkFormValid = (): boolean => {
    const hasRequiredFields = !!(
      formData.name.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.birthDate &&
      formData.street.trim() &&
      formData.number.trim() &&
      formData.neighborhood.trim() &&
      formData.city.trim() &&
      formData.state.trim() &&
      formData.zipCode.trim()
    );

    return hasRequiredFields;
  };

  // Validação de formato dos campos
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validação de nome (mínimo 3 caracteres)
    if (formData.name.trim() && formData.name.trim().length < 3) {
      errors.name = 'Nome deve ter no mínimo 3 caracteres';
    }

    // Validação de email
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Email inválido';
      }
    }

    // Validação de telefone (formato brasileiro básico)
    if (formData.phone.trim()) {
      const phoneClean = formData.phone.replace(/\D/g, '');
      if (phoneClean.length < 10 || phoneClean.length > 11) {
        errors.phone = 'Telefone deve ter 10 ou 11 dígitos';
      }
    }

    // Validação de data de nascimento (não pode ser futura)
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      if (birthDate > new Date()) {
        errors.birthDate = 'Data de nascimento não pode ser futura';
      }
    }

    // Validação de CEP (8 dígitos)
    if (formData.zipCode.trim()) {
      const cepClean = formData.zipCode.replace(/\D/g, '');
      if (cepClean.length !== 8) {
        errors.zipCode = 'CEP deve ter 8 dígitos';
      }
    }

    // Validação de estado (2 caracteres)
    if (formData.state.trim() && formData.state.trim().length !== 2) {
      errors.state = 'Estado deve ter 2 caracteres (ex: SP)';
    }

    // Validação de URL da foto (se preenchida)
    if (formData.photoURL.trim()) {
      try {
        new URL(formData.photoURL);
      } catch {
        errors.photoURL = 'URL inválida';
      }
    }

    // Validação de data de conversão (não pode ser futura)
    if (formData.conversionDate) {
      const conversionDate = new Date(formData.conversionDate);
      if (conversionDate > new Date()) {
        errors.conversionDate = 'Data não pode ser futura';
      }
    }

    // Validação de data de batismo (não pode ser futura)
    if (formData.baptismDate) {
      const baptismDate = new Date(formData.baptismDate);
      if (baptismDate > new Date()) {
        errors.baptismDate = 'Data não pode ser futura';
      }
    }

    return errors;
  };

  // Atualiza validação em tempo real
  React.useEffect(() => {
    const errors = validateForm();
    setFieldErrors(errors);
    setIsFormValid(checkFormValid() && Object.keys(errors).length === 0);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório');
      }
      if (!formData.phone.trim()) {
        throw new Error('Telefone é obrigatório');
      }
      if (!formData.birthDate) {
        throw new Error('Data de nascimento é obrigatória');
      }
      if (!formData.street.trim() || !formData.neighborhood.trim() ||
          !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
        throw new Error('Endereço completo é obrigatório');
      }

      // Create member object - Build address with only defined fields
      const address: any = {
        street: formData.street.trim(),
        number: formData.number.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim()
      };

      // Only add complement if it has a value
      if (formData.complement.trim()) {
        address.complement = formData.complement.trim();
      }

      // Create member object with only defined fields
      const memberData: any = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        birthDate: new Date(formData.birthDate),
        address,
        maritalStatus: formData.maritalStatus,
        ministries: formData.ministries,
        status: formData.status,
        createdBy: currentUser.id
      };

      // Add optional fields only if they have values
      if (formData.baptismDate) {
        memberData.baptismDate = new Date(formData.baptismDate);
      }
      if (formData.conversionDate) {
        memberData.conversionDate = new Date(formData.conversionDate);
      }
      if (formData.role.trim()) {
        memberData.role = formData.role.trim();
      }
      if (formData.observations.trim()) {
        memberData.observations = formData.observations.trim();
      }
      if (formData.photoURL.trim()) {
        memberData.photoURL = formData.photoURL.trim();
      }

      if (isEditMode && member) {
        // Update existing member
        await memberService.updateMember(member.id, memberData);
      } else {
        // Create new member
        await memberService.createMember(memberData);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        maritalStatus: MaritalStatus.Single,
        photoURL: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        baptismDate: '',
        conversionDate: '',
        ministries: [],
        role: '',
        observations: '',
        status: MemberStatus.Active
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar membro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Editar Membro' : 'Cadastrar Novo Membro'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Campos marcados com <span className="text-red-600 font-bold">*</span> são obrigatórios
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="max-h-[70vh] overflow-y-auto px-1">
            {/* Personal Information Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👤</span>
                Informações Pessoais
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.birthDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={MaritalStatus.Single}>Solteiro(a)</option>
                    <option value={MaritalStatus.Married}>Casado(a)</option>
                    <option value={MaritalStatus.Divorced}>Divorciado(a)</option>
                    <option value={MaritalStatus.Widowed}>Viúvo(a)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Foto (opcional)
                  </label>
                  <input
                    type="url"
                    name="photoURL"
                    value={formData.photoURL}
                    onChange={handleInputChange}
                    placeholder="https://exemplo.com/foto.jpg"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.photoURL ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.photoURL && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.photoURL}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📍</span>
                Endereço
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.zipCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.zipCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.street && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.number && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento (opcional)
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    placeholder="Apto, Bloco, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.neighborhood ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.neighborhood && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.neighborhood}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="SP, RJ, MG..."
                    maxLength={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Church Information Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⛪</span>
                Informações Eclesiásticas
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Conversão (opcional)
                  </label>
                  <input
                    type="date"
                    name="conversionDate"
                    value={formData.conversionDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.conversionDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.conversionDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.conversionDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Batismo (opcional)
                  </label>
                  <input
                    type="date"
                    name="baptismDate"
                    value={formData.baptismDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.baptismDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.baptismDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.baptismDate}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função/Cargo na Igreja (opcional)
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Ex: Diácono, Pastor, Líder de Louvor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ministérios (opcional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ministryInput}
                      onChange={(e) => setMinistryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMinistry())}
                      placeholder="Ex: Louvor, Ensino, Jovens..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddMinistry}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Adicionar
                    </button>
                  </div>
                  {formData.ministries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.ministries.map((ministry, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {ministry}
                          <button
                            type="button"
                            onClick={() => handleRemoveMinistry(ministry)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={MemberStatus.Active}>Ativo</option>
                    <option value={MemberStatus.Inactive}>Inativo</option>
                    <option value={MemberStatus.Transferred}>Transferido</option>
                    <option value={MemberStatus.Disciplined}>Disciplinado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                Informações Adicionais
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Informações adicionais sobre o membro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t">
            {!isFormValid && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Preencha todos os campos obrigatórios (marcados com <span className="text-red-600 font-bold">*</span>) corretamente para habilitar o cadastro.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isFormValid ? 'Preencha todos os campos obrigatórios corretamente' : ''}
              >
                {loading
                  ? (isEditMode ? 'Salvando...' : 'Cadastrando...')
                  : (isEditMode ? 'Salvar Alterações' : 'Cadastrar Membro')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateMemberModal;
