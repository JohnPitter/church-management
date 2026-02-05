// Unit Tests - LeadershipService
// Tests for leadership management business logic

import { LeadershipService } from '../LeadershipService';
import { Leader, LeaderRole, LeaderStatus } from '../../../domain/entities/Leader';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';

// Get the mocked Timestamp from the jest mock
const { Timestamp } = jest.requireMock('firebase/firestore');

// Mock Firebase modules
jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    })),
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: (Date.now() % 1000) * 1000000
    }))
  }
}));

describe('LeadershipService', () => {
  let service: LeadershipService;

  // Helper to create test leader data
  const createTestLeader = (overrides: Partial<Leader> = {}): Leader => ({
    id: '1',
    nome: 'Pastor João Silva',
    cargo: LeaderRole.Pastor,
    ministerio: 'Ministério de Louvor',
    bio: 'Pastor há 10 anos',
    foto: 'https://example.com/photo.jpg',
    email: 'joao@igreja.com',
    telefone: '(11) 98765-4321',
    ordem: 0,
    status: LeaderStatus.Ativo,
    dataCadastro: new Date('2024-01-01'),
    dataAtualizacao: new Date('2024-01-01'),
    criadoPor: 'admin',
    ...overrides
  });

  // Helper to create mock Firestore document snapshot
  const createMockDocSnapshot = (data: any, exists = true) => ({
    id: data?.id || '1',
    exists: () => exists,
    data: () => {
      if (!exists) return undefined;
      const { id, ...rest } = data;
      return {
        ...rest,
        dataCadastro: data.dataCadastro ? Timestamp.fromDate(data.dataCadastro) : Timestamp.now(),
        dataAtualizacao: data.dataAtualizacao ? Timestamp.fromDate(data.dataAtualizacao) : Timestamp.now()
      };
    }
  }) as unknown as DocumentSnapshot;

  // Helper to create mock Firestore query snapshot
  const createMockQuerySnapshot = (leaders: Leader[]) => ({
    docs: leaders.map(leader => createMockDocSnapshot(leader))
  }) as unknown as QuerySnapshot;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadershipService();

    // Setup default mocks
    (collection as jest.Mock).mockReturnValue({} as CollectionReference);
    (doc as jest.Mock).mockReturnValue({} as DocumentReference);
    (query as jest.Mock).mockImplementation((...args) => args);
    (orderBy as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
  });

  describe('getAllLeaders', () => {
    it('should return all leaders ordered by ordem', async () => {
      const leaders = [
        createTestLeader({ id: '1', nome: 'Pastor 1', ordem: 0 }),
        createTestLeader({ id: '2', nome: 'Pastor 2', ordem: 1 }),
        createTestLeader({ id: '3', nome: 'Pastor 3', ordem: 2 })
      ];

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(leaders));

      const result = await service.getAllLeaders();

      expect(result).toHaveLength(3);
      expect(result[0].nome).toBe('Pastor 1');
      expect(result[1].nome).toBe('Pastor 2');
      expect(result[2].nome).toBe('Pastor 3');
      expect(orderBy).toHaveBeenCalledWith('ordem', 'asc');
    });

    it('should return empty array when no leaders exist', async () => {
      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot([]));

      const result = await service.getAllLeaders();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should convert Firestore Timestamps to Date objects', async () => {
      const leader = createTestLeader({
        dataCadastro: new Date('2024-01-01'),
        dataAtualizacao: new Date('2024-02-01')
      });

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot([leader]));

      const result = await service.getAllLeaders();

      expect(result[0].dataCadastro).toBeInstanceOf(Date);
      expect(result[0].dataAtualizacao).toBeInstanceOf(Date);
    });

    it('should handle leaders with different roles', async () => {
      const leaders = [
        createTestLeader({ id: '1', cargo: LeaderRole.Pastor }),
        createTestLeader({ id: '2', cargo: LeaderRole.Diacono }),
        createTestLeader({ id: '3', cargo: LeaderRole.Lider })
      ];

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(leaders));

      const result = await service.getAllLeaders();

      expect(result[0].cargo).toBe(LeaderRole.Pastor);
      expect(result[1].cargo).toBe(LeaderRole.Diacono);
      expect(result[2].cargo).toBe(LeaderRole.Lider);
    });
  });

  describe('getActiveLeaders', () => {
    it('should return only active leaders', async () => {
      const activeLeaders = [
        createTestLeader({ id: '1', status: LeaderStatus.Ativo }),
        createTestLeader({ id: '2', status: LeaderStatus.Ativo })
      ];

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(activeLeaders));

      const result = await service.getActiveLeaders();

      expect(result).toHaveLength(2);
      expect(result.every(l => l.status === LeaderStatus.Ativo)).toBe(true);
      expect(where).toHaveBeenCalledWith('status', '==', LeaderStatus.Ativo);
      expect(orderBy).toHaveBeenCalledWith('ordem', 'asc');
    });

    it('should not return inactive or afastado leaders', async () => {
      const activeLeaders = [
        createTestLeader({ id: '1', status: LeaderStatus.Ativo })
      ];

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(activeLeaders));

      const result = await service.getActiveLeaders();

      expect(result).toHaveLength(1);
      expect(result.some(l => l.status === LeaderStatus.Inativo)).toBe(false);
      expect(result.some(l => l.status === LeaderStatus.Afastado)).toBe(false);
    });

    it('should return empty array when no active leaders exist', async () => {
      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot([]));

      const result = await service.getActiveLeaders();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('getLeaderById', () => {
    it('should return a leader by id', async () => {
      const leader = createTestLeader({ id: '123' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('123');
      expect(result?.nome).toBe('Pastor João Silva');
      expect(doc).toHaveBeenCalled();
    });

    it('should return null when leader does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(null, false));

      const result = await service.getLeaderById('non-existent');

      expect(result).toBeNull();
    });

    it('should convert Firestore Timestamps to Date objects', async () => {
      const leader = createTestLeader({
        dataCadastro: new Date('2024-01-01'),
        dataAtualizacao: new Date('2024-02-01')
      });

      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result?.dataCadastro).toBeInstanceOf(Date);
      expect(result?.dataAtualizacao).toBeInstanceOf(Date);
    });

    it('should handle leaders with optional fields', async () => {
      const leader = createTestLeader({
        bio: undefined,
        foto: undefined,
        email: undefined,
        telefone: undefined,
        ministerio: undefined,
        cargoPersonalizado: undefined
      });

      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result).not.toBeNull();
      expect(result?.bio).toBeUndefined();
      expect(result?.foto).toBeUndefined();
    });
  });

  describe('createLeader', () => {
    it('should create a new leader successfully', async () => {
      const newLeaderData = {
        nome: 'Pastor Paulo',
        cargo: LeaderRole.Pastor,
        ministerio: 'Ministério de Ensino',
        bio: 'Pastor dedicado',
        foto: 'photo.jpg',
        email: 'paulo@igreja.com',
        telefone: '(11) 99999-9999',
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      };

      const mockDocRef = { id: 'new-leader-id' } as DocumentReference;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await service.createLeader(newLeaderData);

      expect(result.id).toBe('new-leader-id');
      expect(result.nome).toBe('Pastor Paulo');
      expect(result.cargo).toBe(LeaderRole.Pastor);
      expect(result.dataCadastro).toBeInstanceOf(Date);
      expect(result.dataAtualizacao).toBeInstanceOf(Date);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: 'Pastor Paulo',
          cargo: LeaderRole.Pastor,
          dataCadastro: expect.any(Date),
          dataAtualizacao: expect.any(Date)
        })
      );
    });

    it('should create leader with minimal required fields', async () => {
      const minimalData = {
        nome: 'Líder Simples',
        cargo: LeaderRole.Lider,
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      };

      const mockDocRef = { id: 'minimal-leader-id' } as DocumentReference;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await service.createLeader(minimalData);

      expect(result.id).toBe('minimal-leader-id');
      expect(result.nome).toBe('Líder Simples');
      expect(result.cargo).toBe(LeaderRole.Lider);
    });

    it('should create leader with custom role', async () => {
      const customRoleData = {
        nome: 'Coordenador Especial',
        cargo: LeaderRole.Outro,
        cargoPersonalizado: 'Coordenador de Missões',
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      };

      const mockDocRef = { id: 'custom-role-id' } as DocumentReference;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await service.createLeader(customRoleData);

      expect(result.cargo).toBe(LeaderRole.Outro);
      expect(result.cargoPersonalizado).toBe('Coordenador de Missões');
    });

    it('should set dataCadastro and dataAtualizacao to the same value', async () => {
      const newLeaderData = {
        nome: 'Pastor Teste',
        cargo: LeaderRole.Pastor,
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      };

      const mockDocRef = { id: 'test-id' } as DocumentReference;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await service.createLeader(newLeaderData);

      expect(result.dataCadastro.getTime()).toBe(result.dataAtualizacao.getTime());
    });
  });

  describe('updateLeader', () => {
    it('should update a leader successfully', async () => {
      const updatedData = {
        nome: 'Pastor João Silva Atualizado',
        bio: 'Nova biografia'
      };

      const updatedLeader = createTestLeader({
        ...updatedData,
        dataAtualizacao: new Date()
      });

      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', updatedData);

      expect(result.nome).toBe('Pastor João Silva Atualizado');
      expect(result.bio).toBe('Nova biografia');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nome: 'Pastor João Silva Atualizado',
          bio: 'Nova biografia',
          dataAtualizacao: expect.any(Date)
        })
      );
    });

    it('should update dataAtualizacao when updating a leader', async () => {
      const originalLeader = createTestLeader({
        dataAtualizacao: new Date('2024-01-01')
      });

      const updatedLeader = createTestLeader({
        dataAtualizacao: new Date('2024-02-01')
      });

      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { bio: 'Nova bio' });

      expect(result.dataAtualizacao.getTime()).toBeGreaterThan(originalLeader.dataAtualizacao.getTime());
    });

    it('should not update id field', async () => {
      const updatedLeader = createTestLeader({ id: '1' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      await service.updateLeader('1', { id: 'should-not-change' } as any);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall.id).toBeUndefined();
    });

    it('should not update dataCadastro field', async () => {
      const updatedLeader = createTestLeader({ id: '1' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      await service.updateLeader('1', { dataCadastro: new Date('2025-01-01') } as any);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall.dataCadastro).toBeUndefined();
    });

    it('should update leader status', async () => {
      const updatedLeader = createTestLeader({ status: LeaderStatus.Inativo });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { status: LeaderStatus.Inativo });

      expect(result.status).toBe(LeaderStatus.Inativo);
    });

    it('should update leader role', async () => {
      const updatedLeader = createTestLeader({ cargo: LeaderRole.Diacono });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { cargo: LeaderRole.Diacono });

      expect(result.cargo).toBe(LeaderRole.Diacono);
    });

    it('should update leader photo', async () => {
      const newPhotoUrl = 'https://example.com/new-photo.jpg';
      const updatedLeader = createTestLeader({ foto: newPhotoUrl });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { foto: newPhotoUrl });

      expect(result.foto).toBe(newPhotoUrl);
    });

    it('should update leader ministry', async () => {
      const newMinistry = 'Ministério de Jovens';
      const updatedLeader = createTestLeader({ ministerio: newMinistry });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { ministerio: newMinistry });

      expect(result.ministerio).toBe(newMinistry);
    });

    it('should throw error when leader not found after update', async () => {
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(null, false));

      await expect(service.updateLeader('non-existent', { nome: 'Test' }))
        .rejects.toThrow('Leader not found after update');
    });

    it('should handle partial updates', async () => {
      const updatedLeader = createTestLeader({ telefone: '(11) 91111-1111' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updatedLeader));

      const result = await service.updateLeader('1', { telefone: '(11) 91111-1111' });

      expect(result.telefone).toBe('(11) 91111-1111');
      expect(result.nome).toBe('Pastor João Silva'); // Unchanged
    });
  });

  describe('deleteLeader', () => {
    it('should delete a leader successfully', async () => {
      await service.deleteLeader('1');

      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should call deleteDoc with correct document reference', async () => {
      const mockDocRef = {} as DocumentReference;
      (doc as jest.Mock).mockReturnValue(mockDocRef);

      await service.deleteLeader('123');

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('should handle deletion of non-existent leader', async () => {
      (deleteDoc as jest.Mock).mockRejectedValue(new Error('Document not found'));

      await expect(service.deleteLeader('non-existent')).rejects.toThrow('Document not found');
    });
  });

  describe('reorderLeaders', () => {
    it('should reorder leaders successfully', async () => {
      const orderedIds = ['3', '1', '2'];

      await service.reorderLeaders(orderedIds);

      expect(updateDoc).toHaveBeenCalledTimes(3);
      expect(updateDoc).toHaveBeenNthCalledWith(1, expect.anything(), { ordem: 0 });
      expect(updateDoc).toHaveBeenNthCalledWith(2, expect.anything(), { ordem: 1 });
      expect(updateDoc).toHaveBeenNthCalledWith(3, expect.anything(), { ordem: 2 });
    });

    it('should handle empty array', async () => {
      await service.reorderLeaders([]);

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should handle single leader', async () => {
      await service.reorderLeaders(['1']);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { ordem: 0 });
    });

    it('should assign correct ordem values based on array index', async () => {
      const orderedIds = ['5', '3', '1', '4', '2'];
      const mockDocRef = {} as DocumentReference;
      (doc as jest.Mock).mockReturnValue(mockDocRef);

      await service.reorderLeaders(orderedIds);

      expect(updateDoc).toHaveBeenCalledTimes(5);

      // Verify each call has the correct ordem based on index
      orderedIds.forEach((id, index) => {
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { ordem: index });
      });
    });

    it('should use Promise.all for concurrent updates', async () => {
      const orderedIds = ['1', '2', '3'];
      const originalPromiseAll = Promise.all;
      const promiseAllSpy = jest.spyOn(Promise, 'all');

      await service.reorderLeaders(orderedIds);

      expect(promiseAllSpy).toHaveBeenCalled();

      promiseAllSpy.mockRestore();
      Promise.all = originalPromiseAll;
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors in getAllLeaders', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(service.getAllLeaders()).rejects.toThrow('Firestore error');
    });

    it('should handle Firestore errors in getActiveLeaders', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(service.getActiveLeaders()).rejects.toThrow('Permission denied');
    });

    it('should handle Firestore errors in getLeaderById', async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getLeaderById('1')).rejects.toThrow('Network error');
    });

    it('should handle Firestore errors in createLeader', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Invalid data'));

      const newLeaderData = {
        nome: 'Test',
        cargo: LeaderRole.Pastor,
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      };

      await expect(service.createLeader(newLeaderData)).rejects.toThrow('Invalid data');
    });

    it('should handle Firestore errors in updateLeader', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(service.updateLeader('1', { nome: 'Test' })).rejects.toThrow('Update failed');
    });

    it('should handle Firestore errors in deleteLeader', async () => {
      (deleteDoc as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteLeader('1')).rejects.toThrow('Delete failed');
    });

    it('should handle Firestore errors in reorderLeaders', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Reorder failed'));

      await expect(service.reorderLeaders(['1', '2'])).rejects.toThrow('Reorder failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete leader lifecycle', async () => {
      // Create
      const mockDocRef = { id: 'new-id' } as DocumentReference;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const created = await service.createLeader({
        nome: 'Pastor Lifecycle',
        cargo: LeaderRole.Pastor,
        ordem: 0,
        status: LeaderStatus.Ativo,
        criadoPor: 'admin'
      });

      expect(created.id).toBe('new-id');

      // Read
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(created));
      const fetched = await service.getLeaderById('new-id');
      expect(fetched?.nome).toBe('Pastor Lifecycle');

      // Update
      const updated = createTestLeader({ ...created, nome: 'Pastor Updated' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(updated));
      const result = await service.updateLeader('new-id', { nome: 'Pastor Updated' });
      expect(result.nome).toBe('Pastor Updated');

      // Delete
      await service.deleteLeader('new-id');
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle multiple leaders with different ministries', async () => {
      const leaders = [
        createTestLeader({ id: '1', ministerio: 'Louvor', ordem: 0 }),
        createTestLeader({ id: '2', ministerio: 'Ensino', ordem: 1 }),
        createTestLeader({ id: '3', ministerio: 'Jovens', ordem: 2 }),
        createTestLeader({ id: '4', ministerio: 'Louvor', ordem: 3 })
      ];

      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(leaders));

      const result = await service.getAllLeaders();

      expect(result).toHaveLength(4);
      expect(result.filter(l => l.ministerio === 'Louvor')).toHaveLength(2);
    });

    it('should handle activating and deactivating leaders', async () => {
      const leader = createTestLeader({ status: LeaderStatus.Ativo });

      // Deactivate
      const deactivated = createTestLeader({ status: LeaderStatus.Inativo });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(deactivated));

      const result1 = await service.updateLeader('1', { status: LeaderStatus.Inativo });
      expect(result1.status).toBe(LeaderStatus.Inativo);

      // Reactivate
      const reactivated = createTestLeader({ status: LeaderStatus.Ativo });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(reactivated));

      const result2 = await service.updateLeader('1', { status: LeaderStatus.Ativo });
      expect(result2.status).toBe(LeaderStatus.Ativo);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leaders with very long names', async () => {
      const longName = 'A'.repeat(200);
      const leader = createTestLeader({ nome: longName });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result?.nome).toBe(longName);
      expect(result?.nome.length).toBe(200);
    });

    it('should handle leaders with special characters in names', async () => {
      const specialName = 'Pastor José María d\'Assunção';
      const leader = createTestLeader({ nome: specialName });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result?.nome).toBe(specialName);
    });

    it('should handle empty ministerio field', async () => {
      const leader = createTestLeader({ ministerio: '' });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result?.ministerio).toBe('');
    });

    it('should handle very large ordem values', async () => {
      const leader = createTestLeader({ ordem: 9999 });
      (getDoc as jest.Mock).mockResolvedValue(createMockDocSnapshot(leader));

      const result = await service.getLeaderById('1');

      expect(result?.ordem).toBe(9999);
    });

    it('should handle reordering with duplicate ids', async () => {
      const orderedIds = ['1', '2', '1']; // Duplicate '1'

      await service.reorderLeaders(orderedIds);

      expect(updateDoc).toHaveBeenCalledTimes(3);
    });
  });
});
