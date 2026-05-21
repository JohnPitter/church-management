import {
  ConfirmEventAttendanceUseCase,
  ConfirmEventAttendanceInput,
} from '../ConfirmEventAttendanceUseCase';
import { ConfirmationStatus, EventStatus } from '@modules/church-management/events/domain/entities/Event';

const mockEventRepository = {
  findById: jest.fn(),
  countConfirmations: jest.fn(),
  findUserConfirmations: jest.fn(),
  updateConfirmation: jest.fn(),
  confirmAttendance: jest.fn(),
};

const mockNotificationService = {
  send: jest.fn(),
};

const approvedUser = {
  id: 'user-1',
  displayName: 'Maria',
  status: 'approved',
  role: 'member',
} as any;

const baseEvent = {
  id: 'event-1',
  title: 'Culto',
  date: new Date(Date.now() + 86400000),
  status: EventStatus.Scheduled,
  requiresConfirmation: true,
  responsible: 'resp-1',
  maxParticipants: 10,
} as any;

describe('ConfirmEventAttendanceUseCase', () => {
  const useCase = new ConfirmEventAttendanceUseCase(
    mockEventRepository as any,
    mockNotificationService as any
  );

  const input: ConfirmEventAttendanceInput = {
    eventId: 'event-1',
    status: ConfirmationStatus.Confirmed,
    notes: 'ok',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventRepository.findById.mockResolvedValue(baseEvent);
    mockEventRepository.countConfirmations.mockResolvedValue(1);
    mockEventRepository.findUserConfirmations.mockResolvedValue([]);
    mockEventRepository.confirmAttendance.mockResolvedValue({
      id: 'conf-1',
      eventId: 'event-1',
      userId: 'user-1',
      status: ConfirmationStatus.Confirmed,
      notes: 'ok',
    });
  });

  it('cria uma nova confirmacao quando o usuario nao possui registro', async () => {
    const result = await useCase.execute(input, approvedUser);

    expect(mockEventRepository.confirmAttendance).toHaveBeenCalledWith({
      eventId: 'event-1',
      userId: 'user-1',
      userName: 'Maria',
      status: ConfirmationStatus.Confirmed,
      notes: 'ok',
    });
    expect(result.id).toBe('conf-1');
  });

  it('atualiza confirmacao existente quando ja houver uma', async () => {
    mockEventRepository.findUserConfirmations.mockResolvedValue([
      { id: 'conf-existing', eventId: 'event-1', notes: 'old' },
    ]);

    const result = await useCase.execute(input, approvedUser);

    expect(mockEventRepository.updateConfirmation).toHaveBeenCalledWith(
      'conf-existing',
      ConfirmationStatus.Confirmed
    );
    expect(result.id).toBe('conf-existing');
  });

  it('notifica o responsavel quando o usuario recusa presenca', async () => {
    await useCase.execute(
      { eventId: 'event-1', status: ConfirmationStatus.Declined, notes: 'Nao vou' },
      approvedUser
    );

    expect(mockNotificationService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'resp-1',
        title: 'Participante não poderá comparecer',
      })
    );
  });

  it('bloqueia usuario sem acesso ao sistema', async () => {
    await expect(
      useCase.execute(input, { ...approvedUser, status: 'pending' } as any)
    ).rejects.toThrow('Você não tem permissão para confirmar presença');
  });

  it('falha quando o evento nao existe ou nao permite confirmacao', async () => {
    mockEventRepository.findById.mockResolvedValueOnce(null);
    await expect(useCase.execute(input, approvedUser)).rejects.toThrow('Evento não encontrado');

    mockEventRepository.findById.mockResolvedValueOnce({
      ...baseEvent,
      requiresConfirmation: false,
    });
    await expect(useCase.execute(input, approvedUser)).rejects.toThrow(
      'Este evento não requer confirmação de presença'
    );
  });

  it('falha quando nao ha vagas disponiveis', async () => {
    mockEventRepository.countConfirmations.mockResolvedValue(10);

    await expect(useCase.execute(input, approvedUser)).rejects.toThrow(
      'Não há mais vagas disponíveis para este evento'
    );
  });
});
