// Unit Tests - AdminVisitorsPage
// Comprehensive tests for admin visitors management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AdminVisitorsPage } from '../AdminVisitorsPage';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  VisitorStats
} from '@modules/church-management/visitors/domain/entities/Visitor';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

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

// Mock usePermissions hook
const mockHasPermission = jest.fn();
let mockPermissionsLoading = false;

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    loading: mockPermissionsLoading
  })
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') {
      return date.toLocaleDateString('pt-BR');
    }
    if (formatStr === 'dd/MM') {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (formatStr === 'yyyy-MM-dd') {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  email: 'admin@example.com',
  displayName: 'Admin User',
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

describe('AdminVisitorsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionsLoading = false;

    // Default current user
    mockCurrentUser = createTestUser();

    // Default permission setup - full access
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => true);

    // Default service responses
    mockGetVisitors.mockResolvedValue({
      visitors: [],
      hasMore: false,
      lastDoc: null
    });
    mockGetVisitorStats.mockResolvedValue(createTestStats());
  });

  // ===========================================
  // PERMISSION STATES
  // ===========================================
  describe('Permission States', () => {
    it('should show loading spinner when permissions are loading', () => {
      mockPermissionsLoading = true;

      render(<AdminVisitorsPage />);

      expect(screen.getByText('Verificando permissoes...')).toBeInTheDocument();
    });

    it('should show access denied when user cannot view visitors', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.View;
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });
      expect(screen.getByText('Voce nao tem permissao para visualizar visitantes.')).toBeInTheDocument();
    });

    it('should not show create button when user lacks create permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.Create;
      });
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Novo Visitante')).not.toBeInTheDocument();
      });
    });

    it('should show create button when user has create permission', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Novo Visitante')).toBeInTheDocument();
      });
    });

    it('should not show export button when user lacks manage permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.Manage;
      });
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
      });
    });

    it('should show export button when user has manage permission', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      });
    });

    it('should not show delete button when user lacks delete permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.Delete;
      });
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Delete button should not exist
      expect(screen.queryByRole('button', { name: /Excluir/i })).not.toBeInTheDocument();
    });

    it('should not show contact/visit buttons when user lacks update permission', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.Update;
      });
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // In grid view, these are buttons with text
      expect(screen.queryByText('Contato')).not.toBeInTheDocument();
      expect(screen.queryByText('Visita')).not.toBeInTheDocument();
    });
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching visitors', async () => {
      mockGetVisitors.mockImplementation(() => new Promise(() => {}));

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Carregando visitantes...')).toBeInTheDocument();
      });
    });

    it('should hide loading spinner after visitors are loaded', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

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

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum visitante encontrado')).toBeInTheDocument();
      });
    });

    it('should show different message when filters applied but no results', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum visitante encontrado')).toBeInTheDocument();
      });

      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Ajuste os filtros para encontrar visitantes.')).toBeInTheDocument();
      });
    });

    it('should show create button in empty state when user has permission', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        // There should be two buttons in empty state for create
        const newVisitorButtons = screen.getAllByText('Novo Visitante');
        expect(newVisitorButtons.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================
  // DATA DISPLAY - GRID VIEW
  // ===========================================
  describe('Data Display - Grid View', () => {
    const testVisitors = [
      createTestVisitor({ id: '1', name: 'Joao Visitante', status: VisitorStatus.ACTIVE, followUpStatus: FollowUpStatus.PENDING }),
      createTestVisitor({ id: '2', name: 'Maria Visitante', status: VisitorStatus.CONVERTED, followUpStatus: FollowUpStatus.COMPLETED }),
      createTestVisitor({ id: '3', name: 'Pedro Visitante', status: VisitorStatus.INACTIVE, followUpStatus: FollowUpStatus.NO_RESPONSE })
    ];

    it('should display visitor cards in grid view', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: testVisitors,
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        expect(screen.getByText('Maria Visitante')).toBeInTheDocument();
        expect(screen.getByText('Pedro Visitante')).toBeInTheDocument();
      });
    });

    it('should display visitor initials in avatar', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ name: 'Joao Silva' })],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });

    it('should display status and follow-up badges', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: testVisitors,
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Convertido').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Concluido').length).toBeGreaterThan(0);
      });
    });

    it('should display visit count', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ totalVisits: 5 })],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // DATA DISPLAY - TABLE VIEW
  // ===========================================
  describe('Data Display - Table View', () => {
    it('should switch to table view when clicking table toggle', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Find and click table view toggle
      const toggleButtons = screen.getAllByRole('button');
      const tableToggle = toggleButtons.find(btn => {
        const svg = btn.querySelector('svg');
        // The table view button should be the second one in the toggle
        return svg && btn.className.includes('rounded-r-md');
      });

      if (tableToggle) {
        fireEvent.click(tableToggle);

        await waitFor(() => {
          // Table view should have table headers
          expect(screen.getByText('Visitante')).toBeInTheDocument();
          expect(screen.getByText('Contato')).toBeInTheDocument();
          expect(screen.getByText('Status')).toBeInTheDocument();
          expect(screen.getByText('Follow-up')).toBeInTheDocument();
          expect(screen.getByText('Visitas')).toBeInTheDocument();
          expect(screen.getByText('Acoes')).toBeInTheDocument();
        });
      }
    });

    it('should display visitor data in table format', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor({ email: 'test@test.com', phone: '(11) 12345-6789' })],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Switch to table view
      const toggleButtons = screen.getAllByRole('button');
      const tableToggle = toggleButtons.find(btn => btn.className.includes('rounded-r-md'));
      if (tableToggle) {
        fireEvent.click(tableToggle);

        await waitFor(() => {
          expect(screen.getByText('test@test.com')).toBeInTheDocument();
          expect(screen.getByText('(11) 12345-6789')).toBeInTheDocument();
        });
      }
    });
  });

  // ===========================================
  // STATISTICS CARDS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display all statistics cards', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats({
        totalVisitors: 100,
        newThisMonth: 25,
        conversionRate: 15,
        retentionRate: 80,
        pendingFollowUp: 20
      }));

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument(); // Total
        expect(screen.getByText('25')).toBeInTheDocument(); // This month
        expect(screen.getByText('15%')).toBeInTheDocument(); // Conversion rate
        expect(screen.getByText('80%')).toBeInTheDocument(); // Retention rate
        expect(screen.getByText('20')).toBeInTheDocument(); // Pending follow-up
      });
    });

    it('should display correct stat labels', async () => {
      mockGetVisitors.mockResolvedValue({ visitors: [], hasMore: false, lastDoc: null });
      mockGetVisitorStats.mockResolvedValue(createTestStats());

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Este Mes')).toBeInTheDocument();
        expect(screen.getByText('Conversao')).toBeInTheDocument();
        expect(screen.getByText('Retencao')).toBeInTheDocument();
        expect(screen.getByText('Pendentes')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING
  // ===========================================
  describe('Filtering', () => {
    it('should filter visitors by search term', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'Joao' } });

      // Click search button
      const searchButtons = screen.getAllByRole('button');
      const searchButton = searchButtons.find(btn => btn.textContent === '');
      if (searchButton) {
        fireEvent.click(searchButton);
      }

      await waitFor(() => {
        expect(mockGetVisitors).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Joao' }),
          expect.any(Number),
          undefined
        );
      });
    });

    it('should filter by status', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

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

    it('should filter by follow-up status', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

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

    it('should clear all filters', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [createTestVisitor()],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      // Set filters
      const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusSelect, { target: { value: VisitorStatus.ACTIVE } });

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
  // CRUD OPERATIONS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Visitor', () => {
      it('should open create modal when clicking create button', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [],
          hasMore: false,
          lastDoc: null
        });

        render(<AdminVisitorsPage />);

        await waitFor(() => {
          expect(screen.getAllByText('Novo Visitante').length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getAllByText('Novo Visitante')[0]);

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

        render(<AdminVisitorsPage />);

        await waitFor(() => {
          expect(screen.getAllByText('Novo Visitante').length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getAllByText('Novo Visitante')[0]);

        await waitFor(() => {
          expect(screen.getByTestId('create-visitor-modal')).toBeInTheDocument();
        });

        mockGetVisitors.mockClear();
        mockGetVisitorStats.mockClear();

        fireEvent.click(screen.getByTestId('submit-create-modal'));

        await waitFor(() => {
          expect(mockGetVisitors).toHaveBeenCalled();
          expect(mockGetVisitorStats).toHaveBeenCalled();
        });
      });
    });

    describe('Delete Visitor', () => {
      it('should show confirmation and delete visitor', async () => {
        const visitor = createTestVisitor();
        mockGetVisitors.mockResolvedValue({
          visitors: [visitor],
          hasMore: false,
          lastDoc: null
        });
        mockDeleteVisitor.mockResolvedValue(undefined);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<AdminVisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        });

        // In grid view, the delete button is the one with trash icon
        const deleteButtons = screen.getAllByRole('button');
        const deleteButton = deleteButtons.find(btn => btn.textContent?.includes(''));

        // Actually find the delete button in grid view
        const gridDeleteButton = screen.queryByRole('button', { name: '' });
        // Or find by the button that contains the delete action
        const buttonsWithDelete = screen.getAllByRole('button').filter(
          btn => btn.className.includes('bg-red-100') || btn.textContent === ''
        );

        if (buttonsWithDelete.length > 0) {
          fireEvent.click(buttonsWithDelete[0]);

          await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalled();
            expect(mockDeleteVisitor).toHaveBeenCalledWith(visitor.id);
            expect(alertSpy).toHaveBeenCalledWith('Visitante excluido com sucesso!');
          });
        }

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not delete when confirmation is cancelled', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor()],
          hasMore: false,
          lastDoc: null
        });

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<AdminVisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        });

        const buttonsWithDelete = screen.getAllByRole('button').filter(
          btn => btn.className.includes('bg-red-100')
        );

        if (buttonsWithDelete.length > 0) {
          fireEvent.click(buttonsWithDelete[0]);
        }

        expect(mockDeleteVisitor).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });

      it('should handle delete errors gracefully', async () => {
        mockGetVisitors.mockResolvedValue({
          visitors: [createTestVisitor()],
          hasMore: false,
          lastDoc: null
        });
        mockDeleteVisitor.mockRejectedValue(new Error('Delete failed'));

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<AdminVisitorsPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
        });

        const buttonsWithDelete = screen.getAllByRole('button').filter(
          btn => btn.className.includes('bg-red-100')
        );

        if (buttonsWithDelete.length > 0) {
          fireEvent.click(buttonsWithDelete[0]);

          await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao excluir'));
          });
        }

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
        consoleSpy.mockRestore();
      });
    });
  });

  // ===========================================
  // EXPORT FUNCTIONALITY
  // ===========================================
  describe('Export Functionality', () => {
    it('should export visitors to CSV', async () => {
      const visitors = [
        createTestVisitor({ id: '1', name: 'Visitor 1', email: 'v1@test.com', phone: '123' }),
        createTestVisitor({ id: '2', name: 'Visitor 2', email: 'v2@test.com', phone: '456' })
      ];
      mockGetVisitors.mockResolvedValue({
        visitors,
        hasMore: false,
        lastDoc: null
      });

      // Mock URL.createObjectURL and document.createElement
      const createObjectURLMock = jest.fn().mockReturnValue('blob:test');
      const revokeObjectURLMock = jest.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Exportar CSV'));

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('visitantes_'));
      expect(mockLink.click).toHaveBeenCalled();
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

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Carregar mais')).toBeInTheDocument();
      });
    });

    it('should load more visitors when clicking button', async () => {
      mockGetVisitors
        .mockResolvedValueOnce({
          visitors: [createTestVisitor({ id: '1', name: 'Visitor 1' })],
          hasMore: true,
          lastDoc: 'doc-1'
        })
        .mockResolvedValueOnce({
          visitors: [createTestVisitor({ id: '2', name: 'Visitor 2' })],
          hasMore: false,
          lastDoc: null
        });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Visitor 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Carregar mais'));

      await waitFor(() => {
        expect(screen.getByText('Visitor 1')).toBeInTheDocument();
        expect(screen.getByText('Visitor 2')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  describe('Error Handling', () => {
    it('should handle visitor loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitors.mockRejectedValue(new Error('Network error'));

      render(<AdminVisitorsPage />);

      await waitFor(() => {
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

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Visitante')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // HEADER AND TITLE
  // ===========================================
  describe('Header and Title', () => {
    it('should display admin page title', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Visitantes')).toBeInTheDocument();
      });
    });

    it('should display admin page description', async () => {
      mockGetVisitors.mockResolvedValue({
        visitors: [],
        hasMore: false,
        lastDoc: null
      });

      render(<AdminVisitorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerencie visitantes, acompanhamento e conversoes da igreja')).toBeInTheDocument();
      });
    });
  });
});
