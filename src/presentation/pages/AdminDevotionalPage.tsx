// Presentation Page - Admin Devotional
// Main devotional management dashboard for church administrators

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Devotional,
  DevotionalCategory,
  DevotionalComment
} from '@modules/church-management/devotionals/domain/entities/Devotional';
import { 
  devotionalService, 
  DevotionalFilters,
  DevotionalStats 
} from '@modules/church-management/devotionals/application/services/DevotionalService';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { CreateDevotionalModal } from '@modules/church-management/devotionals/presentation/components/CreateDevotionalModal';
import { EditDevotionalModal } from '@modules/church-management/devotionals/presentation/components/EditDevotionalModal';
import { DevotionalDetailModal } from '@modules/church-management/devotionals/presentation/components/DevotionalDetailModal';

export const AdminDevotionalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canView = hasPermission(SystemModule.Devotionals, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.Devotionals, PermissionAction.Create);
  const canUpdate = hasPermission(SystemModule.Devotionals, PermissionAction.Update);
  const canDelete = hasPermission(SystemModule.Devotionals, PermissionAction.Delete);
  const _canManage = hasPermission(SystemModule.Devotionals, PermissionAction.Manage);

  const [loading, setLoading] = useState(true);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [categories, setCategories] = useState<DevotionalCategory[]>([]);
  const [stats, setStats] = useState<DevotionalStats | null>(null);
  const [selectedTab, setSelectedTab] = useState('devotionals');
  const [filters, _setFilters] = useState<DevotionalFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [_pendingComments, setPendingComments] = useState<DevotionalComment[]>([]);
  const [_hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load devotionals
      const { devotionals: devotionalsData, hasMore: more } = await devotionalService.getDevotionals(filters);
      setDevotionals(devotionalsData);
      setHasMore(more);

      // Load categories
      const categoriesData = await devotionalService.getCategories();
      setCategories(categoriesData);

      // Load stats
      const statsData = await devotionalService.getStats();
      setStats(statsData);

      // Load pending comments if admin
      if (selectedTab === 'comments') {
        await loadPendingComments();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingComments = async () => {
    try {
      // This would need to be implemented in the service
      // For now, we'll skip this feature
      setPendingComments([]);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCreateDevotional = () => {
    setShowCreateModal(true);
  };

  const handleEditDevotional = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setShowEditModal(true);
  };

  const handleViewDevotional = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setShowDetailModal(true);
  };

  const handleDeleteDevotional = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este devocional?')) return;

    const devotional = devotionals.find(d => d.id === id);
    try {
      await devotionalService.deleteDevotional(id, currentUser?.email || 'unknown');
      await loggingService.logDatabase('info', 'Devotional deleted', `Title: ${devotional?.title || 'Unknown'}, ID: ${id}`, currentUser as any);
      await loadData();
    } catch (error) {
      console.error('Error deleting devotional:', error);
      await loggingService.logDatabase('error', 'Error deleting devotional', `ID: ${id}, Error: ${error instanceof Error ? error.message : String(error)}`, currentUser as any);
      alert('Erro ao excluir devocional');
    }
  };

  const handleTogglePublish = async (devotional: Devotional) => {
    try {
      await devotionalService.updateDevotional(devotional.id, {
        isPublished: !devotional.isPublished,
        createdBy: currentUser?.email || 'unknown'
      });
      await loggingService.logDatabase('info', 'Devotional publish status changed', `Title: ${devotional.title}, Published: ${!devotional.isPublished}`, currentUser as any);
      await loadData();
    } catch (error) {
      console.error('Error toggling publish:', error);
      await loggingService.logDatabase('error', 'Error toggling devotional publish status', `Title: ${devotional.title}, ID: ${devotional.id}, Error: ${error instanceof Error ? error.message : String(error)}`, currentUser as any);
      alert('Erro ao alterar status de publicação');
    }
  };

  const _handleApproveComment = async (commentId: string) => {
    try {
      await devotionalService.approveComment(commentId);
      await loadPendingComments();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('Erro ao aprovar comentário');
    }
  };

  const tabs = [
    { id: 'devotionals', label: 'Devocionais', icon: '📖' },
    { id: 'categories', label: 'Categorias', icon: '🏷️' },
    { id: 'plans', label: 'Planos', icon: '📅' },
    { id: 'comments', label: 'Comentários', icon: '💬' },
    { id: 'stats', label: 'Estatísticas', icon: '📊' }
  ];

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Devocionais</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDevotionals}</p>
            </div>
            <div className="text-3xl">📖</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Publicados</p>
              <p className="text-2xl font-semibold text-green-600">{stats.publishedDevotionals}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Concluídos</p>
              <p 
                className="text-2xl font-semibold"
                style={{ color: settings?.primaryColor || '#6366F1' }}
              >
                {stats.completedDevotionals}
              </p>
            </div>
            <div className="text-3xl">✔️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Visualizações</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.totalViews}</p>
            </div>
            <div className="text-3xl">👁️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Curtidas</p>
              <p className="text-2xl font-semibold text-red-600">{stats.totalLikes}</p>
            </div>
            <div className="text-3xl">❤️</div>
          </div>
        </div>
      </div>
    );
  };

  const renderDevotionals = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (devotionals.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-gray-600 mb-4">Nenhum devocional encontrado</p>
          {canCreate && (
            <button
              onClick={handleCreateDevotional}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Criar Primeiro Devocional
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {devotionals.map(devotional => (
          <div key={devotional.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{devotional.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    devotional.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {devotional.isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Versículo:</span> {devotional.bibleReference}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>{devotional.category.icon}</span>
                    {devotional.category.name}
                  </span>
                  <span>Por {devotional.author}</span>
                  <span>
                    {formatDate(devotional.publishDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    👁️ {devotional.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {devotional.likes.length}
                  </span>
                </div>

                {devotional.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {devotional.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDevotional(devotional)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Visualizar"
                >
                  <span className="text-xl">👁️</span>
                </button>
                {canUpdate && (
                  <button
                    onClick={() => handleEditDevotional(devotional)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    <span className="text-xl">✏️</span>
                  </button>
                )}
                {canUpdate && (
                  <button
                    onClick={() => handleTogglePublish(devotional)}
                    className={`p-2 ${
                      devotional.isPublished ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                    } rounded-lg`}
                    title={devotional.isPublished ? 'Despublicar' : 'Publicar'}
                  >
                    {devotional.isPublished ? (
                      <span className="text-xl">🔒</span>
                    ) : (
                      <span className="text-xl">✅</span>
                    )}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteDevotional(devotional.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Excluir"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCategories = () => {
    if (categories.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhuma categoria encontrada</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <div key={category.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: category.color + '20', color: category.color }}
              >
                {category.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Recent Devotionals */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Devocionais Recentes</h3>
          <div className="space-y-3">
            {stats.recentDevotionals.map(devotional => (
              <div key={devotional.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{devotional.title}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(devotional.publishDate, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>👁️ {devotional.viewCount}</span>
                  <span>❤️ {devotional.likes.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Categorias Mais Usadas</h3>
          <div className="space-y-3">
            {stats.topCategories.map(({ category, count }) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-gray-600">{count} devocionais</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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

  // Access denied if user cannot view devotionals
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para visualizar devocionais.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Devocionais</h1>
              <p className="mt-1 text-sm text-gray-600">
                Crie e gerencie devocionais diários para os membros da igreja
              </p>
            </div>
            {canCreate && (
              <button
                onClick={handleCreateDevotional}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                ➕ Novo Devocional
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'devotionals' && renderDevotionals()}
        {selectedTab === 'categories' && renderCategories()}
        {selectedTab === 'plans' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12 text-gray-600">
              <div className="text-5xl mb-4">📅</div>
              <p>Sistema de planos em desenvolvimento</p>
            </div>
          </div>
        )}
        {selectedTab === 'comments' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12 text-gray-600">
              <div className="text-5xl mb-4">💬</div>
              <p>Sistema de comentários em desenvolvimento</p>
            </div>
          </div>
        )}
        {selectedTab === 'stats' && renderStats()}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDevotionalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onDevotionalCreated={loadData}
          currentUser={currentUser}
          categories={categories}
        />
      )}

      {showEditModal && selectedDevotional && (
        <EditDevotionalModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDevotional(null);
          }}
          onDevotionalUpdated={loadData}
          devotional={selectedDevotional}
          currentUser={currentUser}
          categories={categories}
        />
      )}

      {showDetailModal && selectedDevotional && (
        <DevotionalDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDevotional(null);
          }}
          devotional={selectedDevotional}
        />
      )}
    </div>
  );
};