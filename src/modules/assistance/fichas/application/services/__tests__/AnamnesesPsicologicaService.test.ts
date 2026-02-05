// Unit Tests - AnamnesesPsicologicaService
// Comprehensive tests for psychological assessment management

import { AnamnesesPsicologicaService } from '../AnamnesesPsicologicaService';
import { AnamnesesPsicologicaData } from '@/presentation/components/AnamnesesPsicologicaModal';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}));

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

describe('AnamnesesPsicologicaService', () => {
  let service: AnamnesesPsicologicaService;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  // Helper function to create test anamnese data
  const createTestAnamnese = (overrides: Partial<AnamnesesPsicologicaData> = {}): AnamnesesPsicologicaData => ({
    // 1. IDENTIFICAÇÃO
    nome: 'João da Silva',
    nascimento: '1980-01-15',
    sexo: 'masculino',
    trabalha: true,
    profissao: 'Engenheiro',
    religiao: 'Católica',
    estadoCivil: 'Casado',
    filhos: '2',
    contato1: '11987654321',
    quemContato1: 'Esposa',
    contato2: '11976543210',
    quemContato2: 'Mãe',
    contato3: '',
    quemContato3: '',

    // 2. HISTÓRICO DO PACIENTE
    historicoPessoal: 'Histórico de ansiedade desde a adolescência',

    // Histórico Familiar
    maeViva: true,
    maeIdadeMorte: '',
    idadeQuandoMaeMorreu: '',
    maeProfissao: 'Professora',
    relacionamentoMae: 'Bom relacionamento',

    paiVivo: false,
    paiIdadeMorte: '65',
    idadeQuandoPaiMorreu: '25',
    paiProfissao: 'Comerciante',
    relacionamentoPai: 'Distante',

    filhoUnico: false,
    irmaosVivos: true,
    quemMorreuIrmaos: '',
    idadeMorteIrmaos: '',
    idadeQuandoIrmasMorreram: '',
    profissaoIrmaos: 'Diversos',
    relacionamentoIrmaos: 'Bom',

    filhosVivos: true,
    quemMorreuFilhos: '',
    idadeMorteFilhos: '',
    idadeQuandoFilhosMorreram: '',
    profissaoFilhos: 'Estudantes',
    idadeFilhos: '10 e 12',
    relacionamentoFilhos: 'Excelente',

    avosVivos: false,
    quemMorreuAvos: 'Todos',
    idadeMorteAvos: 'Diversos',
    idadeQuandoAvosMorreram: 'Na infância',
    profissaoAvos: 'Diversos',
    idadeAvo: '',
    idadeAvó: '',
    relacionamentoAvos: 'Bom quando vivos',

    // Informações sobre o lar
    comoCasa: 'Casa própria com família',
    ruaViolencia: false,
    detalhesViolencia: '',
    apoioFamiliar: true,
    detalhesApoio: 'Família presente e solidária',
    reacaoFamilia: 'Apoio incondicional',

    // Histórico Escolar
    formacaoAcademica: 'superior_completo',
    gostavaEscola: true,
    porqueEscola: 'Gostava de aprender',
    situacoesImportantesEscola: 'Formatura',
    situacaoEnvergonhosaEscola: 'Nenhuma',
    sentePerseguidoEscola: false,
    relatoPerseguicaoEscola: '',
    gostaAmbienteEscolar: true,
    porqueAmbienteEscolar: 'Ambiente estimulante',
    fatoIncomodoEscola: false,
    detalheFatoEscola: '',

    // Trabalho
    empresa: 'Tech Solutions',
    gostaTrabalho: true,
    porqueTrabalho: 'Desafios interessantes',
    situacoesImportantesTrabalho: 'Promoção recente',
    situacaoEnvergonhosaTrabalho: 'Nenhuma',
    sentePerseguidoTrabalho: false,
    relatoPerseguicaoTrabalho: '',
    gostaAmbienteTrabalho: true,
    porqueAmbienteTrabalho: 'Equipe colaborativa',
    algoIncomodaEmpresa: false,
    detalheIncomodaEmpresa: '',

    // Relacionamento Interpessoal
    dificuldadeRelacionamento: false,
    quantosAmigos: '5-10',
    introvertidoExtrovertido: 'Extrovertido',
    cumprimentaPessoas: true,
    pessoaSolicita: true,
    detalheAmizades: 'Amizades duradouras',

    // Relação com rua/bairro
    tempoMorando: '5 anos',
    gostaMorar: true,
    porqueMorar: 'Bairro tranquilo',

    // Relação familiar após sintomas
    rotinaFamiliaMudou: false,
    mudancasRotina: '',

    // 3. HISTÓRICO CLÍNICO
    usaMedicacao: true,
    qualMedicacao: 'Ansiolítico',
    fezCirurgia: false,
    qualCirurgia: '',
    quantoTempoCirurgia: '',
    puerperio: false,
    quantosDiasPuerperio: '',
    relatosDoencaPsiquica: true,
    detalhesDoencaPsiquica: 'TAG diagnosticado há 2 anos',
    historicoSubstancias: false,
    quaisSubstancias: '',

    // 4. HISTÓRICO PSÍQUICO
    sentimentosMedo: true,
    sentimentosRaiva: false,
    sentimentosRevolta: false,
    sentimentosCulpa: true,
    sentimentosAnsiedade: true,
    sentimentosSolidao: false,
    sentimentosAngustia: true,
    sentimentosImpotencia: false,
    sentimentosAlivio: false,
    sentimentosIndiferenca: false,
    outrosSentimentos: '',

    atendimentoAnterior: true,
    motivoAtendimentoAnterior: 'Ansiedade',
    quantoTempoAtendimento: '1 ano',
    usoPsicotropico: true,
    qualPsicotropico: 'Alprazolam',
    usoSubstanciaPsicoativa: false,
    qualSubstanciaPsicoativa: '',

    // 5. CONHECENDO A QUEIXA DO PACIENTE
    queixaPrincipal: 'Crises de ansiedade frequentes',
    queixaSecundaria: 'Insônia',
    expectativaSessoes: 'Controle da ansiedade',

    // 6. INFORMAÇÕES ADICIONAIS
    informacoesAdicionais: 'Paciente motivado para tratamento',

    // 7. CLASSIFICAÇÃO DO PACIENTE
    classificacao: 'amarelo',

    // 8. DEMANDAS
    demandas: 'Psicoterapia, técnicas de relaxamento',

    // 9. JUSTIFICATIVA DA DEMANDA
    justificativaDemanda: 'Quadro de ansiedade impactando qualidade de vida',

    // Metadados
    profissionalId: 'prof-123',
    profissionalNome: 'Dr. Maria Santos',
    assistidoId: 'assistido-456',
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create service instance
    service = new AnamnesesPsicologicaService();

    // Spy on console methods to suppress logs during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('createAnamnese', () => {
    it('should create a psychological assessment successfully', async () => {
      const anamneseData = createTestAnamnese();
      const mockDocRef = { id: 'anamnese-123' };
      const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 };

      (Timestamp.now as jest.Mock).mockReturnValue(mockTimestamp);
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(anamneseData);

      expect(result).toBe('anamnese-123');
      expect(collection).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: anamneseData.nome,
          nascimento: anamneseData.nascimento,
          assistidoId: anamneseData.assistidoId,
          classificacao: anamneseData.classificacao,
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Anamnese psicológica criada com ID:'),
        'anamnese-123'
      );
    });

    it('should include profissionalResponsavel if provided', async () => {
      const anamneseData = createTestAnamnese();
      const mockDocRef = { id: 'anamnese-123' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      await service.createAnamnese({
        ...anamneseData,
        profissionalResponsavel: 'prof-789'
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          profissionalResponsavel: 'prof-789'
        })
      );
    });

    it('should add timestamps when creating anamnese', async () => {
      const anamneseData = createTestAnamnese();
      const mockDocRef = { id: 'anamnese-123' };
      const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 };

      (Timestamp.now as jest.Mock).mockReturnValue(mockTimestamp);
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      await service.createAnamnese(anamneseData);

      expect(Timestamp.now).toHaveBeenCalledTimes(2); // createdAt and updatedAt
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp
        })
      );
    });

    it('should throw error if creation fails', async () => {
      const anamneseData = createTestAnamnese();
      const mockError = new Error('Firestore error');

      (addDoc as jest.Mock).mockRejectedValue(mockError);
      (collection as jest.Mock).mockReturnValue({});

      await expect(service.createAnamnese(anamneseData))
        .rejects.toThrow('Erro ao salvar anamnese psicológica');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao criar anamnese psicológica:',
        mockError
      );
    });

    it('should handle empty optional fields', async () => {
      const minimalData: AnamnesesPsicologicaData = createTestAnamnese({
        contato3: '',
        quemContato3: '',
        outrosSentimentos: '',
        informacoesAdicionais: ''
      });
      const mockDocRef = { id: 'anamnese-123' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(minimalData);

      expect(result).toBe('anamnese-123');
    });

    it('should handle all classification types', async () => {
      const classifications: Array<'vermelho' | 'amarelo' | 'roxo' | 'verde' | ''> = [
        'vermelho',
        'amarelo',
        'roxo',
        'verde',
        ''
      ];

      for (const classificacao of classifications) {
        const anamneseData = createTestAnamnese({ classificacao });
        const mockDocRef = { id: `anamnese-${classificacao}` };

        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const result = await service.createAnamnese(anamneseData);

        expect(result).toBe(`anamnese-${classificacao}`);
      }
    });

    it('should handle all academic formation levels', async () => {
      const formations: Array<'superior_incompleto' | 'superior_completo' | 'medio_incompleto' | 'medio_completo' | 'basico' | ''> = [
        'superior_incompleto',
        'superior_completo',
        'medio_incompleto',
        'medio_completo',
        'basico',
        ''
      ];

      for (const formacao of formations) {
        const anamneseData = createTestAnamnese({ formacaoAcademica: formacao });
        const mockDocRef = { id: `anamnese-${formacao}` };

        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const result = await service.createAnamnese(anamneseData);

        expect(result).toBe(`anamnese-${formacao}`);
      }
    });

    it('should handle boolean fields correctly', async () => {
      const anamneseData = createTestAnamnese({
        trabalha: null,
        maeViva: null,
        paiVivo: null,
        filhoUnico: null,
        ruaViolencia: null,
        apoioFamiliar: null,
        gostavaEscola: null
      });
      const mockDocRef = { id: 'anamnese-123' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(anamneseData);

      expect(result).toBe('anamnese-123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          trabalha: null,
          maeViva: null,
          paiVivo: null
        })
      );
    });
  });

  describe('updateAnamnese', () => {
    it('should update a psychological assessment successfully', async () => {
      const updateData: Partial<AnamnesesPsicologicaData> = {
        queixaPrincipal: 'Nova queixa principal',
        classificacao: 'verde'
      };
      const mockTimestamp = { seconds: 9999999999, nanoseconds: 0 };

      (Timestamp.now as jest.Mock).mockReturnValue(mockTimestamp);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', updateData);

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          queixaPrincipal: 'Nova queixa principal',
          classificacao: 'verde',
          updatedAt: mockTimestamp
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Anamnese psicológica atualizada:'),
        'anamnese-123'
      );
    });

    it('should include profissionalResponsavel in update if provided', async () => {
      const updateData = {
        queixaPrincipal: 'Atualização',
        profissionalResponsavel: 'prof-999'
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          profissionalResponsavel: 'prof-999'
        })
      );
    });

    it('should update only provided fields', async () => {
      const updateData: Partial<AnamnesesPsicologicaData> = {
        demandas: 'Nova demanda'
      };
      const mockTimestamp = { seconds: 8888888888, nanoseconds: 0 };

      (Timestamp.now as jest.Mock).mockReturnValue(mockTimestamp);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          demandas: 'Nova demanda',
          updatedAt: mockTimestamp
        })
      );
    });

    it('should always update updatedAt timestamp', async () => {
      const mockTimestamp = { seconds: 9999999999, nanoseconds: 0 };
      (Timestamp.now as jest.Mock).mockReturnValue(mockTimestamp);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', {});

      expect(Timestamp.now).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          updatedAt: mockTimestamp
        })
      );
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Firestore update error');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      (doc as jest.Mock).mockReturnValue({});

      await expect(service.updateAnamnese('anamnese-123', { nome: 'Novo Nome' }))
        .rejects.toThrow('Erro ao atualizar anamnese psicológica');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao atualizar anamnese psicológica:',
        mockError
      );
    });

    it('should handle updating classification', async () => {
      const updateData: Partial<AnamnesesPsicologicaData> = {
        classificacao: 'vermelho'
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          classificacao: 'vermelho'
        })
      );
    });

    it('should handle updating multiple sentiment fields', async () => {
      const updateData: Partial<AnamnesesPsicologicaData> = {
        sentimentosMedo: false,
        sentimentosAnsiedade: false,
        sentimentosAlivio: true
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue({});

      await service.updateAnamnese('anamnese-123', updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sentimentosMedo: false,
          sentimentosAnsiedade: false,
          sentimentosAlivio: true
        })
      );
    });
  });

  describe('getAnamneseById', () => {
    it('should return anamnese by id if exists', async () => {
      const mockData = createTestAnamnese();
      const mockDocSnap = {
        exists: () => true,
        id: 'anamnese-123',
        data: () => mockData
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getAnamneseById('anamnese-123');

      expect(result).toEqual({ id: 'anamnese-123', ...mockData });
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null if anamnese does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getAnamneseById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error if retrieval fails', async () => {
      const mockError = new Error('Firestore get error');

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(service.getAnamneseById('anamnese-123'))
        .rejects.toThrow('Erro ao buscar anamnese psicológica');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar anamnese psicológica:',
        mockError
      );
    });

    it('should include document id in returned data', async () => {
      const mockData = createTestAnamnese();
      const mockDocSnap = {
        exists: () => true,
        id: 'custom-id-789',
        data: () => mockData
      };

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getAnamneseById('custom-id-789');

      expect(result).toHaveProperty('id', 'custom-id-789');
    });
  });

  describe('getAnamnesesByPaciente', () => {
    it('should return all anamneses for a patient', async () => {
      const mockAnamneses = [
        createTestAnamnese({ id: 'anamnese-1' }),
        createTestAnamnese({ id: 'anamnese-2' })
      ];

      const mockQuerySnapshot = {
        docs: mockAnamneses.map((anamnese) => ({
          id: anamnese.id,
          data: () => anamnese
        }))
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAnamnesesByPaciente('assistido-456');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'anamnese-1');
      expect(result[1]).toHaveProperty('id', 'anamnese-2');
      expect(where).toHaveBeenCalledWith('assistidoId', '==', 'assistido-456');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array if no anamneses found', async () => {
      const mockQuerySnapshot = {
        docs: []
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAnamnesesByPaciente('non-existent-patient');

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Firestore query error');

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockRejectedValue(mockError);

      await expect(service.getAnamnesesByPaciente('assistido-456'))
        .rejects.toThrow('Erro ao buscar anamneses do paciente');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar anamneses do paciente:',
        mockError
      );
    });

    it('should order results by creation date descending', async () => {
      const mockQuerySnapshot = {
        docs: [
          { id: 'recent', data: () => createTestAnamnese({ id: 'recent' }) },
          { id: 'old', data: () => createTestAnamnese({ id: 'old' }) }
        ]
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      await service.getAnamnesesByPaciente('assistido-456');

      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should map all document fields correctly', async () => {
      const mockAnamnese = createTestAnamnese({
        nome: 'Test Patient',
        queixaPrincipal: 'Test Complaint',
        classificacao: 'roxo'
      });

      const mockQuerySnapshot = {
        docs: [
          { id: 'anamnese-1', data: () => mockAnamnese }
        ]
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAnamnesesByPaciente('assistido-456');

      expect(result[0]).toMatchObject({
        id: 'anamnese-1',
        nome: 'Test Patient',
        queixaPrincipal: 'Test Complaint',
        classificacao: 'roxo'
      });
    });
  });

  describe('getAllAnamneses', () => {
    it('should return all anamneses from database', async () => {
      const mockAnamneses = [
        createTestAnamnese({ id: 'anamnese-1', assistidoId: 'patient-1' }),
        createTestAnamnese({ id: 'anamnese-2', assistidoId: 'patient-2' }),
        createTestAnamnese({ id: 'anamnese-3', assistidoId: 'patient-1' })
      ];

      const mockQuerySnapshot = {
        docs: mockAnamneses.map((anamnese) => ({
          id: anamnese.id,
          data: () => anamnese
        }))
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAllAnamneses();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id', 'anamnese-1');
      expect(result[1]).toHaveProperty('id', 'anamnese-2');
      expect(result[2]).toHaveProperty('id', 'anamnese-3');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array if no anamneses exist', async () => {
      const mockQuerySnapshot = {
        docs: []
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAllAnamneses();

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Database connection error');

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockRejectedValue(mockError);

      await expect(service.getAllAnamneses())
        .rejects.toThrow('Erro ao buscar anamneses');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar todas as anamneses:',
        mockError
      );
    });

    it('should order results by creation date descending', async () => {
      const mockQuerySnapshot = {
        docs: []
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      await service.getAllAnamneses();

      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should include all document fields in results', async () => {
      const mockAnamnese = createTestAnamnese({
        nome: 'Complete Test',
        classificacao: 'verde',
        demandas: 'Test Demands',
        profissionalNome: 'Dr. Test'
      });

      const mockQuerySnapshot = {
        docs: [
          { id: 'complete-1', data: () => mockAnamnese }
        ]
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAllAnamneses();

      expect(result[0]).toMatchObject({
        id: 'complete-1',
        nome: 'Complete Test',
        classificacao: 'verde',
        demandas: 'Test Demands',
        profissionalNome: 'Dr. Test'
      });
    });

    it('should handle large datasets efficiently', async () => {
      const largeMockData = Array.from({ length: 100 }, (_, i) =>
        createTestAnamnese({ id: `anamnese-${i}` })
      );

      const mockQuerySnapshot = {
        docs: largeMockData.map((anamnese) => ({
          id: anamnese.id,
          data: () => anamnese
        }))
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAllAnamneses();

      expect(result).toHaveLength(100);
    });
  });

  describe('Form Data Validation', () => {
    it('should handle valid complete form data', async () => {
      const completeData = createTestAnamnese();
      const mockDocRef = { id: 'valid-anamnese' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(completeData);

      expect(result).toBe('valid-anamnese');
    });

    it('should handle sex field validation', async () => {
      const validSexValues: Array<'masculino' | 'feminino' | ''> = ['masculino', 'feminino', ''];

      for (const sexo of validSexValues) {
        const data = createTestAnamnese({ sexo });
        const mockDocRef = { id: `anamnese-${sexo}` };

        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const result = await service.createAnamnese(data);
        expect(result).toBeDefined();
      }
    });

    it('should handle all sentiment boolean combinations', async () => {
      const sentiments = {
        sentimentosMedo: true,
        sentimentosRaiva: true,
        sentimentosRevolta: true,
        sentimentosCulpa: true,
        sentimentosAnsiedade: true,
        sentimentosSolidao: true,
        sentimentosAngustia: true,
        sentimentosImpotencia: true,
        sentimentosAlivio: true,
        sentimentosIndiferenca: true
      };

      const data = createTestAnamnese(sentiments);
      const mockDocRef = { id: 'all-sentiments' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('all-sentiments');
    });

    it('should handle nullable boolean fields', async () => {
      const nullableFields = {
        trabalha: null,
        maeViva: null,
        paiVivo: null,
        filhoUnico: null,
        irmaosVivos: null,
        filhosVivos: null,
        avosVivos: null,
        ruaViolencia: null,
        apoioFamiliar: null,
        gostavaEscola: null,
        sentePerseguidoEscola: null,
        gostaAmbienteEscolar: null,
        fatoIncomodoEscola: null,
        gostaTrabalho: null,
        sentePerseguidoTrabalho: null,
        gostaAmbienteTrabalho: null,
        algoIncomodaEmpresa: null,
        dificuldadeRelacionamento: null,
        cumprimentaPessoas: null,
        pessoaSolicita: null,
        gostaMorar: null,
        rotinaFamiliaMudou: null,
        usaMedicacao: null,
        fezCirurgia: null,
        puerperio: null,
        relatosDoencaPsiquica: null,
        historicoSubstancias: null,
        atendimentoAnterior: null,
        usoPsicotropico: null,
        usoSubstanciaPsicoativa: null
      };

      const data = createTestAnamnese(nullableFields);
      const mockDocRef = { id: 'null-fields' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('null-fields');
    });

    it('should handle empty string fields', async () => {
      const emptyFields = {
        contato3: '',
        quemContato3: '',
        maeIdadeMorte: '',
        idadeQuandoMaeMorreu: '',
        paiIdadeMorte: '',
        idadeQuandoPaiMorreu: '',
        outrosSentimentos: '',
        informacoesAdicionais: ''
      };

      const data = createTestAnamnese(emptyFields);
      const mockDocRef = { id: 'empty-strings' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('empty-strings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text fields', async () => {
      const longText = 'A'.repeat(5000);
      const data = createTestAnamnese({
        historicoPessoal: longText,
        queixaPrincipal: longText,
        informacoesAdicionais: longText
      });
      const mockDocRef = { id: 'long-text' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('long-text');
    });

    it('should handle special characters in text fields', async () => {
      const specialText = 'Test @#$%^&*() <>"{}[]|\\';
      const data = createTestAnamnese({
        nome: specialText,
        queixaPrincipal: specialText
      });
      const mockDocRef = { id: 'special-chars' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('special-chars');
    });

    it('should handle unicode characters', async () => {
      const unicodeText = 'Anamnese psicológica com caracteres especiais: áéíóú ãõ çñ';
      const data = createTestAnamnese({
        nome: unicodeText,
        queixaPrincipal: unicodeText
      });
      const mockDocRef = { id: 'unicode' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue({});

      const result = await service.createAnamnese(data);
      expect(result).toBe('unicode');
    });

    it('should handle concurrent create operations', async () => {
      const data1 = createTestAnamnese({ nome: 'Patient 1' });
      const data2 = createTestAnamnese({ nome: 'Patient 2' });

      (addDoc as jest.Mock)
        .mockResolvedValueOnce({ id: 'concurrent-1' })
        .mockResolvedValueOnce({ id: 'concurrent-2' });
      (collection as jest.Mock).mockReturnValue({});

      const [result1, result2] = await Promise.all([
        service.createAnamnese(data1),
        service.createAnamnese(data2)
      ]);

      expect(result1).toBe('concurrent-1');
      expect(result2).toBe('concurrent-2');
    });

    it('should handle updates to non-existent documents gracefully', async () => {
      const mockError = new Error('Document not found');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      (doc as jest.Mock).mockReturnValue({});

      await expect(service.updateAnamnese('non-existent-id', { nome: 'Test' }))
        .rejects.toThrow('Erro ao atualizar anamnese psicológica');
    });
  });

  describe('Performance and Optimization', () => {
    it('should efficiently query large datasets', async () => {
      const largeMockData = Array.from({ length: 1000 }, (_, i) =>
        createTestAnamnese({ id: `anamnese-${i}` })
      );

      const mockQuerySnapshot = {
        docs: largeMockData.map((anamnese) => ({
          id: anamnese.id,
          data: () => anamnese
        }))
      };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const startTime = Date.now();
      const result = await service.getAllAnamneses();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use proper indexing for queries', async () => {
      const mockQuerySnapshot = { docs: [] };

      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      await service.getAnamnesesByPaciente('test-patient');

      expect(where).toHaveBeenCalledWith('assistidoId', '==', 'test-patient');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      (addDoc as jest.Mock).mockRejectedValue(timeoutError);
      (collection as jest.Mock).mockReturnValue({});

      await expect(service.createAnamnese(createTestAnamnese()))
        .rejects.toThrow('Erro ao salvar anamnese psicológica');
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied');
      (getDocs as jest.Mock).mockRejectedValue(permissionError);
      (collection as jest.Mock).mockReturnValue({});
      (query as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});

      await expect(service.getAllAnamneses())
        .rejects.toThrow('Erro ao buscar anamneses');
    });

    it('should provide meaningful error messages', async () => {
      const genericError = new Error('Generic database error');
      (getDoc as jest.Mock).mockRejectedValue(genericError);
      (doc as jest.Mock).mockReturnValue({});

      try {
        await service.getAnamneseById('test-id');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Erro ao buscar anamnese psicológica');
      }
    });
  });
});
