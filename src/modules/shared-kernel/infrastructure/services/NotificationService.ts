// Stub NotificationService for fixing compilation
// TODO: Implement full NotificationService with proper DI

export class NotificationService {
  async notifyNewHelpRequest(requestId: string, title: string): Promise<void> {
    console.log('Notification:', requestId, title);
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
}

// Export singleton instance
export const notificationService = new NotificationService();
