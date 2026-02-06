// Unit Tests - FichaAcompanhamentoService
// Comprehensive tests for patient records (fichas) and sessions management service

import { FichaAcompanhamentoService } from '../FichaAcompanhamentoService';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';
import { FichaAcompanhamento, SessaoAcompanhamento } from '../../../domain/entities/FichaAcompanhamento';

// Mock Firebase to prevent auth/invalid-api-key error in CI
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock the repository
jest.mock('@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository');

describe('FichaAcompanhamentoService', () => {
  let service: FichaAcompanhamentoService;
  let mockRepository: jest.Mocked<FirebaseFichaAcompanhamentoRepository>;

  // Sample test data
  const mockFichaData = {
    pacienteId: 'patient123',
    pacienteNome: 'João Silva',
    profissionalId: 'prof123',
    profissionalNome: 'Dr. Maria Santos',
    tipoAssistencia: 'psicologica' as const,
    dataInicio: new Date('2024-01-01'),
    objetivo: 'Tratamento de ansiedade',
    diagnosticoInicial: 'TAG - Transtorno de Ansiedade Generalizada',
    observacoes: 'Paciente relatou sintomas há 6 meses',
    informacoesMedicas: 'Histórico de hipertensão',
    medicamentos: 'Losartana 50mg',
    alergias: 'Nenhuma conhecida',
    contatoEmergencia: {
      nome: 'Maria Silva',
      telefone: '11987654321',
      parentesco: 'Esposa'
    },
    createdBy: 'user123'
  };

  const mockFicha: FichaAcompanhamento = {
    id: 'ficha123',
    ...mockFichaData,
    status: 'ativo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockSessaoData = {
    numeroSessao: 1,
    data: new Date('2024-01-15'),
    duracao: 60,
    tipoSessao: 'individual' as const,
    resumo: 'Primeira sessão de avaliação',
    observacoes: 'Paciente se mostrou colaborativo',
    evolucao: 'Boa resposta inicial',
    proximasSessoes: 'Continuar abordagem cognitivo-comportamental',
    createdBy: 'prof123'
  };

  const mockSessao: SessaoAcompanhamento = {
    id: 'sessao123',
    fichaId: 'ficha123',
    ...mockSessaoData,
    anexos: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create service instance
    service = new FichaAcompanhamentoService();

    // Get mocked repository instance
    mockRepository = (service as any).repository as jest.Mocked<FirebaseFichaAcompanhamentoRepository>;
  });

  describe('Ficha CRUD Operations', () => {
    describe('createFicha', () => {
      it('should create a ficha successfully', async () => {
        // Arrange
        mockRepository.createFicha.mockResolvedValue(mockFicha);

        // Act
        const result = await service.createFicha(mockFichaData);

        // Assert
        expect(result).toEqual(mockFicha);
        expect(mockRepository.createFicha).toHaveBeenCalledTimes(1);
        expect(mockRepository.createFicha).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockFichaData,
            status: 'ativo',
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should create ficha with optional fields', async () => {
        // Arrange
        const minimalData = {
          pacienteId: 'patient123',
          pacienteNome: 'João Silva',
          profissionalId: 'prof123',
          profissionalNome: 'Dr. Maria Santos',
          tipoAssistencia: 'psicologica' as const,
          dataInicio: new Date('2024-01-01'),
          objetivo: 'Tratamento de ansiedade',
          createdBy: 'user123'
        };

        const expectedFicha = {
          ...minimalData,
          id: 'ficha456',
          status: 'ativo',
          createdAt: new Date(),
          updatedAt: new Date()
        } as FichaAcompanhamento;

        mockRepository.createFicha.mockResolvedValue(expectedFicha);

        // Act
        const result = await service.createFicha(minimalData);

        // Assert
        expect(result).toEqual(expectedFicha);
        expect(mockRepository.createFicha).toHaveBeenCalledWith(
          expect.objectContaining({
            ...minimalData,
            status: 'ativo'
          })
        );
      });

      it('should create ficha with specialized data (fisioterapia)', async () => {
        // Arrange
        const dataWithSpecialized = {
          ...mockFichaData,
          dadosEspecializados: {
            fisioterapia: {
              habitosVida: 'Sedentário',
              hma: 'Dor lombar há 3 meses',
              hmp: 'Nenhum',
              antecedentesPessoais: 'Saudável',
              antecedentesFamiliares: 'Pai com problemas de coluna',
              tratamentosRealizados: 'Medicação para dor',
              apresentacaoPaciente: ['Deambulando', 'Orientado'],
              examesComplementares: 'Raio-X lombar sem alterações significativas',
              medicamentos: 'Ibuprofeno 600mg',
              escalaDor: 7,
              objetivosTratamento: 'Reduzir dor e melhorar mobilidade',
              recursosTerapeuticos: 'TENS, exercícios de fortalecimento',
              planoTratamento: '3 sessões semanais por 4 semanas'
            }
          }
        };

        const expectedFicha = {
          ...dataWithSpecialized,
          id: 'ficha789',
          status: 'ativo',
          createdAt: new Date(),
          updatedAt: new Date()
        } as FichaAcompanhamento;

        mockRepository.createFicha.mockResolvedValue(expectedFicha);

        // Act
        const result = await service.createFicha(dataWithSpecialized);

        // Assert
        expect(result).toEqual(expectedFicha);
        expect(result.dadosEspecializados?.fisioterapia).toBeDefined();
        expect(result.dadosEspecializados?.fisioterapia?.escalaDor).toBe(7);
      });

      it('should throw error when repository fails', async () => {
        // Arrange
        mockRepository.createFicha.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.createFicha(mockFichaData)).rejects.toThrow(
          'Failed to create patient record: Database error'
        );
        expect(mockRepository.createFicha).toHaveBeenCalledTimes(1);
      });

      it('should handle unknown errors gracefully', async () => {
        // Arrange
        mockRepository.createFicha.mockRejectedValue('Unknown error');

        // Act & Assert
        await expect(service.createFicha(mockFichaData)).rejects.toThrow(
          'Failed to create patient record'
        );
      });
    });

    describe('updateFicha', () => {
      it('should update ficha successfully', async () => {
        // Arrange
        const updates: Partial<FichaAcompanhamento> = {
          observacoes: 'Atualização: Paciente melhorou significativamente',
          diagnosticoInicial: 'TAG - Transtorno de Ansiedade Generalizada (em remissão)'
        };

        const updatedFicha: FichaAcompanhamento = {
          ...mockFicha,
          ...updates,
          updatedAt: new Date()
        };

        mockRepository.updateFicha.mockResolvedValue(updatedFicha);

        // Act
        const result = await service.updateFicha('ficha123', updates);

        // Assert
        expect(result).toEqual(updatedFicha);
        expect(mockRepository.updateFicha).toHaveBeenCalledWith('ficha123', updates);
        expect(mockRepository.updateFicha).toHaveBeenCalledTimes(1);
      });

      it('should update ficha status', async () => {
        // Arrange
        const updates: Partial<FichaAcompanhamento> = {
          status: 'pausado'
        };

        const updatedFicha: FichaAcompanhamento = {
          ...mockFicha,
          status: 'pausado',
          updatedAt: new Date()
        };

        mockRepository.updateFicha.mockResolvedValue(updatedFicha);

        // Act
        const result = await service.updateFicha('ficha123', updates);

        // Assert
        expect(result.status).toBe('pausado');
        expect(mockRepository.updateFicha).toHaveBeenCalledWith('ficha123', updates);
      });

      it('should update professional assignment', async () => {
        // Arrange
        const updates: Partial<FichaAcompanhamento> = {
          profissionalId: 'prof456',
          profissionalNome: 'Dr. Carlos Oliveira'
        };

        const updatedFicha: FichaAcompanhamento = {
          ...mockFicha,
          ...updates,
          updatedAt: new Date()
        };

        mockRepository.updateFicha.mockResolvedValue(updatedFicha);

        // Act
        const result = await service.updateFicha('ficha123', updates);

        // Assert
        expect(result.profissionalId).toBe('prof456');
        expect(result.profissionalNome).toBe('Dr. Carlos Oliveira');
      });

      it('should throw error when update fails', async () => {
        // Arrange
        mockRepository.updateFicha.mockRejectedValue(new Error('Update failed'));

        // Act & Assert
        await expect(service.updateFicha('ficha123', {})).rejects.toThrow(
          'Failed to update patient record: Update failed'
        );
      });
    });

    describe('deleteFicha', () => {
      it('should delete ficha successfully', async () => {
        // Arrange
        mockRepository.deleteFicha.mockResolvedValue(undefined);

        // Act
        await service.deleteFicha('ficha123');

        // Assert
        expect(mockRepository.deleteFicha).toHaveBeenCalledWith('ficha123');
        expect(mockRepository.deleteFicha).toHaveBeenCalledTimes(1);
      });

      it('should throw error when delete fails', async () => {
        // Arrange
        mockRepository.deleteFicha.mockRejectedValue(new Error('Delete failed'));

        // Act & Assert
        await expect(service.deleteFicha('ficha123')).rejects.toThrow(
          'Failed to delete patient record: Delete failed'
        );
      });
    });

    describe('getFichaById', () => {
      it('should retrieve ficha by id successfully', async () => {
        // Arrange
        mockRepository.getFichaById.mockResolvedValue(mockFicha);

        // Act
        const result = await service.getFichaById('ficha123');

        // Assert
        expect(result).toEqual(mockFicha);
        expect(mockRepository.getFichaById).toHaveBeenCalledWith('ficha123');
        expect(mockRepository.getFichaById).toHaveBeenCalledTimes(1);
      });

      it('should return null when ficha not found', async () => {
        // Arrange
        mockRepository.getFichaById.mockResolvedValue(null);

        // Act
        const result = await service.getFichaById('nonexistent');

        // Assert
        expect(result).toBeNull();
        expect(mockRepository.getFichaById).toHaveBeenCalledWith('nonexistent');
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getFichaById.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getFichaById('ficha123')).rejects.toThrow(
          'Failed to get patient record: Database error'
        );
      });
    });
  });

  describe('Ficha Listing and Filtering', () => {
    describe('getAllFichas', () => {
      it('should retrieve all fichas successfully', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          mockFicha,
          { ...mockFicha, id: 'ficha456', pacienteNome: 'Pedro Santos' }
        ];
        mockRepository.getAllFichas.mockResolvedValue(fichas);

        // Act
        const result = await service.getAllFichas();

        // Assert
        expect(result).toEqual(fichas);
        expect(result).toHaveLength(2);
        expect(mockRepository.getAllFichas).toHaveBeenCalledTimes(1);
      });

      it('should return empty array when no fichas exist', async () => {
        // Arrange
        mockRepository.getAllFichas.mockResolvedValue([]);

        // Act
        const result = await service.getAllFichas();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getAllFichas.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getAllFichas()).rejects.toThrow(
          'Failed to get patient records: Database error'
        );
      });
    });

    describe('getFichasByProfissional', () => {
      it('should retrieve fichas by professional successfully', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          mockFicha,
          { ...mockFicha, id: 'ficha456', pacienteNome: 'Ana Costa' }
        ];
        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);

        // Act
        const result = await service.getFichasByProfissional('prof123');

        // Assert
        expect(result).toEqual(fichas);
        expect(result).toHaveLength(2);
        expect(mockRepository.getFichasByProfissional).toHaveBeenCalledWith('prof123');
      });

      it('should return empty array when professional has no fichas', async () => {
        // Arrange
        mockRepository.getFichasByProfissional.mockResolvedValue([]);

        // Act
        const result = await service.getFichasByProfissional('prof999');

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getFichasByProfissional.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getFichasByProfissional('prof123')).rejects.toThrow(
          'Failed to get patient records: Database error'
        );
      });
    });

    describe('getFichasByPaciente', () => {
      it('should retrieve fichas by patient successfully', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          mockFicha,
          {
            ...mockFicha,
            id: 'ficha789',
            tipoAssistencia: 'social',
            profissionalNome: 'Dra. Ana Silva'
          }
        ];
        mockRepository.getFichasByPaciente.mockResolvedValue(fichas);

        // Act
        const result = await service.getFichasByPaciente('patient123');

        // Assert
        expect(result).toEqual(fichas);
        expect(result).toHaveLength(2);
        expect(mockRepository.getFichasByPaciente).toHaveBeenCalledWith('patient123');
      });

      it('should return empty array when patient has no fichas', async () => {
        // Arrange
        mockRepository.getFichasByPaciente.mockResolvedValue([]);

        // Act
        const result = await service.getFichasByPaciente('patient999');

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getFichasByPaciente.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getFichasByPaciente('patient123')).rejects.toThrow(
          'Failed to get patient records: Database error'
        );
      });
    });
  });

  describe('Ficha Status Management', () => {
    describe('finalizarFicha', () => {
      it('should finalize ficha without final observations', async () => {
        // Arrange
        const finalizedFicha: FichaAcompanhamento = {
          ...mockFicha,
          status: 'concluido',
          updatedAt: new Date()
        };
        mockRepository.updateFicha.mockResolvedValue(finalizedFicha);

        // Act
        const result = await service.finalizarFicha('ficha123');

        // Assert
        expect(result.status).toBe('concluido');
        expect(mockRepository.updateFicha).toHaveBeenCalledWith('ficha123', {
          status: 'concluido'
        });
      });

      it('should finalize ficha with final observations', async () => {
        // Arrange
        const observacoesFinal = 'Tratamento concluído com sucesso. Paciente apresentou melhora significativa.';
        const finalizedFicha: FichaAcompanhamento = {
          ...mockFicha,
          status: 'concluido',
          observacoes: observacoesFinal,
          updatedAt: new Date()
        };
        mockRepository.updateFicha.mockResolvedValue(finalizedFicha);

        // Act
        const result = await service.finalizarFicha('ficha123', observacoesFinal);

        // Assert
        expect(result.status).toBe('concluido');
        expect(result.observacoes).toBe(observacoesFinal);
        expect(mockRepository.updateFicha).toHaveBeenCalledWith('ficha123', {
          status: 'concluido',
          observacoes: observacoesFinal
        });
      });

      it('should throw error when finalization fails', async () => {
        // Arrange
        mockRepository.updateFicha.mockRejectedValue(new Error('Update failed'));

        // Act & Assert
        await expect(service.finalizarFicha('ficha123')).rejects.toThrow(
          'Failed to finalize patient record: Update failed'
        );
      });
    });
  });

  describe('Session (Sessão) Management', () => {
    describe('createSessao', () => {
      it('should create sessao successfully', async () => {
        // Arrange
        mockRepository.createSessao.mockResolvedValue(mockSessao);

        // Act
        const result = await service.createSessao('ficha123', mockSessaoData);

        // Assert
        expect(result).toEqual(mockSessao);
        expect(mockRepository.createSessao).toHaveBeenCalledTimes(1);
        expect(mockRepository.createSessao).toHaveBeenCalledWith(
          'ficha123',
          expect.objectContaining({
            ...mockSessaoData,
            fichaId: 'ficha123',
            anexos: [],
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should create sessao with minimal required fields', async () => {
        // Arrange
        const minimalSessaoData = {
          numeroSessao: 2,
          data: new Date('2024-01-22'),
          duracao: 45,
          tipoSessao: 'individual' as const,
          resumo: 'Segunda sessão',
          createdBy: 'prof123'
        };

        const expectedSessao: SessaoAcompanhamento = {
          id: 'sessao456',
          fichaId: 'ficha123',
          ...minimalSessaoData,
          anexos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepository.createSessao.mockResolvedValue(expectedSessao);

        // Act
        const result = await service.createSessao('ficha123', minimalSessaoData);

        // Assert
        expect(result).toEqual(expectedSessao);
        expect(result.observacoes).toBeUndefined();
        expect(result.evolucao).toBeUndefined();
      });

      it('should create group session', async () => {
        // Arrange
        const groupSessaoData = {
          ...mockSessaoData,
          tipoSessao: 'grupo' as const,
          resumo: 'Sessão em grupo de apoio'
        };

        const expectedSessao: SessaoAcompanhamento = {
          id: 'sessao789',
          fichaId: 'ficha123',
          ...groupSessaoData,
          anexos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepository.createSessao.mockResolvedValue(expectedSessao);

        // Act
        const result = await service.createSessao('ficha123', groupSessaoData);

        // Assert
        expect(result.tipoSessao).toBe('grupo');
      });

      it('should throw error when session creation fails', async () => {
        // Arrange
        mockRepository.createSessao.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.createSessao('ficha123', mockSessaoData)).rejects.toThrow(
          'Failed to create session: Database error'
        );
      });
    });

    describe('updateSessao', () => {
      it('should update sessao successfully', async () => {
        // Arrange
        const updates: Partial<SessaoAcompanhamento> = {
          resumo: 'Resumo atualizado',
          evolucao: 'Paciente mostrou progresso significativo'
        };

        const updatedSessao: SessaoAcompanhamento = {
          ...mockSessao,
          ...updates,
          updatedAt: new Date()
        };

        mockRepository.updateSessao.mockResolvedValue(updatedSessao);

        // Act
        const result = await service.updateSessao('ficha123', 'sessao123', updates);

        // Assert
        expect(result).toEqual(updatedSessao);
        expect(mockRepository.updateSessao).toHaveBeenCalledWith('ficha123', 'sessao123', updates);
      });

      it('should throw error when update fails', async () => {
        // Arrange
        mockRepository.updateSessao.mockRejectedValue(new Error('Update failed'));

        // Act & Assert
        await expect(service.updateSessao('ficha123', 'sessao123', {})).rejects.toThrow(
          'Failed to update session: Update failed'
        );
      });
    });

    describe('deleteSessao', () => {
      it('should delete sessao successfully', async () => {
        // Arrange
        mockRepository.deleteSessao.mockResolvedValue(undefined);

        // Act
        await service.deleteSessao('ficha123', 'sessao123');

        // Assert
        expect(mockRepository.deleteSessao).toHaveBeenCalledWith('ficha123', 'sessao123');
        expect(mockRepository.deleteSessao).toHaveBeenCalledTimes(1);
      });

      it('should throw error when delete fails', async () => {
        // Arrange
        mockRepository.deleteSessao.mockRejectedValue(new Error('Delete failed'));

        // Act & Assert
        await expect(service.deleteSessao('ficha123', 'sessao123')).rejects.toThrow(
          'Failed to delete session: Delete failed'
        );
      });
    });

    describe('getSessoesByFicha', () => {
      it('should retrieve all sessoes for a ficha', async () => {
        // Arrange
        const sessoes: SessaoAcompanhamento[] = [
          mockSessao,
          {
            ...mockSessao,
            id: 'sessao456',
            numeroSessao: 2,
            data: new Date('2024-01-22')
          },
          {
            ...mockSessao,
            id: 'sessao789',
            numeroSessao: 3,
            data: new Date('2024-01-29')
          }
        ];
        mockRepository.getSessoesByFicha.mockResolvedValue(sessoes);

        // Act
        const result = await service.getSessoesByFicha('ficha123');

        // Assert
        expect(result).toEqual(sessoes);
        expect(result).toHaveLength(3);
        expect(mockRepository.getSessoesByFicha).toHaveBeenCalledWith('ficha123');
      });

      it('should return empty array when no sessoes exist', async () => {
        // Arrange
        mockRepository.getSessoesByFicha.mockResolvedValue([]);

        // Act
        const result = await service.getSessoesByFicha('ficha999');

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getSessoesByFicha.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getSessoesByFicha('ficha123')).rejects.toThrow(
          'Failed to get sessions: Database error'
        );
      });
    });

    describe('getSessaoById', () => {
      it('should retrieve sessao by id successfully', async () => {
        // Arrange
        mockRepository.getSessaoById.mockResolvedValue(mockSessao);

        // Act
        const result = await service.getSessaoById('ficha123', 'sessao123');

        // Assert
        expect(result).toEqual(mockSessao);
        expect(mockRepository.getSessaoById).toHaveBeenCalledWith('ficha123', 'sessao123');
      });

      it('should return null when sessao not found', async () => {
        // Arrange
        mockRepository.getSessaoById.mockResolvedValue(null);

        // Act
        const result = await service.getSessaoById('ficha123', 'nonexistent');

        // Assert
        expect(result).toBeNull();
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getSessaoById.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getSessaoById('ficha123', 'sessao123')).rejects.toThrow(
          'Failed to get session: Database error'
        );
      });
    });

    describe('getProximoNumeroSessao', () => {
      it('should return 1 for first session', async () => {
        // Arrange
        mockRepository.getSessoesByFicha.mockResolvedValue([]);

        // Act
        const result = await service.getProximoNumeroSessao('ficha123');

        // Assert
        expect(result).toBe(1);
        expect(mockRepository.getSessoesByFicha).toHaveBeenCalledWith('ficha123');
      });

      it('should return next session number correctly', async () => {
        // Arrange
        const sessoes: SessaoAcompanhamento[] = [
          { ...mockSessao, numeroSessao: 1 },
          { ...mockSessao, id: 'sessao456', numeroSessao: 2 },
          { ...mockSessao, id: 'sessao789', numeroSessao: 3 }
        ];
        mockRepository.getSessoesByFicha.mockResolvedValue(sessoes);

        // Act
        const result = await service.getProximoNumeroSessao('ficha123');

        // Assert
        expect(result).toBe(4);
      });

      it('should handle non-sequential session numbers', async () => {
        // Arrange
        const sessoes: SessaoAcompanhamento[] = [
          { ...mockSessao, numeroSessao: 1 },
          { ...mockSessao, id: 'sessao456', numeroSessao: 3 },
          { ...mockSessao, id: 'sessao789', numeroSessao: 5 }
        ];
        mockRepository.getSessoesByFicha.mockResolvedValue(sessoes);

        // Act
        const result = await service.getProximoNumeroSessao('ficha123');

        // Assert
        expect(result).toBe(6); // Max is 5, so next should be 6
      });

      it('should throw error when retrieval fails', async () => {
        // Arrange
        mockRepository.getSessoesByFicha.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getProximoNumeroSessao('ficha123')).rejects.toThrow(
          'Failed to get next session number: Database error'
        );
      });
    });
  });

  describe('Statistics and Reports', () => {
    describe('getEstatisticasProfissional', () => {
      it('should calculate statistics correctly with multiple fichas', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          { ...mockFicha, id: 'ficha1', status: 'ativo' },
          { ...mockFicha, id: 'ficha2', status: 'ativo' },
          { ...mockFicha, id: 'ficha3', status: 'concluido' },
          { ...mockFicha, id: 'ficha4', status: 'concluido' }
        ];

        const sessoesFicha1: SessaoAcompanhamento[] = [
          { ...mockSessao, id: 'sessao1', numeroSessao: 1 },
          { ...mockSessao, id: 'sessao2', numeroSessao: 2 }
        ];

        const sessoesFicha2: SessaoAcompanhamento[] = [
          { ...mockSessao, id: 'sessao3', numeroSessao: 1 },
          { ...mockSessao, id: 'sessao4', numeroSessao: 2 },
          { ...mockSessao, id: 'sessao5', numeroSessao: 3 }
        ];

        const sessoesFicha3: SessaoAcompanhamento[] = [
          { ...mockSessao, id: 'sessao6', numeroSessao: 1 },
          { ...mockSessao, id: 'sessao7', numeroSessao: 2 },
          { ...mockSessao, id: 'sessao8', numeroSessao: 3 },
          { ...mockSessao, id: 'sessao9', numeroSessao: 4 }
        ];

        const sessoesFicha4: SessaoAcompanhamento[] = [
          { ...mockSessao, id: 'sessao10', numeroSessao: 1 }
        ];

        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);
        mockRepository.getSessoesByFicha
          .mockResolvedValueOnce(sessoesFicha1)
          .mockResolvedValueOnce(sessoesFicha2)
          .mockResolvedValueOnce(sessoesFicha3)
          .mockResolvedValueOnce(sessoesFicha4);

        // Act
        const result = await service.getEstatisticasProfissional('prof123');

        // Assert
        expect(result).toEqual({
          totalFichas: 4,
          fichasAtivas: 2,
          fichasConcluidas: 2,
          totalSessoes: 10, // 2 + 3 + 4 + 1
          mediaSessoesPorFicha: 2.5 // 10 / 4
        });
        expect(mockRepository.getFichasByProfissional).toHaveBeenCalledWith('prof123');
        expect(mockRepository.getSessoesByFicha).toHaveBeenCalledTimes(4);
      });

      it('should handle professional with no fichas', async () => {
        // Arrange
        mockRepository.getFichasByProfissional.mockResolvedValue([]);

        // Act
        const result = await service.getEstatisticasProfissional('prof999');

        // Assert
        expect(result).toEqual({
          totalFichas: 0,
          fichasAtivas: 0,
          fichasConcluidas: 0,
          totalSessoes: 0,
          mediaSessoesPorFicha: 0
        });
      });

      it('should handle fichas with no sessoes', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          { ...mockFicha, id: 'ficha1', status: 'ativo' },
          { ...mockFicha, id: 'ficha2', status: 'ativo' }
        ];

        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);
        mockRepository.getSessoesByFicha
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        // Act
        const result = await service.getEstatisticasProfissional('prof123');

        // Assert
        expect(result).toEqual({
          totalFichas: 2,
          fichasAtivas: 2,
          fichasConcluidas: 0,
          totalSessoes: 0,
          mediaSessoesPorFicha: 0
        });
      });

      it('should round media to 2 decimal places', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          { ...mockFicha, id: 'ficha1', status: 'ativo' },
          { ...mockFicha, id: 'ficha2', status: 'ativo' },
          { ...mockFicha, id: 'ficha3', status: 'ativo' }
        ];

        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);
        mockRepository.getSessoesByFicha
          .mockResolvedValueOnce([mockSessao, mockSessao, mockSessao, mockSessao, mockSessao])
          .mockResolvedValueOnce([mockSessao, mockSessao])
          .mockResolvedValueOnce([mockSessao, mockSessao, mockSessao]);

        // Act
        const result = await service.getEstatisticasProfissional('prof123');

        // Assert
        expect(result.mediaSessoesPorFicha).toBe(3.33); // 10 / 3 = 3.333...
        expect(result.totalSessoes).toBe(10);
      });

      it('should count different statuses correctly', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          { ...mockFicha, id: 'ficha1', status: 'ativo' },
          { ...mockFicha, id: 'ficha2', status: 'concluido' },
          { ...mockFicha, id: 'ficha3', status: 'pausado' },
          { ...mockFicha, id: 'ficha4', status: 'cancelado' },
          { ...mockFicha, id: 'ficha5', status: 'ativo' }
        ];

        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);
        mockRepository.getSessoesByFicha.mockResolvedValue([]);

        // Act
        const result = await service.getEstatisticasProfissional('prof123');

        // Assert
        expect(result.totalFichas).toBe(5);
        expect(result.fichasAtivas).toBe(2);
        expect(result.fichasConcluidas).toBe(1);
      });

      it('should throw error when statistics calculation fails', async () => {
        // Arrange
        mockRepository.getFichasByProfissional.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.getEstatisticasProfissional('prof123')).rejects.toThrow(
          'Failed to get statistics: Database error'
        );
      });

      it('should handle error when getting sessoes fails', async () => {
        // Arrange
        const fichas: FichaAcompanhamento[] = [
          { ...mockFicha, id: 'ficha1', status: 'ativo' }
        ];

        mockRepository.getFichasByProfissional.mockResolvedValue(fichas);
        mockRepository.getSessoesByFicha.mockRejectedValue(new Error('Sessoes error'));

        // Act & Assert
        await expect(service.getEstatisticasProfissional('prof123')).rejects.toThrow(
          'Failed to get statistics: Sessoes error'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully in all methods', async () => {
      // Test all methods throw appropriate errors - mapping service methods to repository methods
      const methodMappings = [
        { service: 'createFicha', repo: 'createFicha', args: [mockFichaData], error: 'Failed to create patient record' },
        { service: 'updateFicha', repo: 'updateFicha', args: ['id', {}], error: 'Failed to update patient record' },
        { service: 'deleteFicha', repo: 'deleteFicha', args: ['id'], error: 'Failed to delete patient record' },
        { service: 'getFichaById', repo: 'getFichaById', args: ['id'], error: 'Failed to get patient record' },
        { service: 'getFichasByProfissional', repo: 'getFichasByProfissional', args: ['id'], error: 'Failed to get patient records' },
        { service: 'getAllFichas', repo: 'getAllFichas', args: [], error: 'Failed to get patient records' },
        { service: 'getFichasByPaciente', repo: 'getFichasByPaciente', args: ['id'], error: 'Failed to get patient records' },
        { service: 'finalizarFicha', repo: 'updateFicha', args: ['id'], error: 'Failed to finalize patient record' }
      ];

      for (const mapping of methodMappings) {
        // Clear previous mocks
        jest.clearAllMocks();

        // Mock the repository method to throw an error
        (mockRepository[mapping.repo as keyof FirebaseFichaAcompanhamentoRepository] as jest.Mock)
          .mockRejectedValue(new Error('Test error'));

        // Test that the service method throws the appropriate error
        await expect((service as any)[mapping.service](...mapping.args)).rejects.toThrow(
          new RegExp(mapping.error)
        );
      }
    });

    it('should handle session-related errors gracefully', async () => {
      const sessionMethods = [
        { name: 'createSessao', args: ['fichaId', mockSessaoData], error: 'Failed to create session' },
        { name: 'updateSessao', args: ['fichaId', 'sessaoId', {}], error: 'Failed to update session' },
        { name: 'deleteSessao', args: ['fichaId', 'sessaoId'], error: 'Failed to delete session' },
        { name: 'getSessoesByFicha', args: ['fichaId'], error: 'Failed to get sessions' },
        { name: 'getSessaoById', args: ['fichaId', 'sessaoId'], error: 'Failed to get session' },
        { name: 'getProximoNumeroSessao', args: ['fichaId'], error: 'Failed to get next session number' }
      ];

      for (const method of sessionMethods) {
        const repoMethod = method.name === 'getProximoNumeroSessao' ? 'getSessoesByFicha' : method.name;
        (mockRepository[repoMethod as keyof FirebaseFichaAcompanhamentoRepository] as jest.Mock)
          .mockRejectedValue(new Error('Test error'));

        await expect((service as any)[method.name](...method.args)).rejects.toThrow(
          new RegExp(method.error)
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle ficha with all optional fields', async () => {
      // Arrange
      const fullFichaData = {
        ...mockFichaData,
        dadosEspecializados: {
          psicologia: {
            profissao: 'Engenheiro',
            religiao: 'Católica',
            estadoCivil: 'Casado',
            filhos: '2',
            sentimentos: ['Ansiedade', 'Medo'],
            queixaPrincipal: 'Ansiedade generalizada',
            classificacao: 'AMARELO'
          }
        }
      };

      const expectedFicha = {
        ...fullFichaData,
        id: 'ficha999',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      } as FichaAcompanhamento;

      mockRepository.createFicha.mockResolvedValue(expectedFicha);

      // Act
      const result = await service.createFicha(fullFichaData);

      // Assert
      expect(result.dadosEspecializados?.psicologia).toBeDefined();
      expect(result.dadosEspecializados?.psicologia?.sentimentos).toEqual(['Ansiedade', 'Medo']);
    });

    it('should handle sessao with all optional fields', async () => {
      // Arrange
      const fullSessaoData = {
        ...mockSessaoData,
        observacoes: 'Observações detalhadas',
        evolucao: 'Evolução positiva',
        proximasSessoes: 'Continuar tratamento'
      };

      const expectedSessao = {
        ...fullSessaoData,
        id: 'sessao999',
        fichaId: 'ficha123',
        anexos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.createSessao.mockResolvedValue(expectedSessao);

      // Act
      const result = await service.createSessao('ficha123', fullSessaoData);

      // Assert
      expect(result.observacoes).toBe('Observações detalhadas');
      expect(result.evolucao).toBe('Evolução positiva');
      expect(result.proximasSessoes).toBe('Continuar tratamento');
    });

    it('should handle empty strings in optional fields', async () => {
      // Arrange
      const dataWithEmptyStrings = {
        ...mockFichaData,
        observacoes: '',
        diagnosticoInicial: '',
        informacoesMedicas: ''
      };

      const expectedFicha = {
        ...dataWithEmptyStrings,
        id: 'ficha888',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      } as FichaAcompanhamento;

      mockRepository.createFicha.mockResolvedValue(expectedFicha);

      // Act
      const result = await service.createFicha(dataWithEmptyStrings);

      // Assert
      expect(result.observacoes).toBe('');
      expect(result.diagnosticoInicial).toBe('');
    });
  });
});
