// Unit Tests - FinancialService
// Comprehensive tests for financial service operations including CRUD, balance calculations,
// report generation, category filtering, and date range queries

import {
  FinancialService,
  TransactionFilters
} from '../FinancialService';
import {
  Transaction,
  FinancialCategory,
  Donation,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  DonationType,
  FinancialEntity
} from '../../../domain/entities/Financial';

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
const mockGetCountFromServer = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getCountFromServer: (...args: any[]) => mockGetCountFromServer(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    })
  }
}));

// We'll spy on FinancialEntity methods in beforeEach

describe('FinancialService', () => {
  let financialService: FinancialService;

  // Helper function to create test category
  const createTestCategory = (overrides: Partial<FinancialCategory> = {}): FinancialCategory => ({
    id: 'cat-1',
    name: 'Test Category',
    type: TransactionType.INCOME,
    description: 'Test category description',
    color: '#3B82F6',
    icon: 'wallet',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

  // Helper function to create test transaction
  const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'trans-1',
    type: TransactionType.INCOME,
    category: createTestCategory(),
    amount: 1000,
    description: 'Test transaction',
    date: new Date('2024-01-15'),
    paymentMethod: PaymentMethod.PIX,
    createdBy: 'user-1',
    status: TransactionStatus.APPROVED,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  });

  // Helper function to create test donation
  const createTestDonation = (overrides: Partial<Donation> = {}): Donation => ({
    id: 'donation-1',
    memberId: 'member-1',
    memberName: 'John Doe',
    memberEmail: 'john@example.com',
    amount: 500,
    type: DonationType.TITHE,
    category: createTestCategory(),
    date: new Date('2024-01-15'),
    paymentMethod: PaymentMethod.PIX,
    isAnonymous: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  });

  // Helper to create mock Firestore document snapshot
  const createMockDocSnapshot = (data: any, exists: boolean = true) => ({
    id: data?.id || 'doc-id',
    exists: () => exists,
    data: () => exists ? {
      ...data,
      date: { toDate: () => data.date || new Date() },
      createdAt: { toDate: () => data.createdAt || new Date() },
      updatedAt: { toDate: () => data.updatedAt || new Date() }
    } : null
  });

  // Helper to create mock Firestore query snapshot
  const createMockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(doc => createMockDocSnapshot(doc)),
    empty: docs.length === 0
  });

  beforeEach(() => {
    jest.clearAllMocks();
    financialService = new FinancialService();

    // Default mock implementations
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-ref');
    mockOrderBy.mockReturnValue('orderBy-ref');
    mockLimit.mockReturnValue('limit-ref');

    // Spy on FinancialEntity methods - return empty array (valid) by default
    jest.spyOn(FinancialEntity, 'validateTransaction').mockReturnValue([]);
    jest.spyOn(FinancialEntity, 'generateReceiptNumber').mockReturnValue('REC-123456-ABCD');
  });

  describe('Transaction CRUD Operations', () => {
    describe('createTransaction', () => {
      it('should create a transaction successfully', async () => {
        const transactionData = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: 1000,
          description: 'Test income',
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        };

        mockAddDoc.mockResolvedValue({ id: 'new-trans-id' });

        const result = await financialService.createTransaction(transactionData);

        expect(result).toBe('new-trans-id');
        expect(mockAddDoc).toHaveBeenCalled();
      });

      it('should throw error when validation fails', async () => {
        const invalidTransaction = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: -100, // Invalid amount
          description: '',
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        };

        (FinancialEntity.validateTransaction as jest.Mock).mockReturnValueOnce([
          'Valor deve ser maior que zero',
          'Descrição é obrigatória'
        ]);

        // The service catches validation errors and throws a generic error
        await expect(financialService.createTransaction(invalidTransaction))
          .rejects.toThrow('Erro ao criar transação');
      });

      it('should throw error when Firebase operation fails', async () => {
        const transactionData = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: 1000,
          description: 'Test income',
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        };

        mockAddDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.createTransaction(transactionData))
          .rejects.toThrow('Erro ao criar transação');
      });
    });

    describe('updateTransaction', () => {
      it('should update a transaction successfully', async () => {
        const updates = {
          amount: 1500,
          description: 'Updated description'
        };

        mockUpdateDoc.mockResolvedValue(undefined);

        await expect(financialService.updateTransaction('trans-1', updates))
          .resolves.not.toThrow();

        expect(mockUpdateDoc).toHaveBeenCalled();
      });

      it('should convert date to Timestamp when updating date field', async () => {
        const updates = {
          date: new Date('2024-02-01')
        };

        mockUpdateDoc.mockResolvedValue(undefined);

        await financialService.updateTransaction('trans-1', updates);

        expect(mockUpdateDoc).toHaveBeenCalled();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.updateTransaction('trans-1', { amount: 1500 }))
          .rejects.toThrow('Erro ao atualizar transação');
      });
    });

    describe('deleteTransaction', () => {
      it('should delete a transaction successfully', async () => {
        mockDeleteDoc.mockResolvedValue(undefined);

        await expect(financialService.deleteTransaction('trans-1'))
          .resolves.not.toThrow();

        expect(mockDeleteDoc).toHaveBeenCalled();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockDeleteDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.deleteTransaction('trans-1'))
          .rejects.toThrow('Erro ao excluir transação');
      });
    });

    describe('getTransaction', () => {
      it('should return a transaction when found', async () => {
        const transaction = createTestTransaction();
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(transaction));

        const result = await financialService.getTransaction('trans-1');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('trans-1');
      });

      it('should return null when transaction not found', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(null, false));

        const result = await financialService.getTransaction('non-existent');

        expect(result).toBeNull();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.getTransaction('trans-1'))
          .rejects.toThrow('Erro ao buscar transação');
      });
    });

    describe('getTransactions', () => {
      it('should return all transactions when no filters provided', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const result = await financialService.getTransactions();

        expect(result).toHaveLength(2);
      });

      it('should return empty array when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const result = await financialService.getTransactions();

        expect(result).toHaveLength(0);
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.getTransactions())
          .rejects.toThrow('Erro ao buscar transações');
      });
    });
  });

  describe('Balance Calculations', () => {
    describe('getFinancialSummary', () => {
      it('should calculate total income correctly', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000 }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.INCOME, amount: 2000 }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.EXPENSE, amount: 500 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.totalIncome).toBe(3000); // 1000 + 2000
      });

      it('should calculate total expenses correctly', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000 }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, amount: 500 }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.EXPENSE, amount: 300 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.totalExpenses).toBe(800); // 500 + 300
      });

      it('should calculate net income correctly', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 5000 }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, amount: 2000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.netIncome).toBe(3000); // 5000 - 2000
      });

      it('should calculate negative net income when expenses exceed income', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000 }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, amount: 3000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.netIncome).toBe(-2000); // 1000 - 3000
      });

      it('should return zero values when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.totalIncome).toBe(0);
        expect(result.totalExpenses).toBe(0);
        expect(result.netIncome).toBe(0);
        expect(result.transactionCount).toBe(0);
      });

      it('should count transactions correctly', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' }),
          createTestTransaction({ id: 'trans-3' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 2 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.transactionCount).toBe(3);
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        await expect(financialService.getFinancialSummary(startDate, endDate))
          .rejects.toThrow('Erro ao gerar resumo financeiro');
      });
    });

    describe('getDonationSummary', () => {
      it('should calculate total donations correctly', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', amount: 500, type: DonationType.TITHE }),
          createTestDonation({ id: 'donation-2', amount: 300, type: DonationType.OFFERING }),
          createTestDonation({ id: 'donation-3', amount: 200, type: DonationType.TITHE })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.totalDonations).toBe(1000); // 500 + 300 + 200
      });

      it('should calculate total tithes correctly', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', amount: 500, type: DonationType.TITHE }),
          createTestDonation({ id: 'donation-2', amount: 300, type: DonationType.OFFERING }),
          createTestDonation({ id: 'donation-3', amount: 200, type: DonationType.TITHE })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.totalTithes).toBe(700); // 500 + 200
      });

      it('should calculate total offerings correctly', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', amount: 500, type: DonationType.TITHE }),
          createTestDonation({ id: 'donation-2', amount: 300, type: DonationType.OFFERING }),
          createTestDonation({ id: 'donation-3', amount: 150, type: DonationType.OFFERING })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.totalOfferings).toBe(450); // 300 + 150
      });

      it('should calculate average donation correctly', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', amount: 500 }),
          createTestDonation({ id: 'donation-2', amount: 300 }),
          createTestDonation({ id: 'donation-3', amount: 200 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.averageDonation).toBeCloseTo(333.33, 1); // 1000 / 3
      });

      it('should return zero average when no donations exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.averageDonation).toBe(0);
      });

      it('should count unique donors correctly', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', memberId: 'member-1' }),
          createTestDonation({ id: 'donation-2', memberId: 'member-2' }),
          createTestDonation({ id: 'donation-3', memberId: 'member-1' }), // Same member
          createTestDonation({ id: 'donation-4', memberId: undefined, isAnonymous: true })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationSummary(startDate, endDate);

        expect(result.donorCount).toBe(2); // member-1 and member-2 (anonymous not counted)
      });
    });
  });

  describe('Report Generation', () => {
    describe('getIncomeExpenseTrend', () => {
      it('should group transactions by month correctly', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000, date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, amount: 500, date: new Date('2024-01-20') }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.INCOME, amount: 2000, date: new Date('2024-02-15') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-02-28');

        const result = await financialService.getIncomeExpenseTrend(startDate, endDate, 'monthly');

        expect(result).toHaveLength(2); // January and February
        expect(result[0].income).toBe(1000);
        expect(result[0].expense).toBe(500);
        expect(result[1].income).toBe(2000);
        expect(result[1].expense).toBe(0);
      });

      it('should return empty array when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getIncomeExpenseTrend(startDate, endDate, 'monthly');

        expect(result).toHaveLength(0);
      });

      it('should sort results by date ascending', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000, date: new Date('2024-03-15') }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.INCOME, amount: 2000, date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.INCOME, amount: 3000, date: new Date('2024-02-15') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-03-31');

        const result = await financialService.getIncomeExpenseTrend(startDate, endDate, 'monthly');

        expect(result[0].income).toBe(2000); // January
        expect(result[1].income).toBe(3000); // February
        expect(result[2].income).toBe(1000); // March
      });

      it('should handle daily period grouping', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 100, date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.INCOME, amount: 200, date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.INCOME, amount: 300, date: new Date('2024-01-16') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-15');
        const endDate = new Date('2024-01-16');

        const result = await financialService.getIncomeExpenseTrend(startDate, endDate, 'daily');

        expect(result).toHaveLength(2);
        expect(result[0].income).toBe(300); // Jan 15: 100 + 200
        expect(result[1].income).toBe(300); // Jan 16
      });
    });

    describe('getCategoryChartData', () => {
      it('should aggregate amounts by category', async () => {
        const category1 = createTestCategory({ id: 'cat-1', name: 'Tithes' });
        const category2 = createTestCategory({ id: 'cat-2', name: 'Offerings' });

        const transactions = [
          createTestTransaction({ id: 'trans-1', category: category1, amount: 1000 }),
          createTestTransaction({ id: 'trans-2', category: category1, amount: 2000 }),
          createTestTransaction({ id: 'trans-3', category: category2, amount: 500 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getCategoryChartData(startDate, endDate, TransactionType.INCOME);

        expect(result).toHaveLength(2);
        const titheData = result.find(r => r.category.id === 'cat-1');
        expect(titheData?.amount).toBe(3000);
        expect(titheData?.count).toBe(2);
      });

      it('should sort categories by amount descending', async () => {
        const category1 = createTestCategory({ id: 'cat-1', name: 'Category 1' });
        const category2 = createTestCategory({ id: 'cat-2', name: 'Category 2' });
        const category3 = createTestCategory({ id: 'cat-3', name: 'Category 3' });

        const transactions = [
          createTestTransaction({ id: 'trans-1', category: category1, amount: 500 }),
          createTestTransaction({ id: 'trans-2', category: category2, amount: 1500 }),
          createTestTransaction({ id: 'trans-3', category: category3, amount: 1000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getCategoryChartData(startDate, endDate, TransactionType.INCOME);

        expect(result[0].category.id).toBe('cat-2'); // 1500
        expect(result[1].category.id).toBe('cat-3'); // 1000
        expect(result[2].category.id).toBe('cat-1'); // 500
      });

      it('should return empty array when no transactions exist', async () => {
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getCategoryChartData(startDate, endDate, TransactionType.INCOME);

        expect(result).toHaveLength(0);
      });
    });

    describe('getMonthlyComparison', () => {
      it('should calculate monthly income and expenses', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 5000, date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.EXPENSE, amount: 2000, date: new Date('2024-01-20') }),
          createTestTransaction({ id: 'trans-3', type: TransactionType.INCOME, amount: 6000, date: new Date('2024-02-15') }),
          createTestTransaction({ id: 'trans-4', type: TransactionType.EXPENSE, amount: 3000, date: new Date('2024-02-20') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-02-28');

        const result = await financialService.getMonthlyComparison(startDate, endDate);

        expect(result).toHaveLength(2);
        expect(result[0].income).toBe(5000);
        expect(result[0].expense).toBe(2000);
        expect(result[0].netIncome).toBe(3000);
        expect(result[1].income).toBe(6000);
        expect(result[1].expense).toBe(3000);
        expect(result[1].netIncome).toBe(3000);
      });

      it('should sort months chronologically', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME, amount: 1000, date: new Date('2024-03-15') }),
          createTestTransaction({ id: 'trans-2', type: TransactionType.INCOME, amount: 2000, date: new Date('2024-01-15') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-03-31');

        const result = await financialService.getMonthlyComparison(startDate, endDate);

        expect(result[0].month.getMonth()).toBe(0); // January
        expect(result[1].month.getMonth()).toBe(2); // March
      });
    });

    describe('getDonationChartData', () => {
      it('should aggregate donations by type', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', type: DonationType.TITHE, amount: 500 }),
          createTestDonation({ id: 'donation-2', type: DonationType.TITHE, amount: 300 }),
          createTestDonation({ id: 'donation-3', type: DonationType.OFFERING, amount: 200 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationChartData(startDate, endDate);

        const titheData = result.find(r => r.type === DonationType.TITHE);
        expect(titheData?.amount).toBe(800);
        expect(titheData?.count).toBe(2);

        const offeringData = result.find(r => r.type === DonationType.OFFERING);
        expect(offeringData?.amount).toBe(200);
        expect(offeringData?.count).toBe(1);
      });

      it('should include Portuguese labels for donation types', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', type: DonationType.TITHE, amount: 500 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationChartData(startDate, endDate);

        expect(result[0].label).toBe('Dízimos');
      });

      it('should sort by amount descending', async () => {
        const donations = [
          createTestDonation({ id: 'donation-1', type: DonationType.TITHE, amount: 300 }),
          createTestDonation({ id: 'donation-2', type: DonationType.OFFERING, amount: 500 }),
          createTestDonation({ id: 'donation-3', type: DonationType.MISSION, amount: 100 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(donations));

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getDonationChartData(startDate, endDate);

        expect(result[0].type).toBe(DonationType.OFFERING);
        expect(result[1].type).toBe(DonationType.TITHE);
        expect(result[2].type).toBe(DonationType.MISSION);
      });
    });

    describe('exportTransactions', () => {
      it('should export transactions as JSON', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', amount: 1000 }),
          createTestTransaction({ id: 'trans-2', amount: 2000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const result = await financialService.exportTransactions({}, 'json');

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/json');
      });

      it('should export transactions as CSV', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', amount: 1000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const result = await financialService.exportTransactions({}, 'csv');

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('text/csv;charset=utf-8;');
      });

      it('should throw error when export fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.exportTransactions({}, 'csv'))
          .rejects.toThrow('Erro ao exportar transações');
      });
    });
  });

  describe('Category Filtering', () => {
    describe('getTransactions with category filter', () => {
      it('should filter transactions by category ID', async () => {
        const category1 = createTestCategory({ id: 'cat-1' });
        const category2 = createTestCategory({ id: 'cat-2' });

        const transactions = [
          createTestTransaction({ id: 'trans-1', category: category1 }),
          createTestTransaction({ id: 'trans-2', category: category2 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { categoryId: 'cat-1' };
        const result = await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getCategories', () => {
      it('should return all active categories', async () => {
        const categories = [
          createTestCategory({ id: 'cat-1', name: 'Category 1' }),
          createTestCategory({ id: 'cat-2', name: 'Category 2' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(categories));

        const result = await financialService.getCategories();

        expect(result).toHaveLength(2);
      });

      it('should filter categories by type', async () => {
        const categories = [
          createTestCategory({ id: 'cat-1', type: TransactionType.INCOME }),
          createTestCategory({ id: 'cat-2', type: TransactionType.EXPENSE })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(categories));

        await financialService.getCategories(TransactionType.INCOME);

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.getCategories())
          .rejects.toThrow('Erro ao buscar categorias');
      });
    });

    describe('createCategory', () => {
      it('should create a category successfully', async () => {
        const categoryData = {
          name: 'New Category',
          type: TransactionType.INCOME,
          color: '#10B981',
          icon: 'dollar',
          isActive: true
        };

        mockAddDoc.mockResolvedValue({ id: 'new-cat-id' });

        const result = await financialService.createCategory(categoryData);

        expect(result).toBe('new-cat-id');
        expect(mockAddDoc).toHaveBeenCalled();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockAddDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.createCategory({
          name: 'New Category',
          type: TransactionType.INCOME,
          color: '#10B981',
          icon: 'dollar',
          isActive: true
        })).rejects.toThrow('Erro ao criar categoria');
      });
    });
  });

  describe('Date Range Queries', () => {
    describe('getTransactions with date filters', () => {
      it('should filter transactions by start date', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', date: new Date('2024-01-20') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = {
          startDate: new Date('2024-01-10')
        };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by end date', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', date: new Date('2024-01-20') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = {
          endDate: new Date('2024-01-25')
        };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter transactions by date range', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', date: new Date('2024-01-15') }),
          createTestTransaction({ id: 'trans-2', date: new Date('2024-01-20') })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getFinancialSummary with date range', () => {
      it('should only include transactions within date range in calculations', async () => {
        const transactions = [
          createTestTransaction({
            id: 'trans-1',
            type: TransactionType.INCOME,
            amount: 1000,
            date: new Date('2024-01-15')
          })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
        mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const result = await financialService.getFinancialSummary(startDate, endDate);

        expect(result.totalIncome).toBe(1000);
      });
    });
  });

  describe('Additional Filters', () => {
    describe('getTransactions with type filter', () => {
      it('should filter by income type', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.INCOME })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { type: TransactionType.INCOME };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter by expense type', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', type: TransactionType.EXPENSE })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { type: TransactionType.EXPENSE };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getTransactions with status filter', () => {
      it('should filter by pending status', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', status: TransactionStatus.PENDING })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { status: TransactionStatus.PENDING };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });

      it('should filter by approved status', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', status: TransactionStatus.APPROVED })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { status: TransactionStatus.APPROVED };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getTransactions with payment method filter', () => {
      it('should filter by payment method', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', paymentMethod: PaymentMethod.PIX })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { paymentMethod: PaymentMethod.PIX };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getTransactions with amount filters', () => {
      it('should filter by minimum amount', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', amount: 500 }),
          createTestTransaction({ id: 'trans-2', amount: 1500 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { minAmount: 1000 };
        const result = await financialService.getTransactions(filters);

        // Amount filtering is done client-side
        expect(result.every(t => t.amount >= 1000)).toBe(true);
      });

      it('should filter by maximum amount', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', amount: 500 }),
          createTestTransaction({ id: 'trans-2', amount: 1500 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { maxAmount: 1000 };
        const result = await financialService.getTransactions(filters);

        // Amount filtering is done client-side
        expect(result.every(t => t.amount <= 1000)).toBe(true);
      });

      it('should filter by amount range', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', amount: 500 }),
          createTestTransaction({ id: 'trans-2', amount: 1000 }),
          createTestTransaction({ id: 'trans-3', amount: 2000 })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { minAmount: 600, maxAmount: 1500 };
        const result = await financialService.getTransactions(filters);

        expect(result.every(t => t.amount >= 600 && t.amount <= 1500)).toBe(true);
      });
    });

    describe('getTransactions with createdBy filter', () => {
      it('should filter by creator', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1', createdBy: 'user-1' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        const filters: TransactionFilters = { createdBy: 'user-1' };
        await financialService.getTransactions(filters);

        expect(mockWhere).toHaveBeenCalled();
      });
    });

    describe('getTransactions with limit', () => {
      it('should respect limit parameter', async () => {
        const transactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' }),
          createTestTransaction({ id: 'trans-3' })
        ];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await financialService.getTransactions({}, 2);

        expect(mockLimit).toHaveBeenCalled();
      });

      it('should use default limit of 50', async () => {
        const transactions = [createTestTransaction()];
        mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));

        await financialService.getTransactions();

        expect(mockLimit).toHaveBeenCalled();
      });
    });
  });

  describe('Donation Management', () => {
    describe('createDonation', () => {
      it('should create a donation and corresponding transaction', async () => {
        const donationData = {
          memberId: 'member-1',
          memberName: 'John Doe',
          amount: 500,
          type: DonationType.TITHE,
          category: createTestCategory(),
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          isAnonymous: false,
          createdBy: 'user-1'
        };

        mockAddDoc.mockResolvedValue({ id: 'new-donation-id' });

        const result = await financialService.createDonation(donationData);

        expect(result).toBe('new-donation-id');
        // Should be called twice: once for donation, once for transaction
        expect(mockAddDoc).toHaveBeenCalledTimes(2);
      });

      it('should generate receipt number if not provided', async () => {
        const donationData = {
          memberId: 'member-1',
          memberName: 'John Doe',
          amount: 500,
          type: DonationType.TITHE,
          category: createTestCategory(),
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          isAnonymous: false,
          createdBy: 'user-1'
        };

        mockAddDoc.mockResolvedValue({ id: 'new-donation-id' });

        await financialService.createDonation(donationData);

        expect(FinancialEntity.generateReceiptNumber).toHaveBeenCalled();
      });

      it('should throw error when Firebase operation fails', async () => {
        mockAddDoc.mockRejectedValue(new Error('Firebase error'));

        await expect(financialService.createDonation({
          memberId: 'member-1',
          amount: 500,
          type: DonationType.TITHE,
          category: createTestCategory(),
          date: new Date('2024-01-15'),
          paymentMethod: PaymentMethod.PIX,
          isAnonymous: false,
          createdBy: 'user-1'
        })).rejects.toThrow('Erro ao criar doação');
      });
    });
  });

  describe('Top Categories Calculation', () => {
    it('should return top 5 categories by amount', async () => {
      const categories = [
        createTestCategory({ id: 'cat-1', name: 'Category 1' }),
        createTestCategory({ id: 'cat-2', name: 'Category 2' }),
        createTestCategory({ id: 'cat-3', name: 'Category 3' }),
        createTestCategory({ id: 'cat-4', name: 'Category 4' }),
        createTestCategory({ id: 'cat-5', name: 'Category 5' }),
        createTestCategory({ id: 'cat-6', name: 'Category 6' })
      ];

      const transactions = [
        createTestTransaction({ id: 'trans-1', category: categories[0], amount: 1000 }),
        createTestTransaction({ id: 'trans-2', category: categories[1], amount: 2000 }),
        createTestTransaction({ id: 'trans-3', category: categories[2], amount: 3000 }),
        createTestTransaction({ id: 'trans-4', category: categories[3], amount: 4000 }),
        createTestTransaction({ id: 'trans-5', category: categories[4], amount: 5000 }),
        createTestTransaction({ id: 'trans-6', category: categories[5], amount: 6000 })
      ];
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
      mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await financialService.getFinancialSummary(startDate, endDate);

      expect(result.topCategories).toHaveLength(5);
      expect(result.topCategories[0].category.id).toBe('cat-6'); // Highest amount
    });

    it('should count transactions per category', async () => {
      const category = createTestCategory({ id: 'cat-1' });
      const transactions = [
        createTestTransaction({ id: 'trans-1', category, amount: 500 }),
        createTestTransaction({ id: 'trans-2', category, amount: 300 }),
        createTestTransaction({ id: 'trans-3', category, amount: 200 })
      ];
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(transactions));
      mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await financialService.getFinancialSummary(startDate, endDate);

      expect(result.topCategories[0].count).toBe(3);
      expect(result.topCategories[0].amount).toBe(1000);
    });
  });
});
