import {
  AtividadeONG,
  ContatoEmergencia,
  DoacaoONG,
  FormaPagamento,
  ONGInfo,
  PeriodoRelatorio,
  StatusVoluntario,
  StatusAtividade,
  StatusDoacao,
  TipoAtividade,
  TipoDoacao,
  TipoDoador,
  Voluntario
} from '../../../domain/entities/ONG';
import { FirebaseONGRepository } from '../FirebaseONGRepository';

jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {}
}));

jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logONG: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(),
    fromDate: jest.fn()
  }
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');
const storageModule = jest.requireMock('firebase/storage');
const loggingModule = jest.requireMock('@modules/shared-kernel/logging/infrastructure/services/LoggingService');

const mockCollection = firestore.collection as jest.Mock;
const mockDoc = firestore.doc as jest.Mock;
const mockAddDoc = firestore.addDoc as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;
const mockDeleteDoc = firestore.deleteDoc as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockSetDoc = firestore.setDoc as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;

const mockRef = storageModule.ref as jest.Mock;
const mockUploadBytes = storageModule.uploadBytes as jest.Mock;
const mockGetDownloadURL = storageModule.getDownloadURL as jest.Mock;
const mockLogONG = loggingModule.loggingService.logONG as jest.Mock;

describe('FirebaseONGRepository', () => {
  let repository: FirebaseONGRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const emergencyContact: ContatoEmergencia = {
    nome: 'Contato',
    parentesco: 'Parente',
    telefone: '11999999999'
  };

  const createONGInfo = (overrides: Partial<ONGInfo> = {}): ONGInfo => ({
    id: 'config',
    nome: 'ONG Esperanca',
    descricao: 'Descricao',
    endereco: {
      logradouro: 'Rua A',
      numero: '100',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01000-000',
      pais: 'Brasil'
    },
    contato: {
      telefone: '11999999999',
      email: 'ong@example.com'
    },
    dataCriacao: new Date('2025-01-01T12:00:00.000Z'),
    areasAtuacao: ['assistencia'],
    updatedAt: new Date('2025-01-02T12:00:00.000Z'),
    updatedBy: 'admin-1',
    ...overrides
  });

  const createVoluntario = (overrides: Partial<Voluntario> = {}): Voluntario => ({
    id: 'vol-1',
    nome: 'Voluntario Teste',
    email: 'voluntario@example.com',
    telefone: '11988887777',
    cpf: '12345678900',
    dataNascimento: new Date('1990-01-01T12:00:00.000Z'),
    endereco: {
      logradouro: 'Rua B',
      numero: '200',
      bairro: 'Bairro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '02000-000'
    },
    habilidades: ['organizacao'],
    areasInteresse: ['educacao'],
    disponibilidade: [{ diaSemana: 1, horaInicio: '09:00', horaFim: '12:00' }],
    horasSemanaisDisponivel: 10,
    status: StatusVoluntario.Ativo,
    dataInicio: new Date('2025-01-05T12:00:00.000Z'),
    dataFim: new Date('2025-12-05T12:00:00.000Z'),
    emergencia: emergencyContact,
    createdAt: new Date('2025-01-05T12:00:00.000Z'),
    updatedAt: new Date('2025-01-06T12:00:00.000Z'),
    createdBy: 'admin-1',
    ...overrides
  });

  const createAtividade = (overrides: Partial<AtividadeONG> = {}): AtividadeONG => ({
    id: 'atividade-1',
    nome: 'Mutirao',
    descricao: 'Descricao da atividade',
    tipo: TipoAtividade.AssistenciaSocial,
    dataInicio: new Date('2025-02-10T12:00:00.000Z'),
    dataFim: new Date('2025-02-10T16:00:00.000Z'),
    horaInicio: '12:00',
    horaFim: '16:00',
    local: 'Centro',
    responsavel: 'Lider',
    voluntariosNecessarios: 5,
    voluntariosConfirmados: ['vol-1', 'vol-2'],
    beneficiarios: 20,
    status: StatusAtividade.Concluida,
    createdAt: new Date('2025-02-01T12:00:00.000Z'),
    updatedAt: new Date('2025-02-02T12:00:00.000Z'),
    createdBy: 'admin-1',
    ...overrides
  });

  const createDoacao = (overrides: Partial<DoacaoONG> = {}): DoacaoONG => ({
    id: 'doacao-1',
    tipo: TipoDoacao.Dinheiro,
    doador: {
      tipo: TipoDoador.PessoaFisica,
      nome: 'Doador Teste',
      email: 'doador@example.com',
      isAnonimo: false
    },
    valor: 250,
    descricao: 'Doacao financeira',
    dataDoacao: new Date('2025-03-01T12:00:00.000Z'),
    dataRecebimento: new Date('2025-03-02T12:00:00.000Z'),
    formaPagamento: FormaPagamento.Pix,
    status: StatusDoacao.Recebida,
    createdAt: new Date('2025-03-01T12:00:00.000Z'),
    updatedAt: new Date('2025-03-02T12:00:00.000Z'),
    createdBy: 'admin-1',
    ...overrides
  });

  const createPeriodo = (): PeriodoRelatorio => ({
    dataInicio: new Date('2025-01-01T00:00:00.000Z'),
    dataFim: new Date('2025-12-31T23:59:59.999Z'),
    tipo: 'anual'
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        dataCriacao: data.dataCriacao ? createTimestamp(data.dataCriacao) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined,
        dataNascimento: data.dataNascimento ? createTimestamp(data.dataNascimento) : undefined,
        dataInicio: data.dataInicio ? createTimestamp(data.dataInicio) : undefined,
        dataFim: data.dataFim ? createTimestamp(data.dataFim) : undefined,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        dataDoacao: data.dataDoacao ? createTimestamp(data.dataDoacao) : undefined,
        dataRecebimento: data.dataRecebimento ? createTimestamp(data.dataRecebimento) : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseONGRepository();

    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockRef.mockImplementation((...args) => ({ kind: 'storage-ref', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
    mockLogONG.mockResolvedValue(undefined);
  });

  describe('ONG info', () => {
    it('returns mapped ONG info when document exists', async () => {
      const info = createONGInfo();
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(info));

      await expect(repository.getONGInfo()).resolves.toEqual(
        expect.objectContaining({
          id: 'config',
          nome: 'ONG Esperanca',
          dataCriacao: info.dataCriacao,
          updatedAt: info.updatedAt
        })
      );
    });

    it('returns null when ONG info does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

      await expect(repository.getONGInfo()).resolves.toBeNull();
    });

    it('translates permission errors and generic failures when fetching ONG info', async () => {
      mockGetDoc.mockRejectedValueOnce({ code: 'permission-denied' });
      await expect(repository.getONGInfo()).rejects.toThrow('Acesso negado');

      mockGetDoc.mockRejectedValueOnce(new Error('boom'));
      await expect(repository.getONGInfo()).rejects.toThrow('Failed to get ONG information');
    });

    it('updates existing ONG info, removes undefined fields and logs success', async () => {
      const updated = createONGInfo({ nome: 'ONG Atualizada' });
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(createONGInfo()));
      jest.spyOn(repository, 'getONGInfo').mockResolvedValueOnce(updated);

      const result = await repository.updateONGInfo({
        nome: 'ONG Atualizada',
        descricao: undefined,
        updatedBy: 'admin-2'
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: 'ONG Atualizada',
          updatedBy: 'admin-2',
          updatedAt: { kind: 'now' }
        })
      );
      expect(mockUpdateDoc.mock.calls[0][1]).not.toHaveProperty('descricao');
      expect(mockLogONG).toHaveBeenCalledWith(
        'info',
        'ONG Information Updated',
        expect.stringContaining('nome, updatedBy')
      );
      expect(result.nome).toBe('ONG Atualizada');
    });

    it('creates ONG info when config document does not exist', async () => {
      const updated = createONGInfo({ nome: 'ONG Nova' });
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));
      jest.spyOn(repository, 'getONGInfo').mockResolvedValueOnce(updated);

      const result = await repository.updateONGInfo({
        nome: 'ONG Nova',
        updatedBy: 'admin-3'
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: 'ONG Nova',
          updatedBy: 'admin-3',
          updatedAt: { kind: 'now' },
          dataCriacao: { kind: 'now' }
        })
      );
      expect(mockLogONG).toHaveBeenCalledWith(
        'info',
        'ONG Information Created',
        expect.stringContaining('nome, updatedBy')
      );
      expect(result.nome).toBe('ONG Nova');
    });

    it('logs and throws when ONG update fails', async () => {
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(createONGInfo()));
      mockUpdateDoc.mockRejectedValueOnce(new Error('write failed'));

      await expect(repository.updateONGInfo({ nome: 'Falhou' })).rejects.toThrow('Failed to update ONG information');
      expect(mockLogONG).toHaveBeenCalledWith(
        'error',
        'Failed to Update ONG Information',
        expect.stringContaining('write failed')
      );
    });
  });

  describe('logo upload', () => {
    it('uploads ONG logo and returns the download URL', async () => {
      const file = { name: 'logo.png' } as File;
      mockUploadBytes.mockResolvedValueOnce({ ref: { fullPath: 'ong/logo' } });
      mockGetDownloadURL.mockResolvedValueOnce('https://cdn/logo.png');

      const result = await repository.uploadONGLogo(file);

      expect(mockRef).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^ong\/ong-logo-\d+\.png$/));
      expect(mockUploadBytes).toHaveBeenCalledWith(expect.anything(), file);
      expect(result).toBe('https://cdn/logo.png');
    });

    it('throws a friendly error when logo upload fails', async () => {
      mockUploadBytes.mockRejectedValueOnce(new Error('upload failed'));

      await expect(repository.uploadONGLogo({ name: 'logo.png' } as File)).rejects.toThrow('Failed to upload logo');
    });
  });

  describe('volunteers', () => {
    it('creates a volunteer with timestamp conversion and success log', async () => {
      const volunteer = createVoluntario();
      mockAddDoc.mockResolvedValueOnce({ id: 'vol-created' });

      const result = await repository.createVoluntario({
        nome: volunteer.nome,
        email: volunteer.email,
        telefone: volunteer.telefone,
        cpf: volunteer.cpf,
        dataNascimento: volunteer.dataNascimento,
        endereco: volunteer.endereco,
        habilidades: volunteer.habilidades,
        areasInteresse: volunteer.areasInteresse,
        disponibilidade: volunteer.disponibilidade,
        horasSemanaisDisponivel: volunteer.horasSemanaisDisponivel,
        status: volunteer.status,
        dataInicio: volunteer.dataInicio,
        dataFim: volunteer.dataFim,
        emergencia: volunteer.emergencia,
        createdBy: volunteer.createdBy
      });

      expect(mockTimestampFromDate).toHaveBeenCalledWith(volunteer.dataNascimento);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(volunteer.dataInicio);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(volunteer.dataFim);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockLogONG).toHaveBeenCalledWith(
        'info',
        'Volunteer Created',
        expect.stringContaining('Voluntario Teste')
      );
      expect(result).toEqual(expect.objectContaining({ id: 'vol-created', nome: volunteer.nome }));
    });

    it('updates a volunteer, maps persisted data and logs the action', async () => {
      const volunteer = createVoluntario({ id: 'vol-2', nome: 'Atualizado' });
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(volunteer));

      const result = await repository.updateVoluntario('vol-2', {
        nome: 'Atualizado',
        dataNascimento: volunteer.dataNascimento,
        dataInicio: volunteer.dataInicio,
        dataFim: volunteer.dataFim
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: 'Atualizado',
          updatedAt: { kind: 'now' },
          dataNascimento: expect.objectContaining({ toDate: expect.any(Function) }),
          dataInicio: expect.objectContaining({ toDate: expect.any(Function) }),
          dataFim: expect.objectContaining({ toDate: expect.any(Function) })
        })
      );
      expect(mockLogONG).toHaveBeenCalledWith(
        'info',
        'Volunteer Updated',
        expect.stringContaining('nome, dataNascimento, dataInicio, dataFim')
      );
      expect(result).toEqual(expect.objectContaining({ id: 'vol-2', nome: 'Atualizado' }));
    });

    it('throws when volunteer update cannot reload the document', async () => {
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

      await expect(repository.updateVoluntario('missing', { nome: 'X' })).rejects.toThrow('Failed to update volunteer');
      expect(mockLogONG).toHaveBeenCalledWith(
        'error',
        'Failed to Update Volunteer',
        expect.stringContaining('Volunteer not found after update')
      );
    });

    it('deletes a volunteer after looking up the name and logs warning', async () => {
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(createVoluntario({ nome: 'Removido' })));

      await repository.deleteVoluntario('vol-delete');

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockLogONG).toHaveBeenCalledWith(
        'warning',
        'Volunteer Deleted',
        expect.stringContaining('Removido')
      );
    });

    it('maps volunteer lookup by id and returns null when missing', async () => {
      const volunteer = createVoluntario({ id: 'vol-lookup' });
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(volunteer));
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

      await expect(repository.getVoluntarioById('vol-lookup')).resolves.toEqual(
        expect.objectContaining({
          id: 'vol-lookup',
          dataNascimento: volunteer.dataNascimento,
          dataInicio: volunteer.dataInicio,
          dataFim: volunteer.dataFim
        })
      );
      await expect(repository.getVoluntarioById('missing')).resolves.toBeNull();
    });

    it('lists volunteers, filters by status and handles permission-denied gracefully', async () => {
      const volunteerA = createVoluntario({ id: 'vol-a' });
      const volunteerB = createVoluntario({ id: 'vol-b', status: StatusVoluntario.Inativo });
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([volunteerA, volunteerB]));
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([volunteerA]));
      mockGetDocs.mockRejectedValueOnce({ message: 'Missing or insufficient permissions' });

      const all = await repository.getAllVoluntarios();
      const active = await repository.getVoluntariosByStatus(StatusVoluntario.Ativo);
      const fallback = await repository.getAllVoluntarios();

      expect(all).toHaveLength(2);
      expect(active).toHaveLength(1);
      expect(active[0].status).toBe(StatusVoluntario.Ativo);
      expect(fallback).toEqual([]);
      expect(mockOrderBy).toHaveBeenCalledWith('nome', 'asc');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', StatusVoluntario.Ativo);
    });
  });

  describe('activities', () => {
    it('creates an activity with timestamp conversion and logs success', async () => {
      const atividade = createAtividade();
      mockAddDoc.mockResolvedValueOnce({ id: 'atividade-created' });

      const result = await repository.createAtividade({
        nome: atividade.nome,
        descricao: atividade.descricao,
        tipo: atividade.tipo,
        dataInicio: atividade.dataInicio,
        dataFim: atividade.dataFim,
        horaInicio: atividade.horaInicio,
        horaFim: atividade.horaFim,
        local: atividade.local,
        responsavel: atividade.responsavel,
        voluntariosNecessarios: atividade.voluntariosNecessarios,
        voluntariosConfirmados: atividade.voluntariosConfirmados,
        beneficiarios: atividade.beneficiarios,
        status: atividade.status,
        createdBy: atividade.createdBy
      });

      expect(mockTimestampFromDate).toHaveBeenCalledWith(atividade.dataInicio);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(atividade.dataFim);
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Activity Created', expect.stringContaining('Mutirao'));
      expect(result).toEqual(expect.objectContaining({ id: 'atividade-created', nome: 'Mutirao' }));
    });

    it('updates, deletes and fetches activities', async () => {
      const atividade = createAtividade({ id: 'atividade-2', nome: 'Atualizada' });
      mockGetDoc
        .mockResolvedValueOnce(createDocSnapshot(atividade))
        .mockResolvedValueOnce(createDocSnapshot(createAtividade({ id: 'atividade-delete', nome: 'Excluir' })))
        .mockResolvedValueOnce(createDocSnapshot(atividade))
        .mockResolvedValueOnce(createDocSnapshot(null, false));

      const updated = await repository.updateAtividade('atividade-2', {
        nome: 'Atualizada',
        dataInicio: atividade.dataInicio,
        dataFim: atividade.dataFim
      });
      await repository.deleteAtividade('atividade-delete');
      const found = await repository.getAtividadeById('atividade-2');
      const missing = await repository.getAtividadeById('missing');

      expect(updated).toEqual(expect.objectContaining({ id: 'atividade-2', nome: 'Atualizada' }));
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Activity Updated', expect.stringContaining('nome, dataInicio, dataFim'));
      expect(mockLogONG).toHaveBeenCalledWith('warning', 'Activity Deleted', expect.stringContaining('Excluir'));
      expect(found).toEqual(expect.objectContaining({ id: 'atividade-2', dataInicio: atividade.dataInicio }));
      expect(missing).toBeNull();
    });

    it('lists activities and filters them by period', async () => {
      const atividadeA = createAtividade({ id: 'atividade-a' });
      const atividadeB = createAtividade({ id: 'atividade-b', dataInicio: new Date('2025-04-01T12:00:00.000Z') });
      const periodo = createPeriodo();
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([atividadeA, atividadeB]));
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([atividadeA]));

      const all = await repository.getAllAtividades();
      const byPeriodo = await repository.getAtividadesByPeriodo(periodo);

      expect(all).toHaveLength(2);
      expect(byPeriodo).toHaveLength(1);
      expect(mockOrderBy).toHaveBeenCalledWith('dataInicio', 'desc');
      expect(mockWhere).toHaveBeenCalledWith('dataInicio', '>=', expect.objectContaining({ toDate: expect.any(Function) }));
      expect(mockWhere).toHaveBeenCalledWith('dataInicio', '<=', expect.objectContaining({ toDate: expect.any(Function) }));
    });
  });

  describe('donations and reports', () => {
    it('creates, updates, deletes and fetches donations', async () => {
      const doacao = createDoacao({ id: 'doacao-2', descricao: 'Atualizada' });
      mockAddDoc.mockResolvedValueOnce({ id: 'doacao-created' });
      mockGetDoc
        .mockResolvedValueOnce(createDocSnapshot(doacao))
        .mockResolvedValueOnce(createDocSnapshot(createDoacao({ id: 'doacao-delete', doador: { tipo: TipoDoador.PessoaFisica, nome: 'Joao', isAnonimo: false } })))
        .mockResolvedValueOnce(createDocSnapshot(doacao))
        .mockResolvedValueOnce(createDocSnapshot(null, false));

      const created = await repository.createDoacao({
        tipo: doacao.tipo,
        doador: doacao.doador,
        valor: doacao.valor,
        descricao: doacao.descricao,
        dataDoacao: doacao.dataDoacao,
        dataRecebimento: doacao.dataRecebimento,
        formaPagamento: doacao.formaPagamento,
        status: doacao.status,
        createdBy: doacao.createdBy
      });
      const updated = await repository.updateDoacao('doacao-2', {
        descricao: 'Atualizada',
        dataDoacao: doacao.dataDoacao,
        dataRecebimento: doacao.dataRecebimento
      });
      await repository.deleteDoacao('doacao-delete');
      const found = await repository.getDoacaoById('doacao-2');
      const missing = await repository.getDoacaoById('missing');

      expect(created).toEqual(expect.objectContaining({ id: 'doacao-created' }));
      expect(updated).toEqual(expect.objectContaining({ id: 'doacao-2', descricao: 'Atualizada' }));
      expect(found).toEqual(expect.objectContaining({ id: 'doacao-2', dataDoacao: doacao.dataDoacao }));
      expect(missing).toBeNull();
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Donation Created', expect.stringContaining('Doador Teste'));
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Donation Updated', expect.stringContaining('descricao, dataDoacao, dataRecebimento'));
      expect(mockLogONG).toHaveBeenCalledWith('warning', 'Donation Deleted', expect.stringContaining('Joao'));
    });

    it('lists donations by all and period and generates financial report', async () => {
      const periodo = createPeriodo();
      const doacaoDinheiro = createDoacao({ id: 'cash', valor: 300, tipo: TipoDoacao.Dinheiro, doador: { tipo: TipoDoador.PessoaFisica, nome: 'Ana', isAnonimo: false } });
      const doacaoBens = createDoacao({
        id: 'goods',
        valor: undefined,
        tipo: TipoDoacao.Alimentos,
        itens: [{ descricao: 'Cesta', quantidade: 2, unidade: 'un', valorEstimado: 50 }],
        doador: { tipo: TipoDoador.PessoaFisica, nome: 'Carlos', isAnonimo: false }
      });
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([doacaoDinheiro, doacaoBens]));
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([doacaoDinheiro]));

      const all = await repository.getAllDoacoes();
      const byPeriodo = await repository.getDoacoesByPeriodo(periodo);
      jest.spyOn(repository, 'getDoacoesByPeriodo').mockResolvedValue([doacaoDinheiro, doacaoBens]);
      const report = await repository.generateRelatorioFinanceiro(periodo);

      expect(all).toHaveLength(2);
      expect(byPeriodo).toHaveLength(1);
      expect(report).toEqual(
        expect.objectContaining({
          totalArrecadado: 400,
          totalDoacoesDinheiro: 300,
          totalDoacoesBens: 100,
          numeroDoadores: 2,
          ticketMedio: 200
        })
      );
      expect(report.distribuicaoPorTipo).toEqual(
        expect.arrayContaining([
          { tipo: TipoDoacao.Dinheiro, valor: 300 },
          { tipo: TipoDoacao.Alimentos, valor: 100 }
        ])
      );
      expect(report.maioresDoadores[0]).toEqual({ nome: 'Ana', valor: 300 });
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Financial Report Generated', expect.stringContaining('R$ 400.00'));
    });

    it('generates volunteer and activity reports with aggregated metrics', async () => {
      const periodo = createPeriodo();
      const volunteerYoung = createVoluntario({
        id: 'young',
        nome: 'Jovem',
        status: StatusVoluntario.Ativo,
        dataNascimento: new Date('2003-01-01T12:00:00.000Z'),
        dataInicio: new Date('2025-02-01T12:00:00.000Z'),
        areasInteresse: ['educacao', 'saude']
      });
      const volunteerSenior = createVoluntario({
        id: 'senior',
        nome: 'Senior',
        status: StatusVoluntario.Inativo,
        dataNascimento: new Date('1960-01-01T12:00:00.000Z'),
        dataInicio: new Date('2024-01-01T12:00:00.000Z'),
        dataFim: new Date('2025-06-01T12:00:00.000Z'),
        areasInteresse: ['saude']
      });
      const atividadeConcluida = createAtividade({
        id: 'act-1',
        tipo: TipoAtividade.Educacional,
        voluntariosConfirmados: ['young', 'senior'],
        beneficiarios: 30,
        relatorio: {
          voluntariosPresentes: ['young'],
          horasRealizadas: 4,
          beneficiariosAtendidos: 35,
          resultados: 'Bom'
        }
      });
      const atividadeCancelada = createAtividade({
        id: 'act-2',
        tipo: TipoAtividade.Saude,
        status: StatusAtividade.Cancelada,
        voluntariosConfirmados: ['senior'],
        beneficiarios: 10
      });

      jest.spyOn(repository, 'getAllVoluntarios').mockResolvedValue([volunteerYoung, volunteerSenior]);
      jest.spyOn(repository, 'getAtividadesByPeriodo').mockResolvedValue([atividadeConcluida, atividadeCancelada]);

      const volunteerReport = await repository.generateRelatorioVoluntarios(periodo);
      const activityReport = await repository.generateRelatorioAtividades(periodo);

      expect(volunteerReport).toEqual(
        expect.objectContaining({
          totalVoluntarios: 2,
          voluntariosAtivos: 1,
          voluntariosInativos: 1,
          novasAdesoes: 1,
          desligamentos: 2
        })
      );
      expect(volunteerReport.horasTotais).toBe(8);
      expect(volunteerReport.distribuicaoPorArea).toEqual(
        expect.arrayContaining([
          { area: 'educacao', quantidade: 1 },
          { area: 'saude', quantidade: 2 }
        ])
      );
      expect(volunteerReport.distribuicaoPorIdade).toEqual(
        expect.arrayContaining([
          { faixa: '18-25', quantidade: 1 },
          { faixa: '65+', quantidade: 1 }
        ])
      );
      expect(activityReport).toEqual(
        expect.objectContaining({
          totalAtividades: 2,
          atividadesConcluidas: 1,
          atividadesCanceladas: 1,
          beneficiariosAtendidos: 35,
          voluntariosEnvolvidos: 1
        })
      );
      expect(activityReport.horasTotaisVoluntariado).toBe(4);
      expect(activityReport.distribuicaoPorTipo).toEqual(
        expect.arrayContaining([
          { tipo: TipoAtividade.Educacional, quantidade: 1 },
          { tipo: TipoAtividade.Saude, quantidade: 1 }
        ])
      );
      expect(activityReport.atividadesMaisParticipadas[0]).toEqual(
        expect.objectContaining({
          atividadeId: 'act-1',
          participantes: 1,
          beneficiarios: 35,
          horasRealizadas: 4
        })
      );
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Volunteers Report Generated', expect.stringContaining('2 volunteers'));
      expect(mockLogONG).toHaveBeenCalledWith('info', 'Activities Report Generated', expect.stringContaining('2 activities'));
    });
  });
});
