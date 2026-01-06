// Presentation Hook - useEvents
// Clean implementation for event management

import { useState, useCallback, useEffect } from 'react';
import { Event, EventConfirmation, EventCategory, ConfirmationStatus } from '../../domain/entities/Event';
import { useAuth } from './useAuth';
import { container } from '../../infrastructure/di/container';
import { CreateEventUseCase } from '@modules/church-management/events/application/usecases/CreateEventUseCase';
import { ConfirmEventAttendanceUseCase } from '@modules/church-management/events/application/usecases/ConfirmEventAttendanceUseCase';
import toast from 'react-hot-toast';

interface EventsState {
  events: Event[];
  categories: EventCategory[];
  confirmations: Map<string, EventConfirmation>;
  loading: boolean;
  error: string | null;
}

export const useEvents = () => {
  const { user } = useAuth();
  const [state, setState] = useState<EventsState>({
    events: [],
    categories: [],
    confirmations: new Map(),
    loading: true,
    error: null
  });

  const eventRepository = container.getEventRepository();

  // Load events
  const loadEvents = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [events, categories] = await Promise.all([
        eventRepository.findAll(),
        eventRepository.findAllCategories()
      ]);

      // Load user confirmations if authenticated
      let confirmations = new Map<string, EventConfirmation>();
      if (user) {
        const userConfirmations = await eventRepository.findUserConfirmations(user.id);
        userConfirmations.forEach(conf => {
          confirmations.set(conf.eventId, conf);
        });
      }

      setState({
        events,
        categories,
        confirmations,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar eventos'
      }));
    }
  }, [user, eventRepository]);

  // Create event
  const createEvent = useCallback(async (eventData: Parameters<CreateEventUseCase['execute']>[0]) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const createEventUseCase = new CreateEventUseCase(
      eventRepository,
      container.get('IAuditService'),
      container.get('INotificationService')
    );

    try {
      const newEvent = await createEventUseCase.execute(eventData, user);
      
      setState(prev => ({
        ...prev,
        events: [newEvent, ...prev.events]
      }));

      toast.success('Evento criado com sucesso!');
      return newEvent;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar evento');
      throw error;
    }
  }, [user, eventRepository]);

  // Confirm attendance
  const confirmAttendance = useCallback(async (
    eventId: string,
    status: EventConfirmation['status'],
    notes?: string
  ) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const confirmAttendanceUseCase = new ConfirmEventAttendanceUseCase(
      eventRepository,
      container.get('INotificationService')
    );

    try {
      const confirmation = await confirmAttendanceUseCase.execute(
        { eventId, status, notes },
        user
      );

      setState(prev => {
        const newConfirmations = new Map(prev.confirmations);
        newConfirmations.set(eventId, confirmation);
        return { ...prev, confirmations: newConfirmations };
      });

      toast.success('Presença confirmada!');
      return confirmation;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar presença');
      throw error;
    }
  }, [user, eventRepository]);

  // Get upcoming events
  const getUpcomingEvents = useCallback((limit?: number) => {
    return state.events
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }, [state.events]);

  // Get events by category
  const getEventsByCategory = useCallback((categoryId: string) => {
    return state.events.filter(event => event.category.id === categoryId);
  }, [state.events]);

  // Get user confirmation for event
  const getUserConfirmation = useCallback((eventId: string) => {
    return state.confirmations.get(eventId);
  }, [state.confirmations]);

  // Check if user confirmed attendance
  const hasConfirmedAttendance = useCallback((eventId: string) => {
    const confirmation = state.confirmations.get(eventId);
    return confirmation?.status === ConfirmationStatus.Confirmed;
  }, [state.confirmations]);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events: state.events,
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    createEvent,
    confirmAttendance,
    getUpcomingEvents,
    getEventsByCategory,
    getUserConfirmation,
    hasConfirmedAttendance,
    reload: loadEvents
  };
};