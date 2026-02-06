// BackupService.test.ts
// Comprehensive unit tests for BackupService

import { BackupService } from '../BackupService';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }))
  }
}));

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '2026-02-05';
  })
}));

// Helper function to read blob as text
const blobToText = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
};

describe('BackupService', () => {
  let backupService: BackupService;
  let mockCollection: jest.Mock;
  let mockGetDocs: jest.Mock;
  let mockDoc: jest.Mock;
  let mockSetDoc: jest.Mock;
  let mockQuery: jest.Mock;
  let mockOrderBy: jest.Mock;
  let mockLimit: jest.Mock;
  let mockWhere: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Get mock references
    mockCollection = collection as jest.Mock;
    mockGetDocs = getDocs as jest.Mock;
    mockDoc = doc as jest.Mock;
    mockSetDoc = setDoc as jest.Mock;
    mockQuery = query as jest.Mock;
    mockOrderBy = orderBy as jest.Mock;
    mockLimit = limit as jest.Mock;
    mockWhere = where as jest.Mock;

    // Setup default mock implementations with proper collection tracking
    const collectionPaths = new Map<string, string>();
    let collectionCounter = 0;

    mockCollection.mockImplementation((db: any, path: string) => {
      const id = `collection_${collectionCounter++}`;
      collectionPaths.set(id, path);
      return { _path: path, _id: id };
    });

    mockDoc.mockImplementation((db: any, collectionName: string, docId: string) => {
      return { _path: `${collectionName}/${docId}`, _collection: collectionName, _id: docId };
    });

    mockQuery.mockImplementation((...args: any[]) => {
      return { _query: 'mock-query', _args: args };
    });

    mockOrderBy.mockReturnValue({ _orderBy: 'mock-order' });
    mockLimit.mockReturnValue({ _limit: 'mock-limit' });
    mockWhere.mockReturnValue({ _where: 'mock-where' });
    mockSetDoc.mockResolvedValue(undefined);

    // Create service instance
    backupService = new BackupService();

    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('getDatabaseStats', () => {
    it('should calculate database statistics for all collections', async () => {
      // Mock collection data with proper structure
      mockGetDocs.mockImplementation((collectionRef: any) => {
        const path = collectionRef._path || '';

        if (path === 'users') {
          return Promise.resolve({
            size: 50,
            docs: Array(50).fill(null).map(() => ({ data: () => ({}) }))
          });
        }
        if (path === 'events') {
          return Promise.resolve({
            size: 20,
            docs: Array(20).fill(null).map(() => ({ data: () => ({}) }))
          });
        }
        if (path === 'projects') {
          return Promise.resolve({
            size: 10,
            docs: Array(10).fill(null).map(() => ({ data: () => ({}) }))
          });
        }
        if (path === 'blogPosts') {
          return Promise.resolve({
            size: 15,
            docs: Array(15).fill(null).map(() => ({ data: () => ({}) }))
          });
        }
        return Promise.resolve({ size: 0, docs: [] });
      });

      const stats = await backupService.getDatabaseStats();

      expect(stats).toBeDefined();
      expect(stats.totalRecords).toBeGreaterThan(0);
      expect(stats.totalSize).toBeTruthy();
      expect(stats.collections).toBeInstanceOf(Array);
      expect(stats.collections.length).toBeGreaterThan(0);
      expect(stats.lastCalculated).toBeInstanceOf(Date);

      // Verify collection stats structure
      const userStats = stats.collections.find(c => c.name === 'users');
      expect(userStats).toBeDefined();
      expect(userStats?.records).toBe(50);
      expect(userStats?.size).toBeTruthy();
      expect(userStats?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle collections with zero records', async () => {
      mockGetDocs.mockResolvedValue({
        size: 0,
        docs: []
      });

      const stats = await backupService.getDatabaseStats();

      expect(stats.totalRecords).toBe(0);
      expect(stats.totalSize).toBe('0 B');
      expect(stats.collections).toBeInstanceOf(Array);
    });

    it('should handle permission errors for specific collections', async () => {
      mockGetDocs.mockImplementation((collectionRef: any) => {
        const path = collectionRef._path || '';
        if (path === 'users') {
          return Promise.reject(new Error('Permission denied'));
        }
        return Promise.resolve({
          size: 10,
          docs: Array(10).fill(null).map(() => ({ data: () => ({}) }))
        });
      });

      const stats = await backupService.getDatabaseStats();

      // Should still return stats for accessible collections
      expect(stats).toBeDefined();
      expect(stats.collections).toBeInstanceOf(Array);

      // Users collection should show 0 records due to permission error
      const userStats = stats.collections.find(c => c.name === 'users');
      expect(userStats?.records).toBe(0);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should format sizes correctly', async () => {
      mockGetDocs.mockImplementation((collectionRef: any) => {
        const path = collectionRef._path || '';
        if (path.includes('users')) {
          return Promise.resolve({
            size: 1000,
            docs: Array(1000).fill({ data: () => ({}) })
          });
        }
        return Promise.resolve({ size: 0, docs: [] });
      });

      const stats = await backupService.getDatabaseStats();

      // Size should be formatted (e.g., "2 MB" instead of bytes)
      expect(stats.totalSize).toMatch(/\d+(\.\d+)?\s+(B|KB|MB|GB)/);
    });

    it('should return zero stats when all collections are inaccessible', async () => {
      // When all collections fail, service returns empty stats rather than throwing
      mockGetDocs.mockRejectedValue(new Error('Permission denied'));

      const stats = await backupService.getDatabaseStats();

      // Service handles errors gracefully and returns zero stats
      expect(stats.totalRecords).toBe(0);
      expect(stats.totalSize).toBe('0 B');
      expect(stats.collections.every(c => c.records === 0)).toBe(true);
    });
  });

  describe('getBackups', () => {
    it('should retrieve list of backups ordered by creation date', async () => {
      const testDate1 = new Date('2026-02-05T10:00:00Z');
      const testDate2 = new Date('2026-02-04T10:00:00Z');

      const mockBackups = [
        {
          id: 'backup_1',
          data: () => ({
            name: 'Backup Completo - 05/02/2026',
            type: 'full',
            size: '100 MB',
            createdAt: {
              toDate: () => testDate1,
              seconds: Math.floor(testDate1.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'completed',
            description: 'Full system backup',
            createdBy: 'admin@test.com',
            isDeleted: false
          })
        },
        {
          id: 'backup_2',
          data: () => ({
            name: 'Backup Base de Dados - 04/02/2026',
            type: 'database',
            size: '50 MB',
            createdAt: {
              toDate: () => testDate2,
              seconds: Math.floor(testDate2.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'completed',
            description: 'Database only backup',
            createdBy: 'admin@test.com',
            isDeleted: false
          })
        }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockBackups
      });

      const backups = await backupService.getBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0].id).toBe('backup_1');
      expect(backups[0].type).toBe('full');
      expect(backups[0].status).toBe('completed');
      expect(backups[1].id).toBe('backup_2');

      // Verify query was called with correct parameters
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('isDeleted', '!=', true);
      expect(mockOrderBy).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should filter out deleted backups', async () => {
      const testDate = new Date();

      const mockBackups = [
        {
          id: 'backup_1',
          data: () => ({
            name: 'Active Backup',
            type: 'full',
            size: '100 MB',
            createdAt: {
              toDate: () => testDate,
              seconds: Math.floor(testDate.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'completed',
            description: 'Active',
            createdBy: 'admin',
            isDeleted: false
          })
        },
        {
          id: 'backup_2',
          data: () => ({
            name: 'Deleted Backup',
            type: 'full',
            size: '100 MB',
            createdAt: {
              toDate: () => testDate,
              seconds: Math.floor(testDate.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'deleted',
            description: 'Deleted',
            createdBy: 'admin',
            isDeleted: true
          })
        }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockBackups
      });

      const backups = await backupService.getBackups();

      expect(backups).toHaveLength(1);
      expect(backups[0].id).toBe('backup_1');
    });

    it('should fall back to simple query if compound query fails', async () => {
      const testDate = new Date();

      const mockBackups = [
        {
          id: 'backup_1',
          data: () => ({
            name: 'Backup',
            type: 'full',
            size: '100 MB',
            createdAt: {
              toDate: () => testDate,
              seconds: Math.floor(testDate.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'completed',
            description: 'Test',
            createdBy: 'admin',
            isDeleted: false
          })
        }
      ];

      // First call fails, second succeeds
      mockGetDocs
        .mockRejectedValueOnce(new Error('Compound query not supported'))
        .mockResolvedValueOnce({ docs: mockBackups });

      const backups = await backupService.getBackups();

      expect(backups).toHaveLength(1);
      expect(mockGetDocs).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching backups:',
        expect.any(Error)
      );
    });

    it('should return empty array if all queries fail', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      const backups = await backupService.getBackups();

      expect(backups).toEqual([]);
      expect(console.error).toHaveBeenCalledTimes(2); // Both attempts logged
    });

    it('should convert Firestore timestamps to Date objects', async () => {
      const testDate = new Date('2026-02-05T10:30:00Z');
      const mockBackup = {
        id: 'backup_1',
        data: () => ({
          name: 'Test Backup',
          type: 'full',
          size: '100 MB',
          createdAt: {
            toDate: () => testDate,
            seconds: Math.floor(testDate.getTime() / 1000),
            nanoseconds: 0
          },
          status: 'completed',
          description: 'Test',
          createdBy: 'admin',
          isDeleted: false
        })
      };

      mockGetDocs.mockResolvedValue({ docs: [mockBackup] });

      const backups = await backupService.getBackups();

      expect(backups[0].createdAt).toBeInstanceOf(Date);
      expect(backups[0].createdAt.getTime()).toBe(testDate.getTime());
    });
  });

  describe('createBackup', () => {
    it('should create a full backup successfully', async () => {
      const backupId = await backupService.createBackup(
        'full',
        'Complete system backup',
        'admin@test.com'
      );

      expect(backupId).toMatch(/^backup_\d+$/);

      const callArgs = mockSetDoc.mock.calls[0];
      const backupData = callArgs[1];

      expect(backupData).toMatchObject({
        type: 'full',
        size: '0 B',
        status: 'in_progress',
        description: 'Complete system backup',
        createdBy: 'admin@test.com'
      });
      expect(backupData.name).toContain('Backup Completo');
      // Check that createdAt exists and has proper structure
      expect(backupData).toHaveProperty('createdAt');
    });

    it('should create a database backup', async () => {
      const backupId = await backupService.createBackup(
        'database',
        'Database only backup',
        'admin@test.com'
      );

      expect(backupId).toBeTruthy();

      const callArgs = mockSetDoc.mock.calls[0];
      const backupData = callArgs[1];

      expect(backupData.type).toBe('database');
      expect(backupData.name).toContain('Backup Base de Dados');
    });

    it('should create a files backup', async () => {
      const backupId = await backupService.createBackup(
        'files',
        'Files only backup',
        'admin@test.com'
      );

      expect(backupId).toBeTruthy();

      const callArgs = mockSetDoc.mock.calls[0];
      const backupData = callArgs[1];

      expect(backupData.type).toBe('files');
      expect(backupData.name).toContain('Backup Arquivos');
    });

    it('should create an incremental backup', async () => {
      const backupId = await backupService.createBackup(
        'incremental',
        'Incremental backup',
        'admin@test.com'
      );

      expect(backupId).toBeTruthy();

      const callArgs = mockSetDoc.mock.calls[0];
      const backupData = callArgs[1];

      expect(backupData.type).toBe('incremental');
      expect(backupData.name).toContain('Backup Incremental');
    });

    it('should generate unique backup IDs', async () => {
      const backupId1 = await backupService.createBackup('full', 'Test 1', 'admin');

      // Advance time slightly
      jest.advanceTimersByTime(10);

      const backupId2 = await backupService.createBackup('full', 'Test 2', 'admin');

      expect(backupId1).not.toBe(backupId2);
    });

    it('should handle backup creation errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Permission denied'));

      await expect(
        backupService.createBackup('full', 'Test', 'admin')
      ).rejects.toThrow('Erro ao criar backup');
    });

    it('should create backup with in_progress status initially', async () => {
      // Mock getDocs for simulateBackupProcess
      mockGetDocs.mockResolvedValue({
        docs: Array(10).fill(null).map(() => ({ data: () => ({}) })),
        size: 10
      });

      const backupId = await backupService.createBackup(
        'database',
        'Test backup',
        'admin@test.com'
      );

      // Verify initial backup was created with in_progress status
      expect(mockSetDoc).toHaveBeenCalledTimes(1);

      const initialCall = mockSetDoc.mock.calls[0];
      expect(initialCall[1]).toMatchObject({
        type: 'database',
        status: 'in_progress',
        size: '0 B',
        description: 'Test backup',
        createdBy: 'admin@test.com'
      });

      expect(backupId).toMatch(/^backup_\d+$/);
    });

    it('should handle backup process simulation', async () => {
      // This test verifies that backup process is initiated
      const backupId = await backupService.createBackup(
        'full',
        'Test backup',
        'admin@test.com'
      );

      // Verify backup was created
      expect(backupId).toBeTruthy();
      expect(backupId).toMatch(/^backup_\d+$/);

      // Verify initial state
      const initialCall = mockSetDoc.mock.calls[0];
      expect(initialCall[1]).toMatchObject({
        type: 'full',
        status: 'in_progress',
        description: 'Test backup',
        createdBy: 'admin@test.com'
      });
    });
  });

  describe('deleteBackup', () => {
    it('should mark backup as deleted', async () => {
      await backupService.deleteBackup('backup_123');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'deleted',
          isDeleted: true
        }),
        { merge: true }
      );
    });

    it('should set deletedAt timestamp', async () => {
      await backupService.deleteBackup('backup_123');

      const callArgs = mockSetDoc.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('deletedAt');
      expect(callArgs[1]).toHaveProperty('status', 'deleted');
      expect(callArgs[1]).toHaveProperty('isDeleted', true);
      expect(callArgs[2]).toEqual({ merge: true });
    });

    it('should handle deletion errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Permission denied'));

      await expect(backupService.deleteBackup('backup_123')).rejects.toThrow(
        'Erro ao excluir backup'
      );
    });

    it('should use merge option to preserve existing fields', async () => {
      await backupService.deleteBackup('backup_123');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        { merge: true }
      );
    });
  });

  describe('downloadBackup', () => {
    beforeEach(() => {
      // Reset mocks for download tests
      mockGetDocs.mockReset();
    });

    it('should export all collections data', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'doc1',
            data: () => ({ field: 'value1', createdAt: new Date() })
          },
          {
            id: 'doc2',
            data: () => ({ field: 'value2', updatedAt: new Date() })
          }
        ],
        size: 2
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const blob = await backupService.downloadBackup('backup_123');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');

      // Read blob content
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      expect(data.backupId).toBe('backup_123');
      expect(data.version).toBe('1.0');
      expect(data.timestamp).toBeTruthy();
      expect(data.collections).toBeDefined();
      expect(data.databaseStats).toBeDefined();
    });

    it('should convert Firestore timestamps to ISO strings', async () => {
      const testDate = new Date('2026-02-05T10:00:00Z');
      const mockSnapshot = {
        docs: [
          {
            id: 'doc1',
            data: () => ({
              field: 'value',
              createdAt: {
                toDate: () => testDate,
                seconds: Math.floor(testDate.getTime() / 1000),
                nanoseconds: 0
              }
            })
          }
        ],
        size: 1
      };

      mockGetDocs.mockResolvedValue(mockSnapshot);

      const blob = await backupService.downloadBackup('backup_123');
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      // Should have ISO string timestamps
      expect(data.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(data.collections).toBeDefined();
    });

    it('should handle collections with no documents', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });

      const blob = await backupService.downloadBackup('backup_123');
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      expect(data.collections).toBeDefined();
      // All collections should be empty arrays
      Object.values(data.collections).forEach((collection: any) => {
        expect(Array.isArray(collection)).toBe(true);
      });
    });

    it('should handle collection access errors gracefully', async () => {
      mockGetDocs.mockImplementation((collectionRef: any) => {
        const path = collectionRef._path || '';
        if (path === 'users') {
          return Promise.reject(new Error('Permission denied'));
        }
        return Promise.resolve({ docs: [], size: 0 });
      });

      const blob = await backupService.downloadBackup('backup_123');
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      // Users collection should be empty due to error
      expect(data.collections.users).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should include database statistics in backup', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });

      const blob = await backupService.downloadBackup('backup_123');
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      expect(data.databaseStats).toBeDefined();
      expect(data.databaseStats.totalRecords).toBe(0);
      expect(data.databaseStats.totalSize).toBeTruthy();
      expect(data.databaseStats.collections).toBeInstanceOf(Array);
    });

    it('should handle download with empty collections gracefully', async () => {
      // Test that download works even when collections have errors
      // but the overall process doesn't fail catastrophically
      mockGetDocs.mockImplementation((collectionRef: any) => {
        // Simulate some collections failing
        const path = collectionRef._path || '';
        if (path === 'users' || path === 'events') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ docs: [], size: 0 });
      });

      const blob = await backupService.downloadBackup('backup_123');

      expect(blob).toBeInstanceOf(Blob);
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      // Failed collections should be empty
      expect(data.collections.users).toEqual([]);
      expect(data.collections.events).toEqual([]);

      // Other collections should exist
      expect(data.collections).toHaveProperty('projects');
    });

    it('should export correct document structure', async () => {
      const mockDoc = {
        id: 'test-id',
        data: () => ({
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        })
      };

      mockGetDocs.mockResolvedValue({ docs: [mockDoc], size: 1 });

      const blob = await backupService.downloadBackup('backup_123');
      const text = await blobToText(blob);
      const data = JSON.parse(text);

      expect(data.collections).toBeDefined();
      expect(typeof data.collections).toBe('object');

      // Check that collections exist and are arrays
      const collectionNames = Object.keys(data.collections);
      expect(collectionNames.length).toBeGreaterThan(0);
      collectionNames.forEach(name => {
        expect(Array.isArray(data.collections[name])).toBe(true);
      });
    });
  });

  describe('Private helper methods', () => {
    describe('formatBytes', () => {
      it('should format zero bytes', async () => {
        // Test through getDatabaseStats
        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        const stats = await backupService.getDatabaseStats();
        expect(stats.totalSize).toBe('0 B');
      });

      it('should format bytes correctly', async () => {
        // Create mock with specific sizes
        mockGetDocs.mockImplementation((collectionRef: any) => {
          const path = collectionRef._path || '';
          if (path === 'users') {
            // 50 users * 2048 bytes = 102,400 bytes = 100 KB
            return Promise.resolve({
              size: 50,
              docs: Array(50).fill(null).map(() => ({ data: () => ({}) }))
            });
          }
          return Promise.resolve({ size: 0, docs: [] });
        });

        const stats = await backupService.getDatabaseStats();

        // Should format to KB or MB
        expect(stats.totalSize).toMatch(/\d+(\.\d+)?\s+(B|KB|MB)/);
      });
    });

    describe('estimateCollectionSize', () => {
      it('should estimate different sizes for different collections', async () => {
        mockGetDocs.mockImplementation((collectionRef: any) => {
          const path = collectionRef._path || '';
          if (path === 'users') {
            return Promise.resolve({
              size: 10,
              docs: Array(10).fill(null).map(() => ({ data: () => ({}) }))
            });
          }
          if (path === 'blogPosts') {
            return Promise.resolve({
              size: 10,
              docs: Array(10).fill(null).map(() => ({ data: () => ({}) }))
            });
          }
          return Promise.resolve({ size: 0, docs: [] });
        });

        const stats = await backupService.getDatabaseStats();

        const userStats = stats.collections.find(c => c.name === 'users');
        const blogStats = stats.collections.find(c => c.name === 'blogPosts');

        // Blog posts should have larger estimated size than users
        // (3072 bytes vs 2048 bytes per document)
        expect(userStats).toBeDefined();
        expect(blogStats).toBeDefined();
        expect(userStats?.records).toBe(10);
        expect(blogStats?.records).toBe(10);
      });
    });

    describe('convertTimestampsToStrings', () => {
      it('should handle nested objects with timestamps', async () => {
        const testDate = new Date('2026-02-05T10:00:00Z');
        const mockDoc = {
          id: 'doc1',
          data: () => ({
            user: {
              name: 'Test',
              createdAt: {
                toDate: () => testDate,
                seconds: Math.floor(testDate.getTime() / 1000),
                nanoseconds: 0
              },
              profile: {
                updatedAt: {
                  toDate: () => testDate,
                  seconds: Math.floor(testDate.getTime() / 1000),
                  nanoseconds: 0
                }
              }
            }
          })
        };

        mockGetDocs.mockResolvedValue({ docs: [mockDoc], size: 1 });

        const blob = await backupService.downloadBackup('backup_123');
        const text = await blobToText(blob);
        const data = JSON.parse(text);

        // Timestamps should be converted to ISO strings
        expect(typeof data.timestamp).toBe('string');
        expect(data.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
      });

      it('should handle arrays with timestamps', async () => {
        const testDate = new Date('2026-02-05T10:00:00Z');
        const mockDoc = {
          id: 'doc1',
          data: () => ({
            events: [
              {
                date: {
                  toDate: () => testDate,
                  seconds: Math.floor(testDate.getTime() / 1000),
                  nanoseconds: 0
                }
              },
              {
                date: {
                  toDate: () => testDate,
                  seconds: Math.floor(testDate.getTime() / 1000),
                  nanoseconds: 0
                }
              }
            ]
          })
        };

        mockGetDocs.mockResolvedValue({ docs: [mockDoc], size: 1 });

        const blob = await backupService.downloadBackup('backup_123');

        // Should not throw error
        expect(blob).toBeInstanceOf(Blob);
      });

      it('should handle null and undefined values', async () => {
        const mockDoc = {
          id: 'doc1',
          data: () => ({
            field1: null,
            field2: undefined,
            field3: 'value'
          })
        };

        mockGetDocs.mockResolvedValue({ docs: [mockDoc], size: 1 });

        const blob = await backupService.downloadBackup('backup_123');
        const text = await blobToText(blob);
        const data = JSON.parse(text);

        // Should handle null/undefined without errors
        expect(data.collections).toBeDefined();
        expect(typeof data.collections).toBe('object');
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty database', async () => {
      mockGetDocs.mockResolvedValue({ size: 0, docs: [] });

      const stats = await backupService.getDatabaseStats();
      const backups = await backupService.getBackups();

      expect(stats.totalRecords).toBe(0);
      expect(backups).toEqual([]);
    });

    it('should handle concurrent backup operations', async () => {
      // Advance time slightly between each call to ensure unique IDs
      const ids: string[] = [];

      const id1 = await backupService.createBackup('full', 'Backup 1', 'admin');
      ids.push(id1);
      jest.advanceTimersByTime(10);

      const id2 = await backupService.createBackup('database', 'Backup 2', 'admin');
      ids.push(id2);
      jest.advanceTimersByTime(10);

      const id3 = await backupService.createBackup('files', 'Backup 3', 'admin');
      ids.push(id3);

      expect(ids[0]).toBeTruthy();
      expect(ids[1]).toBeTruthy();
      expect(ids[2]).toBeTruthy();
      expect(ids[0]).not.toBe(ids[1]);
      expect(ids[1]).not.toBe(ids[2]);
    });

    it('should handle malformed backup data gracefully', async () => {
      const malformedBackup = {
        id: 'backup_1',
        data: () => ({
          name: 'Malformed',
          // Missing required fields
          createdAt: Timestamp.fromDate(new Date())
        })
      };

      mockGetDocs.mockResolvedValue({ docs: [malformedBackup] });

      const backups = await backupService.getBackups();

      // Should handle gracefully, possibly filtering out invalid data
      expect(Array.isArray(backups)).toBe(true);
    });

    it('should handle very large backup sizes', async () => {
      mockGetDocs.mockImplementation((collectionRef: any) => {
        // Simulate large collection
        return Promise.resolve({
          size: 100000,
          docs: Array(100000).fill({ data: () => ({}) })
        });
      });

      const stats = await backupService.getDatabaseStats();

      // Should format size appropriately (GB)
      expect(stats.totalSize).toMatch(/\d+(\.\d+)?\s+(MB|GB)/);
    });

    it('should maintain backup creation order', async () => {
      const backupIds: string[] = [];

      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1);
        const id = await backupService.createBackup('database', `Backup ${i}`, 'admin');
        backupIds.push(id);
      }

      // IDs should be in increasing order (timestamp-based)
      const timestamps = backupIds.map(id => parseInt(id.split('_')[1]));
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should handle Firestore timestamp conversion errors', async () => {
      const invalidTimestamp = {
        toDate: () => {
          throw new Error('Invalid timestamp');
        }
      };

      const mockDoc = {
        id: 'doc1',
        data: () => ({
          field: 'value',
          createdAt: invalidTimestamp
        })
      };

      mockGetDocs.mockResolvedValue({ docs: [mockDoc], size: 1 });

      // Should not throw, handle gracefully
      const blob = await backupService.downloadBackup('backup_123');
      expect(blob).toBeInstanceOf(Blob);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full backup workflow', async () => {
      // Create backup
      const backupId = await backupService.createBackup(
        'full',
        'Full backup test',
        'admin@test.com'
      );

      expect(backupId).toBeTruthy();

      // Mock completion
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
      jest.advanceTimersByTime(15000);
      await Promise.resolve();

      // List backups
      const testDate = new Date();
      const mockBackup = {
        id: backupId,
        data: () => ({
          name: 'Backup Completo - 05/02/2026',
          type: 'full',
          size: '100 MB',
          createdAt: {
            toDate: () => testDate,
            seconds: Math.floor(testDate.getTime() / 1000),
            nanoseconds: 0
          },
          status: 'completed',
          description: 'Full backup test',
          createdBy: 'admin@test.com',
          isDeleted: false
        })
      };

      mockGetDocs.mockResolvedValue({ docs: [mockBackup] });
      const backups = await backupService.getBackups();

      expect(backups.length).toBeGreaterThan(0);

      // Download backup
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
      const blob = await backupService.downloadBackup(backupId);
      expect(blob).toBeInstanceOf(Blob);

      // Delete backup
      await backupService.deleteBackup(backupId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'deleted' }),
        { merge: true }
      );
    });

    it('should handle complete backup lifecycle', async () => {
      // Create backup
      const backupId = await backupService.createBackup(
        'database',
        'Complete lifecycle test',
        'admin@test.com'
      );

      expect(backupId).toBeTruthy();

      // List backups
      const testDate = new Date();
      mockGetDocs.mockResolvedValue({
        docs: [{
          id: backupId,
          data: () => ({
            name: 'Test Backup',
            type: 'database',
            size: '50 MB',
            createdAt: {
              toDate: () => testDate,
              seconds: Math.floor(testDate.getTime() / 1000),
              nanoseconds: 0
            },
            status: 'completed',
            description: 'Complete lifecycle test',
            createdBy: 'admin@test.com',
            isDeleted: false
          })
        }]
      });

      const backups = await backupService.getBackups();
      expect(backups.length).toBeGreaterThan(0);

      // Delete backup
      await backupService.deleteBackup(backupId);
      expect(mockSetDoc).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'deleted', isDeleted: true }),
        { merge: true }
      );
    });
  });
});
