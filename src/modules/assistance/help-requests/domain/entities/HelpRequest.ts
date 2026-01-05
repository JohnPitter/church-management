// Domain Entity - HelpRequest
// System for professionals to request help from other professionals

export enum HelpRequestStatus {
  Pending = 'pending',       // Aguardando resposta
  Accepted = 'accepted',     // Aceito pelo profissional
  Declined = 'declined',     // Recusado pelo profissional
  Resolved = 'resolved',     // Resolvido
  Cancelled = 'cancelled'    // Cancelado pelo solicitante
}

export enum HelpRequestPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent'
}

export interface HelpRequest {
  id: string;

  // Informações do solicitante
  requesterId: string;           // ID do profissional que pede ajuda
  requesterName: string;         // Nome do profissional solicitante
  requesterSpecialty: string;    // Especialidade do solicitante

  // Informações do profissional ajudante
  helperId: string;              // ID do profissional que vai ajudar
  helperName: string;            // Nome do profissional ajudante
  helperSpecialty: string;       // Especialidade do ajudante

  // Informações do assistido/ficha
  assistidoId: string;           // ID do assistido
  assistidoNome: string;         // Nome do assistido
  fichaId: string;               // ID da ficha de acompanhamento
  agendamentoId?: string;        // ID do agendamento relacionado (opcional)

  // Detalhes da solicitação
  motivo: string;                // Motivo do pedido de ajuda
  descricao: string;             // Descrição detalhada
  prioridade: HelpRequestPriority;
  status: HelpRequestStatus;

  // Resposta do profissional
  resposta?: string;             // Resposta/feedback do profissional ajudante
  dataResposta?: Date;           // Data da resposta
  observacoes?: string;          // Observações adicionais

  // Metadados
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // ID do usuário que criou

  // Notificações
  isRead: boolean;               // Se foi lido pelo profissional ajudante
  readAt?: Date;                 // Quando foi lido
}

// Helper functions
export class HelpRequestManager {
  static getStatusLabel(status: HelpRequestStatus): string {
    const labels = {
      [HelpRequestStatus.Pending]: 'Aguardando',
      [HelpRequestStatus.Accepted]: 'Aceito',
      [HelpRequestStatus.Declined]: 'Recusado',
      [HelpRequestStatus.Resolved]: 'Resolvido',
      [HelpRequestStatus.Cancelled]: 'Cancelado'
    };
    return labels[status] || status;
  }

  static getPriorityLabel(priority: HelpRequestPriority): string {
    const labels = {
      [HelpRequestPriority.Low]: 'Baixa',
      [HelpRequestPriority.Normal]: 'Normal',
      [HelpRequestPriority.High]: 'Alta',
      [HelpRequestPriority.Urgent]: 'Urgente'
    };
    return labels[priority] || priority;
  }

  static getStatusColor(status: HelpRequestStatus): string {
    const colors = {
      [HelpRequestStatus.Pending]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [HelpRequestStatus.Accepted]: 'bg-blue-100 text-blue-800 border-blue-200',
      [HelpRequestStatus.Declined]: 'bg-red-100 text-red-800 border-red-200',
      [HelpRequestStatus.Resolved]: 'bg-green-100 text-green-800 border-green-200',
      [HelpRequestStatus.Cancelled]: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  static getPriorityColor(priority: HelpRequestPriority): string {
    const colors = {
      [HelpRequestPriority.Low]: 'bg-gray-100 text-gray-700',
      [HelpRequestPriority.Normal]: 'bg-blue-100 text-blue-700',
      [HelpRequestPriority.High]: 'bg-orange-100 text-orange-700',
      [HelpRequestPriority.Urgent]: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  }
}
