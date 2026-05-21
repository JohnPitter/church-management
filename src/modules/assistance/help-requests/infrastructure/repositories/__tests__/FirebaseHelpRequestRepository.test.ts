import {
  HelpRequest,
  HelpRequestPriority,
  HelpRequestStatus
} from '@modules/assistance/help-requests/domain/entities/HelpRequest';
import { FirebaseHelpRequestRepository } from '../FirebaseHelpRequestRepository';

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
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
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
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;

describe('FirebaseHelpRequestRepository', () => {
  let repository: FirebaseHelpRequestRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createHelpRequest = (overrides: Partial<HelpRequest> = {}): HelpRequest => ({
    id: 'hr-1',
    requesterId: 'req-1',
    requesterName: 'Solicitante',
    requesterSpecialty: 'Psicologia',
    helperId: 'help-1',
    helperName: 'Ajudante',
    helperSpecialty: 'Assistência Social',
    assistidoId: 'ass-1',
    assistidoNome: 'Assistido',
    fichaId: 'ficha-1',
    motivo: 'Precisa de orientação',
    descricao: 'Descrição detalhada',
    prioridade: HelpRequestPriority.High,
    status: HelpRequestStatus.Pending,
    createdAt: new Date('2025-03-01T12:00:00.000Z'),
    updatedAt: new Date('2025-03-02T12:00:00.000Z'),
    createdBy: 'req-1',
    isRead: false,
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
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined,
        dataResposta: data.dataResposta ? createTimestamp(data.dataResposta) : undefined,
        readAt: data.readAt ? createTimestamp(data.readAt) : undefined
      };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseHelpRequestRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('creates help requests and maps the persisted entity back', async () => {
    const base = createHelpRequest();
    mockAddDoc.mockResolvedValueOnce({ id: 'hr-created' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot({ ...base, id: 'hr-created' }));

    const result = await repository.create({
      requesterId: base.requesterId,
      requesterName: base.requesterName,
      requesterSpecialty: base.requesterSpecialty,
      helperId: base.helperId,
      helperName: base.helperName,
      helperSpecialty: base.helperSpecialty,
      assistidoId: base.assistidoId,
      assistidoNome: base.assistidoNome,
      fichaId: base.fichaId,
      motivo: base.motivo,
      descricao: base.descricao,
      prioridade: base.prioridade,
      status: base.status,
      createdBy: base.createdBy,
      isRead: base.isRead
    });

    expect(mockAddDoc).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: 'hr-created', helperId: 'help-1' }));
  });

  it('finds by id and by helper/requester/ficha/status filters', async () => {
    const item = createHelpRequest();
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(item));
    mockGetDocs
      .mockResolvedValueOnce({ docs: [createDocSnapshot(item)] })
      .mockResolvedValueOnce({ docs: [createDocSnapshot(item)] })
      .mockResolvedValueOnce({ docs: [createDocSnapshot(item)] })
      .mockResolvedValueOnce({ docs: [createDocSnapshot(item)] })
      .mockResolvedValueOnce({ docs: [createDocSnapshot(item)] });

    await expect(repository.findById('hr-1')).resolves.toEqual(expect.objectContaining({ id: 'hr-1' }));
    await expect(repository.findByHelper('help-1')).resolves.toHaveLength(1);
    await expect(repository.findByRequester('req-1')).resolves.toHaveLength(1);
    await expect(repository.findUnreadByHelper('help-1')).resolves.toHaveLength(1);
    await expect(repository.findPendingByHelper('help-1')).resolves.toHaveLength(1);
    await expect(repository.findByFicha('ficha-1')).resolves.toHaveLength(1);

    expect(mockWhere).toHaveBeenCalledWith('helperId', '==', 'help-1');
    expect(mockWhere).toHaveBeenCalledWith('requesterId', '==', 'req-1');
    expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
    expect(mockWhere).toHaveBeenCalledWith('status', '==', HelpRequestStatus.Pending);
    expect(mockWhere).toHaveBeenCalledWith('fichaId', '==', 'ficha-1');
  });

  it('updates, marks as read, accepts, declines, resolves and cancels help requests', async () => {
    const item = createHelpRequest();
    jest.spyOn(repository, 'findById')
      .mockResolvedValueOnce({ ...item, status: HelpRequestStatus.Accepted })
      .mockResolvedValueOnce({ ...item, isRead: true, readAt: new Date() })
      .mockResolvedValueOnce({ ...item, status: HelpRequestStatus.Accepted, resposta: 'ok', dataResposta: new Date(), isRead: true })
      .mockResolvedValueOnce({ ...item, status: HelpRequestStatus.Declined, resposta: 'não', dataResposta: new Date(), isRead: true })
      .mockResolvedValueOnce({ ...item, status: HelpRequestStatus.Resolved, observacoes: 'resolvido' })
      .mockResolvedValueOnce({ ...item, status: HelpRequestStatus.Cancelled });

    await repository.update('hr-1', { status: HelpRequestStatus.Accepted, dataResposta: new Date(), readAt: new Date(), createdAt: new Date(), id: 'ignored' });
    await repository.markAsRead('hr-1');
    await repository.accept('hr-1', 'ok');
    await repository.decline('hr-1', 'não');
    await repository.resolve('hr-1', 'resolvido');
    await repository.cancel('hr-1');

    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(mockTimestampFromDate).toHaveBeenCalled();
  });

  it('counts unread and pending requests and falls back to zero on errors', async () => {
    jest.spyOn(repository, 'findUnreadByHelper').mockResolvedValueOnce([createHelpRequest(), createHelpRequest({ id: 'hr-2' })]).mockRejectedValueOnce(new Error('fail'));
    jest.spyOn(repository, 'findPendingByHelper').mockResolvedValueOnce([createHelpRequest()]).mockRejectedValueOnce(new Error('fail'));

    await expect(repository.countUnreadByHelper('help-1')).resolves.toBe(2);
    await expect(repository.countPendingByHelper('help-1')).resolves.toBe(1);
    await expect(repository.countUnreadByHelper('help-1')).resolves.toBe(0);
    await expect(repository.countPendingByHelper('help-1')).resolves.toBe(0);
  });
});
