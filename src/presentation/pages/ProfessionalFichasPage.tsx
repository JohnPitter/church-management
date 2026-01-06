import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { FichaAcompanhamento, SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';

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
    duracao: 50,
    resumo: '',
    observacoes: '',
    evolucao: ''
  });
  const [isLoading, setIsLoading] = useState(false);
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
  }, [ficha, isOpen]);

  const loadSessoes = async () => {
    if (!ficha) return;
    try {
      // Debug: verificar informações do usuário
      console.log('Debug - Current user:', currentUser?.email);
      console.log('Debug - Ficha profissionalId:', ficha.profissionalId);
      console.log('Debug - User ID:', currentUser?.id);
      
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
      alert('✅ Comentário adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      alert('❌ Erro ao adicionar comentário: ' + (error?.message || 'Erro desconhecido'));
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
        duracao: 50,
        resumo: '',
        observacoes: '',
        evolucao: ''
      });
      await loadSessoes(); // Recarrega as sessões
      alert('✅ Sessão adicionada com sucesso!');
    } catch (error: any) {
      console.error('Error adding sessao:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        alert('❌ Erro de permissão. Verifique se você tem acesso a esta ficha.');
      } else {
        alert('❌ Erro ao adicionar sessão: ' + errorMessage);
      }
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
      alert('✅ Dados especializados salvos com sucesso!');
    } catch (error: any) {
      console.error('Error saving specialized data:', error);
      alert('❌ Erro ao salvar dados especializados: ' + (error?.message || 'Erro desconhecido'));
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

  // DEBUG: Log dos dados da ficha
  console.log('🔍 [Professional] Dados da ficha carregada:', {
    id: ficha.id,
    dadosEspecializados: ficha.dadosEspecializados,
    tipoAssistencia: ficha.tipoAssistencia
  });

  const tabs = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'dados-especializados', label: 'Dados Especializados' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'comentarios', label: 'Comentários' }
  ];

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
          {/* Tab 1: Detalhes */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Paciente</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nome:</span>
                      <span className="ml-2 text-gray-900">{ficha.pacienteNome}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className="ml-2 text-gray-900 capitalize">{ficha.tipoAssistencia}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Data Início:</span>
                      <span className="ml-2 text-gray-900">{new Date(ficha.dataInicio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        ficha.status === 'ativo' ? 'bg-green-100 text-green-800' :
                        ficha.status === 'concluido' ? 'bg-blue-100 text-blue-800' :
                        ficha.status === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ficha.status === 'ativo' ? 'Ativa' :
                         ficha.status === 'concluido' ? 'Concluída' :
                         ficha.status === 'pausado' ? 'Pausada' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetivo & Diagnóstico</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700 block">Objetivo:</span>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded mt-1">{ficha.objetivo || 'Não informado'}</p>
                    </div>
                    {ficha.diagnosticoInicial && (
                      <div>
                        <span className="font-medium text-gray-700 block">Diagnóstico Inicial:</span>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded mt-1">{ficha.diagnosticoInicial}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {ficha.contatoEmergencia && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato de Emergência</h3>
                  <div className="bg-red-50 p-4 rounded">
                    <p><span className="font-medium">Nome:</span> {ficha.contatoEmergencia.nome}</p>
                    <p><span className="font-medium">Parentesco:</span> {ficha.contatoEmergencia.parentesco}</p>
                    <p><span className="font-medium">Telefone:</span> {ficha.contatoEmergencia.telefone}</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Tab 2: Dados Especializados */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dados Especializados</h3>
                {!editandoDadosEspecializados && (
                  <button
                    onClick={() => setEditandoDadosEspecializados(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {ficha.dadosEspecializados ? 'Editar Dados' : 'Adicionar Dados'}
                  </button>
                )}
              </div>

              {editandoDadosEspecializados ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Tipo de Assistência:</strong> {ficha.tipoAssistencia}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Preencha os dados específicos para este tipo de assistência
                    </p>
                  </div>

                  {/* Form baseado no tipo de assistência */}
                  {ficha.tipoAssistencia === 'fisioterapia' && (
                    <div className="space-y-6">
                      <h4 className="font-semibold text-green-800 mb-3">🏥 Avaliação Fisioterapêutica</h4>

                      {/* Seção 1.0: Avaliação */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">1.0 Avaliação</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hábitos de Vida</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.habitosVida || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'habitosVida', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Descreva os hábitos de vida do paciente..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              História Médica Atual (HMA) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.hma || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'hma', e.target.value)}
                              rows={3}
                              className={getInputClassName('fisioterapia.hma')}
                              placeholder="Queixa principal, histórico da doença atual..."
                            />
                            {hasError('fisioterapia.hma') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['fisioterapia.hma']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">História Médica Pregressa (HMP)</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.hmp || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'hmp', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Histórico médico prévio..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Antecedentes Pessoais</label>
                              <textarea
                                value={dadosEspecializadosForm.fisioterapia?.antecedentesPessoais || ''}
                                onChange={(e) => handleFieldChange('fisioterapia', 'antecedentesPessoais', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Antecedentes Familiares</label>
                              <textarea
                                value={dadosEspecializadosForm.fisioterapia?.antecedentesFamiliares || ''}
                                onChange={(e) => handleFieldChange('fisioterapia', 'antecedentesFamiliares', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tratamentos Realizados</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.tratamentosRealizados || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'tratamentosRealizados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Tratamentos fisioterapêuticos anteriores..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 2.0/2.1: Exame Clínico/Físico - Apresentação do Paciente */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">2.0 Exame Clínico/Físico</h5>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">2.1 Apresentação do Paciente</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente?.includes('Deambulando') || false}
                                onChange={(e) => {
                                  const current = dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente || [];
                                  const value = 'Deambulando';
                                  const newValue = e.target.checked
                                    ? [...current, value]
                                    : current.filter((v: string) => v !== value);
                                  handleFieldChange('fisioterapia', 'apresentacaoPaciente', newValue);
                                }}
                                className="mr-2"
                              />
                              Deambulando
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente?.includes('Com apoio/auxílio') || false}
                                onChange={(e) => {
                                  const current = dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente || [];
                                  const value = 'Com apoio/auxílio';
                                  const newValue = e.target.checked
                                    ? [...current, value]
                                    : current.filter((v: string) => v !== value);
                                  handleFieldChange('fisioterapia', 'apresentacaoPaciente', newValue);
                                }}
                                className="mr-2"
                              />
                              Com apoio/auxílio
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente?.includes('Cadeirante') || false}
                                onChange={(e) => {
                                  const current = dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente || [];
                                  const value = 'Cadeirante';
                                  const newValue = e.target.checked
                                    ? [...current, value]
                                    : current.filter((v: string) => v !== value);
                                  handleFieldChange('fisioterapia', 'apresentacaoPaciente', newValue);
                                }}
                                className="mr-2"
                              />
                              Cadeirante
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente?.includes('Acamado') || false}
                                onChange={(e) => {
                                  const current = dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente || [];
                                  const value = 'Acamado';
                                  const newValue = e.target.checked
                                    ? [...current, value]
                                    : current.filter((v: string) => v !== value);
                                  handleFieldChange('fisioterapia', 'apresentacaoPaciente', newValue);
                                }}
                                className="mr-2"
                              />
                              Acamado
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente?.includes('Orientado') || false}
                                onChange={(e) => {
                                  const current = dadosEspecializadosForm.fisioterapia?.apresentacaoPaciente || [];
                                  const value = 'Orientado';
                                  const newValue = e.target.checked
                                    ? [...current, value]
                                    : current.filter((v: string) => v !== value);
                                  handleFieldChange('fisioterapia', 'apresentacaoPaciente', newValue);
                                }}
                                className="mr-2"
                              />
                              Orientado
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Seção 3.2-3.4: Exames, Medicamentos, Cirurgias */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">3. Informações Médicas</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3.2 Exames Complementares</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.examesComplementares || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'examesComplementares', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Raio-X, ressonância, tomografia, etc..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3.3 Medicamentos Utilizados</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.medicamentos || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'medicamentos', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Lista de medicamentos em uso..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3.4 Cirurgias Realizadas</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.cirurgias || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'cirurgias', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Histórico de cirurgias..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 3.5: Inspeção/Palpação */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">3.5 Inspeção/Palpação</h5>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao?.includes('Normal') || false}
                              onChange={(e) => {
                                const current = dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao || [];
                                const value = 'Normal';
                                const newValue = e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value);
                                handleFieldChange('fisioterapia', 'inspecaoPalpacao', newValue);
                              }}
                              className="mr-2"
                            />
                            Normal
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao?.includes('Edema') || false}
                              onChange={(e) => {
                                const current = dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao || [];
                                const value = 'Edema';
                                const newValue = e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value);
                                handleFieldChange('fisioterapia', 'inspecaoPalpacao', newValue);
                              }}
                              className="mr-2"
                            />
                            Edema
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao?.includes('Cicatriz incompleta') || false}
                              onChange={(e) => {
                                const current = dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao || [];
                                const value = 'Cicatriz incompleta';
                                const newValue = e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value);
                                handleFieldChange('fisioterapia', 'inspecaoPalpacao', newValue);
                              }}
                              className="mr-2"
                            />
                            Cicatriz incompleta
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao?.includes('Eritema') || false}
                              onChange={(e) => {
                                const current = dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao || [];
                                const value = 'Eritema';
                                const newValue = e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value);
                                handleFieldChange('fisioterapia', 'inspecaoPalpacao', newValue);
                              }}
                              className="mr-2"
                            />
                            Eritema
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao?.includes('Outros') || false}
                              onChange={(e) => {
                                const current = dadosEspecializadosForm.fisioterapia?.inspecaoPalpacao || [];
                                const value = 'Outros';
                                const newValue = e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value);
                                handleFieldChange('fisioterapia', 'inspecaoPalpacao', newValue);
                              }}
                              className="mr-2"
                            />
                            Outros
                          </label>
                        </div>
                      </div>

                      {/* Seção 3.6-3.8: Avaliação Física */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">Avaliação Física</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3.6 Semiologia</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.semiologia || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'semiologia', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Avaliação semiológica..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3.7 Testes Específicos</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.testesEspecificos || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'testesEspecificos', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Testes de força, amplitude, flexibilidade, etc..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              3.8 Escala Visual Analógica de Dor (EVA 0-10) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={dadosEspecializadosForm.fisioterapia?.escalaDor || ''}
                                onChange={(e) => handleFieldChange('fisioterapia', 'escalaDor', parseInt(e.target.value))}
                                className={getInputClassName('fisioterapia.escalaDor', 'w-24 px-3 py-2 border rounded-md')}
                              />
                              <span className="text-sm text-gray-600">0 = Sem dor | 10 = Pior dor imaginável</span>
                            </div>
                            {hasError('fisioterapia.escalaDor') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['fisioterapia.escalaDor']}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seção 4.0: Plano Terapêutico */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">4.0 Plano Terapêutico</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              4.1 Objetivos do Tratamento <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.objetivosTratamento || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'objetivosTratamento', e.target.value)}
                              rows={3}
                              className={getInputClassName('fisioterapia.objetivosTratamento')}
                              placeholder="Objetivos a curto, médio e longo prazo..."
                            />
                            {hasError('fisioterapia.objetivosTratamento') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['fisioterapia.objetivosTratamento']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">4.2 Recursos Terapêuticos</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.recursosTerapeuticos || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'recursosTerapeuticos', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Recursos e técnicas a serem utilizados..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">4.3 Plano de Tratamento</label>
                            <textarea
                              value={dadosEspecializadosForm.fisioterapia?.planoTratamento || ''}
                              onChange={(e) => handleFieldChange('fisioterapia', 'planoTratamento', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Plano detalhado de tratamento e cronograma..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {ficha.tipoAssistencia === 'nutricao' && (
                    <div className="space-y-6">
                      <h4 className="font-semibold text-orange-800 mb-3">🥗 Avaliação Nutricional</h4>

                      {/* Antropometria */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">Antropometria</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Peso (kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.peso || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'peso', e.target.value)}
                              className={getInputClassName('nutricao.peso')}
                            />
                            {hasError('nutricao.peso') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['nutricao.peso']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Altura (cm) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.altura || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'altura', e.target.value)}
                              className={getInputClassName('nutricao.altura')}
                            />
                            {hasError('nutricao.altura') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['nutricao.altura']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              IMC <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.imc || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'imc', e.target.value)}
                              className={getInputClassName('nutricao.imc')}
                            />
                            {hasError('nutricao.imc') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['nutricao.imc']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Circunferência Abdominal (cm)</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.circunferenciaAbdominal || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'circunferenciaAbdominal', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Circunferência da Cintura (cm)</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.circunferenciaCintura || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'circunferenciaCintura', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Circunferência do Quadril (cm)</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.circunferenciaQuadril || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'circunferenciaQuadril', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Relação Cintura/Quadril</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.relacaoCinturaQuadril || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'relacaoCinturaQuadril', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Composição Corporal</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.composicaoCorporal || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'composicaoCorporal', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentual de Gordura (%)</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.percentualGordura || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'percentualGordura', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Massa Muscular (kg)</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.massaMuscular || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'massaMuscular', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* História Alimentar */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">História Alimentar</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hábitos Alimentares</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.habitosAlimentares || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'habitosAlimentares', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Descreva os hábitos alimentares do paciente..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Refeições</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.frequenciaRefeicoes || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'frequenciaRefeicoes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Ex: 3 a 5 refeições/dia"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Horário das Refeições</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.horarioRefeicoes || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'horarioRefeicoes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Preferências Alimentares</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.preferenciasAlimentares || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'preferenciasAlimentares', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Aversões Alimentares</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.aversoes || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'aversoes', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Restrições Alimentares</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.restricoesAlimentares || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'restricoesAlimentares', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Alergias Alimentares</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.alergias || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'alergias', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Intolerâncias</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.intolerancias || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'intolerancias', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Consumo de Água (L/dia)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.consumoAgua || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'consumoAgua', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* História Clínica */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">História Clínica</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doenças Pré-existentes</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.doencasPreexistentes || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'doencasPreexistentes', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Diabetes, hipertensão, dislipidemia, etc..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos em Uso</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.medicamentosUso || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'medicamentosUso', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Suplementação</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.suplementacao || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'suplementacao', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgias Realizadas</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.cirurgiasRealizadas || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'cirurgiasRealizadas', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Histórico Familiar de Doenças</label>
                              <textarea
                                value={dadosEspecializadosForm.nutricao?.historicoFamiliarDoencas || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'historicoFamiliarDoencas', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Estilo de Vida */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">Estilo de Vida</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Atividade Física</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.atividadeFisica || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'atividadeFisica', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Tipo de atividade, intensidade..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Exercícios</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.frequenciaExercicios || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'frequenciaExercicios', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Ex: 3x/semana"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualidade do Sono</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.qualidadeSono || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'qualidadeSono', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Estresse</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.nivelEstresse || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'nivelEstresse', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tabagismo</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.tabagismo || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'tabagismo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consumo de Álcool</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.nutricao?.consumoAlcool || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'consumoAlcool', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dados Bioquímicos */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">Dados Bioquímicos</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exames Laboratoriais</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.examesLaboratoriais || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'examesLaboratoriais', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Glicemia (mg/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.glicemia || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'glicemia', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Colesterol Total (mg/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.colesterolTotal || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'colesterolTotal', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">HDL (mg/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.hdl || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'hdl', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">LDL (mg/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.ldl || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'ldl', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Triglicerídeos (mg/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.triglicerideos || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'triglicerideos', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobina (g/dL)</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.hemoglobina || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'hemoglobina', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Outros Exames</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.outrosExames || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'outrosExames', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Avaliação Nutricional */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">Avaliação Nutricional</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico Nutricional</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.diagnosticoNutricional || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'diagnosticoNutricional', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Necessidades Energéticas</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.necessidadesEnergeticas || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'necessidadesEnergeticas', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Ex: 2000 kcal/dia"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Necessidades Proteicas</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.nutricao?.necessidadesProteicas || ''}
                                onChange={(e) => handleFieldChange('nutricao', 'necessidadesProteicas', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Ex: 80g/dia"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Objetivos <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.objetivos || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'objetivos', e.target.value)}
                              rows={3}
                              className={getInputClassName('nutricao.objetivos')}
                              placeholder="Objetivos nutricionais a curto, médio e longo prazo..."
                            />
                            {hasError('nutricao.objetivos') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['nutricao.objetivos']}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Plano Alimentar */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-900 mb-3">Plano Alimentar</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Orientações Nutricionais</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.orientacoesNutricionais || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'orientacoesNutricionais', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plano Alimentar</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.planoAlimentar || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'planoAlimentar', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Detalhamento do plano alimentar..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Metas Nutricionais</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.metasNutricionais || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'metasNutricionais', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Acompanhamento</label>
                            <textarea
                              value={dadosEspecializadosForm.nutricao?.acompanhamento || ''}
                              onChange={(e) => handleFieldChange('nutricao', 'acompanhamento', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Frequência de retorno, ajustes necessários..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {ficha.tipoAssistencia === 'psicologica' && (
                    <div className="space-y-6">
                      <h4 className="font-semibold text-purple-800 mb-3">🧠 Anamnese Psicológica</h4>

                      {/* Seção 1: Identificação */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">1. Identificação</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.profissao || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'profissao', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Religião</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.religiao || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'religiao', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.estadoCivil || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'estadoCivil', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filhos</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.filhos || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'filhos', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Quantidade e idades"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.contatoTelefone || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'contatoTelefone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input
                              type="email"
                              value={dadosEspecializadosForm.psicologia?.contatoEmail || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'contatoEmail', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.contatoEndereco || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'contatoEndereco', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 2: História do Paciente */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">2. História do Paciente</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desenvolvimento Pessoal</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.desenvolvimentoPessoal || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'desenvolvimentoPessoal', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Histórico de desenvolvimento pessoal..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Puberdade</label>
                              <textarea
                                value={dadosEspecializadosForm.psicologia?.puberdade || ''}
                                onChange={(e) => handleFieldChange('psicologia', 'puberdade', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">História Sexual</label>
                              <textarea
                                value={dadosEspecializadosForm.psicologia?.historiaSexual || ''}
                                onChange={(e) => handleFieldChange('psicologia', 'historiaSexual', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hábitos</label>
                              <textarea
                                value={dadosEspecializadosForm.psicologia?.habitos || ''}
                                onChange={(e) => handleFieldChange('psicologia', 'habitos', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Naturalidade</label>
                              <input
                                type="text"
                                value={dadosEspecializadosForm.psicologia?.naturalidade || ''}
                                onChange={(e) => handleFieldChange('psicologia', 'naturalidade', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sintomas Neuróticos</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.sintomasNeuroticos || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'sintomasNeuroticos', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Memórias Significativas</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.memoriasSignificativas || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'memoriasSignificativas', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* História Familiar */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">História Familiar</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mãe (vivo/falecido, idade, trabalho, relacionamento)</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.maeDados || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'maeDados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pai (vivo/falecido, idade, trabalho, relacionamento)</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.paiDados || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'paiDados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Irmãos</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.irmaosDados || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'irmaosDados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filhos (se houver)</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.filhosDados || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'filhosDados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avós</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.avosDados || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'avosDados', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Residência e Bairro</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.residenciaBairro || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'residenciaBairro', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Histórico de Violência</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.historicoViolencia || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'historicoViolencia', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apoio Familiar</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.apoioFamiliar || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'apoioFamiliar', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reação Familiar aos Sintomas</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.reacaoFamiliarSintomas || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'reacaoFamiliarSintomas', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* História Escolar */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">História Escolar</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Formação Acadêmica</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.formacaoAcademica || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'formacaoAcademica', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experiências Escolares</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.experienciasEscolares || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'experienciasEscolares', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Situações Constrangedoras na Escola</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.situacoesConstrangedorasEscola || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'situacoesConstrangedorasEscola', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sentimento de Perseguição na Escola</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.perseguicaoEscola || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'perseguicaoEscola', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Conforto no Ambiente Escolar</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.ambienteEscolar || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'ambienteEscolar', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* História Profissional */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">História Profissional</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Atual</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.empresaAtual || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'empresaAtual', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Satisfação com o Trabalho</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.satisfacaoTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'satisfacaoTrabalho', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Situações Importantes no Trabalho</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.situacoesImportantesTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'situacoesImportantesTrabalho', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Situações Constrangedoras no Trabalho</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.situacoesConstrangedorasTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'situacoesConstrangedorasTrabalho', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sentimento de Perseguição no Trabalho</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.perseguicaoTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'perseguicaoTrabalho', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente de Trabalho</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.ambienteTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'ambienteTrabalho', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Problemas no Local de Trabalho</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.problemasTrabalho || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'problemasTrabalho', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Relacionamentos Interpessoais */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">Relacionamentos Interpessoais</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dificuldade em se Relacionar</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.dificuldadeRelacionar || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'dificuldadeRelacionar', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Amigos</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.numeroAmigos || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'numeroAmigos', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Personalidade</label>
                            <select
                              value={dadosEspecializadosForm.psicologia?.tipoPersonalidade || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'tipoPersonalidade', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Selecione...</option>
                              <option value="Introvertido">Introvertido</option>
                              <option value="Extrovertido">Extrovertido</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comportamento Social</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.comportamentoSocial || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'comportamentoSocial', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amizades</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.amizades || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'amizades', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Relacionamento com Vizinhança */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">Vizinhança e Relações Familiares</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Residência</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.tempoResidencia || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'tempoResidencia', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Satisfação com a Vizinhança</label>
                            <input
                              type="text"
                              value={dadosEspecializadosForm.psicologia?.satisfacaoVizinhanca || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'satisfacaoVizinhanca', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Relacionamento Familiar Após Apresentação dos Sintomas</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.relacionamentoFamiliarAposSintomas || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'relacionamentoFamiliarAposSintomas', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 3: História Clínica */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">3. História Clínica</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos em Uso</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.medicamentosUso || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'medicamentosUso', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgias Realizadas</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.cirurgiasRealizadas || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'cirurgiasRealizadas', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Puerpério (se aplicável)</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.puerperio || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'puerperio', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Histórico de Doença Mental na Família</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.doencaMentalFamiliar || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'doencaMentalFamiliar', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Uso de Substâncias (pais/avós)</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.usoSubstanciasPaisMaes || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'usoSubstanciasPaisMaes', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 4: História Psicológica */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">4. História Psicológica</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tratamento Psicológico Anterior</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.tratamentoPsicologicoAnterior || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'tratamentoPsicologicoAnterior', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tratamento Psiquiátrico Anterior</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.tratamentoPsiquiatricoAnterior || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'tratamentoPsiquiatricoAnterior', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Uso de Medicamentos Psicotrópicos</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.usoMedicamentosPsicotropicos || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'usoMedicamentosPsicotropicos', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Uso de Substâncias Psicoativas</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.usoSubstanciasPsicoativas || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'usoSubstanciasPsicoativas', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 5: Queixas do Paciente */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">5. Queixas do Paciente</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Queixa Principal <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.queixaPrincipal || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'queixaPrincipal', e.target.value)}
                              rows={3}
                              className={getInputClassName('psicologia.queixaPrincipal')}
                              placeholder="Descreva a queixa principal do paciente..."
                            />
                            {hasError('psicologia.queixaPrincipal') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['psicologia.queixaPrincipal']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Queixa Secundária</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.queixaSecundaria || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'queixaSecundaria', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expectativas da Sessão</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.expectativasSessao || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'expectativasSessao', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seção 6: Informações Complementares */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">6. Informações Complementares</h5>
                        <div>
                          <textarea
                            value={dadosEspecializadosForm.psicologia?.informacoesComplementares || ''}
                            onChange={(e) => handleFieldChange('psicologia', 'informacoesComplementares', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Outras informações relevantes..."
                          />
                        </div>
                      </div>

                      {/* Seção 7: Classificação do Paciente */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">7. Classificação do Paciente</h5>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Atenção</label>
                          <select
                            value={dadosEspecializadosForm.psicologia?.classificacao || ''}
                            onChange={(e) => handleFieldChange('psicologia', 'classificacao', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Selecione...</option>
                            <option value="VERMELHO">🔴 VERMELHO - Atenção Crítica</option>
                            <option value="AMARELO">🟡 AMARELO - Estado de Atenção</option>
                            <option value="ROXO">🟣 ROXO - Baixa Complexidade</option>
                            <option value="VERDE">🟢 VERDE - Estado de Equilíbrio</option>
                          </select>
                        </div>
                      </div>

                      {/* Seção 8 e 9: Demandas */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-3">8. Demandas</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Demanda <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.demanda || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'demanda', e.target.value)}
                              rows={3}
                              className={getInputClassName('psicologia.demanda')}
                              placeholder="Descreva a demanda..."
                            />
                            {hasError('psicologia.demanda') && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors['psicologia.demanda']}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa da Demanda</label>
                            <textarea
                              value={dadosEspecializadosForm.psicologia?.justificativaDemanda || ''}
                              onChange={(e) => handleFieldChange('psicologia', 'justificativaDemanda', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Justifique a demanda..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    {!isFormValid && Object.keys(validationErrors).length > 0 && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800 mb-2">
                          ⚠️ Por favor, preencha os campos obrigatórios:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {Object.values(validationErrors).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleCancelEditDadosEspecializados}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveDadosEspecializados}
                        disabled={isLoading || !isFormValid}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Salvando...' : 'Salvar Dados'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : ficha.dadosEspecializados ? (
                <div className="space-y-6">
                  {/* Fisioterapia */}
                  {ficha.tipoAssistencia === 'fisioterapia' && ficha.dadosEspecializados.fisioterapia && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-4">🏥 Avaliação Fisioterapêutica</h4>

                      {/* 1.0 Avaliação */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-green-900">1.0 Avaliação</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ficha.dadosEspecializados.fisioterapia.habitosVida && (
                            <div>
                              <span className="font-medium text-gray-700">Hábitos de Vida:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.habitosVida}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.hma && (
                            <div>
                              <span className="font-medium text-gray-700">História Médica Atual (HMA):</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.hma}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.hmp && (
                            <div>
                              <span className="font-medium text-gray-700">História Médica Pregressa (HMP):</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.hmp}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.antecedentesPessoais && (
                            <div>
                              <span className="font-medium text-gray-700">Antecedentes Pessoais:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.antecedentesPessoais}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.antecedentesFamiliares && (
                            <div>
                              <span className="font-medium text-gray-700">Antecedentes Familiares:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.antecedentesFamiliares}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.tratamentosRealizados && (
                            <div>
                              <span className="font-medium text-gray-700">Tratamentos Realizados:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.tratamentosRealizados}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2.0 Exame Clínico/Físico */}
                      {ficha.dadosEspecializados.fisioterapia.apresentacaoPaciente && ficha.dadosEspecializados.fisioterapia.apresentacaoPaciente.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-green-900">2.0 Exame Clínico/Físico</h5>
                          <div>
                            <span className="font-medium text-gray-700">Apresentação do Paciente:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {ficha.dadosEspecializados.fisioterapia.apresentacaoPaciente.map((item, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3.0 Informações Médicas */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-green-900">3. Informações Médicas</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ficha.dadosEspecializados.fisioterapia.examesComplementares && (
                            <div>
                              <span className="font-medium text-gray-700">Exames Complementares:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.examesComplementares}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.medicamentos && (
                            <div>
                              <span className="font-medium text-gray-700">Medicamentos Utilizados:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.medicamentos}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.cirurgias && (
                            <div>
                              <span className="font-medium text-gray-700">Cirurgias Realizadas:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.cirurgias}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.semiologia && (
                            <div>
                              <span className="font-medium text-gray-700">Semiologia:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.semiologia}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.testesEspecificos && (
                            <div>
                              <span className="font-medium text-gray-700">Testes Específicos:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.testesEspecificos}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.escalaDor !== undefined && ficha.dadosEspecializados.fisioterapia.escalaDor !== null && (
                            <div>
                              <span className="font-medium text-gray-700">Escala de Dor (EVA):</span>
                              <p className="text-gray-600 mt-1 text-lg font-semibold">{ficha.dadosEspecializados.fisioterapia.escalaDor}/10</p>
                            </div>
                          )}
                        </div>
                        {ficha.dadosEspecializados.fisioterapia.inspecaoPalpacao && ficha.dadosEspecializados.fisioterapia.inspecaoPalpacao.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Inspeção/Palpação:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {ficha.dadosEspecializados.fisioterapia.inspecaoPalpacao.map((item, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4.0 Plano Terapêutico */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-green-900">4.0 Plano Terapêutico</h5>
                        <div className="grid grid-cols-1 gap-4">
                          {ficha.dadosEspecializados.fisioterapia.objetivosTratamento && (
                            <div>
                              <span className="font-medium text-gray-700">Objetivos do Tratamento:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.objetivosTratamento}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.recursosTerapeuticos && (
                            <div>
                              <span className="font-medium text-gray-700">Recursos Terapêuticos:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.recursosTerapeuticos}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.fisioterapia.planoTratamento && (
                            <div>
                              <span className="font-medium text-gray-700">Plano de Tratamento:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.fisioterapia.planoTratamento}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nutrição */}
                  {ficha.tipoAssistencia === 'nutricao' && ficha.dadosEspecializados.nutricao && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4">🥗 Avaliação Nutricional</h4>

                      {/* Antropometria */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-orange-900">Antropometria</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {ficha.dadosEspecializados.nutricao.peso && (
                            <div>
                              <span className="font-medium text-gray-700">Peso:</span>
                              <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.peso} kg</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.altura && (
                            <div>
                              <span className="font-medium text-gray-700">Altura:</span>
                              <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.altura} cm</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.imc && (
                            <div>
                              <span className="font-medium text-gray-700">IMC:</span>
                              <p className="text-gray-600 mt-1 font-semibold">{ficha.dadosEspecializados.nutricao.imc}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.circunferenciaAbdominal && (
                            <div>
                              <span className="font-medium text-gray-700">Circ. Abdominal:</span>
                              <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.circunferenciaAbdominal} cm</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.percentualGordura && (
                            <div>
                              <span className="font-medium text-gray-700">% Gordura:</span>
                              <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.percentualGordura}%</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.massaMuscular && (
                            <div>
                              <span className="font-medium text-gray-700">Massa Muscular:</span>
                              <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.massaMuscular} kg</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* História Alimentar */}
                      {(ficha.dadosEspecializados.nutricao.habitosAlimentares || ficha.dadosEspecializados.nutricao.restricoesAlimentares) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-orange-900">História Alimentar</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ficha.dadosEspecializados.nutricao.habitosAlimentares && (
                              <div>
                                <span className="font-medium text-gray-700">Hábitos Alimentares:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.habitosAlimentares}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.restricoesAlimentares && (
                              <div>
                                <span className="font-medium text-gray-700">Restrições Alimentares:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.restricoesAlimentares}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.alergias && (
                              <div>
                                <span className="font-medium text-gray-700">Alergias:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.alergias}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.consumoAgua && (
                              <div>
                                <span className="font-medium text-gray-700">Consumo de Água:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.consumoAgua} L/dia</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dados Bioquímicos */}
                      {(ficha.dadosEspecializados.nutricao.glicemia || ficha.dadosEspecializados.nutricao.colesterolTotal) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-orange-900">Dados Bioquímicos</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {ficha.dadosEspecializados.nutricao.glicemia && (
                              <div>
                                <span className="font-medium text-gray-700">Glicemia:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.glicemia} mg/dL</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.colesterolTotal && (
                              <div>
                                <span className="font-medium text-gray-700">Colesterol Total:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.colesterolTotal} mg/dL</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.hdl && (
                              <div>
                                <span className="font-medium text-gray-700">HDL:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.hdl} mg/dL</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.ldl && (
                              <div>
                                <span className="font-medium text-gray-700">LDL:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.ldl} mg/dL</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.nutricao.triglicerideos && (
                              <div>
                                <span className="font-medium text-gray-700">Triglicerídeos:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.nutricao.triglicerideos} mg/dL</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Avaliação e Objetivos */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-orange-900">Avaliação e Objetivos</h5>
                        <div className="grid grid-cols-1 gap-4">
                          {ficha.dadosEspecializados.nutricao.diagnosticoNutricional && (
                            <div>
                              <span className="font-medium text-gray-700">Diagnóstico Nutricional:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.diagnosticoNutricional}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.objetivos && (
                            <div>
                              <span className="font-medium text-gray-700">Objetivos:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.objetivos}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.nutricao.planoAlimentar && (
                            <div>
                              <span className="font-medium text-gray-700">Plano Alimentar:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.nutricao.planoAlimentar}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Psicologia */}
                  {ficha.tipoAssistencia === 'psicologica' && ficha.dadosEspecializados.psicologia && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-4">🧠 Anamnese Psicológica</h4>

                      {/* Queixas e Demandas */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-purple-900">Queixas e Demandas</h5>
                        <div className="grid grid-cols-1 gap-4">
                          {ficha.dadosEspecializados.psicologia.queixaPrincipal && (
                            <div>
                              <span className="font-medium text-gray-700">Queixa Principal:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.queixaPrincipal}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.psicologia.queixaSecundaria && (
                            <div>
                              <span className="font-medium text-gray-700">Queixa Secundária:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.queixaSecundaria}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.psicologia.demanda && (
                            <div>
                              <span className="font-medium text-gray-700">Demanda:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.demanda}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.psicologia.justificativaDemanda && (
                            <div>
                              <span className="font-medium text-gray-700">Justificativa da Demanda:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.justificativaDemanda}</p>
                            </div>
                          )}
                          {ficha.dadosEspecializados.psicologia.classificacao && (
                            <div>
                              <span className="font-medium text-gray-700">Classificação do Paciente:</span>
                              <p className="text-gray-600 mt-1 font-semibold">{ficha.dadosEspecializados.psicologia.classificacao}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* História do Paciente */}
                      {(ficha.dadosEspecializados.psicologia.desenvolvimentoPessoal || ficha.dadosEspecializados.psicologia.habitos) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">História do Paciente</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ficha.dadosEspecializados.psicologia.desenvolvimentoPessoal && (
                              <div>
                                <span className="font-medium text-gray-700">Desenvolvimento Pessoal:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.desenvolvimentoPessoal}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.habitos && (
                              <div>
                                <span className="font-medium text-gray-700">Hábitos:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.habitos}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* História Familiar */}
                      {(ficha.dadosEspecializados.psicologia.maeDados || ficha.dadosEspecializados.psicologia.paiDados) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">História Familiar</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ficha.dadosEspecializados.psicologia.maeDados && (
                              <div>
                                <span className="font-medium text-gray-700">Mãe:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.maeDados}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.paiDados && (
                              <div>
                                <span className="font-medium text-gray-700">Pai:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.paiDados}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.apoioFamiliar && (
                              <div>
                                <span className="font-medium text-gray-700">Apoio Familiar:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.apoioFamiliar}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.reacaoFamiliarSintomas && (
                              <div>
                                <span className="font-medium text-gray-700">Reação Familiar aos Sintomas:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.reacaoFamiliarSintomas}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* História Escolar e Profissional */}
                      {(ficha.dadosEspecializados.psicologia.formacaoAcademica || ficha.dadosEspecializados.psicologia.empresaAtual) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">História Escolar e Profissional</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ficha.dadosEspecializados.psicologia.formacaoAcademica && (
                              <div>
                                <span className="font-medium text-gray-700">Formação Acadêmica:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.formacaoAcademica}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.empresaAtual && (
                              <div>
                                <span className="font-medium text-gray-700">Empresa Atual:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.empresaAtual}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.satisfacaoTrabalho && (
                              <div>
                                <span className="font-medium text-gray-700">Satisfação com o Trabalho:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.satisfacaoTrabalho}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Relacionamentos Interpessoais */}
                      {(ficha.dadosEspecializados.psicologia.numeroAmigos || ficha.dadosEspecializados.psicologia.tipoPersonalidade) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">Relacionamentos Interpessoais</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ficha.dadosEspecializados.psicologia.tipoPersonalidade && (
                              <div>
                                <span className="font-medium text-gray-700">Tipo de Personalidade:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.tipoPersonalidade}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.numeroAmigos && (
                              <div>
                                <span className="font-medium text-gray-700">Número de Amigos:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.numeroAmigos}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.dificuldadeRelacionar && (
                              <div>
                                <span className="font-medium text-gray-700">Dificuldade em Relacionar:</span>
                                <p className="text-gray-600 mt-1">{ficha.dadosEspecializados.psicologia.dificuldadeRelacionar}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* História Clínica e Psicológica */}
                      {(ficha.dadosEspecializados.psicologia.medicamentosUso || ficha.dadosEspecializados.psicologia.tratamentoPsicologicoAnterior) && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">História Clínica e Psicológica</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ficha.dadosEspecializados.psicologia.medicamentosUso && (
                              <div>
                                <span className="font-medium text-gray-700">Medicamentos em Uso:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.medicamentosUso}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.tratamentoPsicologicoAnterior && (
                              <div>
                                <span className="font-medium text-gray-700">Tratamento Psicológico Anterior:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.tratamentoPsicologicoAnterior}</p>
                              </div>
                            )}
                            {ficha.dadosEspecializados.psicologia.tratamentoPsiquiatricoAnterior && (
                              <div>
                                <span className="font-medium text-gray-700">Tratamento Psiquiátrico Anterior:</span>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.tratamentoPsiquiatricoAnterior}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Informações Complementares */}
                      {ficha.dadosEspecializados.psicologia.informacoesComplementares && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-purple-900">Informações Complementares</h5>
                          <div>
                            <p className="text-gray-600 whitespace-pre-wrap">{ficha.dadosEspecializados.psicologia.informacoesComplementares}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📋</div>
                  <p className="text-gray-500">Nenhum dado especializado disponível para esta ficha.</p>
                  <p className="text-gray-400 text-sm mt-1">Os dados especializados são coletados durante o agendamento.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sessões */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessões Realizadas ({sessoes.length})</h3>
                {sessoes.length === 0 ? (
                  <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {sessoes.map((sessao) => (
                      <div key={sessao.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            Sessão #{sessao.numeroSessao} - {sessao.tipoSessao}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(sessao.data).toLocaleDateString('pt-BR')} ({sessao.duracao}min)
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{sessao.resumo}</p>
                        {sessao.observacoes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Observações:</span> {sessao.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nova Sessão */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Registrar Nova Sessão</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={novaSessao.tipoSessao}
                      onChange={(e) => setNovaSessao(prev => ({ ...prev, tipoSessao: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="individual">Individual</option>
                      <option value="grupo">Grupo</option>
                      <option value="familiar">Familiar</option>
                      <option value="avaliacao">Avaliação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                    <input
                      type="number"
                      value={novaSessao.duracao}
                      onChange={(e) => setNovaSessao(prev => ({ ...prev, duracao: parseInt(e.target.value) || 50 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="15"
                      max="180"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resumo da Sessão *</label>
                  <textarea
                    value={novaSessao.resumo}
                    onChange={(e) => setNovaSessao(prev => ({ ...prev, resumo: e.target.value }))}
                    placeholder="Descreva o que foi trabalhado na sessão..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">{novaSessao.resumo.length}/1000 caracteres</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações Adicionais</label>
                  <textarea
                    value={novaSessao.observacoes}
                    onChange={(e) => setNovaSessao(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre evolução, próximos passos..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">{novaSessao.observacoes.length}/500 caracteres</p>
                </div>
                <button
                  onClick={handleAddSessao}
                  disabled={isLoading || !novaSessao.resumo.trim()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : '📝 Registrar Sessão'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Comentários */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Observações</h3>
                {ficha.observacoes ? (
                  <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{ficha.observacoes}</pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma observação registrada ainda.</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Adicionar Observação</h4>
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Registre suas observações sobre o acompanhamento do paciente..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{novoComentario.length}/1000 caracteres</p>
                  <button
                    onClick={handleAddComentario}
                    disabled={isLoading || !novoComentario.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : '💬 Adicionar Observação'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfessionalFichasPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<FichaAcompanhamento[]>([]);
  const [fichasFiltradas, setFichasFiltradas] = useState<FichaAcompanhamento[]>([]);
  const [filter, setFilter] = useState<'todas' | 'ativo' | 'concluido' | 'pausado'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFicha, setSelectedFicha] = useState<FichaAcompanhamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const profissionalService = new ProfissionalAssistenciaService();
  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    filterFichas();
  }, [fichas, searchTerm, filter]);

  const loadData = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      // Find the professional by email directly
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);
      
      if (profissional) {
        // Get patient records for this specific professional
        const fichasProfissional = await fichaRepository.getFichasByProfissional(profissional.id);
        setFichas(fichasProfissional);
      } else {
        console.warn('Professional profile not found for email:', currentUser.email);
        setFichas([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFichas = () => {
    let filtered = fichas;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ficha =>
        ficha.pacienteNome.toLowerCase().includes(term) ||
        (ficha.objetivo && ficha.objetivo.toLowerCase().includes(term)) ||
        (ficha.diagnosticoInicial && ficha.diagnosticoInicial.toLowerCase().includes(term))
      );
    }

    if (filter !== 'todas') {
      filtered = filtered.filter(ficha => ficha.status === filter);
    }

    setFichasFiltradas(filtered);
  };

  const handleViewFicha = (ficha: FichaAcompanhamento) => {
    setSelectedFicha(ficha);
    setIsModalOpen(true);
  };

  const handleSaveFicha = (fichaAtualizada: FichaAcompanhamento) => {
    setFichas(prev => prev.map(f => f.id === fichaAtualizada.id ? fichaAtualizada : f));
    setSelectedFicha(fichaAtualizada);
  };

  const handleChangeStatus = async (ficha: FichaAcompanhamento) => {
    const statusOptions = [
      { value: 'ativo', label: 'Ativo' },
      { value: 'pausado', label: 'Pausado' },
      { value: 'concluido', label: 'Concluído' },
      { value: 'cancelado', label: 'Cancelado' }
    ];

    const currentIndex = statusOptions.findIndex(option => option.value === ficha.status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex].value;

    const confirmed = window.confirm(
      `Alterar status da ficha de ${ficha.pacienteNome} de "${statusOptions[currentIndex]?.label}" para "${statusOptions[nextIndex].label}"?`
    );

    if (confirmed) {
      try {
        const updatedFicha = await fichaRepository.updateFicha(ficha.id, { 
          status: newStatus as any,
          updatedAt: new Date()
        });
        setFichas(prev => prev.map(f => f.id === ficha.id ? updatedFicha : f));
      } catch (error) {
        console.error('Erro ao alterar status da ficha:', error);
        alert('Erro ao alterar status da ficha. Por favor, tente novamente.');
      }
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'concluido':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  
  const counts = {
    todas: fichas.length,
    ativo: fichas.filter(f => f.status === 'ativo').length,
    concluido: fichas.filter(f => f.status === 'concluido').length,
    pausado: fichas.filter(f => f.status === 'pausado').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fichas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fichas de Acompanhamento</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie as fichas de acompanhamento dos seus pacientes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filtros */}
        <div className="mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por paciente, objetivo ou diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'todas', label: 'Todas', count: counts.todas },
              { key: 'ativo', label: 'Ativas', count: counts.ativo },
              { key: 'concluido', label: 'Concluídas', count: counts.concluido },
              { key: 'pausado', label: 'Pausadas', count: counts.pausado }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Suas Fichas de Acompanhamento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Total de {fichasFiltradas.length} ficha(s)
            </p>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ℹ️ As fichas de acompanhamento são criadas automaticamente quando um agendamento é confirmado
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            {fichasFiltradas.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {filter === 'todas' ? 'Nenhuma ficha encontrada.' : 
                   filter === 'ativo' ? 'Nenhuma ficha ativa.' :
                   filter === 'concluido' ? 'Nenhuma ficha concluída.' :
                   'Nenhuma ficha pausada.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {fichasFiltradas.map((ficha) => (
                  <div key={ficha.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {ficha.pacienteNome}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ficha.status)}`}>
                            {ficha.status === 'ativo' ? 'Ativa' :
                             ficha.status === 'concluido' ? 'Concluída' :
                             ficha.status === 'pausado' ? 'Pausada' :
                             'Cancelada'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <span className="font-medium mr-2">📅 Início:</span>
                            {formatDate(ficha.dataInicio)}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">🏥 Tipo:</span>
                            {ficha.tipoAssistencia === 'psicologica' ? 'Psicológica' :
                             ficha.tipoAssistencia === 'social' ? 'Social' :
                             ficha.tipoAssistencia === 'juridica' ? 'Jurídica' : 'Médica'}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">👤 Paciente ID:</span>
                            {ficha.pacienteId}
                          </div>
                        </div>
                        
                        {ficha.objetivo && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">🎯 Objetivo: </span>
                            <span className="text-gray-600">{ficha.objetivo}</span>
                          </div>
                        )}
                        
                        {ficha.diagnosticoInicial && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">🩺 Diagnóstico Inicial: </span>
                            <span className="text-gray-600">{ficha.diagnosticoInicial}</span>
                          </div>
                        )}
                        
                        {ficha.observacoes && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">📝 Observações: </span>
                            <span className="text-gray-600">{ficha.observacoes}</span>
                          </div>
                        )}
                        
                        {ficha.contatoEmergencia && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">🚨 Contato de Emergência: </span>
                            <span className="text-gray-600">
                              {ficha.contatoEmergencia.nome} ({ficha.contatoEmergencia.parentesco}) - {ficha.contatoEmergencia.telefone}
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                          <button
                            onClick={() => handleViewFicha(ficha)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => handleChangeStatus(ficha)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Alterar Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ficha Modal */}
      <ProfessionalFichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ficha={selectedFicha}
        onSave={handleSaveFicha}
      />
    </div>
  );
};

export default ProfessionalFichasPage;