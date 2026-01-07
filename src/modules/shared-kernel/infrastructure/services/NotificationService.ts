// Stub NotificationService for fixing compilation
// TODO: Implement full NotificationService with proper DI

export class NotificationService {
  async notifyNewHelpRequest(requestId: string, title: string): Promise<void> {
    console.log('Notification:', requestId, title);
  }

  async notifyHelpRequest(
    userId: string,
    requestId: string,
    solicitanteNome?: string,
    solicitanteEspecialidade?: string,
    titulo?: string,
    prioridade?: string
  ): Promise<void> {
    console.log('Notification:', userId, requestId, solicitanteNome, solicitanteEspecialidade, titulo, prioridade);
  }

  async notifyAssistidoStatusChange(assistidoId: string, status: string): Promise<void> {
    console.log('Notification:', assistidoId, status);
  }

  async notifyAssistenciaScheduled(assistenciaId: string, assistidoName: string): Promise<void> {
    console.log('Notification:', assistenciaId, assistidoName);
  }

  async notifyProfessionalHelpRequest(requestId: string, type: string): Promise<void> {
    console.log('Notification:', requestId, type);
  }

  async createCustomNotification(
    title: string,
    message: string,
    targetType?: string,
    options?: {
      priority?: string;
      actionUrl?: string;
      actionText?: string;
      imageUrl?: string;
      roles?: string[];
    }
  ): Promise<void> {
    console.log('Custom Notification:', title, message, targetType, options);
  }

  async send(notification: {
    title: string;
    message: string;
    userId?: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
  }): Promise<void> {
    console.log('Send Notification:', notification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
