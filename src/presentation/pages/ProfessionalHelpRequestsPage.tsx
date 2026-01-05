// Presentation Page - Professional Help Requests
// Page for professionals to view and respond to help requests from other professionals

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ProfessionalHelpRequest,
  HelpRequestStatus,
  HelpRequestPriority,
  HelpRequestType,
  ProfessionalHelpRequestEntity
} from '../../modules/assistance/professional/domain/entities/ProfessionalHelpRequest';
import { TipoAssistencia } from '../../domain/entities/Assistencia';
import { ProfissionalAssistenciaService } from '../../infrastructure/services/AssistenciaService';
import { ProfessionalHelpRequestService } from '../../infrastructure/services/ProfessionalHelpRequestService';

export const ProfessionalHelpRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProfessionalHelpRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProfessionalHelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProfessionalHelpRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [professionalId, setProfessionalId] = useState<string>('');
  const [currentProfessional, setCurrentProfessional] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<HelpRequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<HelpRequestType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<HelpRequestPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'recebidos' | 'enviados'>('recebidos');

  const profissionalService = new ProfissionalAssistenciaService();
  const helpRequestService = new ProfessionalHelpRequestService();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, typeFilter, priorityFilter, viewMode]);

  const loadData = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const profissional = await profissionalService.getProfissionalByEmail(currentUser.email);

      if (profissional) {
        setProfessionalId(profissional.id);
        setCurrentProfessional(profissional);

        // Load help requests
        const [receivedRequests, sentRequests] = await Promise.all([
          helpRequestService.getReceivedRequests(profissional.id),
          helpRequestService.getSentRequests(profissional.id)
        ]);

        // Combine and deduplicate requests
        const allRequests = [...receivedRequests, ...sentRequests];
        const uniqueRequests = Array.from(
          new Map(allRequests.map(r => [r.id, r])).values()
        );

        setRequests(uniqueRequests);
      }
    } catch (error) {
      console.error('Error loading help requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Filter by view mode
    if (viewMode === 'recebidos') {
      filtered = filtered.filter(r =>
        !r.destinatarioId || r.destinatarioId === professionalId
      );
    } else {
      filtered = filtered.filter(r => r.solicitanteId === professionalId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.tipo === typeFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.prioridade === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleViewRequest = (request: ProfessionalHelpRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const getTimeSinceCreated = (date: Date): string => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    }
  };

  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === HelpRequestStatus.Pendente).length,
    emAnalise: requests.filter(r => r.status === HelpRequestStatus.EmAnalise).length,
    respondidos: requests.filter(r =>
      r.status === HelpRequestStatus.Aceito ||
      r.status === HelpRequestStatus.Concluido
    ).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos de ajuda...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Pedidos de Ajuda</h1>
              <p className="mt-1 text-sm text-gray-600">
                Solicitações de orientação e encaminhamento entre profissionais
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Novo Pedido
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Em Análise</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.emAnalise}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Respondidos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.respondidos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setViewMode('recebidos')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  viewMode === 'recebidos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 Pedidos Recebidos
              </button>
              <button
                onClick={() => setViewMode('enviados')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  viewMode === 'enviados'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📤 Meus Pedidos
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value={HelpRequestStatus.Pendente}>Pendente</option>
                <option value={HelpRequestStatus.EmAnalise}>Em Análise</option>
                <option value={HelpRequestStatus.Aceito}>Aceito</option>
                <option value={HelpRequestStatus.Recusado}>Recusado</option>
                <option value={HelpRequestStatus.Concluido}>Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pedido
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value={HelpRequestType.Encaminhamento}>Encaminhamento</option>
                <option value={HelpRequestType.SegundaOpiniao}>Segunda Opinião</option>
                <option value={HelpRequestType.Interconsulta}>Interconsulta</option>
                <option value={HelpRequestType.OrientacaoTecnica}>Orientação Técnica</option>
                <option value={HelpRequestType.DiscussaoCaso}>Discussão de Caso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas</option>
                <option value={HelpRequestPriority.Baixa}>Baixa</option>
                <option value={HelpRequestPriority.Normal}>Normal</option>
                <option value={HelpRequestPriority.Alta}>Alta</option>
                <option value={HelpRequestPriority.Urgente}>Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'recebidos' ? 'Pedidos Recebidos' : 'Meus Pedidos'} ({filteredRequests.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-500 text-sm">
                  {viewMode === 'recebidos'
                    ? 'Você não tem pedidos de ajuda recebidos no momento.'
                    : 'Você ainda não enviou nenhum pedido de ajuda.'}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewRequest(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-base font-medium text-gray-900">
                          {request.titulo}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${ProfessionalHelpRequestEntity.getPriorityColor(request.prioridade)}`}>
                          {ProfessionalHelpRequestEntity.getPriorityLabel(request.prioridade)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${ProfessionalHelpRequestEntity.getStatusColor(request.status)}`}>
                          {ProfessionalHelpRequestEntity.getStatusLabel(request.status)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {request.descricao}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <span className="mr-1">📋</span>
                          {ProfessionalHelpRequestEntity.getTypeLabel(request.tipo)}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">👨‍⚕️</span>
                          {viewMode === 'recebidos' ? request.solicitanteNome : request.destinatarioNome || 'Aberto para todos'}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">🕐</span>
                          {getTimeSinceCreated(request.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRequest(request);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Detalhes do Pedido</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedRequest.titulo}</h4>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${ProfessionalHelpRequestEntity.getStatusColor(selectedRequest.status)}`}>
                      {ProfessionalHelpRequestEntity.getStatusLabel(selectedRequest.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${ProfessionalHelpRequestEntity.getPriorityColor(selectedRequest.prioridade)}`}>
                      {ProfessionalHelpRequestEntity.getPriorityLabel(selectedRequest.prioridade)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {ProfessionalHelpRequestEntity.getTypeLabel(selectedRequest.tipo)}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Descrição</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    {selectedRequest.descricao}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Solicitante</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm"><strong>Nome:</strong> {selectedRequest.solicitanteNome}</p>
                    <p className="text-sm"><strong>Especialidade:</strong> {selectedRequest.solicitanteEspecialidade}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedRequest.solicitanteEmail}</p>
                  </div>
                </div>

                {selectedRequest.respostaConteudo && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Resposta</h5>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Respondido por: {selectedRequest.respostaProfissionalNome}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedRequest.respostaConteudo}
                      </p>
                    </div>
                  </div>
                )}

                {ProfessionalHelpRequestEntity.canRespond(selectedRequest, professionalId) && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => {/* TODO: Open response form */}}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Responder Pedido
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Help Request Modal */}
      {showCreateModal && (
        <CreateHelpRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          currentProfessional={currentProfessional}
          onSubmit={async (newRequest) => {
            try {
              setLoading(true);

              // Save to database
              const requestId = await helpRequestService.create(newRequest);
              console.log('Help request created with ID:', requestId);

              // Add to local state with the real ID
              const savedRequest = { ...newRequest, id: requestId };
              setRequests([savedRequest, ...requests]);

              setShowCreateModal(false);

              // Show success message (you can add a toast notification here)
              alert('Pedido de ajuda enviado com sucesso!');
            } catch (error) {
              console.error('Error saving help request:', error);
              alert('Erro ao salvar pedido de ajuda. Por favor, tente novamente.');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

// Create Help Request Modal Component
interface CreateHelpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfessional: any;
  onSubmit: (request: ProfessionalHelpRequest) => void;
}

const CreateHelpRequestModal: React.FC<CreateHelpRequestModalProps> = ({
  isOpen,
  onClose,
  currentProfessional,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    tipo: HelpRequestType.Encaminhamento,
    prioridade: HelpRequestPriority.Normal,
    especialidadeNecessaria: '' as TipoAssistencia | '',
    destinatarioId: '',
    titulo: '',
    descricao: '',
    motivoSolicitacao: '',
    pacienteNome: '',
    pacienteIdade: '',
    historicoRelevante: '',
    diagnosticoInicial: '',
    duvidasEspecificas: '',
    anonimizado: false,
    necessitaAcompanhamento: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const profissionalService = new ProfissionalAssistenciaService();

  useEffect(() => {
    if (isOpen) {
      loadProfessionals();
    }
  }, [isOpen, formData.especialidadeNecessaria]);

  // Validate form in real-time
  useEffect(() => {
    validateForm();
  }, [formData]);

  const loadProfessionals = async () => {
    try {
      const allProfessionals = await profissionalService.getAllProfissionais();

      // Filter by specialty if selected
      let filtered = allProfessionals.filter(p =>
        p.id !== currentProfessional?.id && p.status === 'ativo'
      );

      if (formData.especialidadeNecessaria) {
        filtered = filtered.filter(p =>
          p.especialidade === formData.especialidadeNecessaria
        );
      }

      setProfessionals(filtered);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    } else if (formData.titulo.trim().length < 10) {
      newErrors.titulo = 'Título deve ter no mínimo 10 caracteres';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    } else if (formData.descricao.trim().length < 20) {
      newErrors.descricao = 'Descrição deve ter no mínimo 20 caracteres';
    }

    if (!formData.motivoSolicitacao.trim()) {
      newErrors.motivoSolicitacao = 'Motivo é obrigatório';
    } else if (formData.motivoSolicitacao.trim().length < 10) {
      newErrors.motivoSolicitacao = 'Motivo deve ter no mínimo 10 caracteres';
    }

    // Optional validation for patient age
    if (formData.pacienteIdade && parseInt(formData.pacienteIdade) < 0) {
      newErrors.pacienteIdade = 'Idade deve ser um número positivo';
    }

    if (formData.pacienteIdade && parseInt(formData.pacienteIdade) > 150) {
      newErrors.pacienteIdade = 'Idade inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    return (
      formData.titulo.trim().length >= 10 &&
      formData.descricao.trim().length >= 20 &&
      formData.motivoSolicitacao.trim().length >= 10 &&
      (!formData.pacienteIdade || (parseInt(formData.pacienteIdade) >= 0 && parseInt(formData.pacienteIdade) <= 150))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newRequest: ProfessionalHelpRequest = {
      id: `temp_${Date.now()}`,
      solicitanteId: currentProfessional.id,
      solicitanteNome: currentProfessional.nome,
      solicitanteEspecialidade: currentProfessional.especialidade,
      solicitanteEmail: currentProfessional.email,
      solicitanteTelefone: currentProfessional.telefone,
      destinatarioId: formData.destinatarioId || undefined,
      destinatarioNome: formData.destinatarioId
        ? professionals.find(p => p.id === formData.destinatarioId)?.nome
        : undefined,
      destinatarioEspecialidade: formData.especialidadeNecessaria || undefined,
      tipo: formData.tipo,
      especialidadeNecessaria: formData.especialidadeNecessaria || undefined,
      prioridade: formData.prioridade,
      status: HelpRequestStatus.Pendente,
      pacienteNome: formData.pacienteNome || undefined,
      pacienteIdade: formData.pacienteIdade ? parseInt(formData.pacienteIdade) : undefined,
      titulo: formData.titulo,
      descricao: formData.descricao,
      motivoSolicitacao: formData.motivoSolicitacao,
      historicoRelevante: formData.historicoRelevante || undefined,
      diagnosticoInicial: formData.diagnosticoInicial || undefined,
      duvidasEspecificas: formData.duvidasEspecificas || undefined,
      necessitaAcompanhamento: formData.necessitaAcompanhamento,
      anexos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentProfessional.userId || currentProfessional.id,
      anonimizado: formData.anonimizado,
      historico: [{
        id: '1',
        dataHora: new Date(),
        acao: 'criado',
        statusNovo: HelpRequestStatus.Pendente,
        responsavel: currentProfessional.userId || currentProfessional.id,
        responsavelNome: currentProfessional.nome
      }]
    };

    onSubmit(newRequest);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Novo Pedido de Ajuda</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Required Fields Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Campos Obrigatórios</h4>
                  <p className="text-xs text-blue-700">
                    Os campos marcados com <span className="text-red-600 font-bold">*</span> são essenciais e devem ser preenchidos para enviar o pedido.
                  </p>
                </div>
              </div>
            </div>

            {/* Request Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pedido <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={HelpRequestType.Encaminhamento}>Encaminhamento</option>
                  <option value={HelpRequestType.SegundaOpiniao}>Segunda Opinião</option>
                  <option value={HelpRequestType.Interconsulta}>Interconsulta</option>
                  <option value={HelpRequestType.OrientacaoTecnica}>Orientação Técnica</option>
                  <option value={HelpRequestType.DiscussaoCaso}>Discussão de Caso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => handleInputChange('prioridade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={HelpRequestPriority.Baixa}>Baixa</option>
                  <option value={HelpRequestPriority.Normal}>Normal</option>
                  <option value={HelpRequestPriority.Alta}>Alta</option>
                  <option value={HelpRequestPriority.Urgente}>Urgente</option>
                </select>
              </div>
            </div>

            {/* Specialty and Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade Necessária
                </label>
                <select
                  value={formData.especialidadeNecessaria}
                  onChange={(e) => handleInputChange('especialidadeNecessaria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Qualquer especialidade</option>
                  <option value={TipoAssistencia.Psicologica}>Psicologia</option>
                  <option value={TipoAssistencia.Social}>Assistência Social</option>
                  <option value={TipoAssistencia.Juridica}>Jurídica</option>
                  <option value={TipoAssistencia.Medica}>Médica</option>
                  <option value={TipoAssistencia.Fisioterapia}>Fisioterapia</option>
                  <option value={TipoAssistencia.Nutricao}>Nutrição</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatário
                </label>
                <select
                  value={formData.destinatarioId}
                  onChange={(e) => handleInputChange('destinatarioId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Aberto para todos</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.especialidade}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para permitir que qualquer profissional responda
                </p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                onBlur={() => handleBlur('titulo')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('titulo') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ex: Paciente com sintomas de ansiedade severa"
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {getFieldError('titulo') && (
                    <p className="text-red-600 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('titulo')}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formData.titulo.length}/200</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Caso <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                onBlur={() => handleBlur('descricao')}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('descricao') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Descreva o caso de forma detalhada..."
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {getFieldError('descricao') && (
                    <p className="text-red-600 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('descricao')}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formData.descricao.length}/2000</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Solicitação <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.motivoSolicitacao}
                onChange={(e) => handleInputChange('motivoSolicitacao', e.target.value)}
                onBlur={() => handleBlur('motivoSolicitacao')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('motivoSolicitacao') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Por que você está solicitando ajuda?"
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {getFieldError('motivoSolicitacao') && (
                    <p className="text-red-600 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('motivoSolicitacao')}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formData.motivoSolicitacao.length}/1000</span>
              </div>
            </div>

            {/* Patient Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-1">Informações do Paciente</h4>
              <p className="text-xs text-gray-500 mb-4">Campos opcionais</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome/Iniciais do Paciente
                  </label>
                  <input
                    type="text"
                    value={formData.pacienteNome}
                    onChange={(e) => handleInputChange('pacienteNome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: J.S. ou Paciente A"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={formData.pacienteIdade}
                    onChange={(e) => handleInputChange('pacienteIdade', e.target.value)}
                    onBlur={() => handleBlur('pacienteIdade')}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      getFieldError('pacienteIdade') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 35"
                    min="0"
                    max="150"
                  />
                  {getFieldError('pacienteIdade') && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('pacienteIdade')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.anonimizado}
                    onChange={(e) => handleInputChange('anonimizado', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Manter identidade do paciente anônima
                  </span>
                </label>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-1">Informações Complementares</h4>
              <p className="text-xs text-gray-500 mb-4">Campos opcionais que podem ajudar na compreensão do caso</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histórico Relevante
                  </label>
                  <textarea
                    value={formData.historicoRelevante}
                    onChange={(e) => handleInputChange('historicoRelevante', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Histórico médico, tratamentos anteriores, etc."
                    maxLength={1000}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.historicoRelevante.length}/1000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico Inicial
                  </label>
                  <textarea
                    value={formData.diagnosticoInicial}
                    onChange={(e) => handleInputChange('diagnosticoInicial', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Sua avaliação inicial do caso"
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.diagnosticoInicial.length}/500</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dúvidas Específicas
                  </label>
                  <textarea
                    value={formData.duvidasEspecificas}
                    onChange={(e) => handleInputChange('duvidasEspecificas', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="O que você gostaria de saber especificamente?"
                    maxLength={1000}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.duvidasEspecificas.length}/1000</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.necessitaAcompanhamento}
                  onChange={(e) => handleInputChange('necessitaAcompanhamento', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Necessita acompanhamento contínuo
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center text-sm">
                {!isFormValid() && (
                  <div className="flex items-center text-amber-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Preencha todos os campos obrigatórios</span>
                  </div>
                )}
                {isFormValid() && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Formulário válido</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isFormValid()
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isFormValid() ? 'Enviar Pedido' : 'Preencha os Campos Obrigatórios'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
