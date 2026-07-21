// Infrastructure Service - Prayer Request Service
// Service for managing prayer requests business logic

import { FirebasePrayerRequestRepository } from '@modules/church-management/prayer-requests/infrastructure/repositories/FirebasePrayerRequestRepository';
import { PrayerRequest, PrayerRequestStatus, CreatePrayerRequestData, PrayerRequestEntity } from '../../domain/entities/PrayerRequest';

export class PrayerRequestService {
  private repository: FirebasePrayerRequestRepository;

  constructor() {
    this.repository = new FirebasePrayerRequestRepository();
  }

  async submitPrayerRequest(data: CreatePrayerRequestData): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      // Validate the data
      const errors = PrayerRequestEntity.validate(data);
      if (errors.length > 0) {
        return {
          success: false,
          message: errors.join(', ')
        };
      }

      // Create the prayer request
      const prayerRequest = await this.repository.create(data);

      return {
        success: true,
        message: 'Pedido de oração enviado com sucesso! Nossa equipe orará por você.',
        id: prayerRequest.id
      };
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      return {
        success: false,
        message: 'Erro ao enviar pedido de oração. Tente novamente.'
      };
    }
  }

  async getPrayerRequests(limitCount = 50): Promise<PrayerRequest[]> {
    try {
      return await this.repository.getAll(limitCount);
    } catch (error) {
      console.error('Error getting prayer requests:', error);
      throw error;
    }
  }

  async getPendingPrayerRequests(limitCount = 50): Promise<PrayerRequest[]> {
    try {
      return await this.repository.getByStatus(PrayerRequestStatus.Pending, limitCount);
    } catch (error) {
      console.error('Error getting pending prayer requests:', error);
      throw error;
    }
  }

  async getApprovedPrayerRequests(limitCount = 50): Promise<PrayerRequest[]> {
    try {
      return await this.repository.getByStatus(PrayerRequestStatus.Approved, limitCount);
    } catch (error) {
      console.error('Error getting approved prayer requests:', error);
      throw error;
    }
  }

  async approvePrayerRequest(id: string): Promise<void> {
    try {
      await this.repository.updateStatus(id, PrayerRequestStatus.Approved);
    } catch (error) {
      console.error('Error approving prayer request:', error);
      throw error;
    }
  }

  async rejectPrayerRequest(id: string): Promise<void> {
    try {
      await this.repository.updateStatus(id, PrayerRequestStatus.Rejected);
    } catch (error) {
      console.error('Error rejecting prayer request:', error);
      throw error;
    }
  }

  async markAsAnswered(id: string): Promise<void> {
    try {
      await this.repository.updateStatus(id, PrayerRequestStatus.Answered);
    } catch (error) {
      console.error('Error marking prayer request as answered:', error);
      throw error;
    }
  }

  async addPrayedBy(id: string, userEmail: string): Promise<void> {
    try {
      await this.repository.addPrayedBy(id, userEmail);
    } catch (error) {
      console.error('Error adding prayed by:', error);
      throw error;
    }
  }

  async removePrayedBy(id: string, userEmail: string): Promise<void> {
    try {
      await this.repository.removePrayedBy(id, userEmail);
    } catch (error) {
      console.error('Error removing prayed by:', error);
      throw error;
    }
  }

  /**
   * Alterna o "orei por este pedido" (curtida de oração) para o usuário.
   * Retorna true se passou a orar, false se removeu.
   */
  async togglePrayedBy(id: string, userEmail: string): Promise<boolean> {
    if (!userEmail?.trim()) {
      throw new Error('Usuário não identificado para registrar oração');
    }

    const request = await this.repository.getById(id);
    if (!request) {
      throw new Error('Pedido de oração não encontrado');
    }

    const alreadyPrayed = (request.prayedBy || []).includes(userEmail);
    if (alreadyPrayed) {
      await this.repository.removePrayedBy(id, userEmail);
      return false;
    }

    await this.repository.addPrayedBy(id, userEmail);
    return true;
  }

  async getCommunityPrayerRequests(days = 7): Promise<PrayerRequest[]> {
    try {
      return await this.repository.getRecentForCommunity(days);
    } catch (error) {
      console.error('Error getting community prayer requests:', error);
      throw error;
    }
  }

  async deletePrayerRequest(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      throw error;
    }
  }
}
