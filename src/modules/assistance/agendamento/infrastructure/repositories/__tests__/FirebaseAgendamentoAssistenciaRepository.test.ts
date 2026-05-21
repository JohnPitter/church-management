import {
  AgendamentoAssistencia,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  StatusAgendamento,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { FirebaseAgendamentoAssistenciaRepository } from '../FirebaseAgendamentoAssistenciaRepository';

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
  arrayUnion: jest.fn(),
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
const mockArrayUnion = firestore.arrayUnion as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;

describe('FirebaseAgendamentoAssistenciaRepository', () => {
  let repository: FirebaseAgendamentoAssistenciaRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createAgendamento = (overrides: Partial<AgendamentoAssistencia> = {}): AgendamentoAssistencia => ({
    id: 'ag-1',
    pacienteId: 'pac-1',
    pacienteNome: 'Paciente Teste',
    pacienteTelefone: '11999999999',
    pacienteEmail: 'paciente@example.com',
    profissionalId: 'prof-1',
    profissionalNome: 'Profissional Teste',
    tipoAssistencia: TipoAssistencia.Psicologica,
    dataHoraAgendamento: new Date('2025-03-20T10:00:00.000Z'),
    dataHoraFim: new Date('2025-03-20T11:00:00.000Z'),
    modalidade: ModalidadeAtendimento.Online,
    prioridade: PrioridadeAtendimento.Normal,
    status: StatusAgendamento.Agendado,
    motivo: 'Consulta inicial',
    anexos: [],
    historico: [
      {
        id: 'hist-1',
        dataHora: new Date('2025-03-19T10:00:00.000Z'),
        acao: 'criado',
        statusNovo: StatusAgendamento.Agendado,
        responsavel: 'admin'
      }
    ],
    createdAt: new Date('2025-03-18T10:00:00.000Z'),
    updatedAt: new Date('2025-03-18T10:00:00.000Z'),
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
        dataHoraAgendamento: data.dataHoraAgendamento ? createTimestamp(data.dataHoraAgendamento) : undefined,
        dataHoraFim: data.dataHoraFim ? createTimestamp(data.dataHoraFim) : undefined,
        proximoRetorno: data.proximoRetorno ? createTimestamp(data.proximoRetorno) : undefined,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined,
        historico: (data.historico || []).map((item: any) => ({
          ...item,
          dataHora: item.dataHora ? createTimestamp(item.dataHora) : undefined
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
    repository = new FirebaseAgendamentoAssistenciaRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));
    mockArrayUnion.mockImplementation((value: any) => ({ kind: 'arrayUnion', value }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds by id and returns null when missing', async () => {
    const agendamento = createAgendamento({ id: 'ag-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(agendamento));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));

    await expect(repository.findById('ag-found')).resolves.toEqual(
      expect.objectContaining({
        id: 'ag-found',
        dataHoraAgendamento: agendamento.dataHoraAgendamento,
        historico: [expect.objectContaining({ id: 'hist-1' })]
      })
    );
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('lists all, handles empty snapshots and permission errors gracefully', async () => {
    const agendamento = createAgendamento();
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([agendamento]));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([], true));
    mockGetDocs.mockRejectedValueOnce({ code: 'permission-denied' });

    await expect(repository.findAll()).resolves.toHaveLength(1);
    await expect(repository.findAll()).resolves.toEqual([]);
    await expect(repository.findAll()).resolves.toEqual([]);
    expect(mockOrderBy).toHaveBeenCalledWith('dataHoraAgendamento', 'desc');
  });

  it('creates, updates, cancels and physically deletes agendamentos', async () => {
    const agendamento = createAgendamento({ status: StatusAgendamento.Confirmado });
    mockAddDoc.mockResolvedValueOnce({ id: 'ag-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createAgendamento({ id: 'ag-updated', status: StatusAgendamento.Confirmado }));

    const created = await repository.create({
      pacienteId: agendamento.pacienteId,
      pacienteNome: agendamento.pacienteNome,
      pacienteTelefone: agendamento.pacienteTelefone,
      pacienteEmail: agendamento.pacienteEmail,
      profissionalId: agendamento.profissionalId,
      profissionalNome: agendamento.profissionalNome,
      tipoAssistencia: agendamento.tipoAssistencia,
      dataHoraAgendamento: agendamento.dataHoraAgendamento,
      dataHoraFim: agendamento.dataHoraFim,
      modalidade: agendamento.modalidade,
      prioridade: agendamento.prioridade,
      status: agendamento.status,
      motivo: agendamento.motivo,
      anexos: agendamento.anexos,
      historico: agendamento.historico,
      createdBy: agendamento.createdBy
    });
    const updated = await repository.update('ag-updated', {
      id: 'ignored',
      createdAt: new Date(),
      status: StatusAgendamento.Confirmado,
      dataHoraAgendamento: agendamento.dataHoraAgendamento
    });
    await repository.delete('ag-updated');
    await repository.deletePhysically('ag-updated');

    expect(created).toEqual(expect.objectContaining({ id: 'ag-created', status: StatusAgendamento.Confirmado }));
    expect(mockAddDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: StatusAgendamento.Confirmado,
        updatedAt: { kind: 'now' }
      })
    );
    expect(updated.id).toBe('ag-updated');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('filters by paciente, profissional, tipo, status and date ranges', async () => {
    const agendamento = createAgendamento();
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamento]));

    await expect(repository.findByPaciente('pac-1')).resolves.toHaveLength(1);
    await expect(repository.findByProfissional('prof-1')).resolves.toHaveLength(1);
    await expect(repository.findByTipo(TipoAssistencia.Psicologica)).resolves.toHaveLength(1);
    await expect(repository.findByStatus(StatusAgendamento.Agendado)).resolves.toHaveLength(1);
    await expect(repository.findByDateRange(new Date('2025-03-01T00:00:00.000Z'), new Date('2025-03-30T00:00:00.000Z'))).resolves.toHaveLength(1);
    await expect(repository.findByProfissionalAndDateRange('prof-1', new Date('2025-03-01T00:00:00.000Z'), new Date('2025-03-30T00:00:00.000Z'))).resolves.toHaveLength(1);

    expect(mockWhere).toHaveBeenCalledWith('pacienteId', '==', 'pac-1');
    expect(mockWhere).toHaveBeenCalledWith('profissionalId', '==', 'prof-1');
    expect(mockWhere).toHaveBeenCalledWith('tipoAssistencia', '==', TipoAssistencia.Psicologica);
    expect(mockWhere).toHaveBeenCalledWith('status', '==', StatusAgendamento.Agendado);
    expect(mockWhere).toHaveBeenCalledWith('dataHoraAgendamento', '>=', expect.objectContaining({ toDate: expect.any(Function) }));
    expect(mockWhere).toHaveBeenCalledWith('dataHoraAgendamento', '<=', expect.objectContaining({ toDate: expect.any(Function) }));
  });

  it('finds upcoming and overdue appointments and searches locally', async () => {
    const agendamentoA = createAgendamento({ id: 'ag-a', pacienteNome: 'Maria Silva' });
    const agendamentoB = createAgendamento({ id: 'ag-b', profissionalNome: 'Carlos Souza', motivo: 'Retorno social', pacienteTelefone: '11888887777' });
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([agendamentoA]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamentoA]))
      .mockResolvedValueOnce(createQuerySnapshot([agendamentoA, agendamentoB]));
    jest.spyOn(repository, 'findAll').mockResolvedValueOnce([agendamentoA, agendamentoB]);

    await expect(repository.findProximosAgendamentos('prof-1', 5)).resolves.toHaveLength(1);
    await expect(repository.findAgendamentosVencidos()).resolves.toHaveLength(1);
    await expect(repository.searchAgendamentos('carlos')).resolves.toEqual([expect.objectContaining({ id: 'ag-b' })]);

    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('updates status flows and remarca consultation', async () => {
    const agendamento = createAgendamento({ id: 'ag-status', status: StatusAgendamento.Agendado });
    jest.spyOn(repository, 'findById').mockResolvedValue(agendamento);
    const updateStatusSpy = jest.spyOn(repository, 'updateStatus');

    await repository.updateStatus('ag-status', StatusAgendamento.Confirmado, 'ok', 'admin');
    await repository.confirmarAgendamento('ag-status', 'admin');
    await repository.cancelarAgendamento('ag-status', 'motivo', 'admin');
    await repository.iniciarConsulta('ag-status', 'admin');
    await repository.concluirConsulta('ag-status', 'concluida', 'admin');
    await repository.remarcarAgendamento('ag-status', new Date('2025-03-21T10:00:00.000Z'), 'admin');

    expect(mockArrayUnion).toHaveBeenCalled();
    expect(updateStatusSpy).toHaveBeenCalledWith('ag-status', StatusAgendamento.Confirmado, 'Agendamento confirmado', 'admin');
    expect(updateStatusSpy).toHaveBeenCalledWith('ag-status', StatusAgendamento.Cancelado, 'motivo', 'admin');
    expect(updateStatusSpy).toHaveBeenCalledWith('ag-status', StatusAgendamento.EmAndamento, 'Consulta iniciada', 'admin');
    expect(updateStatusSpy).toHaveBeenCalledWith('ag-status', StatusAgendamento.Concluido, 'concluida', 'admin');
    expect(updateStatusSpy).toHaveBeenCalledWith(
      'ag-status',
      StatusAgendamento.Remarcado,
      expect.stringContaining('Remarcado para'),
      'admin'
    );
  });

  it('calculates statistics for a professional and globally', async () => {
    const now = new Date();
    const concluded = createAgendamento({
      id: 'ag-concluded',
      profissionalNome: 'Profissional Teste',
      status: StatusAgendamento.Concluido,
      modalidade: ModalidadeAtendimento.Online,
      tipoAssistencia: TipoAssistencia.Psicologica,
      dataHoraAgendamento: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
      dataHoraFim: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
      avaliacaoServico: {
        id: 'av-1',
        nota: 4,
        aspectos: {
          pontualidade: 4,
          atendimento: 5,
          profissionalismo: 4,
          efetividade: 4
        },
        dataAvaliacao: now,
        avaliadoPor: 'pac-1',
        recomendaria: true
      }
    });
    const pending = createAgendamento({
      id: 'ag-pending',
      profissionalNome: 'Outro Profissional',
      status: StatusAgendamento.Agendado,
      modalidade: ModalidadeAtendimento.Presencial,
      tipoAssistencia: TipoAssistencia.Social,
      dataHoraAgendamento: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2), 9, 0, 0),
      dataHoraFim: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2), 10, 0, 0)
    });

    jest.spyOn(repository, 'findByProfissional').mockResolvedValue([concluded]);
    jest.spyOn(repository, 'findAll').mockResolvedValue([concluded, pending]);

    const statsProf = await repository.getEstatisticasPorProfissional('prof-1');
    const statsAll = await repository.getEstatisticasGerais();

    expect(statsProf.totalAgendamentos).toBe(1);
    expect(statsProf.taxaConclusao).toBe(100);
    expect(statsProf.tempoMedioConsulta).toBe(60);
    expect(statsProf.avaliacaoMedia).toBe(4);
    expect(statsAll.totalAgendamentos).toBe(2);
    expect(statsAll.porProfissional['Profissional Teste']).toBe(1);
    expect(statsAll.porProfissional['Outro Profissional']).toBe(1);
    expect(statsAll.porTipo[TipoAssistencia.Psicologica]).toBe(1);
    expect(statsAll.porTipo[TipoAssistencia.Social]).toBe(1);
    expect(statsAll.porStatus[StatusAgendamento.Concluido]).toBe(1);
    expect(statsAll.porStatus[StatusAgendamento.Agendado]).toBe(1);
    expect(statsAll.crescimentoMensal).toHaveLength(12);
  });
});
