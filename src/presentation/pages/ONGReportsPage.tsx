import React, { useState, useEffect } from 'react';
import { FirebaseONGRepository } from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository';
import { 
  PeriodoRelatorio,
  RelatorioVoluntarios,
  RelatorioAtividades,
  RelatorioFinanceiro,
  ONGEntity
} from '@modules/ong-management/settings/domain/entities/ONG';

const ONGReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>({
    dataInicio: new Date(new Date().getFullYear(), 0, 1), // Janeiro do ano atual
    dataFim: new Date(new Date().getFullYear(), 11, 31), // Dezembro do ano atual
    tipo: 'anual'
  });

  const [relatorioVoluntarios, setRelatorioVoluntarios] = useState<RelatorioVoluntarios | null>(null);
  const [relatorioAtividades, setRelatorioAtividades] = useState<RelatorioAtividades | null>(null);
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RelatorioFinanceiro | null>(null);

  const ongRepository = new FirebaseONGRepository();

  useEffect(() => {
    loadReports();
  }, [periodo]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [voluntarios, atividades, financeiro] = await Promise.all([
        ongRepository.generateRelatorioVoluntarios(periodo),
        ongRepository.generateRelatorioAtividades(periodo),
        ongRepository.generateRelatorioFinanceiro(periodo)
      ]);

      setRelatorioVoluntarios(voluntarios);
      setRelatorioAtividades(atividades);
      setRelatorioFinanceiro(financeiro);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (field: keyof PeriodoRelatorio, value: any) => {
    setPeriodo(prev => ({ ...prev, [field]: value }));
  };

  const setPeriodPreset = (tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual') => {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    switch (tipo) {
      case 'mensal':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'trimestral':
        const trimestre = Math.floor(hoje.getMonth() / 3);
        dataInicio = new Date(hoje.getFullYear(), trimestre * 3, 1);
        dataFim = new Date(hoje.getFullYear(), (trimestre + 1) * 3, 0);
        break;
      case 'semestral':
        const semestre = Math.floor(hoje.getMonth() / 6);
        dataInicio = new Date(hoje.getFullYear(), semestre * 6, 1);
        dataFim = new Date(hoje.getFullYear(), (semestre + 1) * 6, 0);
        break;
      case 'anual':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
    }

    setPeriodo({ dataInicio, dataFim, tipo });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportVoluntariosCSV = () => {
    if (!relatorioVoluntarios) return;
    exportToCSV(relatorioVoluntarios.topVoluntarios, 'relatorio-voluntarios');
  };

  const exportAtividadesCSV = () => {
    if (!relatorioAtividades) return;
    exportToCSV(relatorioAtividades.atividadesMaisParticipadas, 'relatorio-atividades');
  };

  const exportFinanceiroCSV = () => {
    if (!relatorioFinanceiro) return;
    exportToCSV(relatorioFinanceiro.maioresDoadores, 'relatorio-financeiro');
  };

  const tabs = [
    { id: 'volunteers', label: 'Voluntários', icon: '👥' },
    { id: 'activities', label: 'Atividades', icon: '🎯' },
    { id: 'financial', label: 'Financeiro', icon: '💰' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gerando relatórios...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios da ONG</h1>
              <p className="mt-1 text-sm text-gray-600">
                Análise de {periodo.dataInicio.toLocaleDateString('pt-BR')} até {periodo.dataFim.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={loadReports}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              🔄 Atualizar Relatórios
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Período do Relatório</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setPeriodPreset('mensal')}
              className={`px-4 py-2 rounded-md ${periodo.tipo === 'mensal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setPeriodPreset('trimestral')}
              className={`px-4 py-2 rounded-md ${periodo.tipo === 'trimestral' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Trimestre Atual
            </button>
            <button
              onClick={() => setPeriodPreset('semestral')}
              className={`px-4 py-2 rounded-md ${periodo.tipo === 'semestral' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Semestre Atual
            </button>
            <button
              onClick={() => setPeriodPreset('anual')}
              className={`px-4 py-2 rounded-md ${periodo.tipo === 'anual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Ano Atual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={periodo.dataInicio.toISOString().split('T')[0]}
                onChange={(e) => handlePeriodChange('dataInicio', new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim
              </label>
              <input
                type="date"
                value={periodo.dataFim.toISOString().split('T')[0]}
                onChange={(e) => handlePeriodChange('dataFim', new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Volunteers Report */}
            {activeTab === 0 && relatorioVoluntarios && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Relatório de Voluntários</h3>
                  <button
                    onClick={exportVoluntariosCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{relatorioVoluntarios.totalVoluntarios}</div>
                    <div className="text-sm text-blue-700">Total de Voluntários</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{relatorioVoluntarios.voluntariosAtivos}</div>
                    <div className="text-sm text-green-700">Voluntários Ativos</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{relatorioVoluntarios.novasAdesoes}</div>
                    <div className="text-sm text-purple-700">Novas Adesões</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{relatorioVoluntarios.horasTotais.toFixed(1)}h</div>
                    <div className="text-sm text-yellow-700">Horas Totais</div>
                  </div>
                </div>

                {/* Top Volunteers */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Top 10 Voluntários</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horas Trabalhadas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Atividades
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatorioVoluntarios.topVoluntarios.map((voluntario, index) => (
                          <tr key={voluntario.voluntarioId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}. {voluntario.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {voluntario.horasTrabalhadas.toFixed(1)}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {voluntario.atividadesParticipadas}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Distribution by Area */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Distribuição por Área de Interesse</h4>
                  <div className="space-y-2">
                    {relatorioVoluntarios.distribuicaoPorArea.map((area) => (
                      <div key={area.area} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="font-medium">{area.area}</span>
                        <span className="text-gray-600">{area.quantidade} voluntários</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age Distribution */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Distribuição por Faixa Etária</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatorioVoluntarios.distribuicaoPorIdade.map((faixa) => (
                      <div key={faixa.faixa} className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-lg font-bold text-gray-900">{faixa.quantidade}</div>
                        <div className="text-sm text-gray-600">{faixa.faixa} anos</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activities Report */}
            {activeTab === 1 && relatorioAtividades && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Relatório de Atividades</h3>
                  <button
                    onClick={exportAtividadesCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{relatorioAtividades.totalAtividades}</div>
                    <div className="text-sm text-blue-700">Total de Atividades</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{relatorioAtividades.atividadesConcluidas}</div>
                    <div className="text-sm text-green-700">Atividades Concluídas</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{relatorioAtividades.beneficiariosAtendidos}</div>
                    <div className="text-sm text-purple-700">Beneficiários Atendidos</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{relatorioAtividades.horasTotaisVoluntariado.toFixed(1)}h</div>
                    <div className="text-sm text-yellow-700">Horas de Voluntariado</div>
                  </div>
                </div>

                {/* Distribution by Type */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Atividades por Tipo</h4>
                  <div className="space-y-2">
                    {relatorioAtividades.distribuicaoPorTipo.map((tipo) => (
                      <div key={tipo.tipo} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="font-medium">{tipo.tipo}</span>
                        <span className="text-gray-600">{tipo.quantidade} atividades</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Participated Activities */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Atividades Mais Participadas</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Atividade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participantes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Beneficiários
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatorioAtividades.atividadesMaisParticipadas.map((atividade, index) => (
                          <tr key={atividade.atividadeId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}. {atividade.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {atividade.tipo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {atividade.participantes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {atividade.beneficiarios}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {atividade.horasRealizadas.toFixed(1)}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Report */}
            {activeTab === 2 && relatorioFinanceiro && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Relatório Financeiro</h3>
                  <button
                    onClick={exportFinanceiroCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{ONGEntity.formatarMoeda(relatorioFinanceiro.totalArrecadado)}</div>
                    <div className="text-sm text-green-700">Total Arrecadado</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{ONGEntity.formatarMoeda(relatorioFinanceiro.totalDoacoesDinheiro)}</div>
                    <div className="text-sm text-blue-700">Doações em Dinheiro</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{relatorioFinanceiro.numeroDoadores}</div>
                    <div className="text-sm text-purple-700">Número de Doadores</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{ONGEntity.formatarMoeda(relatorioFinanceiro.ticketMedio)}</div>
                    <div className="text-sm text-yellow-700">Ticket Médio</div>
                  </div>
                </div>

                {/* Distribution by Type */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Distribuição por Tipo de Doação</h4>
                  <div className="space-y-2">
                    {relatorioFinanceiro.distribuicaoPorTipo.map((tipo) => (
                      <div key={tipo.tipo} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="font-medium">{tipo.tipo}</span>
                        <span className="text-gray-600">{ONGEntity.formatarMoeda(tipo.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Donors */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Maiores Doadores</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doador
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {relatorioFinanceiro.maioresDoadores.map((doador, index) => (
                          <tr key={doador.nome}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}. {doador.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ONGEntity.formatarMoeda(doador.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Monthly Evolution */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Evolução Mensal</h4>
                  <div className="space-y-2">
                    {relatorioFinanceiro.evolucaoMensal.map((mes) => (
                      <div key={mes.mes} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="font-medium">
                          {new Date(mes.mes + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
                        </span>
                        <span className="text-gray-600">{ONGEntity.formatarMoeda(mes.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ONGReportsPage;