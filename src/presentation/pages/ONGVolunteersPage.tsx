import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseONGRepository } from '@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { 
  Voluntario, 
  StatusVoluntario, 
  DisponibilidadeVoluntario,
  ONGEntity 
} from '@modules/ong-management/settings/domain/entities/ONG';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../components/ConfirmDialog';

const ONGVolunteersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { confirm } = useConfirmDialog();
  const [volunteers, setVolunteers] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Voluntario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusVoluntario | 'all'>('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Voluntario | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    habilidades: [] as string[],
    areasInteresse: [] as string[],
    disponibilidade: [] as DisponibilidadeVoluntario[],
    horasSemanaisDisponivel: 0,
    status: StatusVoluntario.Pendente,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    observacoes: '',
    emergencia: {
      nome: '',
      parentesco: '',
      telefone: '',
      telefone2: ''
    }
  });

  const [newHabilidade, setNewHabilidade] = useState('');
  const [newArea, setNewArea] = useState('');

  const ongRepository = new FirebaseONGRepository();

  useEffect(() => {
    loadVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const data = await ongRepository.getAllVoluntarios();
      setVolunteers(data);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      toast.error('Erro ao carregar voluntários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (volunteer?: Voluntario) => {
    if (volunteer) {
      setEditingVolunteer(volunteer);
      setFormData({
        nome: volunteer.nome,
        email: volunteer.email,
        telefone: volunteer.telefone,
        cpf: volunteer.cpf,
        dataNascimento: volunteer.dataNascimento.toISOString().split('T')[0],
        endereco: {
          ...volunteer.endereco,
          complemento: volunteer.endereco.complemento || ''
        },
        habilidades: volunteer.habilidades,
        areasInteresse: volunteer.areasInteresse,
        disponibilidade: volunteer.disponibilidade,
        horasSemanaisDisponivel: volunteer.horasSemanaisDisponivel,
        status: volunteer.status,
        dataInicio: volunteer.dataInicio.toISOString().split('T')[0],
        dataFim: volunteer.dataFim ? volunteer.dataFim.toISOString().split('T')[0] : '',
        observacoes: volunteer.observacoes || '',
        emergencia: {
          ...volunteer.emergencia,
          telefone2: volunteer.emergencia.telefone2 || ''
        }
      });
    } else {
      setEditingVolunteer(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        dataNascimento: '',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        habilidades: [],
        areasInteresse: [],
        disponibilidade: [],
        horasSemanaisDisponivel: 0,
        status: StatusVoluntario.Pendente,
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: '',
        observacoes: '',
        emergencia: {
          nome: '',
          parentesco: '',
          telefone: '',
          telefone2: ''
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVolunteer(null);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddHabilidade = () => {
    if (newHabilidade.trim()) {
      setFormData(prev => ({
        ...prev,
        habilidades: [...prev.habilidades, newHabilidade.trim()]
      }));
      setNewHabilidade('');
    }
  };

  const handleRemoveHabilidade = (index: number) => {
    setFormData(prev => ({
      ...prev,
      habilidades: prev.habilidades.filter((_, i) => i !== index)
    }));
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      setFormData(prev => ({
        ...prev,
        areasInteresse: [...prev.areasInteresse, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const handleRemoveArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areasInteresse: prev.areasInteresse.filter((_, i) => i !== index)
    }));
  };

  const handleAddDisponibilidade = () => {
    setFormData(prev => ({
      ...prev,
      disponibilidade: [...prev.disponibilidade, {
        diaSemana: 1,
        horaInicio: '09:00',
        horaFim: '12:00'
      }]
    }));
  };

  const handleUpdateDisponibilidade = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      disponibilidade: prev.disponibilidade.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleRemoveDisponibilidade = (index: number) => {
    setFormData(prev => ({
      ...prev,
      disponibilidade: prev.disponibilidade.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    
    if (!formData.telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    
    if (!formData.dataInicio.trim()) {
      toast.error('Data de início é obrigatória');
      return false;
    }
    
    if (!formData.cpf.trim()) {
      toast.error('CPF é obrigatório');
      return false;
    }
    
    if (!ONGEntity.validarCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return false;
    }
    
    if (!formData.emergencia.nome.trim()) {
      toast.error('Contato de emergência é obrigatório');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      // Validate and convert dates
      const dataNascimento = formData.dataNascimento ? new Date(formData.dataNascimento) : new Date();
      const dataInicio = formData.dataInicio ? new Date(formData.dataInicio) : new Date();
      const dataFim = formData.dataFim && formData.dataFim.trim() !== '' ? new Date(formData.dataFim) : undefined;

      // Validate if dates are valid
      if (formData.dataNascimento && isNaN(dataNascimento.getTime())) {
        toast.error('Data de nascimento inválida');
        return;
      }
      if (formData.dataInicio && isNaN(dataInicio.getTime())) {
        toast.error('Data de início inválida');
        return;
      }
      if (dataFim && isNaN(dataFim.getTime())) {
        toast.error('Data de fim inválida');
        return;
      }

      const volunteerData = {
        ...formData,
        dataNascimento,
        dataInicio,
        dataFim,
        createdBy: currentUser?.email || 'admin'
      };
      
      if (editingVolunteer) {
        await ongRepository.updateVoluntario(editingVolunteer.id, volunteerData);
        await loggingService.logDatabase('info', 'ONG volunteer updated', `Volunteer: "${formData.nome}"`, currentUser);
        toast.success('Voluntário atualizado com sucesso!');
      } else {
        await ongRepository.createVoluntario(volunteerData);
        await loggingService.logDatabase('info', 'ONG volunteer created', `Volunteer: "${formData.nome}"`, currentUser);
        toast.success('Voluntário cadastrado com sucesso!');
      }

      handleCloseModal();
      loadVolunteers();
    } catch (error) {
      console.error('Error saving volunteer:', error);
      await loggingService.logDatabase('error', 'Failed to save ONG volunteer', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, currentUser);
      toast.error('Erro ao salvar voluntário');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja excluir este voluntário?', variant: 'danger' });
    if (!confirmed) return;

    try {
      await ongRepository.deleteVoluntario(id);
      await loggingService.logDatabase('warning', 'ONG volunteer deleted', `ID: ${id}`, currentUser);
      toast.success('Voluntário excluído com sucesso!');
      loadVolunteers();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      await loggingService.logDatabase('error', 'Failed to delete ONG volunteer', `ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`, currentUser);
      toast.error('Erro ao excluir voluntário');
    }
  };

  const handleViewDetails = (volunteer: Voluntario) => {
    setSelectedVolunteer(volunteer);
    setShowDetailsModal(true);
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = searchTerm === '' || 
      v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cpf.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: StatusVoluntario) => {
    switch (status) {
      case StatusVoluntario.Ativo: return 'bg-green-100 text-green-800';
      case StatusVoluntario.Inativo: return 'bg-gray-100 text-gray-800';
      case StatusVoluntario.Afastado: return 'bg-yellow-100 text-yellow-800';
      case StatusVoluntario.Desligado: return 'bg-red-100 text-red-800';
      case StatusVoluntario.Pendente: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando voluntários...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">👥 Gerenciamento de Voluntários</h1>
              <p className="mt-1 text-sm text-gray-600">
                Total de {filteredVolunteers.length} voluntários
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              + Novo Voluntário
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pesquisar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, email ou CPF..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusVoluntario | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value={StatusVoluntario.Ativo}>Ativo</option>
                <option value={StatusVoluntario.Inativo}>Inativo</option>
                <option value={StatusVoluntario.Afastado}>Afastado</option>
                <option value={StatusVoluntario.Desligado}>Desligado</option>
                <option value={StatusVoluntario.Pendente}>Pendente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Volunteers List */}
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas/Semana
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
                {filteredVolunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{volunteer.nome}</div>
                        <div className="text-sm text-gray-500">CPF: {ONGEntity.formatarCPF(volunteer.cpf)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{volunteer.email}</div>
                        <div className="text-sm text-gray-500">{ONGEntity.formatarTelefone(volunteer.telefone)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{volunteer.horasSemanaisDisponivel}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(volunteer.status)}`}>
                        {volunteer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(volunteer)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleOpenModal(volunteer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(volunteer.id)}
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
                  {editingVolunteer ? 'Editar Voluntário' : 'Novo Voluntário'}
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Informações Pessoais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
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
                        CPF *
                      </label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        maxLength={14}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
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
                        <option value={StatusVoluntario.Pendente}>Pendente</option>
                        <option value={StatusVoluntario.Ativo}>Ativo</option>
                        <option value={StatusVoluntario.Inativo}>Inativo</option>
                        <option value={StatusVoluntario.Afastado}>Afastado</option>
                        <option value={StatusVoluntario.Desligado}>Desligado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.cep}
                        onChange={(e) => handleInputChange('endereco.cep', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logradouro
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.logradouro}
                        onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.numero}
                        onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.bairro}
                        onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.cidade}
                        onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.endereco.estado}
                        onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Skills and Interests */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Habilidades e Interesses</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Habilidades
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newHabilidade}
                        onChange={(e) => setNewHabilidade(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddHabilidade()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Digite uma habilidade"
                      />
                      <button
                        type="button"
                        onClick={handleAddHabilidade}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.habilidades.map((hab, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {hab}
                          <button
                            onClick={() => handleRemoveHabilidade(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Áreas de Interesse
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Digite uma área"
                      />
                      <button
                        type="button"
                        onClick={handleAddArea}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.areasInteresse.map((area, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {area}
                          <button
                            onClick={() => handleRemoveArea(index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Disponibilidade</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Semanais Disponíveis
                    </label>
                    <input
                      type="number"
                      value={formData.horasSemanaisDisponivel}
                      onChange={(e) => handleInputChange('horasSemanaisDisponivel', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Horários Disponíveis
                      </label>
                      <button
                        type="button"
                        onClick={handleAddDisponibilidade}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Adicionar Horário
                      </button>
                    </div>
                    {formData.disponibilidade.map((disp, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <select
                          value={disp.diaSemana}
                          onChange={(e) => handleUpdateDisponibilidade(index, 'diaSemana', parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {diasSemana.map((dia, i) => (
                            <option key={i} value={i}>{dia}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={disp.horaInicio}
                          onChange={(e) => handleUpdateDisponibilidade(index, 'horaInicio', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="time"
                          value={disp.horaFim}
                          onChange={(e) => handleUpdateDisponibilidade(index, 'horaFim', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          onClick={() => handleRemoveDisponibilidade(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Contato de Emergência</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.emergencia.nome}
                        onChange={(e) => handleInputChange('emergencia.nome', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parentesco
                      </label>
                      <input
                        type="text"
                        value={formData.emergencia.parentesco}
                        onChange={(e) => handleInputChange('emergencia.parentesco', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Principal
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencia.telefone}
                        onChange={(e) => handleInputChange('emergencia.telefone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Secundário
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencia.telefone2 || ''}
                        onChange={(e) => handleInputChange('emergencia.telefone2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
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
                  {editingVolunteer ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVolunteer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Voluntário
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Informações Pessoais</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Nome:</dt>
                        <dd className="text-sm text-gray-900">{selectedVolunteer.nome}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">CPF:</dt>
                        <dd className="text-sm text-gray-900">{ONGEntity.formatarCPF(selectedVolunteer.cpf)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Email:</dt>
                        <dd className="text-sm text-gray-900">{selectedVolunteer.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Telefone:</dt>
                        <dd className="text-sm text-gray-900">{ONGEntity.formatarTelefone(selectedVolunteer.telefone)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Status:</dt>
                        <dd>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedVolunteer.status)}`}>
                            {selectedVolunteer.status}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {selectedVolunteer.habilidades.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Habilidades</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedVolunteer.habilidades.map((hab, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {hab}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVolunteer.areasInteresse.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Áreas de Interesse</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedVolunteer.areasInteresse.map((area, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVolunteer.disponibilidade.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Disponibilidade</h4>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-gray-700">
                          Horas semanais: {selectedVolunteer.horasSemanaisDisponivel}h
                        </div>
                        {selectedVolunteer.disponibilidade.map((disp, index) => (
                          <div key={index} className="text-sm text-gray-700">
                            {diasSemana[disp.diaSemana]}: {disp.horaInicio} - {disp.horaFim}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900">Contato de Emergência</h4>
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Nome:</dt>
                        <dd className="text-sm text-gray-900">{selectedVolunteer.emergencia.nome}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Parentesco:</dt>
                        <dd className="text-sm text-gray-900">{selectedVolunteer.emergencia.parentesco}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Telefone:</dt>
                        <dd className="text-sm text-gray-900">{ONGEntity.formatarTelefone(selectedVolunteer.emergencia.telefone)}</dd>
                      </div>
                    </dl>
                  </div>

                  {selectedVolunteer.observacoes && (
                    <div>
                      <h4 className="font-medium text-gray-900">Observações</h4>
                      <p className="mt-2 text-sm text-gray-700">{selectedVolunteer.observacoes}</p>
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
    </div>
  );
};

export default ONGVolunteersPage;