// Presentation Page - Admin Blog Management
// Administrative interface for managing blog posts and categories

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { FirebaseBlogRepository } from '@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository';
import { BlogPost as DomainBlogPost, PostStatus, PostVisibility } from '../../modules/content-management/blog/domain/entities/BlogPost';
import { format } from 'date-fns';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import { PermissionGuard } from '../components/PermissionGuard';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';

// Presentation interface that maps to domain entities
interface PresentationBlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  isHighlighted: boolean;
  viewCount: number;
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  imageURL?: string;
}

// Helper functions to map between domain and presentation layers
const mapDomainToPresentation = (domainPost: DomainBlogPost): PresentationBlogPost => {
  return {
    id: domainPost.id,
    title: domainPost.title,
    content: domainPost.content,
    excerpt: domainPost.excerpt,
    category: domainPost.categories?.[0] || 'Geral',
    tags: domainPost.tags,
    author: domainPost.author.name,
    status: domainPost.status === PostStatus.Published ? 'published' : 
            domainPost.status === PostStatus.Draft ? 'draft' : 'archived',
    isHighlighted: false, // Default value since not in domain
    viewCount: domainPost.views || 0,
    publishDate: domainPost.publishedAt,
    createdAt: domainPost.createdAt,
    updatedAt: domainPost.updatedAt,
    createdBy: domainPost.author.id,
    imageURL: domainPost.featuredImage
  };
};

export const AdminBlogManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifyNewBlogPost } = useNotificationActions();
  const [posts, setPosts] = useState<PresentationBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PresentationBlogPost | null>(null);

  const blogRepository = useMemo(() => new FirebaseBlogRepository(), []);

  const statuses = ['all', 'draft', 'published', 'archived'];
  const categories = ['all', 'Devocional', 'Reflexão', 'Estudo Bíblico', 'Testemunho', 'Notícias'];

  // Load blog posts from Firebase on component mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const domainPosts = await blogRepository.findAll();
        
        // Convert domain posts to presentation interface
        const presentationPosts: PresentationBlogPost[] = domainPosts.map(mapDomainToPresentation);
        
        setPosts(presentationPosts);
      } catch (error) {
        console.error('Error loading blog posts:', error);
        // Keep empty array on error rather than falling back to mock data
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [blogRepository]);

  const filteredPosts = posts.filter(post => {
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Rascunho';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${getStatusText(newStatus)}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId 
            ? { 
                ...post, 
                status: newStatus as PresentationBlogPost['status'],
                publishDate: newStatus === 'published' && !post.publishDate ? new Date() : post.publishDate,
                updatedAt: new Date()
              }
            : post
        )
      );
      
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHighlight = async (postId: string) => {
    setLoading(true);
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Update in Firebase
      await blogRepository.update(postId, { isHighlighted: !post.isHighlighted });
      
      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId 
            ? { ...p, isHighlighted: !p.isHighlighted, updatedAt: new Date() }
            : p
        )
      );
      
      alert(`Post ${!post.isHighlighted ? 'destacado' : 'removido do destaque'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling highlight:', error);
      alert('Erro ao alterar destaque.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta postagem?')) {
      return;
    }

    setLoading(true);
    const post = posts.find(p => p.id === postId);
    try {
      await blogRepository.delete(postId);
      
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      await loggingService.logDatabase('info', 'Blog post deleted successfully', 
        `Post: "${post?.title}", ID: ${postId}`, currentUser);
      
      alert('Postagem excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting post:', error);
      await loggingService.logDatabase('error', 'Failed to delete blog post', 
        `Post: "${post?.title}", ID: ${postId}, Error: ${error}`, currentUser);
      alert('Erro ao excluir postagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (post: PresentationBlogPost) => {
    setEditingPost(post);
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handleUpdatePost = async (formData: Partial<PresentationBlogPost>) => {
    if (!editingPost) return;
    
    setLoading(true);
    try {
      // Convert presentation model to domain model for update
      const domainPost: Omit<DomainBlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title || editingPost.title,
        content: formData.content || editingPost.content,
        excerpt: formData.excerpt || formData.content?.substring(0, 150) + '...' || editingPost.excerpt,
        author: {
          id: currentUser?.id || editingPost.createdBy,
          name: currentUser?.displayName || currentUser?.email || editingPost.author,
          photoURL: currentUser?.photoURL || undefined,
          role: 'admin'
        },
        categories: formData.category ? [formData.category] : [editingPost.category],
        tags: formData.tags || editingPost.tags,
        status: formData.status === 'published' ? PostStatus.Published : 
                formData.status === 'archived' ? PostStatus.Archived : PostStatus.Draft,
        visibility: PostVisibility.Public,
        featuredImage: formData.imageURL || editingPost.imageURL,
        publishedAt: formData.status === 'published' ? new Date() : undefined,
        likes: editingPost.viewCount || 0,
        views: editingPost.viewCount || 0,
        commentsEnabled: true,
        isHighlighted: formData.isHighlighted !== undefined ? formData.isHighlighted : editingPost.isHighlighted
      };
      
      // Update in Firebase
      await blogRepository.update(editingPost.id, domainPost);
      
      // Update local state
      const updatedPosts = posts.map(p => 
        p.id === editingPost.id 
          ? { ...editingPost, ...formData, updatedAt: new Date() }
          : p
      );
      setPosts(updatedPosts);
      
      setEditingPost(null);
      alert('Postagem atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Erro ao atualizar postagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (formData: Partial<PresentationBlogPost>) => {
    setLoading(true);
    try {
      // Convert presentation model to domain model
      const domainPost: Omit<DomainBlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title || '',
        content: formData.content || '',
        excerpt: formData.excerpt || formData.content?.substring(0, 150) + '...' || '',
        author: {
          id: currentUser?.id || 'admin',
          name: currentUser?.displayName || currentUser?.email || 'Admin',
          photoURL: currentUser?.photoURL || undefined,
          role: 'admin'
        },
        categories: formData.category ? [formData.category] : ['Geral'],
        tags: formData.tags || [],
        status: formData.status === 'published' ? PostStatus.Published : 
                formData.status === 'archived' ? PostStatus.Archived : PostStatus.Draft,
        visibility: PostVisibility.Public,
        featuredImage: formData.imageURL,
        publishedAt: formData.status === 'published' ? new Date() : undefined,
        likes: 0,
        views: 0,
        commentsEnabled: true,
        isHighlighted: formData.isHighlighted || false
      };
      
      // Save to Firebase
      const createdPost = await blogRepository.create(domainPost);
      
      await loggingService.logDatabase('info', 'Blog post created successfully', 
        `Post: "${createdPost.title}", Status: ${createdPost.status}, Visibility: ${createdPost.visibility}`, currentUser);
      
      // Send notification if post is published and public
      if (createdPost.status === PostStatus.Published && createdPost.visibility === PostVisibility.Public) {
        try {
          const notificationCount = await notifyNewBlogPost(
            createdPost.id, 
            createdPost.title, 
            createdPost.featuredImage
          );
          await loggingService.logApi('info', 'Blog notification sent', 
            `Post: "${createdPost.title}", Recipients: ${notificationCount}`, currentUser);
        } catch (error) {
          console.warn('Failed to send blog post notification:', error);
          await loggingService.logApi('error', 'Failed to send blog notification', 
            `Post: "${createdPost.title}", Error: ${error}`, currentUser);
        }
      }
      
      // Convert back to presentation model and update state
      const presentationPost = mapDomainToPresentation(createdPost);
      setPosts(prevPosts => [presentationPost, ...prevPosts]);
      
      setShowCreateModal(false);
      alert('Postagem criada com sucesso!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar postagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Blog</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre postagens, categorias e conteúdo do blog
              </p>
            </div>
            <PermissionGuard 
              module={SystemModule.Blog} 
              action={PermissionAction.Create}
            >
              <button
                onClick={handleCreatePost}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova Postagem
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar postagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todos os Status</option>
                {statuses.slice(1).map(status => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Publicados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {posts.filter(p => p.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rascunhos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {posts.filter(p => p.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Destacados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {posts.filter(p => p.isHighlighted).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Visualizações</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {posts.reduce((sum, p) => sum + p.viewCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Postagens ({filteredPosts.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Postagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visualizações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando postagens...</p>
                    </td>
                  </tr>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                            {post.isHighlighted && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⭐ Destaque
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                        disabled={loading}
                        className={`text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 ${getStatusColor(post.status)}`}
                      >
                        {statuses.slice(1).map(status => (
                          <option key={status} value={status}>
                            {getStatusText(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{format(post.createdAt, "dd/MM/yyyy")}</div>
                      {post.publishDate && (
                        <div className="text-xs text-gray-400">
                          Publicado: {format(post.publishDate, "dd/MM")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.viewCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <PermissionGuard 
                          module={SystemModule.Blog} 
                          action={PermissionAction.Update}
                        >
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                        </PermissionGuard>
                        
                        <PermissionGuard 
                          module={SystemModule.Blog} 
                          action={PermissionAction.Update}
                        >
                          <button
                            onClick={() => handleToggleHighlight(post.id)}
                            disabled={loading}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            {post.isHighlighted ? 'Remover Destaque' : 'Destacar'}
                          </button>
                        </PermissionGuard>
                        
                        <PermissionGuard 
                          module={SystemModule.Blog} 
                          action={PermissionAction.Delete}
                        >
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma postagem encontrada</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {posts.length === 0 
                          ? 'Crie sua primeira postagem para começar.' 
                          : 'Tente ajustar os filtros ou fazer uma nova busca.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onSave={handleSavePost}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onSave={handleUpdatePost}
          onCancel={() => setEditingPost(null)}
          loading={loading}
        />
      )}
    </div>
  );
};

// Modal component for creating new blog posts
interface CreatePostModalProps {
  onSave: (formData: Partial<PresentationBlogPost>) => void;
  onCancel: () => void;
  loading: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Geral',
    tags: '',
    status: 'draft' as PresentationBlogPost['status'],
    isHighlighted: false,
    imageURL: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const categoryOptions = [
    'Geral',
    'Reflexões',
    'Estudos Bíblicos',
    'Testemunhos',
    'Eventos',
    'Avisos',
    'Oração',
    'Jovens',
    'Família',
    'Ministério'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors['title'] = 'Título é obrigatório';
      isValid = false;
    } else if (formData.title.trim().length < 5) {
      newErrors['title'] = 'Título deve ter pelo menos 5 caracteres';
      isValid = false;
    }

    if (!formData.content.trim()) {
      newErrors['content'] = 'Conteúdo é obrigatório';
      isValid = false;
    } else if (formData.content.trim().length < 50) {
      newErrors['content'] = 'Conteúdo deve ter pelo menos 50 caracteres';
      isValid = false;
    }

    setValidationErrors(newErrors);
    setIsFormValid(isValid);
    return isValid;
  };

  React.useEffect(() => {
    validateForm();
  }, [formData]);

  const hasError = (fieldName: string) => {
    return !!validationErrors[fieldName];
  };

  const getInputClassName = (fieldName: string, baseClassName: string = 'w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500') => {
    return hasError(fieldName)
      ? `${baseClassName.replace('border-gray-300', 'border-red-500')} border-red-500 focus:border-red-500 focus:ring-red-500`
      : `${baseClassName} border-gray-300`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    // Convert tags string to array
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      ...formData,
      tags: tagsArray
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Nova Postagem do Blog
          </h3>

          {/* Validation Error Banner */}
          {!isFormValid && Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Por favor, preencha os campos obrigatórios:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Postagem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={getInputClassName('title')}
                    placeholder="Ex: Reflexão sobre o Amor de Deus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    rows={12}
                    className={getInputClassName('content')}
                    placeholder="Escreva o conteúdo da postagem aqui..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.content.length} caracteres (mínimo 50) - Use formatação em markdown se necessário
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumo/Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Breve resumo da postagem (opcional - será gerado automaticamente se não fornecido)"
                  />
                </div>
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="scheduled">Agendado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="fé, esperança, amor"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Separe as tags por vírgula
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.imageURL}
                    onChange={(e) => handleChange('imageURL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isHighlighted"
                    checked={formData.isHighlighted}
                    onChange={(e) => handleChange('isHighlighted', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isHighlighted" className="ml-2 text-sm text-gray-700">
                    Destacar postagem
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Postagem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal component for editing blog posts
interface EditPostModalProps {
  post: PresentationBlogPost;
  onSave: (formData: Partial<PresentationBlogPost>) => void;
  onCancel: () => void;
  loading: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    category: post.category,
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    status: post.status,
    isHighlighted: post.isHighlighted,
    imageURL: post.imageURL || ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      excerpt: formData.excerpt || formData.content.substring(0, 150) + '...'
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Postagem</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resumo
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Deixe em branco para gerar automaticamente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Devocional">Devocional</option>
                    <option value="Reflexão">Reflexão</option>
                    <option value="Estudo Bíblico">Estudo Bíblico</option>
                    <option value="Testemunho">Testemunho</option>
                    <option value="Notícias">Notícias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="fé, esperança, amor"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separe as tags por vírgula
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={formData.imageURL}
                  onChange={(e) => handleChange('imageURL', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsHighlighted"
                  checked={formData.isHighlighted}
                  onChange={(e) => handleChange('isHighlighted', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="editIsHighlighted" className="ml-2 text-sm text-gray-700">
                  Destacar postagem
                </label>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Atualizando...' : 'Atualizar Postagem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};