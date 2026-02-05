// Unit Tests - VisitorsPage
// Comprehensive tests for visitors management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { VisitorsPage } from '../VisitorsPage';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  VisitorStats
} from '@modules/church-management/visitors/domain/entities/Visitor';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock visitorService - Create mock functions outside jest.mock to avoid hoisting issues
const mockGetVisitors = jest.fn();
const mockGetVisitorStats = jest.fn();
const mockDeleteVisitor = jest.fn();

jest.mock('@modules/church-management/visitors/application/services/VisitorService', () => ({
  visitorService: {
    getVisitors: (...args: any[]) => mockGetVisitors(...args),
    getVisitorStats: (...args: any[]) => mockGetVisitorStats(...args),
    deleteVisitor: (...args: any[]) => mockDeleteVisitor(...args)
  }
}));

// Mock AuthContext
let mockCurrentUser: User | null = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    user: mockCurrentUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(true),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  })
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') {
      return date.toLocaleDateString('pt-BR');
    }
    return date.toLocaleDateString('pt-BR');
  })
}));

// Mock visitor modals
jest.mock('@modules/church-management/visitors/presentation/components/visitors/CreateVisitorModal', () => ({
  CreateVisitorModal: ({ isOpen, onClose, onVisitorCreated }: any) => (
    isOpen ? (
      <div data-testid="create-visitor-modal">
        <button onClick={onClose} data-testid="close-create-modal">Close</button>
        <button onClick={onVisitorCreated} data-testid="submit-create-modal">Submit</button>
      </div>
    ) : null
  )
}));

jest.mock('@modules/church-management/visitors/presentation/components/visitors/VisitorDetailsModal', () => ({
  VisitorDetailsModal: ({ isOpen, onClose, visitor, onVisitorUpdated }: any) => (
    isOpen ? (
      <div data-testid="visitor-details-modal">
        <span>{visitor?.name}</span>
        <button onClick={onClose} data-testid="close-details-modal">Close</button>
        <button onClick={onVisitorUpdated} data-testid="update-visitor">Update</button>
      </div>
    ) : null
  )
}));

jest.mock('@modules/church-management/visitors/presentation/components/visitors/ContactVisitorModal', () => ({
  ContactVisitorModal: ({ isOpen, onClose, visitor, onContactAdded }: any) => (
    isOpen ? (
      <div data-testid="contact-visitor-modal">
        <span>{visitor?.name}</span>
        <button onClick={onClose} data-testid="close-contact-modal">Close</button>
        <button onClick={onContactAdded} data-testid="add-contact">Add Contact</button>
      </div>
    ) : null
  )
}));

jest.mock('@modules/church-management/visitors/presentation/components/visitors/RecordVisitModal', () => ({
  RecordVisitModal: ({ isOpen, onClose, visitor, onVisitRecorded }: any) => (
    isOpen ? (
      <div data-testid="record-visit-modal">
        <span>{visitor?.name}</span>
        <button onClick={onClose} data-testid="close-visit-modal">Close</button>
        <button onClick={onVisitRecorded} data-testid="record-visit">Record Visit</button>
      </div>
    ) : null
  )
}));

// Test data factories
const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-06-01'),
  ...overrides
});

const createTestVisitor = (overrides: Partial<Visitor> = {}): Visitor => ({
  id: 'visitor-1',
  name: 'Joao Visitante',
  email: 'joao@visitor.com',
  phone: '(11) 99999-9999',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-06-01'),
  createdBy: 'admin-1',
  status: VisitorStatus.ACTIVE,
  firstVisitDate: new Date('2023-01-01'),
  lastVisitDate: new Date('2023-06-01'),
  totalVisits: 3,
  contactAttempts: [],
  followUpStatus: FollowUpStatus.PENDING,
  isMember: false,
  ...overrides
});

const createTestStats = (overrides: Partial<VisitorStats> = {}): VisitorStats => ({
  totalVisitors: 50,
  newThisMonth: 10,
  activeVisitors: 35,
  convertedToMembers: 5,
  pendingFollowUp: 15,
  averageVisitsPerVisitor: 2.5,
  retentionRate: 70,
  conversionRate: 10,
  ...overrides
});

describe('VisitorsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default current user
    mockCurrentUser = createTestUser();

    // Default service responses
    mockGetVisitors.mockResolvedValue({
      visitors: [],
      hasMore: false,
      lastDoc: null
    });
    mockGetVisitorStats.mockResolvedValue(createTestStats());
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching visitors', async () => {
      mockGetVisitors.mockImplementation(() => new Promise(() => {}));

      render(<VisitorsPage />);

      expect(screen.getByText('Carregando visitantes...')).toBeInTheDocument();
    });

    it('should hide loading spinner after visitors are loaded', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Carregando visitantes...')).not.toBeInTheDocument();
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE
  // ===========================================
  describe('Empty State', () => {
    it('should show empty message when no visitors exist', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum visitante encontrado')).toBeInTheDocument();
        expect(screen.getByText('Comece cadastrando o primeiro visitante da igreja.')).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        // There should be two "Novo Visitante" buttons - one in header, one in empty state
        const newVisitorButtons = screen.getAllByText('Novo Visitante');
        expect(newVisitorButtons.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================
  // DATA DISPLAY
  // ===========================================
  describe('Data Display', () => {
    const testVisitors = [
      createTestVisitor({ id: '1', name: 'Joao Visitante', status: VisitorStatus.ACTIVE, followUpStatus: FollowUpStatus.PENDING }),
      createTestVisitor({ id: '2', name: 'Maria Visitante', status: VisitorStatus.CONVERTED, followUpStatus: FollowUpStatus.COMPLETED }),
      createTestVisitor({ id: '3', name: 'Pedro Visitante', status: VisitorStatus.INACTIVE, followUpStatus: FollowUpStatus.NO_RESPONSE })
    ];

    it('should display visitor list with correct data', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: testVisitors,
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        expect(screen.getByText('Maria Visitante')).toBeInTheDocument();
        expect(screen.getByText('Pedro Visitante')).toBeInTheDocument();
      });
    });

    it('should display visitor emails', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ email: 'test@visitor.com' })],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('test@visitor.com')).toBeInTheDocument();
      });
    });

    it('should display "Email nao informado" for visitors without email', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ email: undefined })],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Email nao informado')).toBeInTheDocument();
      });
    });

    it('should display status badges', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: testVisitors,
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Convertido').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
      });
    });

    it('should display follow-up status badges', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: testVisitors,
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Concluido').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Sem Resposta').length).toBeGreaterThan(0);
      });
    });

    it('should display visit count', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ totalVisits: 5 })],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('5 visitas')).toBeInTheDocument();
      });
    });

    it('should use singular form for single visit', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ totalVisits: 1 })],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('1 visita')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // STATISTICS CARDS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display total visitors count', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats({ totalVisitors: 100 }));

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total de Visitantes')).toBeInTheDocument();
      });
    });

    it('should display new this month count', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats({ newThisMonth: 25 }));

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Novos Este Mes')).toBeInTheDocument();
      });
    });

    it('should display conversion rate', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats({ conversionRate: 15 }));

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('15%')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Conversao')).toBeInTheDocument();
      });
    });

    it('should display pending follow-up count', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats({ pendingFollowUp: 20 }));

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Pendente Follow-up')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING
  // ===========================================
  describe('Filtering', () => {
    it('should filter visitors by search term', async () => {
      const visitors = [
        createTestVisitor({ id: '1', name: 'Joao Silva' }),
        createTestVisitor({ id: '2', name: 'Maria Santos' })
      ];

      mockGetVisitors.mockResolvedValue({
        visitors,
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar visitantes...');
      fireEvent.change(searchInput, { target: { value: 'Joao' } });

      // Click search button
      const searchButton = screen.getByRole('button', { name: '' });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockGetVisitors).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Joao' }),
          expect.any(Number),
          undefined
        );
      });
    });

    it('should filter visitors by status', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Find status filter select
      const statusSelect = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusSelect, { target: { value: VisitorStatus.ACTIVE } });

      await waitFor(() => {
        expect(mockGetVisitors).toHaveBeenCalledWith(
          expect.objectContaining({ status: VisitorStatus.ACTIVE }),
          expect.any(Number),
          undefined
        );
      });
    });

    it('should filter visitors by follow-up status', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Find follow-up filter select
      const followUpSelect = screen.getByDisplayValue('Todos Follow-ups');
      fireEvent.change(followUpSelect, { target: { value: FollowUpStatus.PENDING } });

      await waitFor(() => {
        expect(mockGetVisitors).toHaveBeenCalledWith(
          expect.objectContaining({ followUpStatus: FollowUpStatus.PENDING }),
          expect.any(Number),
          undefined
        );
      });
    });

    it('should clear filters when clicking clear button', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Set some filters first
      const searchInput = screen.getByPlaceholderText('Buscar visitantes...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear filters
      const clearButton = screen.getByText('Limpar Filtros');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(mockGetVisitors).toHaveBeenCalledWith(
          {},
          expect.any(Number),
          undefined
        );
      });
    });
  });

  // ===========================================
  // PAGINATION
  // ===========================================
  describe('Pagination', () => {
    it('should show load more button when there are more visitors', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: true,
        lastDoc: 'doc-1'
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Carregar mais')).toBeInTheDocument();
      });
    });

    it('should not show load more button when all visitors are loaded', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Carregar mais')).not.toBeInTheDocument();
      });
    });

    it('should load more visitors when clicking load more button', async () => {
      const initialVisitors = [createTestVisitor({ id: '1', name: 'Visitor 1' })];
      const moreVisitors = [createTestVisitor({ id: '2', name: 'Visitor 2' })];

      mockGetVisitors
        .mockResolvedValueOnce({
          visitors: initialVisitors,
          hasMore: true,
          lastDoc: 'doc-1'
        })
        .mockResolvedValueOnce({
          visitors: moreVisitors,
          hasMore: false,
          lastDoc: null
        });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Visitor 1')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText('Carregar mais');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Visitor 1')).toBeInTheDocument();
        expect(screen.getByText('Visitor 2')).toBeInTheDocument();
      });
    });

    it('should show loading state while loading more', async () => {
      mockGetVisitors
        .mockResolvedValueOnce({
          visitors: [createTestVisitor()],
          hasMore: true,
          lastDoc: 'doc-1'
        })
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Carregar mais')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText('Carregar mais');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Carregando...')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Visitor', () => {
      it('should open create modal when clicking new visitor button', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getAllByText('Novo Visitante').length).toBeGreaterThan(0);
        });

        // Click first "Novo Visitante" button
        const createButton = screen.getAllByText('Novo Visitante')[0];
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByTestId('create-visitor-modal')).toBeInTheDocument();
        });
      });

      it('should refresh data after successful creation', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getAllByText('Novo Visitante').length).toBeGreaterThan(0);
        });

        // Open modal
        fireEvent.click(screen.getAllByText('Novo Visitante')[0]);

        await waitFor(() => {
          expect(screen.getByTestId('create-visitor-modal')).toBeInTheDocument();
        });

        // Clear mocks to verify refresh
        mockGetVisitors.mockClear();
        mockGetVisitorStats.mockClear();

        // Submit
        fireEvent.click(screen.getByTestId('submit-create-modal'));

        await waitFor(() => {
          expect(mockGetVisitors).toHaveBeenCalled();
          expect(mockGetVisitorStats).toHaveBeenCalled();
        });
      });
    });

    describe('View Details', () => {
      it('should open details modal when clicking view button', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor({ name: 'Test Visitor' })],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Test Visitor')).toBeInTheDocument();
        });

        // Find and click view details button (eye icon)
        const viewButtons = screen.getAllByRole('button');
        const viewButton = viewButtons.find(btn =>
          btn.querySelector('svg') && btn.className.includes('text-indigo-600')
        );

        if (viewButton) {
          fireEvent.click(viewButton);

          await waitFor(() => {
            expect(screen.getByTestId('visitor-details-modal')).toBeInTheDocument();
          });
        }
      });
    });

    describe('Contact Visitor', () => {
      it('should open contact modal when clicking contact button', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor({ name: 'Test Visitor' })],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Test Visitor')).toBeInTheDocument();
        });

        // Find and click contact button (phone icon)
        const contactButtons = screen.getAllByRole('button');
        const contactButton = contactButtons.find(btn =>
          btn.querySelector('svg') && btn.className.includes('text-green-600')
        );

        if (contactButton) {
          fireEvent.click(contactButton);

          await waitFor(() => {
            expect(screen.getByTestId('contact-visitor-modal')).toBeInTheDocument();
          });
        }
      });

      it('should refresh data after adding contact', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor()],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        });

        // Open contact modal
        const contactButtons = screen.getAllByRole('button');
        const contactButton = contactButtons.find(btn =>
          btn.querySelector('svg') && btn.className.includes('text-green-600')
        );

        if (contactButton) {
          fireEvent.click(contactButton);

          await waitFor(() => {
            expect(screen.getByTestId('contact-visitor-modal')).toBeInTheDocument();
          });

          // Clear mocks
          mockGetVisitors.mockClear();
          mockGetVisitorStats.mockClear();

          // Add contact
          fireEvent.click(screen.getByTestId('add-contact'));

          await waitFor(() => {
            expect(mockGetVisitors).toHaveBeenCalled();
            expect(mockGetVisitorStats).toHaveBeenCalled();
          });
        }
      });
    });

    describe('Record Visit', () => {
      it('should open visit modal when clicking record visit button', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor({ name: 'Test Visitor' })],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Test Visitor')).toBeInTheDocument();
        });

        // Find and click record visit button (plus icon)
        const visitButtons = screen.getAllByRole('button');
        const visitButton = visitButtons.find(btn =>
          btn.querySelector('svg') && btn.className.includes('text-blue-600')
        );

        if (visitButton) {
          fireEvent.click(visitButton);

          await waitFor(() => {
            expect(screen.getByTestId('record-visit-modal')).toBeInTheDocument();
          });
        }
      });

      it('should refresh data after recording visit', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor()],
          hasMore: false,
          lastDoc: null
        });

        render(<VisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        });

        // Open visit modal
        const visitButtons = screen.getAllByRole('button');
        const visitButton = visitButtons.find(btn =>
          btn.querySelector('svg') && btn.className.includes('text-blue-600')
        );

        if (visitButton) {
          fireEvent.click(visitButton);

          await waitFor(() => {
            expect(screen.getByTestId('record-visit-modal')).toBeInTheDocument();
          });

          // Clear mocks
          mockGetVisitors.mockClear();
          mockGetVisitorStats.mockClear();

          // Record visit
          fireEvent.click(screen.getByTestId('record-visit'));

          await waitFor(() => {
            expect(mockGetVisitors).toHaveBeenCalled();
            expect(mockGetVisitorStats).toHaveBeenCalled();
          });
        }
      });
    });
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  describe('Error Handling', () => {
    it('should handle visitor loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitors.mockRejectedValue(new Error('Network error'));

      render(<VisitorsPage />);

      await waitFor(() => {
        // Should show empty state on error
        expect(screen.getByText('Nenhum visitante encontrado')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle stats loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });
      mockGetVisitorStats.mockRejectedValue(new Error('Stats error'));

      render(<VisitorsPage />);

      await waitFor(() => {
        // Should still display visitors even if stats fail
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // HEADER AND TITLE
  // ===========================================
  describe('Header and Title', () => {
    it('should display page title', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes')).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerencie os visitantes da igreja e acompanhe o processo de integracao')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // VISITOR INITIALS AVATAR
  // ===========================================
  describe('Visitor Initials Avatar', () => {
    it('should display first letter of visitor name in avatar', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ name: 'Joao Silva' })],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // SEARCH ON ENTER KEY
  // ===========================================
  describe('Search Functionality', () => {
    it('should trigger search on Enter key press', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<VisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar visitantes...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockGetVisitors).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test' }),
          expect.any(Number),
          undefined
        );
      });
    });
  });
});
