import {
  ModalidadeAtendimento,
  ProfissionalAssistencia,
  StatusProfissional,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { FirebaseProfissionalAssistenciaRepository } from '../FirebaseProfissionalAssistenciaRepository';

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

describe('FirebaseProfissionalAssistenciaRepository', () => {
  let repository: FirebaseProfissionalAssistenciaRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createProfissional = (overrides: Partial<ProfissionalAssistencia> = {}): ProfissionalAssistencia => ({
    id: 'prof-1',
    nome: 'Dra. Maria',
    cpf: '12345678900',
    rg: '112233',
    telefone: '11999999999',
    email: 'maria@example.com',
    endereco: {
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01000-000'
    },
    especialidade: TipoAssistencia.Psicologica,
    subespecialidades: ['adulto'],
    registroProfissional: 'CRP-123',
    status: StatusProfissional.Ativo,
    dataCadastro: new Date('2025-01-01T12:00:00.000Z'),
    horariosFuncionamento: [{ diaSemana: 2, horaInicio: '09:00', horaFim: '12:00' }],
    valorConsulta: 150,
    tempoConsulta: 50,
    observacoes: 'Observacao',
    modalidadesAtendimento: [ModalidadeAtendimento.Online],
    documentos: [],
    avaliacoes: [],
    createdAt: new Date('2025-01-01T12:00:00.000Z'),
    updatedAt: new Date('2025-01-02T12:00:00.000Z'),
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
        dataCadastro: data.dataCadastro ? createTimestamp(data.dataCadastro) : undefined,
        dataInativacao: data.dataInativacao ? createTimestamp(data.dataInativacao) : undefined,
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
    repository = new FirebaseProfissionalAssistenciaRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds professionals by id and lists all', async () => {
    const profissional = createProfissional({ id: 'prof-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(profissional));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([profissional]));

    await expect(repository.findById('prof-found')).resolves.toEqual(expect.objectContaining({ id: 'prof-found' }));
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.findAll()).resolves.toEqual([expect.objectContaining({ id: 'prof-found' })]);
    expect(mockOrderBy).toHaveBeenCalledWith('nome', 'asc');
  });

  it('creates professionals and maps firebase errors to friendly messages', async () => {
    const profissional = createProfissional();
    mockAddDoc.mockResolvedValueOnce({ id: 'prof-created' });

    const created = await repository.create({
      nome: profissional.nome,
      cpf: profissional.cpf,
      rg: profissional.rg,
      telefone: profissional.telefone,
      email: profissional.email,
      endereco: profissional.endereco,
      especialidade: profissional.especialidade,
      subespecialidades: profissional.subespecialidades,
      registroProfissional: profissional.registroProfissional,
      status: profissional.status,
      dataCadastro: profissional.dataCadastro,
      horariosFuncionamento: profissional.horariosFuncionamento,
      valorConsulta: profissional.valorConsulta,
      tempoConsulta: profissional.tempoConsulta,
      observacoes: profissional.observacoes,
      modalidadesAtendimento: profissional.modalidadesAtendimento,
      documentos: profissional.documentos,
      avaliacoes: profissional.avaliacoes,
      createdBy: profissional.createdBy
    });

    expect(created).toEqual(expect.objectContaining({ id: 'prof-created', nome: profissional.nome }));
    expect(mockTimestampFromDate).toHaveBeenCalledWith(profissional.dataCadastro);

    mockAddDoc.mockRejectedValueOnce({ code: 'permission-denied' });
    await expect(repository.create({ ...(profissional as any) })).rejects.toThrow('Erro de permissão');
    mockAddDoc.mockRejectedValueOnce({ code: 'unauthenticated' });
    await expect(repository.create({ ...(profissional as any) })).rejects.toThrow('Erro de autenticação');
    mockAddDoc.mockRejectedValueOnce({ code: 'invalid-argument' });
    await expect(repository.create({ ...(profissional as any) })).rejects.toThrow('Erro de dados');
  });

  it('updates, deactivates, activates and physically deletes professionals', async () => {
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createProfissional({ id: 'prof-updated', nome: 'Atualizado' }));

    const updated = await repository.update('prof-updated', {
      id: 'ignored',
      createdAt: new Date(),
      nome: 'Atualizado',
      dataCadastro: new Date('2025-01-01T12:00:00.000Z')
    } as any);
    await repository.delete('prof-updated');
    await repository.updateStatus('prof-updated', StatusProfissional.Inativo, 'Motivo');
    await repository.activateProfissional('prof-updated');
    await repository.deactivateProfissional('prof-updated', 'Outro motivo');
    await repository.deletePhysically('prof-updated');

    expect(updated).toEqual(expect.objectContaining({ id: 'prof-updated', nome: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StatusProfissional.Inativo, updatedAt: { kind: 'now' } }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ dataInativacao: { kind: 'now' }, motivoInativacao: 'Motivo' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StatusProfissional.Ativo, dataInativacao: null, motivoInativacao: null }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('filters by type, status and unique fields, with fallback for missing composite index', async () => {
    const psicologa = createProfissional({ id: 'prof-psi', especialidade: TipoAssistencia.Psicologica, nome: 'Ana' });
    const social = createProfissional({ id: 'prof-social', especialidade: TipoAssistencia.Social, nome: 'Bruno' });

    mockGetDocs
      .mockRejectedValueOnce(new Error('missing index'))
      .mockResolvedValueOnce(createQuerySnapshot([psicologa]))
      .mockResolvedValueOnce(createQuerySnapshot([psicologa]))
      .mockResolvedValueOnce(createQuerySnapshot([psicologa]))
      .mockResolvedValueOnce(createQuerySnapshot([psicologa]))
      .mockResolvedValueOnce(createQuerySnapshot([], true));
    jest.spyOn(repository, 'findAll').mockResolvedValueOnce([social, psicologa]);

    await expect(repository.findByTipo(TipoAssistencia.Psicologica)).resolves.toEqual([expect.objectContaining({ id: 'prof-psi' })]);
    await expect(repository.findByStatus(StatusProfissional.Ativo)).resolves.toHaveLength(1);
    await expect(repository.findByRegistroProfissional('CRP-123')).resolves.toEqual(expect.objectContaining({ id: 'prof-psi' }));
    await expect(repository.findByCPF('12345678900')).resolves.toEqual(expect.objectContaining({ id: 'prof-psi' }));
    await expect(repository.findByEmail('maria@example.com')).resolves.toEqual(expect.objectContaining({ id: 'prof-psi' }));
    await expect(repository.findByEmail('missing@example.com')).resolves.toBeNull();

    expect(mockWhere).toHaveBeenCalledWith('especialidade', '==', TipoAssistencia.Psicologica);
    expect(mockWhere).toHaveBeenCalledWith('status', '==', StatusProfissional.Ativo);
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('searches available professionals and calculates statistics', async () => {
    const tuesday = new Date('2025-03-18T10:00:00.000Z');
    const psicologa = createProfissional({
      id: 'prof-ana',
      nome: 'Ana Silva',
      especialidade: TipoAssistencia.Psicologica,
      status: StatusProfissional.Ativo,
      horariosFuncionamento: [{ diaSemana: tuesday.getDay(), horaInicio: '09:00', horaFim: '12:00' }]
    });
    const social = createProfissional({
      id: 'prof-bruno',
      nome: 'Bruno Souza',
      especialidade: TipoAssistencia.Social,
      status: StatusProfissional.Inativo,
      telefone: '11888887777',
      registroProfissional: 'CRESS-999'
    });

    jest.spyOn(repository, 'findAll').mockResolvedValue([psicologa, social]);
    jest.spyOn(repository, 'findByTipo').mockResolvedValue([psicologa]);

    await expect(repository.searchProfissionais('ana')).resolves.toEqual([expect.objectContaining({ id: 'prof-ana' })]);
    await expect(repository.findDisponiveis(TipoAssistencia.Psicologica, tuesday)).resolves.toEqual([expect.objectContaining({ id: 'prof-ana' })]);

    const stats = await repository.getStatistics();
    expect(stats.totalProfissionais).toBe(2);
    expect(stats.totalAtivos).toBe(1);
    expect(stats.totalInativos).toBe(1);
    expect(stats.porTipo[TipoAssistencia.Psicologica]).toBe(1);
    expect(stats.porTipo[TipoAssistencia.Social]).toBe(1);
    expect(stats.porStatus[StatusProfissional.Ativo]).toBe(1);
    expect(stats.porStatus[StatusProfissional.Inativo]).toBe(1);
  });
});
