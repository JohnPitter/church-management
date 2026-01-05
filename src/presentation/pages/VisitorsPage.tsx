// Presentation Page - Visitors Management
// Page for managing church visitors and follow-up

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { visitorService, VisitorFilters } from '../../infrastructure/services/VisitorService';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  VisitorStats
} from '../../modules/church-management/visitors/domain/entities/Visitor';
import { format } from 'date-fns';
import { CreateVisitorModal } from '../components/visitors/CreateVisitorModal';
import { VisitorDetailsModal } from '../components/visitors/VisitorDetailsModal';
import { ContactVisitorModal } from '../components/visitors/ContactVisitorModal';
import { RecordVisitModal } from '../components/visitors/RecordVisitModal';

export const VisitorsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [filters, setFilters] = useState<VisitorFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadVisitors();
      await loadStats();
    };
    loadData();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVisitors = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setLastDoc(null);
      }

      const searchFilters = searchTerm ? { ...filters, search: searchTerm } : filters;
      const result = await visitorService.getVisitors(
        searchFilters,
        20,
        loadMore ? lastDoc : undefined
      );

      if (loadMore) {
        setVisitors(prev => [...prev, ...result.visitors]);
      } else {
        setVisitors(result.visitors);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading visitors:', error);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const visitorStats = await visitorService.getVisitorStats();
      setStats(visitorStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleViewDetails = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowDetailsModal(true);
  };

  const handleContact = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowContactModal(true);
  };

  const handleRecordVisit = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowVisitModal(true);
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

  if (loading && visitors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando visitantes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visitantes</h1>
              <p className="mt-2 text-gray-600">
                Gerencie os visitantes da igreja e acompanhe o processo de integração
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Visitante
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Visitantes</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalVisitors}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Novos Este Mês</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.newThisMonth}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Conversão</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.conversionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendente Follow-up</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingFollowUp}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Buscar visitantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as VisitorStatus || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos os Status</option>
                <option value={VisitorStatus.ACTIVE}>Ativo</option>
                <option value={VisitorStatus.INACTIVE}>Inativo</option>
                <option value={VisitorStatus.CONVERTED}>Convertido</option>
                <option value={VisitorStatus.NO_CONTACT}>Sem Contato</option>
              </select>
            </div>

            {/* Follow-up Filter */}
            <div>
              <select
                value={filters.followUpStatus || ''}
                onChange={(e) => setFilters({ ...filters, followUpStatus: e.target.value as FollowUpStatus || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos Follow-ups</option>
                <option value={FollowUpStatus.PENDING}>Pendente</option>
                <option value={FollowUpStatus.IN_PROGRESS}>Em Andamento</option>
                <option value={FollowUpStatus.COMPLETED}>Concluído</option>
                <option value={FollowUpStatus.NO_RESPONSE}>Sem Resposta</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Visitors List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {visitors.map((visitor) => (
              <li key={visitor.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {visitor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {visitor.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                              {getStatusText(visitor.status)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p>{visitor.email || 'Email não informado'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-900">
                          {visitor.totalVisits} {visitor.totalVisits === 1 ? 'visita' : 'visitas'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Última: {visitor.lastVisitDate ? format(visitor.lastVisitDate, 'dd/MM/yyyy') : 'N/A'}
                        </p>
                        <p className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFollowUpColor(visitor.followUpStatus)}`}>
                          {getFollowUpText(visitor.followUpStatus)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(visitor)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleContact(visitor)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRecordVisit(visitor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Load More */}
          {hasMore && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => loadVisitors(true)}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50"
              >
                {loading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && visitors.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum visitante encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece cadastrando o primeiro visitante da igreja.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Novo Visitante
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateVisitorModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onVisitorCreated={() => {
              setShowCreateModal(false);
              loadVisitors();
              loadStats();
            }}
            currentUser={currentUser}
          />
        )}

        {showDetailsModal && selectedVisitor && (
          <VisitorDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            visitor={selectedVisitor}
            onVisitorUpdated={() => {
              loadVisitors();
              loadStats();
            }}
          />
        )}

        {showContactModal && selectedVisitor && (
          <ContactVisitorModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            visitor={selectedVisitor}
            currentUser={currentUser}
            onContactAdded={() => {
              loadVisitors();
              loadStats();
            }}
          />
        )}

        {showVisitModal && selectedVisitor && (
          <RecordVisitModal
            isOpen={showVisitModal}
            onClose={() => setShowVisitModal(false)}
            visitor={selectedVisitor}
            currentUser={currentUser}
            onVisitRecorded={() => {
              loadVisitors();
              loadStats();
            }}
          />
        )}
      </div>
    </div>
  );
};