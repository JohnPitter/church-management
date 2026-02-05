// Unit Tests - useEvents Hook
// Comprehensive tests for event management functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { Event, EventCategory, EventStatus, EventConfirmation, ConfirmationStatus } from '@/domain/entities/Event';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import toast from 'react-hot-toast';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock useAuth hook directly
let mockUser: User | null = null;
const mockUseAuth = jest.fn();

jest.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock Event Repository
const mockFindAll = jest.fn();
const mockFindAllCategories = jest.fn();
const mockFindUserConfirmations = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

const mockEventRepository = {
  findAll: (...args: any[]) => mockFindAll(...args),
  findAllCategories: (...args: any[]) => mockFindAllCategories(...args),
  findUserConfirmations: (...args: any[]) => mockFindUserConfirmations(...args),
  create: (...args: any[]) => mockCreate(...args),
  update: (...args: any[]) => mockUpdate(...args)
};

// Mock DI Container
const mockGetEventRepository = jest.fn();
const mockContainerGet = jest.fn();

jest.mock('@/infrastructure/di/container', () => ({
  container: {
    getEventRepository: () => mockGetEventRepository(),
    get: (key: string) => mockContainerGet(key)
  }
}));

// Mock Use Cases - Shared mock execute functions
const mockExecuteCreateEvent = jest.fn();
const mockExecuteConfirmAttendance = jest.fn();

jest.mock('@modules/church-management/events/application/usecases/CreateEventUseCase', () => ({
  CreateEventUseCase: class {
    execute = mockExecuteCreateEvent;
  }
}));

jest.mock('@modules/church-management/events/application/usecases/ConfirmEventAttendanceUseCase', () => ({
  ConfirmEventAttendanceUseCase: class {
    execute = mockExecuteConfirmAttendance;
  }
}));

// Import after mocks are set up
import { useEvents } from '../useEvents';

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Helper to create mock event
const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-123',
  title: 'Test Event',
  description: 'Test Description',
  date: new Date('2026-03-15T10:00:00'),
  time: '10:00',
  location: 'Test Location',
  category: {
    id: 'cat-1',
    name: 'Service',
    color: '#3B82F6',
    priority: 1
  },
  isPublic: true,
  requiresConfirmation: false,
  responsible: 'admin-123',
  status: EventStatus.Scheduled,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-123',
  ...overrides
});

// Helper to create mock category
const createMockCategory = (overrides: Partial<EventCategory> = {}): EventCategory => ({
  id: 'cat-1',
  name: 'Service',
  color: '#3B82F6',
  priority: 1,
  ...overrides
});

// Helper to create mock confirmation
const createMockConfirmation = (overrides: Partial<EventConfirmation> = {}): EventConfirmation => ({
  id: 'conf-123',
  eventId: 'event-123',
  userId: 'user-123',
  userName: 'Test User',
  status: ConfirmationStatus.Confirmed,
  confirmedAt: new Date(),
  ...overrides
});

describe('useEvents Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null
    });
    mockGetEventRepository.mockReturnValue(mockEventRepository);
    mockContainerGet.mockImplementation((key: string) => {
      if (key === 'IAuditService') {
        return {
          logAction: jest.fn()
        };
      }
      if (key === 'INotificationService') {
        return {
          createNotification: jest.fn(),
          sendNotificationToUsers: jest.fn()
        };
      }
      return {};
    });
    mockFindAll.mockResolvedValue([]);
    mockFindAllCategories.mockResolvedValue([]);
    mockFindUserConfirmations.mockResolvedValue([]);
  });

  describe('Initial State and Loading', () => {
    it('should start with loading state true', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockFindAllCategories.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEvents());

      expect(result.current.loading).toBe(true);
      expect(result.current.events).toEqual([]);
      expect(result.current.categories).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should load events and categories successfully', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456', title: 'Another Event' })];
      const mockCategories = [createMockCategory(), createMockCategory({ id: 'cat-2', name: 'Meeting' })];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual(mockEvents);
      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.error).toBeNull();
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(mockFindAllCategories).toHaveBeenCalledTimes(1);
    });

    it('should load user confirmations when user is authenticated', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const mockEvents = [createMockEvent()];
      const mockCategories = [createMockCategory()];
      const mockConfirmations = [createMockConfirmation()];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue(mockCategories);
      mockFindUserConfirmations.mockResolvedValue(mockConfirmations);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFindUserConfirmations).toHaveBeenCalledWith('user-123');
      expect(result.current.getUserConfirmation('event-123')).toEqual(mockConfirmations[0]);
    });

    it('should not load user confirmations when user is not authenticated', async () => {
      mockUser = null;
      const mockEvents = [createMockEvent()];
      const mockCategories = [createMockCategory()];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFindUserConfirmations).not.toHaveBeenCalled();
      expect(result.current.getUserConfirmation('event-123')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle event loading errors gracefully', async () => {
      const errorMessage = 'Failed to load events';
      mockFindAll.mockRejectedValue(new Error(errorMessage));
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.events).toEqual([]);
    });

    it('should use default error message when error has no message', async () => {
      mockFindAll.mockRejectedValue(new Error());
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erro ao carregar eventos');
    });

    it('should handle non-Error objects in catch block', async () => {
      mockFindAll.mockRejectedValue('String error');
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erro ao carregar eventos');
    });
  });

  describe('createEvent Function', () => {
    it('should create event successfully when user is authenticated', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      const newEvent = createMockEvent({ id: 'new-event', title: 'New Event' });
      mockExecuteCreateEvent.mockResolvedValue(newEvent);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdEvent: Event | undefined;
      await act(async () => {
        createdEvent = await result.current.createEvent({
          title: 'New Event',
          description: 'Description',
          date: new Date('2026-03-15'),
          time: '10:00',
          location: 'Test Location',
          categoryId: 'cat-1',
          isPublic: true,
          requiresConfirmation: false,
          responsible: 'admin-123'
        });
      });

      expect(createdEvent).toEqual(newEvent);
      expect(result.current.events).toContain(newEvent);
      expect(result.current.events[0]).toEqual(newEvent); // Should be first in array
      expect(toast.success).toHaveBeenCalledWith('Evento criado com sucesso!');
    });

    it('should throw error when user is not authenticated', async () => {
      mockUser = null;
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.createEvent({
            title: 'New Event',
            description: 'Description',
            date: new Date('2026-03-15'),
            time: '10:00',
            location: 'Test Location',
            categoryId: 'cat-1',
            isPublic: true,
            requiresConfirmation: false,
            responsible: 'admin-123'
          });
        });
      }).rejects.toThrow('Usuário não autenticado');
    });

    it('should handle event creation errors and show toast', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      const errorMessage = 'Failed to create event';
      mockExecuteCreateEvent.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.createEvent({
            title: 'New Event',
            description: 'Description',
            date: new Date('2026-03-15'),
            time: '10:00',
            location: 'Test Location',
            categoryId: 'cat-1',
            isPublic: true,
            requiresConfirmation: false,
            responsible: 'admin-123'
          });
        });
      }).rejects.toThrow(errorMessage);

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(result.current.events).toEqual([]); // State should not be updated
    });

    it('should use default error message when creation fails without message', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      mockExecuteCreateEvent.mockRejectedValue(new Error());

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.createEvent({
            title: 'New Event',
            description: 'Description',
            date: new Date('2026-03-15'),
            time: '10:00',
            location: 'Test Location',
            categoryId: 'cat-1',
            isPublic: true,
            requiresConfirmation: false,
            responsible: 'admin-123'
          });
        });
      }).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Erro ao criar evento');
    });
  });

  describe('confirmAttendance Function', () => {
    it('should confirm attendance successfully when user is authenticated', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const mockEvents = [createMockEvent()];
      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([]);

      const confirmation = createMockConfirmation();
      mockExecuteConfirmAttendance.mockResolvedValue(confirmation);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedConfirmation: EventConfirmation | undefined;
      await act(async () => {
        returnedConfirmation = await result.current.confirmAttendance(
          'event-123',
          ConfirmationStatus.Confirmed,
          'Looking forward to it!'
        );
      });

      expect(returnedConfirmation).toEqual(confirmation);
      expect(result.current.getUserConfirmation('event-123')).toEqual(confirmation);
      expect(toast.success).toHaveBeenCalledWith('Presença confirmada!');
    });

    it('should throw error when user is not authenticated', async () => {
      mockUser = null;
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.confirmAttendance('event-123', ConfirmationStatus.Confirmed);
        });
      }).rejects.toThrow('Usuário não autenticado');
    });

    it('should update existing confirmation', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const mockEvents = [createMockEvent()];
      const existingConfirmation = createMockConfirmation({ status: ConfirmationStatus.Maybe });

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([existingConfirmation]);

      const updatedConfirmation = createMockConfirmation({ status: ConfirmationStatus.Confirmed });
      mockExecuteConfirmAttendance.mockResolvedValue(updatedConfirmation);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial state should have "Maybe" status
      expect(result.current.getUserConfirmation('event-123')?.status).toBe(ConfirmationStatus.Maybe);

      await act(async () => {
        await result.current.confirmAttendance('event-123', ConfirmationStatus.Confirmed);
      });

      // Should be updated to "Confirmed"
      expect(result.current.getUserConfirmation('event-123')?.status).toBe(ConfirmationStatus.Confirmed);
    });

    it('should handle confirmation errors and show toast', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([]);

      const errorMessage = 'Event is full';
      mockExecuteConfirmAttendance.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.confirmAttendance('event-123', ConfirmationStatus.Confirmed);
        });
      }).rejects.toThrow(errorMessage);

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(result.current.getUserConfirmation('event-123')).toBeUndefined();
    });

    it('should use default error message when confirmation fails without message', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      mockExecuteConfirmAttendance.mockRejectedValue(new Error());

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.confirmAttendance('event-123', ConfirmationStatus.Confirmed);
        });
      }).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Erro ao confirmar presença');
    });
  });

  describe('getUpcomingEvents Function', () => {
    it('should return upcoming events sorted by date', async () => {
      const now = new Date('2026-03-01T00:00:00');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        createMockEvent({ id: 'event-1', date: new Date('2026-03-05'), title: 'Event 1' }),
        createMockEvent({ id: 'event-2', date: new Date('2026-03-03'), title: 'Event 2' }),
        createMockEvent({ id: 'event-3', date: new Date('2026-02-28'), title: 'Past Event' }),
        createMockEvent({ id: 'event-4', date: new Date('2026-03-10'), title: 'Event 4' })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const upcomingEvents = result.current.getUpcomingEvents();

      expect(upcomingEvents).toHaveLength(3);
      expect(upcomingEvents[0].id).toBe('event-2'); // March 3
      expect(upcomingEvents[1].id).toBe('event-1'); // March 5
      expect(upcomingEvents[2].id).toBe('event-4'); // March 10

      jest.useRealTimers();
    });

    it('should limit upcoming events when limit is provided', async () => {
      const now = new Date('2026-03-01T00:00:00');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        createMockEvent({ id: 'event-1', date: new Date('2026-03-05') }),
        createMockEvent({ id: 'event-2', date: new Date('2026-03-03') }),
        createMockEvent({ id: 'event-3', date: new Date('2026-03-10') })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const upcomingEvents = result.current.getUpcomingEvents(2);

      expect(upcomingEvents).toHaveLength(2);
      expect(upcomingEvents[0].id).toBe('event-2');
      expect(upcomingEvents[1].id).toBe('event-1');

      jest.useRealTimers();
    });

    it('should return empty array when no upcoming events', async () => {
      const now = new Date('2026-03-01T00:00:00');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        createMockEvent({ id: 'event-1', date: new Date('2026-02-15') }),
        createMockEvent({ id: 'event-2', date: new Date('2026-02-20') })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const upcomingEvents = result.current.getUpcomingEvents();

      expect(upcomingEvents).toEqual([]);

      jest.useRealTimers();
    });
  });

  describe('getEventsByCategory Function', () => {
    it('should return events filtered by category', async () => {
      const category1 = createMockCategory({ id: 'cat-1', name: 'Service' });
      const category2 = createMockCategory({ id: 'cat-2', name: 'Meeting' });

      const mockEvents = [
        createMockEvent({ id: 'event-1', category: category1 }),
        createMockEvent({ id: 'event-2', category: category2 }),
        createMockEvent({ id: 'event-3', category: category1 }),
        createMockEvent({ id: 'event-4', category: category2 })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([category1, category2]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const serviceEvents = result.current.getEventsByCategory('cat-1');
      const meetingEvents = result.current.getEventsByCategory('cat-2');

      expect(serviceEvents).toHaveLength(2);
      expect(serviceEvents[0].id).toBe('event-1');
      expect(serviceEvents[1].id).toBe('event-3');

      expect(meetingEvents).toHaveLength(2);
      expect(meetingEvents[0].id).toBe('event-2');
      expect(meetingEvents[1].id).toBe('event-4');
    });

    it('should return empty array when category has no events', async () => {
      const mockEvents = [
        createMockEvent({ id: 'event-1', category: createMockCategory({ id: 'cat-1' }) })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const events = result.current.getEventsByCategory('cat-999');

      expect(events).toEqual([]);
    });
  });

  describe('getUserConfirmation Function', () => {
    it('should return user confirmation for event', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const confirmation = createMockConfirmation();

      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([confirmation]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userConfirmation = result.current.getUserConfirmation('event-123');

      expect(userConfirmation).toEqual(confirmation);
    });

    it('should return undefined when no confirmation exists', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userConfirmation = result.current.getUserConfirmation('event-999');

      expect(userConfirmation).toBeUndefined();
    });
  });

  describe('hasConfirmedAttendance Function', () => {
    it('should return true when user confirmed attendance', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const confirmation = createMockConfirmation({ status: ConfirmationStatus.Confirmed });

      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([confirmation]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasConfirmedAttendance('event-123')).toBe(true);
    });

    it('should return false when user declined or maybe', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const confirmation1 = createMockConfirmation({
        eventId: 'event-1',
        status: ConfirmationStatus.Declined
      });
      const confirmation2 = createMockConfirmation({
        eventId: 'event-2',
        status: ConfirmationStatus.Maybe
      });

      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([confirmation1, confirmation2]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasConfirmedAttendance('event-1')).toBe(false);
      expect(result.current.hasConfirmedAttendance('event-2')).toBe(false);
    });

    it('should return false when no confirmation exists', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasConfirmedAttendance('event-123')).toBe(false);
    });
  });

  describe('reload Function', () => {
    it('should reload events and categories', async () => {
      const initialEvents = [createMockEvent({ id: 'event-1' })];
      const updatedEvents = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' })
      ];

      mockFindAll
        .mockResolvedValueOnce(initialEvents)
        .mockResolvedValueOnce(updatedEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);

      await act(async () => {
        await result.current.reload();
      });

      expect(result.current.events).toHaveLength(2);
      expect(mockFindAll).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during reload', async () => {
      let resolveFind: any;
      const findPromise = new Promise(resolve => {
        resolveFind = resolve;
      });
      mockFindAll.mockReturnValue(findPromise);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      // Wait for initial load to complete
      act(() => {
        resolveFind([]);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Now test reload
      const reloadFindPromise = new Promise(resolve => {
        resolveFind = resolve;
      });
      mockFindAll.mockReturnValue(reloadFindPromise);

      act(() => {
        result.current.reload();
      });

      // Check that loading is true during reload
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Complete the reload
      act(() => {
        resolveFind([]);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('User Authentication Changes', () => {
    it('should reload events when user logs in', async () => {
      mockUser = null;
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result, rerender } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFindUserConfirmations).not.toHaveBeenCalled();

      // User logs in
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindUserConfirmations.mockResolvedValue([createMockConfirmation()]);

      rerender();

      await waitFor(() => {
        expect(mockFindUserConfirmations).toHaveBeenCalled();
      });
    });

    it('should reload events when user logs out', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([createMockConfirmation()]);

      const { result, rerender } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getUserConfirmation('event-123')).toBeDefined();

      // User logs out
      mockUser = null;
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
      mockFindUserConfirmations.mockClear();

      rerender();

      await waitFor(() => {
        expect(mockFindAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', async () => {
      mockFindAll.mockResolvedValue([]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.getUpcomingEvents()).toEqual([]);
      expect(result.current.getEventsByCategory('any-id')).toEqual([]);
    });

    it('should handle empty categories array', async () => {
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
    });

    it('should handle events with same dates', async () => {
      const sameDate = new Date('2026-03-15T00:00:00');
      const mockEvents = [
        createMockEvent({ id: 'event-1', date: sameDate, time: '10:00' }),
        createMockEvent({ id: 'event-2', date: sameDate, time: '14:00' }),
        createMockEvent({ id: 'event-3', date: sameDate, time: '18:00' })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const upcomingEvents = result.current.getUpcomingEvents();
      expect(upcomingEvents).toHaveLength(3);
    });

    it('should handle multiple confirmations for different events', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const confirmations = [
        createMockConfirmation({ eventId: 'event-1', status: ConfirmationStatus.Confirmed }),
        createMockConfirmation({ eventId: 'event-2', status: ConfirmationStatus.Declined }),
        createMockConfirmation({ eventId: 'event-3', status: ConfirmationStatus.Maybe })
      ];

      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue(confirmations);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasConfirmedAttendance('event-1')).toBe(true);
      expect(result.current.hasConfirmedAttendance('event-2')).toBe(false);
      expect(result.current.hasConfirmedAttendance('event-3')).toBe(false);
    });

    it('should handle date objects vs date strings properly', async () => {
      const now = new Date('2026-03-01T00:00:00');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        createMockEvent({ id: 'event-1', date: new Date('2026-03-05T10:00:00') }),
        createMockEvent({ id: 'event-2', date: new Date('2026-02-25T10:00:00') })
      ];

      mockFindAll.mockResolvedValue(mockEvents);
      mockFindAllCategories.mockResolvedValue([]);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const upcomingEvents = result.current.getUpcomingEvents();
      expect(upcomingEvents).toHaveLength(1);
      expect(upcomingEvents[0].id).toBe('event-1');

      jest.useRealTimers();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger unnecessary re-renders', async () => {
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);

      const { result, rerender } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstGetUpcomingEvents = result.current.getUpcomingEvents;
      const firstGetEventsByCategory = result.current.getEventsByCategory;

      rerender();

      // Functions should be stable due to useCallback
      expect(result.current.getUpcomingEvents).toBe(firstGetUpcomingEvents);
      expect(result.current.getEventsByCategory).toBe(firstGetEventsByCategory);
    });

    it('should handle rapid successive calls gracefully', async () => {
      mockUser = createMockUser();
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockFindAll.mockResolvedValue([createMockEvent()]);
      mockFindAllCategories.mockResolvedValue([]);
      mockFindUserConfirmations.mockResolvedValue([]);

      const confirmation = createMockConfirmation();
      mockExecuteConfirmAttendance.mockResolvedValue(confirmation);

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make multiple rapid calls
      await act(async () => {
        await Promise.all([
          result.current.confirmAttendance('event-1', ConfirmationStatus.Confirmed),
          result.current.confirmAttendance('event-2', ConfirmationStatus.Confirmed),
          result.current.confirmAttendance('event-3', ConfirmationStatus.Confirmed)
        ]);
      });

      expect(mockExecuteConfirmAttendance).toHaveBeenCalledTimes(3);
    });
  });
});
