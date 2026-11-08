// Presentation Component - Assistance Reports
// Relatórios de atendimento para o painel administrativo

import React, { useState, useEffect, useMemo } from 'react';
import { AgendamentoAssistenciaService, ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { FichaAcompanhamentoService } from '@modules/assistance/fichas/application/services/FichaAcompanhamentoService';
import { FichaAcompanhamento, SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';
import {
  AgendamentoAssistencia,
  ProfissionalAssistencia,
  AssistenciaEntity,
  StatusAgendamento,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { AssistanceBarChart } from './charts/AssistanceBarChart';
import { AssistanceStatusPieChart } from './charts/AssistanceStatusPieChart';
import { AssistanceTimelineChart } from './charts/AssistanceTimelineChart';

interface AssistanceReportsProps {}

interface ResumoAcompanhamento {
  emTratamento: number;
  concluidas: number; // fichas com alta
  pausadas: number;
  canceladas: number;
  sessoesRealizadas: number;
  sessoesFaltou: number;
}

interface RelatorioGeral {
  totalProfissionais: number;
  totalAgendamentos: number;
  totalFichas: number;
  agendamentosHoje: number;
  agendamentosSemana: number;
  agendamentosMes: number;
  fichasAtivas: number;
  fichasConcluidas: number;
  atendimentosPorTipo: Record<string, number>;
  /** Todos os status de agendamento (inclusive os zerados) */
  atendimentosPorStatus: Record<string, number>;
  acompanhamento: ResumoAcompanhamento;
}

interface RelatorioProfissional {
  profissional: ProfissionalAssistencia;
  estatisticas: {
    totalFichas: number;
    fichasAtivas: number;
    fichasConcluidas: number;
    totalSessoes: number;
    sessoesRealizadas: number;
    sessoesFaltou: number;
    mediaSessoesPorFicha: number;
  };
  agendamentosRecentes: AgendamentoAssistencia[];
}

const isFichaAtiva = (f: FichaAcompanhamento) => f.status === 'em_tratamento' || (f.status as string) === 'ativo';
const isFichaConcluida = (f: FichaAcompanhamento) => f.status === 'alta' || (f.status as string) === 'concluido';

const AssistanceReports: React.FC<AssistanceReportsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('mes');
  const [tipoFiltro, setTipoFiltro] = useState<TipoAssistencia | 'all'>('all');
  const [profissionais, setProfissionais] = useState<ProfissionalAssistencia[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoAssistencia[]>([]);
  const [fichas, setFichas] = useState<FichaAcompanhamento[]>([]);
  const [sessoesPorFicha, setSessoesPorFicha] = useState<Record<string, SessaoAcompanhamento[]>>({});

  const agendamentoService = new AgendamentoAssistenciaService();
  const profissionalService = new ProfissionalAssistenciaService();
  const fichaService = new FichaAcompanhamentoService();

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoFiltro]);

  const generateTimelineData = (agendamentos: AgendamentoAssistencia[]) => {
    const last6Months = [];
    const hoje = new Date();

    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short' });

      const agendamentosDoMes = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.dataHoraAgendamento);
        return dataAgendamento.getMonth() === data.getMonth() &&
               dataAgendamento.getFullYear() === data.getFullYear();
      });

      const concluidos = agendamentosDoMes.filter(a => a.status === 'concluido').length;

      last6Months.push({
        label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
        agendamentos: agendamentosDoMes.length,
        atendidos: concluidos
      });
    }

    return last6Months;
  };

  const loadReports = async () => {
    try {
      setLoading(true);

      const [profissionaisData, agendamentosData, fichasData] = await Promise.all([
        profissionalService.getAllProfissionais(),
        agendamentoService.getAllAgendamentos(),
        fichaService.getAllFichas()
      ]);

      // As sessões (realizada / paciente faltou) ficam dentro de cada ficha
      const sessoesEntries = await Promise.all(
        fichasData.map(async (ficha) => {
          try {
            return [ficha.id, await fichaService.getSessoesByFicha(ficha.id)] as const;
          } catch (error) {
            console.error('Error loading sessoes da ficha', ficha.id, error);
            return [ficha.id, [] as SessaoAcompanhamento[]] as const;
          }
        })
      );

      setProfissionais(profissionaisData);
      setAgendamentos(agendamentosData);
      setFichas(fichasData);
      setSessoesPorFicha(Object.fromEntries(sessoesEntries));
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tudo abaixo é derivado dos dados carregados + filtro de tipo de assistência
  const { relatorioGeral, relatoriosProfissionais, agendamentosFiltrados } = useMemo(() => {
    const porTipo = tipoFiltro === 'all' ? null : tipoFiltro;
    const agendamentosF = agendamentos.filter(a => !porTipo || a.tipoAssistencia === porTipo);
    const fichasF = fichas.filter(f => !porTipo || f.tipoAssistencia === porTipo);
    const profissionaisF = profissionais.filter(p => !porTipo || p.especialidade === porTipo);

    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const agendamentosHoje = agendamentosF.filter(a =>
      new Date(a.dataHoraAgendamento).toDateString() === hoje.toDateString()).length;
    const agendamentosSemana = agendamentosF.filter(a => {
      const d = new Date(a.dataHoraAgendamento);
      return d >= inicioSemana && d <= fimSemana;
    }).length;
    const agendamentosMes = agendamentosF.filter(a => {
      const d = new Date(a.dataHoraAgendamento);
      return d >= inicioMes && d <= fimMes;
    }).length;

    const atendimentosPorTipo = agendamentosF.reduce((acc, a) => {
      acc[a.tipoAssistencia] = (acc[a.tipoAssistencia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Lista TODOS os status (inclusive zerados), não só os que aparecem nos dados
    const atendimentosPorStatus = Object.values(StatusAgendamento).reduce((acc, status) => {
      acc[status] = agendamentosF.filter(a => a.status === status).length;
      return acc;
    }, {} as Record<string, number>);

    const sessoesDe = (lista: FichaAcompanhamento[]) =>
      lista.flatMap(f => sessoesPorFicha[f.id] || []);
    const sessoesF = sessoesDe(fichasF);

    const acompanhamento: ResumoAcompanhamento = {
      emTratamento: fichasF.filter(isFichaAtiva).length,
      concluidas: fichasF.filter(isFichaConcluida).length,
      pausadas: fichasF.filter(f => f.status === 'pausado').length,
      canceladas: fichasF.filter(f => f.status === 'cancelado').length,
      sessoesRealizadas: sessoesF.filter(s => s.status === 'concluida').length,
      sessoesFaltou: sessoesF.filter(s => s.status === 'nao_realizada').length
    };

    const geral: RelatorioGeral = {
      totalProfissionais: profissionaisF.length,
      totalAgendamentos: agendamentosF.length,
      totalFichas: fichasF.length,
      agendamentosHoje,
      agendamentosSemana,
      agendamentosMes,
      fichasAtivas: acompanhamento.emTratamento,
      fichasConcluidas: acompanhamento.concluidas,
      atendimentosPorTipo,
      atendimentosPorStatus,
      acompanhamento
    };

    const porProfissional: RelatorioProfissional[] = profissionaisF.map(profissional => {
      const fichasProfissional = fichasF.filter(f => f.profissionalId === profissional.id);
      const sessoes = sessoesDe(fichasProfissional);
      const agendamentosRecentes = agendamentosF
        .filter(a => a.profissionalId === profissional.id)
        .sort((a, b) => new Date(b.dataHoraAgendamento).getTime() - new Date(a.dataHoraAgendamento).getTime())
        .slice(0, 5);

      return {
        profissional,
        estatisticas: {
          totalFichas: fichasProfissional.length,
          fichasAtivas: fichasProfissional.filter(isFichaAtiva).length,
          fichasConcluidas: fichasProfissional.filter(isFichaConcluida).length,
          totalSessoes: sessoes.length,
          sessoesRealizadas: sessoes.filter(s => s.status === 'concluida').length,
          sessoesFaltou: sessoes.filter(s => s.status === 'nao_realizada').length,
          mediaSessoesPorFicha: fichasProfissional.length
            ? Math.round((sessoes.length / fichasProfissional.length) * 10) / 10
            : 0
        },
        agendamentosRecentes
      };
    });

    return { relatorioGeral: geral, relatoriosProfissionais: porProfissional, agendamentosFiltrados: agendamentosF };
  }, [agendamentos, fichas, profissionais, sessoesPorFicha, tipoFiltro]);


  const tabs = [
    {
      id: 'geral',
      label: 'Visão Geral',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'profissionais',
      label: 'Por Profissional',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'graficos',
      label: 'Gráficos',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filtros */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios de Assistências</h2>
        <div className="flex items-center space-x-4">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as TipoAssistencia | 'all')}
            aria-label="Tipo de assistência"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as assistências</option>
            {Object.values(TipoAssistencia).map((tipo) => (
              <option key={tipo} value={tipo}>{AssistenciaEntity.formatarTipoAssistencia(tipo)}</option>
            ))}
          </select>
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="ano">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 0 && relatorioGeral && (
        <div className="space-y-6">
          {/* Cards de estatísticas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">👨‍⚕️</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Profissionais</p>
                  <p className="text-2xl font-semibold text-gray-900">{relatorioGeral.totalProfissionais}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">📅</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Agendamentos</p>
                  <p className="text-2xl font-semibold text-gray-900">{relatorioGeral.totalAgendamentos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">📋</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Fichas Ativas</p>
                  <p className="text-2xl font-semibold text-gray-900">{relatorioGeral.fichasAtivas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Hoje</p>
                  <p className="text-2xl font-semibold text-gray-900">{relatorioGeral.agendamentosHoje}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo por tipo de assistência */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Atendimentos por Tipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(relatorioGeral.atendimentosPorTipo).map(([tipo, quantidade]) => (
                <div key={tipo} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{quantidade}</p>
                  <p className="text-sm text-gray-600 capitalize">{tipo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo por status do agendamento (todos os status, inclusive zerados) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status dos Agendamentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(relatorioGeral.atendimentosPorStatus).map(([status, quantidade]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{quantidade}</p>
                  <p className="text-sm text-gray-600">
                    {AssistenciaEntity.formatarStatusAgendamento(status as StatusAgendamento)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Acompanhamento: status das fichas e das sessões registradas dentro delas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acompanhamento (fichas e sessões)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Em tratamento', value: relatorioGeral.acompanhamento.emTratamento },
                { label: 'Concluídas (alta)', value: relatorioGeral.acompanhamento.concluidas },
                { label: 'Pausadas', value: relatorioGeral.acompanhamento.pausadas },
                { label: 'Canceladas', value: relatorioGeral.acompanhamento.canceladas },
                { label: 'Sessões realizadas', value: relatorioGeral.acompanhamento.sessoesRealizadas },
                { label: 'Paciente faltou', value: relatorioGeral.acompanhamento.sessoesFaltou }
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-6">
          {relatoriosProfissionais.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum profissional encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {relatoriosProfissionais.map((relatorio) => (
                <div key={relatorio.profissional.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {relatorio.profissional.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {relatorio.profissional.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {relatorio.profissional.especialidade}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">
                        {relatorio.estatisticas.fichasAtivas}
                      </p>
                      <p className="text-xs text-gray-600">Fichas Ativas</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">
                        {relatorio.estatisticas.fichasConcluidas}
                      </p>
                      <p className="text-xs text-gray-600">Concluídas</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-lg font-semibold text-purple-600">
                        {relatorio.estatisticas.totalSessoes}
                      </p>
                      <p className="text-xs text-gray-600">Total Sessões</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">
                        {relatorio.estatisticas.sessoesRealizadas}
                      </p>
                      <p className="text-xs text-gray-600">Sessões Realizadas</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-lg font-semibold text-red-600">
                        {relatorio.estatisticas.sessoesFaltou}
                      </p>
                      <p className="text-xs text-gray-600">Paciente Faltou</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-lg font-semibold text-orange-600">
                        {relatorio.estatisticas.mediaSessoesPorFicha}
                      </p>
                      <p className="text-xs text-gray-600">Média/Ficha</p>
                    </div>
                  </div>

                  {relatorio.agendamentosRecentes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Últimos Agendamentos
                      </h4>
                      <div className="space-y-2">
                        {relatorio.agendamentosRecentes.slice(0, 3).map((agendamento) => (
                          <div key={agendamento.id} className="text-xs text-gray-600 flex justify-between">
                            <span>{agendamento.pacienteNome}</span>
                            <span>{new Date(agendamento.dataHoraAgendamento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && relatorioGeral && (
        <div className="space-y-6">
          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <AssistanceTimelineChart
              data={generateTimelineData(agendamentosFiltrados)}
              className="h-80"
            />
          </div>

          {/* Two columns for bar and pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - By Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <AssistanceBarChart
                data={relatorioGeral.atendimentosPorTipo}
                title="Distribuição por Tipo de Assistência"
                className="h-80"
              />
            </div>

            {/* Pie Chart - By Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <AssistanceStatusPieChart
                data={Object.fromEntries(Object.entries(relatorioGeral.atendimentosPorStatus).filter(([, n]) => n > 0))}
                title="Distribuição por Status"
                className="h-80"
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Estatístico</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {relatorioGeral.totalAgendamentos}
                </div>
                <div className="text-sm text-gray-700 font-medium">Total de Agendamentos</div>
                <div className="text-xs text-gray-500 mt-1">
                  {relatorioGeral.agendamentosHoje} hoje • {relatorioGeral.agendamentosSemana} esta semana
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {relatorioGeral.fichasAtivas}
                </div>
                <div className="text-sm text-gray-700 font-medium">Fichas Ativas</div>
                <div className="text-xs text-gray-500 mt-1">
                  {relatorioGeral.fichasConcluidas} concluídas
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {relatorioGeral.totalProfissionais}
                </div>
                <div className="text-sm text-gray-700 font-medium">Profissionais Ativos</div>
                <div className="text-xs text-gray-500 mt-1">
                  Atendendo pacientes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistanceReports;