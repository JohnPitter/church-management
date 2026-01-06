// Presentation Page - Blog
// Blog listing and viewing page with Firebase integration

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BlogPost, PostVisibility } from '../../modules/content-management/blog/domain/entities/BlogPost';
import { FirebaseBlogRepository } from '@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository';
import { format } from 'date-fns';
import SocialShareButtons from '../components/SocialShareButtons';

// Presentation interface for BlogPost
interface PresentationBlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  author: {
    id: string;
    name: string;
    photoURL?: string;
    role: string;
  };
  status: string;
  visibility: string;
  featuredImage?: string;
  publishedAt?: Date;
  likes: number;
  views: number;
  commentsEnabled: boolean;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to map domain to presentation
const mapDomainToPresentation = (post: BlogPost): PresentationBlogPost => ({
  id: post.id,
  title: post.title,
  content: post.content,
  excerpt: post.excerpt,
  categories: post.categories,
  tags: post.tags,
  author: post.author,
  status: post.status,
  visibility: post.visibility,
  featuredImage: post.featuredImage,
  publishedAt: post.publishedAt,
  likes: post.likes,
  views: post.views,
  commentsEnabled: post.commentsEnabled,
  isHighlighted: post.isHighlighted,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt
});

export const BlogPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<PresentationBlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const blogRepository = useMemo(() => new FirebaseBlogRepository(), []);

  const handleReadMore = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    try {
      const hasLiked = userLikes.has(postId);

      if (hasLiked) {
        // Unlike the post
        await blogRepository.unlikePost(postId, currentUser.id);
        
        // Update local state
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, likes: Math.max(0, p.likes - 1) }
              : p
          )
        );
      } else {
        // Like the post
        await blogRepository.likePost(postId, currentUser.id);
        
        // Update local state
        setUserLikes(prev => new Set(prev).add(postId));
        
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, likes: p.likes + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Could show a toast notification here
    }
  };

  // Load posts from Firebase
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        // Load published posts that are appropriate for the user's access level
        const domainPosts = await blogRepository.findPublished();
        
        // Filter posts based on visibility and user authentication
        const visiblePosts = domainPosts.filter(post => {
          if (post.visibility === PostVisibility.Public) {
            return true;
          }
          if (post.visibility === PostVisibility.MembersOnly && currentUser) {
            return true;
          }
          return false;
        });

        const presentationPosts = visiblePosts.map(mapDomainToPresentation);
        setPosts(presentationPosts);

        // Load user's likes if authenticated
        if (currentUser) {
          const userLikedPosts = new Set<string>();
          for (const post of presentationPosts) {
            try {
              const hasLiked = await blogRepository.hasUserLiked(post.id, currentUser.id);
              if (hasLiked) {
                userLikedPosts.add(post.id);
              }
            } catch (error) {
              console.error(`Error checking like status for post ${post.id}:`, error);
            }
          }
          setUserLikes(userLikedPosts);
        }
      } catch (error) {
        console.error('Error loading blog posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [blogRepository, currentUser]);

  // Get unique categories from posts
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    posts.forEach(post => {
      post.categories.forEach(category => uniqueCategories.add(category));
    });
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [posts]);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.categories.includes(selectedCategory);
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get the highlighted post (if any)
  const highlightedPost = posts.find(post => post.isHighlighted) || null;
  const regularPosts = filteredPosts.filter(post => !post.isHighlighted);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
              <p className="mt-1 text-sm text-gray-600">
                Mensagens, reflexões e estudos para sua edificação
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading State */}
        {loading ? (
          <div className="space-y-8">
            {/* Search and Filters Skeleton */}
            <div className="animate-pulse">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
            {/* Featured Post Skeleton */}
            <div className="animate-pulse">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
        ) : (
          <>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar postagens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category === 'all' ? 'Todas' : category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Highlighted Post */}
            {highlightedPost && selectedCategory === 'all' && !searchTerm && (
              <div className="mb-12">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        ⭐ Destaque
                      </span>
                    </div>
                    {highlightedPost.featuredImage && (
                      <img
                        src={highlightedPost.featuredImage}
                        alt={highlightedPost.title}
                        className="w-full h-64 object-cover"
                      />
                    )}
                    {!highlightedPost.featuredImage && (
                      <div className="w-full h-64 theme-gradient"></div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span>{highlightedPost.categories[0] || 'Geral'}</span>
                      <span>•</span>
                      <span>{format(highlightedPost.publishedAt || highlightedPost.createdAt, "dd/MM/yyyy")}</span>
                      <span>•</span>
                      <span>{highlightedPost.author.name}</span>
                      <span>•</span>
                      <span>{highlightedPost.views} visualizações</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {highlightedPost.title}
                    </h2>
                    <div className="text-gray-600 mb-4">
                      {expandedPostId === highlightedPost.id ? (
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: highlightedPost.content }}
                        />
                      ) : (
                        <p>{highlightedPost.excerpt}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        {highlightedPost.tags.slice(0, 4).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(highlightedPost.id);
                          }}
                          className={`font-medium flex items-center gap-1 transition-colors ${
                            userLikes.has(highlightedPost.id)
                              ? 'text-red-600 hover:text-red-500'
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <span>
                            {userLikes.has(highlightedPost.id) ? '❤️' : '🤍'} {highlightedPost.likes}
                          </span>
                        </button>
                        <button 
                          onClick={() => handleReadMore(highlightedPost.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {expandedPostId === highlightedPost.id ? 'Ler menos ←' : 'Ler mais →'}
                        </button>
                      </div>
                    </div>
                    <SocialShareButtons
                      url={`${window.location.origin}/blog/${highlightedPost.id}`}
                      title={highlightedPost.title}
                      description={highlightedPost.excerpt}
                      hashtags={highlightedPost.tags}
                      imageUrl={highlightedPost.featuredImage}
                      className="border-t pt-4"
                      showText={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Regular Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map(post => (
                <article key={post.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  {!post.featuredImage && (
                    <div className="w-full h-48 rounded-t-lg theme-gradient"></div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span className="text-indigo-600 font-medium">{post.categories[0] || 'Geral'}</span>
                      <span>•</span>
                      <span>{format(post.publishedAt || post.createdAt, "dd/MM")}</span>
                      <span>•</span>
                      <span>{post.views} views</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <div className="text-gray-600 mb-4">
                      {expandedPostId === post.id ? (
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      ) : (
                        <p className="line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">
                        Por {post.author.name}
                      </span>
                      <div className="flex items-center gap-3 text-sm">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(post.id);
                          }}
                          className={`font-medium flex items-center gap-1 transition-colors ${
                            userLikes.has(post.id)
                              ? 'text-red-600 hover:text-red-500'
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <span>
                            {userLikes.has(post.id) ? '❤️' : '🤍'} {post.likes}
                          </span>
                        </button>
                        <button 
                          onClick={() => handleReadMore(post.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {expandedPostId === post.id ? 'Ler menos' : 'Ler mais'}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <SocialShareButtons
                      url={`${window.location.origin}/blog/${post.id}`}
                      title={post.title}
                      description={post.excerpt}
                      hashtags={post.tags}
                      imageUrl={post.featuredImage}
                      className="border-t pt-4"
                      showText={false}
                    />
                  </div>
                </article>
              ))}
            </div>

            {/* Empty State - No Posts */}
            {!loading && posts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma postagem disponível</h3>
                <p className="text-gray-600">
                  Não há postagens publicadas no momento. Volte em breve para mais conteúdo.
                </p>
              </div>
            )}

            {/* Empty State - No Results */}
            {!loading && posts.length > 0 && filteredPosts.length === 0 && (
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma postagem encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros ou fazer uma nova busca.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};