// Domain Repository Interface - Assistência Repository
// Interface for assistance system data operations

import {
  ProfissionalAssistencia,
  AgendamentoAssistencia,
  RelatorioAssistencia,
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  EstatisticasAssistencia
} from '../entities/Assistencia';

export interface IProfissionalAssistenciaRepository {
  // CRUD Operations
  findById(id: string): Promise<ProfissionalAssistencia | null>;
  findAll(): Promise<ProfissionalAssistencia[]>;
  create(profissional: Omit<ProfissionalAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfissionalAssistencia>;
  update(id: string, data: Partial<ProfissionalAssistencia>): Promise<ProfissionalAssistencia>;
  delete(id: string): Promise<void>;
  deletePhysically(id: string): Promise<void>;

  // Query Operations
  findByTipo(tipo: TipoAssistencia): Promise<ProfissionalAssistencia[]>;
  findByStatus(status: StatusProfissional): Promise<ProfissionalAssistencia[]>;
  findByRegistroProfissional(registro: string): Promise<ProfissionalAssistencia | null>;
  findByCPF(cpf: string): Promise<ProfissionalAssistencia | null>;
  findByEmail(email: string): Promise<ProfissionalAssistencia | null>;
  searchProfissionais(query: string): Promise<ProfissionalAssistencia[]>;
  findDisponiveis(tipo: TipoAssistencia, data: Date): Promise<ProfissionalAssistencia[]>;

  // Status Operations
  updateStatus(id: string, status: StatusProfissional, motivo?: string): Promise<void>;
  activateProfissional(id: string): Promise<void>;
  deactivateProfissional(id: string, motivo?: string): Promise<void>;

  // Statistics
  getStatistics(): Promise<{
    totalProfissionais: number;
    totalAtivos: number;
    totalInativos: number;
    porTipo: Record<TipoAssistencia, number>;
    porStatus: Record<StatusProfissional, number>;
  }>;
}

export interface IAgendamentoAssistenciaRepository {
  // CRUD Operations
  findById(id: string): Promise<AgendamentoAssistencia | null>;
  findAll(): Promise<AgendamentoAssistencia[]>;
  create(agendamento: Omit<AgendamentoAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendamentoAssistencia>;
  update(id: string, data: Partial<AgendamentoAssistencia>): Promise<AgendamentoAssistencia>;
  delete(id: string): Promise<void>;
  deletePhysically(id: string): Promise<void>;

  // Query Operations
  findByPaciente(pacienteId: string): Promise<AgendamentoAssistencia[]>;
  findByProfissional(profissionalId: string): Promise<AgendamentoAssistencia[]>;
  findByTipo(tipo: TipoAssistencia): Promise<AgendamentoAssistencia[]>;
  findByStatus(status: StatusAgendamento): Promise<AgendamentoAssistencia[]>;
  findByDateRange(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]>;
  findByProfissionalAndDateRange(profissionalId: string, dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]>;
  findAgendamentosHoje(): Promise<AgendamentoAssistencia[]>;
  findProximosAgendamentos(profissionalId: string, limite?: number): Promise<AgendamentoAssistencia[]>;
  findAgendamentosVencidos(): Promise<AgendamentoAssistencia[]>;
  searchAgendamentos(query: string): Promise<AgendamentoAssistencia[]>;

  // Status Operations
  updateStatus(id: string, status: StatusAgendamento, observacoes?: string, responsavel?: string): Promise<void>;
  confirmarAgendamento(id: string, responsavel: string): Promise<void>;
  cancelarAgendamento(id: string, motivo: string, responsavel: string): Promise<void>;
  remarcarAgendamento(id: string, novaData: Date, responsavel: string): Promise<void>;
  iniciarConsulta(id: string, responsavel: string): Promise<void>;
  concluirConsulta(id: string, observacoes?: string, responsavel?: string): Promise<void>;

  // Report Operations
  getAgendamentosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]>;
  getEstatisticasPorProfissional(profissionalId: string): Promise<EstatisticasAssistencia>;
  getEstatisticasGerais(): Promise<EstatisticasAssistencia>;
}

export interface IRelatorioAssistenciaRepository {
  // CRUD Operations
  findById(id: string): Promise<RelatorioAssistencia | null>;
  findAll(): Promise<RelatorioAssistencia[]>;
  create(relatorio: Omit<RelatorioAssistencia, 'id'>): Promise<RelatorioAssistencia>;
  update(id: string, data: Partial<RelatorioAssistencia>): Promise<RelatorioAssistencia>;
  delete(id: string): Promise<void>;

  // Query Operations
  findByAgendamento(agendamentoId: string): Promise<RelatorioAssistencia[]>;
  findByPaciente(pacienteId: string): Promise<RelatorioAssistencia[]>;
  findByProfissional(profissionalId: string): Promise<RelatorioAssistencia[]>;
  findByDateRange(dataInicio: Date, dataFim: Date): Promise<RelatorioAssistencia[]>;
}

// Filter interfaces for advanced queries
export interface ProfissionalFilters {
  tipo?: TipoAssistencia;
  status?: StatusProfissional;
  cidade?: string;
  especialidade?: string;
  disponibilidade?: {
    data: Date;
    horaInicio?: string;
    horaFim?: string;
  };
}

export interface AgendamentoFilters {
  pacienteId?: string;
  profissionalId?: string;
  tipo?: TipoAssistencia;
  status?: StatusAgendamento;
  modalidade?: ModalidadeAtendimento;
  prioridade?: PrioridadeAtendimento;
  dataInicio?: Date;
  dataFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface RelatorioFilters {
  agendamentoId?: string;
  pacienteId?: string;
  profissionalId?: string;
  tipoRelatorio?: string;
  dataInicio?: Date;
  dataFim?: Date;
}