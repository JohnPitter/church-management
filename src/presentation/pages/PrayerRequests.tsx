// Presentation Page - Prayer Requests Management
// Administrative page for managing prayer requests

import React, { useState, useEffect } from 'react';
import { PrayerRequestService } from '@modules/church-management/prayer-requests/application/services/PrayerRequestService';
import { PrayerRequest, PrayerRequestStatus } from '../../modules/church-management/prayer-requests/domain/entities/PrayerRequest';
import { CreatePrayerRequestModal } from '../components/CreatePrayerRequestModal';

const PrayerRequests: React.FC = () => {
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<PrayerRequestStatus | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const prayerRequestService = new PrayerRequestService();

  const loadPrayerRequests = async () => {
    try {
      setLoading(true);
      let requests: PrayerRequest[];
      
      if (selectedStatus === 'all') {
        requests = await prayerRequestService.getPrayerRequests();
      } else {
        requests = await prayerRequestService.getPrayerRequests().then(all => 
          all.filter(req => req.status === selectedStatus)
        );
      }
      
      setPrayerRequests(requests);
    } catch (error) {
      console.error('Error loading prayer requests:', error);
      setMessage('Erro ao carregar pedidos de oração');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrayerRequests();
  }, [selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: PrayerRequestStatus) => {
    try {
      setIsProcessing(id);
      
      switch (newStatus) {
        case PrayerRequestStatus.Approved:
          await prayerRequestService.approvePrayerRequest(id);
          break;
        case PrayerRequestStatus.Rejected:
          await prayerRequestService.rejectPrayerRequest(id);
          break;
        case PrayerRequestStatus.Answered:
          await prayerRequestService.markAsAnswered(id);
          break;
      }
      
      setMessage('Status atualizado com sucesso');
      await loadPrayerRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Erro ao atualizar status');
    } finally {
      setIsProcessing(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido de oração?')) {
      return;
    }

    try {
      setIsProcessing(id);
      await prayerRequestService.deletePrayerRequest(id);
      setMessage('Pedido excluído com sucesso');
      await loadPrayerRequests();
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      setMessage('Erro ao excluir pedido');
    } finally {
      setIsProcessing(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusBadge = (status: PrayerRequestStatus) => {
    const badges = {
      [PrayerRequestStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [PrayerRequestStatus.Approved]: 'bg-green-100 text-green-800',
      [PrayerRequestStatus.Praying]: 'bg-blue-100 text-blue-800',
      [PrayerRequestStatus.Answered]: 'bg-purple-100 text-purple-800',
      [PrayerRequestStatus.Rejected]: 'bg-red-100 text-red-800'
    };

    const labels = {
      [PrayerRequestStatus.Pending]: 'Pendente',
      [PrayerRequestStatus.Approved]: 'Aprovado',
      [PrayerRequestStatus.Praying]: 'Orando',
      [PrayerRequestStatus.Answered]: 'Respondido',
      [PrayerRequestStatus.Rejected]: 'Rejeitado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStats = () => {
    const total = prayerRequests.length;
    const pending = prayerRequests.filter(req => req.status === PrayerRequestStatus.Pending).length;
    const approved = prayerRequests.filter(req => req.status === PrayerRequestStatus.Approved).length;
    const answered = prayerRequests.filter(req => req.status === PrayerRequestStatus.Answered).length;
    
    return { total, pending, approved, answered };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando pedidos de oração...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Pedidos de Oração</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie os pedidos de oração recebidos pela igreja
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Pedido
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Aprovados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🙏</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Respondidos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.answered}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as PrayerRequestStatus | 'all')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value={PrayerRequestStatus.Pending}>Pendentes</option>
                  <option value={PrayerRequestStatus.Approved}>Aprovados</option>
                  <option value={PrayerRequestStatus.Praying}>Orando</option>
                  <option value={PrayerRequestStatus.Answered}>Respondidos</option>
                  <option value={PrayerRequestStatus.Rejected}>Rejeitados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('sucesso') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Prayer Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {prayerRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="text-6xl mb-4">🙏</div>
              <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
              <p>Não há pedidos de oração para o filtro selecionado.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prayerRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {request.name}
                          {request.isAnonymous && (
                            <span className="ml-2 text-xs text-gray-500">(Anônimo)</span>
                          )}
                        </div>
                        {request.email && (
                          <div className="text-sm text-gray-500">{request.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {request.request}
                      </div>
                      {request.isUrgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          Urgente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {request.status === PrayerRequestStatus.Pending && (
                          <>
                            <button
                              onClick={() => handleStatusChange(request.id, PrayerRequestStatus.Approved)}
                              disabled={isProcessing === request.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Aprovar"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleStatusChange(request.id, PrayerRequestStatus.Rejected)}
                              disabled={isProcessing === request.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Rejeitar"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        {request.status === PrayerRequestStatus.Approved && (
                          <button
                            onClick={() => handleStatusChange(request.id, PrayerRequestStatus.Answered)}
                            disabled={isProcessing === request.id}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            title="Marcar como respondido"
                          >
                            🙏
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(request.id)}
                          disabled={isProcessing === request.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Create Prayer Request Modal */}
      <CreatePrayerRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadPrayerRequests();
          setMessage('Pedido de oração criado com sucesso!');
          setTimeout(() => setMessage(''), 3000);
        }}
      />
    </div>
  );
};

export default PrayerRequests;