// Presentation Page - Live Streaming
// Live streaming and recorded services page with real Firebase data

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseLiveStreamRepository } from '@modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository';
import { LiveStream, StreamCategory, StreamStatus } from '@modules/content-management/live-streaming/domain/entities/LiveStream';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/config/firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import SocialShareButtons from '../components/SocialShareButtons';

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
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

// Presentation interface for LiveStream
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
  category: string;
  status: string;
  createdAt: Date;
}

// Helper functions to map between domain and presentation
const mapDomainToPresentation = (stream: LiveStream): PresentationLiveStream => ({
  id: stream.id,
  title: stream.title,
  description: stream.description,
  streamUrl: stream.streamUrl,
  thumbnailUrl: stream.thumbnailUrl,
  isLive: stream.isLive,
  scheduledDate: stream.scheduledDate,
  duration: stream.duration,
  viewCount: stream.viewCount,
  category: stream.category,
  status: stream.status,
  createdAt: stream.createdAt
});

export const LivePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [streams, setStreams] = useState<PresentationLiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [totalViewerCounts, setTotalViewerCounts] = useState<Record<string, number>>({});
  const [watchingStreams, setWatchingStreams] = useState<Set<string>>(new Set());

  const streamRepository = useMemo(() => new FirebaseLiveStreamRepository(), []);

  // Load streams from Firebase
  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoading(true);
        const domainStreams = await streamRepository.findAll();
        const presentationStreams = domainStreams.map(mapDomainToPresentation);
        setStreams(presentationStreams);
      } catch (error) {
        console.error('Error loading streams:', error);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, [streamRepository]);

  // Update live stream data every 30 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const hasLiveStreams = streams.some(stream => stream.isLive || stream.status === 'live');
    
    if (hasLiveStreams) {
      interval = setInterval(async () => {
        try {
          // Only update live streams to avoid unnecessary requests
          const allStreams = await streamRepository.findAll();
          const liveStreams = allStreams.filter(stream => stream.isLive || stream.status === 'live');
          
          if (liveStreams.length > 0) {
            setStreams(prevStreams => {
              return prevStreams.map(prevStream => {
                const updatedStream = liveStreams.find(live => live.id === prevStream.id);
                if (updatedStream) {
                  return mapDomainToPresentation(updatedStream);
                }
                return prevStream;
              });
            });
            setLastUpdate(new Date());
          }
        } catch (error) {
          console.error('Error updating live streams:', error);
        }
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [streams, streamRepository]);

  // Listen to viewer count changes for all streams (live and recorded)
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Listen to all streams to get total viewer counts for recorded streams too
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

      // Listen to total viewers (historical count) for all streams
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

  // Auto join ALL live streams when user is logged in and page loads
  useEffect(() => {
    if (!currentUser) return;

    const liveStreams = streams.filter(stream => stream.isLive || stream.status === 'live');
    
    liveStreams.forEach(stream => {
      // Auto join ALL live streams when user visits the page
      if (!watchingStreams.has(stream.id)) {
        joinStream(stream.id);
      }
    });
  }, [currentUser, streams]);

  // Auto leave streams when user leaves the page (visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - user left
        Array.from(watchingStreams).forEach(streamId => {
          leaveStream(streamId);
        });
      } else {
        // Page is visible - user returned, rejoin live streams
        if (currentUser) {
          const liveStreams = streams.filter(stream => stream.isLive || stream.status === 'live');
          liveStreams.forEach(stream => {
            if (!watchingStreams.has(stream.id)) {
              joinStream(stream.id);
            }
          });
        }
      }
    };

    // Also track user activity to detect if they're actually watching
    let activityTimer: NodeJS.Timeout;
    
    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        // User has been inactive for 5 minutes, remove from live count but keep in total
        if (!document.hidden) {
          Array.from(watchingStreams).forEach(streamId => {
            leaveStream(streamId);
          });
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    const handleActivity = () => {
      // User is active, make sure they're counted if there are live streams
      if (currentUser && !document.hidden) {
        const liveStreams = streams.filter(stream => stream.isLive || stream.status === 'live');
        liveStreams.forEach(stream => {
          if (!watchingStreams.has(stream.id)) {
            joinStream(stream.id);
          }
        });
      }
      resetActivityTimer();
    };

    // Reset timer on user activity
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start the timer
    resetActivityTimer();

    return () => {
      clearTimeout(activityTimer);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, streams, watchingStreams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Leave all streams when component unmounts
      Array.from(watchingStreams).forEach(streamId => {
        leaveStream(streamId);
      });
    };
  }, []);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'culto', label: 'Cultos' },
    { value: 'estudo', label: 'Estudos' },
    { value: 'reuniao', label: 'Reuniões' },
    { value: 'evento', label: 'Eventos' }
  ];

  const filteredStreams = streams.filter(stream => {
    const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory;
    const matchesLive = !showLiveOnly || stream.isLive;
    return matchesCategory && matchesLive;
  });

  const liveStream = filteredStreams.find(stream => stream.isLive || stream.status === 'live');
  const upcomingStreams = filteredStreams.filter(stream => stream.status === 'scheduled');
  const recordedStreams = filteredStreams.filter(stream => stream.status === 'ended');


  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'culto': return '🙏';
      case 'estudo': return '📖';
      case 'reuniao': return '👥';
      case 'evento': return '🎉';
      default: return '📺';
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getEmbedUrl = (streamUrl: string) => {
    // YouTube
    const youtubeMatch = streamUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=0`;
    }

    // Vimeo
    const vimeoMatch = streamUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // For other URLs, try to use them directly
    return streamUrl;
  };

  const isEmbeddable = (streamUrl: string) => {
    return streamUrl.includes('youtube.com') || 
           streamUrl.includes('youtu.be') || 
           streamUrl.includes('vimeo.com') ||
           streamUrl.includes('twitch.tv');
  };

  // Join a stream as a viewer
  const joinStream = async (streamId: string) => {
    if (!currentUser || watchingStreams.has(streamId)) return;

    try {
      // Add to current viewers (for live count)
      const viewerDoc = doc(db, 'streamViewers', streamId, 'viewers', currentUser.id);
      await setDoc(viewerDoc, {
        userId: currentUser.id,
        displayName: currentUser.displayName || currentUser.email,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      });

      // Add to total viewers history (for "assistiram" count)
      const totalViewerDoc = doc(db, 'streamViewers', streamId, 'totalViewers', currentUser.id);
      await setDoc(totalViewerDoc, {
        userId: currentUser.id,
        displayName: currentUser.displayName || currentUser.email,
        firstWatchedAt: serverTimestamp(),
        lastWatchedAt: serverTimestamp()
      });

      setWatchingStreams(prev => {
        const newSet = new Set(prev);
        newSet.add(streamId);
        return newSet;
      });
      
      // Set up heartbeat to update lastSeen every 30 seconds
      const heartbeatInterval = setInterval(async () => {
        try {
          // Update current viewers
          await setDoc(viewerDoc, {
            userId: currentUser.id,
            displayName: currentUser.displayName || currentUser.email,
            joinedAt: serverTimestamp(),
            lastSeen: serverTimestamp()
          });

          // Update total viewers with latest activity
          await setDoc(totalViewerDoc, {
            userId: currentUser.id,
            displayName: currentUser.displayName || currentUser.email,
            firstWatchedAt: serverTimestamp(), // This will be ignored if document exists
            lastWatchedAt: serverTimestamp()
          }, { merge: true }); // Use merge to keep firstWatchedAt
        } catch (error) {
          console.error('Error updating heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Store interval reference to clear it later
      (window as any)[`heartbeat_${streamId}`] = heartbeatInterval;
    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };

  // Leave a stream
  const leaveStream = async (streamId: string) => {
    if (!currentUser || !watchingStreams.has(streamId)) return;

    try {
      const viewerDoc = doc(db, 'streamViewers', streamId, 'viewers', currentUser.id);
      await deleteDoc(viewerDoc);

      setWatchingStreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(streamId);
        return newSet;
      });

      // Clear heartbeat interval
      const heartbeatInterval = (window as any)[`heartbeat_${streamId}`];
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        delete (window as any)[`heartbeat_${streamId}`];
      }
    } catch (error) {
      console.error('Error leaving stream:', error);
    }
  };

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
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📺</span>
                Transmissões
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Assista aos cultos ao vivo e acesse as gravações
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading State */}
        {loading ? (
          <div className="space-y-8">
            {/* Live stream skeleton */}
            <div className="animate-pulse">
              <div className="flex items-center mb-6">
                <div className="h-6 bg-gray-200 rounded-full w-20 mr-4"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Live Stream Section */}
            {liveStream && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                AO VIVO
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">Transmissão Atual</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-black relative">
                {isEmbeddable(liveStream.streamUrl) ? (
                  <iframe
                    src={getEmbedUrl(liveStream.streamUrl)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={liveStream.title}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer relative"
                    onClick={() => window.open(liveStream.streamUrl, '_blank')}
                  >
                    <ThumbnailWithOverlay
                      src={liveStream.thumbnailUrl}
                      alt={liveStream.title}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="text-center text-white">
                          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-lg font-medium">Transmissão Ao Vivo</p>
                          <p className="text-sm opacity-75">Clique para assistir</p>
                        </div>
                      }
                      overlay={
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-16 h-16 mx-auto mb-2 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <p className="text-lg font-medium">Clique para assistir</p>
                          </div>
                        </div>
                      }
                    />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm space-y-1">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                      <span className="font-medium">{viewerCounts[liveStream.id] || 0} ao vivo</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {(totalViewerCounts[liveStream.id] || 0).toLocaleString()} assistiram
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getCategoryIcon(liveStream.category)}</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {getCategoryLabel(liveStream.category)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {liveStream.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {liveStream.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Iniciado às {format(liveStream.scheduledDate, 'HH:mm')}
                  </span>
                  {!isEmbeddable(liveStream.streamUrl) && (
                    <button 
                      onClick={() => window.open(liveStream.streamUrl, '_blank')}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Assistir Agora
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLiveOnly}
                onChange={(e) => setShowLiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Apenas ao vivo</span>
            </label>
          </div>
        </div>

        {/* Upcoming Streams */}
        {upcomingStreams.length > 0 && !showLiveOnly && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximas Transmissões</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingStreams.map(stream => (
                <div key={stream.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="aspect-video rounded-t-lg relative overflow-hidden">
                    <ThumbnailWithOverlay
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-12 h-12 mx-auto mb-2 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">Agendado</p>
                          </div>
                        </div>
                      }
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className="text-2xl">{getCategoryIcon(stream.category)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-sm font-medium text-indigo-600 mb-1">
                      {getCategoryLabel(stream.category)}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {stream.description}
                    </p>
                    <div className="text-sm text-gray-500 mb-4">
                      📅 {format(stream.scheduledDate, "dd/MM 'às' HH:mm")}
                    </div>
                    
                    {/* Social Share Buttons */}
                    <SocialShareButtons
                      url={`${window.location.origin}/live/${stream.id}`}
                      title={stream.title}
                      description={stream.description}
                      hashtags={['igreja', 'transmissao', 'ao-vivo', getCategoryLabel(stream.category).toLowerCase()]}
                      imageUrl={stream.thumbnailUrl}
                      className="border-t pt-4"
                      showText={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Recorded Streams */}
        {recordedStreams.length > 0 && !showLiveOnly && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gravações Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordedStreams.map(stream => (
                <div key={stream.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="aspect-video rounded-t-lg relative overflow-hidden">
                    <ThumbnailWithOverlay
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="bg-gradient-to-r from-gray-400 to-gray-600 h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-16 h-16 mx-auto mb-2 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">Gravação</p>
                          </div>
                        </div>
                      }
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className="text-2xl">{getCategoryIcon(stream.category)}</span>
                    </div>
                    {stream.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs z-10">
                        {formatDuration(stream.duration)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center z-10">
                      <button 
                        onClick={() => window.open(stream.streamUrl, '_blank')}
                        className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-4 transition-all hover:scale-110"
                      >
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-sm font-medium text-indigo-600 mb-1">
                      {getCategoryLabel(stream.category)}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {stream.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>{format(stream.scheduledDate, "dd/MM")}</span>
                      <span>{(totalViewerCounts[stream.id] || stream.viewCount || 0).toLocaleString()} visualizações</span>
                    </div>
                    
                    {/* Social Share Buttons */}
                    <SocialShareButtons
                      url={`${window.location.origin}/live/${stream.id}`}
                      title={stream.title}
                      description={stream.description}
                      hashtags={['igreja', 'transmissao', 'gravacao', getCategoryLabel(stream.category).toLowerCase()]}
                      imageUrl={stream.thumbnailUrl}
                      className="border-t pt-4"
                      showText={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && streams.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma transmissão disponível</h3>
            <p className="text-gray-600">
              Não há transmissões programadas ou gravações disponíveis no momento.
            </p>
          </div>
        )}

        {/* No Results State */}
        {!loading && streams.length > 0 && filteredStreams.length === 0 && (
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transmissão encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showLiveOnly 
                ? 'Não há transmissões ao vivo no momento.' 
                : 'Tente ajustar os filtros para ver mais conteúdo.'
              }
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

