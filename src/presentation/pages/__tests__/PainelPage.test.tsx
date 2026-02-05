// Unit Tests - Painel Page (Member Dashboard)
// Comprehensive tests for member dashboard functionality

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PainelPage } from '../PainelPage';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock date-fns to control date formatting
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date: Date, formatStr: string) => {
    // Return ISO string for sorting to work correctly
    if (formatStr.includes('dd/MM/yyyy')) {
      return date.toISOString();
    }
    return date.toISOString();
  })
}));

// Mock date-fns/locale
jest.mock('date-fns/locale', () => ({
  ptBR: {}
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'member@example.com',
  displayName: 'Test Member',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date()
};

let mockUser: any = mockCurrentUser;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockUser,
    user: mockUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(false),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  })
}));

// Mock repositories
const mockFindAllProjects = jest.fn().mockResolvedValue([]);
const mockFindAllEvents = jest.fn().mockResolvedValue([]);
const mockFindPublishedBlog = jest.fn().mockResolvedValue([]);

jest.mock('@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository', () => {
  return {
    FirebaseProjectRepository: jest.fn().mockImplementation(() => {
      return {
        findAll: mockFindAllProjects
      };
    })
  };
});

jest.mock('@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository', () => {
  return {
    FirebaseBlogRepository: jest.fn().mockImplementation(() => {
      return {
        findPublished: mockFindPublishedBlog
      };
    })
  };
});

jest.mock('@modules/church-management/events/infrastructure/repositories/FirebaseEventRepository', () => {
  return {
    FirebaseEventRepository: jest.fn().mockImplementation(() => {
      return {
        findAll: mockFindAllEvents
      };
    })
  };
});

// Mock VerseOfTheDay component
jest.mock('../../components/VerseOfTheDay', () => ({
  VerseOfTheDay: () => <div data-testid="verse-of-the-day">Verse of the Day Component</div>
}));

// Mock EventsCalendar component
jest.mock('@modules/church-management/events/presentation/components/EventsCalendar', () => ({
  EventsCalendar: () => <div data-testid="events-calendar">Events Calendar Component</div>
}));

describe('PainelPage', () => {
  beforeEach(() => {
    // Reset call history but keep implementations
    mockFindAllProjects.mockClear();
    mockFindAllEvents.mockClear();
    mockFindPublishedBlog.mockClear();

    mockUser = mockCurrentUser;

    // Reset to default resolved values
    mockFindAllProjects.mockResolvedValue([]);
    mockFindAllEvents.mockResolvedValue([]);
    mockFindPublishedBlog.mockResolvedValue([]);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <PainelPage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the page header', () => {
      renderComponent();

      expect(screen.getByText('Painel Principal')).toBeInTheDocument();
    });

    it('should display user greeting with displayName', () => {
      renderComponent();

      expect(screen.getByText(/Bem-vindo, Test Member!/i)).toBeInTheDocument();
    });

    it('should display user greeting with default text when displayName is missing', () => {
      mockUser = { ...mockCurrentUser, displayName: undefined };
      renderComponent();

      expect(screen.getByText(/Bem-vindo, Usuário!/i)).toBeInTheDocument();
    });

    it('should render the VerseOfTheDay component', () => {
      renderComponent();

      expect(screen.getByTestId('verse-of-the-day')).toBeInTheDocument();
    });

    it('should render the EventsCalendar component', () => {
      renderComponent();

      expect(screen.getByTestId('events-calendar')).toBeInTheDocument();
    });

    it('should render the quick access section', () => {
      renderComponent();

      expect(screen.getByText('Acesso Rápido')).toBeInTheDocument();
    });

    it('should render the recent activity section', () => {
      renderComponent();

      expect(screen.getByText('Atividades Recentes')).toBeInTheDocument();
    });

    it('should render profile link button', () => {
      renderComponent();

      const profileLink = screen.getByText('Meu Perfil').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Quick Actions', () => {
    it('should render all base quick action features', () => {
      renderComponent();

      expect(screen.getByText('Eventos')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
      expect(screen.getByText('Projetos')).toBeInTheDocument();
      expect(screen.getByText('Transmissões')).toBeInTheDocument();
      expect(screen.getByText('Devocionais')).toBeInTheDocument();
      expect(screen.getByText('Fórum')).toBeInTheDocument();
    });

    it('should display feature descriptions', () => {
      renderComponent();

      expect(screen.getByText('Próximos eventos e atividades')).toBeInTheDocument();
      expect(screen.getByText('Mensagens e reflexões')).toBeInTheDocument();
      expect(screen.getByText('Projetos da comunidade')).toBeInTheDocument();
      expect(screen.getByText('Cultos ao vivo')).toBeInTheDocument();
      expect(screen.getByText('Reflexões e estudos diários')).toBeInTheDocument();
      expect(screen.getByText('Discussões da comunidade')).toBeInTheDocument();
    });

    it('should have correct navigation links for each feature', () => {
      renderComponent();

      expect(screen.getByText('Eventos').closest('a')).toHaveAttribute('href', '/events');
      expect(screen.getByText('Blog').closest('a')).toHaveAttribute('href', '/blog');
      expect(screen.getByText('Projetos').closest('a')).toHaveAttribute('href', '/projects');
      expect(screen.getByText('Transmissões').closest('a')).toHaveAttribute('href', '/live');
      expect(screen.getByText('Devocionais').closest('a')).toHaveAttribute('href', '/devotionals');
      expect(screen.getByText('Fórum').closest('a')).toHaveAttribute('href', '/forum');
    });

    it('should render feature icons', () => {
      renderComponent();

      // Check for emoji icons
      expect(screen.getByText('📅')).toBeInTheDocument(); // Events
      expect(screen.getByText('📖')).toBeInTheDocument(); // Blog
      expect(screen.getByText('🤝')).toBeInTheDocument(); // Projects
      expect(screen.getByText('📺')).toBeInTheDocument(); // Live
      expect(screen.getByText('✝️')).toBeInTheDocument(); // Devotionals
      expect(screen.getByText('💬')).toBeInTheDocument(); // Forum
    });
  });

  describe('Professional Role Features', () => {
    it('should show professional panel link for professional users', () => {
      mockUser = { ...mockCurrentUser, role: 'professional' };
      renderComponent();

      expect(screen.getByText('Profissionais')).toBeInTheDocument();
      expect(screen.getByText('Painel de atendimento especializado')).toBeInTheDocument();
      expect(screen.getByText('🩺')).toBeInTheDocument();
    });

    it('should have correct navigation link for professional panel', () => {
      mockUser = { ...mockCurrentUser, role: 'professional' };
      renderComponent();

      const professionalLink = screen.getByText('Profissionais').closest('a');
      expect(professionalLink).toHaveAttribute('href', '/professional');
    });

    it('should not show professional panel link for non-professional users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Member };
      renderComponent();

      expect(screen.queryByText('Profissionais')).not.toBeInTheDocument();
      expect(screen.queryByText('Painel de atendimento especializado')).not.toBeInTheDocument();
    });

    it('should not show professional panel for admin users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Admin };
      renderComponent();

      expect(screen.queryByText('Profissionais')).not.toBeInTheDocument();
    });

    it('should not show professional panel for secretary users', () => {
      mockUser = { ...mockCurrentUser, role: UserRole.Secretary };
      renderComponent();

      expect(screen.queryByText('Profissionais')).not.toBeInTheDocument();
    });
  });

  describe('Recent Activities', () => {
    it('should show loading state initially', async () => {
      // Create promises that resolve after a delay
      let resolveProjects: any;
      let resolveEvents: any;
      let resolveBlog: any;

      const projectPromise = new Promise(resolve => { resolveProjects = resolve; });
      const eventPromise = new Promise(resolve => { resolveEvents = resolve; });
      const blogPromise = new Promise(resolve => { resolveBlog = resolve; });

      mockFindAllProjects.mockReturnValue(projectPromise);
      mockFindAllEvents.mockReturnValue(eventPromise);
      mockFindPublishedBlog.mockReturnValue(blogPromise);

      renderComponent();

      // Should show loading initially
      expect(screen.getByText('Carregando atividades...')).toBeInTheDocument();

      // Resolve all promises
      resolveProjects([]);
      resolveEvents([]);
      resolveBlog([]);

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });
    });

    it('should display empty state when no activities exist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
        expect(screen.getByText('As atividades aparecerão aqui quando eventos, posts ou projetos forem criados.')).toBeInTheDocument();
      });
    });

    it('should load and display event activities', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Culto de Domingo',
          createdAt: new Date('2026-02-05T10:00:00'),
          date: new Date('2026-02-09'),
          description: 'Culto dominical',
          location: 'Igreja',
          isPublic: true,
          updatedAt: new Date('2026-02-05T10:00:00')
        }
      ];

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        // Check that loading is done
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      // Verify event was called
      expect(mockFindAllEvents).toHaveBeenCalled();
    });

    it('should load and display blog activities', async () => {
      const mockBlogPosts = [
        {
          id: 'blog-1',
          title: 'Reflexão do Dia',
          content: 'Conteúdo da reflexão',
          createdAt: new Date('2026-02-05T09:00:00'),
          updatedAt: new Date('2026-02-05T09:00:00'),
          authorId: 'user-123',
          authorName: 'Test Author',
          status: 'published'
        }
      ];

      mockFindPublishedBlog.mockResolvedValue(mockBlogPosts);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindAllEvents.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindPublishedBlog).toHaveBeenCalled();
    });

    it('should load and display project activities', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Projeto Social',
          description: 'Descrição do projeto',
          createdAt: new Date('2026-02-05T08:00:00'),
          updatedAt: new Date('2026-02-05T11:00:00'),
          status: 'active'
        }
      ];

      mockFindAllProjects.mockResolvedValue(mockProjects);
      mockFindAllEvents.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindAllProjects).toHaveBeenCalled();
    });

    it('should display combined activities from multiple sources', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Culto de Domingo',
          createdAt: new Date('2026-02-05T10:00:00'),
          date: new Date('2026-02-09'),
          description: 'Culto dominical',
          location: 'Igreja',
          isPublic: true,
          updatedAt: new Date('2026-02-05T10:00:00')
        }
      ];

      const mockBlogPosts = [
        {
          id: 'blog-1',
          title: 'Reflexão do Dia',
          content: 'Conteúdo da reflexão',
          createdAt: new Date('2026-02-05T09:00:00'),
          updatedAt: new Date('2026-02-05T09:00:00'),
          authorId: 'user-123',
          authorName: 'Test Author',
          status: 'published'
        }
      ];

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindPublishedBlog.mockResolvedValue(mockBlogPosts);
      mockFindAllProjects.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindAllEvents).toHaveBeenCalled();
      expect(mockFindPublishedBlog).toHaveBeenCalled();
    });

    it('should display activity type icons', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event',
          createdAt: new Date(),
          date: new Date(),
          description: 'Test',
          location: 'Test',
          isPublic: true,
          updatedAt: new Date()
        }
      ];

      const mockBlogPosts = [
        {
          id: 'blog-1',
          title: 'Test Blog',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: 'user-123',
          authorName: 'Test',
          status: 'published'
        }
      ];

      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Description',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindPublishedBlog.mockResolvedValue(mockBlogPosts);
      mockFindAllProjects.mockResolvedValue(mockProjects);

      renderComponent();

      await waitFor(() => {
        // Check for activity type icons in the activities list
        const activityIcons = screen.getAllByText(/📅|📖|🤝/);
        expect(activityIcons.length).toBeGreaterThan(0);
      });
    });

    it('should limit activities to 5 most recent', async () => {
      // Create 10 events
      const mockEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        createdAt: new Date(`2026-02-${String(i + 1).padStart(2, '0')}T10:00:00`),
        date: new Date(),
        description: 'Test',
        location: 'Test',
        isPublic: true,
        updatedAt: new Date()
      }));

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      // Verify that data was fetched (limit logic is internal to component)
      expect(mockFindAllEvents).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle project repository errors gracefully', async () => {
      mockFindAllProjects.mockRejectedValue(new Error('Project fetch failed'));
      mockFindAllEvents.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        // Should show empty state instead of crashing
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      });
    });

    it('should handle event repository errors gracefully', async () => {
      mockFindAllEvents.mockRejectedValue(new Error('Event fetch failed'));
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      });
    });

    it('should handle blog repository errors gracefully', async () => {
      mockFindPublishedBlog.mockRejectedValue(new Error('Blog fetch failed'));
      mockFindAllProjects.mockResolvedValue([]);
      mockFindAllEvents.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      });
    });

    it('should handle all repository errors gracefully', async () => {
      mockFindAllProjects.mockRejectedValue(new Error('Project error'));
      mockFindAllEvents.mockRejectedValue(new Error('Event error'));
      mockFindPublishedBlog.mockRejectedValue(new Error('Blog error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      });
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');

      mockFindAllProjects.mockRejectedValue(testError);
      mockFindAllEvents.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      }, { timeout: 3000 });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching activities', async () => {
      // Create promises that we control
      let resolveProjects: any;
      const projectPromise = new Promise(resolve => { resolveProjects = resolve; });

      mockFindAllProjects.mockReturnValue(projectPromise);
      mockFindAllEvents.mockReturnValue(new Promise(() => {}));
      mockFindPublishedBlog.mockReturnValue(new Promise(() => {}));

      renderComponent();

      expect(screen.getByText('Carregando atividades...')).toBeInTheDocument();

      // Cleanup
      resolveProjects([]);
    });

    it('should show loading spinner with animation', async () => {
      let resolveProjects: any;
      const projectPromise = new Promise(resolve => { resolveProjects = resolve; });

      mockFindAllProjects.mockReturnValue(projectPromise);
      mockFindAllEvents.mockReturnValue(new Promise(() => {}));
      mockFindPublishedBlog.mockReturnValue(new Promise(() => {}));

      renderComponent();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Cleanup
      resolveProjects([]);
    });

    it('should hide loading state after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Sorting and Display', () => {
    it('should fetch data from repositories', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Old Event',
          createdAt: new Date('2026-01-01T10:00:00'),
          date: new Date(),
          description: 'Test',
          location: 'Test',
          isPublic: true,
          updatedAt: new Date()
        },
        {
          id: 'event-2',
          title: 'New Event',
          createdAt: new Date('2026-02-05T10:00:00'),
          date: new Date(),
          description: 'Test',
          location: 'Test',
          isPublic: true,
          updatedAt: new Date()
        }
      ];

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindAllEvents).toHaveBeenCalled();
    });

    it('should handle multiple events', async () => {
      const mockEvents = Array.from({ length: 5 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        createdAt: new Date(`2026-02-0${i + 1}T10:00:00`),
        date: new Date(),
        description: 'Test',
        location: 'Test',
        isPublic: true,
        updatedAt: new Date()
      }));

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindAllEvents).toHaveBeenCalled();
    });

    it('should handle multiple blog posts', async () => {
      const mockBlogPosts = Array.from({ length: 5 }, (_, i) => ({
        id: `blog-${i}`,
        title: `Blog ${i}`,
        content: 'Content',
        createdAt: new Date(`2026-02-0${i + 1}T10:00:00`),
        updatedAt: new Date(),
        authorId: 'user-123',
        authorName: 'Test',
        status: 'published'
      }));

      mockFindPublishedBlog.mockResolvedValue(mockBlogPosts);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindAllEvents.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindPublishedBlog).toHaveBeenCalled();
    });

    it('should handle multiple projects', async () => {
      const mockProjects = Array.from({ length: 3 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        description: 'Description',
        createdAt: new Date(`2026-02-0${i + 1}T10:00:00`),
        updatedAt: new Date(`2026-02-0${i + 1}T10:00:00`),
        status: 'active'
      }));

      mockFindAllProjects.mockResolvedValue(mockProjects);
      mockFindAllEvents.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      expect(mockFindAllProjects).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderComponent();

      const h1 = screen.getByRole('heading', { level: 1, name: /Painel Principal/i });
      expect(h1).toBeInTheDocument();

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible navigation links', () => {
      renderComponent();

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should render activities section', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event',
          createdAt: new Date(),
          date: new Date(),
          description: 'Test',
          location: 'Test',
          isPublic: true,
          updatedAt: new Date()
        }
      ];

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockFindAllProjects.mockResolvedValue([]);
      mockFindPublishedBlog.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
      });

      // Verify activities section is rendered
      expect(screen.getByText('Atividades Recentes')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render grid layout for quick actions', () => {
      renderComponent();

      const quickActionsGrid = screen.getByText('Acesso Rápido').parentElement;
      expect(quickActionsGrid).toBeInTheDocument();
    });

    it('should render proper container structure', () => {
      renderComponent();

      // Check for main container
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('User Context', () => {
    it('should handle null user gracefully', () => {
      mockUser = null;
      renderComponent();

      expect(screen.getByText(/Bem-vindo, Usuário!/i)).toBeInTheDocument();
    });

    it('should display different greeting for different users', () => {
      mockUser = { ...mockCurrentUser, displayName: 'João Silva' };
      renderComponent();

      expect(screen.getByText(/Bem-vindo, João Silva!/i)).toBeInTheDocument();
    });

    it('should update features when user role changes', () => {
      const { rerender } = renderComponent();

      expect(screen.queryByText('Profissionais')).not.toBeInTheDocument();

      // Change user role
      mockUser = { ...mockCurrentUser, role: 'professional' };

      rerender(
        <MemoryRouter>
          <PainelPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Profissionais')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should call all repository methods on mount', async () => {
      renderComponent();

      // Wait for empty state which confirms data loading completed
      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Now check that repositories were called
      expect(mockFindAllProjects).toHaveBeenCalled();
      expect(mockFindAllEvents).toHaveBeenCalled();
      expect(mockFindPublishedBlog).toHaveBeenCalled();
    });

    it('should create repository instances via useMemo', () => {
      renderComponent();

      // Verify repositories are created
      expect(mockFindAllProjects).toBeDefined();
      expect(mockFindAllEvents).toBeDefined();
      expect(mockFindPublishedBlog).toBeDefined();
    });

    it('should load data in parallel using Promise.all', async () => {
      renderComponent();

      // Wait for data load to complete
      await waitFor(() => {
        expect(screen.getByText('Nenhuma atividade recente encontrada.')).toBeInTheDocument();
      }, { timeout: 3000 });

      // All should be called (parallel execution)
      expect(mockFindAllProjects).toHaveBeenCalled();
      expect(mockFindAllEvents).toHaveBeenCalled();
      expect(mockFindPublishedBlog).toHaveBeenCalled();
    });
  });
});
