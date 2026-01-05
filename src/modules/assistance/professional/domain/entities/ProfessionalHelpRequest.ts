// Domain Entity - Professional Help Request
// System for professionals to request help or referrals from other professionals

import { TipoAssistencia } from 'domain/entities/Assistencia';

export enum HelpRequestStatus {
  Pendente = 'pendente',
  EmAnalise = 'em_analise',
  Aceito = 'aceito',
  Recusado = 'recusado',
  Concluido = 'concluido',
  Cancelado = 'cancelado'
}

export enum HelpRequestPriority {
  Baixa = 'baixa',
  Normal = 'normal',
  Alta = 'alta',
  Urgente = 'urgente'
}

export enum HelpRequestType {
  Encaminhamento = 'encaminhamento', // Referral to another professional
  SegundaOpiniao = 'segunda_opiniao', // Second opinion request
  Interconsulta = 'interconsulta', // Interconsultation
  OrientacaoTecnica = 'orientacao_tecnica', // Technical guidance
  DiscussaoCaso = 'discussao_caso' // Case discussion
}

export interface ProfessionalHelpRequest {
  id: string;

  // Requesting professional info
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEspecialidade: TipoAssistencia;
  solicitanteEmail: string;
  solicitanteTelefone: string;

  // Target professional info (optional - can be open to any professional)
  destinatarioId?: string;
  destinatarioNome?: string;
  destinatarioEspecialidade?: TipoAssistencia;

  // Request type and details
  tipo: HelpRequestType;
  especialidadeNecessaria?: TipoAssistencia;
  prioridade: HelpRequestPriority;
  status: HelpRequestStatus;

  // Patient/case information
  pacienteId?: string;
  pacienteNome?: string; // May be anonymized
  pacienteIdade?: number;

  // Request details
  titulo: string;
  descricao: string;
  motivoSolicitacao: string;
  historicoRelevante?: string;
  diagnosticoInicial?: string;
  condutaAtual?: string;
  duvidasEspecificas?: string;

  // Response from accepting professional
  respostaId?: string;
  respostaProfissionalId?: string;
  respostaProfissionalNome?: string;
  respostaConteudo?: string;
  respostaData?: Date;
  orientacoesRecebidas?: string;

  // Follow-up
  agendamentoGeradoId?: string; // If an appointment was scheduled
  necessitaAcompanhamento: boolean;
  dataLimiteResposta?: Date;

  // Attachments
  anexos: HelpRequestAttachment[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Privacy
  anonimizado: boolean; // If patient identity should be hidden

  // History
  historico: HelpRequestHistory[];

  // Notes
  observacoes?: string;
}

export interface HelpRequestAttachment {
  id: string;
  nome: string;
  tipo: 'exame' | 'laudo' | 'relatorio' | 'imagem' | 'documento' | 'outros';
  arquivoUrl: string;
  tamanhoArquivo: number;
  dataUpload: Date;
  uploadedBy: string;
  descricao?: string;
}

export interface HelpRequestHistory {
  id: string;
  dataHora: Date;
  acao: 'criado' | 'aceito' | 'recusado' | 'respondido' | 'concluido' | 'cancelado' | 'comentario_adicionado';
  statusAnterior?: HelpRequestStatus;
  statusNovo: HelpRequestStatus;
  observacoes?: string;
  responsavel: string;
  responsavelNome: string;
}

export interface HelpRequestComment {
  id: string;
  helpRequestId: string;
  autorId: string;
  autorNome: string;
  autorEspecialidade: TipoAssistencia;
  conteudo: string;
  ehResposta: boolean; // Is this the official response?
  createdAt: Date;
  updatedAt?: Date;
}

export interface HelpRequestStatistics {
  totalSolicitacoes: number;
  pendentes: number;
  emAnalise: number;
  aceitos: number;
  concluidos: number;
  recusados: number;
  porTipo: Record<HelpRequestType, number>;
  porEspecialidade: Record<TipoAssistencia, number>;
  porPrioridade: Record<HelpRequestPriority, number>;
  tempoMedioResposta: number; // em horas
  taxaAceitacao: number; // percentual
}

// Helper functions
export class ProfessionalHelpRequestEntity {
  static getStatusLabel(status: HelpRequestStatus): string {
    const labels: Record<HelpRequestStatus, string> = {
      [HelpRequestStatus.Pendente]: 'Pendente',
      [HelpRequestStatus.EmAnalise]: 'Em Análise',
      [HelpRequestStatus.Aceito]: 'Aceito',
      [HelpRequestStatus.Recusado]: 'Recusado',
      [HelpRequestStatus.Concluido]: 'Concluído',
      [HelpRequestStatus.Cancelado]: 'Cancelado'
    };
    return labels[status];
  }

  static getPriorityLabel(priority: HelpRequestPriority): string {
    const labels: Record<HelpRequestPriority, string> = {
      [HelpRequestPriority.Baixa]: 'Baixa',
      [HelpRequestPriority.Normal]: 'Normal',
      [HelpRequestPriority.Alta]: 'Alta',
      [HelpRequestPriority.Urgente]: 'Urgente'
    };
    return labels[priority];
  }

  static getTypeLabel(type: HelpRequestType): string {
    const labels: Record<HelpRequestType, string> = {
      [HelpRequestType.Encaminhamento]: 'Encaminhamento',
      [HelpRequestType.SegundaOpiniao]: 'Segunda Opinião',
      [HelpRequestType.Interconsulta]: 'Interconsulta',
      [HelpRequestType.OrientacaoTecnica]: 'Orientação Técnica',
      [HelpRequestType.DiscussaoCaso]: 'Discussão de Caso'
    };
    return labels[type];
  }

  static getPriorityColor(priority: HelpRequestPriority): string {
    const colors: Record<HelpRequestPriority, string> = {
      [HelpRequestPriority.Baixa]: 'bg-gray-100 text-gray-800',
      [HelpRequestPriority.Normal]: 'bg-blue-100 text-blue-800',
      [HelpRequestPriority.Alta]: 'bg-orange-100 text-orange-800',
      [HelpRequestPriority.Urgente]: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  }

  static getStatusColor(status: HelpRequestStatus): string {
    const colors: Record<HelpRequestStatus, string> = {
      [HelpRequestStatus.Pendente]: 'bg-yellow-100 text-yellow-800',
      [HelpRequestStatus.EmAnalise]: 'bg-blue-100 text-blue-800',
      [HelpRequestStatus.Aceito]: 'bg-green-100 text-green-800',
      [HelpRequestStatus.Recusado]: 'bg-red-100 text-red-800',
      [HelpRequestStatus.Concluido]: 'bg-gray-100 text-gray-800',
      [HelpRequestStatus.Cancelado]: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  }

  static canRespond(request: ProfessionalHelpRequest, professionalId: string): boolean {
    // Can respond if:
    // 1. Request is pending or in analysis
    // 2. Not the requester
    // 3. Either targeted to this professional or open to all
    return (
      (request.status === HelpRequestStatus.Pendente || request.status === HelpRequestStatus.EmAnalise) &&
      request.solicitanteId !== professionalId &&
      (!request.destinatarioId || request.destinatarioId === professionalId)
    );
  }

  static canEdit(request: ProfessionalHelpRequest, professionalId: string): boolean {
    // Can edit if requester and status is pending
    return request.solicitanteId === professionalId && request.status === HelpRequestStatus.Pendente;
  }

  static canCancel(request: ProfessionalHelpRequest, professionalId: string): boolean {
    // Can cancel if requester and not completed
    return (
      request.solicitanteId === professionalId &&
      request.status !== HelpRequestStatus.Concluido &&
      request.status !== HelpRequestStatus.Cancelado
    );
  }
}
