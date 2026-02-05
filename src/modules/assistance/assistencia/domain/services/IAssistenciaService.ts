// Domain Service Interface - Assistência Service
// Business logic interface for assistance system operations

import {
  ProfissionalAssistencia,
  AgendamentoAssistencia,
  RelatorioAssistencia,
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  EstatisticasAssistencia,
  HorarioFuncionamento,
  AvaliacaoServico
} from '../entities/Assistencia';
import {
  ProfissionalFilters,
  AgendamentoFilters
} from '../repositories/IAssistenciaRepository';

export interface IProfissionalAssistenciaService {
  // CRUD Operations
  createProfissional(profissional: Omit<ProfissionalAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfissionalAssistencia>;
  updateProfissional(id: string, data: Partial<ProfissionalAssistencia>): Promise<ProfissionalAssistencia>;
  getProfissionalById(id: string): Promise<ProfissionalAssistencia | null>;
  getAllProfissionais(): Promise<ProfissionalAssistencia[]>;
  deleteProfissionalPermanente(id: string, forceDelete?: boolean): Promise<void>;
  inativarProfissional(id: string, motivo?: string): Promise<void>;

  // Query Operations
  getProfissionaisByTipo(tipo: TipoAssistencia): Promise<ProfissionalAssistencia[]>;
  getProfissionaisAtivos(): Promise<ProfissionalAssistencia[]>;
  searchProfissionais(query: string): Promise<ProfissionalAssistencia[]>;
  getProfissionaisDisponiveis(tipo: TipoAssistencia, data: Date): Promise<ProfissionalAssistencia[]>;

  // Status Management
  activateProfissional(id: string): Promise<void>;
  deactivateProfissional(id: string, motivo?: string): Promise<void>;
  updateStatusProfissional(id: string, status: StatusProfissional, motivo?: string): Promise<void>;

  // Schedule Management
  updateHorariosFuncionamento(id: string, horarios: HorarioFuncionamento[]): Promise<void>;
  getHorariosDisponiveis(profissionalId: string, dataInicio: Date, dataFim: Date): Promise<Date[]>;

  // Statistics and Reports
  getStatistics(): Promise<{
    totalProfissionais: number;
    totalAtivos: number;
    totalInativos: number;
    porTipo: Record<TipoAssistencia, number>;
    porStatus: Record<StatusProfissional, number>;
    avaliacaoMedia: number;
  }>;

  generateReport(filters?: ProfissionalFilters): Promise<{
    profissionais: ProfissionalAssistencia[];
    totalProfissionais: number;
    distribuicaoTipos: Record<TipoAssistencia, number>;
    distribuicaoStatus: Record<StatusProfissional, number>;
    cidadesMaisComuns: Array<{ cidade: string; count: number }>;
  }>;

  // Validation
  validateProfissionalData(profissional: Partial<ProfissionalAssistencia>): Promise<string[]>;
  checkRegistroProfissionalExists(registro: string, excludeId?: string): Promise<boolean>;
  checkCPFExists(cpf: string, excludeId?: string): Promise<boolean>;
  checkEmailExists(email: string, excludeId?: string): Promise<boolean>;
}

export interface IAgendamentoAssistenciaService {
  // CRUD Operations
  createAgendamento(agendamento: Omit<AgendamentoAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendamentoAssistencia>;
  updateAgendamento(id: string, data: Partial<AgendamentoAssistencia>): Promise<AgendamentoAssistencia>;
  getAgendamentoById(id: string): Promise<AgendamentoAssistencia | null>;
  getAllAgendamentos(): Promise<AgendamentoAssistencia[]>;
  deleteAgendamento(id: string): Promise<void>;

  // Query Operations
  getAgendamentosByPaciente(pacienteId: string): Promise<AgendamentoAssistencia[]>;
  getAgendamentosByProfissional(profissionalId: string): Promise<AgendamentoAssistencia[]>;
  getAgendamentosHoje(): Promise<AgendamentoAssistencia[]>;
  getProximosAgendamentos(profissionalId?: string, limite?: number): Promise<AgendamentoAssistencia[]>;
  getAgendamentosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]>;
  searchAgendamentos(query: string): Promise<AgendamentoAssistencia[]>;

  // Status Management
  confirmarAgendamento(id: string, responsavel: string): Promise<void>;
  cancelarAgendamento(id: string, motivo: string, responsavel: string): Promise<void>;
  remarcarAgendamento(id: string, novaData: Date, responsavel: string): Promise<void>;
  iniciarConsulta(id: string, responsavel: string): Promise<void>;
  concluirConsulta(id: string, observacoes?: string, responsavel?: string): Promise<void>;
  marcarFalta(id: string, responsavel: string): Promise<void>;

  // Business Logic
  verificarDisponibilidade(profissionalId: string, dataHora: Date, duracao: number): Promise<boolean>;
  obterHorariosDisponiveis(profissionalId: string, data: Date): Promise<Date[]>;
  calcularValorTotal(profissionalId: string, desconto?: number): Promise<number>;
  enviarLembrete(agendamentoId: string, tipoLembrete: 'sms' | 'email' | 'whatsapp'): Promise<void>;

  // Statistics and Reports
  getStatistics(): Promise<EstatisticasAssistencia>;
  getEstatisticasPorProfissional(profissionalId: string): Promise<EstatisticasAssistencia>;
  generateReport(filters?: AgendamentoFilters): Promise<{
    agendamentos: AgendamentoAssistencia[];
    totalAgendamentos: number;
    distribuicaoStatus: Record<StatusAgendamento, number>;
    distribuicaoTipos: Record<TipoAssistencia, number>;
    faturamentoTotal: number;
    avaliacaoMedia: number;
  }>;

  // Validation
  validateAgendamentoData(agendamento: Partial<AgendamentoAssistencia>): Promise<string[]>;
  checkConflitosHorario(profissionalId: string, dataInicio: Date, dataFim: Date, excludeId?: string): Promise<boolean>;
}

export interface IRelatorioAssistenciaService {
  // CRUD Operations
  createRelatorio(relatorio: Omit<RelatorioAssistencia, 'id'>): Promise<RelatorioAssistencia>;
  updateRelatorio(id: string, data: Partial<RelatorioAssistencia>): Promise<RelatorioAssistencia>;
  getRelatorioById(id: string): Promise<RelatorioAssistencia | null>;
  getAllRelatorios(): Promise<RelatorioAssistencia[]>;
  deleteRelatorio(id: string): Promise<void>;

  // Query Operations
  getRelatoriosByAgendamento(agendamentoId: string): Promise<RelatorioAssistencia[]>;
  getRelatoriosByPaciente(pacienteId: string): Promise<RelatorioAssistencia[]>;
  getRelatoriosByProfissional(profissionalId: string): Promise<RelatorioAssistencia[]>;
  getRelatoriosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<RelatorioAssistencia[]>;

  // Business Logic
  generatePDFRelatorio(relatorioId: string): Promise<Buffer>;
  generateConsolidatedReport(pacienteId: string): Promise<RelatorioAssistencia[]>;
  
  // Statistics
  getStatistics(): Promise<{
    totalRelatorios: number;
    relatoriosHoje: number;
    relatoriosSemana: number;
    relatoriosMes: number;
    porTipo: Record<string, number>;
    porProfissional: Record<string, number>;
  }>;

  // Validation
  validateRelatorioData(relatorio: Partial<RelatorioAssistencia>): Promise<string[]>;
}

export interface IAvaliacaoService {
  // CRUD Operations
  createAvaliacao(avaliacao: Omit<AvaliacaoServico, 'id'>): Promise<AvaliacaoServico>;
  updateAvaliacao(id: string, data: Partial<AvaliacaoServico>): Promise<AvaliacaoServico>;
  getAvaliacaoById(id: string): Promise<AvaliacaoServico | null>;
  
  // Query Operations
  getAvaliacoesByProfissional(profissionalId: string): Promise<AvaliacaoServico[]>;
  getAvaliacoesByPaciente(pacienteId: string): Promise<AvaliacaoServico[]>;
  getMediaAvaliacoesProfissional(profissionalId: string): Promise<number>;
  
  // Statistics
  getEstatisticasAvaliacoes(): Promise<{
    totalAvaliacoes: number;
    notaMedia: number;
    distribuicaoNotas: Record<number, number>;
    recomendacaoPercentual: number;
  }>;
}