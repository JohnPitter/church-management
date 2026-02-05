// Unit Tests - Financial Entity
// Comprehensive tests for financial domain entities, business rules, and calculations

import {
  Transaction,
  FinancialCategory,
  Budget,
  BudgetCategory,
  FinancialReport,
  Donation,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  RecurringPattern,
  BudgetStatus,
  ReportType,
  ReportPeriod,
  DonationType,
  FinancialEntity
} from '../Financial';

describe('Financial Enums', () => {
  describe('TransactionType', () => {
    it('should have all expected values', () => {
      expect(TransactionType.INCOME).toBe('income');
      expect(TransactionType.EXPENSE).toBe('expense');
      expect(TransactionType.TRANSFER).toBe('transfer');
    });

    it('should have exactly 3 transaction types', () => {
      const values = Object.values(TransactionType);
      expect(values).toHaveLength(3);
    });
  });

  describe('PaymentMethod', () => {
    it('should have all expected values', () => {
      expect(PaymentMethod.CASH).toBe('cash');
      expect(PaymentMethod.CHECK).toBe('check');
      expect(PaymentMethod.BANK_TRANSFER).toBe('bank_transfer');
      expect(PaymentMethod.CREDIT_CARD).toBe('credit_card');
      expect(PaymentMethod.DEBIT_CARD).toBe('debit_card');
      expect(PaymentMethod.PIX).toBe('pix');
      expect(PaymentMethod.BOLETO).toBe('boleto');
      expect(PaymentMethod.OTHER).toBe('other');
    });

    it('should have exactly 8 payment methods', () => {
      const values = Object.values(PaymentMethod);
      expect(values).toHaveLength(8);
    });
  });

  describe('TransactionStatus', () => {
    it('should have all expected values', () => {
      expect(TransactionStatus.PENDING).toBe('pending');
      expect(TransactionStatus.APPROVED).toBe('approved');
      expect(TransactionStatus.REJECTED).toBe('rejected');
      expect(TransactionStatus.CANCELLED).toBe('cancelled');
    });

    it('should have exactly 4 statuses', () => {
      const values = Object.values(TransactionStatus);
      expect(values).toHaveLength(4);
    });
  });

  describe('RecurringPattern', () => {
    it('should have all expected values', () => {
      expect(RecurringPattern.WEEKLY).toBe('weekly');
      expect(RecurringPattern.BIWEEKLY).toBe('biweekly');
      expect(RecurringPattern.MONTHLY).toBe('monthly');
      expect(RecurringPattern.QUARTERLY).toBe('quarterly');
      expect(RecurringPattern.ANNUALLY).toBe('annually');
    });

    it('should have exactly 5 recurring patterns', () => {
      const values = Object.values(RecurringPattern);
      expect(values).toHaveLength(5);
    });
  });

  describe('BudgetStatus', () => {
    it('should have all expected values', () => {
      expect(BudgetStatus.DRAFT).toBe('draft');
      expect(BudgetStatus.ACTIVE).toBe('active');
      expect(BudgetStatus.COMPLETED).toBe('completed');
      expect(BudgetStatus.CANCELLED).toBe('cancelled');
    });

    it('should have exactly 4 budget statuses', () => {
      const values = Object.values(BudgetStatus);
      expect(values).toHaveLength(4);
    });
  });

  describe('ReportType', () => {
    it('should have all expected values', () => {
      expect(ReportType.INCOME_STATEMENT).toBe('income_statement');
      expect(ReportType.CASH_FLOW).toBe('cash_flow');
      expect(ReportType.BUDGET_VARIANCE).toBe('budget_variance');
      expect(ReportType.DONATION_SUMMARY).toBe('donation_summary');
      expect(ReportType.EXPENSE_ANALYSIS).toBe('expense_analysis');
      expect(ReportType.CATEGORY_BREAKDOWN).toBe('category_breakdown');
    });

    it('should have exactly 6 report types', () => {
      const values = Object.values(ReportType);
      expect(values).toHaveLength(6);
    });
  });

  describe('ReportPeriod', () => {
    it('should have all expected values', () => {
      expect(ReportPeriod.DAILY).toBe('daily');
      expect(ReportPeriod.WEEKLY).toBe('weekly');
      expect(ReportPeriod.MONTHLY).toBe('monthly');
      expect(ReportPeriod.QUARTERLY).toBe('quarterly');
      expect(ReportPeriod.ANNUALLY).toBe('annually');
      expect(ReportPeriod.CUSTOM).toBe('custom');
    });

    it('should have exactly 6 report periods', () => {
      const values = Object.values(ReportPeriod);
      expect(values).toHaveLength(6);
    });
  });

  describe('DonationType', () => {
    it('should have all expected values', () => {
      expect(DonationType.TITHE).toBe('tithe');
      expect(DonationType.OFFERING).toBe('offering');
      expect(DonationType.SPECIAL_OFFERING).toBe('special_offering');
      expect(DonationType.MISSION).toBe('mission');
      expect(DonationType.BUILDING_FUND).toBe('building_fund');
      expect(DonationType.CHARITY).toBe('charity');
      expect(DonationType.OTHER).toBe('other');
    });

    it('should have exactly 7 donation types', () => {
      const values = Object.values(DonationType);
      expect(values).toHaveLength(7);
    });
  });
});

describe('FinancialEntity', () => {
  // Helper function to create test category
  const createTestCategory = (overrides: Partial<FinancialCategory> = {}): FinancialCategory => ({
    id: 'cat-1',
    name: 'Test Category',
    type: TransactionType.INCOME,
    description: 'Test category description',
    color: '#3B82F6',
    icon: 'wallet',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  // Helper function to create test transaction
  const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'trans-1',
    type: TransactionType.INCOME,
    category: createTestCategory(),
    amount: 1000,
    description: 'Test transaction',
    date: new Date(),
    paymentMethod: PaymentMethod.PIX,
    createdBy: 'user-1',
    status: TransactionStatus.APPROVED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly in BRL', () => {
      const result = FinancialEntity.formatCurrency(1000);
      expect(result).toMatch(/R\$\s*1[.,]000[.,]00/);
    });

    it('should format decimal numbers correctly', () => {
      const result = FinancialEntity.formatCurrency(1234.56);
      expect(result).toMatch(/R\$\s*1[.,]234[.,]56/);
    });

    it('should format zero correctly', () => {
      const result = FinancialEntity.formatCurrency(0);
      expect(result).toMatch(/R\$\s*0[.,]00/);
    });

    it('should format negative numbers correctly', () => {
      const result = FinancialEntity.formatCurrency(-500);
      expect(result).toMatch(/-?\s*R\$\s*500[.,]00/);
    });

    it('should format large numbers correctly', () => {
      const result = FinancialEntity.formatCurrency(1000000);
      expect(result).toMatch(/R\$\s*1[.,]000[.,]000[.,]00/);
    });

    it('should format small decimal values correctly', () => {
      const result = FinancialEntity.formatCurrency(0.01);
      expect(result).toMatch(/R\$\s*0[.,]01/);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate positive variance when actual exceeds planned', () => {
      expect(FinancialEntity.calculateVariance(1000, 1200)).toBe(200);
    });

    it('should calculate negative variance when actual is below planned', () => {
      expect(FinancialEntity.calculateVariance(1000, 800)).toBe(-200);
    });

    it('should return zero when actual equals planned', () => {
      expect(FinancialEntity.calculateVariance(1000, 1000)).toBe(0);
    });

    it('should handle zero planned amount', () => {
      expect(FinancialEntity.calculateVariance(0, 100)).toBe(100);
    });

    it('should handle zero actual amount', () => {
      expect(FinancialEntity.calculateVariance(100, 0)).toBe(-100);
    });

    it('should handle both values as zero', () => {
      expect(FinancialEntity.calculateVariance(0, 0)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(FinancialEntity.calculateVariance(100.50, 150.75)).toBe(50.25);
    });
  });

  describe('calculateVariancePercentage', () => {
    it('should calculate positive percentage when actual exceeds planned', () => {
      expect(FinancialEntity.calculateVariancePercentage(1000, 1200)).toBe(20);
    });

    it('should calculate negative percentage when actual is below planned', () => {
      expect(FinancialEntity.calculateVariancePercentage(1000, 800)).toBe(-20);
    });

    it('should return zero when actual equals planned', () => {
      expect(FinancialEntity.calculateVariancePercentage(1000, 1000)).toBe(0);
    });

    it('should return 100 when planned is zero and actual is positive', () => {
      expect(FinancialEntity.calculateVariancePercentage(0, 100)).toBe(100);
    });

    it('should return 0 when both planned and actual are zero', () => {
      expect(FinancialEntity.calculateVariancePercentage(0, 0)).toBe(0);
    });

    it('should handle decimal percentages', () => {
      const result = FinancialEntity.calculateVariancePercentage(300, 315);
      expect(result).toBe(5);
    });

    it('should calculate 50% over budget correctly', () => {
      expect(FinancialEntity.calculateVariancePercentage(200, 300)).toBe(50);
    });

    it('should calculate 50% under budget correctly', () => {
      expect(FinancialEntity.calculateVariancePercentage(200, 100)).toBe(-50);
    });
  });

  describe('isOverBudget', () => {
    it('should return true when actual exceeds planned', () => {
      expect(FinancialEntity.isOverBudget(1000, 1100)).toBe(true);
    });

    it('should return false when actual equals planned', () => {
      expect(FinancialEntity.isOverBudget(1000, 1000)).toBe(false);
    });

    it('should return false when actual is below planned', () => {
      expect(FinancialEntity.isOverBudget(1000, 900)).toBe(false);
    });

    it('should return true even for small overages', () => {
      expect(FinancialEntity.isOverBudget(1000, 1000.01)).toBe(true);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return "over" when variance exceeds 10%', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 1200)).toBe('over');
    });

    it('should return "under" when variance is below -10%', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 800)).toBe('under');
    });

    it('should return "on_track" when variance is between -10% and 10%', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 1000)).toBe('on_track');
      expect(FinancialEntity.getBudgetStatus(1000, 1050)).toBe('on_track');
      expect(FinancialEntity.getBudgetStatus(1000, 950)).toBe('on_track');
    });

    it('should return "on_track" at exactly 10% variance', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 1100)).toBe('on_track');
    });

    it('should return "on_track" at exactly -10% variance', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 900)).toBe('on_track');
    });

    it('should handle edge case at 10.01% variance', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 1101)).toBe('over');
    });

    it('should handle edge case at -10.01% variance', () => {
      expect(FinancialEntity.getBudgetStatus(1000, 899)).toBe('under');
    });
  });

  describe('validateTransaction', () => {
    it('should return empty array for valid transaction', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        description: 'Valid transaction',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing amount', () => {
      const transaction: Partial<Transaction> = {
        category: createTestCategory(),
        description: 'Test',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Valor deve ser maior que zero');
    });

    it('should return error for zero amount', () => {
      const transaction: Partial<Transaction> = {
        amount: 0,
        category: createTestCategory(),
        description: 'Test',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Valor deve ser maior que zero');
    });

    it('should return error for negative amount', () => {
      const transaction: Partial<Transaction> = {
        amount: -100,
        category: createTestCategory(),
        description: 'Test',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Valor deve ser maior que zero');
    });

    it('should return error for missing category', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        description: 'Test',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Categoria é obrigatória');
    });

    it('should return error for missing description', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Descrição é obrigatória');
    });

    it('should return error for empty description', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        description: '',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Descrição é obrigatória');
    });

    it('should return error for whitespace-only description', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        description: '   ',
        date: new Date(),
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Descrição é obrigatória');
    });

    it('should return error for missing date', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        description: 'Test',
        paymentMethod: PaymentMethod.PIX
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Data é obrigatória');
    });

    it('should return error for missing payment method', () => {
      const transaction: Partial<Transaction> = {
        amount: 100,
        category: createTestCategory(),
        description: 'Test',
        date: new Date()
      };

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Método de pagamento é obrigatório');
    });

    it('should return multiple errors for multiple missing fields', () => {
      const transaction: Partial<Transaction> = {};

      const errors = FinancialEntity.validateTransaction(transaction);
      expect(errors).toContain('Valor deve ser maior que zero');
      expect(errors).toContain('Categoria é obrigatória');
      expect(errors).toContain('Descrição é obrigatória');
      expect(errors).toContain('Data é obrigatória');
      expect(errors).toContain('Método de pagamento é obrigatório');
      expect(errors).toHaveLength(5);
    });
  });

  describe('calculateTotalByCategory', () => {
    it('should calculate totals for single income transaction', () => {
      const transactions = [
        createTestTransaction({
          category: createTestCategory({ id: 'cat-1' }),
          amount: 1000,
          type: TransactionType.INCOME
        })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('cat-1')).toBe(1000);
    });

    it('should calculate totals for single expense transaction', () => {
      const transactions = [
        createTestTransaction({
          category: createTestCategory({ id: 'cat-1' }),
          amount: 500,
          type: TransactionType.EXPENSE
        })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('cat-1')).toBe(-500);
    });

    it('should aggregate multiple transactions in same category', () => {
      const category = createTestCategory({ id: 'cat-1' });
      const transactions = [
        createTestTransaction({ category, amount: 1000, type: TransactionType.INCOME }),
        createTestTransaction({ category, amount: 500, type: TransactionType.INCOME }),
        createTestTransaction({ category, amount: 200, type: TransactionType.EXPENSE })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('cat-1')).toBe(1300); // 1000 + 500 - 200
    });

    it('should separate totals by category', () => {
      const category1 = createTestCategory({ id: 'cat-1' });
      const category2 = createTestCategory({ id: 'cat-2' });
      const transactions = [
        createTestTransaction({ category: category1, amount: 1000, type: TransactionType.INCOME }),
        createTestTransaction({ category: category2, amount: 500, type: TransactionType.EXPENSE })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('cat-1')).toBe(1000);
      expect(totals.get('cat-2')).toBe(-500);
    });

    it('should return empty map for empty transactions array', () => {
      const totals = FinancialEntity.calculateTotalByCategory([]);
      expect(totals.size).toBe(0);
    });

    it('should handle multiple categories with multiple transactions', () => {
      const categoryTithe = createTestCategory({ id: 'tithe' });
      const categoryOffering = createTestCategory({ id: 'offering' });
      const categoryUtilities = createTestCategory({ id: 'utilities' });

      const transactions = [
        createTestTransaction({ category: categoryTithe, amount: 1000, type: TransactionType.INCOME }),
        createTestTransaction({ category: categoryTithe, amount: 2000, type: TransactionType.INCOME }),
        createTestTransaction({ category: categoryOffering, amount: 500, type: TransactionType.INCOME }),
        createTestTransaction({ category: categoryUtilities, amount: 300, type: TransactionType.EXPENSE }),
        createTestTransaction({ category: categoryUtilities, amount: 200, type: TransactionType.EXPENSE })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('tithe')).toBe(3000);
      expect(totals.get('offering')).toBe(500);
      expect(totals.get('utilities')).toBe(-500);
    });

    it('should handle net zero for a category', () => {
      const category = createTestCategory({ id: 'cat-1' });
      const transactions = [
        createTestTransaction({ category, amount: 500, type: TransactionType.INCOME }),
        createTestTransaction({ category, amount: 500, type: TransactionType.EXPENSE })
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      expect(totals.get('cat-1')).toBe(0);
    });
  });

  describe('getNextRecurringDate', () => {
    // Use explicit date construction to avoid timezone issues
    const baseDate = new Date(2024, 0, 15); // January 15, 2024

    it('should calculate next weekly date', () => {
      const nextDate = FinancialEntity.getNextRecurringDate(baseDate, RecurringPattern.WEEKLY);
      expect(nextDate.getDate()).toBe(22); // 15 + 7
      expect(nextDate.getMonth()).toBe(0); // January
    });

    it('should calculate next biweekly date', () => {
      const nextDate = FinancialEntity.getNextRecurringDate(baseDate, RecurringPattern.BIWEEKLY);
      expect(nextDate.getDate()).toBe(29); // 15 + 14
      expect(nextDate.getMonth()).toBe(0); // January
    });

    it('should calculate next monthly date', () => {
      const nextDate = FinancialEntity.getNextRecurringDate(baseDate, RecurringPattern.MONTHLY);
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getMonth()).toBe(1); // February
    });

    it('should calculate next quarterly date', () => {
      const nextDate = FinancialEntity.getNextRecurringDate(baseDate, RecurringPattern.QUARTERLY);
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getMonth()).toBe(3); // April
    });

    it('should calculate next annually date', () => {
      const nextDate = FinancialEntity.getNextRecurringDate(baseDate, RecurringPattern.ANNUALLY);
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getMonth()).toBe(0);
      expect(nextDate.getFullYear()).toBe(2025);
    });

    it('should handle month overflow for weekly', () => {
      const endOfMonth = new Date(2024, 0, 30); // January 30, 2024
      const nextDate = FinancialEntity.getNextRecurringDate(endOfMonth, RecurringPattern.WEEKLY);
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(6);
    });

    it('should handle year overflow for monthly', () => {
      const december = new Date(2024, 11, 15); // December 15, 2024
      const nextDate = FinancialEntity.getNextRecurringDate(december, RecurringPattern.MONTHLY);
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(0); // January
    });

    it('should handle year overflow for quarterly', () => {
      const november = new Date(2024, 10, 15); // November 15, 2024
      const nextDate = FinancialEntity.getNextRecurringDate(november, RecurringPattern.QUARTERLY);
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(1); // February
    });

    it('should not mutate original date', () => {
      const originalDate = new Date(2024, 0, 15); // January 15, 2024
      const originalTime = originalDate.getTime();

      FinancialEntity.getNextRecurringDate(originalDate, RecurringPattern.MONTHLY);

      expect(originalDate.getTime()).toBe(originalTime);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number with correct prefix', () => {
      const receipt = FinancialEntity.generateReceiptNumber();
      expect(receipt.startsWith('REC-')).toBe(true);
    });

    it('should generate receipt number with correct format', () => {
      const receipt = FinancialEntity.generateReceiptNumber();
      expect(receipt).toMatch(/^REC-\d{6}-[A-Z0-9]{4}$/);
    });

    it('should generate unique receipt numbers', () => {
      const receipts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        receipts.add(FinancialEntity.generateReceiptNumber());
      }
      // With timestamp + random, should be highly likely to be unique
      expect(receipts.size).toBeGreaterThan(90);
    });

    it('should contain only uppercase alphanumeric characters in random part', () => {
      for (let i = 0; i < 50; i++) {
        const receipt = FinancialEntity.generateReceiptNumber();
        const randomPart = receipt.split('-')[2];
        expect(randomPart).toMatch(/^[A-Z0-9]+$/);
      }
    });
  });

  describe('isTaxDeductibleCategory', () => {
    it('should return true for charity category', () => {
      const category = createTestCategory({ id: 'charity' });
      expect(FinancialEntity.isTaxDeductibleCategory(category)).toBe(true);
    });

    it('should return true for mission category', () => {
      const category = createTestCategory({ id: 'mission' });
      expect(FinancialEntity.isTaxDeductibleCategory(category)).toBe(true);
    });

    it('should return true for social_assistance category', () => {
      const category = createTestCategory({ id: 'social_assistance' });
      expect(FinancialEntity.isTaxDeductibleCategory(category)).toBe(true);
    });

    it('should be case-insensitive', () => {
      const categoryUppercase = createTestCategory({ id: 'CHARITY' });
      expect(FinancialEntity.isTaxDeductibleCategory(categoryUppercase)).toBe(true);
    });

    it('should return false for non-deductible categories', () => {
      const categoryTithe = createTestCategory({ id: 'tithe' });
      expect(FinancialEntity.isTaxDeductibleCategory(categoryTithe)).toBe(false);

      const categoryOffering = createTestCategory({ id: 'offering' });
      expect(FinancialEntity.isTaxDeductibleCategory(categoryOffering)).toBe(false);

      const categoryUtilities = createTestCategory({ id: 'utilities' });
      expect(FinancialEntity.isTaxDeductibleCategory(categoryUtilities)).toBe(false);
    });

    it('should return false for similar but non-matching categories', () => {
      const category = createTestCategory({ id: 'charitable_giving' });
      expect(FinancialEntity.isTaxDeductibleCategory(category)).toBe(false);
    });
  });
});

describe('Transaction Interface', () => {
  const createValidTransaction = (): Transaction => ({
    id: 'trans-1',
    type: TransactionType.INCOME,
    category: {
      id: 'cat-1',
      name: 'Tithes',
      type: TransactionType.INCOME,
      color: '#10B981',
      icon: 'church',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    amount: 1500,
    description: 'Monthly tithe collection',
    date: new Date('2024-01-15'),
    paymentMethod: PaymentMethod.PIX,
    createdBy: 'admin-1',
    status: TransactionStatus.APPROVED,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  it('should allow all optional fields to be undefined', () => {
    const transaction = createValidTransaction();
    expect(transaction.reference).toBeUndefined();
    expect(transaction.notes).toBeUndefined();
    expect(transaction.attachments).toBeUndefined();
    expect(transaction.approvedBy).toBeUndefined();
    expect(transaction.isRecurring).toBeUndefined();
    expect(transaction.recurringPattern).toBeUndefined();
    expect(transaction.parentTransactionId).toBeUndefined();
    expect(transaction.installmentNumber).toBeUndefined();
    expect(transaction.totalInstallments).toBeUndefined();
  });

  it('should accept all optional fields', () => {
    const transaction: Transaction = {
      ...createValidTransaction(),
      reference: 'INV-2024-001',
      notes: 'Special collection for building fund',
      attachments: ['receipt1.pdf', 'receipt2.pdf'],
      approvedBy: 'pastor-1',
      isRecurring: true,
      recurringPattern: RecurringPattern.MONTHLY,
      parentTransactionId: 'parent-1',
      installmentNumber: 1,
      totalInstallments: 12
    };

    expect(transaction.reference).toBe('INV-2024-001');
    expect(transaction.notes).toBe('Special collection for building fund');
    expect(transaction.attachments).toHaveLength(2);
    expect(transaction.isRecurring).toBe(true);
    expect(transaction.recurringPattern).toBe(RecurringPattern.MONTHLY);
  });
});

describe('Budget Interface', () => {
  const createValidBudget = (): Budget => ({
    id: 'budget-1',
    name: '2024 Annual Budget',
    year: 2024,
    categories: [],
    totalPlanned: 100000,
    totalActual: 85000,
    status: BudgetStatus.ACTIVE,
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  it('should allow monthly budget with month field', () => {
    const monthlyBudget: Budget = {
      ...createValidBudget(),
      month: 1 // January
    };
    expect(monthlyBudget.month).toBe(1);
  });

  it('should allow annual budget without month field', () => {
    const annualBudget = createValidBudget();
    expect(annualBudget.month).toBeUndefined();
  });

  it('should support budget categories with variance', () => {
    const budgetCategory: BudgetCategory = {
      categoryId: 'cat-1',
      categoryName: 'Utilities',
      plannedAmount: 5000,
      actualAmount: 4500,
      variance: -500,
      percentageUsed: 90
    };

    expect(budgetCategory.variance).toBe(budgetCategory.actualAmount - budgetCategory.plannedAmount);
    expect(budgetCategory.percentageUsed).toBe((budgetCategory.actualAmount / budgetCategory.plannedAmount) * 100);
  });
});

describe('Donation Interface', () => {
  const createValidDonation = (): Donation => ({
    id: 'donation-1',
    amount: 500,
    type: DonationType.TITHE,
    category: {
      id: 'tithe',
      name: 'Tithes',
      type: TransactionType.INCOME,
      color: '#10B981',
      icon: 'church',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    date: new Date('2024-01-15'),
    paymentMethod: PaymentMethod.PIX,
    isAnonymous: false,
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  it('should allow anonymous donations without member info', () => {
    const anonymousDonation: Donation = {
      ...createValidDonation(),
      isAnonymous: true
    };
    expect(anonymousDonation.memberId).toBeUndefined();
    expect(anonymousDonation.memberName).toBeUndefined();
    expect(anonymousDonation.isAnonymous).toBe(true);
  });

  it('should allow donations with member information', () => {
    const memberDonation: Donation = {
      ...createValidDonation(),
      memberId: 'member-1',
      memberName: 'John Doe',
      memberEmail: 'john@example.com'
    };
    expect(memberDonation.memberId).toBe('member-1');
    expect(memberDonation.memberName).toBe('John Doe');
  });

  it('should support all donation types', () => {
    const donationTypes = [
      DonationType.TITHE,
      DonationType.OFFERING,
      DonationType.SPECIAL_OFFERING,
      DonationType.MISSION,
      DonationType.BUILDING_FUND,
      DonationType.CHARITY,
      DonationType.OTHER
    ];

    donationTypes.forEach(type => {
      const donation: Donation = {
        ...createValidDonation(),
        type
      };
      expect(donation.type).toBe(type);
    });
  });

  it('should support tax deductible flag', () => {
    const taxDeductibleDonation: Donation = {
      ...createValidDonation(),
      taxDeductible: true
    };
    expect(taxDeductibleDonation.taxDeductible).toBe(true);
  });
});

describe('FinancialReport Interface', () => {
  it('should support all report types', () => {
    const reportTypes = [
      ReportType.INCOME_STATEMENT,
      ReportType.CASH_FLOW,
      ReportType.BUDGET_VARIANCE,
      ReportType.DONATION_SUMMARY,
      ReportType.EXPENSE_ANALYSIS,
      ReportType.CATEGORY_BREAKDOWN
    ];

    reportTypes.forEach(type => {
      const report: FinancialReport = {
        id: `report-${type}`,
        name: `${type} Report`,
        type,
        period: ReportPeriod.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        data: {},
        generatedBy: 'admin-1',
        generatedAt: new Date()
      };
      expect(report.type).toBe(type);
    });
  });

  it('should support all report periods', () => {
    const reportPeriods = [
      ReportPeriod.DAILY,
      ReportPeriod.WEEKLY,
      ReportPeriod.MONTHLY,
      ReportPeriod.QUARTERLY,
      ReportPeriod.ANNUALLY,
      ReportPeriod.CUSTOM
    ];

    reportPeriods.forEach(period => {
      const report: FinancialReport = {
        id: 'report-1',
        name: 'Test Report',
        type: ReportType.INCOME_STATEMENT,
        period,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        data: {},
        generatedBy: 'admin-1',
        generatedAt: new Date()
      };
      expect(report.period).toBe(period);
    });
  });
});

describe('Financial Calculations', () => {
  describe('Balance Calculations', () => {
    const createTestCategory = (id: string, type: TransactionType): FinancialCategory => ({
      id,
      name: `Category ${id}`,
      type,
      color: '#000',
      icon: 'icon',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('should calculate net balance correctly', () => {
      const incomeCategory = createTestCategory('income', TransactionType.INCOME);
      const expenseCategory = createTestCategory('expense', TransactionType.EXPENSE);

      const transactions: Transaction[] = [
        {
          id: '1',
          type: TransactionType.INCOME,
          category: incomeCategory,
          amount: 5000,
          description: 'Tithes',
          date: new Date(),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          type: TransactionType.INCOME,
          category: incomeCategory,
          amount: 2000,
          description: 'Offerings',
          date: new Date(),
          paymentMethod: PaymentMethod.CASH,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          type: TransactionType.EXPENSE,
          category: expenseCategory,
          amount: 1500,
          description: 'Utilities',
          date: new Date(),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const categoryTotals = FinancialEntity.calculateTotalByCategory(transactions);

      let netBalance = 0;
      categoryTotals.forEach(value => {
        netBalance += value;
      });

      expect(netBalance).toBe(5500); // 5000 + 2000 - 1500
    });

    it('should calculate total income correctly', () => {
      const incomeCategory = createTestCategory('income', TransactionType.INCOME);

      const transactions: Transaction[] = [
        {
          id: '1',
          type: TransactionType.INCOME,
          category: incomeCategory,
          amount: 5000,
          description: 'Tithes',
          date: new Date(),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          type: TransactionType.INCOME,
          category: incomeCategory,
          amount: 3000,
          description: 'Offerings',
          date: new Date(),
          paymentMethod: PaymentMethod.CASH,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalIncome).toBe(8000);
    });

    it('should calculate total expenses correctly', () => {
      const expenseCategory = createTestCategory('expense', TransactionType.EXPENSE);

      const transactions: Transaction[] = [
        {
          id: '1',
          type: TransactionType.EXPENSE,
          category: expenseCategory,
          amount: 1500,
          description: 'Utilities',
          date: new Date(),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          type: TransactionType.EXPENSE,
          category: expenseCategory,
          amount: 800,
          description: 'Maintenance',
          date: new Date(),
          paymentMethod: PaymentMethod.PIX,
          createdBy: 'admin',
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const totalExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalExpenses).toBe(2300);
    });
  });

  describe('Date Range Filtering', () => {
    const createTransactionWithDate = (id: string, date: Date): Transaction => ({
      id,
      type: TransactionType.INCOME,
      category: {
        id: 'cat-1',
        name: 'Category',
        type: TransactionType.INCOME,
        color: '#000',
        icon: 'icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      amount: 1000,
      description: 'Test',
      date,
      paymentMethod: PaymentMethod.PIX,
      createdBy: 'admin',
      status: TransactionStatus.APPROVED,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('should filter transactions by date range', () => {
      const transactions = [
        createTransactionWithDate('1', new Date('2024-01-05')),
        createTransactionWithDate('2', new Date('2024-01-15')),
        createTransactionWithDate('3', new Date('2024-01-25')),
        createTransactionWithDate('4', new Date('2024-02-05'))
      ];

      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-31');

      const filteredTransactions = transactions.filter(t =>
        t.date >= startDate && t.date <= endDate
      );

      expect(filteredTransactions).toHaveLength(2);
      expect(filteredTransactions.map(t => t.id)).toEqual(['2', '3']);
    });

    it('should include transactions on boundary dates', () => {
      const transactions = [
        createTransactionWithDate('1', new Date('2024-01-01')),
        createTransactionWithDate('2', new Date('2024-01-15')),
        createTransactionWithDate('3', new Date('2024-01-31'))
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filteredTransactions = transactions.filter(t =>
        t.date >= startDate && t.date <= endDate
      );

      expect(filteredTransactions).toHaveLength(3);
    });

    it('should return empty array when no transactions in range', () => {
      const transactions = [
        createTransactionWithDate('1', new Date('2024-01-05')),
        createTransactionWithDate('2', new Date('2024-01-10'))
      ];

      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      const filteredTransactions = transactions.filter(t =>
        t.date >= startDate && t.date <= endDate
      );

      expect(filteredTransactions).toHaveLength(0);
    });

    it('should filter for monthly report period', () => {
      const transactions = [
        createTransactionWithDate('1', new Date('2024-01-15')),
        createTransactionWithDate('2', new Date('2024-02-15')),
        createTransactionWithDate('3', new Date('2024-03-15'))
      ];

      // January 2024
      const monthStart = new Date('2024-01-01');
      const monthEnd = new Date('2024-01-31');

      const filteredTransactions = transactions.filter(t =>
        t.date >= monthStart && t.date <= monthEnd
      );

      expect(filteredTransactions).toHaveLength(1);
      expect(filteredTransactions[0].id).toBe('1');
    });

    it('should filter for quarterly report period', () => {
      const transactions = [
        createTransactionWithDate('1', new Date('2024-01-15')),
        createTransactionWithDate('2', new Date('2024-02-15')),
        createTransactionWithDate('3', new Date('2024-03-15')),
        createTransactionWithDate('4', new Date('2024-04-15'))
      ];

      // Q1 2024
      const quarterStart = new Date('2024-01-01');
      const quarterEnd = new Date('2024-03-31');

      const filteredTransactions = transactions.filter(t =>
        t.date >= quarterStart && t.date <= quarterEnd
      );

      expect(filteredTransactions).toHaveLength(3);
    });
  });

  describe('Category Grouping', () => {
    const createTransactionWithCategory = (
      id: string,
      categoryId: string,
      categoryName: string,
      amount: number,
      type: TransactionType
    ): Transaction => ({
      id,
      type,
      category: {
        id: categoryId,
        name: categoryName,
        type,
        color: '#000',
        icon: 'icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      amount,
      description: 'Test',
      date: new Date(),
      paymentMethod: PaymentMethod.PIX,
      createdBy: 'admin',
      status: TransactionStatus.APPROVED,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('should group transactions by category', () => {
      const transactions = [
        createTransactionWithCategory('1', 'tithe', 'Tithes', 1000, TransactionType.INCOME),
        createTransactionWithCategory('2', 'tithe', 'Tithes', 2000, TransactionType.INCOME),
        createTransactionWithCategory('3', 'offering', 'Offerings', 500, TransactionType.INCOME),
        createTransactionWithCategory('4', 'utilities', 'Utilities', 300, TransactionType.EXPENSE)
      ];

      const grouped = transactions.reduce((acc, transaction) => {
        const categoryId = transaction.category.id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(transaction);
        return acc;
      }, {} as Record<string, Transaction[]>);

      expect(Object.keys(grouped)).toHaveLength(3);
      expect(grouped['tithe']).toHaveLength(2);
      expect(grouped['offering']).toHaveLength(1);
      expect(grouped['utilities']).toHaveLength(1);
    });

    it('should calculate totals per category group', () => {
      const transactions = [
        createTransactionWithCategory('1', 'tithe', 'Tithes', 1000, TransactionType.INCOME),
        createTransactionWithCategory('2', 'tithe', 'Tithes', 2000, TransactionType.INCOME),
        createTransactionWithCategory('3', 'offering', 'Offerings', 500, TransactionType.INCOME)
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);

      expect(totals.get('tithe')).toBe(3000);
      expect(totals.get('offering')).toBe(500);
    });

    it('should calculate percentage distribution by category', () => {
      const transactions = [
        createTransactionWithCategory('1', 'tithe', 'Tithes', 6000, TransactionType.INCOME),
        createTransactionWithCategory('2', 'offering', 'Offerings', 3000, TransactionType.INCOME),
        createTransactionWithCategory('3', 'donation', 'Donations', 1000, TransactionType.INCOME)
      ];

      const totals = FinancialEntity.calculateTotalByCategory(transactions);
      const total = Array.from(totals.values()).reduce((sum, val) => sum + val, 0);

      const tithePercentage = ((totals.get('tithe') || 0) / total) * 100;
      const offeringPercentage = ((totals.get('offering') || 0) / total) * 100;
      const donationPercentage = ((totals.get('donation') || 0) / total) * 100;

      expect(tithePercentage).toBe(60);
      expect(offeringPercentage).toBe(30);
      expect(donationPercentage).toBe(10);
    });
  });
});
