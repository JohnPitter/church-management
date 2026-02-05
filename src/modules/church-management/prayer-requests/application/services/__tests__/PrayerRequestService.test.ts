// Unit Tests - Prayer Request Service
// Tests for PrayerRequestService business logic

import { PrayerRequestService } from '../PrayerRequestService';
import { FirebasePrayerRequestRepository } from '../../../infrastructure/repositories/FirebasePrayerRequestRepository';
import {
  PrayerRequest,
  PrayerRequestStatus,
  CreatePrayerRequestData,
  PrayerRequestEntity
} from '../../../domain/entities/PrayerRequest';

// Mock the repository
jest.mock('../../../infrastructure/repositories/FirebasePrayerRequestRepository');

describe('PrayerRequestService', () => {
  let service: PrayerRequestService;
  let mockRepository: jest.Mocked<FirebasePrayerRequestRepository>;

  // Sample test data
  const mockPrayerRequest: PrayerRequest = {
    id: 'prayer-123',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    request: 'Por favor, orem pela minha saúde e recuperação.',
    isUrgent: false,
    isAnonymous: false,
    status: PrayerRequestStatus.Pending,
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    prayedBy: [],
    source: 'website'
  };

  const mockAnonymousPrayerRequest: PrayerRequest = {
    id: 'prayer-456',
    name: 'Anônimo',
    request: 'Orem pela minha família em um momento difícil.',
    isUrgent: true,
    isAnonymous: true,
    status: PrayerRequestStatus.Pending,
    createdAt: new Date('2024-01-15T11:00:00'),
    updatedAt: new Date('2024-01-15T11:00:00'),
    prayedBy: [],
    source: 'website'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new service instance
    service = new PrayerRequestService();

    // Get the mocked repository instance
    mockRepository = (service as any).repository as jest.Mocked<FirebasePrayerRequestRepository>;
  });

  describe('submitPrayerRequest', () => {
    const validData: CreatePrayerRequestData = {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      request: 'Por favor, orem pela minha saúde e recuperação.',
      isUrgent: false,
      isAnonymous: false
    };

    it('should successfully submit a valid prayer request', async () => {
      // Arrange
      mockRepository.create.mockResolvedValue(mockPrayerRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Pedido de oração enviado com sucesso! Nossa equipe orará por você.');
      expect(result.id).toBe('prayer-123');
      expect(mockRepository.create).toHaveBeenCalledWith(validData);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should successfully submit an anonymous prayer request', async () => {
      // Arrange
      const anonymousData: CreatePrayerRequestData = {
        name: 'João Silva',
        request: 'Orem pela minha família em um momento difícil.',
        isUrgent: true,
        isAnonymous: true
      };
      mockRepository.create.mockResolvedValue(mockAnonymousPrayerRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(anonymousData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe('prayer-456');
      expect(mockRepository.create).toHaveBeenCalledWith(anonymousData);
    });

    it('should fail when name is missing', async () => {
      // Arrange
      const invalidData: CreatePrayerRequestData = {
        name: '',
        request: 'Por favor, orem pela minha saúde.',
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue(['Nome é obrigatório']);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nome é obrigatório');
      expect(result.id).toBeUndefined();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should fail when request is missing', async () => {
      // Arrange
      const invalidData: CreatePrayerRequestData = {
        name: 'João Silva',
        request: '',
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue(['Pedido de oração é obrigatório']);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Pedido de oração é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should fail when request is too short', async () => {
      // Arrange
      const invalidData: CreatePrayerRequestData = {
        name: 'João Silva',
        request: 'Curto',
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue(['Pedido de oração deve ter pelo menos 10 caracteres']);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Pedido de oração deve ter pelo menos 10 caracteres');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should fail when request is too long', async () => {
      // Arrange
      const longRequest = 'a'.repeat(2001);
      const invalidData: CreatePrayerRequestData = {
        name: 'João Silva',
        request: longRequest,
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue(['Pedido de oração deve ter no máximo 2000 caracteres']);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Pedido de oração deve ter no máximo 2000 caracteres');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should fail when email is invalid', async () => {
      // Arrange
      const invalidData: CreatePrayerRequestData = {
        name: 'João Silva',
        email: 'invalid-email',
        request: 'Por favor, orem pela minha saúde e recuperação.',
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue(['E-mail inválido']);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('E-mail inválido');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should return multiple validation errors', async () => {
      // Arrange
      const invalidData: CreatePrayerRequestData = {
        name: '',
        email: 'invalid-email',
        request: '',
      };
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([
        'Nome é obrigatório',
        'Pedido de oração é obrigatório',
        'E-mail inválido'
      ]);

      // Act
      const result = await service.submitPrayerRequest(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nome é obrigatório, Pedido de oração é obrigatório, E-mail inválido');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);
      mockRepository.create.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await service.submitPrayerRequest(validData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao enviar pedido de oração. Tente novamente.');
      expect(result.id).toBeUndefined();
    });
  });

  describe('getPrayerRequests', () => {
    it('should get all prayer requests with default limit', async () => {
      // Arrange
      const mockRequests = [mockPrayerRequest, mockAnonymousPrayerRequest];
      mockRepository.getAll.mockResolvedValue(mockRequests);

      // Act
      const result = await service.getPrayerRequests();

      // Assert
      expect(result).toEqual(mockRequests);
      expect(mockRepository.getAll).toHaveBeenCalledWith(50);
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
    });

    it('should get all prayer requests with custom limit', async () => {
      // Arrange
      const mockRequests = [mockPrayerRequest];
      mockRepository.getAll.mockResolvedValue(mockRequests);

      // Act
      const result = await service.getPrayerRequests(10);

      // Assert
      expect(result).toEqual(mockRequests);
      expect(mockRepository.getAll).toHaveBeenCalledWith(10);
    });

    it('should return empty array when no requests exist', async () => {
      // Arrange
      mockRepository.getAll.mockResolvedValue([]);

      // Act
      const result = await service.getPrayerRequests();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.getAll).toHaveBeenCalledWith(50);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPrayerRequests()).rejects.toThrow('Database error');
    });
  });

  describe('getPendingPrayerRequests', () => {
    it('should get pending prayer requests with default limit', async () => {
      // Arrange
      const pendingRequests = [mockPrayerRequest, mockAnonymousPrayerRequest];
      mockRepository.getByStatus.mockResolvedValue(pendingRequests);

      // Act
      const result = await service.getPendingPrayerRequests();

      // Assert
      expect(result).toEqual(pendingRequests);
      expect(mockRepository.getByStatus).toHaveBeenCalledWith(PrayerRequestStatus.Pending, 50);
      expect(mockRepository.getByStatus).toHaveBeenCalledTimes(1);
    });

    it('should get pending prayer requests with custom limit', async () => {
      // Arrange
      const pendingRequests = [mockPrayerRequest];
      mockRepository.getByStatus.mockResolvedValue(pendingRequests);

      // Act
      const result = await service.getPendingPrayerRequests(20);

      // Assert
      expect(result).toEqual(pendingRequests);
      expect(mockRepository.getByStatus).toHaveBeenCalledWith(PrayerRequestStatus.Pending, 20);
    });

    it('should return empty array when no pending requests exist', async () => {
      // Arrange
      mockRepository.getByStatus.mockResolvedValue([]);

      // Act
      const result = await service.getPendingPrayerRequests();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getByStatus.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPendingPrayerRequests()).rejects.toThrow('Database error');
    });
  });

  describe('getApprovedPrayerRequests', () => {
    it('should get approved prayer requests with default limit', async () => {
      // Arrange
      const approvedRequest = { ...mockPrayerRequest, status: PrayerRequestStatus.Approved };
      const approvedRequests = [approvedRequest];
      mockRepository.getByStatus.mockResolvedValue(approvedRequests);

      // Act
      const result = await service.getApprovedPrayerRequests();

      // Assert
      expect(result).toEqual(approvedRequests);
      expect(mockRepository.getByStatus).toHaveBeenCalledWith(PrayerRequestStatus.Approved, 50);
      expect(mockRepository.getByStatus).toHaveBeenCalledTimes(1);
    });

    it('should get approved prayer requests with custom limit', async () => {
      // Arrange
      const approvedRequest = { ...mockPrayerRequest, status: PrayerRequestStatus.Approved };
      mockRepository.getByStatus.mockResolvedValue([approvedRequest]);

      // Act
      const result = await service.getApprovedPrayerRequests(30);

      // Assert
      expect(result).toEqual([approvedRequest]);
      expect(mockRepository.getByStatus).toHaveBeenCalledWith(PrayerRequestStatus.Approved, 30);
    });

    it('should return empty array when no approved requests exist', async () => {
      // Arrange
      mockRepository.getByStatus.mockResolvedValue([]);

      // Act
      const result = await service.getApprovedPrayerRequests();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getByStatus.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getApprovedPrayerRequests()).rejects.toThrow('Database error');
    });
  });

  describe('approvePrayerRequest', () => {
    it('should approve a prayer request successfully', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.approvePrayerRequest(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Approved);
      expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(service.approvePrayerRequest(requestId)).rejects.toThrow('Update failed');
    });
  });

  describe('rejectPrayerRequest', () => {
    it('should reject a prayer request successfully', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.rejectPrayerRequest(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Rejected);
      expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(service.rejectPrayerRequest(requestId)).rejects.toThrow('Update failed');
    });
  });

  describe('markAsAnswered', () => {
    it('should mark a prayer request as answered successfully', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.markAsAnswered(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Answered);
      expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(service.markAsAnswered(requestId)).rejects.toThrow('Update failed');
    });
  });

  describe('addPrayedBy', () => {
    it('should add user to prayedBy list successfully', async () => {
      // Arrange
      const requestId = 'prayer-123';
      const userEmail = 'user@example.com';
      mockRepository.addPrayedBy.mockResolvedValue();

      // Act
      await service.addPrayedBy(requestId, userEmail);

      // Assert
      expect(mockRepository.addPrayedBy).toHaveBeenCalledWith(requestId, userEmail);
      expect(mockRepository.addPrayedBy).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple users praying for the same request', async () => {
      // Arrange
      const requestId = 'prayer-123';
      const user1 = 'user1@example.com';
      const user2 = 'user2@example.com';
      mockRepository.addPrayedBy.mockResolvedValue();

      // Act
      await service.addPrayedBy(requestId, user1);
      await service.addPrayedBy(requestId, user2);

      // Assert
      expect(mockRepository.addPrayedBy).toHaveBeenCalledTimes(2);
      expect(mockRepository.addPrayedBy).toHaveBeenNthCalledWith(1, requestId, user1);
      expect(mockRepository.addPrayedBy).toHaveBeenNthCalledWith(2, requestId, user2);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const requestId = 'prayer-123';
      const userEmail = 'user@example.com';
      mockRepository.addPrayedBy.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(service.addPrayedBy(requestId, userEmail)).rejects.toThrow('Update failed');
    });
  });

  describe('deletePrayerRequest', () => {
    it('should delete a prayer request successfully', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.delete.mockResolvedValue();

      // Act
      await service.deletePrayerRequest(requestId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(requestId);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(service.deletePrayerRequest(requestId)).rejects.toThrow('Delete failed');
    });
  });

  describe('Privacy and Anonymous Requests', () => {
    it('should handle anonymous requests with hidden personal info', async () => {
      // Arrange
      const anonymousData: CreatePrayerRequestData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        request: 'Orem pela minha família em um momento difícil.',
        isAnonymous: true
      };
      mockRepository.create.mockResolvedValue(mockAnonymousPrayerRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(anonymousData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith(anonymousData);
    });

    it('should handle public requests with visible personal info', async () => {
      // Arrange
      const publicData: CreatePrayerRequestData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        request: 'Por favor, orem pela minha saúde e recuperação.',
        isAnonymous: false
      };
      mockRepository.create.mockResolvedValue(mockPrayerRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(publicData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe('prayer-123');
    });
  });

  describe('Urgent Prayer Requests', () => {
    it('should handle urgent prayer requests', async () => {
      // Arrange
      const urgentData: CreatePrayerRequestData = {
        name: 'Maria Santos',
        request: 'Situação crítica de saúde, precisamos de oração urgente.',
        isUrgent: true
      };
      const urgentRequest = { ...mockPrayerRequest, isUrgent: true };
      mockRepository.create.mockResolvedValue(urgentRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(urgentData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith(urgentData);
    });

    it('should handle non-urgent prayer requests by default', async () => {
      // Arrange
      const normalData: CreatePrayerRequestData = {
        name: 'Pedro Oliveira',
        request: 'Orem pela minha família e trabalho.'
      };
      mockRepository.create.mockResolvedValue(mockPrayerRequest);
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);

      // Act
      const result = await service.submitPrayerRequest(normalData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Status Management Workflow', () => {
    it('should transition from pending to approved', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.approvePrayerRequest(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Approved);
    });

    it('should transition from approved to answered', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.markAsAnswered(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Answered);
    });

    it('should transition from pending to rejected', async () => {
      // Arrange
      const requestId = 'prayer-123';
      mockRepository.updateStatus.mockResolvedValue();

      // Act
      await service.rejectPrayerRequest(requestId);

      // Assert
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Rejected);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle console.error for submit errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);
      mockRepository.create.mockRejectedValue(new Error('Network error'));

      // Act
      await service.submitPrayerRequest({
        name: 'Test',
        request: 'Test prayer request'
      });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting prayer request:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle console.error for getPrayerRequests errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRepository.getAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPrayerRequests()).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error getting prayer requests:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle console.error for status update errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRepository.updateStatus.mockRejectedValue(new Error('Update error'));

      // Act & Assert
      await expect(service.approvePrayerRequest('test-id')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error approving prayer request:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle console.error for delete errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRepository.delete.mockRejectedValue(new Error('Delete error'));

      // Act & Assert
      await expect(service.deletePrayerRequest('test-id')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting prayer request:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete prayer request lifecycle', async () => {
      // Arrange
      const requestId = 'prayer-123';
      const userEmail = 'user@example.com';
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);
      mockRepository.create.mockResolvedValue(mockPrayerRequest);
      mockRepository.updateStatus.mockResolvedValue();
      mockRepository.addPrayedBy.mockResolvedValue();

      // Act - Submit request
      const submitResult = await service.submitPrayerRequest({
        name: 'João Silva',
        request: 'Por favor, orem pela minha saúde.'
      });

      // Approve request
      await service.approvePrayerRequest(requestId);

      // Add prayed by
      await service.addPrayedBy(requestId, userEmail);

      // Mark as answered
      await service.markAsAnswered(requestId);

      // Assert
      expect(submitResult.success).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateStatus).toHaveBeenCalledTimes(2);
      expect(mockRepository.addPrayedBy).toHaveBeenCalledTimes(1);
    });

    it('should handle request rejection flow', async () => {
      // Arrange
      const requestId = 'prayer-123';
      jest.spyOn(PrayerRequestEntity, 'validate').mockReturnValue([]);
      mockRepository.create.mockResolvedValue(mockPrayerRequest);
      mockRepository.updateStatus.mockResolvedValue();

      // Act - Submit and reject
      const submitResult = await service.submitPrayerRequest({
        name: 'João Silva',
        request: 'Inappropriate content request'
      });
      await service.rejectPrayerRequest(requestId);

      // Assert
      expect(submitResult.success).toBe(true);
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(requestId, PrayerRequestStatus.Rejected);
    });
  });
});
