// Presentation Page - Admin Live Management
// Administrative interface for managing live streams and transmissions

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { format } from 'date-fns';
import { FirebaseLiveStreamRepository } from '@modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository';
import { LiveStream as DomainLiveStream, StreamCategory, StreamStatus } from '@modules/content-management/live-streaming/domain/entities/LiveStream';
import { db, storage } from '@/config/firebase';
import { onSnapshot, collection } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

// Optimized image component without flickering
const ThumbnailWithOverlay: React.FC<{
  src: string | undefined;
  alt: string;
  className: string;
  fallback: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ src, alt, className, fallback, overlay }) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [loadedSrc, setLoadedSrc] = useState<string>('');

  useEffect(() => {
    // If no src, immediately show fallback
    if (!src || src.trim() === '') {
      setImageState('error');
      return;
    }

    // If src is the same as already loaded, don't reload
    if (src === loadedSrc && imageState === 'loaded') {
      return;
    }

    // Only set loading if we're changing src
    if (src !== loadedSrc) {
      setImageState('loading');
    }

    // Pre-load image to test if it exists
    const img = new Image();
    
    const handleLoad = () => {
      setImageState('loaded');
      setLoadedSrc(src);
    };
    
    const handleError = () => {
      setImageState('error');
      setLoadedSrc('');
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (imageState === 'loading') {
        handleError();
      }
    }, 3000);

    img.src = src;

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, loadedSrc, imageState]);

  // Always show fallback when there's no src or error
  if (!src || imageState === 'error') {
    return <div className="w-full h-full">{fallback}</div>;
  }

  // Show loading state only on first load
  if (imageState === 'loading' && !loadedSrc) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  // Show image (either loaded or loading but keep previous if exists)
  return (
    <div className="relative w-full h-full">
      <img
        src={loadedSrc || src}
        alt={alt}
        className={className}
        onError={() => setImageState('error')}
        style={{ 
          opacity: imageState === 'loaded' ? 1 : 0.7,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
      {imageState === 'loaded' && overlay}
    </div>
  );
};

// Presentation interface that maps to domain entities
interface PresentationLiveStream {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  thumbnailUrl?: string;
  isLive: boolean;
  scheduledDate: Date;
  duration?: number;
  viewCount: number;
  category: 'culto' | 'estudo' | 'reuniao' | 'evento';
  createdAt: Date;
  createdBy: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}

// Helper functions to map between domain and presentation layers
const mapDomainToPresentation = (domainStream: DomainLiveStream): PresentationLiveStream => {
  return {
    id: domainStream.id,
    title: domainStream.title,
    description: domainStream.description,
    streamUrl: domainStream.streamUrl,
    thumbnailUrl: domainStream.thumbnailUrl,
    isLive: domainStream.isLive,
    scheduledDate: domainStream.scheduledDate,
    duration: domainStream.duration,
    viewCount: domainStream.viewCount,
    category: domainStream.category as PresentationLiveStream['category'],
    createdAt: domainStream.createdAt,
    createdBy: domainStream.createdBy,
    status: domainStream.status as PresentationLiveStream['status']
  };
};

const mapPresentationToDomain = (presentationStream: Partial<PresentationLiveStream>): Partial<DomainLiveStream> => {
  return {
    ...presentationStream,
    category: presentationStream.category as StreamCategory,
    status: presentationStream.status as StreamStatus,
    updatedAt: new Date()
  };
};

export const AdminLiveManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifyNewLiveStream } = useNotificationActions();
  const [streams, setStreams] = useState<PresentationLiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  
  const streamRepository = useMemo(() => new FirebaseLiveStreamRepository(), []);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStream, setEditingStream] = useState<PresentationLiveStream | null>(null);
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [totalViewerCounts, setTotalViewerCounts] = useState<Record<string, number>>({});

  // Load streams from Firebase on component mount
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoading(true);
        const domainStreams = await streamRepository.findAll();
        
        // Convert domain streams to presentation interface
        const presentationStreams: PresentationLiveStream[] = domainStreams.map(mapDomainToPresentation);
        
        setStreams(presentationStreams);
      } catch (error) {
        console.error('AdminLiveManagementPage: Error loading streams:', error);
        // Keep empty array on error rather than falling back to mock data
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, [streamRepository]);

  // Listen to viewer count changes for all streams
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Listen to all streams to get total viewer counts for all streams
    streams.forEach(stream => {
      // Listen to current viewers (live count) only for live streams
      if (stream.isLive || stream.status === 'live') {
        const viewersCollectionRef = collection(db, 'streamViewers', stream.id, 'viewers');
        const viewersUnsubscribe = onSnapshot(viewersCollectionRef, (snapshot) => {
          const activeViewers = snapshot.docs.length;
          setViewerCounts(prev => ({
            ...prev,
            [stream.id]: activeViewers
          }));
        }, (error) => {
          console.error('Error listening to viewer count:', error);
        });
        
        unsubscribes.push(viewersUnsubscribe);
      }

      // Listen to total viewers (historical count) for ALL streams
      const totalViewersCollectionRef = collection(db, 'streamViewers', stream.id, 'totalViewers');
      const totalViewersUnsubscribe = onSnapshot(totalViewersCollectionRef, (snapshot) => {
        const totalViewers = snapshot.docs.length;
        setTotalViewerCounts(prev => ({
          ...prev,
          [stream.id]: totalViewers
        }));
      }, (error) => {
        console.error('Error listening to total viewer count:', error);
      });
      
      unsubscribes.push(totalViewersUnsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [streams]);

  const statuses = ['all', 'scheduled', 'live', 'ended', 'cancelled'];
  const categories = ['all', 'culto', 'estudo', 'reuniao', 'evento'];

  const filteredStreams = streams.filter(stream => {
    const matchesStatus = selectedStatus === 'all' || stream.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory;
    const matchesSearch = stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Ao Vivo';
      case 'scheduled': return 'Agendado';
      case 'ended': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'culto': return 'Culto';
      case 'estudo': return 'Estudo';
      case 'reuniao': return 'Reunião';
      case 'evento': return 'Evento';
      default: return category;
    }
  };

  const handleStatusChange = async (streamId: string, newStatus: string) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${getStatusText(newStatus)}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // Update status via repository
      await streamRepository.updateStatus(streamId, newStatus as StreamStatus);
      
      // Update local state
      setStreams(prevStreams =>
        prevStreams.map(stream =>
          stream.id === streamId 
            ? { ...stream, status: newStatus as PresentationLiveStream['status'], isLive: newStatus === 'live' }
            : stream
        )
      );
      
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating stream status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transmissão?')) {
      return;
    }

    setLoading(true);
    const stream = streams.find(s => s.id === streamId);
    try {
      // Delete via repository
      await streamRepository.delete(streamId);
      
      // Update local state
      setStreams(prevStreams => prevStreams.filter(stream => stream.id !== streamId));
      
      await loggingService.logDatabase('info', 'Live stream deleted successfully', 
        `Stream: "${stream?.title}", ID: ${streamId}`, currentUser);
      
      alert('Transmissão excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting stream:', error);
      await loggingService.logDatabase('error', 'Failed to delete live stream', 
        `Stream: "${stream?.title}", ID: ${streamId}, Error: ${error}`, currentUser);
      alert('Erro ao excluir transmissão.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStream = (stream: PresentationLiveStream) => {
    setEditingStream(stream);
  };

  const handleCreateStream = () => {
    setShowCreateModal(true);
  };


  const handleSaveStream = async (formData: Partial<PresentationLiveStream>) => {
    setLoading(true);
    // Check if this is an update (has ID) or a new creation
    const isUpdate = !!formData.id;

    try {

      if (isUpdate) {
        // UPDATE EXISTING STREAM
        const updateData: Partial<DomainLiveStream> = {
          title: formData.title,
          description: formData.description,
          streamUrl: formData.streamUrl,
          thumbnailUrl: formData.thumbnailUrl,
          scheduledDate: formData.scheduledDate,
          category: formData.category as any,
          status: formData.status as any,
          isLive: formData.isLive
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        // Update via repository
        await streamRepository.update(formData.id!, updateData);

        await loggingService.logDatabase('info', 'Live stream updated successfully',
          `Stream: "${formData.title}", ID: ${formData.id}`, currentUser);

        // Update state
        setStreams(prevStreams =>
          prevStreams.map(s =>
            s.id === formData.id ? { ...s, ...formData } : s
          )
        );

        setEditingStream(null);
        alert('Transmissão atualizada com sucesso!');
      } else {
        // CREATE NEW STREAM
        const presentationData: Partial<PresentationLiveStream> = {
          title: formData.title || '',
          description: formData.description || '',
          streamUrl: formData.streamUrl || '',
          thumbnailUrl: formData.thumbnailUrl || undefined,
          isLive: false,
          scheduledDate: formData.scheduledDate || new Date(),
          viewCount: 0,
          category: (formData.category as PresentationLiveStream['category']) || 'culto',
          createdBy: currentUser?.displayName || currentUser?.email || 'Admin',
          status: 'scheduled' as const
        };

        const domainData = mapPresentationToDomain(presentationData);

        // Create stream via repository
        const createdStream = await streamRepository.create(domainData as Omit<DomainLiveStream, 'id' | 'createdAt' | 'updatedAt'>);

        await loggingService.logDatabase('info', 'Live stream created successfully',
          `Stream: "${createdStream.title}", Status: ${createdStream.status}`, currentUser);

        // Send notification if stream is live or scheduled (public streams)
        if (createdStream.status === StreamStatus.Live || createdStream.status === StreamStatus.Scheduled) {
          try {
            const notificationCount = await notifyNewLiveStream(
              createdStream.id,
              createdStream.title,
              createdStream.thumbnailUrl
            );
            await loggingService.logApi('info', 'Live stream notification sent',
              `Stream: "${createdStream.title}", Recipients: ${notificationCount}`, currentUser);
          } catch (error) {
            console.warn('Failed to send live stream notification:', error);
            await loggingService.logApi('error', 'Failed to send live stream notification',
              `Stream: "${createdStream.title}", Error: ${error}`, currentUser);
          }
        }

        // Convert back to presentation and update state
        const presentationStream = mapDomainToPresentation(createdStream);
        setStreams(prevStreams => [presentationStream, ...prevStreams]);
        setShowCreateModal(false);
        alert('Transmissão criada com sucesso!');
      }
    } catch (error) {
      console.error('Error saving stream:', error);
      alert(isUpdate ? 'Erro ao atualizar transmissão.' : 'Erro ao criar transmissão.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Transmissões</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre transmissões ao vivo e gravações
              </p>
            </div>
            <button
              onClick={handleCreateStream}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <span className="mr-2">➕</span>
              Nova Transmissão
            </button>
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
                placeholder="Buscar transmissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
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
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">📡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ao Vivo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.status === 'live').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Agendados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Finalizados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.status === 'ended').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Visualizações</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.reduce((sum, s) => {
                    // Use total viewer count (historical) for all streams - this represents actual people who watched
                    const totalCount = totalViewerCounts[s.id] || s.viewCount || 0;
                    return sum + totalCount;
                  }, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Streams Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Transmissões ({filteredStreams.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transmissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audiência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && streams.length === 0 ? (
                  // Loading skeleton
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-16 bg-gray-200 rounded"></div>
                          <div className="ml-4">
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    </tr>
                  ))
                ) : (
                  filteredStreams.map((stream) => (
                  <tr key={stream.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-16 rounded overflow-hidden flex-shrink-0">
                          <ThumbnailWithOverlay
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="h-10 w-16 object-cover rounded"
                            fallback={
                              <div className="h-10 w-16 bg-gradient-to-r from-red-400 to-red-600 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            }
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{stream.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{stream.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={stream.status}
                        onChange={(e) => handleStatusChange(stream.id, e.target.value)}
                        disabled={loading}
                        className={`text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 ${getStatusColor(stream.status)}`}
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
                        {getCategoryLabel(stream.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{format(stream.scheduledDate, "dd/MM/yyyy")}</div>
                      <div>{format(stream.scheduledDate, "HH:mm")}</div>
                      {stream.duration && (
                        <div className="text-xs text-gray-400">
                          Duração: {formatDuration(stream.duration)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(stream.isLive || stream.status === 'live') ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                            <span className="font-medium text-red-600">
                              {(viewerCounts[stream.id] || 0).toLocaleString()} ao vivo
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {(totalViewerCounts[stream.id] || 0).toLocaleString()} assistiram
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">
                            {stream.viewCount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            total de views
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stream.createdBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditStream(stream)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteStream(stream.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredStreams.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {streams.length === 0 ? 'Nenhuma transmissão cadastrada' : 'Nenhuma transmissão encontrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {streams.length === 0
                  ? 'Comece criando sua primeira transmissão ao vivo'
                  : 'Tente ajustar os filtros ou fazer uma nova busca.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <CreateStreamModal
          onSave={handleSaveStream}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Edit Stream Modal */}
      {editingStream && (
        <EditStreamModal
          stream={editingStream}
          onSave={handleSaveStream}
          onCancel={() => setEditingStream(null)}
          loading={loading}
        />
      )}
    </div>
  );
};

// Modal component for creating new streams
interface CreateStreamModalProps {
  onSave: (formData: Partial<PresentationLiveStream>) => void;
  onCancel: () => void;
  loading: boolean;
}

const CreateStreamModal: React.FC<CreateStreamModalProps> = ({ onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    streamUrl: '',
    category: 'culto' as PresentationLiveStream['category'],
    scheduledDate: new Date().toISOString().slice(0, 16),
    thumbnailUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAndProcessFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return false;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndProcessFile(file);
    }
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      const timestamp = Date.now();
      // Sanitize filename - remove special chars and keep extension
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `streams/thumbnails/${timestamp}_${sanitizedName}`;

      const storageRef = ref(storage, filename);

      // Upload without metadata first (test)
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitWithUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Por favor, insira o título da transmissão.');
      return;
    }
    
    if (!formData.streamUrl.trim()) {
      alert('Por favor, insira a URL da transmissão.');
      return;
    }

    // Upload thumbnail if selected
    let thumbnailUrl = formData.thumbnailUrl;
    if (selectedFile) {
      const uploadedUrl = await uploadThumbnail();
      if (!uploadedUrl) return; // Upload failed
      thumbnailUrl = uploadedUrl;
    }

    onSave({
      ...formData,
      thumbnailUrl,
      scheduledDate: new Date(formData.scheduledDate)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Nova Transmissão
          </h3>
          
          <form onSubmit={handleSubmitWithUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Transmissão *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Ex: Culto Dominical - Domingo Abençoado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Descrição da transmissão..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem de Banner/Thumbnail
              </label>
              
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div 
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                >
                  <svg
                    className="h-16 w-16 text-gray-400 mb-4"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-lg text-gray-600 font-medium mb-2">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-sm text-gray-500">
                    ou arraste e solte aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    PNG, JPG, GIF até 5MB
                  </p>
                  
                  <input
                    id="thumbnail-upload"
                    name="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Transmissão *
              </label>
              <input
                type="url"
                value={formData.streamUrl}
                onChange={(e) => handleChange('streamUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                URL do YouTube, Facebook Live ou outra plataforma de streaming
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="culto">Culto</option>
                  <option value="estudo">Estudo Bíblico</option>
                  <option value="reuniao">Reunião</option>
                  <option value="evento">Evento Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Hora Agendada
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
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
                disabled={loading || uploading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Fazendo upload...' : loading ? 'Criando...' : 'Criar Transmissão'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal component for editing streams
interface EditStreamModalProps {
  stream: PresentationLiveStream;
  onSave: (formData: Partial<PresentationLiveStream>) => void;
  onCancel: () => void;
  loading: boolean;
}

const EditStreamModal: React.FC<EditStreamModalProps> = ({ stream, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    id: stream.id,
    title: stream.title,
    description: stream.description,
    streamUrl: stream.streamUrl,
    category: stream.category,
    scheduledDate: stream.scheduledDate ? new Date(stream.scheduledDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    thumbnailUrl: stream.thumbnailUrl,
    isLive: stream.isLive,
    status: stream.status
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(stream.thumbnailUrl || null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF)');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateAndProcessFile(file)) {
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    try {
      const timestamp = Date.now();
      // Sanitize filename - remove special chars and keep extension
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `streams/thumbnails/${timestamp}_${sanitizedName}`;

      const storageRef = ref(storage, filename);

      // Upload with resumable upload (better for handling errors and retries)
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          uploadType: 'stream-thumbnail'
        }
      });

      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          () => {
            console.log('Upload completed successfully');
            resolve();
          }
        );
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);

      let errorMessage = 'Falha ao fazer upload da imagem. ';

      if (error.code === 'storage/unauthorized') {
        errorMessage += 'Você não tem permissão para fazer upload.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage += 'Limite de armazenamento excedido.';
      } else if (error.code === 'storage/unauthenticated') {
        errorMessage += 'Erro de autenticação. Faça login novamente.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage += 'Muitas tentativas. Verifique sua conexão.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload cancelado.';
      } else if (error.code === 'storage/unknown' || error.code === 412) {
        errorMessage += 'Erro no servidor de armazenamento (CORS). Aguarde um momento e tente novamente.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Tente novamente.';
      }

      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.streamUrl) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      let thumbnailUrl = formData.thumbnailUrl;

      if (selectedFile) {
        setUploading(true);
        thumbnailUrl = await uploadThumbnail(selectedFile);
      }

      const saveData = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        streamUrl: formData.streamUrl,
        category: formData.category,
        scheduledDate: new Date(formData.scheduledDate),
        thumbnailUrl,
        isLive: formData.isLive,
        status: formData.status
      };

      onSave(saveData);
    } catch (error) {
      console.error('Error saving stream:', error);
      alert('Erro ao salvar transmissão. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Transmissão</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Transmissão *
              </label>
              <input
                type="url"
                value={formData.streamUrl}
                onChange={(e) => handleChange('streamUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                YouTube, Vimeo ou URL de vídeo direto
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="culto">Culto</option>
                  <option value="estudo">Estudo Bíblico</option>
                  <option value="evento">Evento Especial</option>
                  <option value="louvor">Louvor</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data/Hora Agendada
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="live">Ao Vivo</option>
                  <option value="ended">Finalizado</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLive}
                    onChange={(e) => handleChange('isLive', e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Marcar como Ao Vivo
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail
              </label>
              <div className="flex items-start space-x-4">
                {previewUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
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
                disabled={loading || uploading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Fazendo upload...' : loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AdminLiveManagementPage;
