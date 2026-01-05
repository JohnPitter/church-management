// Component - Visitor Details Modal
// Modal for viewing and editing visitor details

import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../infrastructure/services/VisitorService';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  VisitRecord
} from '../../../modules/church-management/visitors/domain/entities/Visitor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VisitorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: Visitor;
  onVisitorUpdated: () => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = ({
  isOpen,
  onClose,
  visitor,
  onVisitorUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [editData, setEditData] = useState({
    name: visitor.name,
    email: visitor.email || '',
    phone: visitor.phone || '',
    status: visitor.status,
    followUpStatus: visitor.followUpStatus,
    assignedTo: visitor.assignedTo || '',
    observations: visitor.observations || ''
  });

  useEffect(() => {
    const loadVisitHistory = async () => {
      try {
        const history = await visitorService.getVisitHistory(visitor.id);
        setVisitHistory(history);
      } catch (error) {
        console.error('Error loading visit history:', error);
      }
    };

    if (isOpen) {
      loadVisitHistory();
    }
  }, [isOpen, visitor.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await visitorService.updateVisitor(visitor.id, {
        name: editData.name,
        email: editData.email || undefined,
        phone: editData.phone || undefined,
        status: editData.status,
        followUpStatus: editData.followUpStatus,
        assignedTo: editData.assignedTo || undefined,
        observations: editData.observations || undefined
      });
      
      setEditMode(false);
      onVisitorUpdated();
    } catch (error) {
      console.error('Error updating visitor:', error);
      alert('Erro ao atualizar visitante. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMember = async () => {
    if (window.confirm('Tem certeza que deseja converter este visitante em membro?')) {
      setLoading(true);
      try {
        // In a real scenario, you'd create a member and get the ID
        const memberId = `member_${Date.now()}`;
        await visitorService.convertToMember(visitor.id, memberId);
        onVisitorUpdated();
        alert('Visitante convertido em membro com sucesso!');
      } catch (error) {
        console.error('Error converting to member:', error);
        alert('Erro ao converter visitante em membro. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case VisitorStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case VisitorStatus.CONVERTED:
        return 'bg-blue-100 text-blue-800';
      case VisitorStatus.NO_CONTACT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.ACTIVE:
        return 'Ativo';
      case VisitorStatus.INACTIVE:
        return 'Inativo';
      case VisitorStatus.CONVERTED:
        return 'Convertido';
      case VisitorStatus.NO_CONTACT:
        return 'Sem Contato';
      default:
        return 'Desconhecido';
    }
  };

  const getFollowUpColor = (status: FollowUpStatus) => {
    switch (status) {
      case FollowUpStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case FollowUpStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case FollowUpStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case FollowUpStatus.NO_RESPONSE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFollowUpText = (status: FollowUpStatus) => {
    switch (status) {
      case FollowUpStatus.PENDING:
        return 'Pendente';
      case FollowUpStatus.IN_PROGRESS:
        return 'Em Andamento';
      case FollowUpStatus.COMPLETED:
        return 'Concluído';
      case FollowUpStatus.NO_RESPONSE:
        return 'Sem Resposta';
      default:
        return 'Desconhecido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg font-medium text-indigo-600">
                {visitor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{visitor.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                  {getStatusText(visitor.status)}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getFollowUpColor(visitor.followUpStatus)}`}>
                  {getFollowUpText(visitor.followUpStatus)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!editMode && visitor.status !== VisitorStatus.CONVERTED && (
              <button
                onClick={handleConvertToMember}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                Converter em Membro
              </button>
            )}
            <button
              onClick={editMode ? handleSave : () => setEditMode(true)}
              disabled={loading}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : editMode ? 'Salvar' : 'Editar'}
            </button>
            {editMode && (
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({...editData, status: e.target.value as VisitorStatus})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value={VisitorStatus.ACTIVE}>Ativo</option>
                        <option value={VisitorStatus.INACTIVE}>Inativo</option>
                        <option value={VisitorStatus.CONVERTED}>Convertido</option>
                        <option value={VisitorStatus.NO_CONTACT}>Sem Contato</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{visitor.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telefone</p>
                      <p className="text-sm text-gray-900">{visitor.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                      <p className="text-sm text-gray-900">
                        {visitor.birthDate ? format(visitor.birthDate, 'dd/MM/yyyy') : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sexo</p>
                      <p className="text-sm text-gray-900">{visitor.gender || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado Civil</p>
                      <p className="text-sm text-gray-900">{visitor.maritalStatus || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profissão</p>
                      <p className="text-sm text-gray-900">{visitor.profession || 'Não informado'}</p>
                    </div>
                  </>
                )}
              </div>
              
              {visitor.address && !editMode && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p className="text-sm text-gray-900">
                    {visitor.address.street}, {visitor.address.city}, {visitor.address.state} - {visitor.address.zipCode}
                  </p>
                </div>
              )}
              
              {!editMode && (
                <>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">Como conheceu a igreja</p>
                    <p className="text-sm text-gray-900">{visitor.howDidYouKnow || 'Não informado'}</p>
                  </div>
                  
                  {visitor.interests && visitor.interests.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Áreas de Interesse</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visitor.interests.map((interest, index) => (
                          <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Follow-up Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Follow-up</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status do Follow-up</label>
                      <select
                        value={editData.followUpStatus}
                        onChange={(e) => setEditData({...editData, followUpStatus: e.target.value as FollowUpStatus})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value={FollowUpStatus.PENDING}>Pendente</option>
                        <option value={FollowUpStatus.IN_PROGRESS}>Em Andamento</option>
                        <option value={FollowUpStatus.COMPLETED}>Concluído</option>
                        <option value={FollowUpStatus.NO_RESPONSE}>Sem Resposta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Responsável</label>
                      <input
                        type="text"
                        value={editData.assignedTo}
                        onChange={(e) => setEditData({...editData, assignedTo: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Responsável pelo Follow-up</p>
                      <p className="text-sm text-gray-900">{visitor.assignedTo || 'Não atribuído'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tentativas de Contato</p>
                      <p className="text-sm text-gray-900">{visitor.contactAttempts.length}</p>
                    </div>
                  </>
                )}
              </div>
              
              {editMode ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={editData.observations}
                    onChange={(e) => setEditData({...editData, observations: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                visitor.observations && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">Observações</p>
                    <p className="text-sm text-gray-900">{visitor.observations}</p>
                  </div>
                )
              )}
            </div>

            {/* Contact Attempts History */}
            {visitor.contactAttempts.length > 0 && !editMode && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico de Contatos</h4>
                <div className="space-y-3">
                  {visitor.contactAttempts.map((attempt, index) => (
                    <div key={attempt.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attempt.type}</p>
                          <p className="text-xs text-gray-500">
                            {format(attempt.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {attempt.method}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          attempt.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.successful ? 'Sucesso' : 'Sem sucesso'}
                        </span>
                      </div>
                      {attempt.notes && (
                        <p className="text-sm text-gray-600 mt-2">{attempt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Statistics and Visit History */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Total de Visitas</span>
                  <span className="text-sm font-semibold text-gray-900">{visitor.totalVisits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Primeira Visita</span>
                  <span className="text-sm text-gray-900">
                    {format(visitor.firstVisitDate, 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Última Visita</span>
                  <span className="text-sm text-gray-900">
                    {visitor.lastVisitDate ? format(visitor.lastVisitDate, 'dd/MM/yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Cadastrado em</span>
                  <span className="text-sm text-gray-900">
                    {format(visitor.createdAt, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Visit History */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Histórico de Visitas</h4>
              {visitHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {visitHistory.map((visit, index) => (
                    <div key={visit.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{visit.service}</p>
                          <p className="text-xs text-gray-500">
                            {format(visit.visitDate, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-gray-600 mt-2">{visit.notes}</p>
                      )}
                      {visit.broughtBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Trazido por: {visit.broughtBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma visita registrada ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};