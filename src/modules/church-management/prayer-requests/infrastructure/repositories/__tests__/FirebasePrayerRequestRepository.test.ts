import {
  CreatePrayerRequestData,
  PrayerRequest,
  PrayerRequestEntity,
  PrayerRequestStatus
} from '../../../domain/entities/PrayerRequest';
import { FirebasePrayerRequestRepository } from '../FirebasePrayerRequestRepository';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    fromDate: jest.fn()
  }
}));

const firestore = jest.requireMock('firebase/firestore');
const mockCollection = firestore.collection as jest.Mock;
const mockAddDoc = firestore.addDoc as jest.Mock;
const mockDoc = firestore.doc as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;
const mockDeleteDoc = firestore.deleteDoc as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockLimit = firestore.limit as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;

describe('FirebasePrayerRequestRepository', () => {
  let repository: FirebasePrayerRequestRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createPrayerRequest = (overrides: Partial<PrayerRequest> = {}): PrayerRequest => ({
    id: 'pr-1',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '11999999999',
    request: 'Pedido de oração por saúde e família',
    isUrgent: false,
    isAnonymous: false,
    status: PrayerRequestStatus.Pending,
    createdAt: new Date('2025-03-01T12:00:00.000Z'),
    updatedAt: new Date('2025-03-02T12:00:00.000Z'),
    prayedBy: [],
    source: 'website',
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined
      };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebasePrayerRequestRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('creates prayer requests and removes undefined fields before persisting', async () => {
    const data: CreatePrayerRequestData = {
      name: 'Maria',
      request: 'Pedido de oração por saúde e família',
      isAnonymous: true
    };
    const entitySpy = jest.spyOn(PrayerRequestEntity, 'create');
    mockAddDoc.mockResolvedValueOnce({ id: 'pr-created' });

    const result = await repository.create(data);

    expect(entitySpy).toHaveBeenCalledWith(data);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'Anônimo',
        request: data.request,
        isAnonymous: true,
        createdAt: expect.objectContaining({ toDate: expect.any(Function) }),
        updatedAt: expect.objectContaining({ toDate: expect.any(Function) })
      })
    );
    expect(mockAddDoc.mock.calls[0][1]).not.toHaveProperty('email');
    expect(result).toEqual(expect.objectContaining({ id: 'pr-created', name: 'Anônimo' }));
  });

  it('gets prayer requests by id and returns null when missing', async () => {
    const prayerRequest = createPrayerRequest({ id: 'pr-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(prayerRequest));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

    await expect(repository.getById('pr-found')).resolves.toEqual(
      expect.objectContaining({
        id: 'pr-found',
        createdAt: prayerRequest.createdAt,
        updatedAt: prayerRequest.updatedAt
      })
    );
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('lists all prayer requests and filters by status', async () => {
    const prayerA = createPrayerRequest({ id: 'pr-a' });
    const prayerB = createPrayerRequest({ id: 'pr-b', status: PrayerRequestStatus.Approved });

    mockGetDocs.mockResolvedValueOnce({
      forEach: (cb: (doc: any) => void) => [createDocSnapshot(prayerA), createDocSnapshot(prayerB)].forEach(cb)
    });
    mockGetDocs.mockResolvedValueOnce({
      forEach: (cb: (doc: any) => void) => [createDocSnapshot(prayerB)].forEach(cb)
    });

    const all = await repository.getAll(25);
    // eslint-disable-next-line testing-library/no-await-sync-query
    const approved = await repository.getByStatus(PrayerRequestStatus.Approved, 10);

    expect(all).toHaveLength(2);
    expect(approved).toEqual([expect.objectContaining({ id: 'pr-b', status: PrayerRequestStatus.Approved })]);
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockWhere).toHaveBeenCalledWith('status', '==', PrayerRequestStatus.Approved);
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('updates status and registers prayedBy without duplicates', async () => {
    const prayerRequest = createPrayerRequest({ id: 'pr-prayed', prayedBy: ['ana@example.com'] });
    jest.spyOn(repository, 'getById').mockResolvedValueOnce(prayerRequest).mockResolvedValueOnce(prayerRequest);

    await repository.updateStatus('pr-prayed', PrayerRequestStatus.Praying);
    await repository.addPrayedBy('pr-prayed', 'ana@example.com');
    await repository.addPrayedBy('pr-prayed', 'joao@example.com');

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: PrayerRequestStatus.Praying,
        updatedAt: expect.objectContaining({ toDate: expect.any(Function) })
      })
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        prayedBy: ['ana@example.com']
      })
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        prayedBy: ['ana@example.com', 'joao@example.com']
      })
    );
  });

  it('deletes prayer requests and wraps repository errors', async () => {
    await repository.delete('pr-delete');
    expect(mockDeleteDoc).toHaveBeenCalled();

    mockGetDoc.mockRejectedValueOnce(new Error('read failed'));
    await expect(repository.getById('broken')).rejects.toThrow('Erro ao buscar pedido de oração');

    mockAddDoc.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      repository.create({ name: 'João', request: 'Pedido de oração suficientemente longo' })
    ).rejects.toThrow('Erro ao criar pedido de oração');
  });
});
