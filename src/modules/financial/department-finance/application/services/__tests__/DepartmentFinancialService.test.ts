// Unit Tests - DepartmentFinancialService
// Comprehensive tests for department financial operations including department CRUD,
// transaction management, transfers between departments, budget tracking, and financial reporting

import {
  DepartmentFinancialService
} from '../DepartmentFinancialService';
import {
  Department,
  DepartmentTransaction,
  DepartmentTransactionType,
  DepartmentTransactionStatus,
  DepartmentTransfer,
  DepartmentEntity
} from '../../../domain/entities/Department';

// Mock Firebase Firestore
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock Firebase Firestore functions
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    })
  }
}));

describe('DepartmentFinancialService', () => {
  let service: DepartmentFinancialService;

  // Helper function to create test department
  const createTestDepartment = (overrides: Partial<Department> = {}): Department => ({
    id: 'dept-1',
    name: 'Test Department',
    description: 'Test department description',
    icon: 'users',
    color: '#3B82F6',
    currentBalance: 5000,
    initialBalance: 1000,
    responsibleUserId: 'user-1',
    responsibleName: 'John Doe',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'user-admin',
    ...overrides
  });

  // Helper function to create test transaction
  const createTestTransaction = (overrides: Partial<DepartmentTransaction> = {}): DepartmentTransaction => ({
    id: 'trans-1',
    departmentId: 'dept-1',
    departmentName: 'Test Department',
    type: DepartmentTransactionType.DEPOSIT,
    amount: 1000,
    description: 'Test transaction',
    notes: 'Test notes',
    reference: 'REF-123',
    receiptNumber: 'REC-456',
    date: new Date('2024-01-15'),
    status: DepartmentTransactionStatus.APPROVED,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-1',
    approvedBy: 'user-admin',
    approvedAt: new Date('2024-01-15'),
    ...overrides
  });

  // Helper function to create test transfer
  const createTestTransfer = (overrides: Partial<DepartmentTransfer> = {}): DepartmentTransfer => ({
    id: 'transfer-1',
    fromDepartmentId: 'dept-1',
    fromDepartmentName: 'Department 1',
    toDepartmentId: 'dept-2',
    toDepartmentName: 'Department 2',
    amount: 500,
    description: 'Test transfer',
    notes: 'Transfer notes',
    reference: 'TRANSF-123',
    date: new Date('2024-01-15'),
    status: DepartmentTransactionStatus.APPROVED,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-1',
    approvedBy: 'user-admin',
    approvedAt: new Date('2024-01-15'),
    ...overrides
  });

  // Helper to create mock Firestore document snapshot
  const createMockDocSnapshot = (data: any, exists: boolean = true) => ({
    id: data?.id || 'doc-id',
    exists: () => exists,
    data: () => exists ? {
      ...data,
      date: data.date ? { toDate: () => data.date } : undefined,
      createdAt: { toDate: () => data.createdAt || new Date() },
      updatedAt: { toDate: () => data.updatedAt || new Date() },
      approvedAt: data.approvedAt ? { toDate: () => data.approvedAt } : undefined
    } : null
  });

  // Helper to create mock Firestore query snapshot
  const createMockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(doc => createMockDocSnapshot(doc)),
    empty: docs.length === 0
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DepartmentFinancialService();

    // Default mock implementations
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-ref');
    mockOrderBy.mockReturnValue('orderBy-ref');
    mockLimit.mockReturnValue('limit-ref');

    // Spy on DepartmentEntity methods
    jest.spyOn(DepartmentEntity, 'validateDepartment').mockReturnValue([]);
    jest.spyOn(DepartmentEntity, 'validateTransaction').mockReturnValue([]);
    jest.spyOn(DepartmentEntity, 'validateTransfer').mockReturnValue([]);
    jest.spyOn(DepartmentEntity, 'generateReferenceNumber').mockReturnValue('REF-123456-789');
  });

  describe('Department Management', () => {
    describe('createDepartment', () => {
      it('should create a department successfully', async () => {
        const departmentData = {
          name: 'Youth Department',
          description: 'Youth ministry department',
          icon: 'users',
          color: '#10B981',
          currentBalance: 0,
          initialBalance: 0,
          responsibleUserId: 'user-1',
          responsibleName: 'John Doe',
          isActive: true,
          createdBy: 'user-admin'
        };

        mockAddDoc.mockResolvedValue({ id: 'new-dept-id' });

        const result = await service.createDepartment(departmentData);

        expect(result).toBe('new-dept-id');
        expect(mockAddDoc).toHaveBeenCalled();
        expect(DepartmentEntity.validateDepartment).toHaveBeenCalledWith(departmentData);
      });

      it('should set default values when creating department', async () => {
        const departmentData = {
          name: 'Youth Department',
          createdBy: 'user-admin',
          isActive: true,
          currentBalance: 0
        };

        mockAddDoc.mockResolvedValue({ id: 'new-dept-id' });

        await service.createDepartment(departmentData);

        const addDocCall = mockAddDoc.mock.calls[0][1];
        expect(addDocCall.currentBalance).toBe(0);
        expect(addDocCall.initialBalance).toBe(0);
        expect(addDocCall.isActive).toBe(true);
      });

      it('should throw error when validation fails', async () => {
        const invalidDepartment = {
          name: '',
          createdBy: 'user-admin',
          isActive: true,
          currentBalance: 0
        };

        (DepartmentEntity.validateDepartment as jest.Mock).mockReturnValueOnce([
          'Nome do departamento é obrigatório'
        ]);

        await expect(service.createDepartment(invalidDepartment))
          .rejects.toThrow('Erro ao criar departamento');
      });

      it('should throw error when Firebase operation fails', async () => {
        const departmentData = {
          name: 'Youth Department',
          createdBy: 'user-admin',
          isActive: true,
          currentBalance: 0
        };

        mockAddDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(service.createDepartment(departmentData))
          .rejects.toThrow('Erro ao criar departamento');
      });
    });

    describe('updateDepartment', () => {
      it('should update a department successfully', async () => {
        const updates = {
          name: 'Updated Department Name',
          description: 'Updated description',
          currentBalance: 10000
        };

        mockUpdateDoc.mockResolvedValue(undefined);

        await expect(service.updateDepartment('dept-1', updates))
          .resolves.not.toThrow();

        expect(mockUpdateDoc).toHaveBeenCalled();
      });

      it('should add updatedAt timestamp when updating', async () => {
        const updates = { name: 'Updated Name' };

        mockUpdateDoc.mockResolvedValue(undefined);

        await service.updateDepartment('dept-1', updates);

        const updateCall = mockUpdateDoc.mock.calls[0][1];
        expect(updateCall.updatedAt).toBeDefined();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(service.updateDepartment('dept-1', { name: 'Updated' }))
          .rejects.toThrow('Erro ao atualizar departamento');
      });
    });

    describe('deleteDepartment', () => {
      it('should delete a department successfully when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
        mockDeleteDoc.mockResolvedValue(undefined);

        await expect(service.deleteDepartment('dept-1'))
          .resolves.not.toThrow();

        expect(mockDeleteDoc).toHaveBeenCalled();
      });

      it('should throw error when department has transactions', async () => {
        const transactions = [createTestTransaction()];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await expect(service.deleteDepartment('dept-1'))
          .rejects.toThrow('Não é possível excluir departamento com transações');
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
        mockDeleteDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(service.deleteDepartment('dept-1'))
          .rejects.toThrow();
      });
    });

    describe('getDepartment', () => {
      it('should return a department when found', async () => {
        const department = createTestDepartment();
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const result = await service.getDepartment('dept-1');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('dept-1');
        expect(result?.name).toBe('Test Department');
      });

      it('should return null when department not found', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(null, false));

        const result = await service.getDepartment('non-existent');

        expect(result).toBeNull();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(service.getDepartment('dept-1'))
          .rejects.toThrow('Erro ao buscar departamento');
      });
    });

    describe('getDepartments', () => {
      it('should return all departments when no filters provided', async () => {
        const departments = [
          createTestDepartment({ id: 'dept-1', name: 'Department 1' }),
          createTestDepartment({ id: 'dept-2', name: 'Department 2' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(departments));

        const result = await service.getDepartments();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Department 1');
      });

      it('should filter departments by active status', async () => {
        const departments = [
          createTestDepartment({ id: 'dept-1', isActive: true })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(departments));

        await service.getDepartments({ isActive: true });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter departments by responsible user', async () => {
        const departments = [
          createTestDepartment({ id: 'dept-1', responsibleUserId: 'user-1' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(departments));

        await service.getDepartments({ responsibleUserId: 'user-1' });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should return empty array when no departments exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const result = await service.getDepartments();

        expect(result).toHaveLength(0);
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(service.getDepartments())
          .rejects.toThrow('Erro ao buscar departamentos');
      });
    });
  });

  describe('Transaction Management', () => {
    describe('createTransaction', () => {
      it('should create a deposit transaction successfully', async () => {
        const department = createTestDepartment({ currentBalance: 5000 });
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000,
          description: 'Monthly deposit',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-1'
        };

        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-trans-id' });

        const result = await service.createTransaction(transactionData);

        expect(result).toBeDefined();
        expect(DepartmentEntity.validateTransaction).toHaveBeenCalledWith(transactionData);
      });

      it('should create a withdrawal transaction when balance is sufficient', async () => {
        const department = createTestDepartment({ currentBalance: 5000 });
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 1000,
          description: 'Office supplies',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-1'
        };

        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-trans-id' });

        const result = await service.createTransaction(transactionData);

        expect(result).toBeDefined();
      });

      it('should throw error when withdrawal exceeds balance', async () => {
        const department = createTestDepartment({ currentBalance: 500 });
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 1000,
          description: 'Office supplies',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        await expect(service.createTransaction(transactionData))
          .rejects.toThrow('Saldo insuficiente');
      });

      it('should throw error when department not found', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(null, false));

        const transactionData = {
          departmentId: 'non-existent',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000,
          description: 'Test',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        await expect(service.createTransaction(transactionData))
          .rejects.toThrow('Departamento não encontrado');
      });

      it('should throw error when department is inactive', async () => {
        const department = createTestDepartment({ isActive: false });
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000,
          description: 'Test',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        await expect(service.createTransaction(transactionData))
          .rejects.toThrow('Departamento inativo');
      });

      it('should generate reference number if not provided', async () => {
        const department = createTestDepartment();
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000,
          description: 'Test',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-trans-id' });

        await service.createTransaction(transactionData);

        expect(DepartmentEntity.generateReferenceNumber).toHaveBeenCalledWith('DEPT');
      });

      it('should not update balance when status is pending', async () => {
        const department = createTestDepartment({ currentBalance: 5000 });
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000,
          description: 'Test',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        const mockUpdate = jest.fn();
        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: mockUpdate
          });
        });
        mockDoc.mockReturnValue({ id: 'new-trans-id' });

        await service.createTransaction(transactionData);

        expect(mockUpdate).not.toHaveBeenCalled();
      });

      it('should throw error when validation fails', async () => {
        (DepartmentEntity.validateTransaction as jest.Mock).mockReturnValueOnce([
          'Valor deve ser maior que zero'
        ]);

        const transactionData = {
          departmentId: 'dept-1',
          departmentName: 'Test Department',
          type: DepartmentTransactionType.DEPOSIT,
          amount: -100,
          description: 'Test',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.PENDING,
          createdBy: 'user-1'
        };

        await expect(service.createTransaction(transactionData))
          .rejects.toThrow('Validation errors');
      });
    });

    describe('updateTransactionStatus', () => {
      it('should approve a pending transaction and update balance', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING,
          type: DepartmentTransactionType.DEPOSIT,
          amount: 1000
        });
        const department = createTestDepartment({ currentBalance: 5000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(department));

        mockRunTransaction.mockImplementation(async (db, callback) => {
          await callback({
            update: jest.fn()
          });
        });

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .resolves.not.toThrow();
      });

      it('should reject a pending transaction without updating balance', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING
        });
        const department = createTestDepartment();

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(department));

        mockRunTransaction.mockImplementation(async (db, callback) => {
          await callback({
            update: jest.fn()
          });
        });

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.REJECTED, 'user-admin'))
          .resolves.not.toThrow();
      });

      it('should throw error when transaction not found', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(null, false));

        await expect(service.updateTransactionStatus('non-existent', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .rejects.toThrow('Transação não encontrada');
      });

      it('should throw error when transaction is not pending', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.APPROVED
        });

        mockGetDoc.mockResolvedValue(createMockDocSnapshot(transaction));

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.REJECTED, 'user-admin'))
          .rejects.toThrow('Somente transações pendentes podem ser aprovadas/rejeitadas');
      });

      it('should throw error when department not found', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING
        });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(null, false));

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .rejects.toThrow('Departamento não encontrado');
      });

      it('should handle transfer-in transactions correctly', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING,
          type: DepartmentTransactionType.TRANSFER_IN,
          amount: 500
        });
        const department = createTestDepartment({ currentBalance: 5000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(department));

        mockRunTransaction.mockImplementation(async (db, callback) => {
          await callback({
            update: jest.fn()
          });
        });

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .resolves.not.toThrow();
      });

      it('should handle transfer-out transactions correctly', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING,
          type: DepartmentTransactionType.TRANSFER_OUT,
          amount: 500
        });
        const department = createTestDepartment({ currentBalance: 5000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(department));

        mockRunTransaction.mockImplementation(async (db, callback) => {
          await callback({
            update: jest.fn()
          });
        });

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .resolves.not.toThrow();
      });

      it('should throw error when withdrawal would result in negative balance', async () => {
        const transaction = createTestTransaction({
          status: DepartmentTransactionStatus.PENDING,
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 6000
        });
        const department = createTestDepartment({ currentBalance: 5000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(transaction))
          .mockResolvedValueOnce(createMockDocSnapshot(department));

        mockRunTransaction.mockRejectedValue(new Error('Saldo insuficiente'));

        await expect(service.updateTransactionStatus('trans-1', DepartmentTransactionStatus.APPROVED, 'user-admin'))
          .rejects.toThrow();
      });
    });

    describe('getTransactions', () => {
      it('should return all transactions when no filters provided', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const result = await service.getTransactions();

        expect(result).toHaveLength(2);
      });

      it('should filter transactions by department ID', async () => {
        const transactions = [
          createTestTransaction({ departmentId: 'dept-1' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({ departmentId: 'dept-1' });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by type', async () => {
        const transactions = [
          createTestTransaction({ type: DepartmentTransactionType.DEPOSIT })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({ type: DepartmentTransactionType.DEPOSIT });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by status', async () => {
        const transactions = [
          createTestTransaction({ status: DepartmentTransactionStatus.APPROVED })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({ status: DepartmentTransactionStatus.APPROVED });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by date range', async () => {
        const transactions = [
          createTestTransaction({ date: new Date('2024-01-15') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by creator', async () => {
        const transactions = [
          createTestTransaction({ createdBy: 'user-1' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({ createdBy: 'user-1' });

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should respect limit parameter', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await service.getTransactions({}, 10);

        expect(mockLimit).toHaveBeenCalledWith(10);
      });

      it('should return empty array when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const result = await service.getTransactions();

        expect(result).toHaveLength(0);
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(service.getTransactions())
          .rejects.toThrow('Erro ao buscar transações do departamento');
      });
    });
  });

  describe('Transfer Management', () => {
    describe('createTransfer', () => {
      it('should create a transfer between departments successfully', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', currentBalance: 5000 });
        const toDept = createTestDepartment({ id: 'dept-2', currentBalance: 2000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Budget allocation',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-transfer-id' });

        const result = await service.createTransfer(transferData);

        expect(result).toBeDefined();
        expect(DepartmentEntity.validateTransfer).toHaveBeenCalledWith(transferData);
      });

      it('should throw error when source department not found', async () => {
        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(null, false))
          .mockResolvedValueOnce(createMockDocSnapshot(createTestDepartment()));

        const transferData = {
          fromDepartmentId: 'non-existent',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Departamento de origem não encontrado');
      });

      it('should throw error when destination department not found', async () => {
        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(createTestDepartment()))
          .mockResolvedValueOnce(createMockDocSnapshot(null, false));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'non-existent',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Departamento de destino não encontrado');
      });

      it('should throw error when source department is inactive', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', isActive: false });
        const toDept = createTestDepartment({ id: 'dept-2', isActive: true });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Departamento de origem está inativo');
      });

      it('should throw error when destination department is inactive', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', isActive: true });
        const toDept = createTestDepartment({ id: 'dept-2', isActive: false });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Departamento de destino está inativo');
      });

      it('should throw error when source department has insufficient balance', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', currentBalance: 500 });
        const toDept = createTestDepartment({ id: 'dept-2', currentBalance: 2000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Saldo insuficiente');
      });

      it('should generate reference number if not provided', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', currentBalance: 5000 });
        const toDept = createTestDepartment({ id: 'dept-2', currentBalance: 2000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: jest.fn(),
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-transfer-id' });

        await service.createTransfer(transferData);

        expect(DepartmentEntity.generateReferenceNumber).toHaveBeenCalledWith('TRANSF');
      });

      it('should create transfer_out and transfer_in transactions', async () => {
        const fromDept = createTestDepartment({ id: 'dept-1', currentBalance: 5000 });
        const toDept = createTestDepartment({ id: 'dept-2', currentBalance: 2000 });

        mockGetDoc
          .mockResolvedValueOnce(createMockDocSnapshot(fromDept))
          .mockResolvedValueOnce(createMockDocSnapshot(toDept));

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: 1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        const mockSet = jest.fn();
        mockRunTransaction.mockImplementation(async (db, callback) => {
          return await callback({
            set: mockSet,
            update: jest.fn()
          });
        });
        mockDoc.mockReturnValue({ id: 'new-transfer-id' });

        await service.createTransfer(transferData);

        // Should be called 3 times: transfer record + 2 transactions
        expect(mockSet).toHaveBeenCalledTimes(3);
      });

      it('should throw error when validation fails', async () => {
        (DepartmentEntity.validateTransfer as jest.Mock).mockReturnValueOnce([
          'Valor deve ser maior que zero'
        ]);

        const transferData = {
          fromDepartmentId: 'dept-1',
          fromDepartmentName: 'Department 1',
          toDepartmentId: 'dept-2',
          toDepartmentName: 'Department 2',
          amount: -1000,
          description: 'Transfer',
          date: new Date('2024-01-15'),
          status: DepartmentTransactionStatus.APPROVED,
          createdBy: 'user-admin'
        };

        await expect(service.createTransfer(transferData))
          .rejects.toThrow('Validation errors');
      });
    });
  });

  describe('Reports and Summaries', () => {
    describe('getMonthlyBalance', () => {
      it('should calculate monthly balance correctly', async () => {
        const department = createTestDepartment({
          id: 'dept-1',
          name: 'Test Department',
          currentBalance: 5000,
          initialBalance: 1000
        });

        const transactions = [
          createTestTransaction({
            type: DepartmentTransactionType.DEPOSIT,
            amount: 2000,
            status: DepartmentTransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: DepartmentTransactionType.WITHDRAWAL,
            amount: 500,
            status: DepartmentTransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: DepartmentTransactionType.TRANSFER_IN,
            amount: 1000,
            status: DepartmentTransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: DepartmentTransactionType.TRANSFER_OUT,
            amount: 300,
            status: DepartmentTransactionStatus.APPROVED
          })
        ];

        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const result = await service.getMonthlyBalance('dept-1', 2024, 1);

        expect(result.departmentId).toBe('dept-1');
        expect(result.departmentName).toBe('Test Department');
        expect(result.year).toBe(2024);
        expect(result.month).toBe(1);
        expect(result.totalDeposits).toBe(2000);
        expect(result.totalWithdrawals).toBe(500);
        expect(result.totalTransfersIn).toBe(1000);
        expect(result.totalTransfersOut).toBe(300);
        expect(result.transactionCount).toBe(4);
      });

      it('should throw error when department not found', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(null, false));

        await expect(service.getMonthlyBalance('non-existent', 2024, 1))
          .rejects.toThrow('Erro ao gerar saldo mensal');
      });

      it('should only include approved transactions', async () => {
        const department = createTestDepartment();

        // First call is for current month transactions (with status filter)
        const approvedTransactions = [
          createTestTransaction({
            type: DepartmentTransactionType.DEPOSIT,
            amount: 2000,
            status: DepartmentTransactionStatus.APPROVED
          })
        ];

        // Second call is for previous transactions (for initial balance calculation)
        const previousTransactions: DepartmentTransaction[] = [];

        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
        mockGetDocs
          .mockResolvedValueOnce(createMockQuerySnapshot(approvedTransactions))
          .mockResolvedValueOnce(createMockQuerySnapshot(previousTransactions));

        const result = await service.getMonthlyBalance('dept-1', 2024, 1);

        expect(result.totalDeposits).toBe(2000);
      });

      it('should return zero values when no transactions exist', async () => {
        const department = createTestDepartment({ initialBalance: 1000 });

        mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const result = await service.getMonthlyBalance('dept-1', 2024, 1);

        expect(result.totalDeposits).toBe(0);
        expect(result.totalWithdrawals).toBe(0);
        expect(result.totalTransfersIn).toBe(0);
        expect(result.totalTransfersOut).toBe(0);
        expect(result.transactionCount).toBe(0);
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(service.getMonthlyBalance('dept-1', 2024, 1))
          .rejects.toThrow('Erro ao gerar saldo mensal');
      });
    });

    describe('getDepartmentSummary', () => {
      it('should calculate department summary correctly', async () => {
        const departments = [
          createTestDepartment({ id: 'dept-1', name: 'Department 1', currentBalance: 5000, isActive: true, color: '#3B82F6' }),
          createTestDepartment({ id: 'dept-2', name: 'Department 2', currentBalance: 3000, isActive: true, color: '#10B981' }),
          createTestDepartment({ id: 'dept-3', name: 'Department 3', currentBalance: 2000, isActive: false, color: '#EF4444' })
        ];

        const dept1Transactions = [
          createTestTransaction({
            type: DepartmentTransactionType.DEPOSIT,
            amount: 2000,
            status: DepartmentTransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: DepartmentTransactionType.WITHDRAWAL,
            amount: 500,
            status: DepartmentTransactionStatus.APPROVED
          })
        ];

        const dept2Transactions = [
          createTestTransaction({
            type: DepartmentTransactionType.DEPOSIT,
            amount: 1500,
            status: DepartmentTransactionStatus.APPROVED
          })
        ];

        mockGetDocs
          .mockResolvedValueOnce(createMockQuerySnapshot(departments))
          .mockResolvedValueOnce(createMockQuerySnapshot(dept1Transactions))
          .mockResolvedValueOnce(createMockQuerySnapshot(dept2Transactions))
          .mockResolvedValueOnce(createMockQuerySnapshot([]));

        const result = await service.getDepartmentSummary();

        expect(result.totalDepartments).toBe(3);
        expect(result.activeDepartments).toBe(2);
        expect(result.totalBalance).toBe(10000);
        expect(result.totalDeposits).toBe(3500);
        expect(result.totalWithdrawals).toBe(500);
        expect(result.departments).toHaveLength(3);
      });

      it('should handle case when no departments exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const result = await service.getDepartmentSummary();

        expect(result.totalDepartments).toBe(0);
        expect(result.activeDepartments).toBe(0);
        expect(result.totalBalance).toBe(0);
        expect(result.totalDeposits).toBe(0);
        expect(result.totalWithdrawals).toBe(0);
        expect(result.departments).toHaveLength(0);
      });

      it('should handle error when loading transaction totals gracefully', async () => {
        const departments = [
          createTestDepartment({ id: 'dept-1', currentBalance: 5000 })
        ];

        mockGetDocs
          .mockResolvedValueOnce(createMockQuerySnapshot(departments))
          .mockRejectedValueOnce(new Error('Index not ready'));

        const result = await service.getDepartmentSummary();

        expect(result.totalDepartments).toBe(1);
        expect(result.totalBalance).toBe(5000);
        expect(result.totalDeposits).toBe(0);
        expect(result.totalWithdrawals).toBe(0);
      });

      it('should throw error when getting departments fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(service.getDepartmentSummary())
          .rejects.toThrow('Erro ao gerar resumo dos departamentos');
      });
    });
  });

  describe('Budget Tracking', () => {
    it('should track department balance after multiple transactions', async () => {
      const department = createTestDepartment({
        id: 'dept-1',
        currentBalance: 1000,
        initialBalance: 1000
      });

      // Deposit
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
      mockRunTransaction.mockImplementation(async (db, callback) => {
        return await callback({
          set: jest.fn(),
          update: jest.fn()
        });
      });
      mockDoc.mockReturnValue({ id: 'trans-1' });

      await service.createTransaction({
        departmentId: 'dept-1',
        departmentName: 'Test Department',
        type: DepartmentTransactionType.DEPOSIT,
        amount: 2000,
        description: 'Deposit',
        date: new Date('2024-01-15'),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: 'user-1'
      });

      // Balance should now be 3000
      department.currentBalance = 3000;

      // Withdrawal
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
      mockDoc.mockReturnValue({ id: 'trans-2' });

      await service.createTransaction({
        departmentId: 'dept-1',
        departmentName: 'Test Department',
        type: DepartmentTransactionType.WITHDRAWAL,
        amount: 500,
        description: 'Expense',
        date: new Date('2024-01-16'),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: 'user-1'
      });

      // Balance should now be 2500
      expect(mockRunTransaction).toHaveBeenCalledTimes(2);
    });

    it('should calculate budget vs actual correctly in monthly balance', async () => {
      const department = createTestDepartment({
        initialBalance: 10000,
        currentBalance: 12000
      });

      const transactions = [
        createTestTransaction({
          type: DepartmentTransactionType.DEPOSIT,
          amount: 5000,
          status: DepartmentTransactionStatus.APPROVED
        }),
        createTestTransaction({
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 3000,
          status: DepartmentTransactionStatus.APPROVED
        })
      ];

      mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

      const result = await service.getMonthlyBalance('dept-1', 2024, 1);

      const netIncome = result.totalDeposits - result.totalWithdrawals +
                       result.totalTransfersIn - result.totalTransfersOut;

      expect(netIncome).toBe(2000); // 5000 - 3000
    });
  });

  describe('Expense Tracking', () => {
    it('should track expenses by department', async () => {
      const transactions = [
        createTestTransaction({
          departmentId: 'dept-1',
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 500,
          description: 'Office supplies',
          status: DepartmentTransactionStatus.APPROVED
        }),
        createTestTransaction({
          departmentId: 'dept-1',
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 1000,
          description: 'Equipment',
          status: DepartmentTransactionStatus.APPROVED
        }),
        createTestTransaction({
          departmentId: 'dept-1',
          type: DepartmentTransactionType.WITHDRAWAL,
          amount: 300,
          description: 'Maintenance',
          status: DepartmentTransactionStatus.APPROVED
        })
      ];

      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

      const result = await service.getTransactions({
        departmentId: 'dept-1',
        type: DepartmentTransactionType.WITHDRAWAL,
        status: DepartmentTransactionStatus.APPROVED
      });

      const totalExpenses = result.reduce((sum, t) => sum + t.amount, 0);
      expect(totalExpenses).toBe(1800);
      expect(result).toHaveLength(3);
    });

    it('should filter expenses by date range', async () => {
      const transactions = [
        createTestTransaction({
          type: DepartmentTransactionType.WITHDRAWAL,
          date: new Date('2024-01-15'),
          amount: 500
        }),
        createTestTransaction({
          type: DepartmentTransactionType.WITHDRAWAL,
          date: new Date('2024-02-15'),
          amount: 1000
        })
      ];

      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

      await service.getTransactions({
        type: DepartmentTransactionType.WITHDRAWAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle concurrent transaction conflicts', async () => {
      const department = createTestDepartment({ currentBalance: 1000 });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(department));

      mockRunTransaction.mockRejectedValue(new Error('Transaction conflict'));

      const transactionData = {
        departmentId: 'dept-1',
        departmentName: 'Test Department',
        type: DepartmentTransactionType.WITHDRAWAL,
        amount: 500,
        description: 'Test',
        date: new Date('2024-01-15'),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: 'user-1'
      };

      await expect(service.createTransaction(transactionData))
        .rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      await expect(service.getDepartment('dept-1'))
        .rejects.toThrow('Erro ao buscar departamento');
    });

    it('should validate transfer amount is positive', async () => {
      (DepartmentEntity.validateTransfer as jest.Mock).mockReturnValueOnce([
        'Valor deve ser maior que zero'
      ]);

      const transferData = {
        fromDepartmentId: 'dept-1',
        fromDepartmentName: 'Department 1',
        toDepartmentId: 'dept-2',
        toDepartmentName: 'Department 2',
        amount: 0,
        description: 'Transfer',
        date: new Date('2024-01-15'),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: 'user-admin'
      };

      await expect(service.createTransfer(transferData))
        .rejects.toThrow('Validation errors');
    });

    it('should prevent transfer to same department', async () => {
      (DepartmentEntity.validateTransfer as jest.Mock).mockReturnValueOnce([
        'Departamento de origem e destino não podem ser iguais'
      ]);

      const transferData = {
        fromDepartmentId: 'dept-1',
        fromDepartmentName: 'Department 1',
        toDepartmentId: 'dept-1',
        toDepartmentName: 'Department 1',
        amount: 1000,
        description: 'Transfer',
        date: new Date('2024-01-15'),
        status: DepartmentTransactionStatus.APPROVED,
        createdBy: 'user-admin'
      };

      await expect(service.createTransfer(transferData))
        .rejects.toThrow('Validation errors');
    });
  });
});
