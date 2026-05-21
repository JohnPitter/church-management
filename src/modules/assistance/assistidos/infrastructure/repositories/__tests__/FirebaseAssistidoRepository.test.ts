import {
  Assistido,
  Escolaridade,
  NecessidadeAssistido,
  SituacaoFamiliar,
  StatusAssistido,
  TipoAtendimento,
  TipoMoradia,
  TipoParentesco
} from '@modules/assistance/assistidos/domain/entities/Assistido';
import { FirebaseAssistidoRepository } from '../FirebaseAssistidoRepository';

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

describe('FirebaseAssistidoRepository', () => {
  let repository: FirebaseAssistidoRepository;

  const hasUndefinedValue = (value: unknown): boolean => {
    if (value === undefined) return true;
    if (value === null || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasUndefinedValue);

    return Object.values(value).some(hasUndefinedValue);
  };

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createAssistido = (overrides: Partial<Assistido> = {}): Assistido => ({
    id: 'ass-1',
    nome: 'Assistido Teste',
    cpf: '12345678900',
    rg: '112233',
    dataNascimento: new Date('1995-01-01T12:00:00.000Z'),
    telefone: '11999999999',
    email: 'assistido@example.com',
    endereco: {
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01000-000'
    },
    situacaoFamiliar: SituacaoFamiliar.Solteiro,
    rendaFamiliar: 1500,
    profissao: 'Auxiliar',
    escolaridade: Escolaridade.MedioCompleto,
    necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Saude],
    tipoMoradia: TipoMoradia.Alugada,
    quantidadeComodos: 3,
    possuiCadUnico: true,
    qualBeneficio: 'Bolsa',
    observacoes: 'Obs',
    status: StatusAssistido.Ativo,
    dataInicioAtendimento: new Date('2025-01-10T12:00:00.000Z'),
    dataUltimoAtendimento: new Date('2025-02-10T12:00:00.000Z'),
    responsavelAtendimento: 'Resp 1',
    familiares: [
      {
        id: 'fam-1',
        nome: 'Mae',
        parentesco: TipoParentesco.Mae,
        dataNascimento: new Date('1970-01-01T12:00:00.000Z'),
        cpf: '98765432100'
      }
    ],
    atendimentos: [
      {
        id: 'at-1',
        data: new Date('2025-02-10T12:00:00.000Z'),
        tipo: TipoAtendimento.CestaBasica,
        descricao: 'Entrega',
        responsavel: 'Resp 1',
        proximoRetorno: new Date('2025-03-10T12:00:00.000Z')
      }
    ],
    createdAt: new Date('2025-01-10T12:00:00.000Z'),
    updatedAt: new Date('2025-02-10T12:00:00.000Z'),
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
        dataNascimento: data.dataNascimento ? createTimestamp(data.dataNascimento) : undefined,
        dataInicioAtendimento: data.dataInicioAtendimento ? createTimestamp(data.dataInicioAtendimento) : undefined,
        dataUltimoAtendimento: data.dataUltimoAtendimento ? createTimestamp(data.dataUltimoAtendimento) : undefined,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined,
        familiares: (data.familiares || []).map((fam: any) => ({
          ...fam,
          dataNascimento: fam.dataNascimento ? createTimestamp(fam.dataNascimento) : undefined
        })),
        atendimentos: (data.atendimentos || []).map((at: any) => ({
          ...at,
          data: at.data ? createTimestamp(at.data) : undefined,
          proximoRetorno: at.proximoRetorno ? createTimestamp(at.proximoRetorno) : undefined
        }))
      };
    }
  });

  const createQuerySnapshot = (docs: any[], empty = false) => ({
    empty,
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseAssistidoRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds assistidos by CPF and id, returning null when missing', async () => {
    const assistido = createAssistido({ id: 'ass-found' });
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([assistido]));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([], true));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(assistido));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

    await expect(repository.findByCPF('12345678900')).resolves.toEqual(expect.objectContaining({ id: 'ass-found' }));
    await expect(repository.findByCPF('000')).resolves.toBeNull();
    await expect(repository.findById('ass-found')).resolves.toEqual(expect.objectContaining({ id: 'ass-found' }));
    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('lists and filters assistidos by status, responsible and necessidade', async () => {
    const assistido = createAssistido();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([assistido]))
      .mockResolvedValueOnce(createQuerySnapshot([assistido]))
      .mockResolvedValueOnce(createQuerySnapshot([assistido]))
      .mockResolvedValueOnce(createQuerySnapshot([assistido]));

    await expect(repository.findAll()).resolves.toHaveLength(1);
    await expect(repository.findByStatus(StatusAssistido.Ativo)).resolves.toHaveLength(1);
    await expect(repository.findByResponsible('Resp 1')).resolves.toHaveLength(1);
    await expect(repository.findByNecessidade(NecessidadeAssistido.Alimentacao)).resolves.toHaveLength(1);

    expect(mockOrderBy).toHaveBeenCalledWith('nome', 'asc');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', StatusAssistido.Ativo);
    expect(mockWhere).toHaveBeenCalledWith('responsavelAtendimento', '==', 'Resp 1');
    expect(mockWhere).toHaveBeenCalledWith('necessidades', 'array-contains', NecessidadeAssistido.Alimentacao);
  });

  it('finds assistidos needing attention and falls back to in-memory filtering', async () => {
    const oldAssistido = createAssistido({ id: 'old', dataUltimoAtendimento: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) });
    const recentAssistido = createAssistido({ id: 'recent', dataUltimoAtendimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });
    const noDateAssistido = createAssistido({ id: 'nodate', dataUltimoAtendimento: undefined });

    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([oldAssistido]));
    await expect(repository.findNeedingAttention()).resolves.toEqual([expect.objectContaining({ id: 'old' })]);

    mockGetDocs.mockRejectedValueOnce(new Error('index issue'));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([oldAssistido, recentAssistido, noDateAssistido]));
    await expect(repository.findNeedingAttention()).resolves.toEqual([
      expect.objectContaining({ id: 'old' }),
      expect.objectContaining({ id: 'nodate' })
    ]);
  });

  it('creates, updates, inactivates and physically deletes assistidos', async () => {
    const assistido = createAssistido({ status: StatusAssistido.Ativo });
    mockAddDoc.mockResolvedValueOnce({ id: 'ass-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createAssistido({ id: 'ass-updated', nome: 'Atualizado' }));

    const created = await repository.create({
      nome: assistido.nome,
      cpf: assistido.cpf,
      rg: assistido.rg,
      dataNascimento: assistido.dataNascimento,
      telefone: assistido.telefone,
      email: assistido.email,
      endereco: assistido.endereco,
      situacaoFamiliar: assistido.situacaoFamiliar,
      rendaFamiliar: assistido.rendaFamiliar,
      profissao: assistido.profissao,
      escolaridade: assistido.escolaridade,
      necessidades: assistido.necessidades,
      tipoMoradia: assistido.tipoMoradia,
      quantidadeComodos: assistido.quantidadeComodos,
      possuiCadUnico: assistido.possuiCadUnico,
      qualBeneficio: assistido.qualBeneficio,
      observacoes: assistido.observacoes,
      status: assistido.status,
      dataInicioAtendimento: assistido.dataInicioAtendimento,
      dataUltimoAtendimento: assistido.dataUltimoAtendimento,
      responsavelAtendimento: assistido.responsavelAtendimento,
      familiares: assistido.familiares,
      atendimentos: assistido.atendimentos,
      createdBy: assistido.createdBy
    });
    const updated = await repository.update('ass-updated', {
      id: 'ignored',
      createdAt: new Date(),
      nome: 'Atualizado',
      dataNascimento: assistido.dataNascimento,
      dataInicioAtendimento: assistido.dataInicioAtendimento,
      dataUltimoAtendimento: assistido.dataUltimoAtendimento,
      familiares: assistido.familiares,
      atendimentos: assistido.atendimentos
    });
    await repository.delete('ass-updated');
    await repository.deletePhysically('ass-updated');
    await repository.updateStatus('ass-updated', StatusAssistido.Inativo);

    expect(created).toEqual(expect.objectContaining({ id: 'ass-created', nome: assistido.nome }));
    expect(mockTimestampFromDate).toHaveBeenCalledWith(assistido.dataNascimento);
    expect(mockTimestampFromDate).toHaveBeenCalledWith(assistido.dataInicioAtendimento);
    expect(updated).toEqual(expect.objectContaining({ id: 'ass-updated', nome: 'Atualizado' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: StatusAssistido.Inativo, updatedAt: { kind: 'now' } }));
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('updates familiares without sending undefined optional fields to Firestore', async () => {
    const familiarDate = new Date('2010-01-01T12:00:00.000Z');
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createAssistido({ id: 'ass-updated' }));

    await repository.update('ass-updated', {
      familiares: [
        {
          id: 'fam-empty-optionals',
          nome: 'Filho',
          parentesco: TipoParentesco.Filho,
          dataNascimento: undefined,
          cpf: undefined,
          telefone: undefined,
          profissao: undefined,
          renda: undefined
        },
        {
          id: 'fam-with-date',
          nome: 'Filha',
          parentesco: TipoParentesco.Filha,
          dataNascimento: familiarDate,
          renda: 0
        }
      ]
    });

    const updatePayload = mockUpdateDoc.mock.calls[0][1];

    expect(hasUndefinedValue(updatePayload)).toBe(false);
    expect(updatePayload.familiares).toEqual([
      {
        id: 'fam-empty-optionals',
        nome: 'Filho',
        parentesco: TipoParentesco.Filho,
        dataNascimento: null
      },
      {
        id: 'fam-with-date',
        nome: 'Filha',
        parentesco: TipoParentesco.Filha,
        dataNascimento: expect.objectContaining({ toDate: expect.any(Function) }),
        renda: 0
      }
    ]);
  });

  it('adds atendimento, adds familiar and calculates statistics', async () => {
    const base = createAssistido({ id: 'ass-base', familiares: [], atendimentos: [] });
    const active = createAssistido({ id: 'active', status: StatusAssistido.Ativo, necessidades: [NecessidadeAssistido.Saude], familiares: [{ id: 'fam', nome: 'Pai', parentesco: TipoParentesco.Pai }], atendimentos: [{ id: 'at-recent', data: new Date(), tipo: TipoAtendimento.Orientacao, descricao: 'Recente', responsavel: 'r' }] });
    const inactive = createAssistido({ id: 'inactive', status: StatusAssistido.Inativo, necessidades: [NecessidadeAssistido.Saude, NecessidadeAssistido.Alimentacao], familiares: [], atendimentos: [] });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(base).mockResolvedValueOnce(base);
    jest.spyOn(repository, 'findAll').mockResolvedValue([active, inactive]);

    await repository.addAtendimento('ass-base', {
      data: new Date('2025-03-01T12:00:00.000Z'),
      tipo: TipoAtendimento.Orientacao,
      descricao: 'Novo atendimento',
      responsavel: 'resp'
    });
    await repository.addFamiliar('ass-base', {
      nome: 'Filho',
      parentesco: TipoParentesco.Filho
    });
    const stats = await repository.getStatistics();

    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(stats).toEqual({
      totalAtivos: 1,
      totalInativos: 1,
      necessidadeMaisComum: NecessidadeAssistido.Saude,
      atendimentosUltimos30Dias: 1,
      familiasTotais: 1
    });
  });
});
