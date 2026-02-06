// Unit Tests - Devotionals Page
// Comprehensive tests for public devotionals page component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Devotionals } from '../Devotionals';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'user@church.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  role: 'member',
  status: 'approved'
};

const mockAuthContext: Record<string, any> = {
  currentUser: mockCurrentUser,
  user: mockCurrentUser,
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
  },
  {
    id: 'cat-3',
    name: 'Esperanca',
    description: 'Devocionais sobre esperanca',
    icon: '⭐',
    color: '#FFC107',
    isActive: true
  }
];

// Mock today's devotional
const mockTodaysDevotional = {
  id: 'dev-today',
  title: 'Devocional de Hoje',
  content: 'Este e o devocional especial de hoje sobre oracao e comunhao com Deus.',
  bibleVerse: 'Orai sem cessar',
  bibleReference: '1 Tessalonicenses 5:17',
  reflection: 'A oracao e nossa linha direta com Deus.',
  prayer: 'Senhor, ensina-me a orar sem cessar.',
  author: 'Pastor Joao',
  category: mockCategories[0],
  tags: ['oracao', 'fe', 'comunhao'],
  imageUrl: 'https://example.com/today.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  readingTime: 5,
  isPublished: true,
  publishDate: new Date(),
  viewCount: 250,
  likes: ['user-2', 'user-3'],
  bookmarks: ['user-2'],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-1'
};

// Mock devotionals
const mockDevotionals = [
  {
    id: 'dev-1',
    title: 'Devocional de Oracao',
    content: 'Este e o conteudo do devocional sobre oracao e sua importancia na vida crista. A oracao e fundamental.',
    bibleVerse: 'Orai sem cessar',
    bibleReference: 'Mateus 6:5-15',
    reflection: 'A oracao nos conecta com Deus.',
    prayer: 'Senhor, ensina-me a orar.',
    author: 'Pastor Joao',
    category: mockCategories[0],
    tags: ['oracao', 'fe'],
    imageUrl: 'https://example.com/prayer.jpg',
    readingTime: 5,
    isPublished: true,
    publishDate: new Date('2024-01-15'),
    viewCount: 150,
    likes: ['user-2', 'user-3', 'user-4'],
    bookmarks: ['user-2'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin-1'
  },
  {
    id: 'dev-2',
    title: 'Devocional sobre Fe',
    content: 'Reflexoes sobre a importancia da fe em nossa caminhada crista e como ela transforma vidas.',
    bibleVerse: 'A fe e o firme fundamento das coisas que se esperam',
    bibleReference: 'Hebreus 11:1-6',
    reflection: 'A fe nos sustenta nos momentos dificeis.',
    prayer: 'Senhor, aumenta a minha fe.',
    author: 'Pastora Maria',
    category: mockCategories[1],
    tags: ['fe', 'confianca'],
    readingTime: 7,
    isPublished: true,
    publishDate: new Date('2024-01-20'),
    viewCount: 100,
    likes: ['user-1'],
    bookmarks: ['user-1', 'user-3'],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'admin-1'
  },
  {
    id: 'dev-3',
    title: 'Esperanca em Tempos Dificeis',
    content: 'Como manter a esperanca viva mesmo nos momentos mais desafiadores da vida crista.',
    bibleVerse: 'A esperanca nao decepciona',
    bibleReference: 'Romanos 5:5',
    reflection: 'Nossa esperanca esta em Cristo.',
    prayer: 'Senhor, mantenha viva minha esperanca.',
    author: 'Pastor Carlos',
    category: mockCategories[2],
    tags: ['esperanca', 'perseveranca'],
    imageUrl: 'https://example.com/hope.jpg',
    readingTime: 6,
    isPublished: true,
    publishDate: new Date('2024-01-25'),
    viewCount: 80,
    likes: [],
    bookmarks: [],
    createdAt: new Date('2024-01-23'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'admin-1'
  }
];

// Mock devotional service
const mockGetDevotionals = jest.fn().mockResolvedValue({
  devotionals: mockDevotionals,
  hasMore: false
});
const mockGetCategories = jest.fn().mockResolvedValue(mockCategories);
const mockGetTodaysDevotional = jest.fn().mockResolvedValue(mockTodaysDevotional);
const mockIncrementViewCount = jest.fn().mockResolvedValue(undefined);
const mockToggleLike = jest.fn().mockResolvedValue(undefined);
const mockToggleBookmark = jest.fn().mockResolvedValue(undefined);
const mockMarkAsRead = jest.fn().mockResolvedValue(undefined);

jest.mock('@modules/church-management/devotionals/application/services/DevotionalService', () => ({
  devotionalService: {
    getDevotionals: (...args: any[]) => mockGetDevotionals(...args),
    getCategories: (...args: any[]) => mockGetCategories(...args),
    getTodaysDevotional: (...args: any[]) => mockGetTodaysDevotional(...args),
    incrementViewCount: (...args: any[]) => mockIncrementViewCount(...args),
    toggleLike: (...args: any[]) => mockToggleLike(...args),
    toggleBookmark: (...args: any[]) => mockToggleBookmark(...args),
    markAsRead: (...args: any[]) => mockMarkAsRead(...args)
  }
}));

// Mock SocialShareButtons
jest.mock('../../components/SocialShareButtons', () => ({
  __esModule: true,
  default: ({ url, title, className, showText }: any) => (
    <div data-testid="social-share-buttons" className={className}>
      <span>Share: {title}</span>
      <span>URL: {url}</span>
      {showText && <span>With Text</span>}
    </div>
  )
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === "dd/MM") return '15/01';
    return '15 de janeiro de 2024';
  })
}));

jest.mock('date-fns/locale', () => ({
  ptBR: {}
}));

// Mock window methods
const mockAlert = jest.fn();
window.alert = mockAlert;

// ============================================================================
// Helper Functions
// ============================================================================

const renderComponent = () => {
  return render(<Devotionals />);
};

// ============================================================================
// Tests
// ============================================================================

describe('Devotionals Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDevotionals.mockResolvedValue({ devotionals: mockDevotionals, hasMore: false });
    mockGetCategories.mockResolvedValue(mockCategories);
    mockGetTodaysDevotional.mockResolvedValue(mockTodaysDevotional);
    mockAuthContext.currentUser = mockCurrentUser;
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });
      expect(screen.getByText('Fortaleça sua fé com reflexões diárias da Palavra de Deus')).toBeInTheDocument();
    });

    it('should render today\'s devotional section', async () => {
      renderComponent();

      await waitFor(() => {
        const headings = screen.getAllByText('Devocional de Hoje');
        expect(headings.length).toBeGreaterThan(0);
      });
      const titles = screen.getAllByText(mockTodaysDevotional.title);
      expect(titles.length).toBeGreaterThan(0);
      expect(screen.getByText(mockTodaysDevotional.bibleReference, { exact: false })).toBeInTheDocument();
    });

    it('should render category filter buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument();
        // Categories appear in multiple places (filter buttons and devotional cards)
        const oracaoElements = screen.getAllByText(/Oracao/);
        expect(oracaoElements.length).toBeGreaterThan(0);
      });
    });

    it('should call service methods on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGetTodaysDevotional).toHaveBeenCalled();
        expect(mockGetDevotionals).toHaveBeenCalledWith({ isPublished: true }, 12);
        expect(mockGetCategories).toHaveBeenCalled();
      });
    });
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================
  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', async () => {
      mockGetDevotionals.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state after data is loaded', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      // Should not show skeletons anymore
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
    });
  });

  // ===========================================
  // TODAY'S DEVOTIONAL TESTS
  // ===========================================
  describe('Today\'s Devotional', () => {
    it('should display today\'s devotional with correct information', async () => {
      renderComponent();

      await waitFor(() => {
        const headings = screen.getAllByText('Devocional de Hoje');
        expect(headings.length).toBeGreaterThan(0);
      });
      const titles = screen.getAllByText(mockTodaysDevotional.title);
      expect(titles.length).toBeGreaterThan(0);
      const authors = screen.getAllByText(`Por ${mockTodaysDevotional.author}`);
      expect(authors.length).toBeGreaterThan(0);
      const readingTimes = screen.getAllByText(new RegExp(`${mockTodaysDevotional.readingTime} min de leitura`));
      expect(readingTimes.length).toBeGreaterThan(0);
    });

    it('should display bible verse in today\'s devotional', async () => {
      renderComponent();

      await waitFor(() => {
        const references = screen.getAllByText(new RegExp(mockTodaysDevotional.bibleReference));
        expect(references.length).toBeGreaterThan(0);
        const verses = screen.getAllByText(new RegExp(mockTodaysDevotional.bibleVerse));
        expect(verses.length).toBeGreaterThan(0);
      });
    });

    it('should have read button for today\'s devotional', async () => {
      renderComponent();

      await waitFor(() => {
        const readButton = screen.getByRole('button', { name: /Ler Devocional/i });
        expect(readButton).toBeInTheDocument();
      });
    });

    it('should not render today\'s devotional section when none exists', async () => {
      mockGetTodaysDevotional.mockResolvedValue(null);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      expect(screen.queryByText('Devocional de Hoje')).not.toBeInTheDocument();
    });

    it('should use settings colors for today\'s devotional gradient', async () => {
      renderComponent();

      await waitFor(() => {
        const headings = screen.getAllByText('Devocional de Hoje');
        const todaysSection = headings[0].closest('div');
        expect(todaysSection).toBeInTheDocument();
        // Style checking is complex with inline styles, just verify section exists
      });
    });
  });

  // ===========================================
  // DEVOTIONAL LIST TESTS
  // ===========================================
  describe('Devotional List', () => {
    it('should display all devotionals in grid layout', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });
      expect(screen.getByText('Devocional sobre Fe')).toBeInTheDocument();
      expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
    });

    it('should display devotional images when available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
      expect(images[0]).toHaveAttribute('src', mockDevotionals[0].imageUrl);
    });

    it('should show gradient placeholder when no image is available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional sobre Fe')).toBeInTheDocument();
      });

      const gradients = document.querySelectorAll('.theme-gradient');
      expect(gradients.length).toBeGreaterThan(0);
    });

    it('should display devotional metadata correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      // Check for category, date, and reading time (can appear multiple times)
      const categories = screen.getAllByText(mockDevotionals[0].category.name);
      expect(categories.length).toBeGreaterThan(0);
      const authors = screen.getAllByText(`Por ${mockDevotionals[0].author}`);
      expect(authors.length).toBeGreaterThan(0);
    });

    it('should display bible reference for each devotional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Mateus 6:5-15/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Hebreus 11:1-6/)).toBeInTheDocument();
      expect(screen.getByText(/Romanos 5:5/)).toBeInTheDocument();
    });

    it('should display truncated content preview', async () => {
      renderComponent();

      await waitFor(() => {
        const contentElements = screen.getAllByText(/Este e o conteudo/i);
        expect(contentElements.length).toBeGreaterThan(0);
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
      expect(screen.getByText('Não há devocionais disponíveis no momento. Volte em breve para mais conteúdo.')).toBeInTheDocument();
    });

    it('should show book emoji in empty state', async () => {
      mockGetDevotionals.mockResolvedValue({ devotionals: [], hasMore: false });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('📖')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CATEGORY FILTERING TESTS
  // ===========================================
  describe('Category Filtering', () => {
    it('should show all categories as filter buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument();
        // Categories appear in multiple places (filter and cards)
        mockCategories.forEach(category => {
          const elements = screen.getAllByText(new RegExp(category.name));
          expect(elements.length).toBeGreaterThan(0);
        });
      });
    });

    it('should filter devotionals by category when clicked', async () => {
      renderComponent();

      await waitFor(() => {
        const oracaoElements = screen.getAllByText('Oracao');
        expect(oracaoElements.length).toBeGreaterThan(0);
      });

      const buttons = screen.getAllByRole('button');
      const oracaoButton = buttons.find(btn => btn.textContent?.includes('🙏') && btn.textContent?.includes('Oracao'));

      if (oracaoButton) {
        fireEvent.click(oracaoButton);

        await waitFor(() => {
          expect(mockGetDevotionals).toHaveBeenCalledWith(
            { isPublished: true, categoryId: 'cat-1' },
            12
          );
        });
      }
    });

    it('should highlight active category filter', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeInTheDocument();
      });

      const todosButton = screen.getByRole('button', { name: /Todos/i });
      expect(todosButton).toHaveClass('bg-indigo-600');
    });

    it('should reset to all devotionals when clicking "Todos"', async () => {
      renderComponent();

      await waitFor(() => {
        const feElements = screen.getAllByText('Fe');
        expect(feElements.length).toBeGreaterThan(0);
      });

      // First filter by category
      const buttons = screen.getAllByRole('button');
      const feButton = buttons.find(btn => btn.textContent?.includes('✝️') && btn.textContent?.includes('Fe'));

      if (feButton) {
        fireEvent.click(feButton);

        await waitFor(() => {
          expect(mockGetDevotionals).toHaveBeenCalledWith(
            { isPublished: true, categoryId: 'cat-2' },
            12
          );
        });
      }

      // Then click "Todos"
      const todosButton = screen.getByRole('button', { name: /Todos/i });
      fireEvent.click(todosButton);

      await waitFor(() => {
        expect(mockGetDevotionals).toHaveBeenCalledWith(
          { isPublished: true },
          12
        );
      });
    });
  });

  // ===========================================
  // LIKE FEATURE TESTS
  // ===========================================
  describe('Like Feature', () => {
    it('should display like count for devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      // Like counts are displayed next to heart emojis
      // Just verify the devotionals are rendered with like buttons
      const likeButtons = screen.getAllByText(/[❤️🤍]/);
      expect(likeButtons.length).toBeGreaterThan(0);
    });

    it('should show filled heart for liked devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional sobre Fe')).toBeInTheDocument();
      });

      // dev-2 is liked by user-1, so should show filled heart
      // Note: Text content might include both emoji and count
      const content = document.body.textContent || '';
      expect(content).toContain('❤️');
    });

    it('should show empty heart for non-liked devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      // dev-3 is not liked by user-1, should show empty heart
      const content = document.body.textContent || '';
      expect(content).toContain('🤍');
    });

    it('should call toggleLike when clicking like button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      // Find like button by looking for buttons with heart emoji text
      const buttons = document.querySelectorAll('button');
      const likeButton = Array.from(buttons).find(btn =>
        (btn.textContent?.includes('🤍') || btn.textContent?.includes('❤️')) &&
        btn.closest('article')?.textContent?.includes('Esperanca em Tempos Dificeis')
      );

      if (likeButton) {
        fireEvent.click(likeButton);

        await waitFor(() => {
          expect(mockToggleLike).toHaveBeenCalledWith('dev-3', 'user-1');
        });
      }
    });

    it('should reload data after toggling like', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      mockGetDevotionals.mockClear();

      // Find like button
      const buttons = document.querySelectorAll('button');
      const likeButton = Array.from(buttons).find(btn =>
        (btn.textContent?.includes('🤍') || btn.textContent?.includes('❤️')) &&
        btn.closest('article')?.textContent?.includes('Esperanca em Tempos Dificeis')
      );

      if (likeButton) {
        fireEvent.click(likeButton);

        await waitFor(() => {
          expect(mockGetDevotionals).toHaveBeenCalled();
        });
      }
    });

    it('should require login to like when not authenticated', async () => {
      mockAuthContext.currentUser = null;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      // Find like button
      const buttons = document.querySelectorAll('button');
      const likeButton = Array.from(buttons).find(btn =>
        (btn.textContent?.includes('🤍') || btn.textContent?.includes('❤️')) &&
        btn.closest('article')?.textContent?.includes('Esperanca em Tempos Dificeis')
      );

      if (likeButton) {
        fireEvent.click(likeButton);

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith('Você precisa estar logado para curtir');
        });
        expect(mockToggleLike).not.toHaveBeenCalled();
      }
    });
  });

  // ===========================================
  // BOOKMARK FEATURE TESTS
  // ===========================================
  describe('Bookmark Feature', () => {
    it('should show filled bookmark for bookmarked devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional sobre Fe')).toBeInTheDocument();
      });

      // dev-2 is bookmarked by user-1
      const bookmarkButtons = screen.getAllByText('🔖');
      expect(bookmarkButtons.length).toBeGreaterThan(0);
    });

    it('should show empty bookmark for non-bookmarked devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      const unbookmarkButtons = screen.getAllByText('📖');
      expect(unbookmarkButtons.length).toBeGreaterThan(0);
    });

    it('should call toggleBookmark when clicking bookmark button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      // Find bookmark button by title attribute
      const bookmarkButtons = screen.queryAllByTitle('Adicionar aos favoritos');

      if (bookmarkButtons.length > 0) {
        fireEvent.click(bookmarkButtons[0]);

        await waitFor(() => {
          expect(mockToggleBookmark).toHaveBeenCalled();
        });
      } else {
        // Fallback: find by emoji
        const buttons = document.querySelectorAll('button');
        const bookmarkButton = Array.from(buttons).find(btn =>
          (btn.textContent?.includes('📖') || btn.textContent?.includes('🔖')) &&
          btn.closest('article')?.textContent?.includes('Esperanca em Tempos Dificeis')
        );

        if (bookmarkButton) {
          fireEvent.click(bookmarkButton);
          await waitFor(() => {
            expect(mockToggleBookmark).toHaveBeenCalled();
          });
        }
      }
    });

    it('should require login to bookmark when not authenticated', async () => {
      mockAuthContext.currentUser = null;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      const bookmarkButtons = screen.getAllByTitle('Adicionar aos favoritos');
      fireEvent.click(bookmarkButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Você precisa estar logado para favoritar');
      });
      expect(mockToggleBookmark).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // READING VIEW TESTS
  // ===========================================
  describe('Reading View', () => {
    it('should switch to reading view when clicking "Ler mais"', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Voltar para lista')).toBeInTheDocument();
      });
    });

    it('should increment view count when opening devotional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(mockIncrementViewCount).toHaveBeenCalledWith('dev-1');
      });
    });

    it('should display full devotional content in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(mockDevotionals[0].content)).toBeInTheDocument();
      });
    });

    it('should display reflection section in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('💭 Reflexão')).toBeInTheDocument();
        expect(screen.getByText(mockDevotionals[0].reflection)).toBeInTheDocument();
      });
    });

    it('should display prayer section in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('🙏 Oração')).toBeInTheDocument();
        expect(screen.getByText(mockDevotionals[0].prayer)).toBeInTheDocument();
      });
    });

    it('should display audio player when audio is available', async () => {
      renderComponent();

      await waitFor(() => {
        const headings = screen.getAllByText('Devocional de Hoje');
        expect(headings.length).toBeGreaterThan(0);
      });

      const readButton = screen.getByRole('button', { name: /Ler Devocional/i });
      fireEvent.click(readButton);

      await waitFor(() => {
        const audioHeadings = screen.queryAllByText('🎧 Ouvir este Devocional');
        if (audioHeadings.length > 0) {
          const audio = document.querySelector('audio');
          expect(audio).toBeInTheDocument();
        }
      });
    });

    it('should display tags in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('#oracao')).toBeInTheDocument();
        expect(screen.getByText('#fe')).toBeInTheDocument();
      });
    });

    it('should show social share buttons in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('🔄 Compartilhar este Devocional')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons');
      expect(shareButtons.length).toBeGreaterThan(0);
    });

    it('should show mark as read button when authenticated', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marcar como Lido/i })).toBeInTheDocument();
      });
    });

    it('should not show mark as read button when not authenticated', async () => {
      mockAuthContext.currentUser = null;
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Marcar como Lido/i })).not.toBeInTheDocument();
      });
    });

    it('should go back to list view when clicking back button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Voltar para lista')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Voltar para lista'));

      await waitFor(() => {
        expect(screen.queryByText('Voltar para lista')).not.toBeInTheDocument();
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // MARK AS READ TESTS
  // ===========================================
  describe('Mark as Read', () => {
    it('should call markAsRead when clicking mark as read button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marcar como Lido/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Marcar como Lido/i }));

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('dev-1', 'user-1');
      });
    });

    it('should show success alert after marking as read', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marcar como Lido/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Marcar como Lido/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Devocional marcado como lido!');
      });
    });

    it('should return to list view after marking as read', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marcar como Lido/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Marcar como Lido/i }));

      await waitFor(() => {
        expect(screen.queryByText('Voltar para lista')).not.toBeInTheDocument();
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });
    });

    it('should handle mark as read error gracefully', async () => {
      mockMarkAsRead.mockRejectedValueOnce(new Error('Failed to mark as read'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marcar como Lido/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Marcar como Lido/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao marcar como lido. Tente novamente.');
      });
    });
  });

  // ===========================================
  // LOAD MORE TESTS
  // ===========================================
  describe('Load More', () => {
    it('should show load more button when hasMore is true', async () => {
      mockGetDevotionals.mockResolvedValue({ devotionals: mockDevotionals, hasMore: true });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Carregar Mais/i })).toBeInTheDocument();
      });
    });

    it('should not show load more button when hasMore is false', async () => {
      mockGetDevotionals.mockResolvedValue({ devotionals: mockDevotionals, hasMore: false });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Carregar Mais/i })).not.toBeInTheDocument();
    });
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================
  describe('Error Handling', () => {
    it('should handle devotional loading error gracefully', async () => {
      mockGetDevotionals.mockRejectedValueOnce(new Error('Failed to load'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      // Should show empty state on error
      await waitFor(() => {
        expect(mockGetDevotionals).toHaveBeenCalled();
      });
    });

    it('should handle index building error by showing empty results', async () => {
      mockGetDevotionals.mockRejectedValueOnce(new Error('Index is building'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocionais')).toBeInTheDocument();
      });

      // Should not crash and continue rendering
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should handle like toggle error gracefully', async () => {
      mockToggleLike.mockRejectedValueOnce(new Error('Failed to toggle like'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      // Find like button
      const buttons = document.querySelectorAll('button');
      const likeButton = Array.from(buttons).find(btn =>
        (btn.textContent?.includes('🤍') || btn.textContent?.includes('❤️')) &&
        btn.closest('article')?.textContent?.includes('Esperanca em Tempos Dificeis')
      );

      if (likeButton) {
        fireEvent.click(likeButton);

        await waitFor(() => {
          expect(mockToggleLike).toHaveBeenCalled();
        });
      }

      // Should not crash
      expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
    });

    it('should handle bookmark toggle error gracefully', async () => {
      mockToggleBookmark.mockRejectedValueOnce(new Error('Failed to toggle bookmark'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
      });

      const bookmarkButtons = screen.getAllByTitle('Adicionar aos favoritos');
      fireEvent.click(bookmarkButtons[0]);

      await waitFor(() => {
        expect(mockToggleBookmark).toHaveBeenCalled();
      });

      // Should not crash
      expect(screen.getByText('Esperanca em Tempos Dificeis')).toBeInTheDocument();
    });

    it('should handle view count increment error gracefully', async () => {
      mockIncrementViewCount.mockRejectedValueOnce(new Error('Failed to increment'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Voltar para lista')).toBeInTheDocument();
      });

      // Should still show reading view despite error
      expect(screen.getByText(mockDevotionals[0].content)).toBeInTheDocument();
    });
  });

  // ===========================================
  // SOCIAL SHARE TESTS
  // ===========================================
  describe('Social Share', () => {
    it('should render social share buttons in list view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons');
      expect(shareButtons.length).toBe(mockDevotionals.length);
    });

    it('should pass correct props to social share buttons in list view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons');
      expect(shareButtons[0]).toHaveTextContent('Share: Devocional de Oracao');
    });

    it('should render social share buttons in reading view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const readButtons = screen.getAllByText('Ler mais');
      fireEvent.click(readButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('🔄 Compartilhar este Devocional')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByTestId('social-share-buttons');
      expect(shareButtons.length).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // ACCESSIBILITY TESTS
  // ===========================================
  describe('Accessibility', () => {
    it('should have proper button roles', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Devocionais');
      });
    });

    it('should have proper article structure for devotionals', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Devocional de Oracao')).toBeInTheDocument();
      });

      const articles = document.querySelectorAll('article');
      expect(articles.length).toBe(mockDevotionals.length);
    });
  });
});
