// Domain Repository Interface - Assistido Repository
// Defines the contract for assisted people data operations

import { 
  Assistido, 
  StatusAssistido, 
  AtendimentoAssistido, 
  FamiliarAssistido,
  NecessidadeAssistido
} from '../entities/Assistido';

export interface IAssistidoRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Assistido | null>;
  findByCPF(cpf: string): Promise<Assistido | null>;
  findAll(): Promise<Assistido[]>;
  create(assistido: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assistido>;
  update(id: string, data: Partial<Assistido>): Promise<Assistido>;
  delete(id: string): Promise<void>;
  deletePhysically(id: string): Promise<void>;
  
  // Query operations
  findByStatus(status: StatusAssistido): Promise<Assistido[]>;
  findByResponsible(responsible: string): Promise<Assistido[]>;
  findByNecessidade(necessidade: NecessidadeAssistido): Promise<Assistido[]>;
  findNeedingAttention(): Promise<Assistido[]>;
  
  // Status management
  updateStatus(id: string, status: StatusAssistido): Promise<void>;
  
  // Family and attendance management
  addFamiliar(assistidoId: string, familiar: Omit<FamiliarAssistido, 'id'>): Promise<void>;
  addAtendimento(assistidoId: string, atendimento: Omit<AtendimentoAssistido, 'id'>): Promise<void>;
  
  // Statistics and reporting
  getStatistics(): Promise<{
    totalAtivos: number;
    totalInativos: number;
    necessidadeMaisComum: NecessidadeAssistido | null;
    atendimentosUltimos30Dias: number;
    familiasTotais: number;
  }>;
}