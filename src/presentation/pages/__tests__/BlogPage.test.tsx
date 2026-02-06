// Unit Tests - Blog Page
// Comprehensive tests for blog listing and filtering

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlogPage } from '../BlogPage';
import { FirebaseBlogRepository } from '@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository';
import { BlogPost, PostStatus, PostVisibility } from '@modules/content-management/blog/domain/entities/BlogPost';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

// Mock the auth context
const mockCurrentUser = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'member',
  status: 'approved'
};

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock the blog repository
jest.mock('@modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository');

// Mock SocialShareButtons component
jest.mock('../../components/SocialShareButtons', () => ({
  __esModule: true,
  default: () => <div data-testid="social-share">Share Buttons</div>
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') {
      return '01/01/2025';
    }
    return '01/01';
  }
}));

// Helper to create mock blog posts
const createMockPost = (overrides?: Partial<BlogPost>): BlogPost => ({
  id: 'post-1',
  title: 'Test Blog Post',
  content: '<p>This is the full content of the blog post.</p>',
  excerpt: 'This is an excerpt of the blog post.',
  categories: ['Estudos'],
  tags: ['fe', 'esperanca'],
  author: {
    id: 'author-1',
    name: 'John Doe',
    photoURL: 'https://example.com/photo.jpg',
    role: 'admin'
  },
  status: PostStatus.Published,
  visibility: PostVisibility.Public,
  featuredImage: 'https://example.com/image.jpg',
  publishedAt: new Date('2025-01-01'),
  likes: 10,
  views: 100,
  commentsEnabled: true,
  isHighlighted: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides
});

describe('BlogPage', () => {
  let mockBlogRepository: jest.Mocked<FirebaseBlogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      currentUser: mockCurrentUser
    });

    // Setup blog repository mock
    mockBlogRepository = new FirebaseBlogRepository() as jest.Mocked<FirebaseBlogRepository>;
    mockBlogRepository.findPublished = jest.fn().mockResolvedValue([]);
    mockBlogRepository.hasUserLiked = jest.fn().mockResolvedValue(false);
    mockBlogRepository.likePost = jest.fn().mockResolvedValue(undefined);
    mockBlogRepository.unlikePost = jest.fn().mockResolvedValue(undefined);

    (FirebaseBlogRepository as jest.MockedClass<typeof FirebaseBlogRepository>).mockImplementation(() => mockBlogRepository);
  });

  const renderBlogPage = () => {
    return render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading skeletons while posts are loading', () => {
      mockBlogRepository.findPublished.mockImplementation(() => new Promise(() => {}));

      renderBlogPage();

      // Check for loading skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show search and filters skeleton', () => {
      mockBlogRepository.findPublished.mockImplementation(() => new Promise(() => {}));

      renderBlogPage();

      // Check for search input skeleton
      const loadingElements = document.querySelectorAll('.bg-gray-200');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show featured post skeleton', () => {
      mockBlogRepository.findPublished.mockImplementation(() => new Promise(() => {}));

      renderBlogPage();

      // Featured post skeleton should have specific height
      const featuredSkeleton = document.querySelector('.h-64.bg-gray-200');
      expect(featuredSkeleton).toBeInTheDocument();
    });

    it('should show grid skeleton with multiple cards', () => {
      mockBlogRepository.findPublished.mockImplementation(() => new Promise(() => {}));

      renderBlogPage();

      // Grid skeleton should have h-48 elements for card images
      const cardSkeletons = document.querySelectorAll('.h-48.bg-gray-200');
      expect(cardSkeletons.length).toBeGreaterThan(0);
    });

    it('should not show loading state after posts are loaded', async () => {
      const mockPosts = [createMockPost()];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBe(0);
      });
    });
  });

  describe('Blog Post List Rendering', () => {
    it('should render list of blog posts', async () => {
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'First Post' }),
        createMockPost({ id: 'post-2', title: 'Second Post' }),
        createMockPost({ id: 'post-3', title: 'Third Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('First Post');
        expect(titles).toContain('Second Post');
        expect(titles).toContain('Third Post');
      });
    });

    it('should render post excerpts', async () => {
      const mockPosts = [
        createMockPost({ excerpt: 'This is the first excerpt.' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('This is the first excerpt.')).toBeInTheDocument();
      });
    });

    it('should render post metadata (author, date, views)', async () => {
      const mockPosts = [
        createMockPost({
          author: { id: '1', name: 'Jane Smith', role: 'admin' },
          views: 250
        })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
        expect(screen.getByText(/250 views/i)).toBeInTheDocument();
      });
    });

    it('should render post categories', async () => {
      const mockPosts = [
        createMockPost({ categories: ['Estudos', 'Devocional'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        // Category appears in the filter buttons and in the post
        const estudosElements = screen.getAllByText('Estudos');
        expect(estudosElements.length).toBeGreaterThan(0);
      });
    });

    it('should render post tags', async () => {
      const mockPosts = [
        createMockPost({ tags: ['fe', 'esperanca', 'amor'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('#fe')).toBeInTheDocument();
        expect(screen.getByText('#esperanca')).toBeInTheDocument();
        expect(screen.getByText('#amor')).toBeInTheDocument();
      });
    });

    it('should render featured image when available', async () => {
      const mockPosts = [
        createMockPost({
          title: 'Post with Image',
          featuredImage: 'https://example.com/featured.jpg'
        })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const image = screen.getByAltText('Post with Image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/featured.jpg');
      });
    });

    it('should render gradient placeholder when no featured image', async () => {
      const mockPosts = [
        createMockPost({ featuredImage: undefined })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const gradients = document.querySelectorAll('.theme-gradient');
        expect(gradients.length).toBeGreaterThan(0);
      });
    });

    it('should render like count for each post', async () => {
      const mockPosts = [
        createMockPost({ likes: 42 })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('🤍 42')).toBeInTheDocument();
      });
    });
  });

  describe('Highlighted Post', () => {
    it('should render highlighted post separately', async () => {
      const mockPosts = [
        createMockPost({ id: 'highlighted', title: 'Highlighted Post', isHighlighted: true }),
        createMockPost({ id: 'regular', title: 'Regular Post', isHighlighted: false })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        // Should show "Destaque" badge
        expect(screen.getByText('⭐ Destaque')).toBeInTheDocument();
        const headings = screen.getAllByRole('heading');
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Highlighted Post');
      });
    });

    it('should render highlighted post with larger layout', async () => {
      const mockPosts = [
        createMockPost({ id: 'highlighted', title: 'Highlighted Post', isHighlighted: true })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const h2Elements = screen.getAllByRole('heading', { level: 2 });
        const highlightedTitle = h2Elements.find(h => h.textContent === 'Highlighted Post');
        expect(highlightedTitle).toBeDefined();
        // Highlighted post has text-2xl class
        expect(highlightedTitle).toHaveClass('text-2xl');
      });
    });

    it('should not show highlighted post when category filter is active', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'highlighted', title: 'Highlighted Post', isHighlighted: true, categories: ['Estudos'] }),
        createMockPost({ id: 'regular', title: 'Regular Post', isHighlighted: false, categories: ['Devocional'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('⭐ Destaque')).toBeInTheDocument();
      });

      // Click on Devocional category
      const devocionalButton = await screen.findByRole('button', { name: 'Devocional' });
      fireEvent.click(devocionalButton);

      await waitFor(() => {
        expect(screen.queryByText('⭐ Destaque')).not.toBeInTheDocument();
      });
    });

    it('should not show highlighted post when search is active', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'highlighted', title: 'Highlighted Post', isHighlighted: true }),
        createMockPost({ id: 'regular', title: 'Regular Post', isHighlighted: false })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('⭐ Destaque')).toBeInTheDocument();
      });

      // Type in search box
      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'Regular' } });

      await waitFor(() => {
        expect(screen.queryByText('⭐ Destaque')).not.toBeInTheDocument();
      });
    });

    it('should show more tags in highlighted post', async () => {
      const mockPosts = [
        createMockPost({
          isHighlighted: true,
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
        })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        // Highlighted post shows up to 4 tags
        expect(screen.getByText('#tag1')).toBeInTheDocument();
        expect(screen.getByText('#tag2')).toBeInTheDocument();
        expect(screen.getByText('#tag3')).toBeInTheDocument();
        expect(screen.getByText('#tag4')).toBeInTheDocument();
      });
    });
  });

  describe('Category Filtering', () => {
    it('should display "Todas" category button', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Todas' })).toBeInTheDocument();
      });
    });

    it('should display all unique categories from posts', async () => {
      const mockPosts = [
        createMockPost({ categories: ['Estudos', 'Devocional'] }),
        createMockPost({ categories: ['Devocional', 'Testemunho'] }),
        createMockPost({ categories: ['Estudos'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Devocional' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Estudos' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Testemunho' })).toBeInTheDocument();
      });
    });

    it('should filter posts by selected category', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Study Post', categories: ['Estudos'] }),
        createMockPost({ id: 'post-2', title: 'Devotional Post', categories: ['Devocional'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Study Post');
        expect(titles).toContain('Devotional Post');
      });

      // Click on Estudos category
      const estudosButton = await screen.findByRole('button', { name: 'Estudos' });
      fireEvent.click(estudosButton);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Study Post');
        expect(titles).not.toContain('Devotional Post');
      });
    });

    it('should highlight selected category button', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ categories: ['Estudos'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const todasButton = screen.getByRole('button', { name: 'Todas' });
        expect(todasButton).toHaveClass('bg-indigo-600', 'text-white');
      });

      // Click on Estudos category
      const estudosButton = await screen.findByRole('button', { name: 'Estudos' });
      fireEvent.click(estudosButton);

      await waitFor(() => {
        expect(estudosButton).toHaveClass('bg-indigo-600', 'text-white');
      });
    });

    it('should show all posts when "Todas" is selected', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Study Post', categories: ['Estudos'] }),
        createMockPost({ id: 'post-2', title: 'Devotional Post', categories: ['Devocional'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      // First, filter by category
      const estudosButton = await screen.findByRole('button', { name: 'Estudos' });
      fireEvent.click(estudosButton);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Study Post');
      });

      // Then click "Todas"
      const todasButton = await screen.findByRole('button', { name: 'Todas' });
      fireEvent.click(todasButton);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Study Post');
        expect(titles).toContain('Devotional Post');
      });
    });

    it('should sort categories alphabetically', async () => {
      const mockPosts = [
        createMockPost({ categories: ['Zebra', 'Alpha', 'Beta'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const categoryButtons = buttons.filter(btn =>
          btn.textContent && !btn.textContent.includes('Ler mais') && !btn.textContent.includes('Ler menos')
        );
        const categoryTexts = categoryButtons.map(btn => btn.textContent);

        // "Todas" should be first, then alphabetically
        expect(categoryTexts[0]).toBe('Todas');
        expect(categoryTexts.indexOf('Alpha')).toBeLessThan(categoryTexts.indexOf('Beta'));
        expect(categoryTexts.indexOf('Beta')).toBeLessThan(categoryTexts.indexOf('Zebra'));
      });
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar postagens...')).toBeInTheDocument();
      });
    });

    it('should filter posts by title', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Faith and Hope' }),
        createMockPost({ id: 'post-2', title: 'Love and Grace' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Faith and Hope');
        expect(titles).toContain('Love and Grace');
      });

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'Faith' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Faith and Hope');
        expect(titles).not.toContain('Love and Grace');
      });
    });

    it('should filter posts by excerpt', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Post One', excerpt: 'This talks about prayer' }),
        createMockPost({ id: 'post-2', title: 'Post Two', excerpt: 'This talks about worship' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'prayer' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Post One');
        expect(titles).not.toContain('Post Two');
      });
    });

    it('should filter posts by tags', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Post One', tags: ['bible', 'study'] }),
        createMockPost({ id: 'post-2', title: 'Post Two', tags: ['music', 'worship'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'bible' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Post One');
        expect(titles).not.toContain('Post Two');
      });
    });

    it('should be case-insensitive', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ title: 'Faith and Hope' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'FAITH' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Faith and Hope');
      });
    });

    it('should combine search with category filter', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'Study on Faith', categories: ['Estudos'] }),
        createMockPost({ id: 'post-2', title: 'Faith Devotional', categories: ['Devocional'] }),
        createMockPost({ id: 'post-3', title: 'Hope Devotional', categories: ['Devocional'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      // Filter by category first
      const devocionalButton = await screen.findByRole('button', { name: 'Devocional' });
      fireEvent.click(devocionalButton);

      // Then search
      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'Faith' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Faith Devotional');
        expect(titles).not.toContain('Study on Faith');
        expect(titles).not.toContain('Hope Devotional');
      });
    });

    it('should clear search results when input is cleared', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', title: 'First Post' }),
        createMockPost({ id: 'post-2', title: 'Second Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('First Post');
        expect(titles).not.toContain('Second Post');
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('First Post');
        expect(titles).toContain('Second Post');
      });
    });
  });

  describe('Post Interactions', () => {
    it('should toggle post content on "Ler mais" click', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({
          title: 'Test Post',
          excerpt: 'Short excerpt',
          content: '<p>Full content here</p>'
        })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('Short excerpt')).toBeInTheDocument();
      });

      const readMoreButtons = await screen.findAllByRole('button', { name: 'Ler mais' });
      fireEvent.click(readMoreButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Full content here')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ler menos' })).toBeInTheDocument();
      });
    });

    it('should collapse post content on "Ler menos" click', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({
          excerpt: 'Short excerpt',
          content: '<p>Full content here</p>'
        })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      // Expand first
      const readMoreButtons = await screen.findAllByRole('button', { name: 'Ler mais' });
      fireEvent.click(readMoreButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Full content here')).toBeInTheDocument();
      });

      // Collapse
      const readLessButton = await screen.findByRole('button', { name: 'Ler menos' });
      fireEvent.click(readLessButton);

      await waitFor(() => {
        expect(screen.queryByText('Full content here')).not.toBeInTheDocument();
        expect(screen.getByText('Short excerpt')).toBeInTheDocument();
      });
    });

    it('should like a post when heart is clicked', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', likes: 5 })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);
      mockBlogRepository.hasUserLiked.mockResolvedValue(false);

      renderBlogPage();

      await waitFor(() => {
        const likeTexts = screen.getAllByText(/🤍 5/);
        expect(likeTexts.length).toBeGreaterThan(0);
      });

      // Find all like buttons and click the first one
      const likeButtons = screen.getAllByText(/🤍 5/);
      fireEvent.click(likeButtons[0].closest('button')!);

      await waitFor(() => {
        expect(mockBlogRepository.likePost).toHaveBeenCalledWith('post-1', 'user-1');
        expect(screen.getByText(/❤️ 6/)).toBeInTheDocument();
      });
    });

    it('should unlike a post when heart is clicked on liked post', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ id: 'post-1', likes: 5 })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);
      mockBlogRepository.hasUserLiked.mockResolvedValue(true);

      renderBlogPage();

      await waitFor(() => {
        const likeTexts = screen.getAllByText(/❤️ 5/);
        expect(likeTexts.length).toBeGreaterThan(0);
      });

      const likeButtons = screen.getAllByText(/❤️ 5/);
      fireEvent.click(likeButtons[0].closest('button')!);

      await waitFor(() => {
        expect(mockBlogRepository.unlikePost).toHaveBeenCalledWith('post-1', 'user-1');
        expect(screen.getByText(/🤍 4/)).toBeInTheDocument();
      });
    });

    it('should not allow liking when user is not authenticated', async () => {
      // Using fireEvent for interactions
      mockUseAuth.mockReturnValue({ currentUser: null });

      const mockPosts = [
        createMockPost({ id: 'post-1', likes: 5 })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const likeTexts = screen.getAllByText(/🤍 5/);
        expect(likeTexts.length).toBeGreaterThan(0);
      });

      const likeButtons = screen.getAllByText(/🤍 5/);
      fireEvent.click(likeButtons[0].closest('button')!);

      // Should not call repository methods
      await waitFor(() => {
        expect(mockBlogRepository.likePost).not.toHaveBeenCalled();
      });
    });

    it('should render social share buttons', async () => {
      const mockPosts = [
        createMockPost({ title: 'Shareable Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const shareButtons = screen.getAllByTestId('social-share');
        expect(shareButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no posts are published', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('Nenhuma postagem disponível')).toBeInTheDocument();
        expect(screen.getByText(/não há postagens publicadas no momento/i)).toBeInTheDocument();
      });
    });

    it('should show empty state icon', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText('📝')).toBeInTheDocument();
      });
    });

    it('should show no results state when search returns no matches', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ title: 'Test Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      const searchInput = await screen.findByPlaceholderText('Buscar postagens...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhuma postagem encontrada')).toBeInTheDocument();
        expect(screen.getByText(/tente ajustar os filtros/i)).toBeInTheDocument();
      });
    });

    it('should show no results state when category filter returns no matches', async () => {
      // Using fireEvent for interactions
      const mockPosts = [
        createMockPost({ categories: ['Estudos'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      // Wait for posts to load and get categories
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Estudos' })).toBeInTheDocument();
      });

      // Need to add another post with different category first
      mockBlogRepository.findPublished.mockResolvedValue([
        createMockPost({ id: 'post-1', categories: ['Estudos'] }),
        createMockPost({ id: 'post-2', categories: ['Devocional'] })
      ]);

      // Re-render
      renderBlogPage();

      const devocionalButton = await screen.findByRole('button', { name: 'Devocional' });
      fireEvent.click(devocionalButton);

      // Now search for something that doesn't exist in Devocional
      const searchInputs = screen.getAllByPlaceholderText('Buscar postagens...');
      const searchInput = searchInputs[searchInputs.length - 1]; // Use the last one (most recent render)
      fireEvent.change(searchInput, { target: { value: 'xyz' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhuma postagem encontrada')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockBlogRepository.findPublished.mockRejectedValue(new Error('Database error'));

      renderBlogPage();

      await waitFor(() => {
        // Should show empty state instead of crashing
        expect(screen.getByText('Nenhuma postagem disponível')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading blog posts:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle like/unlike errors gracefully', async () => {
      // Using fireEvent for interactions
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockPosts = [
        createMockPost({ id: 'post-1', likes: 5 })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);
      mockBlogRepository.hasUserLiked.mockResolvedValue(false);
      mockBlogRepository.likePost.mockRejectedValue(new Error('Network error'));

      renderBlogPage();

      await waitFor(() => {
        const likeTexts = screen.getAllByText(/🤍 5/);
        expect(likeTexts.length).toBeGreaterThan(0);
      });

      const likeButtons = screen.getAllByText(/🤍 5/);
      fireEvent.click(likeButtons[0].closest('button')!);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error toggling like:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle hasUserLiked errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockPosts = [
        createMockPost({ id: 'post-1' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);
      mockBlogRepository.hasUserLiked.mockRejectedValue(new Error('Database error'));

      renderBlogPage();

      await waitFor(() => {
        // Should still render the post
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Test Blog Post');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Visibility Filtering', () => {
    it('should show public posts to all users', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      const mockPosts = [
        createMockPost({ visibility: PostVisibility.Public, title: 'Public Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Public Post');
      });
    });

    it('should show members-only posts only to authenticated users', async () => {
      const mockPosts = [
        createMockPost({ visibility: PostVisibility.MembersOnly, title: 'Members Only Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Members Only Post');
      });
    });

    it('should not show members-only posts to non-authenticated users', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      const mockPosts = [
        createMockPost({ visibility: PostVisibility.MembersOnly, title: 'Members Only Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.queryByText('Members Only Post')).not.toBeInTheDocument();
      });
    });

    it('should not show private posts to regular users', async () => {
      const mockPosts = [
        createMockPost({ visibility: PostVisibility.Private, title: 'Private Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.queryByText('Private Post')).not.toBeInTheDocument();
      });
    });

    it('should filter posts by visibility before rendering', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      const mockPosts = [
        createMockPost({ id: 'post-1', visibility: PostVisibility.Public, title: 'Public' }),
        createMockPost({ id: 'post-2', visibility: PostVisibility.MembersOnly, title: 'Members' }),
        createMockPost({ id: 'post-3', visibility: PostVisibility.Private, title: 'Private' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        const titles = headings.map(h => h.textContent);
        expect(titles).toContain('Public');
        expect(titles).not.toContain('Members');
        expect(titles).not.toContain('Private');
      });
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        expect(screen.getByText(/mensagens, reflexões e estudos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const mockPosts = [
        createMockPost({ title: 'Test Post' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1, name: 'Blog' });
        expect(h1).toBeInTheDocument();
      });
    });

    it('should have proper article semantics', async () => {
      const mockPosts = [
        createMockPost({ id: 'post-1' }),
        createMockPost({ id: 'post-2' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const articles = screen.getAllByRole('article');
        expect(articles.length).toBe(2);
      });
    });

    it('should have accessible buttons', async () => {
      const mockPosts = [
        createMockPost({ categories: ['Estudos'] })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const categoryButton = screen.getByRole('button', { name: 'Estudos' });
        expect(categoryButton).toBeInTheDocument();

        const readMoreButton = screen.getByRole('button', { name: 'Ler mais' });
        expect(readMoreButton).toBeInTheDocument();
      });
    });

    it('should have accessible form inputs', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar postagens...');
        expect(searchInput).toHaveAttribute('type', 'text');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', async () => {
      const mockPosts = [
        createMockPost({ id: 'post-1' })
      ];
      mockBlogRepository.findPublished.mockResolvedValue(mockPosts);

      renderBlogPage();

      await waitFor(() => {
        const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should have responsive search and filter layout', async () => {
      mockBlogRepository.findPublished.mockResolvedValue([]);

      renderBlogPage();

      await waitFor(() => {
        const flexContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
        expect(flexContainer).toBeInTheDocument();
      });
    });
  });
});
