// Presentation Page - Admin Forum
// Forum management dashboard for administrators

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ForumTopic,
  ForumCategory,
  ForumStats,
  TopicStatus,
  TopicPriority
} from '../../modules/content-management/forum/domain/entities/Forum';
import { 
  forumService,
  TopicFilters
} from '../../infrastructure/services/ForumService';
import { CreateTopicModal } from '../components/CreateTopicModal';
import { CreateForumCategoryModal } from '../components/CreateForumCategoryModal';

export const AdminForumPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [selectedTab, setSelectedTab] = useState('topics');
  const [filters, setFilters] = useState<TopicFilters>({});
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load topics
      const { topics: topicsData, hasMore: more } = await forumService.getTopics(filters);
      setTopics(topicsData);
      setHasMore(more);

      // Load categories
      const categoriesData = await forumService.getCategories(false);
      setCategories(categoriesData);

      // Load stats
      const statsData = await forumService.getForumStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopicStatus = async (topicId: string, status: TopicStatus) => {
    try {
      await forumService.updateTopic(topicId, { status });
      await loadData();
    } catch (error) {
      console.error('Error updating topic status:', error);
      alert('Erro ao atualizar status do tópico');
    }
  };

  const handleTogglePin = async (topic: ForumTopic) => {
    try {
      await forumService.updateTopic(topic.id, { isPinned: !topic.isPinned });
      await loadData();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Erro ao fixar/desfixar tópico');
    }
  };

  const handleToggleLock = async (topic: ForumTopic) => {
    try {
      await forumService.updateTopic(topic.id, { isLocked: !topic.isLocked });
      await loadData();
    } catch (error) {
      console.error('Error toggling lock:', error);
      alert('Erro ao bloquear/desbloquear tópico');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este tópico?')) return;

    try {
      await forumService.deleteTopic(topicId);
      await loadData();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Erro ao excluir tópico');
    }
  };

  const tabs = [
    { id: 'topics', label: 'Tópicos', icon: '💬' },
    { id: 'categories', label: 'Categorias', icon: '🏷️' },
    { id: 'moderation', label: 'Moderação', icon: '🛡️' },
    { id: 'stats', label: 'Estatísticas', icon: '📊' }
  ];

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Tópicos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTopics}</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Respostas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalReplies}</p>
            </div>
            <div className="text-3xl">💭</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Visualizações</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalViews}</p>
            </div>
            <div className="text-3xl">👁️</div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      case TopicStatus.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case TopicStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TopicStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.PUBLISHED:
        return 'Publicado';
      case TopicStatus.PENDING_APPROVAL:
        return 'Pendente';
      case TopicStatus.REJECTED:
        return 'Rejeitado';
      case TopicStatus.ARCHIVED:
        return 'Arquivado';
      default:
        return status;
    }
  };

  const renderTopics = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (topics.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-gray-600 mb-4">Nenhum tópico encontrado</p>
          <button
            onClick={() => setShowCreateTopicModal(true)}
            className="px-4 py-2 text-white rounded-lg transition-colors theme-primary hover:opacity-90"
          >
            Criar Primeiro Tópico
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {topic.isPinned && <span className="text-yellow-500">📌</span>}
                  {topic.isLocked && <span className="text-red-500">🔒</span>}
                  <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(topic.status)}`}>
                    {getStatusLabel(topic.status)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <span>{topic.category.icon}</span>
                    {topic.category.name}
                  </span>
                  <span>Por {topic.authorName}</span>
                  <span>{formatDate(topic.createdAt, "d 'de' MMM", { locale: ptBR })}</span>
                  <span className="flex items-center gap-1">
                    👁️ {topic.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    💭 {topic.replyCount}
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {topic.likes.length}
                  </span>
                </div>

                <p className="text-gray-700 line-clamp-2 mb-3">
                  {topic.content}
                </p>

                {topic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(topic)}
                  className={`p-2 rounded-lg ${
                    topic.isPinned ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={topic.isPinned ? 'Desfixar' : 'Fixar'}
                >
                  📌
                </button>
                <button
                  onClick={() => handleToggleLock(topic)}
                  className={`p-2 rounded-lg ${
                    topic.isLocked ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={topic.isLocked ? 'Desbloquear' : 'Bloquear'}
                >
                  🔒
                </button>
                
                <div className="relative group">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    ⚙️
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleUpdateTopicStatus(topic.id, TopicStatus.PUBLISHED)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ✅ Aprovar
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(topic.id, TopicStatus.REJECTED)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ❌ Rejeitar
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(topic.id, TopicStatus.ARCHIVED)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📦 Arquivar
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                </div>
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
          <div className="text-5xl mb-4">🏷️</div>
          <p className="text-gray-600 mb-4">Nenhuma categoria encontrada</p>
          <button
            onClick={() => setShowCreateCategoryModal(true)}
            className="px-4 py-2 text-white rounded-lg transition-colors theme-primary hover:opacity-90"
          >
            Criar Primeira Categoria
          </button>
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
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{category.topicCount}</div>
                <div className="text-gray-600">Tópicos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{category.replyCount}</div>
                <div className="text-gray-600">Respostas</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderModeration = () => {
    const pendingTopics = topics.filter(topic => topic.status === TopicStatus.PENDING_APPROVAL);

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Tópicos Pendentes de Aprovação</h3>
          {pendingTopics.length === 0 ? (
            <p className="text-gray-600">Nenhum tópico pendente de aprovação</p>
          ) : (
            <div className="space-y-3">
              {pendingTopics.map(topic => (
                <div key={topic.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div>
                    <h4 className="font-medium">{topic.title}</h4>
                    <p className="text-sm text-gray-600">Por {topic.authorName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTopicStatus(topic.id, TopicStatus.PUBLISHED)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleUpdateTopicStatus(topic.id, TopicStatus.REJECTED)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Popular Topics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Tópicos Populares</h3>
          <div className="space-y-3">
            {stats.popularTopics.map(topic => (
              <div key={topic.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{topic.title}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(topic.createdAt, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>👁️ {topic.viewCount}</span>
                  <span>💭 {topic.replyCount}</span>
                  <span>❤️ {topic.likes.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {stats.recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span> {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.timestamp, "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Fórum</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre tópicos, categorias e modere discussões
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                🏷️ Nova Categoria
              </button>
              <button
                onClick={() => setShowCreateTopicModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors theme-primary hover:opacity-90"
              >
                💬 Novo Tópico
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Statistics Cards */}
        {renderStatsCards()}

        {/* Content Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'topics' && renderTopics()}
            {selectedTab === 'categories' && renderCategories()}
            {selectedTab === 'moderation' && renderModeration()}
            {selectedTab === 'stats' && renderStats()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTopicModal && (
        <CreateTopicModal
          isOpen={showCreateTopicModal}
          onClose={() => setShowCreateTopicModal(false)}
          onTopicCreated={loadData}
          currentUser={currentUser}
          categories={categories}
        />
      )}

      {showCreateCategoryModal && (
        <CreateForumCategoryModal
          isOpen={showCreateCategoryModal}
          onClose={() => setShowCreateCategoryModal(false)}
          onCategoryCreated={loadData}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};