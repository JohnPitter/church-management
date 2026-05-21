import {
  ActivityType,
  ForumActivity,
  ForumCategory,
  ForumNotification,
  ForumReply,
  ForumTopic,
  NotificationType,
  ReplyStatus,
  TopicPriority,
  TopicStatus
} from '../../../domain/entities/Forum';
import { forumService } from '../ForumService';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(),
  increment: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');
const mockCollection = firestore.collection as jest.Mock;
const mockDoc = firestore.doc as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockAddDoc = firestore.addDoc as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;
const mockDeleteDoc = firestore.deleteDoc as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockLimit = firestore.limit as jest.Mock;
const mockStartAfter = firestore.startAfter as jest.Mock;
const mockServerTimestamp = firestore.serverTimestamp as jest.Mock;
const mockIncrement = firestore.increment as jest.Mock;
const mockArrayUnion = firestore.arrayUnion as jest.Mock;
const mockArrayRemove = firestore.arrayRemove as jest.Mock;

describe('ForumService', () => {
  const timestampValue = { kind: 'server-timestamp' };

  const createCategory = (overrides: Partial<ForumCategory> = {}): ForumCategory => ({
    id: 'cat-1',
    name: 'Categoria Teste',
    description: 'Descricao',
    icon: 'message-circle',
    color: '#2563eb',
    slug: 'categoria-teste',
    isActive: true,
    requiresApproval: false,
    allowedRoles: ['member'],
    topicCount: 3,
    replyCount: 5,
    lastTopicAt: new Date('2025-01-10T12:00:00.000Z'),
    lastTopicBy: 'Ana',
    moderators: ['mod-1'],
    displayOrder: 1,
    createdAt: new Date('2025-01-01T12:00:00.000Z'),
    updatedAt: new Date('2025-01-01T12:00:00.000Z'),
    ...overrides
  });

  const createTopic = (overrides: Partial<ForumTopic> = {}): ForumTopic => ({
    id: 'topic-1',
    title: 'Topico teste',
    content: 'Conteudo',
    categoryId: 'cat-1',
    category: createCategory(),
    authorId: 'author-1',
    authorName: 'Autor',
    authorEmail: 'autor@example.com',
    tags: ['teste'],
    status: TopicStatus.PUBLISHED,
    priority: TopicPriority.NORMAL,
    isPinned: false,
    isLocked: false,
    viewCount: 10,
    replyCount: 2,
    lastReplyAt: new Date('2025-01-15T12:00:00.000Z'),
    lastReplyBy: 'Maria',
    likes: ['user-1'],
    attachments: [],
    createdAt: new Date('2025-01-05T12:00:00.000Z'),
    updatedAt: new Date('2025-01-06T12:00:00.000Z'),
    ...overrides
  });

  const createReply = (overrides: Partial<ForumReply> = {}): ForumReply => ({
    id: 'reply-1',
    topicId: 'topic-1',
    content: 'Resposta',
    authorId: 'reply-author',
    authorName: 'Respondedor',
    authorEmail: 'reply@example.com',
    status: ReplyStatus.PUBLISHED,
    likes: [],
    attachments: [],
    isAcceptedAnswer: false,
    createdAt: new Date('2025-01-07T12:00:00.000Z'),
    updatedAt: new Date('2025-01-07T12:00:00.000Z'),
    ...overrides
  });

  const createActivity = (overrides: Partial<ForumActivity> = {}): ForumActivity => ({
    id: 'activity-1',
    type: ActivityType.TOPIC_CREATED,
    userId: 'user-1',
    userName: 'Usuario',
    topicId: 'topic-1',
    topicTitle: 'Topico teste',
    categoryId: 'cat-1',
    categoryName: 'Categoria Teste',
    description: 'Criou topico',
    timestamp: new Date('2025-01-20T12:00:00.000Z'),
    ...overrides
  });

  const createNotification = (overrides: Partial<ForumNotification> = {}): ForumNotification => ({
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.TOPIC_LIKED,
    topicId: 'topic-1',
    triggeredBy: 'user-2',
    triggeredByName: 'Outro',
    title: 'Curtiram seu topico',
    message: 'Mensagem',
    isRead: false,
    createdAt: new Date('2025-01-20T12:00:00.000Z'),
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    ref: { id: data?.id ?? 'doc-1' },
    exists: () => exists,
    data: () => {
      if (!exists) {
        return null;
      }
      return {
        ...data,
        createdAt: data.createdAt ? { toDate: () => data.createdAt } : undefined,
        updatedAt: data.updatedAt ? { toDate: () => data.updatedAt } : undefined,
        lastReplyAt: data.lastReplyAt ? { toDate: () => data.lastReplyAt } : undefined,
        moderatedAt: data.moderatedAt ? { toDate: () => data.moderatedAt } : undefined,
        editedAt: data.editedAt ? { toDate: () => data.editedAt } : undefined,
        lastTopicAt: data.lastTopicAt ? { toDate: () => data.lastTopicAt } : undefined,
        timestamp: data.timestamp ? { toDate: () => data.timestamp } : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item)),
    size: docs.length
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockStartAfter.mockImplementation((...args) => ({ kind: 'startAfter', args }));
    mockServerTimestamp.mockReturnValue(timestampValue);
    mockIncrement.mockImplementation((value: number) => ({ kind: 'increment', value }));
    mockArrayUnion.mockImplementation((value: string) => ({ kind: 'arrayUnion', value }));
    mockArrayRemove.mockImplementation((value: string) => ({ kind: 'arrayRemove', value }));
  });

  it('creates topics, cleans the category payload and records follow-up side effects', async () => {
    const updateCategoryStatsSpy = jest.spyOn(forumService as any, 'updateCategoryStats').mockResolvedValue(undefined);
    const createActivitySpy = jest.spyOn(forumService, 'createActivity').mockResolvedValue(undefined);
    mockAddDoc.mockResolvedValueOnce({ id: 'topic-created' });

    const topic = createTopic({
      id: 'ignore',
      category: createCategory({ lastTopicAt: undefined, lastTopicBy: undefined }),
      viewCount: 0,
      replyCount: 0,
      likes: []
    });

    const result = await forumService.createTopic({
      title: topic.title,
      content: topic.content,
      categoryId: topic.categoryId,
      category: topic.category,
      authorId: topic.authorId,
      authorName: topic.authorName,
      authorEmail: topic.authorEmail,
      tags: topic.tags,
      status: topic.status,
      priority: topic.priority,
      isPinned: topic.isPinned,
      isLocked: topic.isLocked,
      attachments: topic.attachments
    });

    expect(result).toBe('topic-created');
    expect(mockAddDoc.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        title: topic.title,
        category: expect.objectContaining({
          id: 'cat-1',
          topicCount: 3,
          replyCount: 5,
          moderators: ['mod-1']
        }),
        viewCount: 0,
        replyCount: 0,
        likes: [],
        createdAt: timestampValue,
        updatedAt: timestampValue
      })
    );
    expect(updateCategoryStatsSpy).toHaveBeenCalledWith('cat-1', 'topicCount', 1);
    expect(createActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActivityType.TOPIC_CREATED,
        topicId: 'topic-created'
      })
    );
  });

  it('updates and deletes topics, including reply cleanup and category decrement', async () => {
    const updateCategoryStatsSpy = jest.spyOn(forumService as any, 'updateCategoryStats').mockResolvedValue(undefined);
    jest.spyOn(forumService, 'getTopic').mockResolvedValue(createTopic({ id: 'topic-delete', categoryId: 'cat-delete' }));
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ ref: { id: 'reply-a' } }, { ref: { id: 'reply-b' } }]
    });

    await forumService.updateTopic('topic-update', { title: 'Atualizado' });
    await forumService.deleteTopic('topic-delete');

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Atualizado',
        updatedAt: timestampValue
      })
    );
    expect(updateCategoryStatsSpy).toHaveBeenCalledWith('cat-delete', 'topicCount', -1);
    expect(mockDeleteDoc).toHaveBeenCalledWith({ id: 'reply-a' });
    expect(mockDeleteDoc).toHaveBeenCalledWith({ id: 'reply-b' });
    expect(mockDeleteDoc).toHaveBeenCalledWith(expect.objectContaining({ kind: 'doc' }));
  });

  it('maps topics with filters, sorting and pagination metadata', async () => {
    mockGetDocs.mockResolvedValueOnce(
      createQuerySnapshot([
        createTopic({ id: 'topic-1' }),
        createTopic({ id: 'topic-2', createdAt: new Date('2025-01-08T12:00:00.000Z') }),
        createTopic({ id: 'topic-extra', createdAt: new Date('2025-01-09T12:00:00.000Z') })
      ])
    );

    const result = await forumService.getTopics(
      {
        categoryId: 'cat-1',
        authorId: 'author-1',
        status: TopicStatus.PUBLISHED,
        isPinned: false,
        sortBy: 'popular'
      },
      2,
      { id: 'last-doc' }
    );

    expect(result.topics).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(mockWhere).toHaveBeenCalledWith('categoryId', '==', 'cat-1');
    expect(mockWhere).toHaveBeenCalledWith('authorId', '==', 'author-1');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', TopicStatus.PUBLISHED);
    expect(mockWhere).toHaveBeenCalledWith('isPinned', '==', false);
    expect(mockOrderBy).toHaveBeenCalledWith('viewCount', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(3);
    expect(mockStartAfter).toHaveBeenCalledWith({ id: 'last-doc' });
  });

  it('increments views and toggles topic likes with notification only for new like on someone else topic', async () => {
    const createNotificationSpy = jest.spyOn(forumService, 'createNotification').mockResolvedValue(undefined);
    mockGetDoc
      .mockResolvedValueOnce(createDocSnapshot(createTopic({ likes: ['user-a'] })))
      .mockResolvedValueOnce(createDocSnapshot(createTopic({ authorId: 'owner-1', likes: ['user-b'] })))
      .mockResolvedValueOnce(createDocSnapshot(createTopic({ authorId: 'self-user', likes: [] })));

    await forumService.incrementViewCount('topic-views');
    await forumService.toggleTopicLike('topic-like-remove', 'user-a');
    await forumService.toggleTopicLike('topic-like-add', 'user-z');
    await forumService.toggleTopicLike('topic-like-self', 'self-user');

    expect(mockIncrement).toHaveBeenCalledWith(1);
    expect(mockArrayRemove).toHaveBeenCalledWith('user-a');
    expect(mockArrayUnion).toHaveBeenCalledWith('user-z');
    expect(createNotificationSpy).toHaveBeenCalledTimes(1);
    expect(createNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'owner-1',
        type: NotificationType.TOPIC_LIKED,
        topicId: 'topic-like-add'
      })
    );
  });

  it('creates replies, lists them and toggles reply likes', async () => {
    const updateCategoryStatsSpy = jest.spyOn(forumService as any, 'updateCategoryStats').mockResolvedValue(undefined);
    const createActivitySpy = jest.spyOn(forumService, 'createActivity').mockResolvedValue(undefined);
    jest.spyOn(forumService, 'getTopic').mockResolvedValue(createTopic({ id: 'topic-1', categoryId: 'cat-1' }));
    mockAddDoc.mockResolvedValueOnce({ id: 'reply-created' });
    mockGetDocs.mockResolvedValueOnce(
      createQuerySnapshot([
        createReply({ id: 'reply-1' }),
        createReply({ id: 'reply-2' }),
        createReply({ id: 'reply-3' })
      ])
    );
    mockGetDoc
      .mockResolvedValueOnce(createDocSnapshot(createReply({ id: 'reply-like', likes: ['user-1'] })))
      .mockResolvedValueOnce(createDocSnapshot(createReply({ id: 'reply-like-2', likes: [] })));

    const replyId = await forumService.createReply({
      topicId: 'topic-1',
      content: 'Nova resposta',
      authorId: 'user-10',
      authorName: 'Responder',
      authorEmail: 'responder@example.com',
      status: ReplyStatus.PUBLISHED,
      attachments: []
    });
    const replies = await forumService.getReplies('topic-1', 2, { id: 'reply-last' });
    await forumService.toggleReplyLike('reply-like', 'user-1');
    await forumService.toggleReplyLike('reply-like-2', 'user-2');

    expect(replyId).toBe('reply-created');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        replyCount: { kind: 'increment', value: 1 },
        lastReplyAt: timestampValue,
        lastReplyBy: 'Responder'
      })
    );
    expect(updateCategoryStatsSpy).toHaveBeenCalledWith('cat-1', 'replyCount', 1);
    expect(createActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActivityType.REPLY_CREATED,
        replyId: 'reply-created'
      })
    );
    expect(replies.replies).toHaveLength(2);
    expect(replies.hasMore).toBe(true);
    expect(mockArrayRemove).toHaveBeenCalledWith('user-1');
    expect(mockArrayUnion).toHaveBeenCalledWith('user-2');
  });

  it('creates and lists categories, notifications and activities', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'category-created' });
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([createCategory()]))
      .mockResolvedValueOnce(createQuerySnapshot([createNotification()]))
      .mockResolvedValueOnce(createQuerySnapshot([createActivity()]));

    const createdCategoryId = await forumService.createCategory({
      name: 'Nova categoria',
      description: 'Descricao',
      icon: 'hash',
      color: '#10b981',
      slug: 'nova-categoria',
      isActive: true,
      requiresApproval: false,
      allowedRoles: ['member'],
      moderators: [],
      displayOrder: 2
    });

    await forumService.createNotification({
      userId: 'user-1',
      type: NotificationType.NEW_REPLY,
      topicId: 'topic-1',
      triggeredBy: 'user-2',
      triggeredByName: 'Outro',
      title: 'Nova resposta',
      message: 'Responderam seu topico'
    });

    await forumService.createActivity({
      type: ActivityType.USER_JOINED,
      userId: 'user-3',
      userName: 'Novo membro',
      description: 'Entrou no forum'
    });

    const categories = await forumService.getCategories();
    const notifications = await forumService.getUserNotifications('user-1', true);
    const activities = await forumService.getRecentActivities(5);

    expect(createdCategoryId).toBe('category-created');
    expect(categories[0]).toEqual(expect.objectContaining({ id: 'cat-1' }));
    expect(notifications[0]).toEqual(expect.objectContaining({ id: 'notification-1', isRead: false }));
    expect(activities[0]).toEqual(expect.objectContaining({ id: 'activity-1' }));
    expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
    expect(mockOrderBy).toHaveBeenCalledWith('displayOrder', 'asc');
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('aggregates forum statistics with published popular topics only', async () => {
    const topicPublished = createTopic({ id: 'topic-popular', viewCount: 120, status: TopicStatus.PUBLISHED });
    const topicDraft = createTopic({ id: 'topic-draft', viewCount: 999, status: TopicStatus.DRAFT });
    const recentActivitySpy = jest.spyOn(forumService, 'getRecentActivities').mockResolvedValue([createActivity()]);
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([topicPublished, topicDraft]))
      .mockResolvedValueOnce({ size: 4, docs: [] })
      .mockResolvedValueOnce({ size: 3, docs: [] });

    const stats = await forumService.getForumStats();

    expect(stats).toEqual(
      expect.objectContaining({
        totalTopics: 2,
        totalReplies: 4,
        totalUsers: 3,
        totalViews: 1119,
        activeUsers: 0,
        topContributors: [],
        recentActivity: [expect.objectContaining({ id: 'activity-1' })]
      })
    );
    expect(stats.popularTopics).toEqual([expect.objectContaining({ id: 'topic-popular' })]);
    expect(recentActivitySpy).toHaveBeenCalledWith(10);
  });
});
