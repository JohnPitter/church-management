// Domain Entity - Financial System
// Represents financial transactions, categories, and budgets for church management

export interface Transaction {
  id: string;
  type: TransactionType;
  category: FinancialCategory;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  reference?: string; // Invoice number, receipt number, etc.
  notes?: string;
  attachments?: string[]; // URLs to receipts/invoices
  createdBy: string;
  approvedBy?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // For recurring transactions
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  parentTransactionId?: string; // For installments
  installmentNumber?: number;
  totalInstallments?: number;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  parentCategoryId?: string; // For subcategories
  budgetLimit?: number; // Monthly budget limit
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  year: number;
  month?: number; // null for annual budgets
  categories: BudgetCategory[];
  totalPlanned: number;
  totalActual: number;
  status: BudgetStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  percentageUsed: number;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  data: any; // Report-specific data structure
  generatedBy: string;
  generatedAt: Date;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  membershipNumber?: string;
}

export interface Donation {
  id: string;
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  amount: number;
  type: DonationType;
  category: FinancialCategory;
  date: Date;
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  notes?: string;
  receiptNumber?: string;
  taxDeductible?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'boleto',
  OTHER = 'other'
}

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum RecurringPattern {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export enum BudgetStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReportType {
  INCOME_STATEMENT = 'income_statement',
  CASH_FLOW = 'cash_flow',
  BUDGET_VARIANCE = 'budget_variance',
  DONATION_SUMMARY = 'donation_summary',
  EXPENSE_ANALYSIS = 'expense_analysis',
  CATEGORY_BREAKDOWN = 'category_breakdown'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  CUSTOM = 'custom'
}

export enum DonationType {
  TITHE = 'tithe',
  OFFERING = 'offering',
  SPECIAL_OFFERING = 'special_offering',
  MISSION = 'mission',
  BUILDING_FUND = 'building_fund',
  CHARITY = 'charity',
  OTHER = 'other'
}

// Business Rules
export class FinancialEntity {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  static calculateVariance(planned: number, actual: number): number {
    return actual - planned;
  }

  static calculateVariancePercentage(planned: number, actual: number): number {
    if (planned === 0) return actual > 0 ? 100 : 0;
    return ((actual - planned) / planned) * 100;
  }

  static isOverBudget(planned: number, actual: number): boolean {
    return actual > planned;
  }

  static getBudgetStatus(planned: number, actual: number): 'under' | 'over' | 'on_track' {
    const variance = this.calculateVariancePercentage(planned, actual);
    if (variance > 10) return 'over';
    if (variance < -10) return 'under';
    return 'on_track';
  }

  static validateTransaction(transaction: Partial<Transaction>): string[] {
    const errors: string[] = [];

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!transaction.category) {
      errors.push('Categoria é obrigatória');
    }

    if (!transaction.description?.trim()) {
      errors.push('Descrição é obrigatória');
    }

    if (!transaction.date) {
      errors.push('Data é obrigatória');
    }

    if (!transaction.paymentMethod) {
      errors.push('Método de pagamento é obrigatório');
    }

    return errors;
  }

  static calculateTotalByCategory(transactions: Transaction[]): Map<string, number> {
    const totals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const categoryId = transaction.category.id;
      const current = totals.get(categoryId) || 0;
      const amount = transaction.type === TransactionType.INCOME 
        ? transaction.amount 
        : -transaction.amount;
      totals.set(categoryId, current + amount);
    });

    return totals;
  }

  static getNextRecurringDate(date: Date, pattern: RecurringPattern): Date {
    const nextDate = new Date(date);

    switch (pattern) {
      case RecurringPattern.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurringPattern.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RecurringPattern.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurringPattern.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurringPattern.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  static generateReceiptNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `REC-${timestamp.substr(-6)}-${random}`;
  }

  static isTaxDeductibleCategory(category: FinancialCategory): boolean {
    // Define which categories are tax deductible
    const deductibleCategories = ['charity', 'mission', 'social_assistance'];
    return deductibleCategories.includes(category.id.toLowerCase());
  }
}
