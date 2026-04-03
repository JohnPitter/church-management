import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  TipoAssistencia,
  StatusProfissional,
  ProfissionalAssistencia,
  AssistenciaEntity,
  HorarioFuncionamento
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { useAuth } from '../contexts/AuthContext';
import { applyPhoneMask, applyCEPMask } from '../../utils/inputMasks';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { User as DomainUser, UserStatus } from '@/domain/entities/User';

interface ProfissionalAssistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profissional: ProfissionalAssistencia) => void;
  profissional?: ProfissionalAssistencia | null;
  mode: 'create' | 'edit' | 'view';
}

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  especialidade: TipoAssistencia;
  registroProfissional: string;
  tempoConsulta: string;
  valorConsulta: string;
  observacoes: string;
  status: StatusProfissional;
  // Campos de endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const ProfissionalAssistenciaModal: React.FC<ProfissionalAssistenciaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profissional,
  mode
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [systemUsers, setSystemUsers] = useState<DomainUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const profissionalService = new ProfissionalAssistenciaService();
  const userRepository = useMemo(() => new FirebaseUserRepository(), []);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    especialidade: TipoAssistencia.Psicologica,
    registroProfissional: '',
    tempoConsulta: '60',
    valorConsulta: '',
    observacoes: '',
    status: StatusProfissional.Ativo,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const isReadOnly = mode === 'view';

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  const defaultHorarios: HorarioFuncionamento[] = [
    { diaSemana: 1, horaInicio: '07:00', horaFim: '21:00' },
    { diaSemana: 2, horaInicio: '07:00', horaFim: '21:00' },
    { diaSemana: 3, horaInicio: '07:00', horaFim: '21:00' },
    { diaSemana: 4, horaInicio: '07:00', horaFim: '21:00' },
    { diaSemana: 5, horaInicio: '07:00', horaFim: '21:00' },
  ];

  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>(defaultHorarios);

  const handleToggleDia = (diaSemana: number) => {
    const existe = horarios.find(h => h.diaSemana === diaSemana);
    if (existe) {
      setHorarios(prev => prev.filter(h => h.diaSemana !== diaSemana));
    } else {
      setHorarios(prev => [...prev, { diaSemana, horaInicio: '07:00', horaFim: '21:00' }].sort((a, b) => a.diaSemana - b.diaSemana));
    }
  };

  const handleHorarioChange = (diaSemana: number, field: 'horaInicio' | 'horaFim', value: string) => {
    setHorarios(prev => prev.map(h => h.diaSemana === diaSemana ? { ...h, [field]: value } : h));
  };

  // Load system users when modal opens in create mode
  useEffect(() => {
    if (isOpen && mode === 'create') {
      const loadUsers = async () => {
        setLoadingUsers(true);
        try {
          const users = await userRepository.findAll();
          // Only show approved users
          const approvedUsers = users.filter(u => u.status === UserStatus.Approved);
          setSystemUsers(approvedUsers);
        } catch (error) {
          console.error('Error loading users:', error);
          toast.error('Erro ao carregar usuários do sistema');
        } finally {
          setLoadingUsers(false);
        }
      };
      loadUsers();
    }
  }, [isOpen, mode, userRepository]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = systemUsers.find(u => u.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        nome: selectedUser.displayName,
        email: selectedUser.email,
        telefone: selectedUser.phoneNumber ? applyPhoneMask(selectedUser.phoneNumber) : prev.telefone,
      }));
      setUserSearchTerm('');
    }
  };

  const filteredUsers = userSearchTerm.trim()
    ? systemUsers.filter(u =>
        u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    : systemUsers;

  useEffect(() => {
    if (profissional && (mode === 'edit' || mode === 'view')) {
      setFormData({
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone,
        especialidade: profissional.especialidade,
        registroProfissional: profissional.registroProfissional,
        tempoConsulta: profissional.tempoConsulta.toString(),
        valorConsulta: profissional.valorConsulta?.toString() || '',
            observacoes: profissional.observacoes || '',
        status: profissional.status,
        cep: profissional.endereco?.cep || '',
        logradouro: profissional.endereco?.logradouro || '',
        numero: profissional.endereco?.numero || '',
        complemento: profissional.endereco?.complemento || '',
        bairro: profissional.endereco?.bairro || '',
        cidade: profissional.endereco?.cidade || '',
        estado: profissional.endereco?.estado || ''
      });
      if (profissional.horariosFuncionamento && profissional.horariosFuncionamento.length > 0) {
        setHorarios(profissional.horariosFuncionamento);
      } else {
        setHorarios(defaultHorarios);
      }
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        especialidade: TipoAssistencia.Psicologica,
        registroProfissional: '',
        tempoConsulta: '60',
        valorConsulta: '',
            observacoes: '',
        status: StatusProfissional.Ativo,
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: ''
      });
      setHorarios(defaultHorarios);
    }
    setErrors({});
    setSelectedUserId('');
    setUserSearchTerm('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissional, mode, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Apply masks
    if (field === 'telefone') {
      processedValue = applyPhoneMask(value);
    } else if (field === 'cep') {
      processedValue = applyCEPMask(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create' && !selectedUserId) {
      newErrors['email'] = 'Selecione um usuário do sistema';
    }

    if (!formData.nome.trim()) {
      newErrors['nome'] = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors['nome'] = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors['email'] = 'Email é obrigatório';
    } else if (!AssistenciaEntity.validarEmail(formData.email)) {
      newErrors['email'] = 'Email inválido';
    }

    if (!formData.telefone.trim()) {
      newErrors['telefone'] = 'Telefone é obrigatório';
    } else if (!AssistenciaEntity.validarTelefone(formData.telefone)) {
      newErrors['telefone'] = 'Telefone inválido';
    }

    if (!formData.especialidade) {
      newErrors['especialidade'] = 'Especialidade é obrigatória';
    }

    if (!formData.registroProfissional.trim()) {
      newErrors['registroProfissional'] = 'Registro profissional é obrigatório';
    } else if (formData.registroProfissional.trim().length < 3) {
      newErrors['registroProfissional'] = 'Registro deve ter pelo menos 3 caracteres';
    }

    if (!formData.tempoConsulta || parseInt(formData.tempoConsulta) <= 0) {
      newErrors['tempoConsulta'] = 'Tempo de consulta deve ser maior que zero';
    } else if (parseInt(formData.tempoConsulta) > 240) {
      newErrors['tempoConsulta'] = 'Tempo de consulta não pode exceder 240 minutos';
    }

    if (formData.valorConsulta && parseFloat(formData.valorConsulta) < 0) {
      newErrors['valorConsulta'] = 'Valor da consulta não pode ser negativo';
    }

    // Address validation
    if (!formData.cep.trim()) {
      newErrors['cep'] = 'CEP é obrigatório';
    } else if (formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors['cep'] = 'CEP deve ter 8 dígitos';
    }

    if (!formData.logradouro.trim()) {
      newErrors['logradouro'] = 'Logradouro é obrigatório';
    }

    if (!formData.numero.trim()) {
      newErrors['numero'] = 'Número é obrigatório';
    }

    if (!formData.bairro.trim()) {
      newErrors['bairro'] = 'Bairro é obrigatório';
    }

    if (!formData.cidade.trim()) {
      newErrors['cidade'] = 'Cidade é obrigatória';
    }

    if (!formData.estado.trim()) {
      newErrors['estado'] = 'Estado é obrigatório';
    }

    // Working hours validation
    if (horarios.length === 0) {
      newErrors['horarios'] = 'É obrigatório definir pelo menos um dia de atendimento com horários';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Clear any previous errors
      setErrors({});
      const profissionalData: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        endereco: {
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        especialidade: formData.especialidade,
        registroProfissional: formData.registroProfissional,
        tempoConsulta: parseInt(formData.tempoConsulta),
        status: formData.status,
        createdBy: currentUser?.email || 'unknown'
      };

      if (formData.valorConsulta) {
        profissionalData.valorConsulta = parseFloat(formData.valorConsulta);
      }

      profissionalData.horariosFuncionamento = horarios;

      if (formData.observacoes) {
        profissionalData.observacoes = formData.observacoes;
      }

      if (mode === 'create') {
        const novoProfissional: any = await profissionalService.createProfissional(profissionalData);
        onSave(novoProfissional);
        
        toast.success(`Profissional ${formData.nome} foi cadastrado com sucesso! Para criar uma conta de usuário, visualize o profissional e clique em "Criar Conta".`);
      } else if (mode === 'edit' && profissional) {
        const profissionalAtualizado = await profissionalService.updateProfissional(profissional.id, profissionalData);
        onSave(profissionalAtualizado);
        toast.success(`Profissional ${formData.nome} foi atualizado com sucesso!`);
      }

      // Clear form data after successful creation
      if (mode === 'create') {
        setFormData({
          nome: '',
          email: '',
          telefone: '',
          especialidade: TipoAssistencia.Psicologica,
          registroProfissional: '',
          tempoConsulta: '60',
          valorConsulta: '',
                observacoes: '',
          status: StatusProfissional.Ativo,
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving profissional:', error);
      
      // Handle specific error types
      let errorMessage = error.message || 'Erro desconhecido';
      
      if (errorMessage.includes('email')) {
        setErrors({ email: 'Este email já está em uso por outro profissional' });
      } else if (errorMessage.includes('CPF')) {
        setErrors({ telefone: 'Este CPF já está em uso por outro profissional' });
      } else if (errorMessage.includes('registro profissional')) {
        setErrors({ registroProfissional: 'Este registro profissional já está em uso' });
      } else if (errorMessage.includes('permissions') || errorMessage.includes('permissão')) {
        errorMessage = 'Erro de permissão. Verifique se você tem acesso para criar profissionais.';
      }
      
      toast.error(`Erro ao salvar profissional: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' && '👨‍⚕️ Novo Profissional'}
            {mode === 'edit' && '✏️ Editar Profissional'}
            {mode === 'view' && '👁️ Visualizar Profissional'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === 'create' ? (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vincular a Usuário do Sistema *
                    </label>
                    {selectedUserId ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{formData.nome}</p>
                          <p className="text-sm text-gray-600">{formData.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserId('');
                            setFormData(prev => ({ ...prev, nome: '', email: '', telefone: '' }));
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Buscar usuário por nome ou email..."
                          disabled={isLoading || loadingUsers}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {loadingUsers && (
                          <p className="text-sm text-gray-500 mt-1">Carregando usuários...</p>
                        )}
                        {!loadingUsers && userSearchTerm.trim() && filteredUsers.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                            <p className="text-sm text-gray-500">Nenhum usuário encontrado</p>
                          </div>
                        )}
                        {!loadingUsers && userSearchTerm.trim() && filteredUsers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredUsers.map(user => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleUserSelect(user.id)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <p className="font-medium text-gray-900 text-sm">{user.displayName}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione o usuário que será vinculado como profissional. Nome e email serão preenchidos automaticamente.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telefone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Nome completo do profissional"
                      disabled={isReadOnly || isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nome ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    />
                    {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                      disabled={isReadOnly || isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      disabled={isReadOnly || isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telefone ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    />
                    {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade *
                </label>
                <select
                  value={formData.especialidade}
                  onChange={(e) => handleInputChange('especialidade', e.target.value as TipoAssistencia)}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                >
                  {Object.values(TipoAssistencia).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {AssistenciaEntity.formatarTipoAssistencia(tipo)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registro Profissional *
                </label>
                <input
                  type="text"
                  value={formData.registroProfissional}
                  onChange={(e) => handleInputChange('registroProfissional', e.target.value)}
                  placeholder="CRP 12345, OAB 67890, CRM 11111..."
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.registroProfissional ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.registroProfissional && <p className="text-red-500 text-sm mt-1">{errors.registroProfissional}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Consulta (minutos) *
                </label>
                <input
                  type="number"
                  value={formData.tempoConsulta}
                  onChange={(e) => handleInputChange('tempoConsulta', e.target.value)}
                  placeholder="60"
                  min="15"
                  max="240"
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tempoConsulta ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.tempoConsulta && <p className="text-red-500 text-sm mt-1">{errors.tempoConsulta}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Consulta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorConsulta}
                  onChange={(e) => handleInputChange('valorConsulta', e.target.value)}
                  placeholder="0,00 (deixe vazio se gratuito)"
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as StatusProfissional)}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                >
                  {Object.values(StatusProfissional).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horários de Atendimento *
                </label>
                <div className={`space-y-2 border rounded-md p-3 ${errors.horarios ? 'border-red-500' : 'border-gray-200'}`}>
                  {diasSemana.map(dia => {
                    const horario = horarios.find(h => h.diaSemana === dia.value);
                    const ativo = !!horario;
                    return (
                      <div key={dia.value} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 w-36 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={ativo}
                            onChange={() => handleToggleDia(dia.value)}
                            disabled={isReadOnly || isLoading}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${ativo ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                            {dia.label}
                          </span>
                        </label>
                        {ativo ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={horario!.horaInicio}
                              onChange={(e) => handleHorarioChange(dia.value, 'horaInicio', e.target.value)}
                              disabled={isReadOnly || isLoading}
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500 text-sm">até</span>
                            <input
                              type="time"
                              value={horario!.horaFim}
                              onChange={(e) => handleHorarioChange(dia.value, 'horaFim', e.target.value)}
                              disabled={isReadOnly || isLoading}
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Não atende</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.horarios && <p className="text-red-500 text-sm mt-1">{errors.horarios}</p>}
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  placeholder="12345-678"
                  maxLength={9}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cep ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.cep && <p className="text-red-500 text-sm mt-1">{errors.cep}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logradouro *
                </label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => handleInputChange('logradouro', e.target.value)}
                  placeholder="Rua, avenida, travessa..."
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.logradouro ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.logradouro && <p className="text-red-500 text-sm mt-1">{errors.logradouro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123"
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.numero ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.numero && <p className="text-red-500 text-sm mt-1">{errors.numero}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  placeholder="Apto, sala, andar..."
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bairro ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.bairro && <p className="text-red-500 text-sm mt-1">{errors.bairro}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  placeholder="Nome da cidade"
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cidade ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                />
                {errors.cidade && <p className="text-red-500 text-sm mt-1">{errors.cidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estado ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
                {errors.estado && <p className="text-red-500 text-sm mt-1">{errors.estado}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre o profissional..."
                  disabled={isReadOnly || isLoading}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {mode === 'view' ? 'Fechar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '⏳ Salvando...' : (mode === 'edit' ? '✅ Atualizar' : '👨‍⚕️ Cadastrar')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfissionalAssistenciaModal;