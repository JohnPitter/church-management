// Unit Tests - ONGFinancialService
// Tests for ONG Financial service layer operations

import { ONGFinancialService, ONGTransactionFilters } from '../ONGFinancialService';
import {
  Transaction,
  FinancialCategory,
  TransactionType,
  TransactionStatus,
  PaymentMethod
} from '../../../../church-finance/domain/entities/Financial';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }))
  },
  getCountFromServer: jest.fn()
}));

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

describe('ONGFinancialService', () => {
  let ongFinancialService: ONGFinancialService;

  // Test data factories
  const createTestCategory = (overrides: Partial<FinancialCategory> = {}): FinancialCategory => ({
    id: 'category-1',
    name: 'Doações',
    type: TransactionType.INCOME,
    description: 'Categoria de doações',
    color: '#4CAF50',
    icon: 'dollar-sign',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

  const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'transaction-1',
    type: TransactionType.INCOME,
    category: createTestCategory(),
    amount: 1000.00,
    description: 'Doação para projeto social',
    date: new Date('2024-01-15'),
    paymentMethod: PaymentMethod.PIX,
    reference: 'REF-001',
    notes: 'Doação anônima',
    createdBy: 'user-1',
    status: TransactionStatus.APPROVED,
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    ongFinancialService = new ONGFinancialService();

    // Reset Firestore mocks
    (firestore.query as jest.Mock).mockImplementation((...args) => args);
    (firestore.where as jest.Mock).mockImplementation((field, op, value) => ({ field, op, value }));
    (firestore.orderBy as jest.Mock).mockImplementation((field, direction) => ({ field, direction }));
    (firestore.limit as jest.Mock).mockImplementation((count) => ({ limit: count }));
    (firestore.collection as jest.Mock).mockReturnValue({ _path: 'collection' });
    (firestore.doc as jest.Mock).mockReturnValue({ _path: 'doc' });
  });

  // ==================== TRANSACTION MANAGEMENT ====================
  describe('Transaction Management', () => {
    describe('createTransaction', () => {
      it('should create a new transaction successfully', async () => {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: 500.00,
          description: 'Doação recebida',
          date: new Date('2024-02-01'),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.APPROVED
        };

        const mockDocRef = { id: 'new-transaction-id' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const result = await ongFinancialService.createTransaction(transactionData);

        expect(firestore.addDoc).toHaveBeenCalled();
        expect(result).toBe('new-transaction-id');
      });

      it('should validate transaction before creation', async () => {
        const invalidTransaction: any = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: -100, // Invalid: negative amount
          description: '',
          date: new Date(),
          paymentMethod: PaymentMethod.CASH,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        };

        await expect(ongFinancialService.createTransaction(invalidTransaction))
          .rejects.toThrow();
      });

      it('should create pending transaction without updating budget', async () => {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: TransactionType.EXPENSE,
          category: createTestCategory({ type: TransactionType.EXPENSE }),
          amount: 300.00,
          description: 'Despesa pendente',
          date: new Date('2024-02-01'),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        };

        const mockDocRef = { id: 'pending-transaction-id' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const result = await ongFinancialService.createTransaction(transactionData);

        expect(result).toBe('pending-transaction-id');
      });

      it('should handle creation errors', async () => {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: 500.00,
          description: 'Test transaction',
          date: new Date(),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.APPROVED
        };

        (firestore.addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        await expect(ongFinancialService.createTransaction(transactionData))
          .rejects.toThrow('Erro ao criar transação da ONG');
      });

      it('should create transaction with optional fields', async () => {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: TransactionType.EXPENSE,
          category: createTestCategory({ type: TransactionType.EXPENSE }),
          amount: 750.00,
          description: 'Despesa com equipamentos',
          date: new Date('2024-02-05'),
          paymentMethod: PaymentMethod.CREDIT_CARD,
          reference: 'INV-12345',
          notes: 'Compra de notebooks',
          attachments: ['https://example.com/invoice.pdf'],
          createdBy: 'user-1',
          approvedBy: 'admin-1',
          status: TransactionStatus.APPROVED,
          isRecurring: false
        };

        const mockDocRef = { id: 'transaction-with-details' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const result = await ongFinancialService.createTransaction(transactionData);

        expect(result).toBe('transaction-with-details');
        expect(firestore.addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            reference: 'INV-12345',
            notes: 'Compra de notebooks',
            attachments: ['https://example.com/invoice.pdf']
          })
        );
      });
    });

    describe('updateTransaction', () => {
      it('should update transaction successfully', async () => {
        const updates: Partial<Transaction> = {
          description: 'Descrição atualizada',
          amount: 1500.00
        };

        (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

        await ongFinancialService.updateTransaction('transaction-1', updates);

        expect(firestore.updateDoc).toHaveBeenCalled();
      });

      it('should handle date updates correctly', async () => {
        const newDate = new Date('2024-03-01');
        const updates: Partial<Transaction> = {
          date: newDate
        };

        (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

        await ongFinancialService.updateTransaction('transaction-1', updates);

        expect(firestore.updateDoc).toHaveBeenCalled();
        const callArgs = (firestore.updateDoc as jest.Mock).mock.calls[0];
        expect(callArgs[1]).toHaveProperty('date');
        expect(callArgs[1]).toHaveProperty('updatedAt');
      });

      it('should update transaction status to approved', async () => {
        const updates: Partial<Transaction> = {
          status: TransactionStatus.APPROVED,
          category: createTestCategory(),
          amount: 1000.00,
          type: TransactionType.INCOME
        };

        (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

        await ongFinancialService.updateTransaction('transaction-1', updates);

        expect(firestore.updateDoc).toHaveBeenCalled();
      });

      it('should handle update errors', async () => {
        (firestore.updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

        await expect(ongFinancialService.updateTransaction('transaction-1', { amount: 2000 }))
          .rejects.toThrow('Erro ao atualizar transação da ONG');
      });
    });

    describe('deleteTransaction', () => {
      it('should delete transaction successfully', async () => {
        (firestore.deleteDoc as jest.Mock).mockResolvedValue(undefined);

        await ongFinancialService.deleteTransaction('transaction-to-delete');

        expect(firestore.deleteDoc).toHaveBeenCalled();
      });

      it('should handle deletion errors', async () => {
        (firestore.deleteDoc as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

        await expect(ongFinancialService.deleteTransaction('transaction-1'))
          .rejects.toThrow('Erro ao excluir transação da ONG');
      });
    });

    describe('getTransaction', () => {
      it('should get transaction by ID successfully', async () => {
        const mockTransaction = createTestTransaction();
        const mockDocSnap = {
          exists: () => true,
          id: 'transaction-1',
          data: () => ({
            ...mockTransaction,
            date: { toDate: () => mockTransaction.date },
            createdAt: { toDate: () => mockTransaction.createdAt },
            updatedAt: { toDate: () => mockTransaction.updatedAt }
          })
        };

        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

        const result = await ongFinancialService.getTransaction('transaction-1');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('transaction-1');
        expect(result?.amount).toBe(mockTransaction.amount);
      });

      it('should return null when transaction not found', async () => {
        const mockDocSnap = {
          exists: () => false
        };

        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

        const result = await ongFinancialService.getTransaction('non-existent-id');

        expect(result).toBeNull();
      });

      it('should handle errors when getting transaction', async () => {
        (firestore.getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        await expect(ongFinancialService.getTransaction('transaction-1'))
          .rejects.toThrow('Erro ao buscar transação da ONG');
      });
    });

    describe('getTransactions', () => {
      it('should get all transactions without filters', async () => {
        const mockTransactions = [
          createTestTransaction({ id: 'trans-1' }),
          createTestTransaction({ id: 'trans-2' })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getTransactions();

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('trans-1');
        expect(result[1].id).toBe('trans-2');
      });

      it('should filter transactions by type', async () => {
        const filters: ONGTransactionFilters = {
          type: TransactionType.INCOME
        };

        const mockSnapshot = {
          docs: [
            {
              id: 'income-1',
              data: () => ({
                ...createTestTransaction({ type: TransactionType.INCOME }),
                date: { toDate: () => new Date() },
                createdAt: { toDate: () => new Date() },
                updatedAt: { toDate: () => new Date() }
              })
            }
          ]
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getTransactions(filters);

        expect(result).toHaveLength(1);
        expect(firestore.where).toHaveBeenCalledWith('type', '==', TransactionType.INCOME);
      });

      it('should filter transactions by category', async () => {
        const filters: ONGTransactionFilters = {
          categoryId: 'category-123'
        };

        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getTransactions(filters);

        expect(firestore.where).toHaveBeenCalledWith('category.id', '==', 'category-123');
      });

      it('should filter transactions by status', async () => {
        const filters: ONGTransactionFilters = {
          status: TransactionStatus.APPROVED
        };

        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getTransactions(filters);

        expect(firestore.where).toHaveBeenCalledWith('status', '==', TransactionStatus.APPROVED);
      });

      it('should filter transactions by date range', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        const filters: ONGTransactionFilters = {
          startDate,
          endDate
        };

        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getTransactions(filters);

        // Check that where was called with date filters
        const whereCalls = (firestore.where as jest.Mock).mock.calls;
        const hasStartDateFilter = whereCalls.some(call =>
          call[0] === 'date' && call[1] === '>='
        );
        const hasEndDateFilter = whereCalls.some(call =>
          call[0] === 'date' && call[1] === '<='
        );

        expect(hasStartDateFilter).toBe(true);
        expect(hasEndDateFilter).toBe(true);
      });

      it('should filter transactions by amount range', async () => {
        const filters: ONGTransactionFilters = {
          minAmount: 100,
          maxAmount: 1000
        };

        const mockTransactions = [
          createTestTransaction({ id: 'trans-1', amount: 500 }),
          createTestTransaction({ id: 'trans-2', amount: 50 }), // Below min
          createTestTransaction({ id: 'trans-3', amount: 1500 }) // Above max
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getTransactions(filters);

        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe(500);
      });

      it('should apply multiple filters simultaneously', async () => {
        const filters: ONGTransactionFilters = {
          type: TransactionType.EXPENSE,
          status: TransactionStatus.APPROVED,
          paymentMethod: PaymentMethod.PIX,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getTransactions(filters);

        expect(firestore.where).toHaveBeenCalledWith('type', '==', TransactionType.EXPENSE);
        expect(firestore.where).toHaveBeenCalledWith('status', '==', TransactionStatus.APPROVED);
        expect(firestore.where).toHaveBeenCalledWith('paymentMethod', '==', PaymentMethod.PIX);
      });

      it('should respect limit parameter', async () => {
        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getTransactions({}, 10);

        expect(firestore.limit).toHaveBeenCalledWith(10);
      });

      it('should handle errors when getting transactions', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        await expect(ongFinancialService.getTransactions())
          .rejects.toThrow('Erro ao buscar transações da ONG');
      });
    });
  });

  // ==================== CATEGORY MANAGEMENT ====================
  describe('Category Management', () => {
    describe('createCategory', () => {
      it('should create a new category successfully', async () => {
        const categoryData: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'Nova Categoria',
          type: TransactionType.INCOME,
          description: 'Categoria de teste',
          color: '#FF5722',
          icon: 'tag',
          isActive: true
        };

        const mockDocRef = { id: 'new-category-id' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const result = await ongFinancialService.createCategory(categoryData);

        expect(firestore.addDoc).toHaveBeenCalled();
        expect(result).toBe('new-category-id');
      });

      it('should create expense category', async () => {
        const categoryData: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'Salários',
          type: TransactionType.EXPENSE,
          description: 'Pagamento de salários',
          color: '#F44336',
          icon: 'users',
          isActive: true,
          budgetLimit: 50000
        };

        const mockDocRef = { id: 'expense-category-id' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

        const result = await ongFinancialService.createCategory(categoryData);

        expect(result).toBe('expense-category-id');
      });

      it('should handle category creation errors', async () => {
        (firestore.addDoc as jest.Mock).mockRejectedValue(new Error('Creation failed'));

        await expect(ongFinancialService.createCategory({
          name: 'Test',
          type: TransactionType.INCOME,
          color: '#000',
          icon: 'test',
          isActive: true
        })).rejects.toThrow('Erro ao criar categoria da ONG');
      });
    });

    describe('getCategories', () => {
      it('should get all active categories', async () => {
        const mockCategories = [
          createTestCategory({ id: 'cat-1', name: 'Categoria 1' }),
          createTestCategory({ id: 'cat-2', name: 'Categoria 2' })
        ];

        const mockSnapshot = {
          docs: mockCategories.map(c => ({
            id: c.id,
            data: () => ({
              ...c,
              createdAt: { toDate: () => c.createdAt },
              updatedAt: { toDate: () => c.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getCategories();

        expect(result).toHaveLength(2);
        expect(firestore.where).toHaveBeenCalledWith('isActive', '==', true);
      });

      it('should filter categories by type', async () => {
        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getCategories(TransactionType.INCOME);

        expect(firestore.where).toHaveBeenCalledWith('type', '==', TransactionType.INCOME);
      });

      it('should order categories by name', async () => {
        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.getCategories();

        expect(firestore.orderBy).toHaveBeenCalledWith('name');
      });

      it('should handle errors when getting categories', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        await expect(ongFinancialService.getCategories())
          .rejects.toThrow('Erro ao buscar categorias da ONG');
      });
    });
  });

  // ==================== FINANCIAL SUMMARY AND REPORTS ====================
  describe('Financial Summary and Reports', () => {
    describe('getFinancialSummary', () => {
      it('should calculate financial summary correctly', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const mockTransactions = [
          createTestTransaction({
            id: 'income-1',
            type: TransactionType.INCOME,
            amount: 5000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            id: 'income-2',
            type: TransactionType.INCOME,
            amount: 3000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            id: 'expense-1',
            type: TransactionType.EXPENSE,
            amount: 2000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            id: 'expense-2',
            type: TransactionType.EXPENSE,
            amount: 1500,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        // Mock count for pending transactions
        const mockCountSnapshot = { data: () => ({ count: 2 }) };
        (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

        const result = await ongFinancialService.getFinancialSummary(startDate, endDate);

        expect(result.totalIncome).toBe(8000);
        expect(result.totalExpenses).toBe(3500);
        expect(result.netIncome).toBe(4500);
        expect(result.transactionCount).toBe(4);
        expect(result.pendingTransactions).toBe(2);
      });

      it('should calculate top categories', async () => {
        const category1 = createTestCategory({ id: 'cat-1', name: 'Doações' });
        const category2 = createTestCategory({ id: 'cat-2', name: 'Eventos' });

        const mockTransactions = [
          createTestTransaction({
            type: TransactionType.INCOME,
            category: category1,
            amount: 5000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: TransactionType.INCOME,
            category: category1,
            amount: 3000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            type: TransactionType.INCOME,
            category: category2,
            amount: 2000,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
        const mockCountSnapshot = { data: () => ({ count: 0 }) };
        (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

        const result = await ongFinancialService.getFinancialSummary(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );

        expect(result.topCategories).toHaveLength(2);
        expect(result.topCategories[0].category.id).toBe('cat-1');
        expect(result.topCategories[0].amount).toBe(8000);
        expect(result.topCategories[0].count).toBe(2);
      });

      it('should handle zero transactions', async () => {
        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const mockCountSnapshot = { data: () => ({ count: 0 }) };
        (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

        const result = await ongFinancialService.getFinancialSummary(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );

        expect(result.totalIncome).toBe(0);
        expect(result.totalExpenses).toBe(0);
        expect(result.netIncome).toBe(0);
        expect(result.transactionCount).toBe(0);
        expect(result.topCategories).toHaveLength(0);
      });

      it('should handle errors when generating summary', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        await expect(ongFinancialService.getFinancialSummary(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )).rejects.toThrow('Erro ao gerar resumo financeiro da ONG');
      });
    });

    describe('getIncomeExpenseTrend', () => {
      it('should group transactions by monthly period', async () => {
        const mockTransactions = [
          createTestTransaction({
            date: new Date('2024-01-15'),
            type: TransactionType.INCOME,
            amount: 1000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-01-20'),
            type: TransactionType.EXPENSE,
            amount: 500,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-02-10'),
            type: TransactionType.INCOME,
            amount: 2000,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getIncomeExpenseTrend(
          new Date('2024-01-01'),
          new Date('2024-02-28'),
          'monthly'
        );

        expect(result).toHaveLength(2);
        expect(result[0].income).toBe(1000);
        expect(result[0].expense).toBe(500);
        expect(result[1].income).toBe(2000);
      });

      it('should group transactions by daily period', async () => {
        const mockTransactions = [
          createTestTransaction({
            date: new Date('2024-01-15T10:00:00'),
            type: TransactionType.INCOME,
            amount: 500,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-01-15T14:00:00'),
            type: TransactionType.INCOME,
            amount: 300,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getIncomeExpenseTrend(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          'daily'
        );

        expect(result).toHaveLength(1);
        expect(result[0].income).toBe(800);
      });

      it('should handle errors gracefully and return empty array', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ongFinancialService.getIncomeExpenseTrend(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );

        expect(result).toEqual([]);
      });
    });

    describe('getCategoryChartData', () => {
      it('should aggregate transactions by category', async () => {
        const category1 = createTestCategory({ id: 'cat-1', name: 'Cat 1' });
        const category2 = createTestCategory({ id: 'cat-2', name: 'Cat 2' });

        const mockTransactions = [
          createTestTransaction({
            category: category1,
            amount: 1000,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            category: category1,
            amount: 500,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            category: category2,
            amount: 2000,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getCategoryChartData(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          TransactionType.EXPENSE
        );

        expect(result).toHaveLength(2);
        expect(result[0].amount).toBe(2000); // Sorted by amount descending
        expect(result[1].amount).toBe(1500);
        expect(result[1].count).toBe(2);
      });

      it('should handle errors and return empty array', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ongFinancialService.getCategoryChartData(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          TransactionType.INCOME
        );

        expect(result).toEqual([]);
      });
    });

    describe('getMonthlyComparison', () => {
      it('should calculate monthly income, expense, and net income', async () => {
        const mockTransactions = [
          createTestTransaction({
            date: new Date('2024-01-15'),
            type: TransactionType.INCOME,
            amount: 5000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-01-20'),
            type: TransactionType.EXPENSE,
            amount: 2000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-02-10'),
            type: TransactionType.INCOME,
            amount: 4000,
            status: TransactionStatus.APPROVED
          }),
          createTestTransaction({
            date: new Date('2024-02-15'),
            type: TransactionType.EXPENSE,
            amount: 1500,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.getMonthlyComparison(
          new Date('2024-01-01'),
          new Date('2024-02-28')
        );

        expect(result).toHaveLength(2);
        expect(result[0].income).toBe(5000);
        expect(result[0].expense).toBe(2000);
        expect(result[0].netIncome).toBe(3000);
        expect(result[1].income).toBe(4000);
        expect(result[1].expense).toBe(1500);
        expect(result[1].netIncome).toBe(2500);
      });

      it('should handle errors and return empty array', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await ongFinancialService.getMonthlyComparison(
          new Date('2024-01-01'),
          new Date('2024-12-31')
        );

        expect(result).toEqual([]);
      });
    });
  });

  // ==================== EXPORT METHODS ====================
  describe('Export Methods', () => {
    describe('exportTransactions', () => {
      it('should export transactions as CSV', async () => {
        const mockTransactions = [
          createTestTransaction({
            date: new Date('2024-01-15'),
            type: TransactionType.INCOME,
            amount: 1000,
            description: 'Doação',
            paymentMethod: PaymentMethod.PIX,
            status: TransactionStatus.APPROVED
          })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.exportTransactions({}, 'csv');

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('text/csv;charset=utf-8;');

        // Read blob content using FileReader API simulation
        const reader = new FileReader();
        const textPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
        reader.readAsText(result);
        const text = await textPromise;

        expect(text).toContain('Data');
        expect(text).toContain('Tipo');
        expect(text).toContain('Categoria');
      });

      it('should export transactions as JSON', async () => {
        const mockTransactions = [
          createTestTransaction({ id: 'trans-1', amount: 1000 })
        ];

        const mockSnapshot = {
          docs: mockTransactions.map(t => ({
            id: t.id,
            data: () => ({
              ...t,
              date: { toDate: () => t.date },
              createdAt: { toDate: () => t.createdAt },
              updatedAt: { toDate: () => t.updatedAt }
            })
          }))
        };

        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        const result = await ongFinancialService.exportTransactions({}, 'json');

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/json');

        // Read blob content using FileReader API simulation
        const reader = new FileReader();
        const textPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
        reader.readAsText(result);
        const text = await textPromise;

        const parsed = JSON.parse(text);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].amount).toBe(1000);
      });

      it('should apply filters when exporting', async () => {
        const filters: ONGTransactionFilters = {
          type: TransactionType.INCOME,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        const mockSnapshot = { docs: [] };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

        await ongFinancialService.exportTransactions(filters, 'csv');

        expect(firestore.where).toHaveBeenCalledWith('type', '==', TransactionType.INCOME);
      });

      it('should handle export errors', async () => {
        (firestore.getDocs as jest.Mock).mockRejectedValue(new Error('Export failed'));

        await expect(ongFinancialService.exportTransactions({}, 'csv'))
          .rejects.toThrow('Erro ao exportar transações da ONG');
      });
    });
  });

  // ==================== BALANCE CALCULATIONS ====================
  describe('Balance Calculations', () => {
    it('should calculate positive net income', async () => {
      const mockTransactions = [
        createTestTransaction({
          type: TransactionType.INCOME,
          amount: 10000,
          status: TransactionStatus.APPROVED
        }),
        createTestTransaction({
          type: TransactionType.EXPENSE,
          amount: 3000,
          status: TransactionStatus.APPROVED
        })
      ];

      const mockSnapshot = {
        docs: mockTransactions.map(t => ({
          id: t.id,
          data: () => ({
            ...t,
            date: { toDate: () => t.date },
            createdAt: { toDate: () => t.createdAt },
            updatedAt: { toDate: () => t.updatedAt }
          })
        }))
      };

      (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      const mockCountSnapshot = { data: () => ({ count: 0 }) };
      (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

      const result = await ongFinancialService.getFinancialSummary(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.netIncome).toBe(7000);
    });

    it('should calculate negative net income', async () => {
      const mockTransactions = [
        createTestTransaction({
          type: TransactionType.INCOME,
          amount: 2000,
          status: TransactionStatus.APPROVED
        }),
        createTestTransaction({
          type: TransactionType.EXPENSE,
          amount: 5000,
          status: TransactionStatus.APPROVED
        })
      ];

      const mockSnapshot = {
        docs: mockTransactions.map(t => ({
          id: t.id,
          data: () => ({
            ...t,
            date: { toDate: () => t.date },
            createdAt: { toDate: () => t.createdAt },
            updatedAt: { toDate: () => t.updatedAt }
          })
        }))
      };

      (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      const mockCountSnapshot = { data: () => ({ count: 0 }) };
      (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

      const result = await ongFinancialService.getFinancialSummary(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.netIncome).toBe(-3000);
    });
  });

  // ==================== EDGE CASES AND ERROR HANDLING ====================
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty date ranges', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');

      const mockSnapshot = { docs: [] };
      (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      const mockCountSnapshot = { data: () => ({ count: 0 }) };
      (firestore.getCountFromServer as jest.Mock).mockResolvedValue(mockCountSnapshot);

      const result = await ongFinancialService.getFinancialSummary(startDate, endDate);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
    });

    it('should handle very large transaction amounts', async () => {
      const largeAmount = 999999999.99;
      const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: largeAmount,
        description: 'Large donation',
        date: new Date(),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      const mockDocRef = { id: 'large-transaction' };
      (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await ongFinancialService.createTransaction(transactionData);

      expect(result).toBe('large-transaction');
    });

    it('should handle concurrent transaction operations', async () => {
      const transaction1Data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: 100,
        description: 'Transaction 1',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      const transaction2Data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        type: TransactionType.EXPENSE,
        category: createTestCategory({ type: TransactionType.EXPENSE }),
        amount: 50,
        description: 'Transaction 2',
        date: new Date(),
        paymentMethod: PaymentMethod.CASH,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      (firestore.addDoc as jest.Mock)
        .mockResolvedValueOnce({ id: 'trans-1' })
        .mockResolvedValueOnce({ id: 'trans-2' });

      const [result1, result2] = await Promise.all([
        ongFinancialService.createTransaction(transaction1Data),
        ongFinancialService.createTransaction(transaction2Data)
      ]);

      expect(result1).toBe('trans-1');
      expect(result2).toBe('trans-2');
    });

    it('should handle transactions with special characters in description', async () => {
      const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: 100,
        description: 'Doação de José & María (50% OFF) - "Especial" <test>',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      const mockDocRef = { id: 'special-chars-transaction' };
      (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await ongFinancialService.createTransaction(transactionData);

      expect(result).toBe('special-chars-transaction');
    });

    it('should handle fallback count when getCountFromServer fails', async () => {
      const mockSnapshot = {
        docs: [
          { data: () => ({ status: TransactionStatus.PENDING, date: { toDate: () => new Date() } }) },
          { data: () => ({ status: TransactionStatus.PENDING, date: { toDate: () => new Date() } }) }
        ]
      };

      (firestore.getCountFromServer as jest.Mock).mockRejectedValue(new Error('Count not supported'));
      (firestore.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      // This will test the private getTransactionCount method indirectly
      const service = new ONGFinancialService();
      const count = await (service as any).getTransactionCount({
        status: TransactionStatus.PENDING
      });

      expect(count).toBe(2);
    });

    it('should handle transactions with all payment methods', async () => {
      const paymentMethods = [
        PaymentMethod.CASH,
        PaymentMethod.PIX,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.CHECK,
        PaymentMethod.BOLETO,
        PaymentMethod.OTHER
      ];

      const mockDocRef = { id: 'test-transaction' };
      (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      for (const method of paymentMethods) {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: TransactionType.INCOME,
          category: createTestCategory(),
          amount: 100,
          description: `Transaction with ${method}`,
          date: new Date(),
          paymentMethod: method,
          createdBy: 'user-1',
          status: TransactionStatus.APPROVED
        };

        const result = await ongFinancialService.createTransaction(transactionData);
        expect(result).toBe('test-transaction');
      }

      expect(firestore.addDoc).toHaveBeenCalledTimes(paymentMethods.length);
    });
  });

  // ==================== VALIDATION ====================
  describe('Validation', () => {
    it('should reject transaction with zero amount', async () => {
      const transactionData: any = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: 0,
        description: 'Invalid amount',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      await expect(ongFinancialService.createTransaction(transactionData))
        .rejects.toThrow();
    });

    it('should reject transaction without category', async () => {
      const transactionData: any = {
        type: TransactionType.INCOME,
        amount: 100,
        description: 'No category',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      await expect(ongFinancialService.createTransaction(transactionData))
        .rejects.toThrow();
    });

    it('should reject transaction with empty description', async () => {
      const transactionData: any = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: 100,
        description: '   ',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX,
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      await expect(ongFinancialService.createTransaction(transactionData))
        .rejects.toThrow();
    });

    it('should reject transaction without payment method', async () => {
      const transactionData: any = {
        type: TransactionType.INCOME,
        category: createTestCategory(),
        amount: 100,
        description: 'No payment method',
        date: new Date(),
        createdBy: 'user-1',
        status: TransactionStatus.APPROVED
      };

      await expect(ongFinancialService.createTransaction(transactionData))
        .rejects.toThrow();
    });
  });
});
