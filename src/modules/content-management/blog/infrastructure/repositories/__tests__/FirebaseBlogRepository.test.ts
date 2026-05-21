import { FirebaseBlogRepository } from '../FirebaseBlogRepository';
import { BlogPost, Comment, CommentStatus, PostStatus, PostVisibility } from '../../../domain/entities/BlogPost';

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
  increment: jest.fn(),
  Timestamp: {
    now: jest.fn(),
    fromDate: jest.fn()
  },
  limit: jest.fn()
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
const mockIncrement = firestore.increment as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;
const mockLimit = firestore.limit as jest.Mock;

describe('FirebaseBlogRepository', () => {
  let repository: FirebaseBlogRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
    id: 'post-1',
    title: 'Post teste',
    content: 'Conteudo longo suficiente para pesquisa',
    excerpt: 'Resumo',
    author: {
      id: 'author-1',
      name: 'Autor',
      role: 'editor'
    },
    categories: ['igreja'],
    tags: ['fe', 'comunidade'],
    status: PostStatus.Published,
    visibility: PostVisibility.Public,
    featuredImage: 'https://image',
    publishedAt: new Date('2025-03-10T12:00:00.000Z'),
    likes: 5,
    views: 100,
    commentsEnabled: true,
    isHighlighted: false,
    createdAt: new Date('2025-03-01T12:00:00.000Z'),
    updatedAt: new Date('2025-03-02T12:00:00.000Z'),
    ...overrides
  });

  const createComment = (overrides: Partial<Comment> = {}): Comment => ({
    id: 'comment-1',
    postId: 'post-1',
    author: {
      id: 'user-1',
      name: 'Comentador'
    },
    content: 'Comentário aprovado',
    likes: 2,
    status: CommentStatus.Approved,
    createdAt: new Date('2025-03-11T12:00:00.000Z'),
    updatedAt: new Date('2025-03-11T12:00:00.000Z'),
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    ref: { id: data?.id ?? 'doc-1' },
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        publishedAt: data.publishedAt ? createTimestamp(data.publishedAt) : null,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item)),
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb: (doc: any) => void) => docs.map(item => createDocSnapshot(item)).forEach(cb)
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseBlogRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockIncrement.mockImplementation((value: number) => ({ kind: 'increment', value }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
  });

  it('finds posts by id and common post filters', async () => {
    const postA = createPost({ id: 'post-a', publishedAt: new Date('2025-03-10T12:00:00.000Z') });
    const postB = createPost({ id: 'post-b', title: 'Outro post', tags: ['esperanca'], categories: ['missao'], author: { id: 'author-2', name: 'Outro', role: 'admin' } });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(postA)).mockResolvedValueOnce(createDocSnapshot(null, false));
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([postA, postB]))
      .mockResolvedValueOnce(createQuerySnapshot([postB, postA]))
      .mockResolvedValueOnce(createQuerySnapshot([postA]))
      .mockResolvedValueOnce(createQuerySnapshot([postB]))
      .mockResolvedValueOnce(createQuerySnapshot([postB]))
      .mockResolvedValueOnce(createQuerySnapshot([postA, postB]));

    await expect(repository.findById('post-a')).resolves.toEqual(expect.objectContaining({ id: 'post-a' }));
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.findAll()).resolves.toHaveLength(2);
    await expect(repository.findPublished()).resolves.toEqual([
      expect.objectContaining({ id: 'post-b' }),
      expect.objectContaining({ id: 'post-a' })
    ]);
    await expect(repository.findByAuthor('author-1')).resolves.toEqual([expect.objectContaining({ id: 'post-a' })]);
    await expect(repository.findByCategory('missao')).resolves.toEqual([expect.objectContaining({ id: 'post-b' })]);
    await expect(repository.findByTag('esperanca')).resolves.toEqual([expect.objectContaining({ id: 'post-b' })]);
    await expect(repository.search('esperanca')).resolves.toHaveLength(1);
  });

  it('creates, updates, deletes and tracks likes/views on posts', async () => {
    const post = createPost();
    mockAddDoc.mockResolvedValueOnce({ id: 'post-created' }).mockResolvedValueOnce({ id: 'like-created' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(createPost({ id: 'post-created' }))).mockResolvedValueOnce(createDocSnapshot(createPost({ id: 'post-updated', title: 'Atualizado' })));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([{ id: 'like-1' }]));

    const created = await repository.create({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      categories: post.categories,
      tags: post.tags,
      status: post.status,
      visibility: post.visibility,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      likes: post.likes,
      views: post.views,
      commentsEnabled: post.commentsEnabled,
      isHighlighted: post.isHighlighted
    });
    const updated = await repository.update('post-updated', { id: 'ignored' as any, title: 'Atualizado', publishedAt: post.publishedAt });
    await repository.incrementViews('post-updated');
    await repository.likePost('post-updated', 'user-1');
    await repository.unlikePost('post-updated', 'user-1');
    await repository.delete('post-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'post-created' }));
    expect(updated).toEqual(expect.objectContaining({ id: 'post-updated', title: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ views: { kind: 'increment', value: 1 } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ likes: { kind: 'increment', value: 1 } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ likes: { kind: 'increment', value: -1 } }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('checks likes, manages comments and computes popular/recent/stats', async () => {
    const post = createPost({ id: 'post-stats', views: 200, likes: 8 });
    const comment = createComment();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([{ id: 'like-doc' }]))
      .mockResolvedValueOnce(createQuerySnapshot([comment]))
      .mockResolvedValueOnce(createQuerySnapshot([createPost({ id: 'popular-1' })]))
      .mockResolvedValueOnce(createQuerySnapshot([createPost({ id: 'recent-1' })]))
      .mockResolvedValueOnce(createQuerySnapshot([comment, createComment({ id: 'comment-2' })]));
    mockAddDoc.mockResolvedValueOnce({ id: 'comment-created' }).mockResolvedValueOnce({ id: 'comment-like' });
    mockGetDoc
      .mockResolvedValueOnce(createDocSnapshot(comment))
      .mockResolvedValueOnce(createDocSnapshot(createComment({ id: 'comment-updated', content: 'Atualizado' })))
      .mockResolvedValueOnce(createDocSnapshot(post));

    await expect(repository.hasUserLiked('post-stats', 'user-1')).resolves.toBe(true);
    await expect(repository.findComments('post-1')).resolves.toEqual([expect.objectContaining({ id: 'comment-1' })]);
    await expect(
      repository.createComment({
        postId: 'post-1',
        author: comment.author,
        content: comment.content,
        likes: 0,
        status: CommentStatus.Approved
      })
    ).resolves.toEqual(expect.objectContaining({ id: 'comment-1' }));
    await expect(repository.updateComment('comment-updated', { content: 'Atualizado' })).resolves.toEqual(
      expect.objectContaining({ id: 'comment-updated', content: 'Atualizado' })
    );
    await repository.deleteComment('comment-1');
    await repository.likeComment('comment-1', 'user-1');
    await repository.unlikeComment('comment-1', 'user-1');
    await expect(repository.getPopularPosts(3)).resolves.toBeDefined();
    await expect(repository.getRecentPosts(2)).resolves.toBeDefined();

    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(post));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([comment, createComment({ id: 'comment-2' })]));

    await expect(repository.getPostStats('post-stats')).resolves.toEqual({ views: 200, likes: 8, comments: 2 });

    expect(mockLimit).toHaveBeenCalledWith(3);
    expect(mockLimit).toHaveBeenCalledWith(2);
  });
});
