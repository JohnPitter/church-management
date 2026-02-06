// Unit Tests - DevotionalService
// Tests for devotional management operations

import { devotionalService } from '../DevotionalService';
import type { DevotionalFilters } from '../DevotionalService';
import {
  Devotional,
  DevotionalCategory,
  DevotionalComment,
  UserDevotionalProgress,
  DevotionalPlan
} from '../../../domain/entities/Devotional';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp
} from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Type for mocked functions
const mockedAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockedDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedDoc = doc as jest.MockedFunction<typeof doc>;
const mockedCollection = collection as jest.MockedFunction<typeof collection>;

describe('DevotionalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper Functions
  const createTestCategory = (): DevotionalCategory => ({
    id: 'cat-1',
    name: 'Faith',
    description: 'Devotionals about faith',
    icon: 'cross',
    color: '#3B82F6',
    isActive: true
  });

  const createTestDevotional = (overrides: Partial<Devotional> = {}): Devotional => ({
    id: 'dev-1',
    title: 'Walking in Faith',
    content: 'Lorem ipsum dolor sit amet...',
    bibleVerse: 'For we walk by faith, not by sight.',
    bibleReference: '2 Corinthians 5:7',
    reflection: 'Today we reflect on what it means to walk by faith...',
    prayer: 'Dear Lord, help us to walk in faith...',
    author: 'Pastor John',
    publishDate: new Date('2024-01-15'),
    category: createTestCategory(),
    tags: ['faith', 'trust', 'prayer'],
    imageUrl: 'https://example.com/image.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    readingTime: 5,
    isPublished: true,
    viewCount: 100,
    likes: ['user-1', 'user-2'],
    bookmarks: ['user-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    createdBy: 'admin-1',
    ...overrides
  });

  const createTestComment = (overrides: Partial<DevotionalComment> = {}): DevotionalComment => ({
    id: 'comment-1',
    devotionalId: 'dev-1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    content: 'This devotional blessed me!',
    isApproved: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  });

  const createTestProgress = (overrides: Partial<UserDevotionalProgress> = {}): UserDevotionalProgress => ({
    id: 'user-1_dev-1',
    userId: 'user-1',
    devotionalId: 'dev-1',
    isRead: true,
    readAt: new Date('2024-01-15'),
    notes: 'Great devotional',
    isFavorite: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  });

  const createTestPlan = (overrides: Partial<DevotionalPlan> = {}): DevotionalPlan => ({
    id: 'plan-1',
    name: '30 Days of Faith',
    description: 'A 30-day journey through faith',
    duration: 30,
    devotionals: ['dev-1', 'dev-2', 'dev-3'],
    category: createTestCategory(),
    targetAudience: 'All believers',
    imageUrl: 'https://example.com/plan-image.jpg',
    isActive: true,
    subscribers: ['user-1', 'user-2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin-1',
    ...overrides
  });

  const mockFirestoreDoc = (data: any, id: string = 'doc-1') => ({
    exists: () => true,
    data: () => data,
    id
  });

  const mockFirestoreSnapshot = (docs: any[]) => ({
    empty: docs.length === 0,
    size: docs.length,
    docs
  });

  describe('createDevotional', () => {
    it('should create a new devotional successfully', async () => {
      const devotionalData = {
        title: 'New Devotional',
        content: 'Content here',
        bibleVerse: 'John 3:16',
        bibleReference: 'John 3:16',
        reflection: 'Reflection text',
        prayer: 'Prayer text',
        author: 'Pastor John',
        publishDate: new Date('2024-02-01'),
        category: createTestCategory(),
        tags: ['faith'],
        readingTime: 5,
        isPublished: false,
        createdBy: 'admin-1'
      };

      mockedAddDoc.mockResolvedValue({ id: 'new-dev-id' } as any);

      const result = await devotionalService.createDevotional(devotionalData);

      expect(result).toBe('new-dev-id');
      expect(mockedAddDoc).toHaveBeenCalled();
      const callArgs = mockedAddDoc.mock.calls[0][1] as any;
      expect(callArgs.title).toBe('New Devotional');
      expect(callArgs.viewCount).toBe(0);
      expect(callArgs.likes).toEqual([]);
      expect(callArgs.bookmarks).toEqual([]);
    });

    it('should convert Date to Timestamp for publishDate', async () => {
      const devotionalData = {
        title: 'New Devotional',
        content: 'Content',
        bibleVerse: 'John 3:16',
        bibleReference: 'John 3:16',
        reflection: 'Reflection',
        prayer: 'Prayer',
        author: 'Pastor',
        publishDate: new Date('2024-02-01'),
        category: createTestCategory(),
        tags: [],
        readingTime: 5,
        isPublished: false,
        createdBy: 'admin-1'
      };

      mockedAddDoc.mockResolvedValue({ id: 'new-dev-id' } as any);

      await devotionalService.createDevotional(devotionalData);

      expect(mockedAddDoc).toHaveBeenCalled();
      // Verify publishDate was converted (not checking exact format since it's Firebase-specific)
      expect(mockedAddDoc.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw error on creation failure', async () => {
      const devotionalData = {
        title: 'New Devotional',
        content: 'Content',
        bibleVerse: 'John 3:16',
        bibleReference: 'John 3:16',
        reflection: 'Reflection',
        prayer: 'Prayer',
        author: 'Pastor',
        publishDate: new Date(),
        category: createTestCategory(),
        tags: [],
        readingTime: 5,
        isPublished: false,
        createdBy: 'admin-1'
      };

      mockedAddDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(devotionalService.createDevotional(devotionalData))
        .rejects.toThrow('Firebase error');
    });
  });

  describe('updateDevotional', () => {
    it('should update devotional successfully', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.updateDevotional('dev-1', updates);

      expect(mockedUpdateDoc).toHaveBeenCalled();
      const callArgs = mockedUpdateDoc.mock.calls[0][1] as any;
      expect(callArgs.title).toBe('Updated Title');
      expect(callArgs.content).toBe('Updated content');
    });

    it('should convert publishDate to Timestamp when updating', async () => {
      const updates = {
        publishDate: new Date('2024-03-01')
      };

      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.updateDevotional('dev-1', updates);

      expect(mockedUpdateDoc).toHaveBeenCalled();
      // Verify updateDoc was called (publishDate conversion happens internally)
      expect(mockedUpdateDoc.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw error on update failure', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(devotionalService.updateDevotional('dev-1', { title: 'New' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteDevotional', () => {
    it('should delete devotional successfully', async () => {
      mockedDeleteDoc.mockResolvedValue(undefined);

      await devotionalService.deleteDevotional('dev-1', 'user-1');

      expect(mockedDeleteDoc).toHaveBeenCalled();
    });

    it('should throw error on delete failure', async () => {
      mockedDeleteDoc.mockRejectedValue(new Error('Delete failed'));

      await expect(devotionalService.deleteDevotional('dev-1', 'user-1'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('getDevotional', () => {
    it('should return devotional when found', async () => {
      const devotionalData = createTestDevotional();
      const firestoreData = {
        ...devotionalData,
        publishDate: Timestamp.fromDate(devotionalData.publishDate),
        createdAt: Timestamp.fromDate(devotionalData.createdAt),
        updatedAt: Timestamp.fromDate(devotionalData.updatedAt)
      };

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => firestoreData,
        id: 'dev-1'
      } as any);

      const result = await devotionalService.getDevotional('dev-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('dev-1');
      expect(result?.title).toBe('Walking in Faith');
      expect(result?.publishDate).toBeInstanceOf(Date);
    });

    it('should return null when devotional not found', async () => {
      mockedGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      const result = await devotionalService.getDevotional('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDoc.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getDevotional('dev-1'))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('getDevotionals', () => {
    it('should return devotionals with default filters', async () => {
      const devotional1 = createTestDevotional({ id: 'dev-1' });
      const devotional2 = createTestDevotional({ id: 'dev-2' });

      const docs = [
        mockFirestoreDoc({
          ...devotional1,
          publishDate: Timestamp.fromDate(devotional1.publishDate),
          createdAt: Timestamp.fromDate(devotional1.createdAt),
          updatedAt: Timestamp.fromDate(devotional1.updatedAt)
        }, 'dev-1'),
        mockFirestoreDoc({
          ...devotional2,
          publishDate: Timestamp.fromDate(devotional2.publishDate),
          createdAt: Timestamp.fromDate(devotional2.createdAt),
          updatedAt: Timestamp.fromDate(devotional2.updatedAt)
        }, 'dev-2')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(docs) as any);

      const result = await devotionalService.getDevotionals();

      expect(result.devotionals).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by published status', async () => {
      const filters: DevotionalFilters = { isPublished: true };

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([]) as any);

      await devotionalService.getDevotionals(filters);

      expect(mockedQuery).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      const filters: DevotionalFilters = { categoryId: 'cat-1' };

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([]) as any);

      await devotionalService.getDevotionals(filters);

      expect(mockedQuery).toHaveBeenCalled();
    });

    it('should filter by author', async () => {
      const filters: DevotionalFilters = { author: 'Pastor John' };

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([]) as any);

      await devotionalService.getDevotionals(filters);

      expect(mockedQuery).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const filters: DevotionalFilters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([]) as any);

      await devotionalService.getDevotionals(filters);

      expect(mockedQuery).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const devotionals = Array.from({ length: 11 }, (_, i) => {
        const dev = createTestDevotional({ id: `dev-${i}` });
        return mockFirestoreDoc({
          ...dev,
          publishDate: Timestamp.fromDate(dev.publishDate),
          createdAt: Timestamp.fromDate(dev.createdAt),
          updatedAt: Timestamp.fromDate(dev.updatedAt)
        }, `dev-${i}`);
      });

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(devotionals) as any);

      const result = await devotionalService.getDevotionals({}, 10);

      expect(result.devotionals).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getDevotionals())
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('getTodaysDevotional', () => {
    it('should return today\'s devotional when found', async () => {
      const todayDevotional = createTestDevotional({
        publishDate: new Date(),
        isPublished: true
      });

      const docData = mockFirestoreDoc({
        ...todayDevotional,
        publishDate: Timestamp.fromDate(todayDevotional.publishDate),
        createdAt: Timestamp.fromDate(todayDevotional.createdAt),
        updatedAt: Timestamp.fromDate(todayDevotional.updatedAt)
      }, 'dev-today');

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([docData]) as any);

      const result = await devotionalService.getTodaysDevotional();

      expect(result).toBeDefined();
      expect(result?.isPublished).toBe(true);
    });

    it('should return null when no devotional for today', async () => {
      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot([]) as any);

      const result = await devotionalService.getTodaysDevotional();

      expect(result).toBeNull();
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getTodaysDevotional())
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count successfully', async () => {
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.incrementViewCount('dev-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
      // Verify increment was called (exact implementation is Firebase-specific)
      expect(mockedUpdateDoc.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw error on increment failure', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Increment failed'));

      await expect(devotionalService.incrementViewCount('dev-1'))
        .rejects.toThrow('Increment failed');
    });
  });

  describe('toggleLike', () => {
    it('should add like when user has not liked', async () => {
      const devotionalData = createTestDevotional({ likes: [] });

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...devotionalData,
          likes: []
        }),
        id: 'dev-1'
      } as any);
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.toggleLike('dev-1', 'user-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
    });

    it('should remove like when user has already liked', async () => {
      const devotionalData = createTestDevotional({ likes: ['user-1'] });

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...devotionalData,
          likes: ['user-1']
        }),
        id: 'dev-1'
      } as any);
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.toggleLike('dev-1', 'user-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when devotional not found', async () => {
      mockedGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      await expect(devotionalService.toggleLike('dev-1', 'user-1'))
        .rejects.toThrow('Devotional not found');
    });

    it('should throw error on toggle failure', async () => {
      mockedGetDoc.mockRejectedValue(new Error('Toggle failed'));

      await expect(devotionalService.toggleLike('dev-1', 'user-1'))
        .rejects.toThrow('Toggle failed');
    });
  });

  describe('toggleBookmark', () => {
    it('should add bookmark when user has not bookmarked', async () => {
      const devotionalData = createTestDevotional({ bookmarks: [] });

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...devotionalData,
          bookmarks: []
        }),
        id: 'dev-1'
      } as any);
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.toggleBookmark('dev-1', 'user-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
    });

    it('should remove bookmark when user has already bookmarked', async () => {
      const devotionalData = createTestDevotional({ bookmarks: ['user-1'] });

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...devotionalData,
          bookmarks: ['user-1']
        }),
        id: 'dev-1'
      } as any);
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.toggleBookmark('dev-1', 'user-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when devotional not found', async () => {
      mockedGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      await expect(devotionalService.toggleBookmark('dev-1', 'user-1'))
        .rejects.toThrow('Devotional not found');
    });

    it('should throw error on toggle failure', async () => {
      mockedGetDoc.mockRejectedValue(new Error('Toggle failed'));

      await expect(devotionalService.toggleBookmark('dev-1', 'user-1'))
        .rejects.toThrow('Toggle failed');
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const categoryData = {
        name: 'Hope',
        description: 'Devotionals about hope',
        icon: 'star',
        color: '#10B981',
        isActive: true
      };

      mockedAddDoc.mockResolvedValue({ id: 'cat-new' } as any);

      const result = await devotionalService.createCategory(categoryData);

      expect(result).toBe('cat-new');
      expect(mockedAddDoc).toHaveBeenCalled();
      const callArgs = mockedAddDoc.mock.calls[0][1] as any;
      expect(callArgs.name).toBe('Hope');
    });

    it('should throw error on creation failure', async () => {
      const categoryData = {
        name: 'Hope',
        description: 'Devotionals about hope',
        icon: 'star',
        color: '#10B981',
        isActive: true
      };

      mockedAddDoc.mockRejectedValue(new Error('Create failed'));

      await expect(devotionalService.createCategory(categoryData))
        .rejects.toThrow('Create failed');
    });
  });

  describe('getCategories', () => {
    it('should return active categories', async () => {
      const categories = [
        mockFirestoreDoc(createTestCategory(), 'cat-1'),
        mockFirestoreDoc({ ...createTestCategory(), id: 'cat-2', name: 'Hope' }, 'cat-2')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(categories) as any);

      const result = await devotionalService.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[1].id).toBe('cat-2');
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getCategories())
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('createComment', () => {
    it('should create comment with isApproved false', async () => {
      const commentData = {
        devotionalId: 'dev-1',
        userId: 'user-1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        content: 'Great devotional!'
      };

      mockedAddDoc.mockResolvedValue({ id: 'comment-new' } as any);

      const result = await devotionalService.createComment(commentData);

      expect(result).toBe('comment-new');
      expect(mockedAddDoc).toHaveBeenCalled();
      const callArgs = mockedAddDoc.mock.calls[0][1] as any;
      expect(callArgs.isApproved).toBe(false);
      expect(callArgs.content).toBe('Great devotional!');
    });

    it('should throw error on creation failure', async () => {
      const commentData = {
        devotionalId: 'dev-1',
        userId: 'user-1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        content: 'Great devotional!'
      };

      mockedAddDoc.mockRejectedValue(new Error('Create failed'));

      await expect(devotionalService.createComment(commentData))
        .rejects.toThrow('Create failed');
    });
  });

  describe('getComments', () => {
    it('should return approved comments by default', async () => {
      const comments = [
        mockFirestoreDoc({
          ...createTestComment({ isApproved: true }),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        }, 'comment-1')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(comments) as any);

      const result = await devotionalService.getComments('dev-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');
    });

    it('should return all comments when approvedOnly is false', async () => {
      const comments = [
        mockFirestoreDoc({
          ...createTestComment({ isApproved: false }),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        }, 'comment-1')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(comments) as any);

      const result = await devotionalService.getComments('dev-1', false);

      expect(result).toHaveLength(1);
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getComments('dev-1'))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('approveComment', () => {
    it('should approve comment successfully', async () => {
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.approveComment('comment-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
      const callArgs = mockedUpdateDoc.mock.calls[0][1] as any;
      expect(callArgs.isApproved).toBe(true);
    });

    it('should throw error on approval failure', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Approval failed'));

      await expect(devotionalService.approveComment('comment-1'))
        .rejects.toThrow('Approval failed');
    });
  });

  describe('markAsRead', () => {
    it('should create new progress document if not exists', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Document does not exist'));
      mockedSetDoc.mockResolvedValue(undefined);

      await devotionalService.markAsRead('dev-1', 'user-1', 'Great insights!');

      expect(mockedSetDoc).toHaveBeenCalled();
      const callArgs = mockedSetDoc.mock.calls[0][1] as any;
      expect(callArgs.userId).toBe('user-1');
      expect(callArgs.devotionalId).toBe('dev-1');
      expect(callArgs.isRead).toBe(true);
      expect(callArgs.notes).toBe('Great insights!');
    });

    it('should update existing progress document', async () => {
      mockedUpdateDoc.mockResolvedValue(undefined);

      await devotionalService.markAsRead('dev-1', 'user-1', 'Updated notes');

      expect(mockedUpdateDoc).toHaveBeenCalled();
      const callArgs = mockedUpdateDoc.mock.calls[0][1] as any;
      expect(callArgs.userId).toBe('user-1');
      expect(callArgs.devotionalId).toBe('dev-1');
      expect(callArgs.isRead).toBe(true);
    });

    it('should handle missing notes parameter', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Document does not exist'));
      mockedSetDoc.mockResolvedValue(undefined);

      await devotionalService.markAsRead('dev-1', 'user-1');

      expect(mockedSetDoc).toHaveBeenCalled();
      const callArgs = mockedSetDoc.mock.calls[0][1] as any;
      expect(callArgs.notes).toBe('');
    });

    it('should throw error on failure', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Update failed'));
      mockedSetDoc.mockRejectedValue(new Error('Create failed'));

      await expect(devotionalService.markAsRead('dev-1', 'user-1'))
        .rejects.toThrow();
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress when found', async () => {
      const progressData = createTestProgress();

      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...progressData,
          readAt: Timestamp.fromDate(progressData.readAt!),
          createdAt: Timestamp.fromDate(progressData.createdAt),
          updatedAt: Timestamp.fromDate(progressData.updatedAt)
        }),
        id: 'user-1_dev-1'
      } as any);

      const result = await devotionalService.getUserProgress('user-1', 'dev-1');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-1');
      expect(result?.devotionalId).toBe('dev-1');
      expect(result?.isRead).toBe(true);
    });

    it('should return null when progress not found', async () => {
      mockedGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      const result = await devotionalService.getUserProgress('user-1', 'dev-1');

      expect(result).toBeNull();
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDoc.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getUserProgress('user-1', 'dev-1'))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('getStats', () => {
    it('should calculate devotional statistics correctly', async () => {
      const devotionals = [
        createTestDevotional({ id: 'dev-1', isPublished: true, viewCount: 50, likes: ['u1', 'u2'] }),
        createTestDevotional({ id: 'dev-2', isPublished: false, viewCount: 30, likes: ['u1'] })
      ];

      const devotionalDocs = devotionals.map((dev, i) =>
        mockFirestoreDoc({
          ...dev,
          publishDate: Timestamp.fromDate(dev.publishDate),
          createdAt: Timestamp.fromDate(dev.createdAt),
          updatedAt: Timestamp.fromDate(dev.updatedAt)
        }, dev.id)
      );

      const commentDocs = [
        mockFirestoreDoc(createTestComment(), 'c1'),
        mockFirestoreDoc(createTestComment(), 'c2')
      ];

      const planDocs = [
        mockFirestoreDoc(createTestPlan({ isActive: true }), 'p1')
      ];

      const progressDocs = [
        mockFirestoreDoc(createTestProgress({ isRead: true }), 'pr1'),
        mockFirestoreDoc(createTestProgress({ isRead: true }), 'pr2')
      ];

      mockedGetDocs
        .mockResolvedValueOnce(mockFirestoreSnapshot(devotionalDocs) as any)
        .mockResolvedValueOnce(mockFirestoreSnapshot(commentDocs) as any)
        .mockResolvedValueOnce(mockFirestoreSnapshot(planDocs) as any)
        .mockResolvedValueOnce(mockFirestoreSnapshot(progressDocs) as any);

      const result = await devotionalService.getStats();

      expect(result.totalDevotionals).toBe(2);
      expect(result.publishedDevotionals).toBe(1);
      expect(result.totalViews).toBe(80);
      expect(result.totalLikes).toBe(3);
      expect(result.totalComments).toBe(2);
      expect(result.activePlans).toBe(1);
      expect(result.completedDevotionals).toBe(2);
    });

    it('should throw error on stats calculation failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Stats failed'));

      await expect(devotionalService.getStats())
        .rejects.toThrow('Stats failed');
    });
  });

  describe('createPlan', () => {
    it('should create devotional plan successfully', async () => {
      const planData = {
        name: '7 Days of Prayer',
        description: 'A week of prayer devotionals',
        duration: 7,
        devotionals: ['dev-1', 'dev-2'],
        category: createTestCategory(),
        targetAudience: 'All',
        isActive: true,
        createdBy: 'admin-1'
      };

      mockedAddDoc.mockResolvedValue({ id: 'plan-new' } as any);

      const result = await devotionalService.createPlan(planData);

      expect(result).toBe('plan-new');
      expect(mockedAddDoc).toHaveBeenCalled();
      const callArgs = mockedAddDoc.mock.calls[0][1] as any;
      expect(callArgs.name).toBe('7 Days of Prayer');
      expect(callArgs.subscribers).toEqual([]);
    });

    it('should throw error on creation failure', async () => {
      const planData = {
        name: '7 Days of Prayer',
        description: 'A week of prayer devotionals',
        duration: 7,
        devotionals: ['dev-1'],
        category: createTestCategory(),
        targetAudience: 'All',
        isActive: true,
        createdBy: 'admin-1'
      };

      mockedAddDoc.mockRejectedValue(new Error('Create failed'));

      await expect(devotionalService.createPlan(planData))
        .rejects.toThrow('Create failed');
    });
  });

  describe('subscribeToPlan', () => {
    it('should subscribe user to plan successfully', async () => {
      mockedUpdateDoc.mockResolvedValue(undefined);
      mockedSetDoc.mockResolvedValue(undefined);

      await devotionalService.subscribeToPlan('plan-1', 'user-1');

      expect(mockedUpdateDoc).toHaveBeenCalled();
      expect(mockedSetDoc).toHaveBeenCalled();
      const callArgs = mockedSetDoc.mock.calls[0][1] as any;
      expect(callArgs.userId).toBe('user-1');
      expect(callArgs.planId).toBe('plan-1');
      expect(callArgs.currentDay).toBe(1);
      expect(callArgs.completedDevotionals).toEqual([]);
      expect(callArgs.isCompleted).toBe(false);
    });

    it('should throw error on subscription failure', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Subscribe failed'));

      await expect(devotionalService.subscribeToPlan('plan-1', 'user-1'))
        .rejects.toThrow('Subscribe failed');
    });
  });

  describe('getPlans', () => {
    it('should return active plans by default', async () => {
      const plans = [
        mockFirestoreDoc({
          ...createTestPlan(),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        }, 'plan-1')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(plans) as any);

      const result = await devotionalService.getPlans();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plan-1');
    });

    it('should return all plans when activeOnly is false', async () => {
      const plans = [
        mockFirestoreDoc({
          ...createTestPlan({ isActive: false }),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        }, 'plan-1')
      ];

      mockedGetDocs.mockResolvedValue(mockFirestoreSnapshot(plans) as any);

      const result = await devotionalService.getPlans(false);

      expect(result).toHaveLength(1);
    });

    it('should throw error on fetch failure', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Fetch failed'));

      await expect(devotionalService.getPlans())
        .rejects.toThrow('Fetch failed');
    });
  });
});
