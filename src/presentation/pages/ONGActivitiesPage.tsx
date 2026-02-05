import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseONGRepository } from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository';
import { 
  AtividadeONG, 
  StatusAtividade, 
  TipoAtividade,
  Voluntario,
  RecursoAtividade,
  RelatorioAtividade,
  ONGEntity
} from '@modules/ong-management/settings/domain/entities/ONG';

const ONGActivitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<AtividadeONG[]>([]);
  const [volunteers, setVolunteers] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AtividadeONG | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusAtividade | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TipoAtividade | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<AtividadeONG | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: TipoAtividade.Outro,
    dataInicio: '',
    dataFim: '',
    horaInicio: '09:00',
    horaFim: '12:00',
    local: '',
    responsavel: '',
    voluntariosNecessarios: 1,
    voluntariosConfirmados: [] as string[],
    beneficiarios: 0,
    status: StatusAtividade.Planejada,
    recursos: [] as RecursoAtividade[],
    observacoes: '',
    fotos: [] as string[]
  });

  const [reportData, setReportData] = useState<RelatorioAtividade>({
    voluntariosPresentes: [],
    horasRealizadas: 0,
    beneficiariosAtendidos: 0,
    resultados: '',
    desafios: '',
    proximosPassos: '',
    gastosRealizados: 0,
    fotoRelatorio: []
  });

  const [newRecurso, setNewRecurso] = useState({
    tipo: '',
    descricao: '',
    quantidade: 1,
    valor: 0,
    doador: ''
  });

  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');

  const ongRepository = new FirebaseONGRepository();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesData, volunteersData] = await Promise.all([
        ongRepository.getAllAtividades(),
        ongRepository.getAllVoluntarios()
      ]);
      setActivities(activitiesData);
      setVolunteers(volunteersData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (activity?: AtividadeONG) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        nome: activity.nome,
        descricao: activity.descricao,
        tipo: activity.tipo,
        dataInicio: activity.dataInicio.toISOString().split('T')[0],
        dataFim: activity.dataFim.toISOString().split('T')[0],
        horaInicio: activity.horaInicio,
        horaFim: activity.horaFim,
        local: activity.local,
        responsavel: activity.responsavel,
        voluntariosNecessarios: activity.voluntariosNecessarios,
        voluntariosConfirmados: activity.voluntariosConfirmados,
        beneficiarios: activity.beneficiarios,
        status: activity.status,
        recursos: activity.recursos || [],
        observacoes: activity.observacoes || '',
        fotos: activity.fotos || []
      });
    } else {
      setEditingActivity(null);
      setFormData({
        nome: '',
        descricao: '',
        tipo: TipoAtividade.Outro,
        dataInicio: '',
        dataFim: '',
        horaInicio: '09:00',
        horaFim: '12:00',
        local: '',
        responsavel: '',
        voluntariosNecessarios: 1,
        voluntariosConfirmados: [],
        beneficiarios: 0,
        status: StatusAtividade.Planejada,
        recursos: [],
        observacoes: '',
        fotos: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
    setVolunteerSearchTerm(''); // Clear volunteer search when closing modal
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVolunteerToggle = (volunteerId: string) => {
    setFormData(prev => ({
      ...prev,
      voluntariosConfirmados: prev.voluntariosConfirmados.includes(volunteerId)
        ? prev.voluntariosConfirmados.filter(id => id !== volunteerId)
        : [...prev.voluntariosConfirmados, volunteerId]
    }));
  };

  const handleAddRecurso = () => {
    if (newRecurso.tipo.trim() && newRecurso.descricao.trim()) {
      setFormData(prev => ({
        ...prev,
        recursos: [...prev.recursos, { ...newRecurso }]
      }));
      setNewRecurso({
        tipo: '',
        descricao: '',
        quantidade: 1,
        valor: 0,
        doador: ''
      });
    }
  };

  const handleRemoveRecurso = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recursos: prev.recursos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      alert('Nome da atividade é obrigatório');
      return false;
    }
    
    if (!formData.dataInicio || !formData.dataFim) {
      alert('Datas de início e fim são obrigatórias');
      return false;
    }
    
    if (new Date(formData.dataInicio) > new Date(formData.dataFim)) {
      alert('Data de início não pode ser posterior à data de fim');
      return false;
    }
    
    if (!formData.local.trim()) {
      alert('Local da atividade é obrigatório');
      return false;
    }
    
    if (!formData.responsavel.trim()) {
      alert('Responsável pela atividade é obrigatório');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const activityData = {
        ...formData,
        dataInicio: new Date(formData.dataInicio),
        dataFim: new Date(formData.dataFim),
        createdBy: currentUser?.email || 'admin'
      };
      
      if (editingActivity) {
        await ongRepository.updateAtividade(editingActivity.id, activityData);
        alert('Atividade atualizada com sucesso!');
      } else {
        await ongRepository.createAtividade(activityData);
        alert('Atividade cadastrada com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Erro ao salvar atividade');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade?')) return;
    
    try {
      await ongRepository.deleteAtividade(id);
      alert('Atividade excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Erro ao excluir atividade');
    }
  };

  const handleViewDetails = (activity: AtividadeONG) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  const handleOpenReport = (activity: AtividadeONG) => {
    setSelectedActivity(activity);
    if (activity.relatorio) {
      setReportData(activity.relatorio);
    } else {
      setReportData({
        voluntariosPresentes: [],
        horasRealizadas: ONGEntity.calcularDuracaoAtividade(activity),
        beneficiariosAtendidos: activity.beneficiarios,
        resultados: '',
        desafios: '',
        proximosPassos: '',
        gastosRealizados: 0,
        fotoRelatorio: []
      });
    }
    setShowReportModal(true);
  };

  const handleSaveReport = async () => {
    if (!selectedActivity) return;
    
    try {
      await ongRepository.updateAtividade(selectedActivity.id, {
        relatorio: reportData,
        status: StatusAtividade.Concluida
      });
      alert('Relatório salvo com sucesso!');
      setShowReportModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Erro ao salvar relatório');
    }
  };

  const filteredActivities = activities.filter(a => {
    const matchesSearch = searchTerm === '' || 
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesType = typeFilter === 'all' || a.tipo === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: StatusAtividade) => {
    switch (status) {
      case StatusAtividade.Planejada: return 'bg-blue-100 text-blue-800';
      case StatusAtividade.EmAndamento: return 'bg-yellow-100 text-yellow-800';
      case StatusAtividade.Concluida: return 'bg-green-100 text-green-800';
      case StatusAtividade.Cancelada: return 'bg-red-100 text-red-800';
      case StatusAtividade.Adiada: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVolunteerName = (id: string) => {
    const volunteer = volunteers.find(v => v.id === id);
    return volunteer ? volunteer.nome : 'Voluntário não encontrado';
  };

  // Filter volunteers based on search term
  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.nome.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
    volunteer.telefone.includes(volunteerSearchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando atividades...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">🎯 Gerenciamento de Atividades</h1>
              <p className="mt-1 text-sm text-gray-600">
                Total de {filteredActivities.length} atividades
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              + Nova Atividade
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pesquisar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, descrição ou local..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusAtividade | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value={StatusAtividade.Planejada}>Planejada</option>
                <option value={StatusAtividade.EmAndamento}>Em Andamento</option>
                <option value={StatusAtividade.Concluida}>Concluída</option>
                <option value={StatusAtividade.Cancelada}>Cancelada</option>
                <option value={StatusAtividade.Adiada}>Adiada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TipoAtividade | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value={TipoAtividade.Educacional}>Educacional</option>
                <option value={TipoAtividade.Saude}>Saúde</option>
                <option value={TipoAtividade.Alimentacao}>Alimentação</option>
                <option value={TipoAtividade.Cultura}>Cultura</option>
                <option value={TipoAtividade.Esporte}>Esporte</option>
                <option value={TipoAtividade.MeioAmbiente}>Meio Ambiente</option>
                <option value={TipoAtividade.AssistenciaSocial}>Assistência Social</option>
                <option value={TipoAtividade.Administrativo}>Administrativo</option>
                <option value={TipoAtividade.Arrecadacao}>Arrecadação</option>
                <option value={TipoAtividade.Evento}>Evento</option>
                <option value={TipoAtividade.Outro}>Outro</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atividade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Horário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voluntários
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
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.nome}</div>
                        <div className="text-sm text-gray-500">{activity.tipo} • {activity.local}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {activity.dataInicio.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.horaInicio} - {activity.horaFim}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activity.voluntariosConfirmados.length}/{activity.voluntariosNecessarios}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.beneficiarios} beneficiários
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(activity)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Ver
                      </button>
                      {(activity.status === StatusAtividade.EmAndamento || activity.status === StatusAtividade.Concluida) && (
                        <button
                          onClick={() => handleOpenReport(activity)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Relatório
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(activity)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Atividade *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={TipoAtividade.Educacional}>Educacional</option>
                      <option value={TipoAtividade.Saude}>Saúde</option>
                      <option value={TipoAtividade.Alimentacao}>Alimentação</option>
                      <option value={TipoAtividade.Cultura}>Cultura</option>
                      <option value={TipoAtividade.Esporte}>Esporte</option>
                      <option value={TipoAtividade.MeioAmbiente}>Meio Ambiente</option>
                      <option value={TipoAtividade.AssistenciaSocial}>Assistência Social</option>
                      <option value={TipoAtividade.Administrativo}>Administrativo</option>
                      <option value={TipoAtividade.Arrecadacao}>Arrecadação</option>
                      <option value={TipoAtividade.Evento}>Evento</option>
                      <option value={TipoAtividade.Outro}>Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={formData.dataInicio}
                      onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim *
                    </label>
                    <input
                      type="date"
                      value={formData.dataFim}
                      onChange={(e) => handleInputChange('dataFim', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Início
                    </label>
                    <input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fim
                    </label>
                    <input
                      type="time"
                      value={formData.horaFim}
                      onChange={(e) => handleInputChange('horaFim', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local *
                    </label>
                    <input
                      type="text"
                      value={formData.local}
                      onChange={(e) => handleInputChange('local', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsável *
                    </label>
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => handleInputChange('responsavel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voluntários Necessários
                    </label>
                    <input
                      type="number"
                      value={formData.voluntariosNecessarios}
                      onChange={(e) => handleInputChange('voluntariosNecessarios', parseInt(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiários Estimados
                    </label>
                    <input
                      type="number"
                      value={formData.beneficiarios}
                      onChange={(e) => handleInputChange('beneficiarios', parseInt(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={StatusAtividade.Planejada}>Planejada</option>
                      <option value={StatusAtividade.EmAndamento}>Em Andamento</option>
                      <option value={StatusAtividade.Concluida}>Concluída</option>
                      <option value={StatusAtividade.Cancelada}>Cancelada</option>
                      <option value={StatusAtividade.Adiada}>Adiada</option>
                    </select>
                  </div>
                </div>

                {/* Volunteers Selection */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Voluntários Confirmados</h4>
                  
                  {/* Search field for volunteers */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="🔍 Pesquisar voluntários por nome, email ou telefone..."
                      value={volunteerSearchTerm}
                      onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-4">
                    {filteredVolunteers.length > 0 ? (
                      filteredVolunteers.map((volunteer) => (
                        <label key={volunteer.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.voluntariosConfirmados.includes(volunteer.id)}
                            onChange={() => handleVolunteerToggle(volunteer.id)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">
                            {volunteer.nome}
                            <span className="text-gray-500 ml-2 text-xs">
                              {volunteer.email} • {volunteer.telefone}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-2">
                        {volunteerSearchTerm ? 'Nenhum voluntário encontrado com esse critério de pesquisa.' : 'Nenhum voluntário cadastrado.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Recursos Necessários</h4>
                  
                  {/* Field Labels */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tipo de Recurso
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Descrição Detalhada
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Quantidade
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Valor (R$)
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Ação
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="ex: Alimentação, Material..."
                      value={newRecurso.tipo}
                      onChange={(e) => setNewRecurso(prev => ({ ...prev, tipo: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="ex: Marmitas para almoço..."
                      value={newRecurso.descricao}
                      onChange={(e) => setNewRecurso(prev => ({ ...prev, descricao: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="50"
                      value={newRecurso.quantidade}
                      onChange={(e) => setNewRecurso(prev => ({ ...prev, quantidade: parseInt(e.target.value) }))}
                      min="1"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="15.00"
                      value={newRecurso.valor}
                      onChange={(e) => setNewRecurso(prev => ({ ...prev, valor: parseFloat(e.target.value) }))}
                      min="0"
                      step="0.01"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleAddRecurso}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                  
                  {formData.recursos.length > 0 && (
                    <div className="space-y-2">
                      {formData.recursos.map((recurso, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div>
                            <span className="font-medium">{recurso.tipo}</span> - {recurso.descricao}
                            <span className="text-gray-500 ml-2">
                              Qtd: {recurso.quantidade} • Valor: {ONGEntity.formatarMoeda(recurso.valor || 0)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveRecurso(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingActivity ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes da Atividade
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedActivity.nome}</h4>
                    <p className="text-gray-700">{selectedActivity.descricao}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900">Informações Gerais</h5>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Tipo:</dt>
                          <dd className="text-gray-900">{selectedActivity.tipo}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Status:</dt>
                          <dd>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedActivity.status)}`}>
                              {selectedActivity.status.replace('_', ' ')}
                            </span>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Local:</dt>
                          <dd className="text-gray-900">{selectedActivity.local}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Responsável:</dt>
                          <dd className="text-gray-900">{selectedActivity.responsavel}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900">Data e Horário</h5>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Data:</dt>
                          <dd className="text-gray-900">
                            {selectedActivity.dataInicio.toLocaleDateString('pt-BR')} - {selectedActivity.dataFim.toLocaleDateString('pt-BR')}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Horário:</dt>
                          <dd className="text-gray-900">{selectedActivity.horaInicio} - {selectedActivity.horaFim}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Duração:</dt>
                          <dd className="text-gray-900">{ONGEntity.calcularDuracaoAtividade(selectedActivity)}h</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900">Participação</h5>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Voluntários confirmados:</dt>
                        <dd className="text-gray-900">
                          {selectedActivity.voluntariosConfirmados.length}/{selectedActivity.voluntariosNecessarios}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Beneficiários estimados:</dt>
                        <dd className="text-gray-900">{selectedActivity.beneficiarios}</dd>
                      </div>
                    </dl>
                    
                    {selectedActivity.voluntariosConfirmados.length > 0 && (
                      <div className="mt-3">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Voluntários:</h6>
                        <div className="flex flex-wrap gap-2">
                          {selectedActivity.voluntariosConfirmados.map(volunteerId => (
                            <span key={volunteerId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {getVolunteerName(volunteerId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedActivity.recursos && selectedActivity.recursos.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900">Recursos</h5>
                      <div className="mt-2 space-y-2">
                        {selectedActivity.recursos.map((recurso, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between">
                              <span className="font-medium">{recurso.tipo}</span>
                              <span className="text-gray-500">{ONGEntity.formatarMoeda(recurso.valor || 0)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {recurso.descricao} (Qtd: {recurso.quantidade})
                              {recurso.doador && <span className="ml-2">• Doador: {recurso.doador}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedActivity.relatorio && (
                    <div>
                      <h5 className="font-medium text-gray-900">Relatório de Execução</h5>
                      <div className="mt-2 space-y-2 text-sm">
                        <div>
                          <strong>Resultados:</strong>
                          <p className="text-gray-700">{selectedActivity.relatorio.resultados}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>Horas realizadas: {selectedActivity.relatorio.horasRealizadas}h</div>
                          <div>Beneficiários atendidos: {selectedActivity.relatorio.beneficiariosAtendidos}</div>
                        </div>
                        {selectedActivity.relatorio.desafios && (
                          <div>
                            <strong>Desafios:</strong>
                            <p className="text-gray-700">{selectedActivity.relatorio.desafios}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedActivity.observacoes && (
                    <div>
                      <h5 className="font-medium text-gray-900">Observações</h5>
                      <p className="mt-2 text-sm text-gray-700">{selectedActivity.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowReportModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Relatório da Atividade: {selectedActivity.nome}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Realizadas
                    </label>
                    <input
                      type="number"
                      value={reportData.horasRealizadas}
                      onChange={(e) => setReportData(prev => ({ ...prev, horasRealizadas: parseFloat(e.target.value) }))}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiários Atendidos
                    </label>
                    <input
                      type="number"
                      value={reportData.beneficiariosAtendidos}
                      onChange={(e) => setReportData(prev => ({ ...prev, beneficiariosAtendidos: parseInt(e.target.value) }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voluntários Presentes
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {volunteers
                      .filter(v => selectedActivity.voluntariosConfirmados.includes(v.id))
                      .map((volunteer) => (
                      <label key={volunteer.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={reportData.voluntariosPresentes.includes(volunteer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportData(prev => ({
                                ...prev,
                                voluntariosPresentes: [...prev.voluntariosPresentes, volunteer.id]
                              }));
                            } else {
                              setReportData(prev => ({
                                ...prev,
                                voluntariosPresentes: prev.voluntariosPresentes.filter(id => id !== volunteer.id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{volunteer.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultados Obtidos
                  </label>
                  <textarea
                    value={reportData.resultados}
                    onChange={(e) => setReportData(prev => ({ ...prev, resultados: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Descreva os principais resultados alcançados..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desafios Enfrentados
                  </label>
                  <textarea
                    value={reportData.desafios || ''}
                    onChange={(e) => setReportData(prev => ({ ...prev, desafios: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Principais dificuldades encontradas..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Próximos Passos
                  </label>
                  <textarea
                    value={reportData.proximosPassos || ''}
                    onChange={(e) => setReportData(prev => ({ ...prev, proximosPassos: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ações para melhorar futuras atividades..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gastos Realizados (R$)
                  </label>
                  <input
                    type="number"
                    value={reportData.gastosRealizados || 0}
                    onChange={(e) => setReportData(prev => ({ ...prev, gastosRealizados: parseFloat(e.target.value) }))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Salvar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ONGActivitiesPage;