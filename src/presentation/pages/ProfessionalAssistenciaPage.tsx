import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgendamentoAssistenciaService, ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { AgendamentoAssistencia, StatusAgendamento, TipoAssistencia, AssistenciaEntity } from '@modules/assistance/assistencia/domain/entities/Assistencia';

const ProfessionalAssistenciaPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<AgendamentoAssistencia[]>([]);
  const [isProfessional, setIsProfessional] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'proximos' | 'concluidos'>('todos');

  const agendamentoService = new AgendamentoAssistenciaService();
  const profissionalService = new ProfissionalAssistenciaService();

  useEffect(() => {
    loadAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadAgendamentos = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      // Find the professional by email directly
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);
      
      if (profissional) {
        setIsProfessional(true);
        // Get appointments for this specific professional
        const agendamentosProfissional = await agendamentoService.getAgendamentosByProfissional(profissional.id);
        setAgendamentos(agendamentosProfissional);
      } else {
        setIsProfessional(false);
        setAgendamentos([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: StatusAgendamento): string => {
    switch (status) {
      case StatusAgendamento.Agendado:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case StatusAgendamento.Confirmado:
        return 'bg-green-100 text-green-800 border-green-200';
      case StatusAgendamento.EmAndamento:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case StatusAgendamento.Concluido:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case StatusAgendamento.Cancelado:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFilteredAgendamentos = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'hoje':
        return agendamentos.filter(a => {
          const agendamentoDate = new Date(a.dataHoraAgendamento);
          return agendamentoDate >= today && agendamentoDate < tomorrow;
        });
      case 'proximos':
        return agendamentos.filter(a => {
          const agendamentoDate = new Date(a.dataHoraAgendamento);
          return agendamentoDate >= now && ![StatusAgendamento.Concluido, StatusAgendamento.Cancelado].includes(a.status);
        });
      case 'concluidos':
        return agendamentos.filter(a => a.status === StatusAgendamento.Concluido);
      default:
        return agendamentos;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Component to render specific fields based on assistance type
  const renderSpecificFields = (agendamento: AgendamentoAssistencia) => {
    if (!agendamento.dadosEspecificos) return null;

    const dados = agendamento.dadosEspecificos as any;

    switch (agendamento.tipoAssistencia) {
      case TipoAssistencia.Fisioterapia:
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">📋 Informações Fisioterapêuticas</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              {dados.fisio_habitosVida && (
                <div className="col-span-2">
                  <span className="font-medium">🏃‍♂️ Hábitos de Vida:</span>
                  <p className="mt-1">{dados.fisio_habitosVida}</p>
                </div>
              )}
              {dados.fisio_hma && (
                <div className="col-span-2">
                  <span className="font-medium">📋 História Médica Atual:</span>
                  <p className="mt-1">{dados.fisio_hma}</p>
                </div>
              )}
              {dados.fisio_hmp && (
                <div className="col-span-2">
                  <span className="font-medium">📜 História Médica Pregressa:</span>
                  <p className="mt-1">{dados.fisio_hmp}</p>
                </div>
              )}
              {dados.fisio_antecedentesPessoais && (
                <div>
                  <span className="font-medium">👤 Antecedentes Pessoais:</span>
                  <p className="mt-1">{dados.fisio_antecedentesPessoais}</p>
                </div>
              )}
              {dados.fisio_antecedentesFamiliares && (
                <div>
                  <span className="font-medium">👨‍👩‍👧‍👦 Antecedentes Familiares:</span>
                  <p className="mt-1">{dados.fisio_antecedentesFamiliares}</p>
                </div>
              )}
              {dados.fisio_tratamentosRealizados && (
                <div className="col-span-2">
                  <span className="font-medium">🏥 Tratamentos Realizados:</span>
                  <p className="mt-1">{dados.fisio_tratamentosRealizados}</p>
                </div>
              )}
              {dados.fisio_medicamentos && (
                <div>
                  <span className="font-medium">💊 Medicamentos:</span>
                  <p className="mt-1">{dados.fisio_medicamentos}</p>
                </div>
              )}
              {dados.fisio_cirurgias && (
                <div>
                  <span className="font-medium">⚕️ Cirurgias:</span>
                  <p className="mt-1">{dados.fisio_cirurgias}</p>
                </div>
              )}
              {dados.fisio_escalaDor && (
                <div>
                  <span className="font-medium">📊 Escala de Dor:</span>
                  <p className="mt-1">{dados.fisio_escalaDor}/10</p>
                </div>
              )}
              {dados.fisio_objetivosTratamento && (
                <div className="col-span-2">
                  <span className="font-medium">🎯 Objetivos do Tratamento:</span>
                  <p className="mt-1">{dados.fisio_objetivosTratamento}</p>
                </div>
              )}
              {dados.fisio_planoTratamento && (
                <div className="col-span-2">
                  <span className="font-medium">📋 Plano de Tratamento:</span>
                  <p className="mt-1">{dados.fisio_planoTratamento}</p>
                </div>
              )}
            </div>
          </div>
        );

      case TipoAssistencia.Nutricao:
        return (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">🥗 Informações Nutricionais</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
              {dados.nutri_peso && (
                <div>
                  <span className="font-medium">⚖️ Peso:</span>
                  <p className="mt-1">{dados.nutri_peso} kg</p>
                </div>
              )}
              {dados.nutri_altura && (
                <div>
                  <span className="font-medium">📏 Altura:</span>
                  <p className="mt-1">{dados.nutri_altura} cm</p>
                </div>
              )}
              {dados.nutri_imc && (
                <div>
                  <span className="font-medium">📊 IMC:</span>
                  <p className="mt-1">{dados.nutri_imc}</p>
                </div>
              )}
              {dados.nutri_circunferenciaAbdominal && (
                <div>
                  <span className="font-medium">📐 Circunferência Abdominal:</span>
                  <p className="mt-1">{dados.nutri_circunferenciaAbdominal} cm</p>
                </div>
              )}
              {dados.nutri_objetivos && (
                <div className="col-span-full">
                  <span className="font-medium">🎯 Objetivos:</span>
                  <p className="mt-1">{dados.nutri_objetivos}</p>
                </div>
              )}
              {dados.nutri_restricoesAlimentares && (
                <div className="col-span-full">
                  <span className="font-medium">🚫 Restrições Alimentares:</span>
                  <p className="mt-1">{dados.nutri_restricoesAlimentares}</p>
                </div>
              )}
              {dados.nutri_alergias && (
                <div className="col-span-full">
                  <span className="font-medium">⚠️ Alergias:</span>
                  <p className="mt-1">{dados.nutri_alergias}</p>
                </div>
              )}
              {dados.nutri_preferenciasAlimentares && (
                <div className="col-span-full">
                  <span className="font-medium">❤️ Preferências Alimentares:</span>
                  <p className="mt-1">{dados.nutri_preferenciasAlimentares}</p>
                </div>
              )}
              {dados.nutri_atividadeFisica && (
                <div className="col-span-full">
                  <span className="font-medium">🏃‍♀️ Atividade Física:</span>
                  <p className="mt-1">{dados.nutri_atividadeFisica}</p>
                </div>
              )}
              {dados.nutri_consumoAgua && (
                <div>
                  <span className="font-medium">💧 Consumo de Água:</span>
                  <p className="mt-1">{dados.nutri_consumoAgua}</p>
                </div>
              )}
              {dados.nutri_habitosAlimentares && (
                <div className="col-span-full">
                  <span className="font-medium">🍽️ Hábitos Alimentares:</span>
                  <p className="mt-1">{dados.nutri_habitosAlimentares}</p>
                </div>
              )}
              {dados.nutri_suplementos && (
                <div className="col-span-full">
                  <span className="font-medium">💊 Suplementos:</span>
                  <p className="mt-1">{dados.nutri_suplementos}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredAgendamentos = getFilteredAgendamentos();
  const counts = {
    todos: agendamentos.length,
    hoje: agendamentos.filter(a => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const agendamentoDate = new Date(a.dataHoraAgendamento);
      return agendamentoDate >= today && agendamentoDate < tomorrow;
    }).length,
    proximos: agendamentos.filter(a => {
      const agendamentoDate = new Date(a.dataHoraAgendamento);
      return agendamentoDate >= new Date() && ![StatusAgendamento.Concluido, StatusAgendamento.Cancelado].includes(a.status);
    }).length,
    concluidos: agendamentos.filter(a => a.status === StatusAgendamento.Concluido).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assistencias...</p>
        </div>
      </div>
    );
  }

  if (isProfessional === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👩‍⚕️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">
            Esta área é exclusiva para profissionais cadastrados no sistema.
          </p>
          <p className="text-sm text-gray-500">
            Se você é um profissional, entre em contato com o administrador para verificar seu cadastro.
          </p>
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
              <h1 className="text-3xl font-bold text-gray-900">Minhas Assistencias</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie seus agendamentos e acompanhamentos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'todos', label: 'Todos', count: counts.todos },
              { key: 'hoje', label: 'Hoje', count: counts.hoje },
              { key: 'proximos', label: 'Próximos', count: counts.proximos },
              { key: 'concluidos', label: 'Concluídos', count: counts.concluidos }
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
              Seus Agendamentos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Total de {filteredAgendamentos.length} agendamento(s)
            </p>
          </div>
          
          <div className="overflow-hidden">
            {filteredAgendamentos.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {filter === 'todos' ? 'Nenhum agendamento encontrado.' : 
                   filter === 'hoje' ? 'Nenhum agendamento para hoje.' :
                   filter === 'proximos' ? 'Nenhum agendamento próximo.' :
                   'Nenhum agendamento concluído.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {agendamento.pacienteNome}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="font-medium mr-2">📅 Data/Hora:</span>
                            {formatDateTime(agendamento.dataHoraAgendamento)}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">📞 Telefone:</span>
                            {agendamento.pacienteTelefone || 'Não informado'}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">✉️ Email:</span>
                            {agendamento.pacienteEmail || 'Não informado'}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">🏥 Tipo:</span>
                            {AssistenciaEntity.formatarTipoAssistencia(agendamento.tipoAssistencia)}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">📍 Modalidade:</span>
                            {agendamento.modalidade}
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-2">🚨 Prioridade:</span>
                            {agendamento.prioridade}
                          </div>
                          
                          {agendamento.valor && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">💰 Valor:</span>
                              R$ {agendamento.valor.toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        {agendamento.motivo && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">📝 Motivo: </span>
                            <span className="text-gray-600">{agendamento.motivo}</span>
                          </div>
                        )}
                        
                        {agendamento.observacoesPaciente && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">📝 Obs. Paciente: </span>
                            <span className="text-gray-600">{agendamento.observacoesPaciente}</span>
                          </div>
                        )}
                        
                        {agendamento.observacoesProfissional && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">📄 Obs. Profissional: </span>
                            <span className="text-gray-600">{agendamento.observacoesProfissional}</span>
                          </div>
                        )}
                        
                        {agendamento.diagnosticoInicial && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">🩺 Diagnóstico: </span>
                            <span className="text-gray-600">{agendamento.diagnosticoInicial}</span>
                          </div>
                        )}
                        
                        {agendamento.proximoRetorno && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">📅 Próximo Retorno: </span>
                            <span className="text-gray-600">
                              {formatDateTime(agendamento.proximoRetorno)}
                            </span>
                          </div>
                        )}
                        
                        {/* Render specific fields based on assistance type */}
                        {renderSpecificFields(agendamento)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAssistenciaPage;