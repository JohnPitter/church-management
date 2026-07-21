import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { FichaAcompanhamento, SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import toast from 'react-hot-toast';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import {
  FichaDetalhesTab,
  FichaDadosEspecializadosTab,
  FichaSessoesTab,
  FichaProntuarioTab,
} from './tabs';

interface FichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: FichaAcompanhamento | null;
  onSave: (ficha: FichaAcompanhamento) => void;
  onDelete?: (fichaId: string) => void;
}

const ProfessionalFichaModal: React.FC<FichaModalProps> = ({ isOpen, onClose, ficha, onSave, onDelete }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [novoComentario, setNovoComentario] = useState('');
  const [sessoes, setSessoes] = useState<SessaoAcompanhamento[]>([]);
  const [novaSessao, setNovaSessao] = useState({
    tipoSessao: 'individual' as const,
    status: 'concluida' as 'concluida' | 'nao_realizada',
    duracao: 50,
    resumo: '',
    observacoes: '',
    evolucao: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessao, setEditingSessao] = useState<SessaoAcompanhamento | null>(null);
  const [editandoDadosEspecializados, setEditandoDadosEspecializados] = useState(false);
  const [dadosEspecializadosForm, setDadosEspecializadosForm] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    if (ficha && isOpen) {
      loadSessoes();
      // Initialize specialized data form
      if (ficha.dadosEspecializados) {
        setDadosEspecializadosForm(ficha.dadosEspecializados);
      } else {
        setDadosEspecializadosForm({});
      }
      setEditandoDadosEspecializados(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha, isOpen]);

  const loadSessoes = async () => {
    if (!ficha) return;
    try {
      const sessoesFicha = await fichaRepository.getSessoesByFicha(ficha.id);
      setSessoes(sessoesFicha);
    } catch (error: any) {
      console.error('Error loading sessoes:', error);
      // Se falhar por permissões, deixa a lista vazia mas não quebra a interface
      setSessoes([]);
    }
  };

  const handleAddComentario = async () => {
    if (!ficha || !novoComentario.trim()) return;
    
    setIsLoading(true);
    try {
      const observacoesAtualizadas = ficha.observacoes 
        ? `${ficha.observacoes}\n\n[${new Date().toLocaleString('pt-BR')} - ${currentUser?.email}]\n${novoComentario.trim()}`
        : `[${new Date().toLocaleString('pt-BR')} - ${currentUser?.email}]\n${novoComentario.trim()}`;
      
      const fichaAtualizada = await fichaRepository.updateFicha(ficha.id, {
        observacoes: observacoesAtualizadas
      });
      
      onSave(fichaAtualizada);
      setNovoComentario('');
      await loggingService.logDatabase('info', 'Comment added to ficha', `Ficha ID: ${ficha.id}`, currentUser);
      toast.success('Registro adicionado ao prontuário com sucesso!');
    } catch (error: any) {
      console.error('Error adding to prontuário:', error);
      await loggingService.logDatabase('error', 'Failed to add to prontuário', `Ficha ID: ${ficha.id}, Error: ${error?.message || 'Unknown error'}`, currentUser);
      toast.error('Erro ao adicionar registro ao prontuário: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSessao = async () => {
    if (!ficha || !novaSessao.resumo.trim()) return;
    
    setIsLoading(true);
    try {
      const proximoNumero = sessoes.length + 1;
      const now = new Date();
      const sessaoData = {
        fichaId: ficha.id,
        numeroSessao: proximoNumero,
        data: now,
        ...novaSessao,
        anexos: [],
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser?.email || 'professional'
      };
      
      await fichaRepository.createSessao(ficha.id, sessaoData);
      setNovaSessao({
        tipoSessao: 'individual',
        status: 'concluida',
        duracao: 50,
        resumo: '',
        observacoes: '',
        evolucao: ''
      });
      await loadSessoes(); // Recarrega as sessões
      await loggingService.logDatabase('info', 'Session added to ficha', `Ficha ID: ${ficha.id}`, currentUser);
      toast.success('Sessão adicionada com sucesso!');
    } catch (error: any) {
      console.error('Error adding sessao:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      await loggingService.logDatabase('error', 'Failed to add session to ficha', `Ficha ID: ${ficha.id}, Error: ${errorMessage}`, currentUser);
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        toast.error('Erro de permissão. Verifique se você tem acesso a esta ficha.');
      } else {
        toast.error('Erro ao adicionar sessão: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSessao = (sessao: SessaoAcompanhamento) => {
    setEditingSessao(sessao);
    setNovaSessao({
      tipoSessao: sessao.tipoSessao as any,
      status: (sessao.status as any) || 'concluida',
      duracao: sessao.duracao,
      resumo: sessao.resumo,
      observacoes: sessao.observacoes || '',
      evolucao: sessao.evolucao || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingSessao(null);
    setNovaSessao({
      tipoSessao: 'individual',
      status: 'concluida',
      duracao: 50,
      resumo: '',
      observacoes: '',
      evolucao: ''
    });
  };

  const handleUpdateSessao = async () => {
    if (!ficha || !editingSessao || !novaSessao.resumo.trim()) return;

    setIsLoading(true);
    try {
      await fichaRepository.updateSessao(ficha.id, editingSessao.id, {
        tipoSessao: novaSessao.tipoSessao,
        status: novaSessao.status,
        duracao: novaSessao.duracao,
        resumo: novaSessao.resumo,
        observacoes: novaSessao.observacoes,
        evolucao: novaSessao.evolucao,
        updatedAt: new Date()
      });

      setEditingSessao(null);
      setNovaSessao({
        tipoSessao: 'individual',
        status: 'concluida',
        duracao: 50,
        resumo: '',
        observacoes: '',
        evolucao: ''
      });
      await loadSessoes();
      toast.success('Sessao atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating sessao:', error);
      toast.error('Erro ao atualizar sessao');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDadosEspecializados = async () => {
    if (!ficha) return;

    setIsLoading(true);
    try {
      const fichaAtualizada = await fichaRepository.updateFicha(ficha.id, {
        dadosEspecializados: dadosEspecializadosForm
      });

      onSave(fichaAtualizada);
      setEditandoDadosEspecializados(false);
      toast.success('Dados especializados salvos com sucesso!');
    } catch (error: any) {
      console.error('Error saving specialized data:', error);
      toast.error('Erro ao salvar dados especializados: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditDadosEspecializados = () => {
    if (ficha && ficha.dadosEspecializados) {
      setDadosEspecializadosForm(ficha.dadosEspecializados);
    } else {
      setDadosEspecializadosForm({});
    }
    setEditandoDadosEspecializados(false);
  };

  const handleFieldChange = (type: string, field: string, value: any) => {
    setDadosEspecializadosForm((prev: any) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [field]: value
      }
    }));
  };

  // Função de validação dos campos essenciais
  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!ficha) return false;

    // Validação por tipo de assistência
    if (ficha.tipoAssistencia === 'psicologica') {
      if (!dadosEspecializadosForm.psicologia?.queixaPrincipal?.trim()) {
        errors['psicologia.queixaPrincipal'] = 'Queixa Principal é obrigatória';
        isValid = false;
      }
      if (!dadosEspecializadosForm.psicologia?.demanda?.trim()) {
        errors['psicologia.demanda'] = 'Demanda é obrigatória';
        isValid = false;
      }
    } else if (ficha.tipoAssistencia === 'fisioterapia') {
      if (!dadosEspecializadosForm.fisioterapia?.hma?.trim()) {
        errors['fisioterapia.hma'] = 'História Médica Atual (HMA) é obrigatória';
        isValid = false;
      }
      if (dadosEspecializadosForm.fisioterapia?.escalaDor === undefined ||
          dadosEspecializadosForm.fisioterapia?.escalaDor === null ||
          dadosEspecializadosForm.fisioterapia?.escalaDor === '') {
        errors['fisioterapia.escalaDor'] = 'Escala de Dor é obrigatória';
        isValid = false;
      }
      if (!dadosEspecializadosForm.fisioterapia?.objetivosTratamento?.trim()) {
        errors['fisioterapia.objetivosTratamento'] = 'Objetivos do Tratamento são obrigatórios';
        isValid = false;
      }
    } else if (ficha.tipoAssistencia === 'nutricao') {
      if (!dadosEspecializadosForm.nutricao?.peso?.trim()) {
        errors['nutricao.peso'] = 'Peso é obrigatório';
        isValid = false;
      }
      if (!dadosEspecializadosForm.nutricao?.altura?.trim()) {
        errors['nutricao.altura'] = 'Altura é obrigatória';
        isValid = false;
      }
      if (!dadosEspecializadosForm.nutricao?.imc?.trim()) {
        errors['nutricao.imc'] = 'IMC é obrigatório';
        isValid = false;
      }
      if (!dadosEspecializadosForm.nutricao?.objetivos?.trim()) {
        errors['nutricao.objetivos'] = 'Objetivos são obrigatórios';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    setIsFormValid(isValid);
    return isValid;
  };

  // Validar sempre que o formulário mudar
  useEffect(() => {
    if (editandoDadosEspecializados) {
      validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosEspecializadosForm, editandoDadosEspecializados, ficha]);

  // Função auxiliar para verificar se um campo tem erro
  const hasError = (fieldPath: string) => {
    return !!validationErrors[fieldPath];
  };

  // Função auxiliar para obter a classe de erro
  const getInputClassName = (fieldPath: string, baseClassName: string = 'w-full px-3 py-2 border rounded-md') => {
    return hasError(fieldPath)
      ? `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500`
      : `${baseClassName} border-gray-300`;
  };

  if (!isOpen || !ficha) return null;



  const tabs = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'dados-especializados', label: 'Dados Especializados' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'prontuario', label: 'Prontuário' }
  ];


  const fichaTabProps = {
    ficha,
    sessoes,
    novaSessao,
    setNovaSessao,
    editingSessao,
    isLoading,
    novoComentario,
    setNovoComentario,
    editandoDadosEspecializados,
    setEditandoDadosEspecializados,
    dadosEspecializadosForm,
    setDadosEspecializadosForm,
    validationErrors,
    isFormValid,
    handleAddComentario,
    handleAddSessao,
    handleEditSessao,
    handleCancelEdit,
    handleSaveDadosEspecializados,
    handleCancelEditDadosEspecializados,
    handleFieldChange,
    handleUpdateSessao,
    hasError,
    getInputClassName,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            📋 Ficha: {ficha.pacienteNome}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* FichaDetalhesTab */}
          {activeTab === 0 && (
            <FichaDetalhesTab {...fichaTabProps} />
          )}

          {/* FichaDadosEspecializadosTab */}
          {activeTab === 1 && (
            <FichaDadosEspecializadosTab {...fichaTabProps} />
          )}

          {/* FichaSessoesTab */}
          {activeTab === 2 && (
            <FichaSessoesTab {...fichaTabProps} />
          )}

          {/* FichaProntuarioTab */}
          {activeTab === 3 && (
            <FichaProntuarioTab {...fichaTabProps} />
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfessionalFichaModal;
export { ProfessionalFichaModal };
