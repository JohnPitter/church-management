// Presentation Page - Public Forum
// Public forum page for community discussions

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, useParams } from 'react-router-dom';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ForumTopic,
  ForumCategory,
  ForumReply,
  TopicStatus,
  ReplyStatus
} from '@modules/content-management/forum/domain/entities/Forum';
import { 
  forumService,
  TopicFilters
} from '@modules/content-management/forum/infrastructure/services/ForumService';
import { CreateTopicModal } from '../components/CreateTopicModal';
import SocialShareButtons from '../components/SocialShareButtons';

export const Forum: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings: _settings } = useSettings();
  const navigate = useNavigate();
  const { categorySlug, topicId } = useParams();

  const [loading, setLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [filters, _setFilters] = useState<TopicFilters>({ status: TopicStatus.PUBLISHED });
  const [viewMode, setViewMode] = useState<'categories' | 'topics' | 'topic'>('categories');
  const [_hasMoreTopics, setHasMoreTopics] = useState(false);
  const [_hasMoreReplies, setHasMoreReplies] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (topicId) {
      loadTopicAndReplies(topicId);
      setViewMode('topic');
    } else if (categorySlug) {
      loadCategoryTopics(categorySlug);
      setViewMode('topics');
    } else {
      setViewMode('categories');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, topicId]);

  const loadInitialData = async () => {
    try {
      const categoriesData = await forumService.getCategories(true);
      setCategories(categoriesData);
      setLoading(false);
      setIndexBuilding(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // If index is building, show a message instead of infinite loading
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && errorMessage.includes('index is currently building')) {
        setIndexBuilding(true);
        setCategories([]);
      } else {
        setCategories([]);
      }
      setLoading(false);
    }
  };

  const loadCategoryTopics = async (slug: string) => {
    setLoading(true);
    try {
      const category = categories.find(cat => cat.slug === slug);
      if (!category) return;

      const { topics: topicsData, hasMore } = await forumService.getTopics({
        ...filters,
        categoryId: category.id
      });
      
      setTopics(topicsData);
      setHasMoreTopics(hasMore);
    } catch (error) {
      console.error('Error loading category topics:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && errorMessage.includes('index is currently building')) {
        setIndexBuilding(true);
        setTopics([]);
      } else {
        setTopics([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTopicAndReplies = async (id: string) => {
    setLoading(true);
    try {
      // Load topic
      const topic = await forumService.getTopic(id);
      if (!topic) {
        navigate('/forum');
        return;
      }
      
      setSelectedTopic(topic);
      
      // Increment view count
      await forumService.incrementViewCount(id);
      
      // Load replies
      const { replies: repliesData, hasMore } = await forumService.getReplies(id);
      setReplies(repliesData);
      setHasMoreReplies(hasMore);
    } catch (error) {
      console.error('Error loading topic:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && errorMessage.includes('index is currently building')) {
        setIndexBuilding(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: ForumTopic) => {
    navigate(`/forum/${topic.category.slug}/${topic.id}`);
  };

  const handleCategoryClick = (category: ForumCategory) => {
    navigate(`/forum/${category.slug}`);
  };

  const handleLikeTopic = async (topicId: string) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir');
      return;
    }

    try {
      await forumService.toggleTopicLike(topicId, currentUser.id);
      
      // Reload topic if viewing it
      if (selectedTopic && selectedTopic.id === topicId) {
        const updatedTopic = await forumService.getTopic(topicId);
        if (updatedTopic) setSelectedTopic(updatedTopic);
      }
      
      // Reload topics list
      if (viewMode === 'topics' && categorySlug) {
        loadCategoryTopics(categorySlug);
      }
    } catch (error) {
      console.error('Error liking topic:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir');
      return;
    }

    try {
      await forumService.toggleReplyLike(replyId, currentUser.id);
      
      // Reload replies
      if (selectedTopic) {
        const { replies: repliesData } = await forumService.getReplies(selectedTopic.id);
        setReplies(repliesData);
      }
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  const handleCreateReply = async () => {
    if (!currentUser || !selectedTopic || !newReply.trim()) {
      return;
    }

    if (selectedTopic.isLocked) {
      alert('Este tópico está bloqueado para novas respostas');
      return;
    }

    try {
      const replyData = {
        topicId: selectedTopic.id,
        content: newReply.trim(),
        authorId: currentUser.id,
        authorName: currentUser.displayName || currentUser.email || 'Usuário',
        authorEmail: currentUser.email || '',
        authorAvatar: currentUser.photoURL,
        status: ReplyStatus.PUBLISHED, // Auto-publish for authenticated users
        attachments: []
      };

      await forumService.createReply(replyData);
      setNewReply('');
      
      // Reload replies
      const { replies: repliesData } = await forumService.getReplies(selectedTopic.id);
      setReplies(repliesData);
      
      // Reload topic to update reply count
      const updatedTopic = await forumService.getTopic(selectedTopic.id);
      if (updatedTopic) setSelectedTopic(updatedTopic);
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Erro ao criar resposta');
    }
  };

  const renderCategories = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Categorias</h2>
            <p className="text-gray-600">Escolha uma categoria para participar das discussões</p>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowCreateTopicModal(true)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors theme-primary hover:opacity-90"
            >
              <span>💬</span>
              Novo Tópico
            </button>
          )}
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-600">
              As categorias do fórum serão carregadas em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <article 
                key={category.id} 
                onClick={() => handleCategoryClick(category)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                    style={{ backgroundColor: category.color + '20', color: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600 line-clamp-2">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{category.topicCount}</div>
                    <div className="text-gray-600">Tópicos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{category.replyCount}</div>
                    <div className="text-gray-600">Respostas</div>
                  </div>
                </div>

                {category.lastTopicAt && (
                  <div className="text-sm text-gray-500 border-t pt-3">
                    Última atividade: {formatDate(category.lastTopicAt, "dd/MM")}
                    {category.lastTopicBy && ` por ${category.lastTopicBy}`}
                  </div>
                )}
              </div>
            </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTopics = () => {
    const currentCategory = categories.find(cat => cat.slug === categorySlug);
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/forum')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {currentCategory && (
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: currentCategory.color + '20', color: currentCategory.color }}
              >
                {currentCategory.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentCategory.name}</h2>
                <p className="text-gray-600">{currentCategory.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Topic Button */}
        {currentUser && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateTopicModal(true)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors theme-primary hover:opacity-90"
            >
              <span>💬</span>
              Novo Tópico
            </button>
          </div>
        )}

        {/* Topics List */}
        <div className="space-y-4">
          {topics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-600 mb-4">Nenhum tópico nesta categoria ainda</p>
              {currentUser && (
                <button
                  onClick={() => setShowCreateTopicModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Criar Primeiro Tópico
                </button>
              )}
            </div>
          ) : (
            topics.map(topic => {
              const isLiked = currentUser && topic.likes.includes(currentUser.id);
              
              return (
                <div key={topic.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {topic.authorAvatar ? (
                        <img src={topic.authorAvatar} alt={topic.authorName} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    
                    {/* Topic Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {topic.isPinned && <span className="text-yellow-500">📌</span>}
                        {topic.isLocked && <span className="text-red-500">🔒</span>}
                        <h3 
                          onClick={() => handleTopicClick(topic)}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer"
                        >
                          {topic.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {topic.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Por {topic.authorName}</span>
                          <span>{formatDate(topic.createdAt, "d 'de' MMM", { locale: ptBR })}</span>
                          <span className="flex items-center gap-1">
                            👁️ {topic.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            💭 {topic.replyCount}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLikeTopic(topic.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded ${
                              isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                            }`}
                          >
                            <span>{isLiked ? '❤️' : '🤍'}</span>
                            <span>{topic.likes.length}</span>
                          </button>
                          
                          <button
                            onClick={() => handleTopicClick(topic)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                          >
                            Ver Tópico
                          </button>
                        </div>
                      </div>
                      
                      {topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {topic.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Social Share Buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <SocialShareButtons
                          url={`${window.location.origin}/forum/${topic.category.slug}/${topic.id}`}
                          title={topic.title}
                          description={topic.content.slice(0, 200)}
                          hashtags={['forum', 'discussão', 'igreja', ...topic.tags]}
                          showText={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTopic = () => {
    if (loading || !selectedTopic) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    const isLiked = currentUser && selectedTopic.likes.includes(currentUser.id);

    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate('/forum')} className="text-indigo-600 hover:text-indigo-700">
            Fórum
          </button>
          <span className="text-gray-400">›</span>
          <button 
            onClick={() => navigate(`/forum/${selectedTopic.category.slug}`)}
            className="text-indigo-600 hover:text-indigo-700"
          >
            {selectedTopic.category.name}
          </button>
          <span className="text-gray-400">›</span>
          <span className="text-gray-600">{selectedTopic.title}</span>
        </div>

        {/* Topic */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            {/* Author */}
            <div className="flex-shrink-0 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                {selectedTopic.authorAvatar ? (
                  <img src={selectedTopic.authorAvatar} alt={selectedTopic.authorName} className="w-16 h-16 rounded-full" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900">{selectedTopic.authorName}</div>
              <div className="text-xs text-gray-500">
                {formatDate(selectedTopic.createdAt, "d 'de' MMM", { locale: ptBR })}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                {selectedTopic.isPinned && <span className="text-yellow-500">📌</span>}
                {selectedTopic.isLocked && <span className="text-red-500">🔒</span>}
                <h1 className="text-2xl font-bold text-gray-900">{selectedTopic.title}</h1>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap text-gray-700">{selectedTopic.content}</p>
              </div>
              
              {selectedTopic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {selectedTopic.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      👁️ {selectedTopic.viewCount} visualizações
                    </span>
                    <span className="flex items-center gap-1">
                      💭 {selectedTopic.replyCount} respostas
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleLikeTopic(selectedTopic.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded ${
                      isLiked ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600'
                    }`}
                  >
                    <span>{isLiked ? '❤️' : '🤍'}</span>
                    <span>{selectedTopic.likes.length}</span>
                  </button>
                </div>
                
                {/* Social Share Buttons */}
                <div className="border-t pt-4">
                  <SocialShareButtons
                    url={`${window.location.origin}/forum/${selectedTopic.category.slug}/${selectedTopic.id}`}
                    title={selectedTopic.title}
                    description={selectedTopic.content.slice(0, 200)}
                    hashtags={['forum', 'discussão', 'igreja', ...selectedTopic.tags]}
                    showText={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Respostas ({selectedTopic.replyCount})
          </h3>
          
          {replies.map(reply => {
            const isReplyLiked = currentUser && reply.likes.includes(currentUser.id);
            
            return (
              <div key={reply.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                      {reply.authorAvatar ? (
                        <img src={reply.authorAvatar} alt={reply.authorName} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-900">{reply.authorName}</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {formatDate(reply.createdAt, "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        {reply.editedAt && <span className="ml-2">(editado)</span>}
                      </div>
                      
                      <button
                        onClick={() => handleLikeReply(reply.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                          isReplyLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <span>{isReplyLiked ? '❤️' : '🤍'}</span>
                        <span>{reply.likes.length}</span>
                      </button>
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">{reply.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        {currentUser && !selectedTopic.isLocked && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Sua Resposta</h4>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-4"
              placeholder="Escreva sua resposta..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleCreateReply}
                disabled={!newReply.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Resposta
              </button>
            </div>
          </div>
        )}

        {selectedTopic.isLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-yellow-800 font-medium">Este tópico está bloqueado para novas respostas</p>
          </div>
        )}

        {!currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              <span className="font-medium">Faça login</span> para participar da discussão
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading && !indexBuilding) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fórum</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Participe das discussões da nossa comunidade
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando fórum...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (indexBuilding) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preparando o Fórum
              </h3>
              <p className="text-gray-600 mb-4">
                O sistema de fórum está sendo configurado. Isso pode levar alguns minutos.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Os índices do banco de dados estão sendo construídos. Recarregue a página em alguns minutos.
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Recarregar Página
              </button>
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
              <h1 className="text-3xl font-bold text-gray-900">Fórum</h1>
              <p className="mt-1 text-sm text-gray-600">
                Participe das discussões da nossa comunidade
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {viewMode === 'categories' && renderCategories()}
        {viewMode === 'topics' && renderTopics()}
        {viewMode === 'topic' && renderTopic()}
        
        {/* Create Topic Modal */}
        {showCreateTopicModal && (
          <CreateTopicModal
            isOpen={showCreateTopicModal}
            onClose={() => setShowCreateTopicModal(false)}
            onTopicCreated={() => {
              // Reload current view
              if (viewMode === 'topics' && categorySlug) {
                loadCategoryTopics(categorySlug);
              }
              loadInitialData(); // Refresh categories stats
            }}
            currentUser={currentUser}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
};