// Admin Page - Visitors Management
// Administrative page for managing church visitors with advanced features

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { visitorService, VisitorFilters } from '@modules/church-management/visitors/application/services/VisitorService';
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

export const AdminVisitorsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [filters, setFilters] = useState<VisitorFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  const handleDeleteVisitor = async (visitor: Visitor) => {
    if (window.confirm(`Tem certeza que deseja excluir o visitante "${visitor.name}"? Esta ação não pode ser desfeita.`)) {
      try {
        await visitorService.deleteVisitor(visitor.id);
        await loadVisitors();
        await loadStats();
        alert('Visitante excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting visitor:', error);
        alert('Erro ao excluir visitante. Tente novamente.');
      }
    }
  };

  const getStatusColor = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case VisitorStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case VisitorStatus.CONVERTED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case VisitorStatus.NO_CONTACT:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case FollowUpStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case FollowUpStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case FollowUpStatus.NO_RESPONSE:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Status', 'Follow-up', 'Total Visitas', 'Primeira Visita', 'Última Visita'];
    const csvContent = [
      headers.join(','),
      ...visitors.map(visitor => [
        `"${visitor.name}"`,
        `"${visitor.email || ''}"`,
        `"${visitor.phone || ''}"`,
        `"${getStatusText(visitor.status)}"`,
        `"${getFollowUpText(visitor.followUpStatus)}"`,
        visitor.totalVisits,
        `"${format(visitor.firstVisitDate, 'dd/MM/yyyy')}"`,
        `"${visitor.lastVisitDate ? format(visitor.lastVisitDate, 'dd/MM/yyyy') : 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitantes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && visitors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando visitantes...</p>
            </div>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Visitantes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie visitantes, acompanhamento e conversões da igreja
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalVisitors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Este Mês</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.newThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conversão</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Retenção</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.retentionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingFollowUp}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-red-500 focus:border-red-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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

          {/* View Mode Toggle */}
          <div className="flex justify-end">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'grid'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                  viewMode === 'table'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Visitors List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-red-600">
                          {visitor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{visitor.name}</h3>
                        <p className="text-xs text-gray-500">{visitor.email || 'Sem email'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(visitor.status)}`}>
                        {getStatusText(visitor.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getFollowUpColor(visitor.followUpStatus)}`}>
                        {getFollowUpText(visitor.followUpStatus)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Visitas</p>
                        <p className="font-medium">{visitor.totalVisits}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Última</p>
                        <p className="font-medium">
                          {visitor.lastVisitDate ? format(visitor.lastVisitDate, 'dd/MM') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-3 border-t">
                      <button
                        onClick={() => handleViewDetails(visitor)}
                        className="flex-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={() => handleContact(visitor)}
                        className="flex-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Contato
                      </button>
                      <button
                        onClick={() => handleRecordVisit(visitor)}
                        className="flex-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Visita
                      </button>
                      <button
                        onClick={() => handleDeleteVisitor(visitor)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-up</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">
                              {visitor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                          <div className="text-sm text-gray-500">
                            Desde {format(visitor.firstVisitDate, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{visitor.email || 'Sem email'}</div>
                      <div className="text-sm text-gray-500">{visitor.phone || 'Sem telefone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(visitor.status)}`}>
                        {getStatusText(visitor.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getFollowUpColor(visitor.followUpStatus)}`}>
                        {getFollowUpText(visitor.followUpStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{visitor.totalVisits} visitas</div>
                      <div className="text-xs text-gray-500">
                        Última: {visitor.lastVisitDate ? format(visitor.lastVisitDate, 'dd/MM') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(visitor)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleContact(visitor)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Contato
                      </button>
                      <button
                        onClick={() => handleRecordVisit(visitor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Visita
                      </button>
                      <button
                        onClick={() => handleDeleteVisitor(visitor)}
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
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => loadVisitors(true)}
              disabled={loading}
              className="px-6 py-3 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && visitors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
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
              {searchTerm || filters.status || filters.followUpStatus
                ? 'Ajuste os filtros para encontrar visitantes.'
                : 'Comece cadastrando o primeiro visitante da igreja.'}
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