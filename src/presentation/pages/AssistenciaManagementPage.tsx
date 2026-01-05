import React, { useState, useEffect } from 'react';
import {
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  AssistenciaEntity,
  ProfissionalAssistencia,
  AgendamentoAssistencia
} from '../../domain/entities/Assistencia';
import { ProfissionalAssistenciaService, AgendamentoAssistenciaService } from '../../infrastructure/services/AssistenciaService';
import { AnamnesesPsicologicaService } from '../../infrastructure/services/AnamnesesPsicologicaService';
import { ProfessionalHelpRequestService } from '../../infrastructure/services/ProfessionalHelpRequestService';
import { ProfessionalHelpRequest, HelpRequestStatus, HelpRequestPriority } from '../../modules/assistance/professional/domain/entities/ProfessionalHelpRequest';
import AgendamentoAssistenciaModalEnhanced from '../components/AgendamentoAssistenciaModalEnhanced';
import ProfissionalAssistenciaModal from '../components/ProfissionalAssistenciaModal';
import AssistanceReports from '../components/AssistanceReports';
import AnamnesesPsicologicaModal, { AnamnesesPsicologicaData } from '../components/AnamnesesPsicologicaModal';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  HiHeart,
  HiClipboardDocumentList,
  HiPlus,
  HiCalendar,
  HiCalendarDays,
  HiUserGroup,
  HiCheckCircle,
  HiChartBar,
  HiHandRaised,
  HiPresentationChartLine,
  HiAcademicCap,
  HiPhone,
  HiEnvelope,
  HiCurrencyDollar,
  HiSparkles,
  HiScale
} from 'react-icons/hi2';

const AssistenciaManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Agendamentos state
  const [agendamentos, setAgendamentos] = useState<AgendamentoAssistencia[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoAssistencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusAgendamento | 'all'>('all');
  const [tipoFilter, setTipoFilter] = useState<TipoAssistencia | 'all'>('all');
  
  // Profissionais state
  const [profissionais, setProfissionais] = useState<ProfissionalAssistencia[]>([]);
  const [profissionaisFiltrados, setProfissionaisFiltrados] = useState<ProfissionalAssistencia[]>([]);
  const [searchProfissional, setSearchProfissional] = useState('');
  const [statusProfissionalFilter, setStatusProfissionalFilter] = useState<StatusProfissional | 'all'>('all');

  // Help Requests state
  const [helpRequests, setHelpRequests] = useState<ProfessionalHelpRequest[]>([]);
  const [helpRequestsFiltrados, setHelpRequestsFiltrados] = useState<ProfessionalHelpRequest[]>([]);
  const [searchHelpRequest, setSearchHelpRequest] = useState('');
  const [statusHelpRequestFilter, setStatusHelpRequestFilter] = useState<HelpRequestStatus | 'all'>('all');
  const [prioridadeHelpRequestFilter, setPrioridadeHelpRequestFilter] = useState<HelpRequestPriority | 'all'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoAssistencia | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Professional Modal state
  const [isProfissionalModalOpen, setIsProfissionalModalOpen] = useState(false);
  const [selectedProfissional, setSelectedProfissional] = useState<ProfissionalAssistencia | null>(null);
  const [profissionalModalMode, setProfissionalModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Anamnese Modal state
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [selectedAnamnese, setSelectedAnamnese] = useState<AnamnesesPsicologicaData | null>(null);
  const [anamneseModalMode, setAnamneseModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anamneseAssistidoId, setAnamneseAssistidoId] = useState<string>('');
  const [anamneseAssistidoNome, setAnamneseAssistidoNome] = useState<string>('');

  
  // Statistics
  const [statistics, setStatistics] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    totalProfissionais: 0,
    profissionaisAtivos: 0,
    porTipo: {} as Record<TipoAssistencia, number>,
    porStatus: {} as Record<StatusAgendamento, number>
  });

  const agendamentoService = new AgendamentoAssistenciaService();
  const profissionalService = new ProfissionalAssistenciaService();
  const anamneseService = new AnamnesesPsicologicaService();
  const helpRequestService = new ProfessionalHelpRequestService();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAgendamentos();
  }, [agendamentos, searchTerm, statusFilter, tipoFilter]);

  useEffect(() => {
    filterProfissionais();
  }, [profissionais, searchProfissional, statusProfissionalFilter]);

  useEffect(() => {
    filterHelpRequests();
  }, [helpRequests, searchHelpRequest, statusHelpRequestFilter, prioridadeHelpRequestFilter]);


  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAgendamentos(),
        loadProfissionais(),
        loadHelpRequests(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgendamentos = async () => {
    try {
      const data = await agendamentoService.getAllAgendamentos();
      setAgendamentos(data);
    } catch (error) {
      console.error('Error loading agendamentos:', error);
    }
  };

  const loadProfissionais = async () => {
    try {
      const data = await profissionalService.getAllProfissionais();
      setProfissionais(data);
    } catch (error) {
      console.error('Error loading profissionais:', error);
    }
  };


  const loadStatistics = async () => {
    try {
      const [agendamentoStats, profissionalStats] = await Promise.all([
        agendamentoService.getStatistics(),
        profissionalService.getStatistics()
      ]);
      
      setStatistics({
        totalAgendamentos: agendamentoStats.totalAgendamentos,
        agendamentosHoje: agendamentoStats.agendamentosHoje,
        agendamentosSemana: agendamentoStats.agendamentosSemana,
        totalProfissionais: profissionalStats.totalProfissionais,
        profissionaisAtivos: profissionalStats.totalAtivos,
        porTipo: agendamentoStats.porTipo,
        porStatus: agendamentoStats.porStatus
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const filterAgendamentos = () => {
    let filtered = agendamentos;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(agendamento =>
        agendamento.pacienteNome.toLowerCase().includes(term) ||
        agendamento.profissionalNome.toLowerCase().includes(term) ||
        agendamento.pacienteTelefone.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(agendamento => agendamento.status === statusFilter);
    }

    if (tipoFilter !== 'all') {
      filtered = filtered.filter(agendamento => agendamento.tipoAssistencia === tipoFilter);
    }

    setAgendamentosFiltrados(filtered);
  };

  const filterProfissionais = () => {
    let filtered = profissionais;

    if (searchProfissional) {
      const term = searchProfissional.toLowerCase();
      filtered = filtered.filter(profissional =>
        profissional.nome.toLowerCase().includes(term) ||
        profissional.registroProfissional.toLowerCase().includes(term) ||
        profissional.telefone.includes(term)
      );
    }

    if (statusProfissionalFilter !== 'all') {
      filtered = filtered.filter(profissional => profissional.status === statusProfissionalFilter);
    }

    setProfissionaisFiltrados(filtered);
  };

  const loadHelpRequests = async () => {
    try {
      // Get all professionals to fetch all their requests
      const allProfessionals = await profissionalService.getAllProfissionais();
      const allRequests: ProfessionalHelpRequest[] = [];

      for (const prof of allProfessionals) {
        try {
          const [received, sent] = await Promise.all([
            helpRequestService.getReceivedRequests(prof.id),
            helpRequestService.getSentRequests(prof.id)
          ]);
          allRequests.push(...received, ...sent);
        } catch (error) {
          console.error(`Error loading requests for professional ${prof.id}:`, error);
        }
      }

      // Remove duplicates by id
      const uniqueRequests = Array.from(
        new Map(allRequests.map(req => [req.id, req])).values()
      );

      setHelpRequests(uniqueRequests);
    } catch (error) {
      console.error('Error loading help requests:', error);
      setHelpRequests([]);
    }
  };

  const filterHelpRequests = () => {
    let filtered = helpRequests;

    if (searchHelpRequest) {
      const term = searchHelpRequest.toLowerCase();
      filtered = filtered.filter(request =>
        request.titulo.toLowerCase().includes(term) ||
        request.solicitanteNome.toLowerCase().includes(term) ||
        (request.destinatarioNome && request.destinatarioNome.toLowerCase().includes(term)) ||
        request.descricao.toLowerCase().includes(term)
      );
    }

    if (statusHelpRequestFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusHelpRequestFilter);
    }

    if (prioridadeHelpRequestFilter !== 'all') {
      filtered = filtered.filter(request => request.prioridade === prioridadeHelpRequestFilter);
    }

    setHelpRequestsFiltrados(filtered);
  };


  const handleCreateAgendamento = () => {
    setSelectedAgendamento(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditAgendamento = (agendamento: AgendamentoAssistencia) => {
    setSelectedAgendamento(agendamento);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewAgendamento = (agendamento: AgendamentoAssistencia) => {
    setSelectedAgendamento(agendamento);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleModalSave = (agendamento: AgendamentoAssistencia) => {
    if (modalMode === 'create') {
      setAgendamentos(prev => [agendamento, ...prev]);
    } else if (modalMode === 'edit') {
      setAgendamentos(prev => prev.map(a => a.id === agendamento.id ? agendamento : a));
    }
    loadStatistics(); // Refresh statistics
  };

  const handleStatusChange = async (agendamentoId: string, newStatus: StatusAgendamento) => {
    try {
      // Use the specific methods that trigger automatic ficha creation
      if (newStatus === StatusAgendamento.Confirmado) {
        await agendamentoService.confirmarAgendamento(agendamentoId, currentUser?.email || 'admin');
        alert('✅ Agendamento confirmado! Ficha de acompanhamento criada automaticamente.');
      } else {
        await agendamentoService.updateAgendamento(agendamentoId, { status: newStatus });
      }
      
      setAgendamentos(prev => prev.map(a => 
        a.id === agendamentoId ? { ...a, status: newStatus } : a
      ));
      loadStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Erro ao atualizar status do agendamento: ' + error);
    }
  };

  const handleDeleteAgendamento = async (agendamento: AgendamentoAssistencia) => {
    if (!window.confirm(`Tem certeza que deseja excluir o agendamento de ${agendamento.pacienteNome}?`)) {
      return;
    }

    try {
      await agendamentoService.deleteAgendamento(agendamento.id);
      setAgendamentos(prev => prev.filter(a => a.id !== agendamento.id));
      loadStatistics();
      alert('✅ Agendamento excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting agendamento:', error);
      alert('❌ Erro ao excluir agendamento: ' + error);
    }
  };

  // Professional handlers
  const handleCreateProfissional = () => {
    setSelectedProfissional(null);
    setProfissionalModalMode('create');
    setIsProfissionalModalOpen(true);
  };

  const handleEditProfissional = (profissional: ProfissionalAssistencia) => {
    setSelectedProfissional(profissional);
    setProfissionalModalMode('edit');
    setIsProfissionalModalOpen(true);
  };

  const handleViewProfissional = (profissional: ProfissionalAssistencia) => {
    setSelectedProfissional(profissional);
    setProfissionalModalMode('view');
    setIsProfissionalModalOpen(true);
  };

  const handleSaveProfissional = (profissional: ProfissionalAssistencia) => {
    if (profissionalModalMode === 'create') {
      setProfissionais(prev => [profissional, ...prev]);
    } else if (profissionalModalMode === 'edit') {
      setProfissionais(prev => prev.map(p => p.id === profissional.id ? profissional : p));
    }
    loadStatistics(); // Refresh statistics
  };

  const handleDeleteProfissional = (profissionalId: string) => {
    // Remove the professional from the list
    setProfissionais(prev => prev.filter(p => p.id !== profissionalId));
    
    // Refresh statistics
    loadStatistics();
    
    // Close modal
    setIsProfissionalModalOpen(false);
    setSelectedProfissional(null);
  };

  const handleInactivateProfissional = (profissionalId: string, motivo?: string) => {
    // Update the professional status in the list
    setProfissionais(prev => prev.map(p =>
      p.id === profissionalId
        ? {
            ...p,
            status: StatusProfissional.Inativo,
            dataInativacao: new Date(),
            motivoInativacao: motivo || 'Inativação manual',
            updatedAt: new Date()
          }
        : p
    ));

    // Refresh statistics
    loadStatistics();

    // Close modal
    setIsProfissionalModalOpen(false);
    setSelectedProfissional(null);
  };

  // Anamnese handlers
  const handleCreateAnamnese = (agendamento: AgendamentoAssistencia) => {
    setAnamneseAssistidoId(agendamento.pacienteId || '');
    setAnamneseAssistidoNome(agendamento.pacienteNome);
    setSelectedAnamnese(null);
    setAnamneseModalMode('create');
    setIsAnamneseModalOpen(true);
  };

  const handleSaveAnamnese = async (anamnese: AnamnesesPsicologicaData) => {
    try {
      console.log('Salvando anamnese:', anamnese);

      // Add assistido information if not already present
      const anamneseCompleta = {
        ...anamnese,
        assistidoId: anamneseAssistidoId || '',
        assistidoNome: anamneseAssistidoNome || anamnese.nome,
        profissionalResponsavel: currentUser?.email || 'admin',
        dataPreenchimento: new Date()
      };

      if (anamneseModalMode === 'create') {
        await anamneseService.createAnamnese(anamneseCompleta);
        alert('✅ Anamnese psicológica criada com sucesso!');
      } else if (anamneseModalMode === 'edit' && anamnese.id) {
        await anamneseService.updateAnamnese(anamnese.id, anamneseCompleta);
        alert('✅ Anamnese psicológica atualizada com sucesso!');
      }

      setIsAnamneseModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error);
      alert('❌ Erro ao salvar anamnese: ' + error);
    }
  };

  const getStatusColor = (status: StatusAgendamento): string => {
    switch (status) {
      case StatusAgendamento.Agendado:
        return 'bg-blue-100 text-blue-800';
      case StatusAgendamento.Confirmado:
        return 'bg-green-100 text-green-800';
      case StatusAgendamento.EmAndamento:
        return 'bg-yellow-100 text-yellow-800';
      case StatusAgendamento.Concluido:
        return 'bg-gray-100 text-gray-800';
      case StatusAgendamento.Cancelado:
        return 'bg-red-100 text-red-800';
      case StatusAgendamento.Remarcado:
        return 'bg-purple-100 text-purple-800';
      case StatusAgendamento.Faltou:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: TipoAssistencia): string => {
    switch (tipo) {
      case TipoAssistencia.Psicologica:
        return 'bg-blue-100 text-blue-800';
      case TipoAssistencia.Social:
        return 'bg-green-100 text-green-800';
      case TipoAssistencia.Juridica:
        return 'bg-purple-100 text-purple-800';
      case TipoAssistencia.Medica:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'agendamentos', label: 'Agendamentos', icon: <HiCalendar className="w-5 h-5" /> },
    { id: 'profissionais', label: 'Profissionais', icon: <HiUserGroup className="w-5 h-5" /> },
    { id: 'pedidos-ajuda', label: 'Pedidos de Ajuda', icon: <HiHandRaised className="w-5 h-5" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <HiChartBar className="w-5 h-5" /> },
    { id: 'estatisticas', label: 'Estatísticas', icon: <HiPresentationChartLine className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <HiHeart className="w-8 h-8 text-red-500" />
                Gerenciamento de Assistências
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerenciamento de assistência psicológica, social, jurídica e médica
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => window.location.href = '/admin/fichas'}
                className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm sm:text-base"
              >
                <HiClipboardDocumentList className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline ml-1">Ver Fichas</span>
              </button>
              <button
                onClick={handleCreateAgendamento}
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
              >
                <HiPlus className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline ml-1">Novo Agendamento</span>
                <span className="sm:hidden ml-1">Novo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                <HiCalendar className="w-7 h-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agendamentos</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalAgendamentos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                <HiCalendarDays className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoje</p>
                <p className="text-2xl font-semibold text-blue-600">{statistics.agendamentosHoje}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                <HiUserGroup className="w-7 h-7 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profissionais</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalProfissionais}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                <HiCheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-semibold text-green-600">{statistics.profissionaisAtivos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-3 px-3 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex items-center justify-center transition-colors whitespace-nowrap ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="sm:mr-2">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab 1: Agendamentos */}
            {activeTab === 0 && (
              <div>
                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <input
                      type="text"
                      placeholder="Buscar por paciente, profissional ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusAgendamento | 'all')}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="all">Todos os Status</option>
                      {Object.values(StatusAgendamento).map((status) => (
                        <option key={status} value={status}>
                          {AssistenciaEntity.formatarStatusAgendamento(status)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={tipoFilter}
                      onChange={(e) => setTipoFilter(e.target.value as TipoAssistencia | 'all')}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="all">Todos os Tipos</option>
                      {Object.values(TipoAssistencia).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {AssistenciaEntity.formatarTipoAssistencia(tipo)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {agendamentosFiltrados.length} de {agendamentos.length} agendamentos
                  </div>
                </div>

                {/* Agendamentos List */}
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paciente
                          </th>
                          <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profissional
                          </th>
                          <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data/Hora
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {agendamentosFiltrados.map((agendamento) => (
                          <tr key={agendamento.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {agendamento.pacienteNome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {agendamento.pacienteTelefone}
                                </div>
                                <div className="md:hidden text-xs text-gray-500 mt-1">
                                  {agendamento.profissionalNome}
                                </div>
                                <div className="lg:hidden text-xs mt-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(agendamento.tipoAssistencia)}`}>
                                    {AssistenciaEntity.formatarTipoAssistencia(agendamento.tipoAssistencia)}
                                  </span>
                                </div>
                                <div className="sm:hidden text-xs text-gray-500 mt-1">
                                  {new Date(agendamento.dataHoraAgendamento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {agendamento.profissionalNome}
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(agendamento.tipoAssistencia)}`}>
                                {AssistenciaEntity.formatarTipoAssistencia(agendamento.tipoAssistencia)}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(agendamento.dataHoraAgendamento).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agendamento.status)}`}>
                                {AssistenciaEntity.formatarStatusAgendamento(agendamento.status)}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <button
                                  onClick={() => handleViewAgendamento(agendamento)}
                                  className="text-blue-600 hover:text-blue-900 text-left"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={() => handleEditAgendamento(agendamento)}
                                  className="text-indigo-600 hover:text-indigo-900 text-left"
                                >
                                  Editar
                                </button>
                                {agendamento.status === StatusAgendamento.Agendado && (
                                  <button
                                    onClick={() => handleStatusChange(agendamento.id, StatusAgendamento.Confirmado)}
                                    className="text-green-600 hover:text-green-900 text-left"
                                  >
                                    Confirmar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAgendamento(agendamento)}
                                  className="text-red-600 hover:text-red-900 text-left"
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
                  
                  {agendamentosFiltrados.length === 0 && (
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <HiCalendar className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' || tipoFilter !== 'all' 
                          ? 'Tente ajustar os filtros de busca'
                          : 'Clique em "Novo Agendamento" para criar o primeiro agendamento'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Profissionais */}
            {activeTab === 1 && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Profissionais Cadastrados</h3>
                  <button
                    onClick={handleCreateProfissional}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <HiPlus className="w-5 h-5" />
                    Novo Profissional
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profissionaisFiltrados.map((profissional) => (
                    <div key={profissional.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900">{profissional.nome}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profissional.status === StatusProfissional.Ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profissional.status === StatusProfissional.Ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <HiAcademicCap className="w-4 h-4 mr-2 text-blue-500" />
                          {AssistenciaEntity.formatarTipoAssistencia(profissional.especialidade)}
                        </div>
                        <div className="flex items-center">
                          <HiClipboardDocumentList className="w-4 h-4 mr-2 text-gray-500" />
                          {profissional.registroProfissional}
                        </div>
                        <div className="flex items-center">
                          <HiPhone className="w-4 h-4 mr-2 text-green-500" />
                          {profissional.telefone}
                        </div>
                        <div className="flex items-center">
                          <HiEnvelope className="w-4 h-4 mr-2 text-purple-500" />
                          {profissional.email}
                        </div>
                        {profissional.valorConsulta && (
                          <div className="flex items-center">
                            <HiCurrencyDollar className="w-4 h-4 mr-2 text-yellow-600" />
                            R$ {profissional.valorConsulta.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleViewProfissional(profissional)}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditProfissional(profissional)}
                          className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-200 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {profissionaisFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <HiUserGroup className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum profissional encontrado</h3>
                    <p className="text-gray-500">Clique em "Novo Profissional" para cadastrar o primeiro profissional</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Pedidos de Ajuda */}
            {activeTab === 2 && (
              <div>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                      <input
                        type="text"
                        placeholder="Buscar por título, solicitante, destinatário..."
                        value={searchHelpRequest}
                        onChange={(e) => setSearchHelpRequest(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusHelpRequestFilter}
                        onChange={(e) => setStatusHelpRequestFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="all">Todos os Status</option>
                        <option value={HelpRequestStatus.Pendente}>Pendente</option>
                        <option value={HelpRequestStatus.EmAnalise}>Em Análise</option>
                        <option value={HelpRequestStatus.Aceito}>Aceito</option>
                        <option value={HelpRequestStatus.Recusado}>Recusado</option>
                        <option value={HelpRequestStatus.Concluido}>Concluído</option>
                        <option value={HelpRequestStatus.Cancelado}>Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                      <select
                        value={prioridadeHelpRequestFilter}
                        onChange={(e) => setPrioridadeHelpRequestFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="all">Todas as Prioridades</option>
                        <option value={HelpRequestPriority.Baixa}>Baixa</option>
                        <option value={HelpRequestPriority.Normal}>Normal</option>
                        <option value={HelpRequestPriority.Alta}>Alta</option>
                        <option value={HelpRequestPriority.Urgente}>Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Mostrando {helpRequestsFiltrados.length} de {helpRequests.length} pedidos
                  </div>
                </div>

                {/* Help Requests List */}
                <div className="bg-white rounded-lg shadow">
                  {helpRequestsFiltrados.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {helpRequestsFiltrados.map((request) => (
                        <div key={request.id} className="p-6 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">{request.titulo}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === HelpRequestStatus.Pendente ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === HelpRequestStatus.EmAnalise ? 'bg-blue-100 text-blue-800' :
                                  request.status === HelpRequestStatus.Aceito ? 'bg-green-100 text-green-800' :
                                  request.status === HelpRequestStatus.Recusado ? 'bg-red-100 text-red-800' :
                                  request.status === HelpRequestStatus.Concluido ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.prioridade === HelpRequestPriority.Urgente ? 'bg-red-100 text-red-800' :
                                  request.prioridade === HelpRequestPriority.Alta ? 'bg-orange-100 text-orange-800' :
                                  request.prioridade === HelpRequestPriority.Normal ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.prioridade}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-3">{request.descricao}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Solicitante:</span>
                                  <span className="ml-2 text-gray-900">{request.solicitanteNome}</span>
                                  <span className="ml-2 text-gray-500">({request.solicitanteEspecialidade})</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Destinatário:</span>
                                  <span className="ml-2 text-gray-900">
                                    {request.destinatarioNome || 'Aberto para todos'}
                                  </span>
                                  {request.destinatarioEspecialidade && (
                                    <span className="ml-2 text-gray-500">({request.destinatarioEspecialidade})</span>
                                  )}
                                </div>
                                {request.pacienteNome && (
                                  <div>
                                    <span className="font-medium text-gray-700">Paciente:</span>
                                    <span className="ml-2 text-gray-900">{request.pacienteNome}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium text-gray-700">Criado em:</span>
                                  <span className="ml-2 text-gray-900">
                                    {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <HiHandRaised className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido de ajuda encontrado</h3>
                      <p className="text-gray-500">
                        {searchHelpRequest || statusHelpRequestFilter !== 'all' || prioridadeHelpRequestFilter !== 'all'
                          ? 'Tente ajustar os filtros de busca'
                          : 'Profissionais podem criar pedidos de ajuda na página dedicada'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Relatórios */}
            {activeTab === 3 && (
              <AssistanceReports />
            )}

            {/* Tab 5: Estatísticas */}
            {activeTab === 4 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Tipo de Assistência</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(statistics.porTipo).map(([tipo, count]) => (
                      <div key={tipo} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="mb-2 flex justify-center">
                          {tipo === TipoAssistencia.Psicologica && <HiSparkles className="w-10 h-10 text-blue-500" />}
                          {tipo === TipoAssistencia.Social && <HiHandRaised className="w-10 h-10 text-green-500" />}
                          {tipo === TipoAssistencia.Juridica && <HiScale className="w-10 h-10 text-purple-500" />}
                          {tipo === TipoAssistencia.Medica && <HiHeart className="w-10 h-10 text-red-500" />}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600">
                          {AssistenciaEntity.formatarTipoAssistencia(tipo as TipoAssistencia)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(statistics.porStatus).filter(([, count]) => count > 0).map(([status, count]) => (
                      <div key={status} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className={`text-lg font-bold mb-2 ${getStatusColor(status as StatusAgendamento).replace('bg-', 'text-').replace('-100', '-600')}`}>
                          {count}
                        </div>
                        <div className="text-sm text-gray-600">
                          {AssistenciaEntity.formatarStatusAgendamento(status as StatusAgendamento)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AgendamentoAssistenciaModalEnhanced
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        agendamento={selectedAgendamento}
        mode={modalMode}
      />
      
      <ProfissionalAssistenciaModal
        isOpen={isProfissionalModalOpen}
        onClose={() => setIsProfissionalModalOpen(false)}
        onSave={handleSaveProfissional}
        onDelete={handleDeleteProfissional}
        onInactivate={handleInactivateProfissional}
        onAccountCreated={(profissionalId: string, userId: string) => {
          // Update the professional in the list with the new userId
          setProfissionais(prev => prev.map(p =>
            p.id === profissionalId
              ? { ...p, userId }
              : p
          ));

          // Update the selected professional as well
          if (selectedProfissional && selectedProfissional.id === profissionalId) {
            setSelectedProfissional({ ...selectedProfissional, userId });
          }
        }}
        profissional={selectedProfissional}
        mode={profissionalModalMode}
      />

      <AnamnesesPsicologicaModal
        isOpen={isAnamneseModalOpen}
        onClose={() => setIsAnamneseModalOpen(false)}
        onSave={handleSaveAnamnese}
        anamnese={selectedAnamnese}
        mode={anamneseModalMode}
        assistidoId={anamneseAssistidoId}
        assistidoNome={anamneseAssistidoNome}
      />
    </div>
  );
};

export default AssistenciaManagementPage;