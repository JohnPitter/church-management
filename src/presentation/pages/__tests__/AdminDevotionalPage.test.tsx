// Unit Tests - AdminDevotionalPage
// Comprehensive tests for devotional management page component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDevotionalPage } from '../AdminDevotionalPage';

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

// Mock SettingsContext
const mockSettings = {
  primaryColor: '#6366F1',
  secondaryColor: '#8B5CF6',
  churchName: 'Test Church'
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    loading: false,
    updateSettings: jest.fn()
  })
}));

// Mock usePermissions hook
const mockHasPermission = jest.fn().mockReturnValue(true);

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    loading: false,
    permissions: []
  })
}));

// Mock devotional categories
const mockCategories = [
  {
    id: 'cat-1',
    name: 'Oracao',
    description: 'Devocionais sobre oracao',
    icon: '🙏',
    color: '#4CAF50',
    isActive: true
  },
  {
    id: 'cat-2',
    name: 'Fe',
    description: 'Devocionais sobre fe',
    icon: '✝️',
    color: '#2196F3',
    isActive: true
  }
];

// Mock devotionals
const mockDevotionals = [
  {
    id: 'dev-1',
    title: 'Devocional de Oracao',
    content: 'Este e o conteudo do devocional sobre oracao e sua importancia.',
    bibleReference: 'Mateus 6:5-15',
    author: 'Pastor Joao',
    category: mockCategories[0],
    tags: ['oracao', 'fe'],
    isPublished: true,
    publishDate: new Date('2024-01-15'),
    viewCount: 150,
    likes: ['user-1', 'user-2', 'user-3'],
    comments: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'dev-2',
    title: 'Devocional sobre Fe',
    content: 'Reflexoes sobre a importancia da fe em nossa caminhada crista.',
    bibleReference: 'Hebreus 11:1-6',
    author: 'Pastora Maria',
    category: mockCategories[1],
    tags: ['fe', 'confianca'],
    isPublished: false,
    publishDate: new Date('2024-01-20'),
    viewCount: 50,
    likes: ['user-1'],
    comments: [],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  }
];

// Mock stats
const mockStats = {
  totalDevotionals: 25,
  publishedDevotionals: 20,
  completedDevotionals: 15,
  totalViews: 5000,
  totalLikes: 350,
  recentDevotionals: mockDevotionals,
  topCategories: [
    { category: mockCategories[0], count: 10 },
    { category: mockCategories[1], count: 8 }
  ]
};

// Mock devotional service - Create mock functions outside jest.mock to avoid hoisting issues
const mockGetDevotionals = jest.fn().mockResolvedValue({ devotionals: mockDevotionals, hasMore: false });
const mockGetCategories = jest.fn().mockResolvedValue(mockCategories);
const mockGetStats = jest.fn().mockResolvedValue(mockStats);
const mockDeleteDevotional = jest.fn().mockResolvedValue(undefined);
const mockUpdateDevotional = jest.fn().mockResolvedValue(undefined);
const mockApproveComment = jest.fn().mockResolvedValue(undefined);

jest.mock('@modules/church-management/devotionals/application/services/DevotionalService', () => ({
  devotionalService: {
    getDevotionals: (...args: any[]) => mockGetDevotionals(...args),
    getCategories: (...args: any[]) => mockGetCategories(...args),
    getStats: (...args: any[]) => mockGetStats(...args),
    deleteDevotional: (...args: any[]) => mockDeleteDevotional(...args),
    updateDevotional: (...args: any[]) => mockUpdateDevotional(...args),
    approveComment: (...args: any[]) => mockApproveComment(...args)
  }
}));

// Mock devotional modals
jest.mock('@modules/church-management/devotionals/presentation/components/CreateDevotionalModal', () => ({
  CreateDevotionalModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="create-devotional-modal">
        <h2>Criar Devocional</h2>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null
}));

jest.mock('@modules/church-management/devotionals/presentation/components/EditDevotionalModal', () => ({
  EditDevotionalModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="edit-devotional-modal">
        <h2>Editar Devocional</h2>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null
}));

jest.mock('@modules/church-management/devotionals/presentation/components/DevotionalDetailModal', () => ({
  DevotionalDetailModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="detail-devotional-modal">
        <h2>Detalhes do Devocional</h2>
        <button onClick={onClose}>Fechar</button>
      </div>
    ) : null
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date: any, formatStr: any) => '15 de janeiro de 2024')
}));

jest.mock('date-fns/locale', () => ({
  ptBR: {}
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
  return render(<AdminDevotionalPage />);
};

// ============================================================================
// Tests
// ============================================================================

describe('AdminDevotionalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
    mockGetDevotionals.mockResolvedValue({ devotionals: mockDevotionals, hasMore: false });
    mockGetCategories.mockResolvedValue(mockCategories);
    mockGetStats.mockResolvedValue(mockStats);
    mockConfirm.mockReturnValue(true);
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Devocionais')).toBeInTheDocument();
      });
      expect(screen.getByText('Crie e gerencie devocionais diarios para os membros da igreja')).toBeInTheDocument();
    });

    it('should render the create devotional button when user has permission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Devocional/i })).toBeInTheDocument();
      });
    });

    it('should render navigation tabs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
        expect(screen.getByText('Categorias')).toBeInTheDocument();
        expect(screen.getByText('Planos')).toBeInTheDocument();
        expect(screen.getByText('Comentarios')).toBeInTheDocument();
        expect(screen.getByText('Estatisticas')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // PERMISSION TESTS
  // ===========================================
  describe('Permission Checks', () => {
    it('should show access denied when user cannot view devotionals', async () => {
      mockHasPermission.mockReturnValue(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });
      expect(screen.getByText('Voce nao tem permissao para visualizar devocionais.')).toBeInTheDocument();
    });

    it('should hide create button when user cannot create', async () => {
      mockHasPermission.mockImplementation((module: any, action: any) => {
        if (action === 'create') return false;
        return true;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Novo Devocional/i })).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================
  describe('Loading State', () => {
    it('should show loading spinner while fetching devotionals', async () => {
      mockGetDevotionals.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Devocionais')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // STATISTICS CARDS TESTS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display total devotionals count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Devocionais')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should display published devotionals count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Publicados')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
      });
    });

    it('should display completed devotionals count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Concluidos')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('should display total views', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Visualizacoes')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
      });
    });

    it('should display total likes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Curtidas')).toBeInTheDocument();
        expect(screen.getByText('350')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE TESTS
  // ===========================================
  describe('Empty State', () => {
    it('should show empty state when no devotionals exist', async () => {
      mockGetDevotionals.mockResolvedValue({ devotionals: [], hasMore: false });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum devocional encontrado')).toBeInTheDocument();
      });
    });

    it('should show create button in empty state when user has permission', async () => {
      mockGetDevotionals.mockResolvedValue({ devotionals: [], hasMore: false });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Criar Primeiro Devocional/i })).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // DEVOTIONAL LIST TESTS
  // ===========================================
  describe('Devotional List', () => {
    it('should display all devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        expect(screen.getByText('Devocional sobre Fe')).toBeInTheDocument();
      });
    });

    it('should display published badge for published devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Publicado')).toBeInTheDocument();
      });
    });

    it('should display draft badge for unpublished devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rascunho')).toBeInTheDocument();
      });
    });

    it('should display bible reference for each devotional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Mateus 6:5-15/)).toBeInTheDocument();
        expect(screen.getByText(/Hebreus 11:1-6/)).toBeInTheDocument();
      });
    });

    it('should display category for each devotional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Oracao')).toBeInTheDocument();
        expect(screen.getByText('Fe')).toBeInTheDocument();
      });
    });

    it('should display tags for devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('#oracao')).toBeInTheDocument();
        expect(screen.getByText('#fe')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // TAB NAVIGATION TESTS
  // ===========================================
  describe('Tab Navigation', () => {
    it('should switch to categories tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('Oracao')).toBeInTheDocument();
        expect(screen.getByText('Devocionais sobre oracao')).toBeInTheDocument();
      });
    });

    it('should switch to plans tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Planos'));

      await waitFor(() => {
        expect(screen.getByText('Sistema de planos em desenvolvimento')).toBeInTheDocument();
      });
    });

    it('should switch to comments tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Comentarios'));

      await waitFor(() => {
        expect(screen.getByText('Sistema de comentarios em desenvolvimento')).toBeInTheDocument();
      });
    });

    it('should switch to stats tab and show statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Estatisticas'));

      await waitFor(() => {
        expect(screen.getByText('Devocionais Recentes')).toBeInTheDocument();
        expect(screen.getByText('Categorias Mais Usadas')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CRUD OPERATIONS TESTS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Devotional', () => {
      it('should open create modal when clicking new devotional button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Devocional/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Devocional/i }));

        await waitFor(() => {
          expect(screen.getByTestId('create-devotional-modal')).toBeInTheDocument();
        });
      });

      it('should close create modal when clicking cancel', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Novo Devocional/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Novo Devocional/i }));

        await waitFor(() => {
          expect(screen.getByTestId('create-devotional-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

        await waitFor(() => {
          expect(screen.queryByTestId('create-devotional-modal')).not.toBeInTheDocument();
        });
      });
    });

    describe('Edit Devotional', () => {
      it('should open edit modal when clicking edit button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByTestId('edit-devotional-modal')).toBeInTheDocument();
        });
      });
    });

    describe('View Devotional', () => {
      it('should open detail modal when clicking view button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        const viewButtons = screen.getAllByTitle('Visualizar');
        fireEvent.click(viewButtons[0]);

        await waitFor(() => {
          expect(screen.getByTestId('detail-devotional-modal')).toBeInTheDocument();
        });
      });
    });

    describe('Delete Devotional', () => {
      it('should show confirmation dialog when deleting devotional', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir');
        fireEvent.click(deleteButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este devocional?');
      });

      it('should delete devotional when confirmation is accepted', async () => {
        mockConfirm.mockReturnValue(true);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockDeleteDevotional).toHaveBeenCalledWith('dev-1', mockCurrentUser.email);
        });
      });

      it('should not delete devotional when confirmation is cancelled', async () => {
        mockConfirm.mockReturnValue(false);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Excluir');
        fireEvent.click(deleteButtons[0]);

        expect(mockDeleteDevotional).not.toHaveBeenCalled();
      });
    });

    describe('Toggle Publish', () => {
      it('should toggle publish status of devotional', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
        });

        // Find the unpublish button (for published devotional)
        const publishButtons = screen.getAllByTitle(/Despublicar|Publicar/);
        fireEvent.click(publishButtons[0]);

        await waitFor(() => {
          expect(mockUpdateDevotional).toHaveBeenCalled();
        });
      });
    });
  });

  // ===========================================
  // CATEGORIES TAB TESTS
  // ===========================================
  describe('Categories Tab', () => {
    it('should show empty state when no categories exist', async () => {
      mockGetCategories.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('Nenhuma categoria encontrada')).toBeInTheDocument();
      });
    });

    it('should display category cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Categorias'));

      await waitFor(() => {
        expect(screen.getByText('Oracao')).toBeInTheDocument();
        expect(screen.getByText('Devocionais sobre oracao')).toBeInTheDocument();
        expect(screen.getByText('Fe')).toBeInTheDocument();
        expect(screen.getByText('Devocionais sobre fe')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================
  describe('Error Handling', () => {
    it('should handle delete error gracefully', async () => {
      mockDeleteDevotional.mockRejectedValue(new Error('Delete failed'));
      mockConfirm.mockReturnValue(true);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Excluir');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao excluir devocional');
      });
    });

    it('should handle toggle publish error gracefully', async () => {
      mockUpdateDevotional.mockRejectedValue(new Error('Update failed'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const publishButtons = screen.getAllByTitle(/Despublicar|Publicar/);
      fireEvent.click(publishButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao alterar status de publicacao');
      });
    });
  });

  // ===========================================
  // STATS TAB TESTS
  // ===========================================
  describe('Stats Tab', () => {
    it('should display recent devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Estatisticas'));

      await waitFor(() => {
        expect(screen.getByText('Devocionais Recentes')).toBeInTheDocument();
      });
    });

    it('should display top categories', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Estatisticas'));

      await waitFor(() => {
        expect(screen.getByText('Categorias Mais Usadas')).toBeInTheDocument();
      });
    });
  });
});
