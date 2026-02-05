// Unit Tests - AssistenciaService
// Comprehensive tests for ProfissionalAssistenciaService and AgendamentoAssistenciaService

import {
  ProfissionalAssistenciaService,
  AgendamentoAssistenciaService
} from '../AssistenciaService';
import { FirebaseProfissionalAssistenciaRepository } from '@modules/assistance/professional/infrastructure/repositories/FirebaseProfissionalAssistenciaRepository';
import { FirebaseAgendamentoAssistenciaRepository } from '@modules/assistance/agendamento/infrastructure/repositories/FirebaseAgendamentoAssistenciaRepository';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';
import {
  ProfissionalAssistencia,
  AgendamentoAssistencia,
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  AssistenciaEntity
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase modules
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn()
}));

jest.mock('@/config/firebase', () => ({
  functions: {}
}));

// Mock repositories and services
jest.mock('@modules/assistance/professional/infrastructure/repositories/FirebaseProfissionalAssistenciaRepository');
jest.mock('@modules/assistance/agendamento/infrastructure/repositories/FirebaseAgendamentoAssistenciaRepository');
jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository');
jest.mock('@modules/shared-kernel/notifications/infrastructure/services/NotificationService');

// Mock AssistenciaEntity static methods
jest.mock('@modules/assistance/assistencia/domain/entities/Assistencia', () => {
  const actual = jest.requireActual('@modules/assistance/assistencia/domain/entities/Assistencia');
  return {
    ...actual,
    AssistenciaEntity: {
      ...actual.AssistenciaEntity,
      formatarTelefone: jest.fn((tel: string) => tel.replace(/\D/g, '')),
      formatarCPF: jest.fn((cpf: string) => cpf.replace(/\D/g, '')),
      formatarCEP: jest.fn((cep: string) => cep.replace(/\D/g, '')),
      validarTelefone: jest.fn((tel: string) => tel && tel.length >= 10),
      validarCPF: jest.fn((cpf: string) => cpf && cpf.length === 11),
      validarEmail: jest.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      formatarTipoAssistencia: jest.fn((tipo: string) => tipo),
      calcularValorFinalConsulta: jest.fn((valor: number, desconto: number) => valor - desconto),
      obterProximosHorariosDisponiveis: jest.fn(() => [])
    }
  };
});

describe('ProfissionalAssistenciaService', () => {
  let service: ProfissionalAssistenciaService;
  let mockProfissionalRepository: jest.Mocked<FirebaseProfissionalAssistenciaRepository>;
  let mockUserRepository: jest.Mocked<FirebaseUserRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const createTestProfissional = (overrides: Partial<ProfissionalAssistencia> = {}): ProfissionalAssistencia => ({
    id: 'prof-1',
    nome: 'Dr. João Silva',
    cpf: '12345678901',
    rg: '123456789',
    telefone: '11987654321',
    email: 'joao.silva@example.com',
    endereco: {
      logradouro: 'Rua Test',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000000'
    },
    especialidade: TipoAssistencia.Psicologica,
    subespecialidades: [],
    registroProfissional: 'CRP-123456',
    status: StatusProfissional.Ativo,
    dataCadastro: new Date(),
    horariosFuncionamento: [
      { diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' }
    ],
    valorConsulta: 100,
    tempoConsulta: 50,
    modalidadesAtendimento: [ModalidadeAtendimento.Presencial],
    documentos: [],
    avaliacoes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset validation mocks to default behavior
    (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(true);
    (AssistenciaEntity.validarCPF as jest.Mock).mockReturnValue(true);
    (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(true);

    // Setup repository mocks
    mockProfissionalRepository = new FirebaseProfissionalAssistenciaRepository() as jest.Mocked<FirebaseProfissionalAssistenciaRepository>;
    mockUserRepository = new FirebaseUserRepository() as jest.Mocked<FirebaseUserRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Create service instance
    service = new ProfissionalAssistenciaService();

    // Inject mocked dependencies
    (service as any).profissionalRepository = mockProfissionalRepository;
    (service as any).userRepository = mockUserRepository;
    (service as any).notificationService = mockNotificationService;
  });

  describe('createProfissional', () => {
    const validProfissionalData = {
      nome: 'Dr. João Silva',
      cpf: '12345678901',
      telefone: '11987654321',
      email: 'joao.silva@example.com',
      endereco: {
        logradouro: 'Rua Test',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000000'
      },
      especialidade: TipoAssistencia.Psicologica,
      registroProfissional: 'CRP-123456',
      horariosFuncionamento: [{ diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' }],
      valorConsulta: 100,
      tempoConsulta: 50,
      modalidadesAtendimento: [ModalidadeAtendimento.Presencial],
      createdBy: 'admin'
    };

    it('should create a professional successfully', async () => {
      const createdProfissional = createTestProfissional();

      mockProfissionalRepository.findByCPF.mockResolvedValue(null);
      mockProfissionalRepository.findByEmail.mockResolvedValue(null);
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(null);
      mockProfissionalRepository.create.mockResolvedValue(createdProfissional);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      const result = await service.createProfissional(validProfissionalData);

      expect(result).toEqual(createdProfissional);
      expect(mockProfissionalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: validProfissionalData.nome,
          status: StatusProfissional.Ativo
        })
      );
      expect(mockNotificationService.createCustomNotification).toHaveBeenCalled();
    });

    it('should throw error if CPF already exists', async () => {
      const existingProfissional = createTestProfissional();
      mockProfissionalRepository.findByCPF.mockResolvedValue(existingProfissional);

      await expect(service.createProfissional(validProfissionalData))
        .rejects.toThrow('Já existe um profissional cadastrado com este CPF');

      expect(mockProfissionalRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const existingProfissional = createTestProfissional();
      mockProfissionalRepository.findByCPF.mockResolvedValue(null);
      mockProfissionalRepository.findByEmail.mockResolvedValue(existingProfissional);

      await expect(service.createProfissional(validProfissionalData))
        .rejects.toThrow('Já existe um profissional cadastrado com este email');

      expect(mockProfissionalRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if registro profissional already exists', async () => {
      const existingProfissional = createTestProfissional();
      mockProfissionalRepository.findByCPF.mockResolvedValue(null);
      mockProfissionalRepository.findByEmail.mockResolvedValue(null);
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(existingProfissional);

      await expect(service.createProfissional(validProfissionalData))
        .rejects.toThrow('Já existe um profissional cadastrado com este registro profissional');

      expect(mockProfissionalRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if validation fails', async () => {
      const invalidData = { ...validProfissionalData, email: 'invalid-email' };

      (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(false);

      await expect(service.createProfissional(invalidData))
        .rejects.toThrow('Email inválido');
    });

    it('should not fail if notification fails', async () => {
      const createdProfissional = createTestProfissional();

      mockProfissionalRepository.findByCPF.mockResolvedValue(null);
      mockProfissionalRepository.findByEmail.mockResolvedValue(null);
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(null);
      mockProfissionalRepository.create.mockResolvedValue(createdProfissional);
      mockNotificationService.createCustomNotification.mockRejectedValue(new Error('Notification failed'));

      const result = await service.createProfissional(validProfissionalData);

      expect(result).toEqual(createdProfissional);
      expect(mockProfissionalRepository.create).toHaveBeenCalled();
    });
  });

  describe('updateProfissional', () => {
    it('should update a professional successfully', async () => {
      const updatedProfissional = createTestProfissional({ nome: 'Dr. João Updated' });
      const updateData = { nome: 'Dr. João Updated' };

      mockProfissionalRepository.update.mockResolvedValue(updatedProfissional);

      const result = await service.updateProfissional('prof-1', updateData);

      expect(result).toEqual(updatedProfissional);
      expect(mockProfissionalRepository.update).toHaveBeenCalledWith('prof-1', updateData);
    });

    it('should throw error if updating CPF to existing one', async () => {
      const existingProfissional = createTestProfissional({ id: 'prof-2' });
      mockProfissionalRepository.findByCPF.mockResolvedValue(existingProfissional);

      await expect(service.updateProfissional('prof-1', { cpf: '12345678901' }))
        .rejects.toThrow('Já existe um profissional cadastrado com este CPF');
    });

    it('should allow updating own CPF', async () => {
      const existingProfissional = createTestProfissional({ id: 'prof-1' });
      const updatedProfissional = createTestProfissional({ id: 'prof-1', cpf: '12345678901' });

      mockProfissionalRepository.findByCPF.mockResolvedValue(existingProfissional);
      mockProfissionalRepository.update.mockResolvedValue(updatedProfissional);

      const result = await service.updateProfissional('prof-1', { cpf: '12345678901' });

      expect(result).toEqual(updatedProfissional);
      expect(mockProfissionalRepository.update).toHaveBeenCalled();
    });

    it('should throw error if updating email to existing one', async () => {
      const existingProfissional = createTestProfissional({ id: 'prof-2' });
      mockProfissionalRepository.findByEmail.mockResolvedValue(existingProfissional);

      await expect(service.updateProfissional('prof-1', { email: 'existing@example.com' }))
        .rejects.toThrow('Já existe um profissional cadastrado com este email');
    });
  });

  describe('getProfissionalById', () => {
    it('should return a professional by id', async () => {
      const profissional = createTestProfissional();
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const result = await service.getProfissionalById('prof-1');

      expect(result).toEqual(profissional);
      expect(mockProfissionalRepository.findById).toHaveBeenCalledWith('prof-1');
    });

    it('should return null if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      const result = await service.getProfissionalById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error if repository fails', async () => {
      mockProfissionalRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.getProfissionalById('prof-1'))
        .rejects.toThrow('Erro ao buscar profissional');
    });
  });

  describe('getAllProfissionais', () => {
    it('should return all professionals', async () => {
      const profissionais = [
        createTestProfissional({ id: 'prof-1' }),
        createTestProfissional({ id: 'prof-2' })
      ];
      mockProfissionalRepository.findAll.mockResolvedValue(profissionais);

      const result = await service.getAllProfissionais();

      expect(result).toEqual(profissionais);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no professionals', async () => {
      mockProfissionalRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllProfissionais();

      expect(result).toEqual([]);
    });
  });

  describe('inativarProfissional', () => {
    it('should inactivate a professional successfully', async () => {
      const profissional = createTestProfissional();
      mockProfissionalRepository.findById.mockResolvedValue(profissional);
      mockProfissionalRepository.update.mockResolvedValue({ ...profissional, status: StatusProfissional.Inativo });
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      await service.inativarProfissional('prof-1', 'Férias prolongadas');

      expect(mockProfissionalRepository.update).toHaveBeenCalledWith('prof-1', expect.objectContaining({
        status: StatusProfissional.Inativo,
        motivoInativacao: 'Férias prolongadas'
      }));
      expect(mockNotificationService.createCustomNotification).toHaveBeenCalled();
    });

    it('should throw error if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      await expect(service.inativarProfissional('non-existent'))
        .rejects.toThrow('Erro ao inativar profissional');
    });

    it('should use default motivo if not provided', async () => {
      const profissional = createTestProfissional();
      mockProfissionalRepository.findById.mockResolvedValue(profissional);
      mockProfissionalRepository.update.mockResolvedValue({ ...profissional, status: StatusProfissional.Inativo });
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      await service.inativarProfissional('prof-1');

      expect(mockProfissionalRepository.update).toHaveBeenCalledWith('prof-1', expect.objectContaining({
        motivoInativacao: 'Inativação manual'
      }));
    });
  });

  describe('deleteProfissionalPermanente', () => {
    it('should delete professional without user account with force flag', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);
      mockProfissionalRepository.deletePhysically.mockResolvedValue(undefined);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      // Force delete bypasses appointment checks
      await service.deleteProfissionalPermanente('prof-1', true);

      expect(mockProfissionalRepository.deletePhysically).toHaveBeenCalledWith('prof-1');
      expect(mockNotificationService.createCustomNotification).toHaveBeenCalled();
    });

    it('should throw error if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      await expect(service.deleteProfissionalPermanente('non-existent'))
        .rejects.toThrow('Profissional não encontrado');
    });

    it('should call cloud function if professional has user account', async () => {
      const profissional = createTestProfissional({ userId: 'user-123' });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockResolvedValue({
        data: { success: true, message: 'Account deleted' }
      });
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      await service.deleteProfissionalPermanente('prof-1', false);

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'deleteProfessionalAccount');
      expect(mockCloudFunction).toHaveBeenCalledWith({
        userId: 'user-123',
        professionalId: 'prof-1',
        forceDelete: false
      });
    });
  });

  describe('getProfissionaisByTipo', () => {
    it('should return professionals by type', async () => {
      const profissionais = [
        createTestProfissional({ especialidade: TipoAssistencia.Psicologica })
      ];
      mockProfissionalRepository.findByTipo.mockResolvedValue(profissionais);

      const result = await service.getProfissionaisByTipo(TipoAssistencia.Psicologica);

      expect(result).toEqual(profissionais);
      expect(mockProfissionalRepository.findByTipo).toHaveBeenCalledWith(TipoAssistencia.Psicologica);
    });
  });

  describe('getProfissionaisAtivos', () => {
    it('should return only active professionals', async () => {
      const profissionais = [
        createTestProfissional({ status: StatusProfissional.Ativo })
      ];
      mockProfissionalRepository.findByStatus.mockResolvedValue(profissionais);

      const result = await service.getProfissionaisAtivos();

      expect(result).toEqual(profissionais);
      expect(mockProfissionalRepository.findByStatus).toHaveBeenCalledWith(StatusProfissional.Ativo);
    });
  });

  describe('searchProfissionais', () => {
    it('should search professionals by query', async () => {
      const profissionais = [createTestProfissional()];
      mockProfissionalRepository.searchProfissionais.mockResolvedValue(profissionais);

      const result = await service.searchProfissionais('João');

      expect(result).toEqual(profissionais);
      expect(mockProfissionalRepository.searchProfissionais).toHaveBeenCalledWith('João');
    });
  });

  describe('getHorariosDisponiveis', () => {
    it('should return available time slots', async () => {
      const profissional = createTestProfissional();
      const dataInicio = new Date('2024-01-01');
      const dataFim = new Date('2024-01-02');

      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockAgendamentoRepository = {
        findByProfissionalAndDateRange: jest.fn().mockResolvedValue([])
      };
      (service as any).agendamentoRepository = mockAgendamentoRepository;

      const availableSlots = [new Date('2024-01-01T08:00:00'), new Date('2024-01-01T09:00:00')];
      (AssistenciaEntity.obterProximosHorariosDisponiveis as jest.Mock).mockReturnValue(availableSlots);

      const result = await service.getHorariosDisponiveis('prof-1', dataInicio, dataFim);

      expect(result).toEqual(availableSlots);
    });

    it('should throw error if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      await expect(service.getHorariosDisponiveis('non-existent', new Date(), new Date()))
        .rejects.toThrow('Profissional não encontrado');
    });

    it('should use default working hours if not configured', async () => {
      const profissional = createTestProfissional({ horariosFuncionamento: [] });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockAgendamentoRepository = {
        findByProfissionalAndDateRange: jest.fn().mockResolvedValue([])
      };
      (service as any).agendamentoRepository = mockAgendamentoRepository;

      await service.getHorariosDisponiveis('prof-1', new Date(), new Date());

      expect(profissional.horariosFuncionamento).toHaveLength(5); // Monday to Friday
    });
  });

  describe('getStatistics', () => {
    it('should return professional statistics', async () => {
      const baseStats = {
        totalProfissionais: 5,
        totalAtivos: 4,
        totalInativos: 1,
        porTipo: {
          [TipoAssistencia.Psicologica]: 2,
          [TipoAssistencia.Social]: 1,
          [TipoAssistencia.Juridica]: 1,
          [TipoAssistencia.Medica]: 1,
          [TipoAssistencia.Fisioterapia]: 0,
          [TipoAssistencia.Nutricao]: 0
        },
        porStatus: {
          [StatusProfissional.Ativo]: 4,
          [StatusProfissional.Inativo]: 1,
          [StatusProfissional.Licença]: 0,
          [StatusProfissional.Suspenso]: 0
        }
      };

      const profissionais = [
        createTestProfissional({ avaliacoes: [{ nota: 5 } as any] }),
        createTestProfissional({ avaliacoes: [{ nota: 4 } as any] })
      ];

      mockProfissionalRepository.getStatistics.mockResolvedValue(baseStats);
      mockProfissionalRepository.findAll.mockResolvedValue(profissionais);

      const result = await service.getStatistics();

      expect(result).toHaveProperty('avaliacaoMedia');
      expect(result.avaliacaoMedia).toBe(4.5);
    });
  });

  describe('validateProfissionalData', () => {
    it('should return no errors for valid data', async () => {
      const validData = {
        nome: 'Dr. João',
        telefone: '11987654321',
        cpf: '12345678901',
        email: 'test@example.com',
        endereco: {
          logradouro: 'Rua Test',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      };

      (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(true);
      (AssistenciaEntity.validarCPF as jest.Mock).mockReturnValue(true);
      (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(true);

      const errors = await service.validateProfissionalData(validData);

      expect(errors).toEqual([]);
    });

    it('should return errors for invalid phone', async () => {
      (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(false);

      const errors = await service.validateProfissionalData({ telefone: 'invalid' });

      expect(errors).toContain('Telefone inválido');
    });

    it('should return errors for invalid CPF', async () => {
      (AssistenciaEntity.validarCPF as jest.Mock).mockReturnValue(false);

      const errors = await service.validateProfissionalData({ cpf: 'invalid' });

      expect(errors).toContain('CPF inválido');
    });

    it('should return errors for invalid email', async () => {
      (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(false);

      const errors = await service.validateProfissionalData({ email: 'invalid' });

      expect(errors).toContain('Email inválido');
    });

    it('should return errors for missing address fields', async () => {
      const errors = await service.validateProfissionalData({
        endereco: {
          logradouro: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        } as any
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Logradouro é obrigatório');
    });
  });

  describe('checkRegistroProfissionalExists', () => {
    it('should return true if registro exists', async () => {
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(createTestProfissional());

      const result = await service.checkRegistroProfissionalExists('CRP-123456');

      expect(result).toBe(true);
    });

    it('should return false if registro does not exist', async () => {
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(null);

      const result = await service.checkRegistroProfissionalExists('CRP-999999');

      expect(result).toBe(false);
    });

    it('should exclude own id when checking', async () => {
      const profissional = createTestProfissional({ id: 'prof-1' });
      mockProfissionalRepository.findByRegistroProfissional.mockResolvedValue(profissional);

      const result = await service.checkRegistroProfissionalExists('CRP-123456', 'prof-1');

      expect(result).toBe(false);
    });
  });

  describe('createUserAccountForProfessional', () => {
    it('should create user account successfully', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockResolvedValue({
        data: { success: true, userId: 'new-user-id', message: 'Account created' }
      });
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBeDefined();
      expect(result.userId).toBe('new-user-id');
    });

    it('should return error if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      const result = await service.createUserAccountForProfessional('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profissional não encontrado');
    });

    it('should return error if professional already has account', async () => {
      const profissional = createTestProfissional({ userId: 'existing-user-id' });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profissional já possui conta de usuário');
    });

    it('should handle cloud function errors', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockRejectedValue({
        code: 'functions/already-exists',
        message: 'Email already exists'
      });
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Este email já está cadastrado no sistema');
    });

    it('should handle permission denied errors', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockRejectedValue({
        code: 'functions/permission-denied',
        message: 'Permission denied'
      });
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Você não tem permissão para criar contas de profissionais');
    });

    it('should handle unauthenticated errors', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockRejectedValue({
        code: 'functions/unauthenticated',
        message: 'Unauthenticated'
      });
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Você precisa estar autenticado para criar contas');
    });

    it('should handle generic errors', async () => {
      const profissional = createTestProfissional({ userId: undefined });
      mockProfissionalRepository.findById.mockResolvedValue(profissional);

      const mockCloudFunction = jest.fn().mockRejectedValue(new Error('Generic error'));
      (httpsCallable as jest.Mock).mockReturnValue(mockCloudFunction);

      const result = await service.createUserAccountForProfessional('prof-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generic error');
    });
  });

  describe('getProfissionaisDisponiveis', () => {
    it('should return available professionals for a given date', async () => {
      const profissionais = [createTestProfissional()];
      mockProfissionalRepository.findDisponiveis.mockResolvedValue(profissionais);

      const result = await service.getProfissionaisDisponiveis(TipoAssistencia.Psicologica, new Date());

      expect(result).toEqual(profissionais);
      expect(mockProfissionalRepository.findDisponiveis).toHaveBeenCalled();
    });

    it('should throw error if repository fails', async () => {
      mockProfissionalRepository.findDisponiveis.mockRejectedValue(new Error('Database error'));

      await expect(service.getProfissionaisDisponiveis(TipoAssistencia.Psicologica, new Date()))
        .rejects.toThrow('Erro ao buscar profissionais disponíveis');
    });
  });

  describe('activateProfissional', () => {
    it('should activate a professional', async () => {
      mockProfissionalRepository.activateProfissional.mockResolvedValue(undefined);

      await service.activateProfissional('prof-1');

      expect(mockProfissionalRepository.activateProfissional).toHaveBeenCalledWith('prof-1');
    });
  });

  describe('deactivateProfissional', () => {
    it('should deactivate a professional', async () => {
      mockProfissionalRepository.deactivateProfissional.mockResolvedValue(undefined);

      await service.deactivateProfissional('prof-1', 'Férias');

      expect(mockProfissionalRepository.deactivateProfissional).toHaveBeenCalledWith('prof-1', 'Férias');
    });
  });

  describe('updateStatusProfissional', () => {
    it('should update professional status', async () => {
      mockProfissionalRepository.updateStatus.mockResolvedValue(undefined);

      await service.updateStatusProfissional('prof-1', StatusProfissional.Licença, 'Licença médica');

      expect(mockProfissionalRepository.updateStatus).toHaveBeenCalledWith('prof-1', StatusProfissional.Licença, 'Licença médica');
    });
  });

  describe('updateHorariosFuncionamento', () => {
    it('should update working hours', async () => {
      const horarios = [{ diaSemana: 1, horaInicio: '09:00', horaFim: '17:00' }];
      const updatedProfissional = createTestProfissional({ horariosFuncionamento: horarios });

      mockProfissionalRepository.update.mockResolvedValue(updatedProfissional);

      await service.updateHorariosFuncionamento('prof-1', horarios);

      expect(mockProfissionalRepository.update).toHaveBeenCalledWith('prof-1', { horariosFuncionamento: horarios });
    });
  });

  describe('getProfissionalByEmail', () => {
    it('should return professional by email', async () => {
      const profissional = createTestProfissional();
      mockProfissionalRepository.findByEmail.mockResolvedValue(profissional);

      const result = await service.getProfissionalByEmail('joao.silva@example.com');

      expect(result).toEqual(profissional);
    });

    it('should throw error if repository fails', async () => {
      mockProfissionalRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.getProfissionalByEmail('test@example.com'))
        .rejects.toThrow('Erro ao buscar profissional por email');
    });
  });
});

describe('AgendamentoAssistenciaService', () => {
  let service: AgendamentoAssistenciaService;
  let mockAgendamentoRepository: jest.Mocked<FirebaseAgendamentoAssistenciaRepository>;
  let mockProfissionalRepository: jest.Mocked<FirebaseProfissionalAssistenciaRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const createTestAgendamento = (overrides: Partial<AgendamentoAssistencia> = {}): AgendamentoAssistencia => ({
    id: 'agend-1',
    pacienteId: 'pac-1',
    pacienteNome: 'Maria Silva',
    pacienteTelefone: '11987654321',
    pacienteEmail: 'maria@example.com',
    profissionalId: 'prof-1',
    profissionalNome: 'Dr. João',
    tipoAssistencia: TipoAssistencia.Psicologica,
    dataHoraAgendamento: new Date('2024-01-15T10:00:00'),
    dataHoraFim: new Date('2024-01-15T11:00:00'),
    modalidade: ModalidadeAtendimento.Presencial,
    prioridade: PrioridadeAtendimento.Normal,
    status: StatusAgendamento.Agendado,
    motivo: 'Consulta inicial',
    valor: 100,
    anexos: [],
    historico: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset validation mocks to default behavior
    (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(true);
    (AssistenciaEntity.validarCPF as jest.Mock).mockReturnValue(true);
    (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(true);

    mockAgendamentoRepository = new FirebaseAgendamentoAssistenciaRepository() as jest.Mocked<FirebaseAgendamentoAssistenciaRepository>;
    mockProfissionalRepository = new FirebaseProfissionalAssistenciaRepository() as jest.Mocked<FirebaseProfissionalAssistenciaRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    service = new AgendamentoAssistenciaService();

    (service as any).agendamentoRepository = mockAgendamentoRepository;
    (service as any).profissionalRepository = mockProfissionalRepository;
    (service as any).notificationService = mockNotificationService;
  });

  describe('createAgendamento', () => {
    const validAgendamentoData = {
      pacienteId: 'pac-1',
      pacienteNome: 'Maria Silva',
      pacienteTelefone: '11987654321',
      profissionalId: 'prof-1',
      profissionalNome: 'Dr. João',
      tipoAssistencia: TipoAssistencia.Psicologica,
      dataHoraAgendamento: new Date('2024-01-15T10:00:00'),
      dataHoraFim: new Date('2024-01-15T11:00:00'),
      modalidade: ModalidadeAtendimento.Presencial,
      prioridade: PrioridadeAtendimento.Normal,
      status: StatusAgendamento.Agendado,
      motivo: 'Consulta inicial',
      valor: 100,
      createdBy: 'admin'
    };

    it('should create an appointment successfully', async () => {
      const createdAgendamento = createTestAgendamento();

      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([]);
      mockAgendamentoRepository.create.mockResolvedValue(createdAgendamento);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      const result = await service.createAgendamento(validAgendamentoData);

      expect(result).toEqual(createdAgendamento);
      expect(mockAgendamentoRepository.create).toHaveBeenCalled();
      expect(mockNotificationService.createCustomNotification).toHaveBeenCalled();
    });

    it('should throw error if time slot not available', async () => {
      const existingAgendamento = createTestAgendamento();
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([existingAgendamento]);

      await expect(service.createAgendamento(validAgendamentoData))
        .rejects.toThrow('Horário não disponível para este profissional');
    });

    it('should throw error if validation fails', async () => {
      const invalidData = { ...validAgendamentoData, pacienteTelefone: 'invalid' };
      (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(false);

      await expect(service.createAgendamento(invalidData))
        .rejects.toThrow('Telefone do paciente inválido');
    });

    it('should calculate final value with discount', async () => {
      const dataWithDiscount = { ...validAgendamentoData, desconto: 20 };
      const createdAgendamento = createTestAgendamento({ valorFinal: 80 });

      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([]);
      mockAgendamentoRepository.create.mockResolvedValue(createdAgendamento);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      (AssistenciaEntity.calcularValorFinalConsulta as jest.Mock).mockReturnValue(80);

      await service.createAgendamento(dataWithDiscount);

      expect(AssistenciaEntity.calcularValorFinalConsulta).toHaveBeenCalledWith(100, 20);
    });
  });

  describe('updateAgendamento', () => {
    it('should update an appointment successfully', async () => {
      const updatedAgendamento = createTestAgendamento({ motivo: 'Consulta de retorno' });
      mockAgendamentoRepository.update.mockResolvedValue(updatedAgendamento);

      const result = await service.updateAgendamento('agend-1', { motivo: 'Consulta de retorno' });

      expect(result).toEqual(updatedAgendamento);
      expect(mockAgendamentoRepository.update).toHaveBeenCalledWith('agend-1', { motivo: 'Consulta de retorno' });
    });
  });

  describe('getAgendamentoById', () => {
    it('should return an appointment by id', async () => {
      const agendamento = createTestAgendamento();
      mockAgendamentoRepository.findById.mockResolvedValue(agendamento);

      const result = await service.getAgendamentoById('agend-1');

      expect(result).toEqual(agendamento);
    });

    it('should return null if appointment not found', async () => {
      mockAgendamentoRepository.findById.mockResolvedValue(null);

      const result = await service.getAgendamentoById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllAgendamentos', () => {
    it('should return all appointments', async () => {
      const agendamentos = [
        createTestAgendamento({ id: 'agend-1' }),
        createTestAgendamento({ id: 'agend-2' })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.getAllAgendamentos();

      expect(result).toEqual(agendamentos);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAgendamentosByPaciente', () => {
    it('should return appointments by patient', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.findByPaciente.mockResolvedValue(agendamentos);

      const result = await service.getAgendamentosByPaciente('pac-1');

      expect(result).toEqual(agendamentos);
      expect(mockAgendamentoRepository.findByPaciente).toHaveBeenCalledWith('pac-1');
    });
  });

  describe('getAgendamentosByProfissional', () => {
    it('should return appointments by professional', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.findByProfissional.mockResolvedValue(agendamentos);

      const result = await service.getAgendamentosByProfissional('prof-1');

      expect(result).toEqual(agendamentos);
      expect(mockAgendamentoRepository.findByProfissional).toHaveBeenCalledWith('prof-1');
    });
  });

  describe('confirmarAgendamento', () => {
    it('should confirm appointment and create ficha', async () => {
      const agendamento = createTestAgendamento();
      mockAgendamentoRepository.confirmarAgendamento.mockResolvedValue(undefined);
      mockAgendamentoRepository.findById.mockResolvedValue(agendamento);

      // Mock dynamic import
      const mockFichaRepository = {
        getFichasByPaciente: jest.fn().mockResolvedValue([]),
        createFicha: jest.fn().mockResolvedValue({})
      };

      jest.mock('@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository', () => ({
        FirebaseFichaAcompanhamentoRepository: jest.fn(() => mockFichaRepository)
      }));

      const mockProfissional = { id: 'prof-1', nome: 'Dr. João' };
      mockProfissionalRepository.findById.mockResolvedValue(mockProfissional as any);

      await service.confirmarAgendamento('agend-1', 'admin');

      expect(mockAgendamentoRepository.confirmarAgendamento).toHaveBeenCalledWith('agend-1', 'admin');
    });
  });

  describe('cancelarAgendamento', () => {
    it('should cancel appointment successfully', async () => {
      mockAgendamentoRepository.cancelarAgendamento.mockResolvedValue(undefined);

      await service.cancelarAgendamento('agend-1', 'Paciente desistiu', 'admin');

      expect(mockAgendamentoRepository.cancelarAgendamento).toHaveBeenCalledWith('agend-1', 'Paciente desistiu', 'admin');
    });
  });

  describe('remarcarAgendamento', () => {
    it('should reschedule appointment successfully', async () => {
      const novaData = new Date('2024-01-16T10:00:00');
      mockAgendamentoRepository.remarcarAgendamento.mockResolvedValue(undefined);

      await service.remarcarAgendamento('agend-1', novaData, 'admin');

      expect(mockAgendamentoRepository.remarcarAgendamento).toHaveBeenCalledWith('agend-1', novaData, 'admin');
    });
  });

  describe('verificarDisponibilidade', () => {
    it('should return true if time slot is available', async () => {
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([]);

      const result = await service.verificarDisponibilidade(
        'prof-1',
        new Date('2024-01-15T10:00:00'),
        3600000
      );

      expect(result).toBe(true);
    });

    it('should return false if time slot has conflicts', async () => {
      const existingAgendamento = createTestAgendamento();
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([existingAgendamento]);

      const result = await service.verificarDisponibilidade(
        'prof-1',
        new Date('2024-01-15T10:00:00'),
        3600000
      );

      expect(result).toBe(false);
    });
  });

  describe('checkConflitosHorario', () => {
    it('should return true if there are conflicts', async () => {
      const existingAgendamento = createTestAgendamento({
        status: StatusAgendamento.Confirmado,
        dataHoraAgendamento: new Date('2024-01-15T10:00:00'),
        dataHoraFim: new Date('2024-01-15T11:00:00')
      });
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([existingAgendamento]);

      const result = await service.checkConflitosHorario(
        'prof-1',
        new Date('2024-01-15T10:30:00'),
        new Date('2024-01-15T11:30:00')
      );

      expect(result).toBe(true);
    });

    it('should return false if no conflicts', async () => {
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([]);

      const result = await service.checkConflitosHorario(
        'prof-1',
        new Date('2024-01-15T10:00:00'),
        new Date('2024-01-15T11:00:00')
      );

      expect(result).toBe(false);
    });

    it('should exclude specified appointment id', async () => {
      const existingAgendamento = createTestAgendamento({ id: 'agend-1' });
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([existingAgendamento]);

      const result = await service.checkConflitosHorario(
        'prof-1',
        new Date('2024-01-15T10:00:00'),
        new Date('2024-01-15T11:00:00'),
        'agend-1'
      );

      expect(result).toBe(false);
    });

    it('should ignore cancelled appointments', async () => {
      const cancelledAgendamento = createTestAgendamento({ status: StatusAgendamento.Cancelado });
      mockAgendamentoRepository.findByProfissionalAndDateRange.mockResolvedValue([cancelledAgendamento]);

      const result = await service.checkConflitosHorario(
        'prof-1',
        new Date('2024-01-15T10:00:00'),
        new Date('2024-01-15T11:00:00')
      );

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return appointment statistics', async () => {
      const stats = {
        totalAgendamentos: 10,
        agendamentosHoje: 2,
        agendamentosSemana: 5,
        agendamentosMes: 10,
        porTipo: {} as any,
        porStatus: {} as any,
        taxaOcupacao: 85
      };
      mockAgendamentoRepository.getEstatisticasGerais.mockResolvedValue(stats);

      const result = await service.getStatistics();

      expect(result).toEqual(stats);
    });
  });

  describe('validateAgendamentoData', () => {
    it('should return no errors for valid data', async () => {
      (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(true);
      (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(true);

      const errors = await service.validateAgendamentoData({
        pacienteNome: 'Maria Silva',
        pacienteTelefone: '11987654321',
        pacienteEmail: 'maria@example.com',
        motivo: 'Consulta'
      });

      expect(errors).toEqual([]);
    });

    it('should return error for invalid phone', async () => {
      (AssistenciaEntity.validarTelefone as jest.Mock).mockReturnValue(false);

      const errors = await service.validateAgendamentoData({
        pacienteTelefone: 'invalid'
      });

      expect(errors).toContain('Telefone do paciente inválido');
    });

    it('should return error for invalid email', async () => {
      (AssistenciaEntity.validarEmail as jest.Mock).mockReturnValue(false);

      const errors = await service.validateAgendamentoData({
        pacienteEmail: 'invalid'
      });

      expect(errors).toContain('Email do paciente inválido');
    });
  });

  describe('calcularValorTotal', () => {
    it('should calculate total value without discount', async () => {
      const profissional = { valorConsulta: 100 } as any;
      mockProfissionalRepository.findById.mockResolvedValue(profissional);
      (AssistenciaEntity.calcularValorFinalConsulta as jest.Mock).mockReturnValue(100);

      const result = await service.calcularValorTotal('prof-1');

      expect(result).toBe(100);
    });

    it('should calculate total value with discount', async () => {
      const profissional = { valorConsulta: 100 } as any;
      mockProfissionalRepository.findById.mockResolvedValue(profissional);
      (AssistenciaEntity.calcularValorFinalConsulta as jest.Mock).mockReturnValue(80);

      const result = await service.calcularValorTotal('prof-1', 20);

      expect(result).toBe(80);
      expect(AssistenciaEntity.calcularValorFinalConsulta).toHaveBeenCalledWith(100, 20);
    });

    it('should return 0 if professional not found', async () => {
      mockProfissionalRepository.findById.mockResolvedValue(null);

      const result = await service.calcularValorTotal('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate appointment report', async () => {
      const agendamentos = [
        createTestAgendamento({ status: StatusAgendamento.Concluido, valorFinal: 100 }),
        createTestAgendamento({ status: StatusAgendamento.Agendado, valorFinal: 100 })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport();

      expect(result.totalAgendamentos).toBe(2);
      expect(result.faturamentoTotal).toBeGreaterThan(0);
      expect(result.distribuicaoStatus).toBeDefined();
      expect(result.distribuicaoTipos).toBeDefined();
    });

    it('should filter report by professional', async () => {
      const agendamentos = [
        createTestAgendamento({ profissionalId: 'prof-1' }),
        createTestAgendamento({ profissionalId: 'prof-2' })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport({ profissionalId: 'prof-1' });

      expect(result.totalAgendamentos).toBe(1);
      expect(result.agendamentos[0].profissionalId).toBe('prof-1');
    });

    it('should filter report by date range', async () => {
      const agendamentos = [
        createTestAgendamento({ dataHoraAgendamento: new Date('2024-01-15') }),
        createTestAgendamento({ dataHoraAgendamento: new Date('2024-01-20') })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport({
        dataInicio: new Date('2024-01-14'),
        dataFim: new Date('2024-01-16')
      });

      expect(result.totalAgendamentos).toBe(1);
    });

    it('should filter report by type', async () => {
      const agendamentos = [
        createTestAgendamento({ tipoAssistencia: TipoAssistencia.Psicologica }),
        createTestAgendamento({ tipoAssistencia: TipoAssistencia.Fisioterapia })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport({ tipo: TipoAssistencia.Psicologica });

      expect(result.totalAgendamentos).toBe(1);
      expect(result.agendamentos[0].tipoAssistencia).toBe(TipoAssistencia.Psicologica);
    });

    it('should filter report by status', async () => {
      const agendamentos = [
        createTestAgendamento({ status: StatusAgendamento.Concluido }),
        createTestAgendamento({ status: StatusAgendamento.Cancelado })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport({ status: StatusAgendamento.Concluido });

      expect(result.totalAgendamentos).toBe(1);
      expect(result.agendamentos[0].status).toBe(StatusAgendamento.Concluido);
    });

    it('should calculate average rating correctly', async () => {
      const agendamentos = [
        createTestAgendamento({ avaliacaoServico: { nota: 5 } as any }),
        createTestAgendamento({ avaliacaoServico: { nota: 3 } as any })
      ];
      mockAgendamentoRepository.findAll.mockResolvedValue(agendamentos);

      const result = await service.generateReport();

      expect(result.avaliacaoMedia).toBe(4);
    });
  });

  describe('deleteAgendamento', () => {
    it('should delete an appointment', async () => {
      mockAgendamentoRepository.deletePhysically.mockResolvedValue(undefined);

      await service.deleteAgendamento('agend-1');

      expect(mockAgendamentoRepository.deletePhysically).toHaveBeenCalledWith('agend-1');
    });
  });

  describe('getAgendamentosHoje', () => {
    it('should return today appointments', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.findAgendamentosHoje.mockResolvedValue(agendamentos);

      const result = await service.getAgendamentosHoje();

      expect(result).toEqual(agendamentos);
    });
  });

  describe('getProximosAgendamentos', () => {
    it('should return upcoming appointments', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.findProximosAgendamentos.mockResolvedValue(agendamentos);

      const result = await service.getProximosAgendamentos('prof-1', 10);

      expect(result).toEqual(agendamentos);
    });
  });

  describe('getAgendamentosPorPeriodo', () => {
    it('should return appointments by period', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.getAgendamentosPorPeriodo.mockResolvedValue(agendamentos);

      const result = await service.getAgendamentosPorPeriodo(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result).toEqual(agendamentos);
    });
  });

  describe('searchAgendamentos', () => {
    it('should search appointments', async () => {
      const agendamentos = [createTestAgendamento()];
      mockAgendamentoRepository.searchAgendamentos.mockResolvedValue(agendamentos);

      const result = await service.searchAgendamentos('Maria');

      expect(result).toEqual(agendamentos);
    });
  });

  describe('iniciarConsulta', () => {
    it('should start a consultation', async () => {
      mockAgendamentoRepository.iniciarConsulta.mockResolvedValue(undefined);

      await service.iniciarConsulta('agend-1', 'admin');

      expect(mockAgendamentoRepository.iniciarConsulta).toHaveBeenCalledWith('agend-1', 'admin');
    });
  });

  describe('concluirConsulta', () => {
    it('should finish a consultation', async () => {
      mockAgendamentoRepository.concluirConsulta.mockResolvedValue(undefined);

      await service.concluirConsulta('agend-1', 'Consulta realizada com sucesso', 'admin');

      expect(mockAgendamentoRepository.concluirConsulta).toHaveBeenCalledWith('agend-1', 'Consulta realizada com sucesso', 'admin');
    });
  });

  describe('marcarFalta', () => {
    it('should mark appointment as missed', async () => {
      mockAgendamentoRepository.updateStatus.mockResolvedValue(undefined);

      await service.marcarFalta('agend-1', 'admin');

      expect(mockAgendamentoRepository.updateStatus).toHaveBeenCalledWith(
        'agend-1',
        StatusAgendamento.Faltou,
        'Paciente não compareceu',
        'admin'
      );
    });
  });

  // Note: obterHorariosDisponiveis internally creates a ProfissionalAssistenciaService
  // This is tested indirectly through integration tests

  describe('enviarLembrete', () => {
    it('should send reminder', async () => {
      const agendamento = createTestAgendamento();
      mockAgendamentoRepository.findById.mockResolvedValue(agendamento);

      await service.enviarLembrete('agend-1', 'sms');

      expect(mockAgendamentoRepository.findById).toHaveBeenCalledWith('agend-1');
    });

    it('should throw error if appointment not found', async () => {
      mockAgendamentoRepository.findById.mockResolvedValue(null);

      await expect(service.enviarLembrete('non-existent', 'email'))
        .rejects.toThrow('Agendamento não encontrado');
    });
  });

  describe('getEstatisticasPorProfissional', () => {
    it('should return statistics for a professional', async () => {
      const stats = {
        totalAgendamentos: 5,
        agendamentosHoje: 1,
        agendamentosSemana: 3,
        agendamentosMes: 5,
        porTipo: {} as any,
        porStatus: {} as any,
        taxaOcupacao: 75
      };
      mockAgendamentoRepository.getEstatisticasPorProfissional.mockResolvedValue(stats);

      const result = await service.getEstatisticasPorProfissional('prof-1');

      expect(result).toEqual(stats);
    });
  });
});
