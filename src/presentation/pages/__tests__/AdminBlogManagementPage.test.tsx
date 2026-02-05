// Unit Tests - AdminBlogManagementPage
// Comprehensive tests for blog management page component

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminBlogManagementPage } from '../AdminBlogManagementPage';

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
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock notification actions - Create mock functions outside jest.mock to avoid hoisting issues
const mockNotifyNewBlogPost = jest.fn().mockResolvedValue(10);

jest.mock('../../hooks/useNotificationActions', () => ({
  useNotificationActions: () => ({
    notifyNewBlogPost: (...args: any[]) => mockNotifyNewBlogPost(...args),
    notifyNewEvent: jest.fn(),
    notifyNewProject: jest.fn(),
    notifyNewLiveStream: jest.fn()
  })
}));

// Mock PermissionGuard to render children based on permissions
jest.mock('../../components/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock logging service
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logDatabase: jest.fn().mockResolvedValue(undefined),
    logApi: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock blog posts data
const mockBlogPosts = [
  {
    id: 'post-1',
    title: 'Test Blog Post 1',
    content: '<p>This is the content of blog post 1 with enough text to be valid for testing purposes.</p>',
    excerpt: 'This is the excerpt of blog post 1',
    author: { id: 'user-1', name: 'John Doe', role: 'admin' },
    categories: ['Devocional'],
    tags: ['faith', 'prayer'],
    status: 'published',
    visibility: 'public',
    featuredImage: 'https://example.com/image1.jpg',
    publishedAt: new Date('2024-01-15'),
    likes: 10,
    views: 100,
    commentsEnabled: true,
    isHighlighted: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'post-2',
    title: 'Test Blog Post 2',
    content: '<p>This is the content of blog post 2 with more detailed content for our testing needs.</p>',
    excerpt: 'This is the excerpt of blog post 2',
    author: { id: 'user-2', name: 'Jane Smith', role: 'secretary' },
    categories: ['Reflexao'],
    tags: ['hope', 'love'],
    status: 'draft',
    visibility: 'public',
    featuredImage: undefined,
    publishedAt: undefined,
    likes: 5,
    views: 50,
    commentsEnabled: true,
    isHighlighted: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: 'post-3',
    title: 'Archived Blog Post',
    content: '<p>This is archived content that should still be searchable in the admin panel.</p>',
    excerpt: 'This is an archived post',
    author: { id: 'user-1', name: 'John Doe', role: 'admin' },
    categories: ['Estudo Biblico'],
    tags: ['bible', 'study'],
    status: 'archived',
    visibility: 'members_only',
    featuredImage: 'https://example.com/image3.jpg',
    publishedAt: new Date('2023-12-01'),
    likes: 25,
    views: 200,
    commentsEnabled: false,
    isHighlighted: false,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2023-12-01')
  }
];

// Mock Firebase Blog Repository
// Create mock functions outside jest.mock to avoid hoisting issues
const mockFindAll = jest.fn().mockResolvedValue(mockBlogPosts);
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);

jest.mock('@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository', () => {
  // Define the mock constructor function
  function FirebaseBlogRepositoryMock(this: any) {
    this.findAll = mockFindAll;
    this.findById = mockFindById;
    this.create = mockCreate;
    this.update = mockUpdate;
    this.delete = mockDelete;
  }

  return {
    FirebaseBlogRepository: FirebaseBlogRepositoryMock
  };
});

// Mock date-fns format to return consistent dates
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') return '15/01/2024';
    if (formatStr === 'dd/MM') return '15/01';
    return '2024-01-15';
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
  return render(<AdminBlogManagementPage />);
};

// ============================================================================
// Tests
// ============================================================================

describe('AdminBlogManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(mockBlogPosts);
    mockConfirm.mockReturnValue(true);
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Blog')).toBeInTheDocument();
      });
      expect(screen.getByText('Administre postagens, categorias e conteudo do blog')).toBeInTheDocument();
    });

    it('should render the create post button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar postagens...')).toBeInTheDocument();
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
    it('should show loading spinner while fetching posts', () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      expect(screen.getByText('Carregando postagens...')).toBeInTheDocument();
    });

    it('should hide loading spinner after posts are loaded', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando postagens...')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE TESTS
  // ===========================================
  describe('Empty State', () => {
    it('should show empty state when no posts exist', async () => {
      mockFindAll.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma postagem encontrada')).toBeInTheDocument();
      });
      expect(screen.getByText('Crie sua primeira postagem para comecar.')).toBeInTheDocument();
    });

    it('should show empty state when filter returns no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      // Search for non-existent post
      const searchInput = screen.getByPlaceholderText('Buscar postagens...');
      await userEvent.type(searchInput, 'nonexistent post');

      await waitFor(() => {
        expect(screen.getByText('Nenhuma postagem encontrada')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // STATISTICS CARDS TESTS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display correct count of published posts', async () => {
      renderComponent();

      await waitFor(() => {
        const publishedCard = screen.getByText('Publicados').closest('div');
        expect(publishedCard).toBeInTheDocument();
      });
    });

    it('should display correct count of draft posts', async () => {
      renderComponent();

      await waitFor(() => {
        const draftsCard = screen.getByText('Rascunhos').closest('div');
        expect(draftsCard).toBeInTheDocument();
      });
    });

    it('should display correct count of highlighted posts', async () => {
      renderComponent();

      await waitFor(() => {
        const highlightedCard = screen.getByText('Destacados').closest('div');
        expect(highlightedCard).toBeInTheDocument();
      });
    });

    it('should display total view count', async () => {
      renderComponent();

      await waitFor(() => {
        const viewsCard = screen.getByText('Total de Visualizacoes').closest('div');
        expect(viewsCard).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // POST LIST TESTS
  // ===========================================
  describe('Post List', () => {
    it('should display all posts in the table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
        expect(screen.getByText('Archived Blog Post')).toBeInTheDocument();
      });
    });

    it('should display post count in table header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Postagens (3)')).toBeInTheDocument();
      });
    });

    it('should display highlighted badge for highlighted posts', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Destaque')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING TESTS
  // ===========================================
  describe('Filtering', () => {
    it('should filter posts by search term', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar postagens...');
      await userEvent.type(searchInput, 'Archived');

      await waitFor(() => {
        expect(screen.queryByText('Test Blog Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Archived Blog Post')).toBeInTheDocument();
      });
    });

    it('should filter posts by status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      await userEvent.selectOptions(statusSelect, 'draft');

      await waitFor(() => {
        expect(screen.queryByText('Test Blog Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
      });
    });

    it('should filter posts by tag in search', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar postagens...');
      await userEvent.type(searchInput, 'bible');

      await waitFor(() => {
        expect(screen.queryByText('Test Blog Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Archived Blog Post')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CRUD OPERATIONS TESTS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Post', () => {
      it('should open create modal when clicking new post button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

        await waitFor(() => {
          expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
        });
      });

      it('should show validation errors for empty required fields', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

        await waitFor(() => {
          expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
        });

        // Submit button should be disabled when form is invalid
        const submitButton = screen.getByRole('button', { name: /Criar Postagem/i });
        expect(submitButton).toBeDisabled();
      });

      it('should close create modal when clicking cancel', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

        await waitFor(() => {
          expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

        await waitFor(() => {
          expect(screen.queryByText('Nova Postagem do Blog')).not.toBeInTheDocument();
        });
      });

      it('should create post with valid data', async () => {
        const newPost = {
          id: 'new-post-id',
          title: 'New Test Post',
          content: 'This is the content of the new test post which should be at least 50 characters long.',
          excerpt: 'New test post excerpt',
          author: { id: 'user-1', name: 'Admin User', role: 'admin' },
          categories: ['Geral'],
          tags: ['test'],
          status: 'draft',
          visibility: 'public',
          likes: 0,
          views: 0,
          commentsEnabled: true,
          isHighlighted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockCreate.mockResolvedValue(newPost);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

        await waitFor(() => {
          expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
        });

        // Fill in form
        const titleInput = screen.getByPlaceholderText('Ex: Reflexao sobre o Amor de Deus');
        const contentInput = screen.getByPlaceholderText('Escreva o conteudo da postagem aqui...');

        await userEvent.type(titleInput, 'New Test Post');
        await userEvent.type(contentInput, 'This is the content of the new test post which should be at least 50 characters long.');

        // Submit
        await waitFor(() => {
          const submitButton = screen.getByRole('button', { name: /Criar Postagem/i });
          expect(submitButton).not.toBeDisabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /Criar Postagem/i }));

        await waitFor(() => {
          expect(mockCreate).toHaveBeenCalled();
        });
      });
    });

    describe('Edit Post', () => {
      it('should open edit modal when clicking edit button', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole('button', { name: /Editar/i });
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Editar Postagem')).toBeInTheDocument();
        });
      });

      it('should populate edit modal with post data', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole('button', { name: /Editar/i });
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByDisplayValue('Test Blog Post 1')).toBeInTheDocument();
        });
      });
    });

    describe('Delete Post', () => {
      it('should show confirmation dialog when deleting post', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta postagem?');
      });

      it('should not delete post when confirmation is cancelled', async () => {
        mockConfirm.mockReturnValue(false);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockDelete).not.toHaveBeenCalled();
      });

      it('should delete post when confirmation is accepted', async () => {
        mockConfirm.mockReturnValue(true);
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockDelete).toHaveBeenCalledWith('post-1');
        });
      });
    });

    describe('Toggle Highlight', () => {
      it('should toggle post highlight status', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        const highlightButtons = screen.getAllByRole('button', { name: /Destacar/i });
        fireEvent.click(highlightButtons[0]);

        await waitFor(() => {
          expect(mockUpdate).toHaveBeenCalledWith('post-1', { isHighlighted: true });
        });
      });
    });

    describe('Status Change', () => {
      it('should show confirmation when changing status', async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        });

        // Find status select for first post
        const statusSelects = screen.getAllByDisplayValue('Publicado');
        await userEvent.selectOptions(statusSelects[0], 'draft');

        expect(mockConfirm).toHaveBeenCalled();
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
        expect(screen.getByText('Nenhuma postagem encontrada')).toBeInTheDocument();
      });
    });

    it('should show alert on delete error', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      mockConfirm.mockReturnValue(true);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao excluir postagem.');
      });
    });
  });

  // ===========================================
  // FORM VALIDATION TESTS
  // ===========================================
  describe('Form Validation', () => {
    it('should show validation error for short title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Ex: Reflexao sobre o Amor de Deus');
      await userEvent.type(titleInput, 'Test');

      await waitFor(() => {
        expect(screen.getByText('Titulo deve ter pelo menos 5 caracteres')).toBeInTheDocument();
      });
    });

    it('should show validation error for short content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
      });

      const contentInput = screen.getByPlaceholderText('Escreva o conteudo da postagem aqui...');
      await userEvent.type(contentInput, 'Short content');

      await waitFor(() => {
        expect(screen.getByText('Conteudo deve ter pelo menos 50 caracteres')).toBeInTheDocument();
      });
    });

    it('should show character count for content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Postagem/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Postagem/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Postagem do Blog')).toBeInTheDocument();
      });

      expect(screen.getByText(/0 caracteres \(minimo 50\)/)).toBeInTheDocument();

      const contentInput = screen.getByPlaceholderText('Escreva o conteudo da postagem aqui...');
      await userEvent.type(contentInput, 'Hello World');

      await waitFor(() => {
        expect(screen.getByText(/11 caracteres \(minimo 50\)/)).toBeInTheDocument();
      });
    });
  });
});
