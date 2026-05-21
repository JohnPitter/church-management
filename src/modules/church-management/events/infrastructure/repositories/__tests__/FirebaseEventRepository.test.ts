import { FirebaseEventRepository } from '../FirebaseEventRepository';
import { ConfirmationStatus, Event, EventCategory, EventConfirmation, EventStatus } from '../../../domain/entities/Event';

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

describe('FirebaseEventRepository', () => {
  let repository: FirebaseEventRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const category: EventCategory = {
    id: 'cat-1',
    name: 'Culto',
    color: '#3B82F6',
    priority: 1
  };

  const createEvent = (overrides: Partial<Event> = {}): Event => ({
    id: 'event-1',
    title: 'Culto Domingo',
    description: 'Descricao',
    date: new Date('2025-03-30T10:00:00.000Z'),
    time: '10:00',
    location: 'Templo',
    category,
    isPublic: true,
    requiresConfirmation: true,
    allowAnonymousRegistration: true,
    maxParticipants: 200,
    imageURL: 'https://image',
    streamingURL: 'https://stream',
    responsible: 'Pastor',
    status: EventStatus.Scheduled,
    createdAt: new Date('2025-03-01T10:00:00.000Z'),
    updatedAt: new Date('2025-03-02T10:00:00.000Z'),
    createdBy: 'admin',
    ...overrides
  });

  const createConfirmation = (overrides: Partial<EventConfirmation> = {}): EventConfirmation => ({
    id: 'conf-1',
    eventId: 'event-1',
    userId: 'user-1',
    userName: 'Joao',
    status: ConfirmationStatus.Confirmed,
    confirmedAt: new Date('2025-03-10T10:00:00.000Z'),
    notes: 'ok',
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    data: () => ({
      ...data,
      date: data?.date ? createTimestamp(data.date) : undefined,
      createdAt: data?.createdAt ? createTimestamp(data.createdAt) : undefined,
      updatedAt: data?.updatedAt ? createTimestamp(data.updatedAt) : undefined,
      confirmedAt: data?.confirmedAt ? createTimestamp(data.confirmedAt) : undefined
    }),
    exists: () => exists
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item)),
    size: docs.length,
    empty: docs.length === 0
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseEventRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds events by id and standard filters', async () => {
    const event = createEvent({ id: 'event-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(event));
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]))
      .mockResolvedValueOnce(createQuerySnapshot([event]));

    await expect(repository.findById('event-found')).resolves.toEqual(expect.objectContaining({ id: 'event-found' }));
    await expect(repository.findAll()).resolves.toHaveLength(1);
    await expect(repository.findByStatus(EventStatus.Scheduled)).resolves.toHaveLength(1);
    await expect(repository.findByCategory('cat-1')).resolves.toHaveLength(1);
    await expect(repository.findByDateRange(new Date('2025-03-01T00:00:00.000Z'), new Date('2025-03-31T23:59:59.999Z'))).resolves.toHaveLength(1);
    await expect(repository.findUpcoming(2)).resolves.toHaveLength(1);
    await expect(repository.findPast(2)).resolves.toHaveLength(1);
    await expect(repository.findPublicEvents()).resolves.toHaveLength(1);

    expect(mockLimit).toHaveBeenCalledWith(4);
    expect(mockLimit).toHaveBeenCalledWith(2);
    expect(mockWhere).toHaveBeenCalledWith('category.id', '==', 'cat-1');
    expect(mockWhere).toHaveBeenCalledWith('isPublic', '==', true);
  });

  it('creates, updates, deletes and cancels events', async () => {
    const event = createEvent();
    mockAddDoc.mockResolvedValueOnce({ id: 'event-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createEvent({ id: 'event-updated', title: 'Atualizado' }));

    const created = await repository.create({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      isPublic: event.isPublic,
      requiresConfirmation: event.requiresConfirmation,
      allowAnonymousRegistration: event.allowAnonymousRegistration,
      maxParticipants: event.maxParticipants,
      imageURL: event.imageURL,
      streamingURL: event.streamingURL,
      responsible: event.responsible,
      status: event.status,
      createdBy: event.createdBy
    });
    const updated = await repository.update('event-updated', {
      id: 'ignored',
      createdAt: new Date(),
      title: 'Atualizado',
      date: event.date
    });
    await repository.updateStatus('event-updated', EventStatus.InProgress);
    await repository.cancelEvent('event-updated', 'Chuva', 'admin');
    await repository.delete('event-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'event-created', title: event.title }));
    expect(updated).toEqual(expect.objectContaining({ id: 'event-updated', title: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: EventStatus.InProgress }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: EventStatus.Cancelled, cancellationReason: 'Chuva', cancelledBy: 'admin' }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('handles categories with fallback to defaults and update/delete flows', async () => {
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([{ ...category }]));
    mockAddDoc.mockResolvedValueOnce({ id: 'cat-created' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot({ ...category, id: 'cat-updated', name: 'Atualizada' }));

    await expect(repository.findAllCategories()).resolves.toEqual([expect.objectContaining({ id: 'cat-1' })]);
    await expect(repository.createCategory({ name: 'Nova', color: '#fff', priority: 2 })).resolves.toEqual(
      expect.objectContaining({ id: 'cat-created', name: 'Nova' })
    );
    await expect(repository.updateCategory('cat-updated', { name: 'Atualizada' })).resolves.toEqual(
      expect.objectContaining({ id: 'cat-updated', name: 'Atualizada' })
    );
    await repository.deleteCategory('cat-updated');

    mockGetDocs.mockRejectedValueOnce(new Error('missing collection'));
    const defaults = await repository.findAllCategories();
    expect(defaults).toHaveLength(6);
    expect(defaults[0].name).toBe('Culto');
  });

  it('manages confirmations and anonymous registrations', async () => {
    const confirmation = createConfirmation();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([confirmation]))
      .mockResolvedValueOnce(createQuerySnapshot([confirmation]))
      .mockResolvedValueOnce(createQuerySnapshot([]))
      .mockResolvedValueOnce(createQuerySnapshot([confirmation]))
      .mockResolvedValueOnce(createQuerySnapshot([]))
      .mockResolvedValueOnce(createQuerySnapshot([confirmation]));
    mockAddDoc.mockResolvedValueOnce({ id: 'conf-created' }).mockResolvedValueOnce({ id: 'anon-created' });

    await expect(repository.findConfirmations('event-1')).resolves.toEqual([expect.objectContaining({ id: 'conf-1' })]);
    await expect(repository.findUserConfirmations('user-1')).resolves.toEqual([expect.objectContaining({ id: 'conf-1' })]);
    await expect(
      repository.confirmAttendance({
        eventId: 'event-1',
        userId: 'user-2',
        userName: 'Maria',
        status: ConfirmationStatus.Maybe
      })
    ).resolves.toEqual(expect.objectContaining({ id: 'conf-created', status: ConfirmationStatus.Maybe }));

    await repository.updateConfirmation('conf-1', ConfirmationStatus.Declined);
    await repository.deleteConfirmation('conf-1');
    await expect(repository.countConfirmations('event-1')).resolves.toBe(1);

    await expect(
      repository.createAnonymousRegistration({
        eventId: 'event-1',
        name: 'Anon',
        email: 'Anon@Email.com',
        phone: '11999999999'
      })
    ).resolves.toEqual(expect.objectContaining({ id: 'anon-created', userEmail: 'Anon@Email.com', isAnonymous: true }));

    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([confirmation]));
    await expect(
      repository.createAnonymousRegistration({
        eventId: 'event-1',
        name: 'Dup',
        email: 'dup@email.com',
        phone: '11999999999'
      })
    ).rejects.toThrow('já está inscrito');
  });
});
