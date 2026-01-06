// Presentation Page - Public Devotionals
// Public page for viewing and reading devotionals

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Devotional,
  DevotionalCategory
} from '@modules/church-management/devotionals/domain/entities/Devotional';
import { 
  devotionalService, 
  DevotionalFilters
} from '@modules/church-management/devotionals/application/services/DevotionalService';
import SocialShareButtons from '../components/SocialShareButtons';

export const Devotionals: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [todaysDevotional, setTodaysDevotional] = useState<Devotional | null>(null);
  const [categories, setCategories] = useState<DevotionalCategory[]>([]);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [filters, setFilters] = useState<DevotionalFilters>({ isPublished: true });
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'reading'>('list');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load today's devotional
      const todaysDev = await devotionalService.getTodaysDevotional();
      setTodaysDevotional(todaysDev);

      // Load devotionals
      const { devotionals: devotionalsData, hasMore: more } = await devotionalService.getDevotionals(filters, 12);
      setDevotionals(devotionalsData);
      setHasMore(more);

      // Load categories
      const categoriesData = await devotionalService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      // If index is building, show empty results instead of error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && errorMessage.includes('index')) {
        setDevotionals([]);
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReadDevotional = async (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setViewMode('reading');
    
    // Increment view count
    try {
      await devotionalService.incrementViewCount(devotional.id);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleLike = async (devotionalId: string) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir');
      return;
    }

    try {
      await devotionalService.toggleLike(devotionalId, currentUser.id);
      await loadData();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (devotionalId: string) => {
    if (!currentUser) {
      alert('Você precisa estar logado para favoritar');
      return;
    }

    try {
      await devotionalService.toggleBookmark(devotionalId, currentUser.id);
      await loadData();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleMarkAsRead = async () => {
    console.log('handleMarkAsRead called', { currentUser: !!currentUser, selectedDevotional: !!selectedDevotional });
    if (!currentUser || !selectedDevotional) return;

    try {
      console.log('Calling devotionalService.markAsRead');
      await devotionalService.markAsRead(selectedDevotional.id, currentUser.id);
      console.log('Successfully marked as read');
      // Show success feedback
      alert('Devocional marcado como lido!');
      // Return to list view
      setViewMode('list');
    } catch (error) {
      console.error('Error marking as read:', error);
      alert('Erro ao marcar como lido. Tente novamente.');
    }
  };

  const renderTodaysDevotional = () => {
    if (!todaysDevotional) return null;

    return (
      <div 
        className="rounded-lg p-8 text-white mb-8"
        style={{
          background: `linear-gradient(to right, ${settings?.primaryColor || '#6366F1'}, ${settings?.secondaryColor || '#8B5CF6'})`
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-semibold">Devocional de Hoje</h2>
          </div>
          
          <h3 className="text-3xl font-bold mb-4">{todaysDevotional.title}</h3>
          
          <div className="mb-6">
            <p className="text-lg font-medium mb-2">
              📖 {todaysDevotional.bibleReference}
            </p>
            <p className="text-white text-opacity-90 italic">
              "{todaysDevotional.bibleVerse}"
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-white text-opacity-80">
              <span>Por {todaysDevotional.author}</span>
              <span>⏱️ {todaysDevotional.readingTime} min de leitura</span>
            </div>
            
            <button
              onClick={() => handleReadDevotional(todaysDevotional)}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              Ler Devocional
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDevotionalsList = () => {
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

    if (devotionals.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum devocional encontrado</h3>
          <p className="text-gray-600">
            Não há devocionais disponíveis no momento. Volte em breve para mais conteúdo.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devotionals.map(devotional => {
          const isLiked = currentUser && devotional.likes.includes(currentUser.id);
          const isBookmarked = currentUser && devotional.bookmarks.includes(currentUser.id);

          return (
            <article key={devotional.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {devotional.imageUrl && (
                <img 
                  src={devotional.imageUrl} 
                  alt={devotional.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              {!devotional.imageUrl && (
                <div className="w-full h-48 rounded-t-lg theme-gradient"></div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="text-indigo-600 font-medium flex items-center gap-1">
                    <span>{devotional.category.icon}</span>
                    {devotional.category.name}
                  </span>
                  <span>•</span>
                  <span>{formatDate(devotional.publishDate, "dd/MM")}</span>
                  <span>•</span>
                  <span>⏱️ {devotional.readingTime} min</span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {devotional.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  📖 {devotional.bibleReference}
                </p>
                
                <p className="text-gray-600 line-clamp-2 mb-4">
                  {devotional.content}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    Por {devotional.author}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={() => handleLike(devotional.id)}
                      className={`flex items-center gap-1 ${
                        isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                      } transition-colors`}
                    >
                      <span>
                        {isLiked ? '❤️' : '🤍'} {devotional.likes.length}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => handleBookmark(devotional.id)}
                      className={`${
                        isBookmarked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                      } transition-colors`}
                      title={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      {isBookmarked ? '🔖' : '📖'}
                    </button>
                    
                    <button
                      onClick={() => handleReadDevotional(devotional)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Ler mais
                    </button>
                  </div>
                </div>
                  
                <SocialShareButtons
                  url={`${window.location.origin}/devotionals/${devotional.id}`}
                  title={devotional.title}
                  description={devotional.content.slice(0, 200)}
                  hashtags={['devocional', 'fé', 'igreja', ...devotional.tags]}
                  imageUrl={devotional.imageUrl}
                  className="border-t pt-4"
                  showText={false}
                />
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderReadingView = () => {
    if (!selectedDevotional) return null;

    const isLiked = currentUser && selectedDevotional.likes.includes(currentUser.id);
    const isBookmarked = currentUser && selectedDevotional.bookmarks.includes(currentUser.id);

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedDevotional(null);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para lista
        </button>

        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedDevotional.category.icon}</span>
              <span className="text-gray-600">{selectedDevotional.category.name}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedDevotional.title}
            </h1>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Por {selectedDevotional.author}</span>
                <span>{formatDate(selectedDevotional.publishDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                <span>⏱️ {selectedDevotional.readingTime} min</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLike(selectedDevotional.id)}
                  className={`flex items-center gap-1 ${
                    isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  } transition-colors`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{selectedDevotional.likes.length}</span>
                </button>
                
                <button
                  onClick={() => handleBookmark(selectedDevotional.id)}
                  className={`flex items-center gap-1 ${
                    isBookmarked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                  } transition-colors`}
                  title={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Bible Verse */}
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200 mb-8">
            <h2 className="font-semibold text-indigo-900 mb-2">
              📖 {selectedDevotional.bibleReference}
            </h2>
            <p className="text-indigo-800 italic text-lg">
              "{selectedDevotional.bibleVerse}"
            </p>
          </div>

          {/* Image */}
          {selectedDevotional.imageUrl && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={selectedDevotional.imageUrl} 
                alt={selectedDevotional.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none mb-8">
            <p className="whitespace-pre-wrap">
              {selectedDevotional.content}
            </p>
          </div>

          {/* Reflection */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
            <h3 className="text-xl font-semibold text-yellow-900 mb-3">
              💭 Reflexão
            </h3>
            <p className="text-yellow-800 whitespace-pre-wrap">
              {selectedDevotional.reflection}
            </p>
          </div>

          {/* Prayer */}
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-8">
            <h3 className="text-xl font-semibold text-purple-900 mb-3">
              🙏 Oração
            </h3>
            <p className="text-purple-800 whitespace-pre-wrap">
              {selectedDevotional.prayer}
            </p>
          </div>

          {/* Audio Player */}
          {selectedDevotional.audioUrl && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                🎧 Ouvir este Devocional
              </h3>
              <audio controls className="w-full">
                <source src={selectedDevotional.audioUrl} type="audio/mpeg" />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
          )}

          {/* Tags */}
          {selectedDevotional.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {selectedDevotional.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              🔄 Compartilhar este Devocional
            </h3>
            <SocialShareButtons
              url={`${window.location.origin}/devotionals/${selectedDevotional.id}`}
              title={selectedDevotional.title}
              description={`${selectedDevotional.bibleReference}: "${selectedDevotional.bibleVerse}"`}
              hashtags={['devocional', 'fé', 'igreja', ...selectedDevotional.tags]}
              imageUrl={selectedDevotional.imageUrl}
              showText={true}
            />
          </div>

          {/* Mark as Read */}
          {currentUser && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleMarkAsRead}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                ✓ Marcar como Lido
              </button>
            </div>
          )}
        </article>
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
              <h1 className="text-3xl font-bold text-gray-900">Devocionais</h1>
              <p className="mt-1 text-sm text-gray-600">
                Fortaleça sua fé com reflexões diárias da Palavra de Deus
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {viewMode === 'list' ? (
          <>

            {/* Today's Devotional */}
            {renderTodaysDevotional()}

            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ isPublished: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !filters.categoryId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setFilters({ ...filters, categoryId: category.id })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      filters.categoryId === category.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Devotionals List */}
            {renderDevotionalsList()}

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {/* Implement load more */}}
                  className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                >
                  Carregar Mais
                </button>
              </div>
            )}
          </>
        ) : (
          renderReadingView()
        )}
      </div>
    </div>
  );
};