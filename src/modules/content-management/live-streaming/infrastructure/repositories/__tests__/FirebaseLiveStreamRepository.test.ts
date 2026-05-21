import { FirebaseLiveStreamRepository } from '../FirebaseLiveStreamRepository';
import { LiveStream, StreamCategory, StreamStatus } from '../../../domain/entities/LiveStream';

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
  Timestamp: {
    now: jest.fn(),
    fromDate: jest.fn()
  }
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
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;

describe('FirebaseLiveStreamRepository', () => {
  let repository: FirebaseLiveStreamRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createStream = (overrides: Partial<LiveStream> = {}): LiveStream => ({
    id: 'stream-1',
    title: 'Culto Domingo',
    description: 'Descricao',
    streamUrl: 'https://stream',
    thumbnailUrl: 'https://thumb',
    isLive: false,
    scheduledDate: new Date('2025-03-30T10:00:00.000Z'),
    duration: 3600,
    viewCount: 100,
    category: StreamCategory.Culto,
    status: StreamStatus.Scheduled,
    createdAt: new Date('2025-03-01T10:00:00.000Z'),
    updatedAt: new Date('2025-03-02T10:00:00.000Z'),
    createdBy: 'admin',
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        scheduledDate: data.scheduledDate ? createTimestamp(data.scheduledDate) : undefined,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseLiveStreamRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds by id and returns null when stream does not exist', async () => {
    const stream = createStream({ id: 'stream-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(stream));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

    await expect(repository.findById('stream-found')).resolves.toEqual(
      expect.objectContaining({ id: 'stream-found', scheduledDate: stream.scheduledDate })
    );
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('lists and filters streams by status, category, live, schedule, date range and popularity', async () => {
    const stream = createStream();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]))
      .mockResolvedValueOnce(createQuerySnapshot([stream]));

    await expect(repository.findAll()).resolves.toHaveLength(1);
    await expect(repository.findByStatus(StreamStatus.Scheduled)).resolves.toHaveLength(1);
    await expect(repository.findByCategory(StreamCategory.Culto)).resolves.toHaveLength(1);
    await expect(repository.findLiveStreams()).resolves.toHaveLength(1);
    await expect(repository.findScheduledStreams()).resolves.toHaveLength(1);
    await expect(repository.findUpcomingStreams(3)).resolves.toHaveLength(1);
    await expect(repository.findPastStreams(2)).resolves.toHaveLength(1);
    await expect(repository.findMostViewed(4)).resolves.toHaveLength(1);

    expect(mockWhere).toHaveBeenCalledWith('status', '==', StreamStatus.Scheduled);
    expect(mockWhere).toHaveBeenCalledWith('category', '==', StreamCategory.Culto);
    expect(mockWhere).toHaveBeenCalledWith('isLive', '==', true);
    expect(mockLimit).toHaveBeenCalledWith(3);
    expect(mockLimit).toHaveBeenCalledWith(2);
    expect(mockLimit).toHaveBeenCalledWith(4);
  });

  it('creates, updates, deletes and changes stream runtime state', async () => {
    const stream = createStream();
    mockAddDoc.mockResolvedValueOnce({ id: 'stream-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createStream({ id: 'stream-updated', title: 'Atualizado' }));

    const created = await repository.create({
      title: stream.title,
      description: stream.description,
      streamUrl: stream.streamUrl,
      thumbnailUrl: stream.thumbnailUrl,
      isLive: stream.isLive,
      scheduledDate: stream.scheduledDate,
      duration: stream.duration,
      viewCount: stream.viewCount,
      category: stream.category,
      status: stream.status,
      createdBy: stream.createdBy
    });
    const updated = await repository.update('stream-updated', {
      id: 'ignored',
      createdAt: new Date(),
      title: 'Atualizado',
      scheduledDate: stream.scheduledDate
    });
    await repository.updateStatus('stream-updated', StreamStatus.Live);
    await repository.startStream('stream-updated', 'https://live');
    await repository.endStream('stream-updated', 7200);
    await repository.cancelStream('stream-updated', 'Falha tecnica', 'admin');
    await repository.updateViewCount('stream-updated', 999);
    await repository.delete('stream-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'stream-created', title: stream.title }));
    expect(updated).toEqual(expect.objectContaining({ id: 'stream-updated', title: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StreamStatus.Live, updatedAt: { kind: 'now' } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isLive: true, streamUrl: 'https://live' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StreamStatus.Ended, isLive: false, duration: 7200 }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StreamStatus.Cancelled, cancellationReason: 'Falha tecnica', cancelledBy: 'admin' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ viewCount: 999 }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('finds streams in a date range and wraps repository errors', async () => {
    const stream = createStream();
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([stream]));

    await expect(
      repository.findByDateRange(new Date('2025-03-01T00:00:00.000Z'), new Date('2025-03-31T23:59:59.999Z'))
    ).resolves.toHaveLength(1);
    expect(mockWhere).toHaveBeenCalledWith('scheduledDate', '>=', expect.objectContaining({ toDate: expect.any(Function) }));
    expect(mockWhere).toHaveBeenCalledWith('scheduledDate', '<=', expect.objectContaining({ toDate: expect.any(Function) }));

    mockGetDoc.mockRejectedValueOnce(new Error('read failed'));
    await expect(repository.findById('broken')).rejects.toThrow('Erro ao buscar transmissão');
  });
});
