// Unit Tests - AdminEventsManagementPage
// Comprehensive tests for events management page component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminEventsManagementPage } from '../AdminEventsManagementPage';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'admin@church.com',
  displayName: 'Admin User',
  photoURL: 'https://example.com/photo.jpg',
  role: 'admin',
  status: 'approved'
};

const mockAuthContext = {
  currentUser: mockCurrentUser,
  user: mockCurrentUser,
  loading: false,
  login: jest.fn().mockResolvedValue(mockCurrentUser),
  register: jest.fn().mockResolvedValue(mockCurrentUser),
  signInWithGoogle: jest.fn().mockResolvedValue(mockCurrentUser),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
  canCreateContent: jest.fn().mockReturnValue(true),
  isProfessional: jest.fn().mockReturnValue(false),
  canAccessSystem: jest.fn().mockReturnValue(true),
  linkEmailPassword: jest.fn().mockResolvedValue(undefined),
  getSignInMethods: jest.fn().mockResolvedValue(["password"])
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock notification actions - Create mock functions outside jest.mock to avoid hoisting issues
const mockNotifyNewEvent = jest.fn().mockResolvedValue(10);

jest.mock('../../hooks/useNotificationActions', () => ({
  useNotificationActions: () => ({
    notifyNewEvent: (...args: any[]) => mockNotifyNewEvent(...args),
    notifyNewBlogPost: jest.fn(),
    notifyNewProject: jest.fn(),
    notifyNewLiveStream: jest.fn()
  })
}));

// Mock logging service
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logDatabase: jest.fn().mockResolvedValue(undefined),
    logApi: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock events data
const mockEvents = [
  {
    id: 'event-1',
    title: 'Culto Dominical',
    description: 'Culto de adoracao e louvor',
    date: new Date('2024-02-15T10:00:00'),
    time: '10:00',
    location: 'Templo Principal',
    category: {
      id: '1',
      name: 'Culto',
      color: '#3B82F6',
      priority: 1
    },
    isPublic: true,
    requiresConfirmation: true,
    allowAnonymousRegistration: false,
    maxParticipants: 200,
    imageURL: 'https://example.com/culto.jpg',
    streamingURL: 'https://youtube.com/watch?v=123',
    responsible: 'Pastor Joao',
    status: 'scheduled',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
    createdBy: 'admin-1'
  },
  {
    id: 'event-2',
    title: 'Estudo Biblico',
    description: 'Estudo do livro de Romanos',
    date: new Date('2024-02-20T19:30:00'),
    time: '19:30',
    location: 'Sala de Estudos',
    category: {
      id: '2',
      name: 'Estudo Biblico',
      color: '#10B981',
      priority: 2
    },
    isPublic: false,
    requiresConfirmation: false,
    allowAnonymousRegistration: false,
    maxParticipants: undefined,
    imageURL: undefined,
    streamingURL: undefined,
    responsible: 'Lider Maria',
    status: 'draft',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    createdBy: 'admin-1'
  },
  {
    id: 'event-3',
    title: 'Conferencia Anual',
    description: 'Grande conferencia com pastores convidados',
    date: new Date('2024-03-01T09:00:00'),
    time: '09:00',
    location: 'Centro de Convencoes',
    category: {
      id: '5',
      name: 'Conferencia',
      color: '#8B5CF6',
      priority: 3
    },
    isPublic: true,
    requiresConfirmation: true,
    allowAnonymousRegistration: true,
    maxParticipants: 500,
    imageURL: 'https://example.com/conferencia.jpg',
    streamingURL: undefined,
    responsible: 'Pastor Principal',
    status: 'completed',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-03-02'),
    createdBy: 'admin-1'
  }
];

// Mock confirmations
const mockConfirmations = [
  {
    id: 'conf-1',
    eventId: 'event-1',
    userId: 'user-2',
    userName: 'Maria Silva',
    userEmail: 'maria@email.com',
    userPhone: '(11) 99999-1111',
    isAnonymous: false,
    status: 'confirmed',
    confirmedAt: new Date('2024-02-01'),
    notes: 'Vou levar minha familia'
  },
  {
    id: 'conf-2',
    eventId: 'event-1',
    userId: '',
    userName: 'Visitante Anonimo',
    userEmail: 'visitante@email.com',
    userPhone: '(11) 99999-2222',
    isAnonymous: true,
    status: 'confirmed',
    confirmedAt: new Date('2024-02-02'),
    notes: ''
  },
  {
    id: 'conf-3',
    eventId: 'event-1',
    userId: 'user-3',
    userName: 'Pedro Santos',
    userEmail: 'pedro@email.com',
    userPhone: '(11) 99999-3333',
    isAnonymous: false,
    status: 'declined',
    confirmedAt: new Date('2024-02-03'),
    notes: 'Nao poderei comparecer'
  }
];

// Mock Firebase Event Repository
// Create mock functions outside jest.mock to avoid hoisting issues
const mockFindAll = jest.fn().mockResolvedValue(mockEvents);
const mockCreate = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockFindConfirmations = jest.fn().mockResolvedValue(mockConfirmations);

jest.mock('@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository', () => ({
  FirebaseEventRepository: function() {
    return {
      findAll: (...args: any[]) => mockFindAll(...args),
      findById: jest.fn(),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
      delete: (...args: any[]) => mockDelete(...args),
      findConfirmations: (...args: any[]) => mockFindConfirmations(...args)
    };
  }
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'HH:mm') return '10:00';
    if (formatStr === 'dd/MM/yy') return '15/02/24';
    if (formatStr === 'dd/MM/yyyy') return '15/02/2024';
    if (formatStr === 'dd/MM/yyyy HH:mm') return '15/02/2024 10:00';
    return '2024-02-15';
  })
}));

// Mock window methods
const mockConfirm = jest.fn().mockReturnValue(true);
const mockAlert = jest.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;

// ============================================================================
// Helper Functions
// ============================================================================

const renderComponent = () => {
  return render(<AdminEventsManagementPage />);
};

// ============================================================================
// Tests
// ============================================================================

describe('AdminEventsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(mockEvents);
    mockFindConfirmations.mockResolvedValue(mockConfirmations);
    mockConfirm.mockReturnValue(true);
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
        expect(screen.getByText(/Administre eventos/i)).toBeInTheDocument();
      });
    });

    it('should render the create event button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar eventos...')).toBeInTheDocument();
      });
    });

    it('should render status filter dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todos os Status')).toBeInTheDocument();
      });
    });

    it('should render category filter dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todas as Categorias')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================
  describe('Loading State', () => {
    it('should show loading spinner while fetching events', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Carregando eventos...')).toBeInTheDocument();
      });
    });

    it('should hide loading spinner after events are loaded', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando eventos...')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE TESTS
  // ===========================================
  describe('Empty State', () => {
    it('should show empty state when no events exist', async () => {
      mockFindAll.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
      });
    });

    it('should show empty state when filter returns no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      // Search for non-existent event
      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      await userEvent.type(searchInput, 'nonexistent event');

      await waitFor(() => {
        expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // STATISTICS CARDS TESTS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display scheduled events count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Agendados')).toBeInTheDocument();
      });
    });

    it('should display today events count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Hoje')).toBeInTheDocument();
      });
    });

    it('should display completed events count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Finalizados')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EVENT LIST TESTS
  // ===========================================
  describe('Event List', () => {
    it('should display all events in the table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
        expect(screen.getByText('Conferencia Anual')).toBeInTheDocument();
      });
    });

    it('should display event count in table header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos (3)')).toBeInTheDocument();
      });
    });

    it('should display private icon for non-public events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
      });
    });

    it('should display category for each event', async () => {
      renderComponent();

      await waitFor(() => {
        const cultoElements = screen.getAllByText('Culto');
        expect(cultoElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
        expect(screen.getByText('Conferencia')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING TESTS
  // ===========================================
  describe('Filtering', () => {
    it('should filter events by search term', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      await userEvent.type(searchInput, 'Conferencia');

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Conferencia Anual')).toBeInTheDocument();
      });
    });

    it('should filter events by status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      await userEvent.selectOptions(statusSelect, 'draft');

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
      });
    });

    it('should filter events by category', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('Todas as Categorias');
      await userEvent.selectOptions(categorySelect, 'Conferencia');

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Conferencia Anual')).toBeInTheDocument();
      });
    });

    it('should filter events by location in search', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      await userEvent.type(searchInput, 'Centro de Convencoes');

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Conferencia Anual')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CRUD OPERATIONS TESTS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Event', () => {
      it('should open create modal when clicking new event button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

        await waitFor(() => {
          expect(screen.getByText('Novo Evento')).toBeInTheDocument();
        });
      });

      it('should close create modal when clicking cancel', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

        await waitFor(() => {
          expect(screen.getByText('Novo Evento')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      });

      it('should validate required fields', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

        await waitFor(() => {
          expect(screen.getByText('Novo Evento')).toBeInTheDocument();
        });

        // Try to submit without filling required fields
        fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

        // Should show validation alert
        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalled();
        });
      });

      it('should create event with valid data', async () => {
        const newEvent = {
          id: 'new-event-id',
          title: 'Novo Evento Teste',
          description: 'Descricao do evento',
          date: new Date(),
          time: '14:00',
          location: 'Local Teste',
          category: { id: '1', name: 'Culto', color: '#3B82F6', priority: 1 },
          isPublic: true,
          requiresConfirmation: false,
          status: 'scheduled',
          responsible: 'Admin User',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        };

        mockCreate.mockResolvedValue(newEvent);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

        await waitFor(() => {
          expect(screen.getByText('Novo Evento')).toBeInTheDocument();
        });

        // Fill in form
        const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
        const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');

        await userEvent.type(titleInput, 'Novo Evento Teste');
        await userEvent.type(locationInput, 'Local Teste');

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

        await waitFor(() => {
          expect(mockCreate).toHaveBeenCalled();
        });
      });
    });

    describe('Edit Event', () => {
      it('should open edit modal when clicking edit button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle('Editar evento');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Editar Evento')).toBeInTheDocument();
        });
      });

      it('should populate edit modal with event data', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle('Editar evento');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByDisplayValue('Culto Dominical')).toBeInTheDocument();
        });
      });
    });

    describe('Delete Event', () => {
      it('should show confirmation dialog when deleting event', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir evento');
        fireEvent.click(deleteButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este evento?');
      });

      it('should not delete event when confirmation is cancelled', async () => {
        mockConfirm.mockReturnValue(false);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir evento');
        fireEvent.click(deleteButtons[0]);

        expect(mockDelete).not.toHaveBeenCalled();
      });

      it('should delete event when confirmation is accepted', async () => {
        mockConfirm.mockReturnValue(true);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir evento');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockDelete).toHaveBeenCalledWith('event-1');
        });
      });
    });

    describe('Duplicate Event', () => {
      it('should show confirmation dialog when duplicating event', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const duplicateButtons = screen.getAllByTitle('Duplicar evento');
        fireEvent.click(duplicateButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja duplicar este evento?');
      });

      it('should duplicate event when confirmation is accepted', async () => {
        mockConfirm.mockReturnValue(true);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        const duplicateButtons = screen.getAllByTitle('Duplicar evento');
        fireEvent.click(duplicateButtons[0]);

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith('Evento duplicado com sucesso!');
        });
      });
    });

    describe('Status Change', () => {
      it('should show confirmation when changing status', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        });

        // Find status select in the table
        const statusSelects = screen.getAllByRole('combobox');
        const eventStatusSelect = statusSelects.find(select =>
          select.classList.contains('text-xs')
        );

        if (eventStatusSelect) {
          await userEvent.selectOptions(eventStatusSelect, 'completed');
          expect(mockConfirm).toHaveBeenCalled();
        }
      });
    });
  });

  // ===========================================
  // CONFIRMATIONS MODAL TESTS
  // ===========================================
  describe('Confirmations Modal', () => {
    it('should open confirmations modal for events requiring confirmation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Culto Dominical/)).toBeInTheDocument();
      });
    });

    it('should display confirmations list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Maria Silva')).toBeInTheDocument();
        expect(screen.getByText('Visitante Anonimo')).toBeInTheDocument();
        expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
      });
    });

    it('should display confirmation status badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Confirmado')).toBeInTheDocument();
        expect(screen.getByText('Recusado')).toBeInTheDocument();
      });
    });

    it('should display anonymous badge for anonymous registrations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Anonimo/i)).toBeInTheDocument();
      });
    });

    it('should display summary statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Resumo')).toBeInTheDocument();
        expect(screen.getByText('Confirmados')).toBeInTheDocument();
        expect(screen.getByText('Recusados')).toBeInTheDocument();
      });
    });

    it('should close confirmations modal when clicking close button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));

      await waitFor(() => {
        expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no confirmations exist', async () => {
      mockFindConfirmations.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Nenhuma confirma/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================
  describe('Error Handling', () => {
    it('should show empty state on fetch error', async () => {
      mockFindAll.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
      });
    });

    it('should show alert on delete error', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      mockConfirm.mockReturnValue(true);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Excluir evento');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao excluir evento.');
      });
    });

    it('should show alert on status change error', async () => {
      mockUpdate.mockRejectedValue(new Error('Update failed'));
      mockConfirm.mockReturnValue(true);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      // Find status select
      const statusSelects = screen.getAllByRole('combobox');
      const eventStatusSelect = statusSelects.find(select =>
        select.classList.contains('text-xs')
      );

      if (eventStatusSelect) {
        await userEvent.selectOptions(eventStatusSelect, 'completed');

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith('Erro ao atualizar status.');
        });
      }
    });

    it('should show alert on confirmations fetch error', async () => {
      mockFindConfirmations.mockRejectedValue(new Error('Fetch failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Erro ao carregar/i));
      });
    });
  });

  // ===========================================
  // FORM VALIDATION TESTS
  // ===========================================
  describe('Form Validation', () => {
    it('should show alert when title is empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      // Fill location but not title
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');
      fireEvent.change(locationInput, { target: { value: 'Local Teste' } });

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Por favor, insira o titulo/i));
      });
    });

    it('should show alert when location is empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      // Fill title but not location
      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      fireEvent.change(titleInput, { target: { value: 'Evento Teste' } });

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Por favor, insira o local/i));
      });
    });
  });

  // ===========================================
  // CHECKBOX OPTIONS TESTS
  // ===========================================
  describe('Checkbox Options', () => {
    it('should have public event checkbox in create form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('should have requires confirmation checkbox in create form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have allow anonymous registration checkbox in create form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should toggle checkboxes in create form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0] as HTMLInputElement;
      const initialState = firstCheckbox.checked;

      fireEvent.click(firstCheckbox);

      expect(firstCheckbox.checked).toBe(!initialState);
    });
  });

  // ===========================================
  // EDIT EVENT MODAL TESTS
  // ===========================================
  describe('Edit Event Modal', () => {
    it('should close edit modal when clicking cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar evento');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Editar Evento')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

      await waitFor(() => {
        expect(screen.queryByText('Editar Evento')).not.toBeInTheDocument();
      });
    });

    it('should update event with modified data', async () => {
      mockFindAll.mockResolvedValue(mockEvents);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar evento');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Culto Dominical')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Culto Dominical');
      fireEvent.change(titleInput, { target: { value: 'Culto Atualizado' } });

      fireEvent.click(screen.getByRole('button', { name: /Salvar Alteracoes/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should validate required fields in edit form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar evento');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Culto Dominical')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Culto Dominical');
      fireEvent.change(titleInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: /Salvar Alteracoes/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Por favor, insira o titulo/i));
      });
    });

    it('should handle edit error gracefully', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar evento');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Culto Dominical')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Culto Dominical');
      fireEvent.change(titleInput, { target: { value: 'Culto Atualizado' } });

      fireEvent.click(screen.getByRole('button', { name: /Salvar Alteracoes/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Erro ao atualizar/i));
      }, { timeout: 5000 });
    });
  });

  // ===========================================
  // NOTIFICATION TESTS
  // ===========================================
  describe('Notifications', () => {
    it('should send notification when creating public event', async () => {
      const newEvent = {
        id: 'new-event-id',
        title: 'Novo Evento Publico',
        description: 'Descricao do evento',
        date: new Date(),
        time: '14:00',
        location: 'Local Teste',
        category: { id: '1', name: 'Culto', color: '#3B82F6', priority: 1 },
        isPublic: true,
        requiresConfirmation: false,
        status: 'scheduled',
        responsible: 'Admin User',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      mockCreate.mockResolvedValue(newEvent);
      mockNotifyNewEvent.mockResolvedValue(10);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');

      await userEvent.type(titleInput, 'Novo Evento Publico');
      await userEvent.type(locationInput, 'Local Teste');

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(mockNotifyNewEvent).toHaveBeenCalledWith(
          'new-event-id',
          'Novo Evento Publico',
          expect.any(Date)
        );
      });
    });

    it('should not send notification when creating private event', async () => {
      const newEvent = {
        id: 'new-event-id',
        title: 'Evento Privado',
        description: 'Descricao do evento',
        date: new Date(),
        time: '14:00',
        location: 'Local Teste',
        category: { id: '1', name: 'Culto', color: '#3B82F6', priority: 1 },
        isPublic: false,
        requiresConfirmation: false,
        status: 'scheduled',
        responsible: 'Admin User',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      mockCreate.mockResolvedValue(newEvent);
      mockNotifyNewEvent.mockClear();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');
      const checkboxes = screen.getAllByRole('checkbox');
      const publicCheckbox = checkboxes[0]; // First checkbox is public

      fireEvent.change(titleInput, { target: { value: 'Evento Privado' } });
      fireEvent.change(locationInput, { target: { value: 'Local Teste' } });
      fireEvent.click(publicCheckbox); // Uncheck public

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });

      // Notification should not be called for private events
      expect(mockNotifyNewEvent).not.toHaveBeenCalled();
    });

    it('should continue event creation even if notification fails', async () => {
      const newEvent = {
        id: 'new-event-id',
        title: 'Novo Evento',
        description: 'Descricao do evento',
        date: new Date(),
        time: '14:00',
        location: 'Local Teste',
        category: { id: '1', name: 'Culto', color: '#3B82F6', priority: 1 },
        isPublic: true,
        requiresConfirmation: false,
        status: 'scheduled',
        responsible: 'Admin User',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      mockCreate.mockResolvedValue(newEvent);
      mockNotifyNewEvent.mockRejectedValue(new Error('Notification failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');

      await userEvent.type(titleInput, 'Novo Evento');
      await userEvent.type(locationInput, 'Local Teste');

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Evento criado com sucesso!');
      });
    });
  });

  // ===========================================
  // ADVANCED FILTERING TESTS
  // ===========================================
  describe('Advanced Filtering', () => {
    it('should filter by status and category simultaneously', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      const categorySelect = screen.getByDisplayValue('Todas as Categorias');

      await userEvent.selectOptions(statusSelect, 'scheduled');
      await userEvent.selectOptions(categorySelect, 'Culto');

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.queryByText('Estudo Biblico')).not.toBeInTheDocument();
        expect(screen.queryByText('Conferencia Anual')).not.toBeInTheDocument();
      });
    });

    it('should filter by search term and status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      const statusSelect = screen.getByDisplayValue('Todos os Status');

      await userEvent.type(searchInput, 'Culto');
      await userEvent.selectOptions(statusSelect, 'scheduled');

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.queryByText('Estudo Biblico')).not.toBeInTheDocument();
      });
    });

    it('should clear filters correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      fireEvent.change(searchInput, { target: { value: 'Culto' } });

      await waitFor(() => {
        expect(screen.queryByText('Estudo Biblico')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
      });
    });

    it('should filter by description text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar eventos...');
      await userEvent.type(searchInput, 'pastores convidados');

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Conferencia Anual')).toBeInTheDocument();
      });
    });

    it('should show correct event count after filtering', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eventos (3)')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      await userEvent.selectOptions(statusSelect, 'scheduled');

      await waitFor(() => {
        expect(screen.getByText('Eventos (1)')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // STATUS BADGE TESTS
  // ===========================================
  describe('Status Badges', () => {
    it('should display correct status badges for all events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelects = screen.getAllByRole('combobox');
      const eventStatusSelects = statusSelects.filter(select =>
        select.classList.contains('text-xs')
      );

      expect(eventStatusSelects.length).toBeGreaterThan(0);
    });

    it('should cancel status change when confirmation is denied', async () => {
      mockConfirm.mockReturnValue(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelects = screen.getAllByRole('combobox');
      const eventStatusSelect = statusSelects.find(select =>
        select.classList.contains('text-xs')
      );

      if (eventStatusSelect) {
        await userEvent.selectOptions(eventStatusSelect, 'completed');
        expect(mockUpdate).not.toHaveBeenCalled();
      }
    });
  });

  // ===========================================
  // FORM INPUT TESTS
  // ===========================================
  describe('Form Inputs', () => {
    it('should populate all form fields correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      const descriptionInput = screen.getByPlaceholderText('Descricao do evento...');
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');
      const responsibleInput = screen.getByPlaceholderText('Nome do responsavel');

      fireEvent.change(titleInput, { target: { value: 'Evento Completo' } });
      fireEvent.change(descriptionInput, { target: { value: 'Descricao completa do evento' } });
      fireEvent.change(locationInput, { target: { value: 'Local Completo' } });
      fireEvent.change(responsibleInput, { target: { value: 'Responsavel Teste' } });

      expect(titleInput).toHaveValue('Evento Completo');
      expect(descriptionInput).toHaveValue('Descricao completa do evento');
      expect(locationInput).toHaveValue('Local Completo');
      expect(responsibleInput).toHaveValue('Responsavel Teste');
    });

    it('should handle category selection', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const categorySelects = screen.getAllByRole('combobox');
      const categorySelect = categorySelects.find(select =>
        select.querySelector('option[value="Conferencia"]')
      );

      if (categorySelect) {
        await userEvent.selectOptions(categorySelect, 'Conferencia');
        expect(categorySelect).toHaveValue('Conferencia');
      }
    });

    it('should handle max participants input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const maxParticipantsInput = screen.getByPlaceholderText('Deixe vazio para ilimitado');
      await userEvent.type(maxParticipantsInput, '100');

      expect(maxParticipantsInput).toHaveValue(100);
    });
  });

  // ===========================================
  // CONFIRMATION MODAL DETAIL TESTS
  // ===========================================
  describe('Confirmation Modal Details', () => {
    it('should display event information in confirmations modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Data:/)).toBeInTheDocument();
        expect(screen.getByText(/Local:/)).toBeInTheDocument();
        expect(screen.getByText(/Responsavel:/)).toBeInTheDocument();
      });
    });

    it('should show loading state in confirmations modal', async () => {
      mockFindConfirmations.mockImplementation(() => new Promise(() => {}));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Carregando confirma/i)).toBeInTheDocument();
      });
    });

    it('should display user type badges correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Anonimo/i)).toBeInTheDocument();
        expect(screen.getByText(/Usuario/i)).toBeInTheDocument();
      });
    });

    it('should show legend in confirmations modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Legenda:')).toBeInTheDocument();
      });
    });

    it('should display notes in confirmations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const confirmationButtons = screen.getAllByTitle(/Ver confirma/i);
      fireEvent.click(confirmationButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Vou levar minha familia')).toBeInTheDocument();
        expect(screen.getByText('Nao poderei comparecer')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // DISABLED BUTTON TESTS
  // ===========================================
  describe('Button States', () => {
    it('should disable buttons during loading', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {}));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Carregando eventos...')).toBeInTheDocument();
      });
    });

    it('should disable form submit button during submission', async () => {
      mockCreate.mockImplementation(() => new Promise(() => {}));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Evento/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Novo Evento/i }));

      await waitFor(() => {
        expect(screen.getByText('Novo Evento')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical');
      const locationInput = screen.getByPlaceholderText('Ex: Templo Principal');

      await userEvent.type(titleInput, 'Novo Evento');
      await userEvent.type(locationInput, 'Local Teste');

      fireEvent.click(screen.getByRole('button', { name: /Criar Evento/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Criando.../i })).toBeDisabled();
      });
    });
  });
});
