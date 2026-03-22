import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';

interface SessaoComFicha extends SessaoAcompanhamento {
  pacienteNome: string;
  tipoAssistencia: string;
  fichaStatus: string;
}

const ProfessionalSessoesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isProfessional, setIsProfessional] = useState<boolean | null>(null);
  const [sessoes, setSessoes] = useState<SessaoComFicha[]>([]);

  // Filters
  const [filterPaciente, setFilterPaciente] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState<'todos' | 'hoje' | 'semana' | 'mes' | 'custom'>('todos');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const profissionalService = new ProfissionalAssistenciaService();
  const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

  useEffect(() => {
    loadSessoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadSessoes = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);

      if (!profissional) {
        setIsProfessional(false);
        return;
      }

      setIsProfessional(true);

      // Get all fichas for this professional
      const fichasData = await fichaRepository.getFichasByProfissional(profissional.id);

      // Get all sessoes from all fichas (parallel)
      const sessoesByFicha = await Promise.all(
        fichasData.map(ficha => fichaRepository.getSessoesByFicha(ficha.id))
      );

      const allSessoes: SessaoComFicha[] = fichasData.flatMap((ficha, i) =>
        sessoesByFicha[i].map(sessao => ({
          ...sessao,
          pacienteNome: ficha.pacienteNome,
          tipoAssistencia: ficha.tipoAssistencia,
          fichaStatus: ficha.status
        }))
      );

      // Sort by date descending (most recent first)
      allSessoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setSessoes(allSessoes);
    } catch (error) {
      console.error('Error loading sessoes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique patient names for filter dropdown
  const pacientes = useMemo(() => {
    const names = [...new Set(sessoes.map(s => s.pacienteNome))];
    return names.sort();
  }, [sessoes]);

  // Apply filters
  const filteredSessoes = useMemo(() => {
    let result = [...sessoes];

    // Filter by patient
    if (filterPaciente) {
      result = result.filter(s => s.pacienteNome === filterPaciente);
    }

    // Filter by type
    if (filterStatus) {
      result = result.filter(s => (s.status || 'concluida') === filterStatus);
    }

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterPeriodo === 'hoje') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result = result.filter(s => {
        const d = new Date(s.data);
        return d >= today && d < tomorrow;
      });
    } else if (filterPeriodo === 'semana') {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      result = result.filter(s => {
        const d = new Date(s.data);
        return d >= weekStart && d < weekEnd;
      });
    } else if (filterPeriodo === 'mes') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      result = result.filter(s => {
        const d = new Date(s.data);
        return d >= monthStart && d <= monthEnd;
      });
    } else if (filterPeriodo === 'custom' && filterDataInicio && filterDataFim) {
      const start = new Date(filterDataInicio + 'T00:00:00');
      const end = new Date(filterDataFim + 'T23:59:59');
      result = result.filter(s => {
        const d = new Date(s.data);
        return d >= start && d <= end;
      });
    }

    return result;
  }, [sessoes, filterPaciente, filterStatus, filterPeriodo, filterDataInicio, filterDataFim]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredSessoes.length,
      individual: filteredSessoes.filter(s => s.tipoSessao === 'individual').length,
      grupo: filteredSessoes.filter(s => s.tipoSessao === 'grupo').length,
      familiar: filteredSessoes.filter(s => s.tipoSessao === 'familiar').length,
      avaliacao: filteredSessoes.filter(s => s.tipoSessao === 'avaliacao').length,
      duracaoTotal: filteredSessoes.reduce((sum, s) => sum + (s.duracao || 0), 0),
      pacientesUnicos: new Set(filteredSessoes.map(s => s.pacienteNome)).size
    };
  }, [filteredSessoes]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTipoSessaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      individual: 'Individual',
      grupo: 'Grupo',
      familiar: 'Familiar',
      avaliacao: 'Avaliacao'
    };
    return labels[tipo] || tipo;
  };

  const getTipoSessaoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      individual: 'bg-blue-100 text-blue-800',
      grupo: 'bg-green-100 text-green-800',
      familiar: 'bg-purple-100 text-purple-800',
      avaliacao: 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getTipoAssistenciaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      psicologica: 'Psicologica',
      social: 'Social',
      juridica: 'Juridica',
      medica: 'Medica',
      fisioterapia: 'Fisioterapia',
      nutricao: 'Nutricao'
    };
    return labels[tipo] || tipo;
  };

  const clearFilters = () => {
    setFilterPaciente('');
    setFilterPeriodo('todos');
    setFilterDataInicio('');
    setFilterDataFim('');
    setFilterStatus('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sessoes...</p>
        </div>
      </div>
    );
  }

  if (isProfessional === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">
            Seu usuario nao esta vinculado a um perfil profissional.
            Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Sessoes</h1>
          <p className="text-gray-600 mt-1">
            Historico de todas as sessoes realizadas com seus pacientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Sessoes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.pacientesUnicos}</div>
            <div className="text-sm text-gray-600">Pacientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{Math.round(stats.duracaoTotal / 60)}h</div>
            <div className="text-sm text-gray-600">Horas Atendidas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {stats.total > 0 ? Math.round(stats.duracaoTotal / stats.total) : 0}min
            </div>
            <div className="text-sm text-gray-600">Media por Sessao</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Patient filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <select
                value={filterPaciente}
                onChange={(e) => setFilterPaciente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os pacientes</option>
                {pacientes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Period filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mes</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Custom date range */}
            {filterPeriodo === 'custom' && (
              <>
                <div className="min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                  <input
                    type="date"
                    value={filterDataInicio}
                    onChange={(e) => setFilterDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ate</label>
                  <input
                    type="date"
                    value={filterDataFim}
                    onChange={(e) => setFilterDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Status filter */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="concluida">Concluida</option>
                <option value="nao_realizada">Nao Realizada</option>
              </select>
            </div>

            {/* Clear filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredSessoes.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sessao encontrada</h3>
              <p className="text-sm text-gray-500">
                {sessoes.length === 0
                  ? 'Voce ainda nao registrou nenhuma sessao. As sessoes sao registradas atraves das fichas de acompanhamento.'
                  : 'Nenhuma sessao corresponde aos filtros selecionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duracao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resumo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessoes.map((sessao) => (
                    <tr key={`${sessao.fichaId}-${sessao.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sessao.data)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sessao.pacienteNome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{sessao.numeroSessao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTipoSessaoColor(sessao.tipoSessao)}`}>
                          {getTipoSessaoLabel(sessao.tipoSessao)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sessao.duracao}min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getTipoAssistenciaLabel(sessao.tipoAssistencia)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={sessao.resumo}>
                        {sessao.resumo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results count */}
          {filteredSessoes.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              Exibindo {filteredSessoes.length} de {sessoes.length} sessoes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSessoesPage;
