// Unit Tests - HelpRequestService
// Tests for HelpRequest service layer operations

import { HelpRequestService } from '../HelpRequestService';
import { HelpRequest, HelpRequestStatus, HelpRequestPriority } from '../../../domain/entities/HelpRequest';
import { FirebaseHelpRequestRepository } from '../../../infrastructure/repositories/FirebaseHelpRequestRepository';

// Mock the FirebaseHelpRequestRepository
jest.mock('../../../infrastructure/repositories/FirebaseHelpRequestRepository');

describe('HelpRequestService', () => {
  let helpRequestService: HelpRequestService;
  let mockRepository: jest.Mocked<FirebaseHelpRequestRepository>;

  // Test data factory
  const createTestHelpRequest = (overrides: Partial<HelpRequest> = {}): HelpRequest => ({
    id: 'request-1',
    requesterId: 'professional-1',
    requesterName: 'Dr. João Silva',
    requesterSpecialty: 'Psicólogo',
    helperId: 'professional-2',
    helperName: 'Dr. Maria Santos',
    helperSpecialty: 'Assistente Social',
    assistidoId: 'assistido-1',
    assistidoNome: 'Pedro Costa',
    fichaId: 'ficha-1',
    agendamentoId: 'agendamento-1',
    motivo: 'Necessidade de avaliação social',
    descricao: 'Assistido precisa de avaliação complementar sobre situação familiar',
    prioridade: HelpRequestPriority.Normal,
    status: HelpRequestStatus.Pending,
    isRead: false,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    createdBy: 'professional-1',
    ...overrides
  });

  const createTestHelpRequestData = () => ({
    requesterId: 'professional-1',
    requesterName: 'Dr. João Silva',
    requesterSpecialty: 'Psicólogo',
    helperId: 'professional-2',
    helperName: 'Dr. Maria Santos',
    helperSpecialty: 'Assistente Social',
    assistidoId: 'assistido-1',
    assistidoNome: 'Pedro Costa',
    fichaId: 'ficha-1',
    agendamentoId: 'agendamento-1',
    motivo: 'Necessidade de avaliação social',
    descricao: 'Assistido precisa de avaliação complementar',
    prioridade: HelpRequestPriority.Normal,
    createdBy: 'professional-1'
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh mock instance
    mockRepository = new FirebaseHelpRequestRepository() as jest.Mocked<FirebaseHelpRequestRepository>;

    // Create service instance
    helpRequestService = new HelpRequestService();

    // Access the private repository and replace with our mock
    (helpRequestService as any).repository = mockRepository;
  });

  // ===========================================
  // HELP REQUEST CREATION
  // ===========================================
  describe('Help Request Creation', () => {
    describe('createHelpRequest', () => {
      it('should create a new help request with pending status', async () => {
        const requestData = createTestHelpRequestData();
        const createdRequest = createTestHelpRequest({
          status: HelpRequestStatus.Pending,
          isRead: false
        });

        mockRepository.create.mockResolvedValue(createdRequest);

        const result = await helpRequestService.createHelpRequest(requestData);

        expect(mockRepository.create).toHaveBeenCalledWith({
          ...requestData,
          status: HelpRequestStatus.Pending,
          isRead: false
        });
        expect(result.status).toBe(HelpRequestStatus.Pending);
        expect(result.isRead).toBe(false);
        expect(result.id).toBe('request-1');
      });

      it('should create help request with urgent priority', async () => {
        const requestData = {
          ...createTestHelpRequestData(),
          prioridade: HelpRequestPriority.Urgent
        };
        const createdRequest = createTestHelpRequest({
          prioridade: HelpRequestPriority.Urgent
        });

        mockRepository.create.mockResolvedValue(createdRequest);

        const result = await helpRequestService.createHelpRequest(requestData);

        expect(result.prioridade).toBe(HelpRequestPriority.Urgent);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ prioridade: HelpRequestPriority.Urgent })
        );
      });

      it('should create help request with low priority', async () => {
        const requestData = {
          ...createTestHelpRequestData(),
          prioridade: HelpRequestPriority.Low
        };
        const createdRequest = createTestHelpRequest({
          prioridade: HelpRequestPriority.Low
        });

        mockRepository.create.mockResolvedValue(createdRequest);

        const result = await helpRequestService.createHelpRequest(requestData);

        expect(result.prioridade).toBe(HelpRequestPriority.Low);
      });

      it('should create help request with high priority', async () => {
        const requestData = {
          ...createTestHelpRequestData(),
          prioridade: HelpRequestPriority.High
        };
        const createdRequest = createTestHelpRequest({
          prioridade: HelpRequestPriority.High
        });

        mockRepository.create.mockResolvedValue(createdRequest);

        const result = await helpRequestService.createHelpRequest(requestData);

        expect(result.prioridade).toBe(HelpRequestPriority.High);
      });

      it('should create help request without agendamentoId', async () => {
        const requestData = {
          ...createTestHelpRequestData(),
          agendamentoId: undefined
        };
        const createdRequest = createTestHelpRequest({
          agendamentoId: undefined
        });

        mockRepository.create.mockResolvedValue(createdRequest);

        const result = await helpRequestService.createHelpRequest(requestData);

        expect(result.agendamentoId).toBeUndefined();
      });

      it('should propagate repository errors during creation', async () => {
        const requestData = createTestHelpRequestData();
        mockRepository.create.mockRejectedValue(new Error('Erro ao criar solicitação'));

        await expect(helpRequestService.createHelpRequest(requestData))
          .rejects.toThrow('Erro ao criar solicitação');
      });
    });
  });

  // ===========================================
  // RETRIEVAL OPERATIONS
  // ===========================================
  describe('Retrieval Operations', () => {
    describe('getHelpRequestById', () => {
      it('should return help request when found', async () => {
        const helpRequest = createTestHelpRequest({ id: 'request-123' });
        mockRepository.findById.mockResolvedValue(helpRequest);

        const result = await helpRequestService.getHelpRequestById('request-123');

        expect(mockRepository.findById).toHaveBeenCalledWith('request-123');
        expect(result).toEqual(helpRequest);
        expect(result?.id).toBe('request-123');
      });

      it('should return null when help request not found', async () => {
        mockRepository.findById.mockResolvedValue(null);

        const result = await helpRequestService.getHelpRequestById('non-existent-id');

        expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
        expect(result).toBeNull();
      });

      it('should propagate repository errors', async () => {
        mockRepository.findById.mockRejectedValue(new Error('Erro ao buscar solicitação'));

        await expect(helpRequestService.getHelpRequestById('any-id'))
          .rejects.toThrow('Erro ao buscar solicitação');
      });
    });

    describe('getHelpRequestsForHelper', () => {
      it('should return all help requests for a helper', async () => {
        const requests = [
          createTestHelpRequest({ id: 'request-1', helperId: 'helper-1' }),
          createTestHelpRequest({ id: 'request-2', helperId: 'helper-1' }),
          createTestHelpRequest({ id: 'request-3', helperId: 'helper-1' })
        ];
        mockRepository.findByHelper.mockResolvedValue(requests);

        const result = await helpRequestService.getHelpRequestsForHelper('helper-1');

        expect(mockRepository.findByHelper).toHaveBeenCalledWith('helper-1');
        expect(result).toHaveLength(3);
        result.forEach(request => {
          expect(request.helperId).toBe('helper-1');
        });
      });

      it('should return empty array when helper has no requests', async () => {
        mockRepository.findByHelper.mockResolvedValue([]);

        const result = await helpRequestService.getHelpRequestsForHelper('helper-1');

        expect(result).toEqual([]);
      });

      it('should propagate repository errors', async () => {
        mockRepository.findByHelper.mockRejectedValue(new Error('Database error'));

        await expect(helpRequestService.getHelpRequestsForHelper('helper-1'))
          .rejects.toThrow('Database error');
      });
    });

    describe('getHelpRequestsByRequester', () => {
      it('should return all help requests made by a requester', async () => {
        const requests = [
          createTestHelpRequest({ id: 'request-1', requesterId: 'requester-1' }),
          createTestHelpRequest({ id: 'request-2', requesterId: 'requester-1' })
        ];
        mockRepository.findByRequester.mockResolvedValue(requests);

        const result = await helpRequestService.getHelpRequestsByRequester('requester-1');

        expect(mockRepository.findByRequester).toHaveBeenCalledWith('requester-1');
        expect(result).toHaveLength(2);
        result.forEach(request => {
          expect(request.requesterId).toBe('requester-1');
        });
      });

      it('should return empty array when requester has no requests', async () => {
        mockRepository.findByRequester.mockResolvedValue([]);

        const result = await helpRequestService.getHelpRequestsByRequester('requester-1');

        expect(result).toEqual([]);
      });
    });

    describe('getHelpRequestsByFicha', () => {
      it('should return all help requests for a specific ficha', async () => {
        const requests = [
          createTestHelpRequest({ id: 'request-1', fichaId: 'ficha-1' }),
          createTestHelpRequest({ id: 'request-2', fichaId: 'ficha-1' })
        ];
        mockRepository.findByFicha.mockResolvedValue(requests);

        const result = await helpRequestService.getHelpRequestsByFicha('ficha-1');

        expect(mockRepository.findByFicha).toHaveBeenCalledWith('ficha-1');
        expect(result).toHaveLength(2);
        result.forEach(request => {
          expect(request.fichaId).toBe('ficha-1');
        });
      });

      it('should return empty array when ficha has no help requests', async () => {
        mockRepository.findByFicha.mockResolvedValue([]);

        const result = await helpRequestService.getHelpRequestsByFicha('ficha-99');

        expect(result).toEqual([]);
      });
    });
  });

  // ===========================================
  // FILTERING OPERATIONS
  // ===========================================
  describe('Filtering Operations', () => {
    describe('getUnreadHelpRequests', () => {
      it('should return unread help requests for a helper', async () => {
        const unreadRequests = [
          createTestHelpRequest({ id: 'request-1', helperId: 'helper-1', isRead: false }),
          createTestHelpRequest({ id: 'request-2', helperId: 'helper-1', isRead: false })
        ];
        mockRepository.findUnreadByHelper.mockResolvedValue(unreadRequests);

        const result = await helpRequestService.getUnreadHelpRequests('helper-1');

        expect(mockRepository.findUnreadByHelper).toHaveBeenCalledWith('helper-1');
        expect(result).toHaveLength(2);
        result.forEach(request => {
          expect(request.isRead).toBe(false);
          expect(request.helperId).toBe('helper-1');
        });
      });

      it('should return empty array when all requests are read', async () => {
        mockRepository.findUnreadByHelper.mockResolvedValue([]);

        const result = await helpRequestService.getUnreadHelpRequests('helper-1');

        expect(result).toEqual([]);
      });
    });

    describe('getPendingHelpRequests', () => {
      it('should return pending help requests for a helper', async () => {
        const pendingRequests = [
          createTestHelpRequest({
            id: 'request-1',
            helperId: 'helper-1',
            status: HelpRequestStatus.Pending
          }),
          createTestHelpRequest({
            id: 'request-2',
            helperId: 'helper-1',
            status: HelpRequestStatus.Pending
          })
        ];
        mockRepository.findPendingByHelper.mockResolvedValue(pendingRequests);

        const result = await helpRequestService.getPendingHelpRequests('helper-1');

        expect(mockRepository.findPendingByHelper).toHaveBeenCalledWith('helper-1');
        expect(result).toHaveLength(2);
        result.forEach(request => {
          expect(request.status).toBe(HelpRequestStatus.Pending);
          expect(request.helperId).toBe('helper-1');
        });
      });

      it('should return empty array when no pending requests', async () => {
        mockRepository.findPendingByHelper.mockResolvedValue([]);

        const result = await helpRequestService.getPendingHelpRequests('helper-1');

        expect(result).toEqual([]);
      });
    });
  });

  // ===========================================
  // STATUS MANAGEMENT
  // ===========================================
  describe('Status Management', () => {
    describe('markAsRead', () => {
      it('should mark help request as read', async () => {
        const readRequest = createTestHelpRequest({
          id: 'request-1',
          isRead: true,
          readAt: new Date()
        });
        mockRepository.markAsRead.mockResolvedValue(readRequest);

        const result = await helpRequestService.markAsRead('request-1');

        expect(mockRepository.markAsRead).toHaveBeenCalledWith('request-1');
        expect(result.isRead).toBe(true);
        expect(result.readAt).toBeDefined();
      });

      it('should propagate errors when marking as read', async () => {
        mockRepository.markAsRead.mockRejectedValue(new Error('Erro ao marcar como lido'));

        await expect(helpRequestService.markAsRead('request-1'))
          .rejects.toThrow('Erro ao marcar como lido');
      });
    });

    describe('acceptHelpRequest', () => {
      it('should accept help request with response', async () => {
        const acceptedRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Accepted,
          resposta: 'Aceito, vou avaliar o caso',
          dataResposta: new Date(),
          isRead: true
        });
        mockRepository.accept.mockResolvedValue(acceptedRequest);

        const result = await helpRequestService.acceptHelpRequest(
          'request-1',
          'Aceito, vou avaliar o caso'
        );

        expect(mockRepository.accept).toHaveBeenCalledWith(
          'request-1',
          'Aceito, vou avaliar o caso'
        );
        expect(result.status).toBe(HelpRequestStatus.Accepted);
        expect(result.resposta).toBe('Aceito, vou avaliar o caso');
        expect(result.dataResposta).toBeDefined();
        expect(result.isRead).toBe(true);
      });

      it('should accept help request without response', async () => {
        const acceptedRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Accepted,
          dataResposta: new Date(),
          isRead: true
        });
        mockRepository.accept.mockResolvedValue(acceptedRequest);

        const result = await helpRequestService.acceptHelpRequest('request-1');

        expect(mockRepository.accept).toHaveBeenCalledWith('request-1', undefined);
        expect(result.status).toBe(HelpRequestStatus.Accepted);
      });

      it('should propagate errors when accepting', async () => {
        mockRepository.accept.mockRejectedValue(new Error('Erro ao aceitar'));

        await expect(helpRequestService.acceptHelpRequest('request-1', 'Aceito'))
          .rejects.toThrow('Erro ao aceitar');
      });
    });

    describe('declineHelpRequest', () => {
      it('should decline help request with reason', async () => {
        const declinedRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Declined,
          resposta: 'Não tenho disponibilidade no momento',
          dataResposta: new Date(),
          isRead: true
        });
        mockRepository.decline.mockResolvedValue(declinedRequest);

        const result = await helpRequestService.declineHelpRequest(
          'request-1',
          'Não tenho disponibilidade no momento'
        );

        expect(mockRepository.decline).toHaveBeenCalledWith(
          'request-1',
          'Não tenho disponibilidade no momento'
        );
        expect(result.status).toBe(HelpRequestStatus.Declined);
        expect(result.resposta).toBe('Não tenho disponibilidade no momento');
        expect(result.dataResposta).toBeDefined();
        expect(result.isRead).toBe(true);
      });

      it('should propagate errors when declining', async () => {
        mockRepository.decline.mockRejectedValue(new Error('Erro ao recusar'));

        await expect(helpRequestService.declineHelpRequest('request-1', 'Motivo'))
          .rejects.toThrow('Erro ao recusar');
      });
    });

    describe('resolveHelpRequest', () => {
      it('should resolve help request with observations', async () => {
        const resolvedRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Resolved,
          observacoes: 'Caso resolvido com sucesso após avaliação'
        });
        mockRepository.resolve.mockResolvedValue(resolvedRequest);

        const result = await helpRequestService.resolveHelpRequest(
          'request-1',
          'Caso resolvido com sucesso após avaliação'
        );

        expect(mockRepository.resolve).toHaveBeenCalledWith(
          'request-1',
          'Caso resolvido com sucesso após avaliação'
        );
        expect(result.status).toBe(HelpRequestStatus.Resolved);
        expect(result.observacoes).toBe('Caso resolvido com sucesso após avaliação');
      });

      it('should resolve help request without observations', async () => {
        const resolvedRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Resolved
        });
        mockRepository.resolve.mockResolvedValue(resolvedRequest);

        const result = await helpRequestService.resolveHelpRequest('request-1');

        expect(mockRepository.resolve).toHaveBeenCalledWith('request-1', undefined);
        expect(result.status).toBe(HelpRequestStatus.Resolved);
      });

      it('should propagate errors when resolving', async () => {
        mockRepository.resolve.mockRejectedValue(new Error('Erro ao resolver'));

        await expect(helpRequestService.resolveHelpRequest('request-1'))
          .rejects.toThrow('Erro ao resolver');
      });
    });

    describe('cancelHelpRequest', () => {
      it('should cancel help request', async () => {
        const cancelledRequest = createTestHelpRequest({
          id: 'request-1',
          status: HelpRequestStatus.Cancelled
        });
        mockRepository.cancel.mockResolvedValue(cancelledRequest);

        const result = await helpRequestService.cancelHelpRequest('request-1');

        expect(mockRepository.cancel).toHaveBeenCalledWith('request-1');
        expect(result.status).toBe(HelpRequestStatus.Cancelled);
      });

      it('should propagate errors when cancelling', async () => {
        mockRepository.cancel.mockRejectedValue(new Error('Erro ao cancelar'));

        await expect(helpRequestService.cancelHelpRequest('request-1'))
          .rejects.toThrow('Erro ao cancelar');
      });
    });
  });

  // ===========================================
  // COUNT OPERATIONS
  // ===========================================
  describe('Count Operations', () => {
    describe('getUnreadCount', () => {
      it('should return count of unread help requests', async () => {
        mockRepository.countUnreadByHelper.mockResolvedValue(5);

        const result = await helpRequestService.getUnreadCount('helper-1');

        expect(mockRepository.countUnreadByHelper).toHaveBeenCalledWith('helper-1');
        expect(result).toBe(5);
      });

      it('should return zero when no unread requests', async () => {
        mockRepository.countUnreadByHelper.mockResolvedValue(0);

        const result = await helpRequestService.getUnreadCount('helper-1');

        expect(result).toBe(0);
      });

      it('should propagate repository errors', async () => {
        mockRepository.countUnreadByHelper.mockRejectedValue(new Error('Erro ao contar'));

        await expect(helpRequestService.getUnreadCount('helper-1'))
          .rejects.toThrow('Erro ao contar');
      });
    });

    describe('getPendingCount', () => {
      it('should return count of pending help requests', async () => {
        mockRepository.countPendingByHelper.mockResolvedValue(3);

        const result = await helpRequestService.getPendingCount('helper-1');

        expect(mockRepository.countPendingByHelper).toHaveBeenCalledWith('helper-1');
        expect(result).toBe(3);
      });

      it('should return zero when no pending requests', async () => {
        mockRepository.countPendingByHelper.mockResolvedValue(0);

        const result = await helpRequestService.getPendingCount('helper-1');

        expect(result).toBe(0);
      });

      it('should propagate repository errors', async () => {
        mockRepository.countPendingByHelper.mockRejectedValue(new Error('Erro ao contar'));

        await expect(helpRequestService.getPendingCount('helper-1'))
          .rejects.toThrow('Erro ao contar');
      });
    });
  });

  // ===========================================
  // UPDATE OPERATIONS
  // ===========================================
  describe('Update Operations', () => {
    describe('updateHelpRequest', () => {
      it('should update help request priority', async () => {
        const updatedRequest = createTestHelpRequest({
          id: 'request-1',
          prioridade: HelpRequestPriority.Urgent
        });
        mockRepository.update.mockResolvedValue(updatedRequest);

        const result = await helpRequestService.updateHelpRequest('request-1', {
          prioridade: HelpRequestPriority.Urgent
        });

        expect(mockRepository.update).toHaveBeenCalledWith('request-1', {
          prioridade: HelpRequestPriority.Urgent
        });
        expect(result.prioridade).toBe(HelpRequestPriority.Urgent);
      });

      it('should update help request description', async () => {
        const updatedRequest = createTestHelpRequest({
          id: 'request-1',
          descricao: 'Nova descrição atualizada'
        });
        mockRepository.update.mockResolvedValue(updatedRequest);

        const result = await helpRequestService.updateHelpRequest('request-1', {
          descricao: 'Nova descrição atualizada'
        });

        expect(result.descricao).toBe('Nova descrição atualizada');
      });

      it('should update multiple fields at once', async () => {
        const updates: Partial<HelpRequest> = {
          prioridade: HelpRequestPriority.High,
          descricao: 'Descrição atualizada',
          motivo: 'Motivo atualizado'
        };
        const updatedRequest = createTestHelpRequest(updates);
        mockRepository.update.mockResolvedValue(updatedRequest);

        const result = await helpRequestService.updateHelpRequest('request-1', updates);

        expect(mockRepository.update).toHaveBeenCalledWith('request-1', updates);
        expect(result.prioridade).toBe(HelpRequestPriority.High);
        expect(result.descricao).toBe('Descrição atualizada');
        expect(result.motivo).toBe('Motivo atualizado');
      });

      it('should propagate update errors', async () => {
        mockRepository.update.mockRejectedValue(new Error('Erro ao atualizar'));

        await expect(helpRequestService.updateHelpRequest('request-1', { motivo: 'Novo' }))
          .rejects.toThrow('Erro ao atualizar');
      });
    });
  });

  // ===========================================
  // PRIORITY MANAGEMENT
  // ===========================================
  describe('Priority Management', () => {
    it('should handle low priority requests', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        prioridade: HelpRequestPriority.Low
      };
      const lowPriorityRequest = createTestHelpRequest({
        prioridade: HelpRequestPriority.Low
      });
      mockRepository.create.mockResolvedValue(lowPriorityRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.prioridade).toBe(HelpRequestPriority.Low);
    });

    it('should handle normal priority requests', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        prioridade: HelpRequestPriority.Normal
      };
      const normalPriorityRequest = createTestHelpRequest({
        prioridade: HelpRequestPriority.Normal
      });
      mockRepository.create.mockResolvedValue(normalPriorityRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.prioridade).toBe(HelpRequestPriority.Normal);
    });

    it('should handle high priority requests', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        prioridade: HelpRequestPriority.High
      };
      const highPriorityRequest = createTestHelpRequest({
        prioridade: HelpRequestPriority.High
      });
      mockRepository.create.mockResolvedValue(highPriorityRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.prioridade).toBe(HelpRequestPriority.High);
    });

    it('should handle urgent priority requests', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        prioridade: HelpRequestPriority.Urgent
      };
      const urgentPriorityRequest = createTestHelpRequest({
        prioridade: HelpRequestPriority.Urgent
      });
      mockRepository.create.mockResolvedValue(urgentPriorityRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.prioridade).toBe(HelpRequestPriority.Urgent);
    });

    it('should allow priority changes', async () => {
      const updatedRequest = createTestHelpRequest({
        prioridade: HelpRequestPriority.Urgent
      });
      mockRepository.update.mockResolvedValue(updatedRequest);

      const result = await helpRequestService.updateHelpRequest('request-1', {
        prioridade: HelpRequestPriority.Urgent
      });

      expect(result.prioridade).toBe(HelpRequestPriority.Urgent);
    });
  });

  // ===========================================
  // LIFECYCLE SCENARIOS
  // ===========================================
  describe('Help Request Lifecycle', () => {
    it('should handle complete lifecycle: create -> read -> accept -> resolve', async () => {
      // Create
      const requestData = createTestHelpRequestData();
      const createdRequest = createTestHelpRequest({
        status: HelpRequestStatus.Pending,
        isRead: false
      });
      mockRepository.create.mockResolvedValue(createdRequest);

      const created = await helpRequestService.createHelpRequest(requestData);
      expect(created.status).toBe(HelpRequestStatus.Pending);
      expect(created.isRead).toBe(false);

      // Mark as read
      const readRequest = { ...created, isRead: true, readAt: new Date() };
      mockRepository.markAsRead.mockResolvedValue(readRequest);

      const read = await helpRequestService.markAsRead(created.id);
      expect(read.isRead).toBe(true);
      expect(read.readAt).toBeDefined();

      // Accept
      const acceptedRequest = {
        ...read,
        status: HelpRequestStatus.Accepted,
        resposta: 'Aceito',
        dataResposta: new Date()
      };
      mockRepository.accept.mockResolvedValue(acceptedRequest);

      const accepted = await helpRequestService.acceptHelpRequest(created.id, 'Aceito');
      expect(accepted.status).toBe(HelpRequestStatus.Accepted);
      expect(accepted.resposta).toBe('Aceito');

      // Resolve
      const resolvedRequest = {
        ...accepted,
        status: HelpRequestStatus.Resolved,
        observacoes: 'Caso resolvido'
      };
      mockRepository.resolve.mockResolvedValue(resolvedRequest);

      const resolved = await helpRequestService.resolveHelpRequest(
        created.id,
        'Caso resolvido'
      );
      expect(resolved.status).toBe(HelpRequestStatus.Resolved);
      expect(resolved.observacoes).toBe('Caso resolvido');
    });

    it('should handle lifecycle: create -> read -> decline', async () => {
      // Create
      const requestData = createTestHelpRequestData();
      const createdRequest = createTestHelpRequest();
      mockRepository.create.mockResolvedValue(createdRequest);

      const created = await helpRequestService.createHelpRequest(requestData);

      // Mark as read
      const readRequest = { ...created, isRead: true, readAt: new Date() };
      mockRepository.markAsRead.mockResolvedValue(readRequest);

      await helpRequestService.markAsRead(created.id);

      // Decline
      const declinedRequest = {
        ...readRequest,
        status: HelpRequestStatus.Declined,
        resposta: 'Sem disponibilidade'
      };
      mockRepository.decline.mockResolvedValue(declinedRequest);

      const declined = await helpRequestService.declineHelpRequest(
        created.id,
        'Sem disponibilidade'
      );
      expect(declined.status).toBe(HelpRequestStatus.Declined);
    });

    it('should handle lifecycle: create -> cancel', async () => {
      // Create
      const requestData = createTestHelpRequestData();
      const createdRequest = createTestHelpRequest();
      mockRepository.create.mockResolvedValue(createdRequest);

      const created = await helpRequestService.createHelpRequest(requestData);

      // Cancel
      const cancelledRequest = {
        ...created,
        status: HelpRequestStatus.Cancelled
      };
      mockRepository.cancel.mockResolvedValue(cancelledRequest);

      const cancelled = await helpRequestService.cancelHelpRequest(created.id);
      expect(cancelled.status).toBe(HelpRequestStatus.Cancelled);
    });
  });

  // ===========================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent read operations', async () => {
      const request1 = createTestHelpRequest({ id: 'request-1' });
      const request2 = createTestHelpRequest({ id: 'request-2' });

      mockRepository.findById
        .mockResolvedValueOnce(request1)
        .mockResolvedValueOnce(request2);

      const [result1, result2] = await Promise.all([
        helpRequestService.getHelpRequestById('request-1'),
        helpRequestService.getHelpRequestById('request-2')
      ]);

      expect(result1?.id).toBe('request-1');
      expect(result2?.id).toBe('request-2');
      expect(mockRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in text fields', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        motivo: 'Motivo com "aspas" e <tags>',
        descricao: 'Descrição com caracteres especiais: @#$%'
      };
      const createdRequest = createTestHelpRequest({
        motivo: 'Motivo com "aspas" e <tags>',
        descricao: 'Descrição com caracteres especiais: @#$%'
      });
      mockRepository.create.mockResolvedValue(createdRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.motivo).toBe('Motivo com "aspas" e <tags>');
      expect(result.descricao).toBe('Descrição com caracteres especiais: @#$%');
    });

    it('should handle unicode characters in professional names', async () => {
      const requestData = {
        ...createTestHelpRequestData(),
        requesterName: 'José María García',
        helperName: 'François Müller',
        assistidoNome: 'João São Paulo'
      };
      const createdRequest = createTestHelpRequest({
        requesterName: 'José María García',
        helperName: 'François Müller',
        assistidoNome: 'João São Paulo'
      });
      mockRepository.create.mockResolvedValue(createdRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.requesterName).toBe('José María García');
      expect(result.helperName).toBe('François Müller');
      expect(result.assistidoNome).toBe('João São Paulo');
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(5000);
      const requestData = {
        ...createTestHelpRequestData(),
        descricao: longDescription
      };
      const createdRequest = createTestHelpRequest({
        descricao: longDescription
      });
      mockRepository.create.mockResolvedValue(createdRequest);

      const result = await helpRequestService.createHelpRequest(requestData);

      expect(result.descricao).toBe(longDescription);
      expect(result.descricao.length).toBe(5000);
    });

    it('should handle empty response when accepting', async () => {
      const acceptedRequest = createTestHelpRequest({
        status: HelpRequestStatus.Accepted,
        resposta: '',
        dataResposta: new Date()
      });
      mockRepository.accept.mockResolvedValue(acceptedRequest);

      const result = await helpRequestService.acceptHelpRequest('request-1', '');

      expect(result.status).toBe(HelpRequestStatus.Accepted);
      expect(result.resposta).toBe('');
    });

    it('should handle multiple status changes', async () => {
      // Accept
      const acceptedRequest = createTestHelpRequest({
        status: HelpRequestStatus.Accepted
      });
      mockRepository.accept.mockResolvedValue(acceptedRequest);

      const accepted = await helpRequestService.acceptHelpRequest('request-1');
      expect(accepted.status).toBe(HelpRequestStatus.Accepted);

      // Resolve
      const resolvedRequest = createTestHelpRequest({
        status: HelpRequestStatus.Resolved
      });
      mockRepository.resolve.mockResolvedValue(resolvedRequest);

      const resolved = await helpRequestService.resolveHelpRequest('request-1');
      expect(resolved.status).toBe(HelpRequestStatus.Resolved);
    });
  });

  // ===========================================
  // INTEGRATION SCENARIOS
  // ===========================================
  describe('Integration Scenarios', () => {
    it('should filter requests by helper and status', async () => {
      const pendingRequests = [
        createTestHelpRequest({
          id: 'request-1',
          helperId: 'helper-1',
          status: HelpRequestStatus.Pending
        }),
        createTestHelpRequest({
          id: 'request-2',
          helperId: 'helper-1',
          status: HelpRequestStatus.Pending
        })
      ];
      mockRepository.findPendingByHelper.mockResolvedValue(pendingRequests);

      const result = await helpRequestService.getPendingHelpRequests('helper-1');

      expect(result).toHaveLength(2);
      result.forEach(request => {
        expect(request.helperId).toBe('helper-1');
        expect(request.status).toBe(HelpRequestStatus.Pending);
      });
    });

    it('should track unread count changes', async () => {
      // Initially 5 unread
      mockRepository.countUnreadByHelper.mockResolvedValue(5);
      let count = await helpRequestService.getUnreadCount('helper-1');
      expect(count).toBe(5);

      // After marking one as read, should be 4
      mockRepository.countUnreadByHelper.mockResolvedValue(4);
      count = await helpRequestService.getUnreadCount('helper-1');
      expect(count).toBe(4);
    });

    it('should track pending count changes', async () => {
      // Initially 3 pending
      mockRepository.countPendingByHelper.mockResolvedValue(3);
      let count = await helpRequestService.getPendingCount('helper-1');
      expect(count).toBe(3);

      // After accepting one, should be 2
      mockRepository.countPendingByHelper.mockResolvedValue(2);
      count = await helpRequestService.getPendingCount('helper-1');
      expect(count).toBe(2);
    });

    it('should handle multiple professionals collaborating on same assistido', async () => {
      const requests = [
        createTestHelpRequest({
          id: 'request-1',
          requesterId: 'professional-1',
          helperId: 'professional-2',
          assistidoId: 'assistido-1',
          fichaId: 'ficha-1'
        }),
        createTestHelpRequest({
          id: 'request-2',
          requesterId: 'professional-2',
          helperId: 'professional-3',
          assistidoId: 'assistido-1',
          fichaId: 'ficha-1'
        })
      ];
      mockRepository.findByFicha.mockResolvedValue(requests);

      const result = await helpRequestService.getHelpRequestsByFicha('ficha-1');

      expect(result).toHaveLength(2);
      result.forEach(request => {
        expect(request.assistidoId).toBe('assistido-1');
        expect(request.fichaId).toBe('ficha-1');
      });
    });
  });
});
