import {
  ChurchFinancialService,
  TransactionFilters
} from '../ChurchFinancialService';
import {
  Donation,
  DonationType,
  FinancialCategory,
  FinancialEntity,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType
} from '../../../domain/entities/Financial';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

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

describe('ChurchFinancialService', () => {
  let service: ChurchFinancialService;
  const readBlobText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });

  const createCategory = (overrides: Partial<FinancialCategory> = {}): FinancialCategory => ({
    id: 'cat-income',
    name: 'Ofertas',
    type: TransactionType.INCOME,
    description: 'Categoria teste',
    color: '#0ea5e9',
    icon: 'wallet',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides
  });

  const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'tx-1',
    type: TransactionType.INCOME,
    category: createCategory(),
    amount: 100,
    description: 'Entrada teste',
    date: new Date('2025-01-15T00:00:00.000Z'),
    paymentMethod: PaymentMethod.PIX,
    createdBy: 'user-1',
    status: TransactionStatus.APPROVED,
    createdAt: new Date('2025-01-15T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T00:00:00.000Z'),
    ...overrides
  });

  const createDonation = (overrides: Partial<Donation> = {}): Donation => ({
    id: 'donation-1',
    memberId: 'member-1',
    memberName: 'Membro Teste',
    memberEmail: 'membro@example.com',
    amount: 150,
    type: DonationType.TITHE,
    category: createCategory(),
    date: new Date('2025-01-15T00:00:00.000Z'),
    paymentMethod: PaymentMethod.PIX,
    isAnonymous: false,
    createdBy: 'user-1',
    createdAt: new Date('2025-01-15T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T00:00:00.000Z'),
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        date: data.date ? { toDate: () => data.date } : undefined,
        createdAt: data.createdAt ? { toDate: () => data.createdAt } : undefined,
        updatedAt: data.updatedAt ? { toDate: () => data.updatedAt } : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChurchFinancialService();

    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockLimit.mockImplementation((...args) => ({ kind: 'limit', args }));

    jest.spyOn(FinancialEntity, 'validateTransaction').mockReturnValue([]);
    jest.spyOn(FinancialEntity, 'generateReceiptNumber').mockReturnValue('REC-000001-ABCD');
    jest.spyOn(FinancialEntity, 'formatCurrency').mockImplementation(value => `R$ ${value.toFixed(2)}`);
  });

  describe('transactions', () => {
    it('creates a transaction and updates budget when approved', async () => {
      const tx = createTransaction({
        id: 'ignored',
        amount: 250,
        category: createCategory({ id: 'cat-approved' })
      });
      const updateBudgetActualsSpy = jest.spyOn(service as any, 'updateBudgetActuals').mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'created-id' });

      const result = await service.createTransaction({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        paymentMethod: tx.paymentMethod,
        createdBy: tx.createdBy,
        status: tx.status
      });

      expect(result).toBe('created-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 250,
          date: expect.objectContaining({ toDate: expect.any(Function) }),
          createdAt: expect.objectContaining({ toDate: expect.any(Function) }),
          updatedAt: expect.objectContaining({ toDate: expect.any(Function) })
        })
      );
      expect(updateBudgetActualsSpy).toHaveBeenCalledWith('cat-approved', 250, TransactionType.INCOME);
    });

    it('rejects invalid transaction payloads', async () => {
      jest.spyOn(FinancialEntity, 'validateTransaction').mockReturnValueOnce(['invalid']);

      await expect(
        service.createTransaction({
          type: TransactionType.INCOME,
          category: createCategory(),
          amount: 0,
          description: '',
          date: new Date('2025-01-15T00:00:00.000Z'),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'user-1',
          status: TransactionStatus.PENDING
        })
      ).rejects.toThrow('Erro ao criar transação');
    });

    it('updates transaction payload and budget for newly approved transaction', async () => {
      const updateBudgetActualsSpy = jest.spyOn(service as any, 'updateBudgetActuals').mockResolvedValue(undefined);
      const category = createCategory({ id: 'cat-updated' });
      const newDate = new Date('2025-02-01T00:00:00.000Z');

      await service.updateTransaction('tx-9', {
        status: TransactionStatus.APPROVED,
        category,
        amount: 999,
        type: TransactionType.EXPENSE,
        date: newDate
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: TransactionStatus.APPROVED,
          category,
          amount: 999,
          type: TransactionType.EXPENSE,
          date: expect.objectContaining({ toDate: expect.any(Function) }),
          updatedAt: expect.objectContaining({ toDate: expect.any(Function) })
        })
      );
      expect(updateBudgetActualsSpy).toHaveBeenCalledWith('cat-updated', 999, TransactionType.EXPENSE);
    });

    it('deletes transactions', async () => {
      await service.deleteTransaction('tx-delete');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });

    it('returns null for missing transaction and maps timestamp fields for existing ones', async () => {
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));
      expect(await service.getTransaction('missing')).toBeNull();

      const transaction = createTransaction({ id: 'tx-mapped' });
      mockGetDoc.mockResolvedValueOnce(createDocSnapshot(transaction));

      await expect(service.getTransaction('tx-mapped')).resolves.toEqual(
        expect.objectContaining({
          id: 'tx-mapped',
          date: transaction.date,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        })
      );
    });

    it('applies query filters and client-side amount filters when listing transactions', async () => {
      const filters: TransactionFilters = {
        type: TransactionType.INCOME,
        categoryId: 'cat-income',
        status: TransactionStatus.APPROVED,
        paymentMethod: PaymentMethod.PIX,
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
        minAmount: 100,
        maxAmount: 200,
        createdBy: 'user-1'
      };

      mockGetDocs.mockResolvedValue(
        createQuerySnapshot([
          createTransaction({ id: 'under-min', amount: 50 }),
          createTransaction({ id: 'in-range', amount: 150 }),
          createTransaction({ id: 'over-max', amount: 250 })
        ])
      );

      const result = await service.getTransactions(filters, 25);

      expect(result.map(item => item.id)).toEqual(['in-range']);
      expect(mockWhere).toHaveBeenCalledWith('type', '==', TransactionType.INCOME);
      expect(mockWhere).toHaveBeenCalledWith('category.id', '==', 'cat-income');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', TransactionStatus.APPROVED);
      expect(mockWhere).toHaveBeenCalledWith('paymentMethod', '==', PaymentMethod.PIX);
      expect(mockWhere).toHaveBeenCalledWith('createdBy', '==', 'user-1');
      expect(mockOrderBy).toHaveBeenCalledWith('date', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(25);
    });
  });

  describe('categories and summaries', () => {
    it('creates and lists categories', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'cat-created' });
      const createdId = await service.createCategory({
        name: 'Missões',
        type: TransactionType.EXPENSE,
        color: '#f97316',
        icon: 'heart',
        isActive: true
      });

      expect(createdId).toBe('cat-created');

      const category = createCategory({ id: 'cat-listed' });
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([category]));

      const result = await service.getCategories(TransactionType.INCOME);

      expect(result[0]).toEqual(expect.objectContaining({ id: 'cat-listed', name: 'Ofertas' }));
      expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
      expect(mockWhere).toHaveBeenCalledWith('type', '==', TransactionType.INCOME);
      expect(mockOrderBy).toHaveBeenCalledWith('name');
    });

    it('builds financial summary with top categories and pending count', async () => {
      jest.spyOn(service, 'getTransactions').mockResolvedValue([
        createTransaction({ id: 'income-1', amount: 300, category: createCategory({ id: 'cat-a', name: 'Ofertas' }) }),
        createTransaction({ id: 'expense-1', type: TransactionType.EXPENSE, amount: 120, category: createCategory({ id: 'cat-b', name: 'Manutenção', type: TransactionType.EXPENSE }) }),
        createTransaction({ id: 'income-2', amount: 100, category: createCategory({ id: 'cat-a', name: 'Ofertas' }) })
      ]);
      jest.spyOn(service as any, 'getTransactionCount').mockResolvedValue(4);

      const result = await service.getFinancialSummary(
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-31T23:59:59.999Z')
      );

      expect(result).toEqual(
        expect.objectContaining({
          totalIncome: 400,
          totalExpenses: 120,
          netIncome: 280,
          transactionCount: 3,
          pendingTransactions: 4
        })
      );
      expect(result.topCategories[0]).toEqual(
        expect.objectContaining({
          amount: 400,
          count: 2,
          category: expect.objectContaining({ id: 'cat-a' })
        })
      );
    });
  });

  describe('donations', () => {
    it('creates a donation and corresponding approved transaction', async () => {
      mockAddDoc.mockResolvedValue({ id: 'donation-created' });
      const createTransactionSpy = jest.spyOn(service, 'createTransaction').mockResolvedValue('tx-created');
      const donation = createDonation({ receiptNumber: undefined, memberName: 'Maria' });

      const result = await service.createDonation({
        memberId: donation.memberId,
        memberName: donation.memberName,
        memberEmail: donation.memberEmail,
        amount: donation.amount,
        type: donation.type,
        category: donation.category,
        date: donation.date,
        paymentMethod: donation.paymentMethod,
        isAnonymous: donation.isAnonymous,
        createdBy: donation.createdBy
      });

      expect(result).toBe('donation-created');
      expect(FinancialEntity.generateReceiptNumber).toHaveBeenCalled();
      expect(createTransactionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.INCOME,
          amount: donation.amount,
          reference: 'REC-000001-ABCD',
          status: TransactionStatus.APPROVED,
          description: 'Doação: tithe - Maria'
        })
      );
    });

    it('builds donation summary including monthly growth fallback to zero', async () => {
      jest.spyOn(service as any, 'getDonations')
        .mockResolvedValueOnce([
          createDonation({ amount: 100, type: DonationType.TITHE, memberId: 'member-1' }),
          createDonation({ id: 'd2', amount: 200, type: DonationType.OFFERING, memberId: 'member-2' })
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getDonationSummary(
        new Date('2025-02-01T00:00:00.000Z'),
        new Date('2025-02-28T23:59:59.999Z')
      );

      expect(result).toEqual({
        totalDonations: 300,
        totalTithes: 100,
        totalOfferings: 200,
        donorCount: 2,
        averageDonation: 150,
        monthlyGrowth: 0
      });
    });
  });

  describe('counts, charts and exports', () => {
    it('uses count aggregation and falls back to manual filtering when needed', async () => {
      mockGetCountFromServer.mockResolvedValueOnce({
        data: () => ({ count: 7 })
      });

      await expect(
        (service as any).getTransactionCount({ status: TransactionStatus.PENDING })
      ).resolves.toBe(7);

      mockGetCountFromServer.mockRejectedValueOnce(new Error('count failed'));
      mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([
        createTransaction({ id: 'ok-1', status: TransactionStatus.PENDING, date: new Date('2025-01-10T00:00:00.000Z') }),
        createTransaction({ id: 'late', status: TransactionStatus.PENDING, date: new Date('2025-02-10T00:00:00.000Z') }),
        createTransaction({ id: 'wrong-status', status: TransactionStatus.APPROVED, date: new Date('2025-01-12T00:00:00.000Z') })
      ]));

      await expect(
        (service as any).getTransactionCount({
          status: TransactionStatus.PENDING,
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-31T23:59:59.999Z')
        })
      ).resolves.toBe(1);
    });

    it('groups trend, category, monthly comparison and donation chart data', async () => {
      jest.spyOn(service, 'getTransactions')
        .mockResolvedValueOnce([
          createTransaction({ id: 'day-income', amount: 200, date: new Date('2025-01-05T12:00:00.000Z') }),
          createTransaction({ id: 'day-expense', type: TransactionType.EXPENSE, amount: 50, category: createCategory({ id: 'cat-expense', type: TransactionType.EXPENSE, name: 'Saída' }), date: new Date('2025-01-05T12:00:00.000Z') })
        ])
        .mockResolvedValueOnce([
          createTransaction({ id: 'cat-1', amount: 300, category: createCategory({ id: 'cat-a', name: 'Ofertas' }) }),
          createTransaction({ id: 'cat-2', amount: 120, category: createCategory({ id: 'cat-b', name: 'Campanhas' }) }),
          createTransaction({ id: 'cat-3', amount: 80, category: createCategory({ id: 'cat-a', name: 'Ofertas' }) })
        ])
        .mockResolvedValueOnce([
          createTransaction({ id: 'jan-income', amount: 200, date: new Date('2025-01-05T12:00:00.000Z') }),
          createTransaction({ id: 'jan-expense', type: TransactionType.EXPENSE, amount: 50, category: createCategory({ id: 'cat-exp', type: TransactionType.EXPENSE }), date: new Date('2025-01-12T12:00:00.000Z') }),
          createTransaction({ id: 'feb-income', amount: 400, date: new Date('2025-02-01T12:00:00.000Z') })
        ]);
      jest.spyOn(service as any, 'getDonations').mockResolvedValue([
        createDonation({ amount: 100, type: DonationType.TITHE }),
        createDonation({ id: 'don-2', amount: 250, type: DonationType.OFFERING }),
        createDonation({ id: 'don-3', amount: 120, type: DonationType.TITHE })
      ]);

      const trend = await service.getIncomeExpenseTrend(
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-31T23:59:59.999Z'),
        'daily'
      );
      expect(trend).toHaveLength(1);
      expect(trend[0]).toEqual(expect.objectContaining({ income: 200, expense: 50 }));
      expect(trend[0].date.getUTCFullYear()).toBe(2025);
      expect(trend[0].date.getUTCMonth()).toBe(0);
      expect(trend[0].date.getUTCDate()).toBe(5);

      await expect(
        service.getCategoryChartData(new Date('2025-01-01T00:00:00.000Z'), new Date('2025-01-31T23:59:59.999Z'), TransactionType.INCOME)
      ).resolves.toEqual([
        expect.objectContaining({ amount: 380, count: 2, category: expect.objectContaining({ id: 'cat-a' }) }),
        expect.objectContaining({ amount: 120, count: 1, category: expect.objectContaining({ id: 'cat-b' }) })
      ]);

      await expect(
        service.getMonthlyComparison(new Date('2025-01-01T00:00:00.000Z'), new Date('2025-02-28T23:59:59.999Z'))
      ).resolves.toEqual([
        {
          month: new Date('2025-01-01T03:00:00.000Z'),
          income: 200,
          expense: 50,
          netIncome: 150
        },
        {
          month: new Date('2025-02-01T03:00:00.000Z'),
          income: 400,
          expense: 0,
          netIncome: 400
        }
      ]);

      await expect(
        service.getDonationChartData(new Date('2025-01-01T00:00:00.000Z'), new Date('2025-01-31T23:59:59.999Z'))
      ).resolves.toEqual([
        {
          type: DonationType.OFFERING,
          amount: 250,
          count: 1,
          label: 'Ofertas'
        },
        {
          type: DonationType.TITHE,
          amount: 220,
          count: 2,
          label: 'Dízimos'
        }
      ]);
    });

    it('exports transactions as json and csv blobs', async () => {
      jest.spyOn(service, 'getTransactions').mockResolvedValue([
        createTransaction({
          amount: 123.45,
          description: 'Transação exportada',
          category: createCategory({ name: 'Categoria CSV' })
        })
      ]);

      const jsonBlob = await service.exportTransactions({}, 'json');
      const xlsxBlob = await service.exportTransactions({}, 'xlsx');
      const jsonText = await readBlobText(jsonBlob);
      const xlsxText = await readBlobText(xlsxBlob);

      expect(jsonBlob).toBeInstanceOf(Blob);
      expect(jsonText).toContain('"description": "Transação exportada"');
      expect(xlsxBlob).toBeInstanceOf(Blob);
    });
  });
});
