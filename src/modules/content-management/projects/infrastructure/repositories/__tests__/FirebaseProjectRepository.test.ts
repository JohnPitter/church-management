import { FirebaseProjectRepository } from '../FirebaseProjectRepository';
import { Project, ProjectRegistration, ProjectStatus, RegistrationStatus } from '../../../domain/entities/Project';

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

describe('FirebaseProjectRepository', () => {
  let repository: FirebaseProjectRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createProject = (overrides: Partial<Project> = {}): Project => ({
    id: 'proj-1',
    name: 'Projeto Esperança',
    description: 'Descricao',
    objectives: ['Objetivo 1'],
    startDate: new Date('2025-03-01T12:00:00.000Z'),
    endDate: new Date('2025-04-01T12:00:00.000Z'),
    responsible: 'lider-1',
    status: ProjectStatus.Active,
    category: 'social',
    budget: 1000,
    maxParticipants: 20,
    requiresApproval: true,
    imageURL: 'https://image',
    createdAt: new Date('2025-02-01T12:00:00.000Z'),
    updatedAt: new Date('2025-02-02T12:00:00.000Z'),
    createdBy: 'admin',
    ...overrides
  });

  const createRegistration = (overrides: Partial<ProjectRegistration> = {}): ProjectRegistration => ({
    id: 'reg-1',
    projectId: 'proj-1',
    userId: 'user-1',
    userName: 'Usuário',
    registrationDate: new Date('2025-03-10T12:00:00.000Z'),
    status: RegistrationStatus.Pending,
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        startDate: data.startDate ? createTimestamp(data.startDate) : undefined,
        endDate: data.endDate ? createTimestamp(data.endDate) : undefined,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined,
        registrationDate: data.registrationDate ? createTimestamp(data.registrationDate) : undefined,
        approvedAt: data.approvedAt ? createTimestamp(data.approvedAt) : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[], empty = false) => ({
    empty,
    size: docs.length,
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseProjectRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds projects by name and id and returns null when missing', async () => {
    const project = createProject({ id: 'proj-found' });
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([project]));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([], true));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(project));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

    await expect(repository.findByName(project.name)).resolves.toEqual(expect.objectContaining({ id: 'proj-found' }));
    await expect(repository.findByName('none')).resolves.toBeNull();
    await expect(repository.findById('proj-found')).resolves.toEqual(expect.objectContaining({ id: 'proj-found' }));
    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('lists and filters projects', async () => {
    const project = createProject();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([project]))
      .mockResolvedValueOnce(createQuerySnapshot([project]))
      .mockResolvedValueOnce(createQuerySnapshot([project]))
      .mockResolvedValueOnce(createQuerySnapshot([project]))
      .mockResolvedValueOnce(createQuerySnapshot([project]))
      .mockResolvedValueOnce(createQuerySnapshot([project]));

    await expect(repository.findAll()).resolves.toHaveLength(1);
    await expect(repository.findByStatus(ProjectStatus.Active)).resolves.toHaveLength(1);
    await expect(repository.findByCategory('social')).resolves.toHaveLength(1);
    await expect(repository.findByResponsible('lider-1')).resolves.toHaveLength(1);
    await expect(repository.findActive()).resolves.toHaveLength(1);
    await expect(repository.findUpcoming(3)).resolves.toHaveLength(1);

    expect(mockWhere).toHaveBeenCalledWith('status', '==', ProjectStatus.Active);
    expect(mockWhere).toHaveBeenCalledWith('category', '==', 'social');
    expect(mockWhere).toHaveBeenCalledWith('responsible', '==', 'lider-1');
    expect(mockLimit).toHaveBeenCalledWith(3);
  });

  it('supports date-range queries and shared mapping paths', async () => {
    const project = createProject();
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([project]));

    await expect(repository.findByDateRange(new Date('2025-03-01T00:00:00.000Z'), new Date('2025-03-31T23:59:59.999Z'))).resolves.toHaveLength(1);
    expect(mockWhere).toHaveBeenCalledWith('startDate', '>=', expect.objectContaining({ toDate: expect.any(Function) }));
    expect(mockWhere).toHaveBeenCalledWith('startDate', '<=', expect.objectContaining({ toDate: expect.any(Function) }));
  });

  it('creates, updates, deletes and changes project status', async () => {
    const project = createProject();
    mockAddDoc.mockResolvedValueOnce({ id: 'proj-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createProject({ id: 'proj-updated', name: 'Atualizado' }));

    const created = await repository.create({
      name: project.name,
      description: project.description,
      objectives: project.objectives,
      startDate: project.startDate,
      endDate: project.endDate,
      responsible: project.responsible,
      status: project.status,
      category: project.category,
      budget: project.budget,
      maxParticipants: project.maxParticipants,
      requiresApproval: project.requiresApproval,
      imageURL: project.imageURL,
      createdBy: project.createdBy
    });
    const updated = await repository.update('proj-updated', {
      id: 'ignored',
      createdAt: new Date(),
      name: 'Atualizado',
      startDate: project.startDate,
      endDate: project.endDate
    });
    await repository.updateStatus('proj-updated', ProjectStatus.Paused);
    await repository.cancelProject('proj-updated', 'Motivo', 'admin');
    await repository.completeProject('proj-updated', 'admin');
    await repository.delete('proj-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'proj-created', name: project.name }));
    expect(updated).toEqual(expect.objectContaining({ id: 'proj-updated', name: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: ProjectStatus.Paused, updatedAt: { kind: 'now' } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: ProjectStatus.Cancelled, cancellationReason: 'Motivo', cancelledBy: 'admin' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: ProjectStatus.Completed, completedBy: 'admin' }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('handles project registrations and stats', async () => {
    const registrationA = createRegistration();
    const registrationB = createRegistration({ id: 'reg-2', status: RegistrationStatus.Approved, approvedBy: 'admin', approvedAt: new Date('2025-03-12T12:00:00.000Z') });
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([registrationA, registrationB]))
      .mockResolvedValueOnce(createQuerySnapshot([registrationA]))
      .mockResolvedValueOnce({ size: 2 })
      .mockResolvedValueOnce({ size: 1 })
      .mockResolvedValueOnce({ size: 1 });
    mockAddDoc.mockResolvedValueOnce({ id: 'reg-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createProject({ id: 'proj-stats' }));

    const registrations = await repository.findRegistrations('proj-1');
    const userRegistrations = await repository.findUserRegistrations('user-1');
    const created = await repository.createRegistration({
      projectId: 'proj-1',
      userId: 'user-2',
      userName: 'Novo',
      status: RegistrationStatus.Pending
    });
    await repository.updateRegistrationStatus('reg-created', RegistrationStatus.Approved, 'admin');
    await repository.deleteRegistration('reg-created');
    const stats = await repository.getProjectStats('proj-stats');

    expect(registrations).toHaveLength(2);
    expect(userRegistrations).toHaveLength(1);
    expect(created).toEqual(expect.objectContaining({ id: 'reg-created', userId: 'user-2' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: RegistrationStatus.Approved, approvedBy: 'admin' }));
    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(stats.totalRegistrations).toBe(2);
    expect(stats.approvedRegistrations).toBe(1);
    expect(stats.pendingRegistrations).toBe(1);
    expect(typeof stats.completionPercentage).toBe('number');
  });
});
