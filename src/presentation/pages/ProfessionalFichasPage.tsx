import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgendamentoAssistenciaService, ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { FichaAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import { AgendamentoAssistencia } from '@modules/assistance/assistencia/domain/entities/Assistencia';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';
import PageShell from '../components/common/PageShell';
import { ProfessionalFichaModal } from './fichas/ProfessionalFichaModal';

const ProfessionalFichasPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { confirm } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<FichaAcompanhamento[]>([]);
  const [fichasFiltradas, setFichasFiltradas] = useState<FichaAcompanhamento[]>([]);
  const { paginatedItems: paginatedFichas, currentPage: fichasCurrentPage, totalPages: fichasTotalPages, totalItems: fichasTotalItems, pageSize: fichasPageSize, setCurrentPage: fichasSetCurrentPage, setPageSize: fichasSetPageSize } = usePagination(fichasFiltradas);
  const [filter, setFilter] = useState<'todas' | 'atendimento_hoje' | 'em_tratamento' | 'alta' | 'pausado' | 'cancelado'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [agendamentosHoje, setAgendamentosHoje] = useState<AgendamentoAssistencia[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<FichaAcompanhamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const profissionalService = new ProfissionalAssistenciaService();
  const agendamentoService = new AgendamentoAssistenciaService();
  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    filterFichas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichas, searchTerm, filter, agendamentosHoje]);

  const loadData = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);

      if (profissional) {
        await agendamentoService.syncFichasForProfissionalAgenda(profissional.id, currentUser.email);
        const [fichasProfissional, agendamentosProfissional] = await Promise.all([
          fichaRepository.getFichasByProfissional(profissional.id),
          agendamentoService.getAgendamentosByProfissional(profissional.id)
        ]);
        setFichas(fichasProfissional);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        const agHoje = (agendamentosProfissional || []).filter(ag => {
          const dataAg = ag.dataHoraAgendamento instanceof Date ? ag.dataHoraAgendamento : new Date(ag.dataHoraAgendamento);
          return dataAg >= hoje && dataAg < amanha && ag.status !== 'cancelado' && ag.status !== 'faltou';
        });
        setAgendamentosHoje(agHoje);
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

    if (filter === 'atendimento_hoje') {
      const pacientesHoje = new Set(agendamentosHoje.map(ag => ag.pacienteId));
      filtered = filtered.filter(ficha => pacientesHoje.has(ficha.pacienteId));
    } else if (filter !== 'todas') {
      filtered = filtered.filter(ficha => {
        const status = ficha.status as string;
        if (filter === 'em_tratamento') return status === 'em_tratamento' || status === 'ativo';
        if (filter === 'alta') return status === 'alta' || status === 'concluido';
        return status === filter;
      });
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

  const handleChangeStatus = async (ficha: FichaAcompanhamento, newStatus: string) => {
    if (newStatus === ficha.status) return;

    const statusLabels: Record<string, string> = {
      em_tratamento: 'Em Tratamento',
      alta: 'Alta',
      pausado: 'Pausado',
      cancelado: 'Cancelado'
    };

    const confirmed = await confirm({
      title: 'Alterar Status',
      message: `Alterar status da ficha de ${ficha.pacienteNome} para "${statusLabels[newStatus]}"?`,
      variant: newStatus === 'cancelado' ? 'danger' : 'warning'
    });

    if (confirmed) {
      try {
        const updatedFicha = await fichaRepository.updateFicha(ficha.id, {
          status: newStatus as any,
          updatedAt: new Date()
        });
        setFichas(prev => prev.map(f => f.id === ficha.id ? updatedFicha : f));
        toast.success(`Status alterado para "${statusLabels[newStatus]}"`);
      } catch (error) {
        console.error('Erro ao alterar status da ficha:', error);
        toast.error('Erro ao alterar status da ficha.');
      }
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'em_tratamento':
      case 'ativo': // backwards compatibility
        return 'bg-green-100 text-green-800 border-green-200';
      case 'alta':
      case 'concluido': // backwards compatibility
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'em_tratamento': return 'Em Tratamento';
      case 'ativo': return 'Em Tratamento'; // backwards compatibility
      case 'alta': return 'Alta';
      case 'concluido': return 'Alta'; // backwards compatibility
      case 'pausado': return 'Pausado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };



  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  
  const pacientesHojeSet = new Set(agendamentosHoje.map(ag => ag.pacienteId));
  const counts = {
    todas: fichas.length,
    atendimento_hoje: fichas.filter(f => pacientesHojeSet.has(f.pacienteId)).length,
    em_tratamento: fichas.filter(f => f.status === 'em_tratamento' || f.status === ('ativo' as any)).length,
    alta: fichas.filter(f => f.status === 'alta' || f.status === ('concluido' as any)).length,
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
    <PageShell
      title="Fichas de Acompanhamento"
      subtitle="Gerencie as fichas de acompanhamento dos seus pacientes"
    >
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
              { key: 'atendimento_hoje', label: 'Atendimento Hoje', count: counts.atendimento_hoje },
              { key: 'em_tratamento', label: 'Em Tratamento', count: counts.em_tratamento },
              { key: 'alta', label: 'Alta', count: counts.alta },
              { key: 'pausado', label: 'Pausadas', count: counts.pausado },
              { key: 'cancelado', label: 'Canceladas', count: counts.cancelado }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? filterOption.key === 'atendimento_hoje' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    : filterOption.key === 'atendimento_hoje' ? 'bg-white text-green-700 border border-green-300 hover:bg-green-50' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                   filter === 'atendimento_hoje' ? 'Nenhum atendimento agendado para hoje.' :
                   filter === 'em_tratamento' ? 'Nenhuma ficha em tratamento.' :
                   filter === 'alta' ? 'Nenhuma ficha com alta.' :
                   filter === 'pausado' ? 'Nenhuma ficha pausada.' :
                   'Nenhuma ficha cancelada.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paginatedFichas.map((ficha) => (
                  <div key={ficha.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {ficha.pacienteNome}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ficha.status)}`}>
                            {getStatusLabel(ficha.status)}
                          </span>
                        </div>
                        
                        {filter === 'atendimento_hoje' && (() => {
                          const ag = agendamentosHoje.find(a => a.pacienteId === ficha.pacienteId);
                          if (!ag) return null;
                          const dataAg = ag.dataHoraAgendamento instanceof Date ? ag.dataHoraAgendamento : new Date(ag.dataHoraAgendamento);
                          const horario = dataAg.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-sm text-green-800">
                              <span>&#128339;</span>
                              <span className="font-medium">Horário do atendimento:</span> {horario}
                              <span className="ml-2 text-green-600">({ag.modalidade === 'presencial' ? 'Presencial' : ag.modalidade === 'online' ? 'Online' : ag.modalidade})</span>
                            </div>
                          );
                        })()}
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
                          <select
                            value={ficha.status}
                            onChange={(e) => handleChangeStatus(ficha, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="em_tratamento">Em Tratamento</option>
                            <option value="alta">Alta</option>
                            <option value="pausado">Pausado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fichasFiltradas.length > 0 && (
            <Pagination
              currentPage={fichasCurrentPage}
              totalPages={fichasTotalPages}
              totalItems={fichasTotalItems}
              pageSize={fichasPageSize}
              onPageChange={fichasSetCurrentPage}
              onPageSizeChange={fichasSetPageSize}
              itemLabel="fichas"
            />
          )}
        </div>
      

      {/* Ficha Modal */}
      <ProfessionalFichaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ficha={selectedFicha}
        onSave={handleSaveFicha}
      />
    
    </PageShell>
  );
};

export default ProfessionalFichasPage;

