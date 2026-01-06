// Infrastructure Service - HelpRequest Service
// Business logic for help requests between professionals

import { HelpRequest, HelpRequestStatus, HelpRequestPriority } from '../../domain/entities/HelpRequest';
import { FirebaseHelpRequestRepository } from '@modules/assistance/help-requests/infrastructure/repositories/FirebaseHelpRequestRepository';

export class HelpRequestService {
  private repository: FirebaseHelpRequestRepository;

  constructor() {
    this.repository = new FirebaseHelpRequestRepository();
  }

  // Create a new help request
  async createHelpRequest(data: {
    requesterId: string;
    requesterName: string;
    requesterSpecialty: string;
    helperId: string;
    helperName: string;
    helperSpecialty: string;
    assistidoId: string;
    assistidoNome: string;
    fichaId: string;
    agendamentoId?: string;
    motivo: string;
    descricao: string;
    prioridade: HelpRequestPriority;
    createdBy: string;
  }): Promise<HelpRequest> {
    const helpRequest: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      status: HelpRequestStatus.Pending,
      isRead: false
    };

    return await this.repository.create(helpRequest);
  }

  // Get help request by ID
  async getHelpRequestById(id: string): Promise<HelpRequest | null> {
    return await this.repository.findById(id);
  }

  // Get all help requests for a helper (professional receiving requests)
  async getHelpRequestsForHelper(helperId: string): Promise<HelpRequest[]> {
    return await this.repository.findByHelper(helperId);
  }

  // Get all help requests made by a requester
  async getHelpRequestsByRequester(requesterId: string): Promise<HelpRequest[]> {
    return await this.repository.findByRequester(requesterId);
  }

  // Get unread help requests for a helper
  async getUnreadHelpRequests(helperId: string): Promise<HelpRequest[]> {
    return await this.repository.findUnreadByHelper(helperId);
  }

  // Get pending help requests for a helper
  async getPendingHelpRequests(helperId: string): Promise<HelpRequest[]> {
    return await this.repository.findPendingByHelper(helperId);
  }

  // Get help requests by ficha
  async getHelpRequestsByFicha(fichaId: string): Promise<HelpRequest[]> {
    return await this.repository.findByFicha(fichaId);
  }

  // Mark help request as read
  async markAsRead(id: string): Promise<HelpRequest> {
    return await this.repository.markAsRead(id);
  }

  // Accept help request
  async acceptHelpRequest(id: string, resposta?: string): Promise<HelpRequest> {
    return await this.repository.accept(id, resposta);
  }

  // Decline help request
  async declineHelpRequest(id: string, resposta: string): Promise<HelpRequest> {
    return await this.repository.decline(id, resposta);
  }

  // Resolve help request
  async resolveHelpRequest(id: string, observacoes?: string): Promise<HelpRequest> {
    return await this.repository.resolve(id, observacoes);
  }

  // Cancel help request
  async cancelHelpRequest(id: string): Promise<HelpRequest> {
    return await this.repository.cancel(id);
  }

  // Get count of unread help requests
  async getUnreadCount(helperId: string): Promise<number> {
    return await this.repository.countUnreadByHelper(helperId);
  }

  // Get count of pending help requests
  async getPendingCount(helperId: string): Promise<number> {
    return await this.repository.countPendingByHelper(helperId);
  }

  // Update help request
  async updateHelpRequest(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest> {
    return await this.repository.update(id, updates);
  }
}
