import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { FichaAcompanhamento, SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import { generateProntuarioPDF, generateProntuarioWord } from '../utils/prontuarioExport';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';

interface FichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: FichaAcompanhamento | null;
  onSave: (ficha: FichaAcompanhamento) => void;
  onDelete?: (fichaId: string) => void;
}

const FichaModal: React.FC<FichaModalProps> = ({ isOpen, onClose, ficha, onSave, onDelete }) => {
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

  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    if (ficha && isOpen) {
      loadSessoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha, isOpen]);

  const loadSessoes = async () => {
    if (!ficha) return;
    try {
      const sessoesFicha = await fichaRepository.getSessoesByFicha(ficha.id);
      setSessoes(sessoesFicha);
    } catch (error) {
      console.error('Error loading sessoes:', error);
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
      await loggingService.logDatabase('info', 'Comment added to ficha', `Ficha ID: ${ficha.id}, Patient: ${ficha.pacienteNome}`, currentUser as any);
      toast.success('Registro adicionado ao prontuario com sucesso!');
    } catch (error) {
      console.error('Error adding to prontuário:', error);
      await loggingService.logDatabase('error', 'Error adding comment to ficha', `Ficha ID: ${ficha.id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao adicionar registro ao prontuario');
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
        status: 'concluida' as const,
        anexos: [],
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser?.email || 'admin'
      };
      
      await fichaRepository.createSessao(ficha.id, sessaoData);
      setNovaSessao({
        tipoSessao: 'individual',
        duracao: 50,
        resumo: '',
        observacoes: '',
        evolucao: ''
      });
      loadSessoes();
      await loggingService.logDatabase('info', 'Session added to ficha', `Ficha ID: ${ficha.id}, Patient: ${ficha.pacienteNome}, Session #${proximoNumero}`, currentUser as any);
      toast.success('Sessao adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding sessao:', error);
      await loggingService.logDatabase('error', 'Error adding session to ficha', `Ficha ID: ${ficha.id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao adicionar sessao');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (novoStatus: string) => {
    if (!ficha) return;
    
    setIsLoading(true);
    try {
      const fichaAtualizada = await fichaRepository.updateFicha(ficha.id, {
        status: novoStatus as any
      });
      onSave(fichaAtualizada);
      await loggingService.logDatabase('info', 'Ficha status changed', `ID: ${ficha.id}, Patient: ${ficha.pacienteNome}, Status: ${novoStatus}`, currentUser as any);
      toast.success(`Status alterado para ${novoStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      await loggingService.logDatabase('error', 'Error changing ficha status', `Ficha ID: ${ficha.id}, Error: ${error instanceof Error ? error.message : 'Unknown'}`, currentUser as any);
      toast.error('Erro ao alterar status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !ficha) return null;

  const tabs = [
    { id: 'detalhes', label: 'Detalhes da Ficha' },
    { id: 'dados-especializados', label: 'Dados Especializados' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'prontuario', label: 'Prontuário' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            📋 Ficha: {ficha.pacienteNome}
          </h2>
          <div className="flex gap-2 items-center">
            {onDelete && ficha && (
              <button
                onClick={() => onDelete(ficha.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Excluir Ficha
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
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
                      <span className="font-medium text-gray-700">Profissional:</span>
                      <span className="ml-2 text-gray-900">{ficha.profissionalNome}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className="ml-2 text-gray-900">{ficha.tipoAssistencia}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Data Início:</span>
                      <span className="ml-2 text-gray-900">{new Date(ficha.dataInicio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <select
                        value={ficha.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isLoading}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="concluido">Concluído</option>
                        <option value="pausado">Pausado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Especializados</h3>
              
              {ficha.dadosEspecializados ? (
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessões Realizadas</h3>
                {sessoes.length === 0 ? (
                  <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
                ) : (
                  <div className="space-y-4">
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
                <h4 className="text-md font-semibold text-gray-900 mb-4">Adicionar Nova Sessão</h4>
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
                      onChange={(e) => setNovaSessao(prev => ({ ...prev, duracao: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={novaSessao.observacoes}
                    onChange={(e) => setNovaSessao(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={handleAddSessao}
                  disabled={isLoading || !novaSessao.resumo.trim()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Adicionar Sessão'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Prontuário */}
          {activeTab === 3 && (
            <div className="space-y-6">
              {/* Download Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => generateProntuarioPDF(ficha)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <span>📄</span> Baixar PDF
                </button>
                <button
                  onClick={() => generateProntuarioWord(ficha)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>📝</span> Baixar Word
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registro do Prontuário</h3>
                {ficha.observacoes ? (
                  <div className="bg-gray-50 p-4 rounded max-h-80 overflow-y-auto border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{ficha.observacoes}</pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded text-center">
                    <span className="text-4xl mb-2 block">📋</span>
                    <p className="text-gray-500">Nenhum registro no prontuário ainda.</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Adicionar Registro ao Prontuário</h4>
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Adicione suas observações sobre o acompanhamento do paciente..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddComentario}
                  disabled={isLoading || !novoComentario.trim()}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Salvando...' : 'Adicionar ao Prontuário'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FichasManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { confirm } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<FichaAcompanhamento[]>([]);
  const [fichasFiltradas, setFichasFiltradas] = useState<FichaAcompanhamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativo' | 'concluido' | 'pausado' | 'cancelado'>('todas');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'psicologica' | 'social' | 'juridica' | 'medica'>('todos');
  const [selectedFicha, setSelectedFicha] = useState<FichaAcompanhamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    currentPage, pageSize, totalItems, totalPages, paginatedItems,
    setCurrentPage, setPageSize,
  } = usePagination(fichasFiltradas);

  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterFichas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichas, searchTerm, statusFilter, tipoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Verificar role do usuário e carregar fichas apropriadas
      if (currentUser?.role === 'admin') {
        // Administrador vê todas as fichas
        const todasFichas = await fichaRepository.getAllFichas();
        setFichas(todasFichas);
      } else if (currentUser?.role === 'professional') {
        // Profissional vê apenas suas próprias fichas
        const fichasProfissional = await fichaRepository.getFichasByProfissional(currentUser.id);
        setFichas(fichasProfissional);
      } else {
        // Outros roles não devem ter acesso (não deveriam chegar aqui devido ao ProtectedRoute)
        console.error('User without permission tried to access fichas:', currentUser?.role);
        setFichas([]);
      }
    } catch (error) {
      console.error('Error loading fichas:', error);
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
        ficha.profissionalNome.toLowerCase().includes(term) ||
        ficha.objetivo.toLowerCase().includes(term) ||
        (ficha.diagnosticoInicial && ficha.diagnosticoInicial.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'todas') {
      filtered = filtered.filter(ficha => ficha.status === statusFilter);
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(ficha => ficha.tipoAssistencia === tipoFilter);
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

  const handleDeleteFicha = async (fichaId: string) => {
    const confirmed = await confirm({
      title: 'Confirmacao',
      message: 'Tem certeza que deseja excluir esta ficha de acompanhamento?',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await fichaRepository.deleteFicha(fichaId);

      setFichas(prev => prev.filter(f => f.id !== fichaId));
      setIsModalOpen(false);
      setSelectedFicha(null);
      await loggingService.logDatabase('warning', 'Ficha deleted', `ID: ${fichaId}`, currentUser as any);
      toast.success('Ficha excluida com sucesso!');
    } catch (error: any) {
      console.error('Error deleting ficha:', error);
      await loggingService.logDatabase('error', 'Error deleting ficha', `ID: ${fichaId}, Error: ${error?.message || 'Unknown'}`, currentUser as any);

      let errorMessage = 'Erro ao excluir ficha. Por favor, tente novamente.';
      if (error?.code === 'permission-denied') {
        errorMessage = 'Erro de permissao: Voce nao tem autorizacao para excluir fichas. Verifique se esta logado como administrador.';
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }

      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'concluido':
        return 'bg-blue-100 text-blue-800';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string): string => {
    switch (tipo) {
      case 'psicologica':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-green-100 text-green-800';
      case 'juridica':
        return 'bg-blue-100 text-blue-800';
      case 'medica':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const counts = {
    todas: fichas.length,
    ativo: fichas.filter(f => f.status === 'em_tratamento' || (f.status as string) === 'ativo').length,
    concluido: fichas.filter(f => f.status === 'alta' || (f.status as string) === 'concluido').length,
    pausado: fichas.filter(f => f.status === 'pausado').length,
    cancelado: fichas.filter(f => f.status === 'cancelado').length
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 Gerenciamento de Fichas</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie todas as fichas de acompanhamento do sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por paciente, profissional, objetivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="pausado">Pausado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Assistência</label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="psicologica">Psicológica</option>
                <option value="social">Social</option>
                <option value="juridica">Jurídica</option>
                <option value="medica">Médica</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {fichasFiltradas.length} de {fichas.length} fichas
          </div>
        </div>

        {/* Fichas List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-hidden">
            {fichasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📋</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ficha encontrada</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'todas' || tipoFilter !== 'todos' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Fichas são criadas automaticamente quando agendamentos são confirmados'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profissional
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Início
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((ficha) => (
                      <tr key={ficha.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ficha.pacienteNome}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ficha.profissionalNome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(ficha.tipoAssistencia)}`}>
                            {ficha.tipoAssistencia}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(ficha.dataInicio).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ficha.status)}`}>
                            {ficha.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleViewFicha(ficha)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalhes
                            </button>
                            <button
                              onClick={() => handleDeleteFicha(ficha.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {fichasFiltradas.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="fichas"
            />
          )}
        </div>
      </div>

      {/* Modal */}
      <FichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ficha={selectedFicha}
        onSave={handleSaveFicha}
        onDelete={handleDeleteFicha}
      />
    </div>
  );
};

export default FichasManagementPage;