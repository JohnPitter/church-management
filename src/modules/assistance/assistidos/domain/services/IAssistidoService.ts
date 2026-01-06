// Domain Service Interface - Assistido Service
// Defines the contract for assisted people business operations

import { 
  Assistido, 
  StatusAssistido, 
  AtendimentoAssistido, 
  FamiliarAssistido,
  NecessidadeAssistido
} from '../entities/Assistido';

export interface IAssistidoService {
  // Basic operations
  createAssistido(assistido: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assistido>;
  updateAssistido(id: string, data: Partial<Assistido>): Promise<Assistido>;
  getAssistidoById(id: string): Promise<Assistido | null>;
  getAllAssistidos(): Promise<Assistido[]>;
  
  // Query operations
  getAssistidosByStatus(status: StatusAssistido): Promise<Assistido[]>;
  getAssistidosByNecessidade(necessidade: NecessidadeAssistido): Promise<Assistido[]>;
  getAssistidosByResponsible(responsible: string): Promise<Assistido[]>;
  getAssistidosNeedingAttention(): Promise<Assistido[]>;
  
  // Status management
  updateAssistidoStatus(id: string, status: StatusAssistido): Promise<void>;
  deactivateAssistido(id: string): Promise<void>;
  
  // Family and attendance management
  addAtendimento(assistidoId: string, atendimento: Omit<AtendimentoAssistido, 'id'>): Promise<void>;
  addFamiliar(assistidoId: string, familiar: Omit<FamiliarAssistido, 'id'>): Promise<void>;
  
  // Statistics and reporting
  getStatistics(): Promise<{
    totalAtivos: number;
    totalInativos: number;
    necessidadeMaisComum: NecessidadeAssistido | null;
    atendimentosUltimos30Dias: number;
    familiasTotais: number;
    rendaMediaFamiliar: number;
    idadeMedia: number;
    distribuicaoNecessidades: Record<NecessidadeAssistido, number>;
  }>;
  
  generateReport(filters?: {
    status?: StatusAssistido;
    necessidade?: NecessidadeAssistido;
    responsible?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    assistidos: Assistido[];
    totalAtendimentos: number;
    valorTotalDoacoes: number;
    necessidadesMaisComuns: Array<{ necessidade: NecessidadeAssistido; count: number }>;
  }>;
}