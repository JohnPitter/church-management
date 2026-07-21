// Presentation Page - Admin Reports
// System reports and analytics dashboard

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { ReportData, reportsService } from '@modules/ong-management/settings/application/services/ReportsService';
import toast from 'react-hot-toast';
import PageShell from '../components/common/PageShell';

export const AdminReportsPage: React.FC = () => {
  const { currentUser: _currentUser } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canView = hasPermission(SystemModule.Reports, PermissionAction.View);
  const canManage = hasPermission(SystemModule.Reports, PermissionAction.Manage);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedReport, setSelectedReport] = useState('overview');

  const periods = [
    { value: '1month', label: 'Último mês' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '1year', label: 'Último ano' }
  ];

  const getPeriodMonths = (period: string): number => {
    switch (period) {
      case '1month': return 1;
      case '3months': return 3;
      case '6months': return 6;
      case '1year': return 12;
      default: return 3;
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const periodMonths = getPeriodMonths(selectedPeriod);
      const data = await reportsService.generateReportData(periodMonths);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  const reportTypes = [
    { id: 'overview', label: 'Visão Geral', icon: '📈' },
    { id: 'users', label: 'Usuários', icon: '👥' },
    { id: 'events', label: 'Eventos', icon: '📅' },
    { id: 'projects', label: 'Projetos', icon: '🎯' },
    { id: 'engagement', label: 'Engajamento', icon: '💬' },
    { id: 'financial', label: 'Financeiro', icon: '💰' }
  ];

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    if (!reportData) {
      toast.error('Dados não carregados. Aguarde o carregamento dos relatórios.');
      return;
    }

    setLoading(true);
    try {
      const blob = await reportsService.exportReport(format, reportData);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${selectedPeriod}-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Relatório exportado em ${format.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = () => {
    toast('Funcionalidade de agendamento será implementada em breve!');
  };

  // Permission loading state
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Access denied if user cannot view reports
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para visualizar relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="Relatórios"
      subtitle="Análises e relatórios do sistema"
      actions={
        <>
          <div className="flex space-x-3">
                        <select
                          value={selectedPeriod}
                          onChange={(e) => handlePeriodChange(e.target.value)}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          {periods.map(period => (
                            <option key={period.value} value={period.value}>
                              {period.label}
                            </option>
                          ))}
                        </select>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleExportReport('pdf')}
                              disabled={loading}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              📄 Exportar PDF
                            </button>
                            <button
                              onClick={() => handleExportReport('excel')}
                              disabled={loading}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                              📊 Exportar Excel
                            </button>
                          </>
                        )}
                      </div>
        </>
      }
    >
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    selectedReport === report.id
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{report.icon}</span>
                  {report.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="mt-5 lg:mt-0 lg:col-span-9">
            {loading && (
              <div className="bg-white shadow rounded-lg p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando dados dos relatórios...</p>
                </div>
              </div>
            )}

            {!loading && !reportData && (
              <div className="bg-white shadow rounded-lg p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Erro ao Carregar Dados</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Não foi possível carregar os dados dos relatórios.
                  </p>
                  <button 
                    onClick={loadReportData}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    🔄 Tentar Novamente
                  </button>
                </div>
              </div>
            )}

            {/* Overview Report */}
            {!loading && reportData && selectedReport === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas Principais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{reportData.userGrowth[reportData.userGrowth.length - 1]?.totalUsers}</div>
                      <div className="text-sm text-gray-500">Total de Usuários</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{reportData.eventStats.totalEvents}</div>
                      <div className="text-sm text-gray-500">Total de Eventos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{reportData.projectStats.activeProjects}</div>
                      <div className="text-sm text-gray-500">Projetos Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{reportData.engagementStats.blogPosts}</div>
                      <div className="text-sm text-gray-500">Posts do Blog</div>
                    </div>
                  </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Crescimento de Usuários</h3>
                  <div className="space-y-4">
                    {reportData.userGrowth.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{data.month}</div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            Total: <span className="font-medium text-gray-900">{data.totalUsers}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Novos: <span className="font-medium text-green-600">+{data.newUsers}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Ativos: <span className="font-medium text-blue-600">{data.activeUsers}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Categories */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias de Eventos Mais Populares</h3>
                  <div className="space-y-3">
                    {reportData.eventStats.popularCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${(category.count / reportData.eventStats.totalEvents) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{category.count} eventos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Report */}
            {!loading && reportData && selectedReport === 'users' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Usuários</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-blue-800">Total de Usuários</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">142</div>
                    <div className="text-sm text-green-800">Usuários Ativos</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">8</div>
                    <div className="text-sm text-orange-800">Pendentes</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Relatório detalhado de usuários será implementado com gráficos e análises específicas.
                </div>
              </div>
            )}

            {/* Events Report */}
            {!loading && reportData && selectedReport === 'events' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Eventos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{reportData.eventStats.totalEvents}</div>
                    <div className="text-sm text-green-800">Total de Eventos</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reportData.eventStats.avgAttendance}</div>
                    <div className="text-sm text-blue-800">Presença Média</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Relatório detalhado de eventos com análise de participação e tendências.
                </div>
              </div>
            )}

            {/* Projects Report */}
            {!loading && reportData && selectedReport === 'projects' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Projetos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{reportData.projectStats.activeProjects}</div>
                    <div className="text-sm text-orange-800">Projetos Ativos</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{reportData.projectStats.completedProjects}</div>
                    <div className="text-sm text-purple-800">Concluídos</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">R$ {reportData.projectStats.totalBudget.toLocaleString('pt-BR')}</div>
                    <div className="text-sm text-green-800">Orçamento Total</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Análise detalhada de projetos, orçamentos e participação.
                </div>
              </div>
            )}

            {/* Engagement Report */}
            {!loading && reportData && selectedReport === 'engagement' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Engajamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{reportData.engagementStats.blogViews}</div>
                    <div className="text-sm text-indigo-800">Visualizações do Blog</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">{reportData.engagementStats.avgSessionTime}</div>
                    <div className="text-sm text-pink-800">Tempo Médio de Sessão</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Métricas de engajamento, tempo de permanência e interações dos usuários.
                </div>
              </div>
            )}

            {/* Financial Report */}
            {!loading && reportData && selectedReport === 'financial' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório Financeiro</h3>
                <div className="text-center p-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h4>
                  <p className="text-sm text-gray-500">
                    Relatórios financeiros serão implementados com integração ao sistema de contribuições e despesas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            {canManage && (
              <>
                <button
                  onClick={handleScheduleReport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  📅 Agendar Relatório
                </button>
                <button
                  onClick={() => handleExportReport('pdf')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  📧 Enviar por Email
                </button>
              </>
            )}
            <button
              onClick={loadReportData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              🔄 {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </div>
      
    </PageShell>
  );
};