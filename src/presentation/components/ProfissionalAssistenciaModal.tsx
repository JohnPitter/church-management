import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  TipoAssistencia,
  StatusProfissional,
  ProfissionalAssistencia,
  AssistenciaEntity
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from './ConfirmDialog';

// Component for managing user account
interface UserAccountSectionProps {
  professional: ProfissionalAssistencia;
  onAccountCreated: (userId: string) => void;
}

const UserAccountSection: React.FC<UserAccountSectionProps> = ({ professional, onAccountCreated }) => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [localHasAccount, setLocalHasAccount] = useState(!!professional.userId);
  const profissionalService = new ProfissionalAssistenciaService();

  // Update local state when professional prop changes
  useEffect(() => {
    setLocalHasAccount(!!professional.userId);
  }, [professional.userId]);

  const handleCreateUserAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const result = await profissionalService.createUserAccountForProfessional(professional.id);
      
      if (result.success && result.temporaryPassword) {
        toast.success(
          `Conta de usuário criada com sucesso! Email: ${professional.email} | Senha temporária: ${result.temporaryPassword} | IMPORTANTE: Copie/anote esta senha temporária AGORA. Oriente o profissional a alterar a senha no primeiro acesso.`
        );
        
        // Update local state to immediately show account was created
        setLocalHasAccount(true);
        
        // Also update the professional's userId locally
        professional.userId = result.userId || 'created';
        
        // Call parent callback with userId
        onAccountCreated(result.userId || 'created');
      } else {
        toast.error(`Erro ao criar conta: ${result.error}`);
        
        // If requires reauth, redirect to login
        if (result.requiresReauth) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
    } catch (error: any) {
      toast.error(`Erro ao criar conta de usuário: ${error.message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {localHasAccount ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="font-medium text-green-700">Conta ativa</span>
            </div>
            <p className="text-sm text-gray-600">
              ✅ O profissional possui conta de usuário no sistema
            </p>
            <p className="text-sm text-gray-500 mt-1">
              📧 Email: {professional.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="font-medium text-yellow-700">Sem conta</span>
            </div>
            <p className="text-sm text-gray-600">
              ⚠️ O profissional ainda não possui conta de usuário
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Crie uma conta para que ele possa acessar o sistema
            </p>
          </div>
          <button
            onClick={handleCreateUserAccount}
            disabled={isCreatingAccount}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreatingAccount ? '⏳ Criando...' : '🔐 Criar Conta'}
          </button>
        </div>
      )}
    </div>
  );
};

interface ProfissionalAssistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profissional: ProfissionalAssistencia) => void;
  onDelete?: (profissionalId: string) => void;
  onInactivate?: (profissionalId: string, motivo?: string) => void;
  onAccountCreated?: (profissionalId: string, userId: string) => void;
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
  disponibilidade: string;
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
  onDelete,
  onInactivate,
  onAccountCreated,
  profissional,
  mode
}) => {
  const { currentUser } = useAuth();
  const { confirm, prompt: promptDialog } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localProfissional, setLocalProfissional] = useState<ProfissionalAssistencia | null>(profissional || null);

  const profissionalService = new ProfissionalAssistenciaService();

  // Sync local professional with prop changes
  useEffect(() => {
    setLocalProfissional(profissional || null);
  }, [profissional]);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    especialidade: TipoAssistencia.Psicologica,
    registroProfissional: '',
    tempoConsulta: '60',
    valorConsulta: '',
    disponibilidade: '',
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
        disponibilidade: '',
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
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        especialidade: TipoAssistencia.Psicologica,
        registroProfissional: '',
        tempoConsulta: '60',
        valorConsulta: '',
        disponibilidade: '',
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
    setErrors({});
  }, [profissional, mode, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Apply masks
    if (field === 'telefone') {
      processedValue = applyPhoneMask(value);
    } else if (field === 'cep') {
      processedValue = applyCepMask(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const applyPhoneMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const applyCepMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

      // Set default working hours (Monday to Friday, 7am to 9pm)
      profissionalData.horariosFuncionamento = [
        { diaSemana: 1, horaInicio: '07:00', horaFim: '21:00' }, // Monday
        { diaSemana: 2, horaInicio: '07:00', horaFim: '21:00' }, // Tuesday
        { diaSemana: 3, horaInicio: '07:00', horaFim: '21:00' }, // Wednesday
        { diaSemana: 4, horaInicio: '07:00', horaFim: '21:00' }, // Thursday
        { diaSemana: 5, horaInicio: '07:00', horaFim: '21:00' }, // Friday
      ];
      
      // Set default consultation duration (50 minutes)
      profissionalData.tempoConsulta = 50;

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
          disponibilidade: '',
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

  const handleInactivate = async () => {
    if (!profissional || mode !== 'view') return;

    const motivo = await promptDialog({
      title: 'Inativação de Profissional',
      message: `Você está prestes a INATIVAR o profissional "${profissional.nome}". Esta ação marca o profissional como inativo, mantém todos os dados e histórico, e pode ser revertida posteriormente.`,
      inputLabel: 'Motivo da inativação (opcional)',
      inputPlaceholder: 'Digite o motivo da inativação',
      inputDefaultValue: 'Inativação manual',
      variant: 'warning'
    });

    if (motivo === null) return; // User cancelled

    setIsLoading(true);
    try {
      await profissionalService.inativarProfissional(profissional.id, motivo);

      toast.success(`Profissional ${profissional.nome} foi inativado com sucesso!`);

      if (onInactivate) {
        onInactivate(profissional.id, motivo);
      }
    } catch (error: any) {
      console.error('Error inactivating professional:', error);
      toast.error(`Erro ao inativar profissional: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profissional || mode !== 'view') return;

    const confirmDelete = await confirm({
      title: 'Exclusão Permanente',
      message: `ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE o profissional "${profissional.nome}". Esta ação remove TODOS os dados do profissional, NÃO PODE SER DESFEITA e será bloqueada se houver agendamentos no histórico. RECOMENDAÇÃO: Use "Inativar" em vez de excluir. Tem CERTEZA que deseja EXCLUIR PERMANENTEMENTE?`,
      variant: 'danger'
    });

    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      // First attempt: normal deletion (respects appointment check)
      await profissionalService.deleteProfissionalPermanente(profissional.id, false);

      toast.success(`Profissional ${profissional.nome} foi excluído permanentemente!`);

      if (onDelete) {
        onDelete(profissional.id);
      }

      onClose();
    } catch (error: any) {
      console.error('Error deleting professional:', error);

      // Check if error is about existing appointments
      if (error.message && error.message.includes('agendamento')) {
        const forceDelete = await confirm({
          title: 'Profissional com Histórico',
          message: `${error.message}\n\nOPÇÕES: Clique "Cancelar" e use "Inativar" (RECOMENDADO) ou clique "Confirmar" para FORÇAR EXCLUSÃO com agendamentos. FORÇAR EXCLUSÃO irá excluir o profissional E seus agendamentos, perder TODO o histórico permanentemente e NÃO PODE SER DESFEITO.`,
          variant: 'danger'
        });

        if (forceDelete) {
          try {
            await profissionalService.deleteProfissionalPermanente(profissional.id, true);
            toast.success(`Profissional ${profissional.nome} foi excluído permanentemente (com histórico)!`);

            if (onDelete) {
              onDelete(profissional.id);
            }
            onClose();
          } catch (forceError: any) {
            console.error('Error force deleting professional:', forceError);
            toast.error(`Erro ao forçar exclusão: ${forceError.message}`);
          }
        }
      } else {
        let errorMessage = error.message || 'Erro desconhecido';
        if (errorMessage.includes('permissions') || errorMessage.includes('permissão')) {
          errorMessage = 'Erro de permissão. Verifique se você tem acesso para excluir profissionais.';
        }
        toast.error(`Erro ao excluir profissional: ${errorMessage}`);
      }
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
                  Disponibilidade
                </label>
                <input
                  type="text"
                  value={formData.disponibilidade}
                  onChange={(e) => handleInputChange('disponibilidade', e.target.value)}
                  placeholder="Segunda-feira 08:00-17:00, Terça-feira 14:00-18:00..."
                  disabled={isReadOnly || isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                    isReadOnly ? 'bg-gray-100' : ''
                  }`}
                />
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
            
            {/* User Account Section - Only show in view/edit mode */}
            {(mode === 'view' || mode === 'edit') && localProfissional && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🔐 Conta de Usuário
                </h3>
                <UserAccountSection 
                  professional={localProfissional} 
                  onAccountCreated={(userId: string) => {
                    // Update local professional with userId
                    if (localProfissional) {
                      const updatedProfissional = { ...localProfissional, userId };
                      setLocalProfissional(updatedProfissional);
                      
                      // Also call parent callback if provided
                      if (onAccountCreated) {
                        onAccountCreated(localProfissional.id, userId);
                      }
                    }
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          {/* Action buttons - only show in view mode for existing professionals */}
          <div className="flex space-x-3">
            {mode === 'view' && profissional && onInactivate && (
              <button
                onClick={handleInactivate}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '⏳ Inativando...' : '🔒 Inativar'}
              </button>
            )}
            {mode === 'view' && profissional && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '⏳ Excluindo...' : '🗑️ Excluir Permanente'}
              </button>
            )}
          </div>

          {/* Right side buttons */}
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