// Unit Tests - AssetService
// Comprehensive tests for asset management operations

import { AssetService } from '../AssetService';
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetEntity,
  MaintenanceRecord
} from '@modules/church-management/assets/domain/entities/Asset';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference
} from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock AssetEntity validation
jest.mock('@modules/church-management/assets/domain/entities/Asset', () => {
  const actual = jest.requireActual('@modules/church-management/assets/domain/entities/Asset');
  return {
    ...actual,
    AssetEntity: {
      ...actual.AssetEntity,
      validateAsset: jest.fn()
    }
  };
});

describe('AssetService', () => {
  let assetService: AssetService;
  let mockCollection: jest.Mock;
  let mockDoc: jest.Mock;
  let mockGetDocs: jest.Mock;
  let mockGetDoc: jest.Mock;
  let mockAddDoc: jest.Mock;
  let mockUpdateDoc: jest.Mock;
  let mockDeleteDoc: jest.Mock;
  let mockQuery: jest.Mock;
  let mockWhere: jest.Mock;
  let mockOrderBy: jest.Mock;
  let mockTimestampFromDate: jest.Mock;
  let mockTimestampNow: jest.Mock;

  const createTestAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: 'asset-1',
    name: 'Projetor Epson',
    description: 'Projetor para cultos',
    category: AssetCategory.Electronics,
    acquisitionDate: new Date('2023-01-15'),
    acquisitionValue: 5000,
    currentValue: 4500,
    condition: AssetCondition.Good,
    status: AssetStatus.Active,
    location: 'Salão Principal',
    serialNumber: 'EP123456',
    brand: 'Epson',
    model: 'PowerLite X49',
    images: [],
    invoiceNumber: 'NF-001',
    tags: ['projetor', 'eletrônico'],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides
  });

  const createTestMaintenanceRecord = (overrides: Partial<MaintenanceRecord> = {}): MaintenanceRecord => ({
    id: 'maint-1',
    date: new Date('2024-01-10'),
    description: 'Limpeza e ajuste de lente',
    cost: 150,
    performedBy: 'Técnico João',
    notes: 'Manutenção preventiva',
    ...overrides
  });

  const createMockDocSnapshot = (id: string, data: any, exists: boolean = true) => ({
    id,
    exists: () => exists,
    data: () => data
  });

  const createMockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(doc => createMockDocSnapshot(doc.id, doc.data))
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockCollection = collection as jest.Mock;
    mockDoc = doc as jest.Mock;
    mockGetDocs = getDocs as jest.Mock;
    mockGetDoc = getDoc as jest.Mock;
    mockAddDoc = addDoc as jest.Mock;
    mockUpdateDoc = updateDoc as jest.Mock;
    mockDeleteDoc = deleteDoc as jest.Mock;
    mockQuery = query as jest.Mock;
    mockWhere = where as jest.Mock;
    mockOrderBy = orderBy as jest.Mock;

    // Mock Timestamp
    mockTimestampFromDate = jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }));
    mockTimestampNow = jest.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    }));
    (Timestamp.fromDate as jest.Mock) = mockTimestampFromDate;
    (Timestamp.now as jest.Mock) = mockTimestampNow;

    // Mock return values
    mockCollection.mockReturnValue('mock-collection');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where');
    mockOrderBy.mockReturnValue('mock-orderby');

    // Default validation returns no errors
    (AssetEntity.validateAsset as jest.Mock).mockReturnValue([]);

    assetService = new AssetService();
  });

  describe('getAllAssets', () => {
    it('should fetch all assets ordered by creation date', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor' }),
        createTestAsset({ id: 'asset-2', name: 'Computador' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAllAssets();

      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderby');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Projetor');
      expect(result[1].name).toBe('Computador');
    });

    it('should handle empty asset list', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAllAssets();

      expect(result).toHaveLength(0);
    });

    it('should throw error when fetching fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getAllAssets()).rejects.toThrow('Erro ao buscar patrimônios');
    });

    it('should properly convert Firestore timestamps to dates', async () => {
      const mockAsset = createTestAsset();
      const mockSnapshot = createMockQuerySnapshot([
        {
          id: mockAsset.id,
          data: {
            ...mockAsset,
            acquisitionDate: mockTimestampFromDate(mockAsset.acquisitionDate),
            createdAt: mockTimestampFromDate(mockAsset.createdAt),
            updatedAt: mockTimestampFromDate(mockAsset.updatedAt),
            warrantyExpiryDate: mockTimestampFromDate(new Date('2025-01-15')),
            insuranceExpiryDate: mockTimestampFromDate(new Date('2025-06-15'))
          }
        }
      ]);

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAllAssets();

      expect(result[0].acquisitionDate).toBeInstanceOf(Date);
      expect(result[0].warrantyExpiryDate).toBeInstanceOf(Date);
      expect(result[0].insuranceExpiryDate).toBeInstanceOf(Date);
    });

    it('should handle maintenance records with date conversion', async () => {
      const maintenanceRecord = createTestMaintenanceRecord();
      const mockAsset = createTestAsset({
        maintenanceRecords: [maintenanceRecord]
      });

      const mockSnapshot = createMockQuerySnapshot([
        {
          id: mockAsset.id,
          data: {
            ...mockAsset,
            acquisitionDate: mockTimestampFromDate(mockAsset.acquisitionDate),
            createdAt: mockTimestampFromDate(mockAsset.createdAt),
            updatedAt: mockTimestampFromDate(mockAsset.updatedAt),
            maintenanceRecords: [
              {
                ...maintenanceRecord,
                date: mockTimestampFromDate(maintenanceRecord.date)
              }
            ]
          }
        }
      ]);

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAllAssets();

      expect(result[0].maintenanceRecords).toBeDefined();
      expect(result[0].maintenanceRecords![0].date).toBeInstanceOf(Date);
    });
  });

  describe('getAssetById', () => {
    it('should fetch a single asset by ID', async () => {
      const mockAsset = createTestAsset();
      const mockSnapshot = createMockDocSnapshot(
        mockAsset.id,
        {
          ...mockAsset,
          acquisitionDate: mockTimestampFromDate(mockAsset.acquisitionDate),
          createdAt: mockTimestampFromDate(mockAsset.createdAt),
          updatedAt: mockTimestampFromDate(mockAsset.updatedAt)
        },
        true
      );

      mockGetDoc.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAssetById('asset-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'assets', 'asset-1');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Projetor Epson');
    });

    it('should return null when asset does not exist', async () => {
      const mockSnapshot = createMockDocSnapshot('asset-1', {}, false);
      mockGetDoc.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAssetById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error when fetch fails', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getAssetById('asset-1')).rejects.toThrow('Erro ao buscar patrimônio');
    });
  });

  describe('getAssetsByCategory', () => {
    it('should fetch assets filtered by category', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', category: AssetCategory.Electronics }),
        createTestAsset({ id: 'asset-2', category: AssetCategory.Electronics })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAssetsByCategory(AssetCategory.Electronics);

      expect(mockWhere).toHaveBeenCalledWith('category', '==', AssetCategory.Electronics);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe(AssetCategory.Electronics);
    });

    it('should return empty array when no assets match category', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAssetsByCategory(AssetCategory.Vehicle);

      expect(result).toHaveLength(0);
    });

    it('should throw error when fetch fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getAssetsByCategory(AssetCategory.Electronics))
        .rejects.toThrow('Erro ao buscar patrimônios por categoria');
    });
  });

  describe('getAssetsByStatus', () => {
    it('should fetch assets filtered by status', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', status: AssetStatus.Active }),
        createTestAsset({ id: 'asset-2', status: AssetStatus.Active })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.getAssetsByStatus(AssetStatus.Active);

      expect(mockWhere).toHaveBeenCalledWith('status', '==', AssetStatus.Active);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(AssetStatus.Active);
    });

    it('should handle different status types', async () => {
      const statuses = [
        AssetStatus.Active,
        AssetStatus.Inactive,
        AssetStatus.UnderMaintenance,
        AssetStatus.Sold
      ];

      for (const status of statuses) {
        const mockSnapshot = createMockQuerySnapshot([]);
        mockGetDocs.mockResolvedValue(mockSnapshot);

        await assetService.getAssetsByStatus(status);

        expect(mockWhere).toHaveBeenCalledWith('status', '==', status);
      }
    });

    it('should throw error when fetch fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getAssetsByStatus(AssetStatus.Active))
        .rejects.toThrow('Erro ao buscar patrimônios por status');
    });
  });

  describe('createAsset', () => {
    it('should create a new asset with valid data', async () => {
      const newAsset = createTestAsset();
      delete (newAsset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      const result = await assetService.createAsset(newAsset);

      expect(AssetEntity.validateAsset).toHaveBeenCalledWith(newAsset);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toBe('new-asset-id');
    });

    it('should throw validation error when asset data is invalid', async () => {
      (AssetEntity.validateAsset as jest.Mock).mockReturnValue([
        'Nome é obrigatório',
        'Valor de aquisição é obrigatório'
      ]);

      const invalidAsset = createTestAsset({ name: '', acquisitionValue: -1 });

      await expect(assetService.createAsset(invalidAsset))
        .rejects.toThrow('Nome é obrigatório, Valor de aquisição é obrigatório');
    });

    it('should convert dates to Firestore timestamps', async () => {
      const newAsset = createTestAsset({
        acquisitionDate: new Date('2024-01-15'),
        warrantyExpiryDate: new Date('2025-01-15')
      });
      delete (newAsset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(newAsset);

      expect(mockTimestampFromDate).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should remove undefined values from data', async () => {
      const newAsset = createTestAsset({
        serialNumber: undefined,
        brand: undefined,
        model: undefined
      });
      delete (newAsset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(newAsset);

      expect(mockAddDoc).toHaveBeenCalled();
      const callArgs = mockAddDoc.mock.calls[0][1];
      expect(callArgs.serialNumber).toBeUndefined();
    });

    it('should set createdAt timestamp', async () => {
      const newAsset = createTestAsset();
      delete (newAsset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(newAsset);

      expect(mockTimestampNow).toHaveBeenCalled();
    });

    it('should handle maintenance records conversion', async () => {
      const maintenanceRecord = createTestMaintenanceRecord();
      const newAsset = createTestAsset({
        maintenanceRecords: [maintenanceRecord]
      });
      delete (newAsset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(newAsset);

      expect(mockTimestampFromDate).toHaveBeenCalledWith(maintenanceRecord.date);
    });

    it('should throw error when creation fails', async () => {
      const newAsset = createTestAsset();
      mockAddDoc.mockRejectedValue(new Error('Erro ao criar patrimônio'));

      await expect(assetService.createAsset(newAsset))
        .rejects.toThrow('Erro ao criar patrimônio');
    });
  });

  describe('updateAsset', () => {
    it('should update an existing asset', async () => {
      const updateData: Partial<Asset> = {
        name: 'Projetor Atualizado',
        currentValue: 4000,
        condition: AssetCondition.Fair
      };

      mockUpdateDoc.mockResolvedValue(undefined);

      await assetService.updateAsset('asset-1', updateData);

      expect(AssetEntity.validateAsset).toHaveBeenCalledWith(updateData);
      expect(mockDoc).toHaveBeenCalledWith({}, 'assets', 'asset-1');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw validation error when update data is invalid', async () => {
      (AssetEntity.validateAsset as jest.Mock).mockReturnValue([
        'Valor atual não pode ser negativo'
      ]);

      const invalidUpdate = { currentValue: -100 };

      await expect(assetService.updateAsset('asset-1', invalidUpdate))
        .rejects.toThrow('Valor atual não pode ser negativo');
    });

    it('should update timestamps automatically', async () => {
      const updateData: Partial<Asset> = {
        name: 'Projetor Atualizado'
      };

      mockUpdateDoc.mockResolvedValue(undefined);

      await assetService.updateAsset('asset-1', updateData);

      expect(mockTimestampNow).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const updateData: Partial<Asset> = {
        location: 'Sala 2'
      };

      mockUpdateDoc.mockResolvedValue(undefined);

      await assetService.updateAsset('asset-1', updateData);

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const updateData: Partial<Asset> = { name: 'Updated' };
      mockUpdateDoc.mockRejectedValue(new Error('Erro ao atualizar patrimônio'));

      await expect(assetService.updateAsset('asset-1', updateData))
        .rejects.toThrow('Erro ao atualizar patrimônio');
    });
  });

  describe('deleteAsset', () => {
    it('should delete an asset by ID', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await assetService.deleteAsset('asset-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'assets', 'asset-1');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should throw error when deletion fails', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.deleteAsset('asset-1'))
        .rejects.toThrow('Erro ao excluir patrimônio');
    });
  });

  describe('updateAssetStatus', () => {
    it('should update asset status', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await assetService.updateAssetStatus('asset-1', AssetStatus.UnderMaintenance, 'admin');

      expect(mockDoc).toHaveBeenCalledWith({}, 'assets', 'asset-1');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        status: AssetStatus.UnderMaintenance,
        updatedAt: expect.anything(),
        updatedBy: 'admin'
      });
    });

    it('should handle different status values', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const statuses = [
        AssetStatus.Active,
        AssetStatus.Inactive,
        AssetStatus.UnderMaintenance,
        AssetStatus.Sold,
        AssetStatus.Donated,
        AssetStatus.Lost,
        AssetStatus.Stolen
      ];

      for (const status of statuses) {
        await assetService.updateAssetStatus('asset-1', status, 'admin');
        expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
          status,
          updatedAt: expect.anything(),
          updatedBy: 'admin'
        });
      }
    });

    it('should throw error when update fails', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.updateAssetStatus('asset-1', AssetStatus.Sold, 'admin'))
        .rejects.toThrow('Erro ao atualizar status do patrimônio');
    });
  });

  describe('updateAssetCondition', () => {
    it('should update asset condition', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await assetService.updateAssetCondition('asset-1', AssetCondition.Fair, 'admin');

      expect(mockDoc).toHaveBeenCalledWith({}, 'assets', 'asset-1');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        condition: AssetCondition.Fair,
        updatedAt: expect.anything(),
        updatedBy: 'admin'
      });
    });

    it('should handle all condition values', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const conditions = [
        AssetCondition.Excellent,
        AssetCondition.Good,
        AssetCondition.Fair,
        AssetCondition.Poor,
        AssetCondition.NeedsRepair
      ];

      for (const condition of conditions) {
        await assetService.updateAssetCondition('asset-1', condition, 'admin');
        expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
          condition,
          updatedAt: expect.anything(),
          updatedBy: 'admin'
        });
      }
    });

    it('should throw error when update fails', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.updateAssetCondition('asset-1', AssetCondition.Poor, 'admin'))
        .rejects.toThrow('Erro ao atualizar condição do patrimônio');
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockAssets = [
        createTestAsset({
          category: AssetCategory.Electronics,
          status: AssetStatus.Active,
          condition: AssetCondition.Good,
          acquisitionValue: 5000,
          currentValue: 4500
        }),
        createTestAsset({
          category: AssetCategory.Electronics,
          status: AssetStatus.Active,
          condition: AssetCondition.Excellent,
          acquisitionValue: 3000,
          currentValue: 2800
        }),
        createTestAsset({
          category: AssetCategory.Furniture,
          status: AssetStatus.Inactive,
          condition: AssetCondition.Fair,
          acquisitionValue: 2000,
          currentValue: 1500
        })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const stats = await assetService.getStatistics();

      expect(stats.totalAssets).toBe(3);
      expect(stats.totalValue).toBe(4500 + 2800 + 1500);
      expect(stats.byCategory[AssetCategory.Electronics]).toBe(2);
      expect(stats.byCategory[AssetCategory.Furniture]).toBe(1);
      expect(stats.byStatus[AssetStatus.Active]).toBe(2);
      expect(stats.byStatus[AssetStatus.Inactive]).toBe(1);
      expect(stats.byCondition[AssetCondition.Good]).toBe(1);
      expect(stats.byCondition[AssetCondition.Excellent]).toBe(1);
      expect(stats.byCondition[AssetCondition.Fair]).toBe(1);
    });

    it('should use acquisition value when current value is not set', async () => {
      const mockAssets = [
        createTestAsset({
          acquisitionValue: 5000,
          currentValue: undefined
        })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const stats = await assetService.getStatistics();

      expect(stats.totalValue).toBe(5000);
    });

    it('should initialize all category counters', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const stats = await assetService.getStatistics();

      Object.values(AssetCategory).forEach(category => {
        expect(stats.byCategory[category]).toBe(0);
      });
    });

    it('should initialize all status counters', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const stats = await assetService.getStatistics();

      Object.values(AssetStatus).forEach(status => {
        expect(stats.byStatus[status]).toBe(0);
      });
    });

    it('should initialize all condition counters', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const stats = await assetService.getStatistics();

      Object.values(AssetCondition).forEach(condition => {
        expect(stats.byCondition[condition]).toBe(0);
      });
    });

    it('should throw error when statistics fetch fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getStatistics())
        .rejects.toThrow('Erro ao buscar estatísticas de patrimônio');
    });
  });

  describe('searchAssets', () => {
    it('should search assets by name', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor Epson', brand: 'Epson' }),
        createTestAsset({ id: 'asset-2', name: 'Computador Dell', brand: 'Dell' }),
        createTestAsset({ id: 'asset-3', name: 'Projetor Sony', brand: 'Sony' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('projetor');

      expect(result.length).toBeGreaterThanOrEqual(2);
      const projetorAssets = result.filter(a => a.name.toLowerCase().includes('projetor'));
      expect(projetorAssets.length).toBe(2);
    });

    it('should search assets by description', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', description: 'Equipamento para cultos' }),
        createTestAsset({ id: 'asset-2', description: 'Móvel para escritório' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('cultos');

      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('cultos');
    });

    it('should search assets by location', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', location: 'Salão Principal' }),
        createTestAsset({ id: 'asset-2', location: 'Sala de Reuniões' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('salão');

      expect(result).toHaveLength(1);
      expect(result[0].location).toContain('Salão');
    });

    it('should search assets by serial number', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', serialNumber: 'EP123456' }),
        createTestAsset({ id: 'asset-2', serialNumber: 'DL789012' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('EP123');

      expect(result).toHaveLength(1);
      expect(result[0].serialNumber).toContain('EP123');
    });

    it('should search assets by brand', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor A', brand: 'Epson', model: 'X49' }),
        createTestAsset({ id: 'asset-2', name: 'Computador B', brand: 'Dell', model: 'Latitude' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('epson');

      expect(result.length).toBeGreaterThanOrEqual(1);
      const epsonAssets = result.filter(a => a.brand?.toLowerCase().includes('epson'));
      expect(epsonAssets.length).toBe(1);
    });

    it('should search assets by model', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', model: 'PowerLite X49' }),
        createTestAsset({ id: 'asset-2', model: 'Latitude 5420' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('PowerLite');

      expect(result).toHaveLength(1);
      expect(result[0].model).toContain('PowerLite');
    });

    it('should search assets by tags', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Asset Tag 1', brand: 'Brand1', model: 'Model1', tags: ['projetor', 'eletrônico'] }),
        createTestAsset({ id: 'asset-2', name: 'Asset Tag 2', brand: 'Brand2', model: 'Model2', tags: ['computador', 'eletrônico'] })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('projetor');

      const assetsWithProjetorTag = result.filter(a => a.tags?.some(tag => tag.toLowerCase().includes('projetor')));
      expect(assetsWithProjetorTag.length).toBe(1);
      expect(assetsWithProjetorTag[0].tags).toContain('projetor');
    });

    it('should be case insensitive', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor Epson' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result1 = await assetService.searchAssets('PROJETOR');
      const result2 = await assetService.searchAssets('projetor');
      const result3 = await assetService.searchAssets('PrOjEtOr');

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);
    });

    it('should return empty array when no matches found', async () => {
      const mockAssets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor' })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should handle optional fields gracefully', async () => {
      const mockAssets = [
        createTestAsset({
          id: 'asset-1',
          serialNumber: undefined,
          brand: undefined,
          model: undefined,
          tags: undefined
        })
      ];

      const mockSnapshot = createMockQuerySnapshot(
        mockAssets.map(asset => ({
          id: asset.id,
          data: {
            ...asset,
            acquisitionDate: mockTimestampFromDate(asset.acquisitionDate),
            createdAt: mockTimestampFromDate(asset.createdAt),
            updatedAt: mockTimestampFromDate(asset.updatedAt)
          }
        }))
      );

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const result = await assetService.searchAssets('projetor');

      expect(result).toHaveLength(1);
    });

    it('should throw error when search fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.searchAssets('projetor'))
        .rejects.toThrow('Erro ao buscar patrimônios');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle assets with minimal required fields', async () => {
      const minimalAsset: Partial<Asset> = {
        name: 'Asset Mínimo',
        category: AssetCategory.Other,
        acquisitionDate: new Date(),
        acquisitionValue: 100,
        condition: AssetCondition.Good,
        status: AssetStatus.Active,
        location: 'Local',
        createdBy: 'user',
        updatedBy: 'user'
      };

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      const result = await assetService.createAsset(minimalAsset);

      expect(result).toBe('new-asset-id');
    });

    it('should handle empty tags array', async () => {
      const assetWithEmptyTags = createTestAsset({ tags: [] });
      delete (assetWithEmptyTags as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(assetWithEmptyTags);

      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle assets without images', async () => {
      const assetWithoutImages = createTestAsset({ images: [] });
      delete (assetWithoutImages as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(assetWithoutImages);

      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle null optional fields conversion', async () => {
      const asset = createTestAsset({
        warrantyExpiryDate: undefined,
        insuranceExpiryDate: undefined,
        lastMaintenanceDate: undefined,
        nextMaintenanceDate: undefined
      });
      delete (asset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(asset);

      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle console errors properly', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(assetService.getAllAssets()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching assets:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Conversion', () => {
    it('should convert asset to Firestore format correctly', async () => {
      const asset = createTestAsset({
        acquisitionDate: new Date('2024-01-15'),
        warrantyExpiryDate: new Date('2025-01-15'),
        insuranceExpiryDate: new Date('2025-06-15'),
        lastMaintenanceDate: new Date('2024-06-01'),
        nextMaintenanceDate: new Date('2024-12-01')
      });
      delete (asset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(asset);

      expect(mockTimestampFromDate).toHaveBeenCalledWith(asset.acquisitionDate);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(asset.warrantyExpiryDate);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(asset.insuranceExpiryDate);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(asset.lastMaintenanceDate);
      expect(mockTimestampFromDate).toHaveBeenCalledWith(asset.nextMaintenanceDate);
    });

    it('should handle empty maintenance records array', async () => {
      const asset = createTestAsset({ maintenanceRecords: [] });
      delete (asset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(asset);

      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should convert multiple maintenance records', async () => {
      const records = [
        createTestMaintenanceRecord({ id: 'maint-1' }),
        createTestMaintenanceRecord({ id: 'maint-2' }),
        createTestMaintenanceRecord({ id: 'maint-3' })
      ];

      const asset = createTestAsset({ maintenanceRecords: records });
      delete (asset as any).id;

      mockAddDoc.mockResolvedValue({ id: 'new-asset-id' } as DocumentReference);

      await assetService.createAsset(asset);

      expect(mockTimestampFromDate).toHaveBeenCalledTimes(4); // acquisition date + 3 maintenance dates
    });
  });
});
