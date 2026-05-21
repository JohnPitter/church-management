import { FirebaseHomeBuilderRepository } from '../FirebaseHomeBuilderRepository';
import { ComponentType, HomeLayout } from '../../../domain/entities/HomeBuilder';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn()
  }
}));

const firestore = jest.requireMock('firebase/firestore');
const mockCollection = firestore.collection as jest.Mock;
const mockDoc = firestore.doc as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockAddDoc = firestore.addDoc as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;
const mockDeleteDoc = firestore.deleteDoc as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockLimit = firestore.limit as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;

describe('FirebaseHomeBuilderRepository', () => {
  let repository: FirebaseHomeBuilderRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createLayout = (overrides: Partial<HomeLayout> = {}): HomeLayout => ({
    id: 'layout-1',
    name: 'Layout Principal',
    description: 'Descricao',
    components: [
      {
        id: 'comp-1',
        type: ComponentType.HERO,
        order: 1,
        enabled: true,
        settings: { title: 'Hero' },
        responsive: { mobile: { title: 'Hero mobile' } }
      }
    ],
    globalSettings: { backgroundColor: '#fff' },
    isActive: true,
    isDefault: false,
    createdBy: 'admin',
    createdAt: new Date('2025-01-01T12:00:00.000Z'),
    updatedAt: new Date('2025-01-02T12:00:00.000Z'),
    version: 2,
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

  const createQuerySnapshot = (docs: any[], empty = false) => ({
    empty,
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseHomeBuilderRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
  });

  it('creates, updates, fetches and deletes layouts', async () => {
    const layout = createLayout();
    mockAddDoc.mockResolvedValueOnce({ id: 'layout-created' });
    jest.spyOn(repository, 'getLayoutById').mockResolvedValueOnce(createLayout({ id: 'layout-updated', name: 'Atualizado' }));
    mockGetDoc
      .mockResolvedValueOnce(createDocSnapshot(layout))
      .mockResolvedValueOnce(createDocSnapshot(null, false));

    const created = await repository.createLayout({
      name: layout.name,
      description: layout.description,
      components: layout.components,
      globalSettings: layout.globalSettings,
      isActive: layout.isActive,
      isDefault: layout.isDefault,
      createdBy: layout.createdBy,
      version: layout.version
    });
    const updated = await repository.updateLayout('layout-updated', {
      id: 'ignored',
      createdAt: new Date(),
      name: 'Atualizado',
      components: layout.components
    });
    const found = await repository.getLayoutById('layout-1');
    const missing = await repository.getLayoutById('missing');
    await repository.deleteLayout('layout-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'layout-created', name: 'Layout Principal' }));
    expect(updated).toEqual(expect.objectContaining({ id: 'layout-updated', name: 'Atualizado' }));
    expect(found).toEqual(expect.objectContaining({ id: 'layout-1', name: 'Layout Principal' }));
    expect(missing).toBeNull();
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('lists all layouts, gets the active one and filters by user', async () => {
    const active = createLayout({ id: 'layout-active', isActive: true });
    const inactive = createLayout({ id: 'layout-inactive', isActive: false, createdBy: 'user-2' });
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([active, inactive]))
      .mockResolvedValueOnce(createQuerySnapshot([active], false))
      .mockResolvedValueOnce(createQuerySnapshot([active]));

    const all = await repository.getAllLayouts();
    const current = await repository.getActiveLayout();
    const byUser = await repository.getLayoutsByUser('admin');

    expect(all).toHaveLength(2);
    expect(current).toEqual(expect.objectContaining({ id: 'layout-active' }));
    expect(byUser).toEqual([expect.objectContaining({ createdBy: 'admin' })]);
    expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
    expect(mockWhere).toHaveBeenCalledWith('createdBy', '==', 'admin');
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('switches active layout and allows deactivating all', async () => {
    jest.spyOn(repository, 'getAllLayouts').mockResolvedValue([
      createLayout({ id: 'layout-a', isActive: true }),
      createLayout({ id: 'layout-b', isActive: false })
    ]);

    await repository.setActiveLayout('layout-b');
    await repository.setActiveLayout(null);

    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isActive: false, updatedAt: { kind: 'now' } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isActive: true, updatedAt: { kind: 'now' } }));
  });

  it('duplicates layouts and regenerates component ids', async () => {
    const original = createLayout({ id: 'original', isActive: true, isDefault: true, version: 5 });
    jest.spyOn(repository, 'getLayoutById').mockResolvedValueOnce(original);
    jest.spyOn(repository, 'createLayout').mockResolvedValueOnce(createLayout({ id: 'duplicated', name: 'Cópia', isActive: false, isDefault: false, version: 1 }));

    const duplicated = await repository.duplicateLayout('original', 'Cópia', 'editor');

    expect(duplicated).toEqual(expect.objectContaining({ id: 'duplicated', name: 'Cópia' }));
    expect((repository.createLayout as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: 'Cópia',
        isActive: false,
        isDefault: false,
        createdBy: 'editor',
        version: 1
      })
    );
  });
});
