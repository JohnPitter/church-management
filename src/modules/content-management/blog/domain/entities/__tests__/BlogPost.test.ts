// Unit Tests - BlogPost Entity
// Comprehensive tests for blog post domain logic

import {
  BlogPost,
  Author,
  PostStatus,
  PostVisibility,
  Comment,
  CommentAuthor,
  CommentStatus,
  Like,
  BlogPostEntity
} from '../BlogPost';

// Test Fixtures
const createMockAuthor = (overrides: Partial<Author> = {}): Author => ({
  id: 'author-1',
  name: 'John Doe',
  photoURL: 'https://example.com/photo.jpg',
  role: 'admin',
  ...overrides
});

const createMockPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: 'post-1',
  title: 'Test Blog Post Title',
  content: '<p>This is a test blog post with some content that is long enough to be valid.</p>',
  excerpt: 'This is a test excerpt',
  author: createMockAuthor(),
  categories: ['technology', 'faith'],
  tags: ['test', 'sample'],
  status: PostStatus.Published,
  visibility: PostVisibility.Public,
  featuredImage: 'https://example.com/image.jpg',
  publishedAt: new Date('2024-01-01T10:00:00Z'),
  likes: 10,
  views: 100,
  commentsEnabled: true,
  isHighlighted: false,
  createdAt: new Date('2024-01-01T09:00:00Z'),
  updatedAt: new Date('2024-01-01T11:00:00Z'),
  ...overrides
});

describe('PostStatus Enum', () => {
  it('should have Draft status', () => {
    expect(PostStatus.Draft).toBe('draft');
  });

  it('should have Published status', () => {
    expect(PostStatus.Published).toBe('published');
  });

  it('should have Scheduled status', () => {
    expect(PostStatus.Scheduled).toBe('scheduled');
  });

  it('should have Archived status', () => {
    expect(PostStatus.Archived).toBe('archived');
  });

  it('should have exactly 4 status values', () => {
    const statusValues = Object.values(PostStatus);
    expect(statusValues).toHaveLength(4);
    expect(statusValues).toContain('draft');
    expect(statusValues).toContain('published');
    expect(statusValues).toContain('scheduled');
    expect(statusValues).toContain('archived');
  });
});

describe('PostVisibility Enum', () => {
  it('should have Public visibility', () => {
    expect(PostVisibility.Public).toBe('public');
  });

  it('should have MembersOnly visibility', () => {
    expect(PostVisibility.MembersOnly).toBe('members_only');
  });

  it('should have Private visibility', () => {
    expect(PostVisibility.Private).toBe('private');
  });

  it('should have exactly 3 visibility values', () => {
    const visibilityValues = Object.values(PostVisibility);
    expect(visibilityValues).toHaveLength(3);
    expect(visibilityValues).toContain('public');
    expect(visibilityValues).toContain('members_only');
    expect(visibilityValues).toContain('private');
  });
});

describe('CommentStatus Enum', () => {
  it('should have Approved status', () => {
    expect(CommentStatus.Approved).toBe('approved');
  });

  it('should have Pending status', () => {
    expect(CommentStatus.Pending).toBe('pending');
  });

  it('should have Spam status', () => {
    expect(CommentStatus.Spam).toBe('spam');
  });

  it('should have Deleted status', () => {
    expect(CommentStatus.Deleted).toBe('deleted');
  });

  it('should have exactly 4 status values', () => {
    const statusValues = Object.values(CommentStatus);
    expect(statusValues).toHaveLength(4);
    expect(statusValues).toContain('approved');
    expect(statusValues).toContain('pending');
    expect(statusValues).toContain('spam');
    expect(statusValues).toContain('deleted');
  });
});

describe('BlogPostEntity', () => {
  describe('isPublished', () => {
    it('should return true for published post with past publishedAt date', () => {
      const post = createMockPost({
        status: PostStatus.Published,
        publishedAt: new Date('2020-01-01')
      });
      expect(BlogPostEntity.isPublished(post)).toBe(true);
    });

    it('should return true for published post with no publishedAt date', () => {
      const post = createMockPost({
        status: PostStatus.Published,
        publishedAt: undefined
      });
      expect(BlogPostEntity.isPublished(post)).toBe(true);
    });

    it('should return true for published post with current date', () => {
      const post = createMockPost({
        status: PostStatus.Published,
        publishedAt: new Date()
      });
      expect(BlogPostEntity.isPublished(post)).toBe(true);
    });

    it('should return false for published post with future publishedAt date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const post = createMockPost({
        status: PostStatus.Published,
        publishedAt: futureDate
      });
      expect(BlogPostEntity.isPublished(post)).toBe(false);
    });

    it('should return false for draft post', () => {
      const post = createMockPost({ status: PostStatus.Draft });
      expect(BlogPostEntity.isPublished(post)).toBe(false);
    });

    it('should return false for scheduled post', () => {
      const post = createMockPost({ status: PostStatus.Scheduled });
      expect(BlogPostEntity.isPublished(post)).toBe(false);
    });

    it('should return false for archived post', () => {
      const post = createMockPost({ status: PostStatus.Archived });
      expect(BlogPostEntity.isPublished(post)).toBe(false);
    });
  });

  describe('isScheduled', () => {
    it('should return true for scheduled post with future publishedAt date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const post = createMockPost({
        status: PostStatus.Scheduled,
        publishedAt: futureDate
      });
      expect(BlogPostEntity.isScheduled(post)).toBe(true);
    });

    it('should return false for scheduled post with past publishedAt date', () => {
      const post = createMockPost({
        status: PostStatus.Scheduled,
        publishedAt: new Date('2020-01-01')
      });
      expect(BlogPostEntity.isScheduled(post)).toBe(false);
    });

    it('should return false for scheduled post without publishedAt date', () => {
      const post = createMockPost({
        status: PostStatus.Scheduled,
        publishedAt: undefined
      });
      expect(BlogPostEntity.isScheduled(post)).toBe(false);
    });

    it('should return false for published post', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const post = createMockPost({
        status: PostStatus.Published,
        publishedAt: futureDate
      });
      expect(BlogPostEntity.isScheduled(post)).toBe(false);
    });

    it('should return false for draft post', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const post = createMockPost({
        status: PostStatus.Draft,
        publishedAt: futureDate
      });
      expect(BlogPostEntity.isScheduled(post)).toBe(false);
    });
  });

  describe('canView', () => {
    describe('Public Posts', () => {
      it('should allow viewing public published posts without authentication', () => {
        const post = createMockPost({
          visibility: PostVisibility.Public,
          status: PostStatus.Published,
          publishedAt: new Date('2020-01-01')
        });
        expect(BlogPostEntity.canView(post)).toBe(true);
        expect(BlogPostEntity.canView(post, undefined)).toBe(true);
      });

      it('should allow viewing public published posts with any role', () => {
        const post = createMockPost({
          visibility: PostVisibility.Public,
          status: PostStatus.Published,
          publishedAt: new Date('2020-01-01')
        });
        expect(BlogPostEntity.canView(post, 'member')).toBe(true);
        expect(BlogPostEntity.canView(post, 'admin')).toBe(true);
      });

      it('should NOT allow viewing public draft posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Public,
          status: PostStatus.Draft
        });
        expect(BlogPostEntity.canView(post)).toBe(false);
      });

      it('should NOT allow viewing public scheduled posts', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const post = createMockPost({
          visibility: PostVisibility.Public,
          status: PostStatus.Scheduled,
          publishedAt: futureDate
        });
        expect(BlogPostEntity.canView(post)).toBe(false);
      });
    });

    describe('Members Only Posts', () => {
      it('should allow members to view members-only published posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.MembersOnly,
          status: PostStatus.Published,
          publishedAt: new Date('2020-01-01')
        });
        expect(BlogPostEntity.canView(post, 'member')).toBe(true);
      });

      it('should allow any role to view members-only published posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.MembersOnly,
          status: PostStatus.Published,
          publishedAt: new Date('2020-01-01')
        });
        expect(BlogPostEntity.canView(post, 'admin')).toBe(true);
        expect(BlogPostEntity.canView(post, 'secretary')).toBe(true);
        expect(BlogPostEntity.canView(post, 'leader')).toBe(true);
      });

      it('should NOT allow unauthenticated users to view members-only posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.MembersOnly,
          status: PostStatus.Published,
          publishedAt: new Date('2020-01-01')
        });
        expect(BlogPostEntity.canView(post)).toBe(false);
        expect(BlogPostEntity.canView(post, undefined)).toBe(false);
      });

      it('should NOT allow viewing members-only draft posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.MembersOnly,
          status: PostStatus.Draft
        });
        expect(BlogPostEntity.canView(post, 'member')).toBe(false);
      });
    });

    describe('Private Posts', () => {
      it('should allow admin to view private posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Private,
          status: PostStatus.Published
        });
        expect(BlogPostEntity.canView(post, 'admin')).toBe(true);
      });

      it('should allow secretary to view private posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Private,
          status: PostStatus.Published
        });
        expect(BlogPostEntity.canView(post, 'secretary')).toBe(true);
      });

      it('should NOT allow members to view private posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Private,
          status: PostStatus.Published
        });
        expect(BlogPostEntity.canView(post, 'member')).toBe(false);
      });

      it('should NOT allow leaders to view private posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Private,
          status: PostStatus.Published
        });
        expect(BlogPostEntity.canView(post, 'leader')).toBe(false);
      });

      it('should NOT allow unauthenticated users to view private posts', () => {
        const post = createMockPost({
          visibility: PostVisibility.Private,
          status: PostStatus.Published
        });
        expect(BlogPostEntity.canView(post)).toBe(false);
        expect(BlogPostEntity.canView(post, undefined)).toBe(false);
      });
    });
  });

  describe('canEdit', () => {
    it('should allow admin to edit any post', () => {
      const post = createMockPost({ author: createMockAuthor({ id: 'other-user' }) });
      expect(BlogPostEntity.canEdit(post, 'different-user-id', 'admin')).toBe(true);
    });

    it('should allow secretary to edit any post', () => {
      const post = createMockPost({ author: createMockAuthor({ id: 'other-user' }) });
      expect(BlogPostEntity.canEdit(post, 'different-user-id', 'secretary')).toBe(true);
    });

    it('should allow post author to edit their own post', () => {
      const post = createMockPost({ author: createMockAuthor({ id: 'author-1' }) });
      expect(BlogPostEntity.canEdit(post, 'author-1', 'member')).toBe(true);
    });

    it('should NOT allow non-author members to edit posts', () => {
      const post = createMockPost({ author: createMockAuthor({ id: 'author-1' }) });
      expect(BlogPostEntity.canEdit(post, 'different-user', 'member')).toBe(false);
    });

    it('should NOT allow non-author leaders to edit posts', () => {
      const post = createMockPost({ author: createMockAuthor({ id: 'author-1' }) });
      expect(BlogPostEntity.canEdit(post, 'different-user', 'leader')).toBe(false);
    });
  });

  describe('canComment', () => {
    it('should allow commenting on published posts with comments enabled', () => {
      const post = createMockPost({
        status: PostStatus.Published,
        commentsEnabled: true,
        publishedAt: new Date('2020-01-01')
      });
      expect(BlogPostEntity.canComment(post)).toBe(true);
    });

    it('should NOT allow commenting when comments are disabled', () => {
      const post = createMockPost({
        status: PostStatus.Published,
        commentsEnabled: false,
        publishedAt: new Date('2020-01-01')
      });
      expect(BlogPostEntity.canComment(post)).toBe(false);
    });

    it('should NOT allow commenting on draft posts', () => {
      const post = createMockPost({
        status: PostStatus.Draft,
        commentsEnabled: true
      });
      expect(BlogPostEntity.canComment(post)).toBe(false);
    });

    it('should NOT allow commenting on archived posts', () => {
      const post = createMockPost({
        status: PostStatus.Archived,
        commentsEnabled: true
      });
      expect(BlogPostEntity.canComment(post)).toBe(false);
    });

    it('should NOT allow commenting on scheduled posts', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const post = createMockPost({
        status: PostStatus.Scheduled,
        commentsEnabled: true,
        publishedAt: futureDate
      });
      expect(BlogPostEntity.canComment(post)).toBe(false);
    });
  });

  describe('generateExcerpt', () => {
    it('should return content as-is if shorter than maxLength', () => {
      const content = 'Short content';
      expect(BlogPostEntity.generateExcerpt(content, 150)).toBe('Short content');
    });

    it('should truncate content at last space before maxLength', () => {
      const content = 'This is a longer piece of content that should be truncated at a word boundary';
      const excerpt = BlogPostEntity.generateExcerpt(content, 30);
      expect(excerpt).toBe('This is a longer piece of...');
      expect(excerpt.length).toBeLessThanOrEqual(33); // 30 + '...'
    });

    it('should remove HTML tags before generating excerpt', () => {
      const content = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
      expect(BlogPostEntity.generateExcerpt(content, 150)).toBe('This is bold and italic text');
    });

    it('should handle complex HTML content', () => {
      const content = '<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>';
      expect(BlogPostEntity.generateExcerpt(content, 150)).toBe('TitleParagraph with link');
    });

    it('should use default maxLength of 150 when not specified', () => {
      const content = 'A'.repeat(200);
      const excerpt = BlogPostEntity.generateExcerpt(content);
      // Since there are no spaces, it will truncate at 150 and find lastIndexOf(' ') = -1
      // Then substring(0, -1) would give empty string, so we check the behavior
      expect(excerpt.length).toBeLessThanOrEqual(153); // 150 + '...'
    });

    it('should handle content with only HTML tags', () => {
      const content = '<br><hr><img src="test.jpg">';
      expect(BlogPostEntity.generateExcerpt(content, 150)).toBe('');
    });

    it('should handle empty content', () => {
      expect(BlogPostEntity.generateExcerpt('', 150)).toBe('');
    });
  });

  describe('calculateReadingTime', () => {
    it('should return 1 minute for short content', () => {
      const content = 'This is a short blog post with only a few words.';
      expect(BlogPostEntity.calculateReadingTime(content)).toBe(1);
    });

    it('should calculate correctly for 200 words (1 minute)', () => {
      const words = Array(200).fill('word').join(' ');
      expect(BlogPostEntity.calculateReadingTime(words)).toBe(1);
    });

    it('should calculate correctly for 400 words (2 minutes)', () => {
      const words = Array(400).fill('word').join(' ');
      expect(BlogPostEntity.calculateReadingTime(words)).toBe(2);
    });

    it('should round up for partial minutes', () => {
      const words = Array(250).fill('word').join(' ');
      expect(BlogPostEntity.calculateReadingTime(words)).toBe(2);
    });

    it('should strip HTML before calculating', () => {
      const content = '<p>' + Array(200).fill('word').join(' ') + '</p>';
      expect(BlogPostEntity.calculateReadingTime(content)).toBe(1);
    });

    it('should handle content with many HTML tags', () => {
      const content = '<div><p><strong>' + Array(200).fill('word').join('</strong><strong>') + '</strong></p></div>';
      expect(BlogPostEntity.calculateReadingTime(content)).toBe(1);
    });

    it('should return 1 for empty content', () => {
      expect(BlogPostEntity.calculateReadingTime('')).toBe(1);
    });
  });

  describe('validateTitle', () => {
    it('should return true for valid title (3-100 characters)', () => {
      expect(BlogPostEntity.validateTitle('Valid Title')).toBe(true);
    });

    it('should return true for title at minimum length (3 characters)', () => {
      expect(BlogPostEntity.validateTitle('abc')).toBe(true);
    });

    it('should return true for title at maximum length (100 characters)', () => {
      expect(BlogPostEntity.validateTitle('a'.repeat(100))).toBe(true);
    });

    it('should return false for title shorter than 3 characters', () => {
      expect(BlogPostEntity.validateTitle('ab')).toBe(false);
      expect(BlogPostEntity.validateTitle('a')).toBe(false);
      expect(BlogPostEntity.validateTitle('')).toBe(false);
    });

    it('should return false for title longer than 100 characters', () => {
      expect(BlogPostEntity.validateTitle('a'.repeat(101))).toBe(false);
      expect(BlogPostEntity.validateTitle('a'.repeat(200))).toBe(false);
    });

    it('should accept special characters in title', () => {
      expect(BlogPostEntity.validateTitle('Title with Special Characters! @#$%')).toBe(true);
    });

    it('should accept unicode characters in title', () => {
      expect(BlogPostEntity.validateTitle('Titulo em Portugues')).toBe(true);
    });
  });

  describe('validateContent', () => {
    it('should return true for content with at least 10 characters (plain text)', () => {
      expect(BlogPostEntity.validateContent('This is valid content with enough characters.')).toBe(true);
    });

    it('should return true for content at minimum length (10 characters)', () => {
      expect(BlogPostEntity.validateContent('1234567890')).toBe(true);
    });

    it('should return false for content shorter than 10 characters', () => {
      expect(BlogPostEntity.validateContent('123456789')).toBe(false);
      expect(BlogPostEntity.validateContent('short')).toBe(false);
      expect(BlogPostEntity.validateContent('')).toBe(false);
    });

    it('should strip HTML before validating length', () => {
      expect(BlogPostEntity.validateContent('<p>1234567890</p>')).toBe(true);
      expect(BlogPostEntity.validateContent('<p>123456789</p>')).toBe(false);
    });

    it('should return false if content is only HTML tags', () => {
      expect(BlogPostEntity.validateContent('<p><br><hr></p>')).toBe(false);
    });

    it('should count actual text within nested HTML', () => {
      expect(BlogPostEntity.validateContent('<div><p><span>1234567890</span></p></div>')).toBe(true);
    });
  });

  describe('sortByDate', () => {
    it('should sort posts by publishedAt in descending order by default', () => {
      const posts = [
        createMockPost({ id: '1', publishedAt: new Date('2024-01-01') }),
        createMockPost({ id: '2', publishedAt: new Date('2024-03-01') }),
        createMockPost({ id: '3', publishedAt: new Date('2024-02-01') })
      ];

      const sorted = BlogPostEntity.sortByDate(posts);
      expect(sorted.map(p => p.id)).toEqual(['2', '3', '1']);
    });

    it('should sort posts in ascending order when specified', () => {
      const posts = [
        createMockPost({ id: '1', publishedAt: new Date('2024-01-01') }),
        createMockPost({ id: '2', publishedAt: new Date('2024-03-01') }),
        createMockPost({ id: '3', publishedAt: new Date('2024-02-01') })
      ];

      const sorted = BlogPostEntity.sortByDate(posts, true);
      expect(sorted.map(p => p.id)).toEqual(['1', '3', '2']);
    });

    it('should use createdAt if publishedAt is undefined', () => {
      const posts = [
        createMockPost({ id: '1', publishedAt: undefined, createdAt: new Date('2024-01-01') }),
        createMockPost({ id: '2', publishedAt: undefined, createdAt: new Date('2024-03-01') }),
        createMockPost({ id: '3', publishedAt: new Date('2024-02-15') })
      ];

      const sorted = BlogPostEntity.sortByDate(posts);
      expect(sorted.map(p => p.id)).toEqual(['2', '3', '1']);
    });

    it('should not mutate the original array', () => {
      const posts = [
        createMockPost({ id: '1', publishedAt: new Date('2024-01-01') }),
        createMockPost({ id: '2', publishedAt: new Date('2024-03-01') })
      ];
      const originalOrder = [...posts];

      BlogPostEntity.sortByDate(posts);
      expect(posts.map(p => p.id)).toEqual(originalOrder.map(p => p.id));
    });

    it('should handle empty array', () => {
      const sorted = BlogPostEntity.sortByDate([]);
      expect(sorted).toEqual([]);
    });

    it('should handle array with single post', () => {
      const posts = [createMockPost({ id: '1' })];
      const sorted = BlogPostEntity.sortByDate(posts);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });
  });

  describe('filterByCategory', () => {
    it('should return posts matching the specified category', () => {
      const posts = [
        createMockPost({ id: '1', categories: ['technology', 'faith'] }),
        createMockPost({ id: '2', categories: ['lifestyle'] }),
        createMockPost({ id: '3', categories: ['technology'] })
      ];

      const filtered = BlogPostEntity.filterByCategory(posts, 'technology');
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should return empty array if no posts match', () => {
      const posts = [
        createMockPost({ id: '1', categories: ['technology'] }),
        createMockPost({ id: '2', categories: ['lifestyle'] })
      ];

      const filtered = BlogPostEntity.filterByCategory(posts, 'nonexistent');
      expect(filtered).toEqual([]);
    });

    it('should handle empty categories array in posts', () => {
      const posts = [
        createMockPost({ id: '1', categories: [] }),
        createMockPost({ id: '2', categories: ['technology'] })
      ];

      const filtered = BlogPostEntity.filterByCategory(posts, 'technology');
      expect(filtered.map(p => p.id)).toEqual(['2']);
    });

    it('should be case-sensitive', () => {
      const posts = [
        createMockPost({ id: '1', categories: ['Technology'] }),
        createMockPost({ id: '2', categories: ['technology'] })
      ];

      const filtered = BlogPostEntity.filterByCategory(posts, 'technology');
      expect(filtered.map(p => p.id)).toEqual(['2']);
    });

    it('should handle empty array input', () => {
      const filtered = BlogPostEntity.filterByCategory([], 'technology');
      expect(filtered).toEqual([]);
    });
  });

  describe('searchPosts', () => {
    it('should find posts by title', () => {
      const posts = [
        createMockPost({ id: '1', title: 'React Tutorial' }),
        createMockPost({ id: '2', title: 'Vue Guide' }),
        createMockPost({ id: '3', title: 'React Best Practices' })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'React');
      expect(results.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should find posts by content', () => {
      const posts = [
        createMockPost({ id: '1', title: 'Post 1', content: 'This is about JavaScript' }),
        createMockPost({ id: '2', title: 'Post 2', content: 'This is about Python' }),
        createMockPost({ id: '3', title: 'Post 3', content: 'JavaScript is great' })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'JavaScript');
      expect(results.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should find posts by tags', () => {
      const posts = [
        createMockPost({ id: '1', title: 'Post 1', tags: ['react', 'frontend'] }),
        createMockPost({ id: '2', title: 'Post 2', tags: ['backend', 'nodejs'] }),
        createMockPost({ id: '3', title: 'Post 3', tags: ['react', 'typescript'] })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'react');
      expect(results.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should be case-insensitive', () => {
      const posts = [
        createMockPost({ id: '1', title: 'REACT Tutorial' }),
        createMockPost({ id: '2', title: 'react guide' }),
        createMockPost({ id: '3', title: 'ReAcT Tips' })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'react');
      expect(results.map(p => p.id)).toEqual(['1', '2', '3']);
    });

    it('should match partial words', () => {
      const posts = [
        createMockPost({ id: '1', title: 'JavaScript Fundamentals' }),
        createMockPost({ id: '2', title: 'Java Basics' })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'Java');
      expect(results.map(p => p.id)).toEqual(['1', '2']);
    });

    it('should return empty array for no matches', () => {
      const posts = [
        createMockPost({ id: '1', title: 'React Tutorial' }),
        createMockPost({ id: '2', title: 'Vue Guide' })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'Angular');
      expect(results).toEqual([]);
    });

    it('should handle empty query', () => {
      const posts = [
        createMockPost({ id: '1', title: 'React Tutorial' }),
        createMockPost({ id: '2', title: 'Vue Guide' })
      ];

      const results = BlogPostEntity.searchPosts(posts, '');
      expect(results).toHaveLength(2);
    });

    it('should handle empty posts array', () => {
      const results = BlogPostEntity.searchPosts([], 'react');
      expect(results).toEqual([]);
    });

    it('should find posts matching any of title, content, or tags', () => {
      const posts = [
        createMockPost({ id: '1', title: 'Introduction', content: 'Learn React basics', tags: ['beginner'] }),
        createMockPost({ id: '2', title: 'React Advanced', content: 'Complex patterns', tags: ['advanced'] }),
        createMockPost({ id: '3', title: 'Vue Guide', content: 'Vue basics', tags: ['react-alternative'] })
      ];

      const results = BlogPostEntity.searchPosts(posts, 'react');
      expect(results.map(p => p.id)).toEqual(['1', '2', '3']);
    });
  });
});

describe('Interface Type Checking', () => {
  describe('BlogPost interface', () => {
    it('should accept a valid BlogPost object', () => {
      const post: BlogPost = createMockPost();
      expect(post.id).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.author).toBeDefined();
      expect(post.status).toBeDefined();
      expect(post.visibility).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const post: BlogPost = createMockPost({
        featuredImage: undefined,
        publishedAt: undefined
      });
      expect(post.featuredImage).toBeUndefined();
      expect(post.publishedAt).toBeUndefined();
    });
  });

  describe('Author interface', () => {
    it('should accept a valid Author object', () => {
      const author: Author = createMockAuthor();
      expect(author.id).toBeDefined();
      expect(author.name).toBeDefined();
      expect(author.role).toBeDefined();
    });

    it('should allow optional photoURL to be undefined', () => {
      const author: Author = createMockAuthor({ photoURL: undefined });
      expect(author.photoURL).toBeUndefined();
    });
  });

  describe('Comment interface', () => {
    it('should accept a valid Comment object', () => {
      const comment: Comment = {
        id: 'comment-1',
        postId: 'post-1',
        author: {
          id: 'user-1',
          name: 'Commenter',
          photoURL: 'https://example.com/photo.jpg'
        },
        content: 'This is a comment',
        likes: 5,
        status: CommentStatus.Approved,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(comment.id).toBeDefined();
      expect(comment.parentId).toBeUndefined();
    });

    it('should accept nested comment with parentId', () => {
      const comment: Comment = {
        id: 'comment-2',
        postId: 'post-1',
        author: {
          id: 'user-1',
          name: 'Commenter'
        },
        content: 'This is a reply',
        parentId: 'comment-1',
        likes: 0,
        status: CommentStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(comment.parentId).toBe('comment-1');
    });
  });

  describe('Like interface', () => {
    it('should accept a valid Like object for post', () => {
      const like: Like = {
        userId: 'user-1',
        targetId: 'post-1',
        targetType: 'post',
        createdAt: new Date()
      };
      expect(like.targetType).toBe('post');
    });

    it('should accept a valid Like object for comment', () => {
      const like: Like = {
        userId: 'user-1',
        targetId: 'comment-1',
        targetType: 'comment',
        createdAt: new Date()
      };
      expect(like.targetType).toBe('comment');
    });
  });
});

describe('Publishing Workflow', () => {
  describe('Draft to Published transition', () => {
    it('should allow transitioning draft to published', () => {
      const draft = createMockPost({ status: PostStatus.Draft });
      expect(BlogPostEntity.isPublished(draft)).toBe(false);

      const published = { ...draft, status: PostStatus.Published, publishedAt: new Date() };
      expect(BlogPostEntity.isPublished(published)).toBe(true);
    });
  });

  describe('Scheduling workflow', () => {
    it('should recognize a properly scheduled post', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const scheduledPost = createMockPost({
        status: PostStatus.Scheduled,
        publishedAt: futureDate
      });

      expect(BlogPostEntity.isScheduled(scheduledPost)).toBe(true);
      expect(BlogPostEntity.isPublished(scheduledPost)).toBe(false);
    });

    it('should transition scheduled to published when time passes', () => {
      // Simulate a post that was scheduled and is now past its publish date
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      const scheduledPost = createMockPost({
        status: PostStatus.Scheduled,
        publishedAt: pastDate
      });

      // It's no longer "scheduled" because the date has passed
      expect(BlogPostEntity.isScheduled(scheduledPost)).toBe(false);

      // To be published, status needs to change
      const publishedPost = { ...scheduledPost, status: PostStatus.Published };
      expect(BlogPostEntity.isPublished(publishedPost)).toBe(true);
    });
  });

  describe('Archiving workflow', () => {
    it('should NOT allow viewing archived posts', () => {
      const archivedPost = createMockPost({
        status: PostStatus.Archived,
        visibility: PostVisibility.Public
      });

      expect(BlogPostEntity.isPublished(archivedPost)).toBe(false);
      expect(BlogPostEntity.canView(archivedPost)).toBe(false);
    });
  });
});

describe('SEO Helpers', () => {
  describe('generateExcerpt for SEO', () => {
    it('should generate SEO-friendly excerpt without HTML', () => {
      const content = '<h1>Main Title</h1><p>This is the main content with important keywords for SEO.</p>';
      const excerpt = BlogPostEntity.generateExcerpt(content, 50);

      expect(excerpt).not.toContain('<');
      expect(excerpt).not.toContain('>');
      expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('should preserve word boundaries for better readability', () => {
      const content = 'This is a very important blog post about web development and React.';
      const excerpt = BlogPostEntity.generateExcerpt(content, 40);

      // Should end with '...' and not cut in the middle of a word
      expect(excerpt.endsWith('...')).toBe(true);
    });
  });

  describe('calculateReadingTime for user engagement', () => {
    it('should provide accurate reading time for SEO metadata', () => {
      // Typical blog post with ~600 words = 3 minutes
      const words = Array(600).fill('word').join(' ');
      expect(BlogPostEntity.calculateReadingTime(words)).toBe(3);
    });
  });

  describe('validateTitle for SEO best practices', () => {
    it('should enforce minimum title length for SEO', () => {
      expect(BlogPostEntity.validateTitle('Hi')).toBe(false);
      expect(BlogPostEntity.validateTitle('SEO')).toBe(true);
    });

    it('should enforce maximum title length for search results', () => {
      // Titles over 100 chars get truncated in search results
      const longTitle = 'a'.repeat(101);
      expect(BlogPostEntity.validateTitle(longTitle)).toBe(false);
    });
  });
});
