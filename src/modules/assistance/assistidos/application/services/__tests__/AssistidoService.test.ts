// Unit Tests - AssistidoService
// Comprehensive tests for assisted people service operations including CRUD, validation,
// family and attendance management, statistics, and report generation

import { AssistidoService } from '../AssistidoService';
import {
  Assistido,
  AssistidoEntity,
  StatusAssistido,
  SituacaoFamiliar,
  Escolaridade,
  NecessidadeAssistido,
  TipoMoradia,
  TipoParentesco,
  TipoAtendimento,
  EnderecoAssistido,
  FamiliarAssistido,
  AtendimentoAssistido
} from '../../../domain/entities/Assistido';
import { FirebaseAssistidoRepository } from '../../../infrastructure/repositories/FirebaseAssistidoRepository';
import { NotificationService } from '@modules/shared-kernel/infrastructure/services/NotificationService';

// Mock Firebase to prevent auth/invalid-api-key error in CI
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock the dependencies
jest.mock('../../../infrastructure/repositories/FirebaseAssistidoRepository');
jest.mock('@modules/shared-kernel/infrastructure/services/NotificationService');

describe('AssistidoService', () => {
  let assistidoService: AssistidoService;
  let mockRepository: jest.Mocked<FirebaseAssistidoRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  // Test data factories
  const createTestEndereco = (overrides: Partial<EnderecoAssistido> = {}): EnderecoAssistido => ({
    logradouro: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 101',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    ...overrides
  });

  const createTestFamiliar = (overrides: Partial<FamiliarAssistido> = {}): FamiliarAssistido => ({
    id: 'familiar-1',
    nome: 'Maria Silva',
    parentesco: TipoParentesco.Esposa,
    dataNascimento: new Date('1985-03-10'),
    cpf: '987.654.321-00',
    telefone: '(11) 98888-8888',
    profissao: 'Professora',
    renda: 2000,
    ...overrides
  });

  const createTestAtendimento = (overrides: Partial<AtendimentoAssistido> = {}): AtendimentoAssistido => ({
    id: 'atendimento-1',
    data: new Date('2024-01-15'),
    tipo: TipoAtendimento.CestaBasica,
    descricao: 'Entrega de cesta básica',
    responsavel: 'admin-1',
    observacoes: 'Família em situação de vulnerabilidade',
    ...overrides
  });

  const createTestAssistido = (overrides: Partial<Assistido> = {}): Assistido => ({
    id: 'assistido-1',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    dataNascimento: new Date('1980-05-15'),
    telefone: '(11) 99999-9999',
    email: 'joao@example.com',
    endereco: createTestEndereco(),
    situacaoFamiliar: SituacaoFamiliar.Casado,
    rendaFamiliar: 2000,
    profissao: 'Auxiliar Geral',
    escolaridade: Escolaridade.MedioCompleto,
    necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Emprego],
    tipoMoradia: TipoMoradia.Alugada,
    quantidadeComodos: 3,
    possuiCadUnico: true,
    qualBeneficio: 'Bolsa Família',
    observacoes: 'Família em acompanhamento',
    status: StatusAssistido.Ativo,
    dataInicioAtendimento: new Date('2024-01-01'),
    dataUltimoAtendimento: new Date('2024-01-15'),
    responsavelAtendimento: 'admin-1',
    familiares: [],
    atendimentos: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin-1',
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create fresh mock instances
    mockRepository = new FirebaseAssistidoRepository() as jest.Mocked<FirebaseAssistidoRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Create service instance
    assistidoService = new AssistidoService();

    // Replace private dependencies with mocks
    (assistidoService as any).assistidoRepository = mockRepository;
    (assistidoService as any).notificationService = mockNotificationService;

    // Mock entity validation methods
    jest.spyOn(AssistidoEntity, 'validarCPF').mockReturnValue(true);
    jest.spyOn(AssistidoEntity, 'validarTelefone').mockReturnValue(true);
    jest.spyOn(AssistidoEntity, 'formatarTelefone').mockImplementation((tel) => tel);
    jest.spyOn(AssistidoEntity, 'formatarCPF').mockImplementation((cpf) => cpf);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================
  // CREATE OPERATIONS
  // ===========================================
  describe('createAssistido', () => {
    it('should create an assistido successfully with all required fields', async () => {
      const assistidoData: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'> = {
        nome: 'João Silva',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        dataNascimento: new Date('1980-05-15'),
        telefone: '(11) 99999-9999',
        email: 'joao@example.com',
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        rendaFamiliar: 2000,
        profissao: 'Auxiliar Geral',
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        qualBeneficio: 'Bolsa Família',
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date('2024-01-01'),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      const createdAssistido = createTestAssistido();
      mockRepository.create.mockResolvedValue(createdAssistido);

      const result = await assistidoService.createAssistido(assistidoData);

      expect(result).toEqual(createdAssistido);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(AssistidoEntity.validarCPF).toHaveBeenCalledWith(assistidoData.cpf);
      expect(AssistidoEntity.validarTelefone).toHaveBeenCalledWith(assistidoData.telefone);
    });

    it('should create assistido without optional CPF', async () => {
      const assistidoData: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'> = {
        nome: 'Maria Santos',
        telefone: '(11) 98888-8888',
        dataNascimento: new Date('1990-03-10'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Solteiro,
        escolaridade: Escolaridade.FundamentalCompleto,
        necessidades: [NecessidadeAssistido.Educacao],
        tipoMoradia: TipoMoradia.Propria,
        quantidadeComodos: 2,
        possuiCadUnico: false,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      const createdAssistido = createTestAssistido({ cpf: undefined });
      mockRepository.create.mockResolvedValue(createdAssistido);

      const result = await assistidoService.createAssistido(assistidoData);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error when nome is missing', async () => {
      const invalidData = {
        nome: '',
        telefone: '(11) 99999-9999',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      await expect(assistidoService.createAssistido(invalidData))
        .rejects.toThrow('Nome e telefone são obrigatórios');
    });

    it('should throw error when telefone is missing', async () => {
      const invalidData = {
        nome: 'João Silva',
        telefone: '',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      await expect(assistidoService.createAssistido(invalidData))
        .rejects.toThrow('Nome e telefone são obrigatórios');
    });

    it('should throw error when CPF is invalid', async () => {
      jest.spyOn(AssistidoEntity, 'validarCPF').mockReturnValue(false);

      const invalidData = {
        nome: 'João Silva',
        cpf: '111.111.111-11', // Invalid CPF
        telefone: '(11) 99999-9999',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      await expect(assistidoService.createAssistido(invalidData))
        .rejects.toThrow('CPF inválido');
    });

    it('should throw error when telefone is invalid', async () => {
      jest.spyOn(AssistidoEntity, 'validarTelefone').mockReturnValue(false);

      const invalidData = {
        nome: 'João Silva',
        telefone: '123', // Invalid phone
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      await expect(assistidoService.createAssistido(invalidData))
        .rejects.toThrow('Telefone inválido');
    });

    it('should throw error when CPF already exists', async () => {
      const existingAssistido = createTestAssistido({ cpf: '123.456.789-00' });
      mockRepository.findByCPF.mockResolvedValue(existingAssistido);

      const duplicateData = {
        nome: 'Outro Nome',
        cpf: '123.456.789-00',
        telefone: '(11) 99999-9999',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      await expect(assistidoService.createAssistido(duplicateData))
        .rejects.toThrow('Já existe um assistido cadastrado com este CPF');
    });

    it('should format telefone and CPF before saving', async () => {
      jest.spyOn(AssistidoEntity, 'formatarTelefone').mockReturnValue('(11) 99999-9999');
      jest.spyOn(AssistidoEntity, 'formatarCPF').mockReturnValue('123.456.789-00');

      const assistidoData = {
        nome: 'João Silva',
        cpf: '12345678900',
        telefone: '11999999999',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      const createdAssistido = createTestAssistido();
      mockRepository.create.mockResolvedValue(createdAssistido);

      await assistidoService.createAssistido(assistidoData);

      expect(AssistidoEntity.formatarTelefone).toHaveBeenCalledWith('11999999999');
      expect(AssistidoEntity.formatarCPF).toHaveBeenCalledWith('12345678900');
    });

    it('should set status to Ativo and dataInicioAtendimento automatically', async () => {
      const assistidoData = {
        nome: 'João Silva',
        telefone: '(11) 99999-9999',
        dataNascimento: new Date('1980-05-15'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Casado,
        escolaridade: Escolaridade.MedioCompleto,
        necessidades: [NecessidadeAssistido.Alimentacao],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 3,
        possuiCadUnico: true,
        status: StatusAssistido.Suspenso, // Should be overridden
        dataInicioAtendimento: new Date('2020-01-01'), // Should be overridden
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      mockRepository.create.mockImplementation(async (data) => {
        expect(data.status).toBe(StatusAssistido.Ativo);
        expect(data.dataInicioAtendimento).toBeInstanceOf(Date);
        return createTestAssistido();
      });

      await assistidoService.createAssistido(assistidoData);

      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  // ===========================================
  // UPDATE OPERATIONS
  // ===========================================
  describe('updateAssistido', () => {
    it('should update assistido successfully', async () => {
      const updates = {
        nome: 'João Silva Santos',
        profissao: 'Técnico em Informática'
      };

      const updatedAssistido = createTestAssistido(updates);
      mockRepository.update.mockResolvedValue(updatedAssistido);

      const result = await assistidoService.updateAssistido('assistido-1', updates);

      expect(result.nome).toBe('João Silva Santos');
      expect(mockRepository.update).toHaveBeenCalledWith('assistido-1', updates);
    });

    it('should validate CPF when updating', async () => {
      jest.spyOn(AssistidoEntity, 'validarCPF').mockReturnValue(false);

      const updates = {
        cpf: '111.111.111-11'
      };

      await expect(assistidoService.updateAssistido('assistido-1', updates))
        .rejects.toThrow('CPF inválido');
    });

    it('should validate telefone when updating', async () => {
      jest.spyOn(AssistidoEntity, 'validarTelefone').mockReturnValue(false);

      const updates = {
        telefone: '123'
      };

      await expect(assistidoService.updateAssistido('assistido-1', updates))
        .rejects.toThrow('Telefone inválido');
    });

    it('should check for duplicate CPF when updating', async () => {
      const existingAssistido = createTestAssistido({ id: 'assistido-2', cpf: '987.654.321-00' });
      mockRepository.findByCPF.mockResolvedValue(existingAssistido);

      const updates = {
        cpf: '987.654.321-00'
      };

      await expect(assistidoService.updateAssistido('assistido-1', updates))
        .rejects.toThrow('Já existe um assistido cadastrado com este CPF');
    });

    it('should allow updating to same CPF', async () => {
      const sameAssistido = createTestAssistido({ id: 'assistido-1', cpf: '123.456.789-00' });
      mockRepository.findByCPF.mockResolvedValue(sameAssistido);
      mockRepository.update.mockResolvedValue(sameAssistido);

      const updates = {
        cpf: '123.456.789-00',
        nome: 'Nome Atualizado'
      };

      await expect(assistidoService.updateAssistido('assistido-1', updates))
        .resolves.toBeDefined();
    });

    it('should format telefone and CPF when updating', async () => {
      jest.spyOn(AssistidoEntity, 'formatarTelefone').mockReturnValue('(11) 98888-8888');
      jest.spyOn(AssistidoEntity, 'formatarCPF').mockReturnValue('987.654.321-00');

      const updates = {
        telefone: '11988888888',
        cpf: '98765432100'
      };

      const updatedAssistido = createTestAssistido(updates);
      mockRepository.update.mockResolvedValue(updatedAssistido);

      await assistidoService.updateAssistido('assistido-1', updates);

      expect(AssistidoEntity.formatarTelefone).toHaveBeenCalledWith('11988888888');
      expect(AssistidoEntity.formatarCPF).toHaveBeenCalledWith('98765432100');
    });

    it('should propagate repository errors', async () => {
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.updateAssistido('assistido-1', { nome: 'Test' }))
        .rejects.toThrow('Database error');
    });
  });

  // ===========================================
  // READ OPERATIONS
  // ===========================================
  describe('getAssistidoById', () => {
    it('should return assistido when found', async () => {
      const assistido = createTestAssistido({ id: 'assistido-123' });
      mockRepository.findById.mockResolvedValue(assistido);

      const result = await assistidoService.getAssistidoById('assistido-123');

      expect(result).toEqual(assistido);
      expect(mockRepository.findById).toHaveBeenCalledWith('assistido-123');
    });

    it('should return null when assistido not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await assistidoService.getAssistidoById('non-existent');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Network error'));

      await expect(assistidoService.getAssistidoById('assistido-1'))
        .rejects.toThrow('Erro ao buscar assistido');
    });
  });

  describe('getAllAssistidos', () => {
    it('should return all assistidos', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1', nome: 'João Silva' }),
        createTestAssistido({ id: 'assistido-2', nome: 'Maria Santos' }),
        createTestAssistido({ id: 'assistido-3', nome: 'Pedro Costa' })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.getAllAssistidos();

      expect(result).toHaveLength(3);
      expect(result).toEqual(assistidos);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no assistidos exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await assistidoService.getAllAssistidos();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getAllAssistidos())
        .rejects.toThrow('Erro ao buscar assistidos');
    });
  });

  describe('getAssistidosByStatus', () => {
    it('should return assistidos with Ativo status', async () => {
      const ativos = [
        createTestAssistido({ id: 'assistido-1', status: StatusAssistido.Ativo }),
        createTestAssistido({ id: 'assistido-2', status: StatusAssistido.Ativo })
      ];
      mockRepository.findByStatus.mockResolvedValue(ativos);

      const result = await assistidoService.getAssistidosByStatus(StatusAssistido.Ativo);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(StatusAssistido.Ativo);
    });

    it('should return assistidos with Inativo status', async () => {
      const inativos = [
        createTestAssistido({ id: 'assistido-1', status: StatusAssistido.Inativo })
      ];
      mockRepository.findByStatus.mockResolvedValue(inativos);

      const result = await assistidoService.getAssistidosByStatus(StatusAssistido.Inativo);

      expect(result).toHaveLength(1);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(StatusAssistido.Inativo);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getAssistidosByStatus(StatusAssistido.Ativo))
        .rejects.toThrow('Erro ao buscar assistidos por status');
    });
  });

  describe('getAssistidosByNecessidade', () => {
    it('should return assistidos with specific necessidade', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1', necessidades: [NecessidadeAssistido.Alimentacao] }),
        createTestAssistido({ id: 'assistido-2', necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Saude] })
      ];
      mockRepository.findByNecessidade.mockResolvedValue(assistidos);

      const result = await assistidoService.getAssistidosByNecessidade(NecessidadeAssistido.Alimentacao);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByNecessidade).toHaveBeenCalledWith(NecessidadeAssistido.Alimentacao);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findByNecessidade.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getAssistidosByNecessidade(NecessidadeAssistido.Alimentacao))
        .rejects.toThrow('Erro ao buscar assistidos por necessidade');
    });
  });

  describe('getAssistidosByResponsible', () => {
    it('should return assistidos by responsible person', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1', responsavelAtendimento: 'admin-1' }),
        createTestAssistido({ id: 'assistido-2', responsavelAtendimento: 'admin-1' })
      ];
      mockRepository.findByResponsible.mockResolvedValue(assistidos);

      const result = await assistidoService.getAssistidosByResponsible('admin-1');

      expect(result).toHaveLength(2);
      expect(mockRepository.findByResponsible).toHaveBeenCalledWith('admin-1');
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findByResponsible.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getAssistidosByResponsible('admin-1'))
        .rejects.toThrow('Erro ao buscar assistidos por responsável');
    });
  });

  describe('getAssistidosNeedingAttention', () => {
    it('should return assistidos needing attention', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1' }),
        createTestAssistido({ id: 'assistido-2' })
      ];
      mockRepository.findNeedingAttention.mockResolvedValue(assistidos);

      const result = await assistidoService.getAssistidosNeedingAttention();

      expect(result).toHaveLength(2);
      expect(mockRepository.findNeedingAttention).toHaveBeenCalledTimes(1);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.findNeedingAttention.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getAssistidosNeedingAttention())
        .rejects.toThrow('Erro ao buscar assistidos que precisam de atenção');
    });
  });

  // ===========================================
  // STATUS MANAGEMENT
  // ===========================================
  describe('updateAssistidoStatus', () => {
    it('should update status successfully', async () => {
      mockRepository.updateStatus.mockResolvedValue(undefined);

      await assistidoService.updateAssistidoStatus('assistido-1', StatusAssistido.Inativo);

      expect(mockRepository.updateStatus).toHaveBeenCalledWith('assistido-1', StatusAssistido.Inativo);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.updateStatus.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.updateAssistidoStatus('assistido-1', StatusAssistido.Inativo))
        .rejects.toThrow('Erro ao atualizar status do assistido');
    });
  });

  describe('deactivateAssistido', () => {
    it('should deactivate assistido by setting status to Inativo', async () => {
      mockRepository.updateStatus.mockResolvedValue(undefined);

      await assistidoService.deactivateAssistido('assistido-1');

      expect(mockRepository.updateStatus).toHaveBeenCalledWith('assistido-1', StatusAssistido.Inativo);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.updateStatus.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.deactivateAssistido('assistido-1'))
        .rejects.toThrow('Erro ao desativar assistido');
    });
  });

  // ===========================================
  // DELETE OPERATIONS
  // ===========================================
  describe('deleteAssistido', () => {
    it('should delete assistido successfully', async () => {
      const assistido = createTestAssistido({ id: 'assistido-1', nome: 'João Silva' });
      mockRepository.findById.mockResolvedValue(assistido);
      mockRepository.deletePhysically.mockResolvedValue(undefined);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await assistidoService.deleteAssistido('assistido-1');

      expect(mockRepository.findById).toHaveBeenCalledWith('assistido-1');
      expect(mockRepository.deletePhysically).toHaveBeenCalledWith('assistido-1');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('João Silva'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('assistido-1'));

      consoleLogSpy.mockRestore();
    });

    it('should throw error when assistido not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(assistidoService.deleteAssistido('non-existent'))
        .rejects.toThrow('Assistido não encontrado');
    });

    it('should propagate errors from repository', async () => {
      const assistido = createTestAssistido();
      mockRepository.findById.mockResolvedValue(assistido);
      mockRepository.deletePhysically.mockRejectedValue(new Error('Delete failed'));

      await expect(assistidoService.deleteAssistido('assistido-1'))
        .rejects.toThrow('Delete failed');
    });
  });

  // ===========================================
  // ATENDIMENTO MANAGEMENT
  // ===========================================
  describe('addAtendimento', () => {
    it('should add atendimento successfully', async () => {
      const atendimento: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.CestaBasica,
        descricao: 'Entrega de cesta básica',
        responsavel: 'admin-1',
        observacoes: 'Família em situação de vulnerabilidade'
      };

      mockRepository.addAtendimento.mockResolvedValue(undefined);

      await assistidoService.addAtendimento('assistido-1', atendimento);

      expect(mockRepository.addAtendimento).toHaveBeenCalledWith('assistido-1', atendimento);
    });

    it('should throw error when tipo is missing', async () => {
      const invalidAtendimento: any = {
        data: new Date('2024-01-15'),
        descricao: 'Entrega de cesta básica',
        responsavel: 'admin-1'
      };

      await expect(assistidoService.addAtendimento('assistido-1', invalidAtendimento))
        .rejects.toThrow('Tipo, descrição e responsável são obrigatórios para o atendimento');
    });

    it('should throw error when descricao is missing', async () => {
      const invalidAtendimento: any = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.CestaBasica,
        responsavel: 'admin-1'
      };

      await expect(assistidoService.addAtendimento('assistido-1', invalidAtendimento))
        .rejects.toThrow('Tipo, descrição e responsável são obrigatórios para o atendimento');
    });

    it('should throw error when responsavel is missing', async () => {
      const invalidAtendimento: any = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.CestaBasica,
        descricao: 'Entrega de cesta básica'
      };

      await expect(assistidoService.addAtendimento('assistido-1', invalidAtendimento))
        .rejects.toThrow('Tipo, descrição e responsável são obrigatórios para o atendimento');
    });

    it('should validate itensDoados when provided', async () => {
      const atendimentoComItens: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.Donativos,
        descricao: 'Doação de alimentos',
        responsavel: 'admin-1',
        itensDoados: [
          { item: 'Arroz', quantidade: 5, unidade: 'kg', valor: 25 },
          { item: 'Feijão', quantidade: 2, unidade: 'kg', valor: 12 }
        ]
      };

      mockRepository.addAtendimento.mockResolvedValue(undefined);

      await assistidoService.addAtendimento('assistido-1', atendimentoComItens);

      expect(mockRepository.addAtendimento).toHaveBeenCalledWith('assistido-1', atendimentoComItens);
    });

    it('should throw error when itensDoados has invalid items', async () => {
      const atendimentoComItensInvalidos: any = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.Donativos,
        descricao: 'Doação de alimentos',
        responsavel: 'admin-1',
        itensDoados: [
          { item: '', quantidade: 5, unidade: 'kg' } // Missing item name
        ]
      };

      await expect(assistidoService.addAtendimento('assistido-1', atendimentoComItensInvalidos))
        .rejects.toThrow('Item, quantidade e unidade são obrigatórios para itens doados');
    });

    it('should send notification for AuxilioFinanceiro', async () => {
      const atendimento: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.AuxilioFinanceiro,
        descricao: 'Auxílio financeiro emergencial',
        responsavel: 'admin-1',
        valorDoacao: 500
      };

      const assistido = createTestAssistido({ nome: 'João Silva' });
      mockRepository.addAtendimento.mockResolvedValue(undefined);
      mockRepository.findById.mockResolvedValue(assistido);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      await assistidoService.addAtendimento('assistido-1', atendimento);

      expect(mockNotificationService.createCustomNotification).toHaveBeenCalledWith(
        'Novo Atendimento Importante',
        expect.stringContaining('João Silva'),
        'roles',
        {
          roles: ['admin', 'assistencia_social']
        }
      );
    });

    it('should send notification for EncaminhamentoMedico', async () => {
      const atendimento: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.EncaminhamentoMedico,
        descricao: 'Encaminhamento para consulta médica',
        responsavel: 'admin-1'
      };

      const assistido = createTestAssistido({ nome: 'Maria Santos' });
      mockRepository.addAtendimento.mockResolvedValue(undefined);
      mockRepository.findById.mockResolvedValue(assistido);
      mockNotificationService.createCustomNotification.mockResolvedValue(undefined);

      await assistidoService.addAtendimento('assistido-1', atendimento);

      expect(mockNotificationService.createCustomNotification).toHaveBeenCalledWith(
        'Novo Atendimento Importante',
        expect.stringContaining('Maria Santos'),
        'roles',
        {
          roles: ['admin', 'assistencia_social']
        }
      );
    });

    it('should not send notification for regular atendimentos', async () => {
      const atendimento: Omit<AtendimentoAssistido, 'id'> = {
        data: new Date('2024-01-15'),
        tipo: TipoAtendimento.CestaBasica,
        descricao: 'Entrega de cesta básica',
        responsavel: 'admin-1'
      };

      mockRepository.addAtendimento.mockResolvedValue(undefined);

      await assistidoService.addAtendimento('assistido-1', atendimento);

      expect(mockNotificationService.createCustomNotification).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // FAMILIAR MANAGEMENT
  // ===========================================
  describe('addFamiliar', () => {
    it('should add familiar successfully', async () => {
      const familiar: Omit<FamiliarAssistido, 'id'> = {
        nome: 'Maria Silva',
        parentesco: TipoParentesco.Esposa,
        dataNascimento: new Date('1985-03-10'),
        cpf: '987.654.321-00',
        telefone: '(11) 98888-8888'
      };

      mockRepository.addFamiliar.mockResolvedValue(undefined);

      await assistidoService.addFamiliar('assistido-1', familiar);

      expect(mockRepository.addFamiliar).toHaveBeenCalledWith('assistido-1', familiar);
    });

    it('should throw error when nome is missing', async () => {
      const invalidFamiliar: any = {
        parentesco: TipoParentesco.Esposa
      };

      await expect(assistidoService.addFamiliar('assistido-1', invalidFamiliar))
        .rejects.toThrow('Nome e parentesco são obrigatórios para o familiar');
    });

    it('should throw error when parentesco is missing', async () => {
      const invalidFamiliar: any = {
        nome: 'Maria Silva'
      };

      await expect(assistidoService.addFamiliar('assistido-1', invalidFamiliar))
        .rejects.toThrow('Nome e parentesco são obrigatórios para o familiar');
    });

    it('should validate telefone when provided', async () => {
      jest.spyOn(AssistidoEntity, 'validarTelefone').mockReturnValue(false);

      const familiarComTelefoneInvalido: Omit<FamiliarAssistido, 'id'> = {
        nome: 'Maria Silva',
        parentesco: TipoParentesco.Esposa,
        telefone: '123'
      };

      await expect(assistidoService.addFamiliar('assistido-1', familiarComTelefoneInvalido))
        .rejects.toThrow('Telefone do familiar é inválido');
    });

    it('should validate CPF when provided', async () => {
      jest.spyOn(AssistidoEntity, 'validarCPF').mockReturnValue(false);

      const familiarComCPFInvalido: Omit<FamiliarAssistido, 'id'> = {
        nome: 'Maria Silva',
        parentesco: TipoParentesco.Esposa,
        cpf: '111.111.111-11'
      };

      await expect(assistidoService.addFamiliar('assistido-1', familiarComCPFInvalido))
        .rejects.toThrow('CPF do familiar é inválido');
    });

    it('should format telefone and CPF before saving', async () => {
      jest.spyOn(AssistidoEntity, 'formatarTelefone').mockReturnValue('(11) 98888-8888');
      jest.spyOn(AssistidoEntity, 'formatarCPF').mockReturnValue('987.654.321-00');

      const familiar: Omit<FamiliarAssistido, 'id'> = {
        nome: 'Maria Silva',
        parentesco: TipoParentesco.Esposa,
        telefone: '11988888888',
        cpf: '98765432100'
      };

      mockRepository.addFamiliar.mockResolvedValue(undefined);

      await assistidoService.addFamiliar('assistido-1', familiar);

      expect(AssistidoEntity.formatarTelefone).toHaveBeenCalledWith('11988888888');
      expect(AssistidoEntity.formatarCPF).toHaveBeenCalledWith('98765432100');
    });
  });

  // ===========================================
  // STATISTICS
  // ===========================================
  describe('getStatistics', () => {
    it('should calculate complete statistics', async () => {
      const baseStats = {
        totalAtivos: 80,
        totalInativos: 20,
        necessidadeMaisComum: NecessidadeAssistido.Alimentacao,
        atendimentosUltimos30Dias: 50,
        familiasTotais: 150
      };

      const assistidos = [
        createTestAssistido({
          status: StatusAssistido.Ativo,
          dataNascimento: new Date('1990-01-01'),
          rendaFamiliar: 1000,
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Saude]
        }),
        createTestAssistido({
          status: StatusAssistido.Ativo,
          dataNascimento: new Date('1985-01-01'),
          rendaFamiliar: 2000,
          necessidades: [NecessidadeAssistido.Alimentacao]
        }),
        createTestAssistido({
          status: StatusAssistido.Ativo,
          dataNascimento: new Date('1980-01-01'),
          rendaFamiliar: 1500,
          necessidades: [NecessidadeAssistido.Educacao]
        })
      ];

      mockRepository.getStatistics.mockResolvedValue(baseStats);
      mockRepository.findAll.mockResolvedValue(assistidos);

      jest.spyOn(AssistidoEntity, 'calcularIdade').mockReturnValue(34);

      const result = await assistidoService.getStatistics();

      expect(result.totalAtivos).toBe(80);
      expect(result.totalInativos).toBe(20);
      expect(result.necessidadeMaisComum).toBe(NecessidadeAssistido.Alimentacao);
      expect(result.atendimentosUltimos30Dias).toBe(50);
      expect(result.familiasTotais).toBe(150);
      expect(result.rendaMediaFamiliar).toBeDefined();
      expect(result.idadeMedia).toBe(34);
      expect(result.distribuicaoNecessidades).toBeDefined();
    });

    it('should handle zero statistics', async () => {
      mockRepository.getStatistics.mockResolvedValue({
        totalAtivos: 0,
        totalInativos: 0,
        necessidadeMaisComum: null,
        atendimentosUltimos30Dias: 0,
        familiasTotais: 0
      });
      mockRepository.findAll.mockResolvedValue([]);

      const result = await assistidoService.getStatistics();

      expect(result.totalAtivos).toBe(0);
      expect(result.totalInativos).toBe(0);
    });

    it('should calculate distribuicaoNecessidades correctly', async () => {
      const baseStats = {
        totalAtivos: 10,
        totalInativos: 5,
        necessidadeMaisComum: NecessidadeAssistido.Alimentacao,
        atendimentosUltimos30Dias: 20,
        familiasTotais: 30
      };

      const assistidos = [
        createTestAssistido({
          status: StatusAssistido.Ativo,
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Saude]
        }),
        createTestAssistido({
          status: StatusAssistido.Ativo,
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Educacao]
        }),
        createTestAssistido({
          status: StatusAssistido.Inativo,
          necessidades: [NecessidadeAssistido.Saude]
        })
      ];

      mockRepository.getStatistics.mockResolvedValue(baseStats);
      mockRepository.findAll.mockResolvedValue(assistidos);
      jest.spyOn(AssistidoEntity, 'calcularIdade').mockReturnValue(30);

      const result = await assistidoService.getStatistics();

      expect(result.distribuicaoNecessidades[NecessidadeAssistido.Alimentacao]).toBe(2);
      expect(result.distribuicaoNecessidades[NecessidadeAssistido.Saude]).toBe(1);
      expect(result.distribuicaoNecessidades[NecessidadeAssistido.Educacao]).toBe(1);
    });

    it('should throw error with user-friendly message when repository fails', async () => {
      mockRepository.getStatistics.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.getStatistics())
        .rejects.toThrow('Erro ao obter estatísticas');
    });
  });

  // ===========================================
  // REPORT GENERATION
  // ===========================================
  describe('generateReport', () => {
    it('should generate report for all assistidos when no filters provided', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1' }),
        createTestAssistido({ id: 'assistido-2' })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.assistidos).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const assistidos = [
        createTestAssistido({ id: 'assistido-1', status: StatusAssistido.Ativo })
      ];
      mockRepository.findByStatus.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport({ status: StatusAssistido.Ativo });

      expect(result.assistidos).toHaveLength(1);
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(StatusAssistido.Ativo);
    });

    it('should filter by necessidade', async () => {
      const assistidos = [
        createTestAssistido({ necessidades: [NecessidadeAssistido.Alimentacao] })
      ];
      mockRepository.findByNecessidade.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport({ necessidade: NecessidadeAssistido.Alimentacao });

      expect(result.assistidos).toHaveLength(1);
      expect(mockRepository.findByNecessidade).toHaveBeenCalledWith(NecessidadeAssistido.Alimentacao);
    });

    it('should filter by responsible', async () => {
      const assistidos = [
        createTestAssistido({ responsavelAtendimento: 'admin-1' })
      ];
      mockRepository.findByResponsible.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport({ responsible: 'admin-1' });

      expect(result.assistidos).toHaveLength(1);
      expect(mockRepository.findByResponsible).toHaveBeenCalledWith('admin-1');
    });

    it('should filter by date range', async () => {
      const assistidos = [
        createTestAssistido({
          id: 'assistido-1',
          dataInicioAtendimento: new Date('2024-01-15')
        }),
        createTestAssistido({
          id: 'assistido-2',
          dataInicioAtendimento: new Date('2024-02-15')
        }),
        createTestAssistido({
          id: 'assistido-3',
          dataInicioAtendimento: new Date('2024-03-15')
        })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-28')
      });

      expect(result.assistidos).toHaveLength(2);
    });

    it('should calculate total atendimentos', async () => {
      const assistidos = [
        createTestAssistido({
          atendimentos: [
            createTestAtendimento({ id: 'atend-1' }),
            createTestAtendimento({ id: 'atend-2' })
          ]
        }),
        createTestAssistido({
          atendimentos: [
            createTestAtendimento({ id: 'atend-3' })
          ]
        })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.totalAtendimentos).toBe(3);
    });

    it('should calculate valor total de doacoes', async () => {
      const assistidos = [
        createTestAssistido({
          atendimentos: [
            createTestAtendimento({ valorDoacao: 100 }),
            createTestAtendimento({ valorDoacao: 200 })
          ]
        }),
        createTestAssistido({
          atendimentos: [
            createTestAtendimento({ valorDoacao: 150 }),
            createTestAtendimento({}) // No valorDoacao
          ]
        })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.valorTotalDoacoes).toBe(450);
    });

    it('should calculate necessidades mais comuns', async () => {
      const assistidos = [
        createTestAssistido({
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Saude]
        }),
        createTestAssistido({
          necessidades: [NecessidadeAssistido.Alimentacao, NecessidadeAssistido.Educacao]
        }),
        createTestAssistido({
          necessidades: [NecessidadeAssistido.Saude]
        })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.necessidadesMaisComuns).toHaveLength(3);
      expect(result.necessidadesMaisComuns[0].necessidade).toBe(NecessidadeAssistido.Alimentacao);
      expect(result.necessidadesMaisComuns[0].count).toBe(2);
    });

    it('should return top 5 necessidades mais comuns', async () => {
      const assistidos = [
        createTestAssistido({
          necessidades: [
            NecessidadeAssistido.Alimentacao,
            NecessidadeAssistido.Saude,
            NecessidadeAssistido.Educacao,
            NecessidadeAssistido.Emprego,
            NecessidadeAssistido.Moradia,
            NecessidadeAssistido.Transporte
          ]
        })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.necessidadesMaisComuns).toHaveLength(5);
    });

    it('should throw error with user-friendly message when generation fails', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(assistidoService.generateReport())
        .rejects.toThrow('Erro ao gerar relatório');
    });
  });

  // ===========================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations', async () => {
      const assistido1 = createTestAssistido({ id: 'assistido-1' });
      const assistido2 = createTestAssistido({ id: 'assistido-2' });

      mockRepository.findById
        .mockResolvedValueOnce(assistido1)
        .mockResolvedValueOnce(assistido2);

      const [result1, result2] = await Promise.all([
        assistidoService.getAssistidoById('assistido-1'),
        assistidoService.getAssistidoById('assistido-2')
      ]);

      expect(result1?.id).toBe('assistido-1');
      expect(result2?.id).toBe('assistido-2');
      expect(mockRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle assistido without CPF', async () => {
      const assistidoSemCPF = {
        nome: 'José Santos',
        telefone: '(11) 99999-9999',
        dataNascimento: new Date('1990-01-01'),
        endereco: createTestEndereco(),
        situacaoFamiliar: SituacaoFamiliar.Solteiro,
        escolaridade: Escolaridade.FundamentalCompleto,
        necessidades: [NecessidadeAssistido.Emprego],
        tipoMoradia: TipoMoradia.Alugada,
        quantidadeComodos: 2,
        possuiCadUnico: false,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        responsavelAtendimento: 'admin-1',
        familiares: [],
        atendimentos: [],
        createdBy: 'admin-1'
      };

      const created = createTestAssistido({ cpf: undefined });
      mockRepository.create.mockResolvedValue(created);

      const result = await assistidoService.createAssistido(assistidoSemCPF);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should handle empty necessidades array', async () => {
      const assistidos = [
        createTestAssistido({ necessidades: [] })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.necessidadesMaisComuns).toHaveLength(0);
    });

    it('should handle assistidos without atendimentos', async () => {
      const assistidos = [
        createTestAssistido({ atendimentos: [] })
      ];
      mockRepository.findAll.mockResolvedValue(assistidos);

      const result = await assistidoService.generateReport();

      expect(result.totalAtendimentos).toBe(0);
      expect(result.valorTotalDoacoes).toBe(0);
    });
  });
});
