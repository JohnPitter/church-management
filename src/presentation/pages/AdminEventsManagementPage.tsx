// Presentation Page - Admin Events Management
// Administrative interface for managing events and confirmations

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { format } from 'date-fns';
import { FirebaseEventRepository } from '../../data/repositories/FirebaseEventRepository';
import { Event as DomainEvent, EventCategory, EventStatus, EventConfirmation, ConfirmationStatus } from '../../domain/entities/Event';
import { loggingService } from '../../infrastructure/services/LoggingService';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: {
    id: string;
    name: string;
    color: string;
    priority?: number;
  };
  isPublic: boolean;
  requiresConfirmation: boolean;
  allowAnonymousRegistration?: boolean;
  maxParticipants?: number;
  currentConfirmations: number;
  imageURL?: string;
  streamingURL?: string;
  responsible: string;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}


const eventRepository = new FirebaseEventRepository();

// Helper function to map presentation status to domain enum
const mapStatusToEnum = (status: string): EventStatus => {
  switch (status) {
    case 'scheduled': return EventStatus.Scheduled;
    case 'in_progress': return EventStatus.InProgress;
    case 'completed': return EventStatus.Completed;
    case 'cancelled': return EventStatus.Cancelled;
    default: return EventStatus.Scheduled;
  }
};

// Helper function to map domain enum to presentation status
const mapEnumToStatus = (status: EventStatus): Event['status'] => {
  switch (status) {
    case EventStatus.Scheduled: return 'scheduled';
    case EventStatus.InProgress: return 'ongoing';
    case EventStatus.Completed: return 'completed';
    case EventStatus.Cancelled: return 'cancelled';
    default: return 'draft';
  }
};

export const AdminEventsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifyNewEvent } = useNotificationActions();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmationsModal, setShowConfirmationsModal] = useState(false);
  const [selectedEventForConfirmations, setSelectedEventForConfirmations] = useState<Event | null>(null);
  const [confirmations, setConfirmations] = useState<EventConfirmation[]>([]);
  const [loadingConfirmations, setLoadingConfirmations] = useState(false);

  const statuses = ['all', 'draft', 'scheduled', 'ongoing', 'completed', 'cancelled'];

  // Load real events from Firebase
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const eventEntities = await eventRepository.findAll();
        
        // Convert domain entities to presentation interface
        const presentationEvents: Event[] = eventEntities.map(entity => ({
          id: entity.id,
          title: entity.title,
          description: entity.description,
          date: entity.date,
          time: format(entity.date, 'HH:mm'),
          location: entity.location,
          category: {
            id: entity.category.id,
            name: entity.category.name,
            color: entity.category.color
          },
          isPublic: entity.isPublic,
          requiresConfirmation: entity.requiresConfirmation,
          allowAnonymousRegistration: entity.allowAnonymousRegistration,
          maxParticipants: entity.maxParticipants,
          currentConfirmations: 0, // This would need to be calculated from confirmations
          imageURL: entity.imageURL,
          streamingURL: entity.streamingURL,
          responsible: entity.responsible,
          status: mapEnumToStatus(entity.status),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          createdBy: entity.createdBy
        }));
        
        setEvents(presentationEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        // Keep empty array on error rather than falling back to mock data
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);
  const categories = ['all', 'Culto', 'Estudo Bíblico', 'Reunião', 'Evento Social', 'Conferência', 'Retiro'];

  const filteredEvents = events.filter(event => {
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || event.category.name === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'scheduled': return 'Agendado';
      case 'ongoing': return 'Em Andamento';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const isEventPast = (eventDate: Date) => {
    return eventDate < new Date();
  };

  const isEventToday = (eventDate: Date) => {
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };


  const handleStatusChange = async (eventId: string, newStatus: string) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${getStatusText(newStatus)}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // Find and update the event in Firebase
      const eventToUpdate = events.find(e => e.id === eventId);
      if (!eventToUpdate) return;
      
      const updatedEntity: DomainEvent = {
        id: eventToUpdate.id,
        title: eventToUpdate.title,
        description: eventToUpdate.description,
        date: eventToUpdate.date,
        time: eventToUpdate.time,
        location: eventToUpdate.location,
        category: {
          ...eventToUpdate.category,
          priority: 1
        },
        isPublic: eventToUpdate.isPublic,
        requiresConfirmation: eventToUpdate.requiresConfirmation,
        maxParticipants: eventToUpdate.maxParticipants,
        imageURL: eventToUpdate.imageURL,
        streamingURL: eventToUpdate.streamingURL,
        responsible: eventToUpdate.responsible,
        status: mapStatusToEnum(newStatus),
        createdAt: eventToUpdate.createdAt,
        updatedAt: new Date(),
        createdBy: eventToUpdate.createdBy
      };
      
      await eventRepository.update(eventToUpdate.id, updatedEntity);
      
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId 
            ? { ...event, status: newStatus as Event['status'], updatedAt: new Date() }
            : event
        )
      );
      
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    setLoading(true);
    const event = events.find(e => e.id === eventId);
    try {
      await eventRepository.delete(eventId);
      
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      
      await loggingService.logDatabase('info', 'Event deleted successfully', 
        `Event: "${event?.title}", ID: ${eventId}`, currentUser);
      
      alert('Evento excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting event:', error);
      await loggingService.logDatabase('error', 'Failed to delete event', 
        `Event: "${event?.title}", ID: ${eventId}, Error: ${error}`, currentUser);
      alert('Erro ao excluir evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleUpdateEvent = async (formData: Partial<Event>) => {
    if (!editingEvent) return;
    
    setLoading(true);
    try {
      const updatedEvent: DomainEvent = {
        ...editingEvent,
        title: formData.title || editingEvent.title,
        description: formData.description || editingEvent.description,
        date: formData.date || editingEvent.date,
        time: formData.time || editingEvent.time,
        location: formData.location || editingEvent.location,
        category: formData.category ? {
          id: formData.category.id || editingEvent.category.id,
          name: formData.category.name || editingEvent.category.name,
          color: formData.category.color || editingEvent.category.color,
          priority: formData.category.priority || editingEvent.category.priority || 1
        } : {
          ...editingEvent.category,
          priority: editingEvent.category.priority || 1
        },
        isPublic: formData.isPublic ?? editingEvent.isPublic,
        requiresConfirmation: formData.requiresConfirmation ?? editingEvent.requiresConfirmation,
        allowAnonymousRegistration: formData.allowAnonymousRegistration ?? (editingEvent.allowAnonymousRegistration || false),
        maxParticipants: formData.maxParticipants,
        imageURL: formData.imageURL,
        streamingURL: formData.streamingURL,
        responsible: formData.responsible || editingEvent.responsible,
        status: editingEvent.status as EventStatus,
        createdAt: editingEvent.createdAt,
        createdBy: editingEvent.createdBy,
        updatedAt: new Date()
      };

      await eventRepository.update(editingEvent.id, updatedEvent);
      
      // Reload events to get updated data
      const allEvents = await eventRepository.findAll();
      const transformedEvents = await Promise.all(allEvents.map(async (entity) => {
        const confirmations = await eventRepository.findConfirmations(entity.id);
        return {
          id: entity.id,
          title: entity.title,
          description: entity.description,
          date: entity.date,
          time: format(entity.date, 'HH:mm'),
          location: entity.location,
          category: {
            id: entity.category.id,
            name: entity.category.name,
            color: entity.category.color,
            priority: entity.category.priority
          },
          isPublic: entity.isPublic,
          requiresConfirmation: entity.requiresConfirmation,
          allowAnonymousRegistration: entity.allowAnonymousRegistration,
          maxParticipants: entity.maxParticipants,
          currentConfirmations: confirmations.filter((c: EventConfirmation) => c.status === ConfirmationStatus.Confirmed).length,
          imageURL: entity.imageURL,
          streamingURL: entity.streamingURL,
          responsible: entity.responsible,
          status: mapEnumToStatus(entity.status),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          createdBy: entity.createdBy
        } as Event;
      }));
      setEvents(transformedEvents);
      
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Erro ao atualizar evento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (formData: Partial<Event>) => {
    setLoading(true);
    try {
      // Create domain entity from form data
      const eventEntity: DomainEvent = {
        id: '', // ID will be generated by repository
        title: formData.title || '',
        description: formData.description || '',
        date: formData.date || new Date(),
        time: formData.time || '10:00',
        location: formData.location || '',
        category: {
          id: formData.category?.id || '1',
          name: formData.category?.name || 'Culto',
          color: formData.category?.color || '#3B82F6',
          priority: 1
        },
        isPublic: formData.isPublic ?? true,
        requiresConfirmation: formData.requiresConfirmation ?? false,
        allowAnonymousRegistration: formData.allowAnonymousRegistration ?? false,
        maxParticipants: formData.maxParticipants,
        imageURL: formData.imageURL,
        streamingURL: formData.streamingURL,
        responsible: formData.responsible || currentUser?.email || 'Admin',
        status: EventStatus.Scheduled, // Default status
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'admin'
      };
      
      // Save to Firebase
      const savedEvent = await eventRepository.create(eventEntity);
      
      await loggingService.logDatabase('info', 'Event created successfully', 
        `Event: "${savedEvent.title}", Date: ${format(savedEvent.date, 'dd/MM/yyyy')}, Public: ${savedEvent.isPublic}`, currentUser);
      
      // Send notification if event is public
      if (savedEvent.isPublic) {
        try {
          const notificationCount = await notifyNewEvent(
            savedEvent.id,
            savedEvent.title,
            savedEvent.date
          );
          await loggingService.logApi('info', 'Event notification sent', 
            `Event: "${savedEvent.title}", Recipients: ${notificationCount}`, currentUser);
        } catch (error) {
          console.warn('Failed to send event notification:', error);
          await loggingService.logApi('error', 'Failed to send event notification', 
            `Event: "${savedEvent.title}", Error: ${error}`, currentUser);
        }
      }
      
      // Convert back to presentation format and add to list
      const presentationEvent: Event = {
        id: savedEvent.id,
        title: savedEvent.title,
        description: savedEvent.description,
        date: savedEvent.date,
        time: format(savedEvent.date, 'HH:mm'),
        location: savedEvent.location,
        category: savedEvent.category,
        isPublic: savedEvent.isPublic,
        requiresConfirmation: savedEvent.requiresConfirmation,
        maxParticipants: savedEvent.maxParticipants,
        currentConfirmations: 0,
        imageURL: savedEvent.imageURL,
        streamingURL: savedEvent.streamingURL,
        responsible: savedEvent.responsible,
        status: mapEnumToStatus(savedEvent.status),
        createdAt: savedEvent.createdAt,
        updatedAt: savedEvent.updatedAt,
        createdBy: savedEvent.createdBy
      };
      
      setEvents(prevEvents => [presentationEvent, ...prevEvents]);
      setShowCreateModal(false);
      alert('Evento criado com sucesso!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateEvent = async (event: Event) => {
    if (!window.confirm('Tem certeza que deseja duplicar este evento?')) {
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duplicatedEvent: Event = {
        ...event,
        id: Date.now().toString(),
        title: `${event.title} (Cópia)`,
        status: 'draft',
        currentConfirmations: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEvents(prevEvents => [duplicatedEvent, ...prevEvents]);
      alert('Evento duplicado com sucesso!');
    } catch (error) {
      console.error('Error duplicating event:', error);
      alert('Erro ao duplicar evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewConfirmations = async (event: Event) => {
    setSelectedEventForConfirmations(event);
    setShowConfirmationsModal(true);
    setLoadingConfirmations(true);
    
    try {
      const eventConfirmations = await eventRepository.findConfirmations(event.id);
      setConfirmations(eventConfirmations);
    } catch (error) {
      console.error('Error loading confirmations:', error);
      alert('Erro ao carregar confirmações.');
      setConfirmations([]);
    } finally {
      setLoadingConfirmations(false);
    }
  };

  const getConfirmationStatusText = (status: ConfirmationStatus): string => {
    switch (status) {
      case ConfirmationStatus.Confirmed: return 'Confirmado';
      case ConfirmationStatus.Declined: return 'Recusado';
      default: return 'Desconhecido';
    }
  };

  const getConfirmationStatusColor = (status: ConfirmationStatus): string => {
    switch (status) {
      case ConfirmationStatus.Confirmed: return 'bg-green-100 text-green-800';
      case ConfirmationStatus.Declined: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Eventos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre eventos, confirmações e participantes
              </p>
            </div>
            <button
              onClick={handleCreateEvent}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Evento
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
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Agendados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => e.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoje</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => isEventToday(e.date)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Finalizados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Events Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Eventos ({filteredEvents.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Local
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div 
                          className="h-10 w-4 rounded"
                          style={{ backgroundColor: event.category.color }}
                        ></div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            {!event.isPublic && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                🔒 Privado
                              </span>
                            )}
                            {isEventToday(event.date) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                📅 Hoje
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{event.category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        disabled={loading}
                        className={`text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 ${getStatusColor(event.status)}`}
                      >
                        {statuses.slice(1).map(status => (
                          <option key={status} value={status}>
                            {getStatusText(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{format(event.date, "dd/MM/yyyy")}</div>
                      <div className="text-xs text-gray-400">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.responsible}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        {event.requiresConfirmation && (
                          <button
                            onClick={() => handleViewConfirmations(event)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            Confirmações
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicateEvent(event)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && events.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
              <h3 className="text-sm font-medium text-gray-900">Carregando eventos...</h3>
              <p className="mt-1 text-sm text-gray-500">
                Buscando eventos do Firebase
              </p>
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros ou fazer uma nova busca.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmations Modal */}
      {showConfirmationsModal && selectedEventForConfirmations && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-0 sm:top-20 mx-auto p-4 sm:p-5 border w-full sm:max-w-4xl sm:shadow-lg sm:rounded-md bg-white min-h-screen sm:min-h-0 max-h-screen overflow-y-auto">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Confirmações - {selectedEventForConfirmations.title}
                </h3>
                <button
                  onClick={() => setShowConfirmationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Event Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Data:</span> {format(selectedEventForConfirmations.date, 'dd/MM/yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Local:</span> {selectedEventForConfirmations.location}
                  </div>
                  <div>
                    <span className="font-medium">Responsável:</span> {selectedEventForConfirmations.responsible}
                  </div>
                  <div>
                    <span className="font-medium">Total de Confirmações:</span> {confirmations.length}
                  </div>
                  <div>
                    <span className="font-medium">Inscrições Anônimas:</span> {confirmations.filter(c => c.isAnonymous).length}
                  </div>
                  <div>
                    <span className="font-medium">Usuários Registrados:</span> {confirmations.filter(c => !c.isAnonymous).length}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Legenda:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                    <span className="text-blue-800">Inscrição Anônima (destaque azul)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">👤</span>
                    <span className="text-blue-800">Usuário não cadastrado</span>
                  </div>
                </div>
              </div>

              {/* Confirmations List */}
              <div className="mb-6">
                {loadingConfirmations ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Carregando confirmações...</p>
                  </div>
                ) : confirmations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Telefone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data da Confirmação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {confirmations.map((confirmation) => (
                          <tr key={confirmation.id} className={confirmation.isAnonymous ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {confirmation.userName}
                              {confirmation.isAnonymous && (
                                <span className="ml-2 text-xs text-blue-600">👤</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {confirmation.userEmail || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {confirmation.userPhone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${confirmation.isAnonymous ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {confirmation.isAnonymous ? 'Anônimo' : 'Usuário'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfirmationStatusColor(confirmation.status)}`}>
                                {getConfirmationStatusText(confirmation.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(confirmation.confirmedAt, 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {confirmation.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma confirmação</h3>
                    <p className="text-gray-600">
                      Ainda não há confirmações para este evento.
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {!loadingConfirmations && confirmations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Resumo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {confirmations.filter(c => c.status === ConfirmationStatus.Confirmed).length}
                      </div>
                      <div className="text-sm text-green-800">Confirmados</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {confirmations.filter(c => c.status === ConfirmationStatus.Declined).length}
                      </div>
                      <div className="text-sm text-red-800">Recusados</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirmationsModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onSave={handleSaveEvent}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EditEventModal
          event={editingEvent}
          onSave={handleUpdateEvent}
          onCancel={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

// Modal component for editing events
interface EditEventModalProps {
  event: Event;
  onSave: (formData: Partial<Event>) => void;
  onCancel: () => void;
  loading: boolean;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    date: new Date(event.date).toISOString().slice(0, 10),
    time: event.time,
    location: event.location,
    category: event.category.name,
    isPublic: event.isPublic,
    requiresConfirmation: event.requiresConfirmation,
    allowAnonymousRegistration: event.allowAnonymousRegistration || false,
    maxParticipants: event.maxParticipants?.toString() || '',
    responsible: event.responsible,
    streamingURL: event.streamingURL || ''
  });

  const categoryOptions = [
    { name: 'Culto', color: '#3B82F6' },
    { name: 'Estudo Bíblico', color: '#10B981' },
    { name: 'Reunião', color: '#F59E0B' },
    { name: 'Evento Social', color: '#EF4444' },
    { name: 'Conferência', color: '#8B5CF6' },
    { name: 'Retiro', color: '#06B6D4' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Por favor, insira o título do evento.');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('Por favor, insira o local do evento.');
      return;
    }

    const selectedCategory = categoryOptions.find(cat => cat.name === formData.category) || categoryOptions[0];

    onSave({
      ...formData,
      date: new Date(formData.date),
      category: {
        id: event.category.id,
        name: selectedCategory.name,
        color: selectedCategory.color,
        priority: event.category.priority || 1
      },
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Editar Evento
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Culto Dominical"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Descrição do evento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Templo Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {categoryOptions.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsible}
                  onChange={(e) => handleChange('responsible', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Transmissão (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.streamingURL}
                  onChange={(e) => handleChange('streamingURL', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublicEdit"
                    checked={formData.isPublic}
                    onChange={(e) => handleChange('isPublic', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="isPublicEdit" className="ml-2 text-sm text-gray-700">
                    Evento público (visível para todos os usuários)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresConfirmationEdit"
                    checked={formData.requiresConfirmation}
                    onChange={(e) => handleChange('requiresConfirmation', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="requiresConfirmationEdit" className="ml-2 text-sm text-gray-700">
                    Requer confirmação de presença
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowAnonymousRegistrationEdit"
                    checked={formData.allowAnonymousRegistration}
                    onChange={(e) => handleChange('allowAnonymousRegistration', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="allowAnonymousRegistrationEdit" className="ml-2 text-sm text-gray-700">
                    Permitir inscrições de usuários não logados
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
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal component for creating new events
interface CreateEventModalProps {
  onSave: (formData: Partial<Event>) => void;
  onCancel: () => void;
  loading: boolean;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    location: '',
    category: 'Culto',
    isPublic: true,
    requiresConfirmation: false,
    allowAnonymousRegistration: false,
    maxParticipants: '',
    responsible: '',
    streamingURL: ''
  });

  const categoryOptions = [
    { name: 'Culto', color: '#3B82F6' },
    { name: 'Estudo Bíblico', color: '#10B981' },
    { name: 'Reunião', color: '#F59E0B' },
    { name: 'Evento Social', color: '#EF4444' },
    { name: 'Conferência', color: '#8B5CF6' },
    { name: 'Retiro', color: '#06B6D4' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Por favor, insira o título do evento.');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('Por favor, insira o local do evento.');
      return;
    }

    const selectedCategory = categoryOptions.find(cat => cat.name === formData.category) || categoryOptions[0];

    onSave({
      ...formData,
      date: new Date(formData.date),
      category: {
        id: Date.now().toString(),
        name: selectedCategory.name,
        color: selectedCategory.color,
        priority: 1
      },
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-6">
            Novo Evento
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Culto Dominical"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Descrição do evento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Templo Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {categoryOptions.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsible}
                  onChange={(e) => handleChange('responsible', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Transmissão (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.streamingURL}
                  onChange={(e) => handleChange('streamingURL', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => handleChange('isPublic', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                    Evento público (visível para todos os usuários)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresConfirmation"
                    checked={formData.requiresConfirmation}
                    onChange={(e) => handleChange('requiresConfirmation', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="requiresConfirmation" className="ml-2 text-sm text-gray-700">
                    Requer confirmação de presença
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowAnonymousRegistration"
                    checked={formData.allowAnonymousRegistration}
                    onChange={(e) => handleChange('allowAnonymousRegistration', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="allowAnonymousRegistration" className="ml-2 text-sm text-gray-700">
                    Permitir inscrições de usuários não logados
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
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};