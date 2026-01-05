// Presentation Page - EventsPage
// Public page showing church events for both logged and non-logged users

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseEventRepository } from '../../data/repositories/FirebaseEventRepository';
import { Event, EventStatus, EventConfirmation, ConfirmationStatus } from '../../domain/entities/Event';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SocialShareButtons from '../components/SocialShareButtons';
import { AnonymousRegistrationModal, AnonymousRegistration } from '../components/AnonymousRegistrationModal';

export const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [confirmingEvent, setConfirmingEvent] = useState<string | null>(null);
  const [userConfirmations, setUserConfirmations] = useState<Map<string, EventConfirmation>>(new Map());
  const [showNotification, setShowNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);

  const eventRepository = useMemo(() => new FirebaseEventRepository(), []);

  // Load events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        // Load only public events for non-logged users, all events for logged users
        const allEvents = await eventRepository.findAll();
        const publicEvents = allEvents.filter(event => event.isPublic || currentUser);
        setEvents(publicEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [eventRepository, currentUser]);

  // Load user confirmations when user is authenticated
  useEffect(() => {
    const loadUserConfirmations = async () => {
      if (!currentUser) {
        setUserConfirmations(new Map());
        return;
      }

      try {
        const confirmations = await eventRepository.findUserConfirmations(currentUser.id);
        const confirmationsMap = new Map<string, EventConfirmation>();
        confirmations.forEach(confirmation => {
          confirmationsMap.set(confirmation.eventId, confirmation);
        });
        setUserConfirmations(confirmationsMap);
      } catch (error) {
        console.error('Error loading user confirmations:', error);
        // Don't show error to user for missing confirmations - it's expected for new users
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('insufficient permissions')) {
          showNotificationMessage('error', 'Erro ao carregar suas confirmações.');
        }
      }
    };

    loadUserConfirmations();
  }, [eventRepository, currentUser]);

  const categories = ['all', 'Culto', 'Estudo Bíblico', 'Juventude', 'Conferência', 'Ação Social'];

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category.name === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return 'Rascunho';
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const showNotificationMessage = (type: 'success' | 'error', message: string) => {
    setShowNotification({ type, message });
    setTimeout(() => setShowNotification(null), 5000); // Auto-hide after 5 seconds
  };

  const handleConfirmPresence = async (eventId: string) => {
    if (!currentUser) {
      // Show anonymous registration modal for public events that allow anonymous registration
      const event = events.find(e => e.id === eventId);
      if (event && event.isPublic && event.requiresConfirmation && event.allowAnonymousRegistration) {
        setSelectedEventForRegistration(event);
        setShowAnonymousModal(true);
        return;
      }
      showNotificationMessage('error', 'Você precisa estar logado para confirmar presença.');
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const existingConfirmation = userConfirmations.get(eventId);
    
    setConfirmingEvent(eventId);
    try {
      if (existingConfirmation) {
        // Update existing confirmation
        if (existingConfirmation.status === ConfirmationStatus.Confirmed) {
          // Cancel confirmation
          await eventRepository.updateConfirmation(existingConfirmation.id, ConfirmationStatus.Declined);
          setUserConfirmations(prev => {
            const newMap = new Map(prev);
            newMap.set(eventId, { ...existingConfirmation, status: ConfirmationStatus.Declined });
            return newMap;
          });
          showNotificationMessage('success', 'Confirmação cancelada com sucesso!');
        } else {
          // Confirm again
          await eventRepository.updateConfirmation(existingConfirmation.id, ConfirmationStatus.Confirmed);
          setUserConfirmations(prev => {
            const newMap = new Map(prev);
            newMap.set(eventId, { ...existingConfirmation, status: ConfirmationStatus.Confirmed });
            return newMap;
          });
          showNotificationMessage('success', 'Presença confirmada com sucesso!');
        }
      } else {
        // Create new confirmation
        const newConfirmation = await eventRepository.confirmAttendance({
          eventId,
          userId: currentUser.id,
          userName: currentUser.displayName || currentUser.email,
          status: ConfirmationStatus.Confirmed,
          notes: ''
        });
        
        setUserConfirmations(prev => {
          const newMap = new Map(prev);
          newMap.set(eventId, newConfirmation);
          return newMap;
        });
        showNotificationMessage('success', 'Presença confirmada com sucesso!');
      }
    } catch (error) {
      console.error('Error handling confirmation:', error);
      showNotificationMessage('error', 'Erro ao processar confirmação. Tente novamente.');
    } finally {
      setConfirmingEvent(null);
    }
  };

  const getUserConfirmationStatus = (eventId: string): 'confirmed' | 'declined' | 'none' => {
    const confirmation = userConfirmations.get(eventId);
    if (!confirmation) return 'none';
    return confirmation.status === ConfirmationStatus.Confirmed ? 'confirmed' : 
           confirmation.status === ConfirmationStatus.Declined ? 'declined' : 'none';
  };

  const getConfirmationButtonText = (eventId: string): string => {
    if (confirmingEvent === eventId) return 'Processando...';
    
    if (!currentUser) {
      return 'Inscrever-se';
    }
    
    const status = getUserConfirmationStatus(eventId);
    switch (status) {
      case 'confirmed': return 'Cancelar Confirmação';
      case 'declined': return 'Confirmar Presença';
      default: return 'Confirmar Presença';
    }
  };

  const getConfirmationButtonStyle = (eventId: string): string => {
    const baseStyle = "py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (!currentUser) {
      return `${baseStyle} bg-indigo-600 text-white hover:bg-indigo-700`;
    }
    
    const status = getUserConfirmationStatus(eventId);
    switch (status) {
      case 'confirmed': return `${baseStyle} bg-red-600 text-white hover:bg-red-700`;
      case 'declined': return `${baseStyle} bg-green-600 text-white hover:bg-green-700`;
      default: return `${baseStyle} bg-green-600 text-white hover:bg-green-700`;
    }
  };

  const handleAnonymousRegistration = async (registrationData: AnonymousRegistration) => {
    try {
      await eventRepository.createAnonymousRegistration(registrationData);
      showNotificationMessage('success', 'Inscrição realizada com sucesso! Entraremos em contato em breve.');
      setShowAnonymousModal(false);
      setSelectedEventForRegistration(null);
    } catch (error) {
      console.error('Error with anonymous registration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotificationMessage('error', errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          showNotification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {showNotification.type === 'success' ? '✅' : '❌'}
            </span>
            {showNotification.message}
            <button 
              onClick={() => setShowNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Acompanhe os próximos eventos e participe da nossa comunidade
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar eventos..."
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
            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <article key={event.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {event.imageURL && (
                    <img
                      src={event.imageURL}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  {!event.imageURL && (
                    <div className="w-full h-48 rounded-t-lg theme-gradient"></div>
                  )}

              {/* Event Content */}
              <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="text-indigo-600 font-medium">{event.category.name}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                    {currentUser && event.requiresConfirmation && getUserConfirmationStatus(event.id) === 'confirmed' && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 text-xs font-medium">✓ Confirmado</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                  {/* Event Details */}
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      {format(event.date, "dd/MM/yyyy")}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">🕒</span>
                      {format(event.date, 'HH:mm')}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </div>
                    {event.maxParticipants && (
                      <div className="flex items-center">
                        <span className="mr-2">👥</span>
                        {event.maxParticipants} vagas
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <button 
                      onClick={() => handleViewDetails(event)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Ver detalhes →
                    </button>
                    {event.requiresConfirmation && (currentUser || (event.isPublic && event.allowAnonymousRegistration)) && (
                      <button 
                        onClick={() => handleConfirmPresence(event.id)}
                        disabled={confirmingEvent === event.id}
                        className={`text-sm px-3 py-1 rounded transition-colors ${getConfirmationButtonStyle(event.id)}`}
                      >
                        {getConfirmationButtonText(event.id)}
                      </button>
                    )}
                  </div>

                  <SocialShareButtons
                    url={`${window.location.origin}/events/${event.id}`}
                    title={event.title}
                    description={event.description}
                    hashtags={['igreja', 'evento', event.category.name.toLowerCase()]}
                    imageUrl={event.imageURL}
                    className="border-t pt-4"
                    showText={false}
                  />
                </div>
                </article>
              ))}
            </div>

            {/* Empty State - No Events */}
            {!loading && filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Tente ajustar os filtros ou fazer uma nova busca.'
                    : 'Não há eventos disponíveis no momento. Volte em breve para mais eventos.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Event Image */}
              {selectedEvent.imageURL && (
                <div className="mb-6">
                  <img 
                    src={selectedEvent.imageURL} 
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Data e Hora</h4>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📅</span>
                      {format(selectedEvent.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Local</h4>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📍</span>
                      {selectedEvent.location}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Categoria</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                      {selectedEvent.category.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedEvent.maxParticipants && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Vagas</h4>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">👥</span>
                        {selectedEvent.maxParticipants} participantes
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Responsável</h4>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">👤</span>
                      {selectedEvent.responsible}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                      {getStatusText(selectedEvent.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Streaming Link */}
              {selectedEvent.streamingURL && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Transmissão Online</h4>
                  <a 
                    href={selectedEvent.streamingURL}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <span className="mr-2">📺</span>
                    Assistir Transmissão
                  </a>
                </div>
              )}

              {/* Social Share Buttons in Modal */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Compartilhar Evento</h4>
                <SocialShareButtons
                  url={`${window.location.origin}/events/${selectedEvent.id}`}
                  title={selectedEvent.title}
                  description={selectedEvent.description}
                  hashtags={['igreja', 'evento', selectedEvent.category.name.toLowerCase()]}
                  imageUrl={selectedEvent.imageURL}
                  showText={true}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Registration Modal */}
      {showAnonymousModal && selectedEventForRegistration && (
        <AnonymousRegistrationModal
          isOpen={showAnonymousModal}
          onClose={() => {
            setShowAnonymousModal(false);
            setSelectedEventForRegistration(null);
          }}
          event={selectedEventForRegistration}
          onRegister={handleAnonymousRegistration}
        />
      )}
    </div>
  );
};