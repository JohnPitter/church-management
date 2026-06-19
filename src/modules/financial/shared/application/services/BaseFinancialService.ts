import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type UpdateData
} from 'firebase/firestore';
import { endOfMonth, format as formatDate, startOfMonth } from 'date-fns';
import { db } from '@/config/firebase';
import { FirebaseMemberRepository } from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository';
import { MemberStatus } from '@modules/church-management/members/domain/entities/Member';
import {
  Donation,
  DonationType,
  FinancialCategory,
  FinancialEntity,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType
} from '../../../church-finance/domain/entities/Financial';

const DEFAULT_QUERY_LIMIT = 50;
const REPORT_QUERY_LIMIT = 1000;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const EXPORT_TITLE = 'RELATORIO FINANCEIRO';
const EXPORT_SHEET = 'Transacoes';
const DONATION_LABELS: Record<DonationType, string> = {
  [DonationType.TITHE]: 'Dízimos',
  [DonationType.OFFERING]: 'Ofertas',
  [DonationType.SPECIAL_OFFERING]: 'Ofertas Especiais',
  [DonationType.MISSION]: 'Missões',
  [DonationType.BUILDING_FUND]: 'Construção/Obras',
  [DonationType.CHARITY]: 'Caridade',
  [DonationType.OTHER]: 'Outros'
};

type DateLike = Date | { toDate: () => Date } | string | number | undefined;

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  createdBy?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  pendingTransactions: number;
  topCategories: { category: FinancialCategory; amount: number; count: number }[];
}

export interface DonationSummary {
  totalDonations: number;
  totalTithes: number;
  totalOfferings: number;
  donorCount: number;
  averageDonation: number;
  monthlyGrowth: number;
}

export interface FinancialCollections {
  transactions: string;
  categories: string;
  budgets: string;
  donations?: string;
}

export interface FinancialServiceOptions {
  collections: FinancialCollections;
  errorContext?: string;
  logContext?: string;
  fallbackOnQueryError?: boolean;
  includeEmptyTrendSlots?: boolean;
  exportTitle?: string;
  exportSheetName?: string;
}

export abstract class BaseFinancialService {
  protected readonly collections: FinancialCollections;
  private readonly errorContext: string;
  private readonly logContext: string;
  private readonly fallbackOnQueryError: boolean;
  private readonly includeEmptyTrendSlots: boolean;
  private readonly exportTitle: string;
  private readonly exportSheetName: string;

  protected constructor(options: FinancialServiceOptions) {
    this.collections = options.collections;
    this.errorContext = options.errorContext ?? '';
    this.logContext = options.logContext ?? 'financial';
    this.fallbackOnQueryError = options.fallbackOnQueryError ?? false;
    this.includeEmptyTrendSlots = options.includeEmptyTrendSlots ?? true;
    this.exportTitle = options.exportTitle ?? EXPORT_TITLE;
    this.exportSheetName = options.exportSheetName ?? EXPORT_SHEET;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const errors = FinancialEntity.validateTransaction(transaction);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const now = new Date();
      const docRef = await addDoc(collection(db, this.collections.transactions), {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      if (transaction.status === TransactionStatus.APPROVED) {
        await this.updateBudgetActuals(transaction.category.id, transaction.amount, transaction.type);
      }

      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.logContext} transaction:`, error);
      throw new Error(`Erro ao criar transação${this.errorContext}`);
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const updateData: UpdateData<DocumentData> = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await updateDoc(doc(db, this.collections.transactions, id), updateData);

      if (updates.status === TransactionStatus.APPROVED && updates.category) {
        await this.updateBudgetActuals(
          updates.category.id,
          updates.amount ?? 0,
          updates.type ?? TransactionType.EXPENSE
        );
      }
    } catch (error) {
      console.error(`Error updating ${this.logContext} transaction:`, error);
      throw new Error(`Erro ao atualizar transação${this.errorContext}`);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collections.transactions, id));
    } catch (error) {
      console.error(`Error deleting ${this.logContext} transaction:`, error);
      throw new Error(`Erro ao excluir transação${this.errorContext}`);
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collections.transactions, id));

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapTransactionDoc(docSnap);
    } catch (error) {
      console.error(`Error getting ${this.logContext} transaction:`, error);
      throw new Error(`Erro ao buscar transação${this.errorContext}`);
    }
  }

  async getTransactions(
    filters: TransactionFilters = {},
    limitCount = DEFAULT_QUERY_LIMIT
  ): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(this.buildTransactionQuery(filters, limitCount));
      return this.applyAmountFilters(this.mapTransactionDocs(snapshot.docs), filters);
    } catch (error) {
      if (!this.fallbackOnQueryError) {
        console.error(`Error getting ${this.logContext} transactions:`, error);
        throw new Error(`Erro ao buscar transações${this.errorContext}`);
      }

      console.warn(`${this.logContext} transaction query failed, falling back to client-side filter:`, error);
      return this.getTransactionsFallback(filters, limitCount);
    }
  }

  async getTransactionsPaginated(
    filters: TransactionFilters = {},
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult<Transaction>> {
    try {
      const [total, allTransactions] = await Promise.all([
        this.getFilteredTransactionCount(filters),
        this.getTransactions(filters, page * pageSize)
      ]);
      const startIdx = (page - 1) * pageSize;

      return {
        data: allTransactions.slice(startIdx, startIdx + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error(`Error getting paginated ${this.logContext} transactions:`, error);
      throw new Error(`Erro ao buscar transações paginadas${this.errorContext}`);
    }
  }

  async createCategory(category: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.collections.categories), {
        ...category,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.logContext} category:`, error);
      throw new Error(`Erro ao criar categoria${this.errorContext}`);
    }
  }

  async updateCategory(
    id: string,
    updates: Partial<Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.collections.categories, id), {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error(`Error updating ${this.logContext} category:`, error);
      throw new Error(`Erro ao atualizar categoria${this.errorContext}`);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collections.categories, id));
    } catch (error) {
      console.error(`Error deleting ${this.logContext} category:`, error);
      throw new Error(`Erro ao excluir categoria${this.errorContext}`);
    }
  }

  async getCategories(type?: TransactionType): Promise<FinancialCategory[]> {
    try {
      const snapshot = await getDocs(this.buildCategoryQuery(type));
      const results = this.mapCategoryDocs(snapshot.docs);

      if (results.length === 0 && !type) {
        await this.initializeDefaultCategories();
        return this.getCategoriesFallback(type);
      }

      return results;
    } catch (error) {
      if (!this.fallbackOnQueryError) {
        console.error(`Error getting ${this.logContext} categories:`, error);
        throw new Error(`Erro ao buscar categorias${this.errorContext}`);
      }

      console.warn(`${this.logContext} category query failed, falling back to client-side filter:`, error);
      const fallbackResults = await this.getCategoriesFallback(type);

      if (fallbackResults.length === 0 && !type) {
        await this.initializeDefaultCategories();
        return this.getCategoriesFallback(type);
      }

      return fallbackResults;
    }
  }

  async getFinancialSummary(startDate: Date, endDate: Date): Promise<FinancialSummary> {
    try {
      const allTransactions = await this.getTransactions({ startDate, endDate }, REPORT_QUERY_LIMIT);
      const transactions = this.getApprovedTransactions(allTransactions);
      const totalIncome = this.sumTransactions(transactions, TransactionType.INCOME);
      const totalExpenses = this.sumTransactions(transactions, TransactionType.EXPENSE);
      const pendingCount = await this.getTransactionCount({
        status: TransactionStatus.PENDING,
        startDate,
        endDate
      });

      return {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        pendingTransactions: pendingCount,
        topCategories: this.getTopCategories(transactions)
      };
    } catch (error) {
      console.error(`Error getting ${this.logContext} financial summary:`, error);
      throw new Error(`Erro ao gerar resumo financeiro${this.errorContext}`);
    }
  }

  async createDonation(donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const donationsCollection = this.requireDonationsCollection();
      const now = new Date();
      const receiptNumber = donation.receiptNumber || FinancialEntity.generateReceiptNumber();
      const docRef = await addDoc(collection(db, donationsCollection), {
        ...donation,
        receiptNumber,
        date: Timestamp.fromDate(donation.date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      await this.createTransaction({
        type: TransactionType.INCOME,
        category: donation.category,
        amount: donation.amount,
        description: `Doação: ${donation.type} - ${donation.memberName || 'Anônimo'}`,
        date: donation.date,
        paymentMethod: donation.paymentMethod,
        reference: receiptNumber,
        notes: donation.notes,
        createdBy: donation.createdBy,
        status: TransactionStatus.APPROVED
      });

      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.logContext} donation:`, error);
      throw new Error(`Erro ao criar doação${this.errorContext}`);
    }
  }

  async getDonationSummary(startDate: Date, endDate: Date): Promise<DonationSummary> {
    try {
      const donations = await this.getDonations({ startDate, endDate });
      const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
      const totalTithes = this.sumDonations(donations, DonationType.TITHE);
      const totalOfferings = this.sumDonations(donations, DonationType.OFFERING);
      const uniqueDonors = new Set(donations.map(donation => donation.memberId).filter(Boolean)).size;
      const averageDonation = donations.length > 0 ? totalDonations / donations.length : 0;
      const previousMonthStart = startOfMonth(new Date(startDate.getFullYear(), startDate.getMonth() - 1));
      const previousMonthEnd = endOfMonth(previousMonthStart);
      const previousMonthDonations = await this.getDonations({
        startDate: previousMonthStart,
        endDate: previousMonthEnd
      });
      const previousTotal = previousMonthDonations.reduce((sum, donation) => sum + donation.amount, 0);

      return {
        totalDonations,
        totalTithes,
        totalOfferings,
        donorCount: uniqueDonors,
        averageDonation,
        monthlyGrowth: previousTotal > 0 ? ((totalDonations - previousTotal) / previousTotal) * 100 : 0
      };
    } catch (error) {
      console.error(`Error getting ${this.logContext} donation summary:`, error);
      throw new Error(`Erro ao gerar resumo de doações${this.errorContext}`);
    }
  }

  async getIncomeExpenseTrend(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<{ date: Date; income: number; expense: number }[]> {
    try {
      const allTransactions = await this.getTransactions({ startDate, endDate }, REPORT_QUERY_LIMIT);
      const transactions = this.getApprovedTransactions(allTransactions);
      const slots = this.includeEmptyTrendSlots
        ? this.createTrendSlots(startDate, endDate, period)
        : new Map<string, { income: number; expense: number; date: Date }>();

      transactions.forEach(transaction => {
        const periodKey = this.getTrendPeriodKey(transaction.date, period);
        if (!slots.has(periodKey)) {
          slots.set(periodKey, {
            income: 0,
            expense: 0,
            date: this.getTrendSlotDate(transaction.date, period)
          });
        }

        const data = slots.get(periodKey);
        if (!data) return;
        if (transaction.type === TransactionType.INCOME) data.income += transaction.amount;
        if (transaction.type === TransactionType.EXPENSE) data.expense += transaction.amount;
      });

      return Array.from(slots.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error(`Error getting ${this.logContext} income expense trend:`, error);
      return [];
    }
  }

  async getCategoryChartData(
    startDate: Date,
    endDate: Date,
    type: TransactionType
  ): Promise<{ category: FinancialCategory; amount: number; count: number }[]> {
    try {
      const allTransactions = await this.getTransactions({ startDate, endDate, type }, REPORT_QUERY_LIMIT);
      return this.getTopCategories(this.getApprovedTransactions(allTransactions), Number.MAX_SAFE_INTEGER);
    } catch (error) {
      console.error(`Error getting ${this.logContext} category chart data:`, error);
      return [];
    }
  }

  async getMonthlyComparison(
    startDate: Date,
    endDate: Date
  ): Promise<{ month: Date; income: number; expense: number; netIncome: number }[]> {
    try {
      const allTransactions = await this.getTransactions({ startDate, endDate }, REPORT_QUERY_LIMIT);
      const transactions = this.getApprovedTransactions(allTransactions);
      const monthlyData = new Map<string, { month: Date; income: number; expense: number }>();

      transactions.forEach(transaction => {
        const monthKey = formatDate(transaction.date, 'yyyy-MM');
        const monthDate = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { month: monthDate, income: 0, expense: 0 });
        }

        const data = monthlyData.get(monthKey);
        if (!data) return;
        if (transaction.type === TransactionType.INCOME) data.income += transaction.amount;
        if (transaction.type === TransactionType.EXPENSE) data.expense += transaction.amount;
      });

      return Array.from(monthlyData.values())
        .map(data => ({ ...data, netIncome: data.income - data.expense }))
        .sort((a, b) => a.month.getTime() - b.month.getTime());
    } catch (error) {
      console.error(`Error getting ${this.logContext} monthly comparison:`, error);
      return [];
    }
  }

  async getDonationChartData(
    startDate: Date,
    endDate: Date
  ): Promise<{ type: DonationType; amount: number; count: number; label: string }[]> {
    try {
      const donations = await this.getDonations({ startDate, endDate });
      const donationTotals = new Map<DonationType, { amount: number; count: number }>();

      donations.forEach(donation => {
        const existing = donationTotals.get(donation.type);
        if (existing) {
          existing.amount += donation.amount;
          existing.count += 1;
          return;
        }
        donationTotals.set(donation.type, { amount: donation.amount, count: 1 });
      });

      return Array.from(donationTotals.entries())
        .map(([type, data]) => ({ type, ...data, label: DONATION_LABELS[type] }))
        .sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error(`Error getting ${this.logContext} donation chart data:`, error);
      return [];
    }
  }

  async getMemberFidelityData(
    startDate: Date,
    endDate: Date
  ): Promise<{ contributingMembers: number; totalActiveMembers: number; percentage: number }> {
    try {
      const memberRepository = new FirebaseMemberRepository();
      const [donations, totalActiveMembers] = await Promise.all([
        this.getDonations({ startDate, endDate }),
        memberRepository.countByStatus(MemberStatus.Active)
      ]);
      const contributingMembers = new Set(
        donations.filter(donation => donation.memberId && !donation.isAnonymous).map(donation => donation.memberId)
      ).size;
      const percentage = totalActiveMembers > 0
        ? Math.round((contributingMembers / totalActiveMembers) * 100)
        : 0;

      return { contributingMembers, totalActiveMembers, percentage };
    } catch (error) {
      console.error(`Error getting ${this.logContext} member fidelity data:`, error);
      return { contributingMembers: 0, totalActiveMembers: 0, percentage: 0 };
    }
  }

  async exportTransactions(filters: TransactionFilters, format: 'xlsx' | 'json' = 'xlsx'): Promise<Blob> {
    try {
      const transactions = await this.getTransactions(filters, REPORT_QUERY_LIMIT);
      if (format === 'json') {
        return new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
      }

      const { exportTransactionsToXlsx } = await import('../../../../../utils/xlsxExport');
      return exportTransactionsToXlsx(transactions, {
        title: this.exportTitle,
        sheetName: this.exportSheetName,
        startDate: filters.startDate,
        endDate: filters.endDate,
        incomeType: TransactionType.INCOME
      });
    } catch (error) {
      console.error(`Error exporting ${this.logContext} transactions:`, error);
      throw new Error(`Erro ao exportar transacoes${this.errorContext}`);
    }
  }

  async initializeDefaultCategories(): Promise<void> {
    return Promise.resolve();
  }

  protected async seedCategories(
    categories: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    const snapshot = await getDocs(query(collection(db, this.collections.categories), limit(1)));
    if (!snapshot.empty) return;

    const now = new Date();
    await Promise.all(categories.map(category => addDoc(collection(db, this.collections.categories), {
      ...category,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })));
  }

  private buildTransactionQuery(filters: TransactionFilters, limitCount: number) {
    let q = query(collection(db, this.collections.transactions));

    if (filters.type) q = query(q, where('type', '==', filters.type));
    if (filters.categoryId) q = query(q, where('category.id', '==', filters.categoryId));
    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.paymentMethod) q = query(q, where('paymentMethod', '==', filters.paymentMethod));
    if (filters.startDate) q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    if (filters.endDate) q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    if (filters.createdBy) q = query(q, where('createdBy', '==', filters.createdBy));

    return query(q, orderBy('date', 'desc'), limit(limitCount));
  }

  private buildCategoryQuery(type?: TransactionType) {
    let q = query(collection(db, this.collections.categories), where('isActive', '==', true));
    if (type) q = query(q, where('type', '==', type));
    return query(q, orderBy('name'));
  }

  private async getTransactionsFallback(filters: TransactionFilters, limitCount: number): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(query(
        collection(db, this.collections.transactions),
        orderBy('date', 'desc'),
        limit(REPORT_QUERY_LIMIT)
      ));
      return this.applyTransactionFilters(this.mapTransactionDocs(snapshot.docs), filters).slice(0, limitCount);
    } catch (fallbackError) {
      console.error(`Fallback failed for ${this.logContext} transactions:`, fallbackError);
      return [];
    }
  }

  private async getCategoriesFallback(type?: TransactionType): Promise<FinancialCategory[]> {
    try {
      const snapshot = await getDocs(query(collection(db, this.collections.categories)));
      return this.mapCategoryDocs(snapshot.docs)
        .filter(category => category.isActive !== false)
        .filter(category => !type || category.type === type)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (fallbackError) {
      console.error(`Fallback failed for ${this.logContext} categories:`, fallbackError);
      return [];
    }
  }

  private async getFilteredTransactionCount(filters: TransactionFilters): Promise<number> {
    try {
      let q = query(collection(db, this.collections.transactions));

      if (filters.type) q = query(q, where('type', '==', filters.type));
      if (filters.status) q = query(q, where('status', '==', filters.status));
      if (filters.startDate) q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      if (filters.endDate) q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));

      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch (error) {
      console.error(`Error counting filtered ${this.logContext} transactions:`, error);
      return 0;
    }
  }

  private async getTransactionCount(filters: TransactionFilters): Promise<number> {
    try {
      let q = query(collection(db, this.collections.transactions));

      if (filters.status) q = query(q, where('status', '==', filters.status));
      if (filters.startDate) q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      if (filters.endDate) q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));

      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch (error) {
      console.error(`Error counting ${this.logContext} transactions:`, error);
      return this.getTransactionCountFallback(filters);
    }
  }

  private async getTransactionCountFallback(filters: TransactionFilters): Promise<number> {
    try {
      const snapshot = await getDocs(query(collection(db, this.collections.transactions), limit(REPORT_QUERY_LIMIT)));
      return snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        const date = this.toDate(data.date);
        if (filters.status && data.status !== filters.status) return false;
        if (filters.startDate && date < filters.startDate) return false;
        if (filters.endDate && date > filters.endDate) return false;
        return true;
      }).length;
    } catch (fallbackError) {
      console.error(`Error with ${this.logContext} transaction count fallback:`, fallbackError);
      return 0;
    }
  }

  private async getDonations(filters: { startDate?: Date; endDate?: Date } = {}): Promise<Donation[]> {
    try {
      const donationsCollection = this.requireDonationsCollection();
      let q = query(collection(db, donationsCollection));

      if (filters.startDate) q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      if (filters.endDate) q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));

      const snapshot = await getDocs(query(q, orderBy('date', 'desc')));
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: this.toDate(data.date),
          createdAt: this.toDate(data.createdAt),
          updatedAt: this.toDate(data.updatedAt)
        } as Donation;
      });
    } catch (error) {
      console.error(`Error getting ${this.logContext} donations:`, error);
      return [];
    }
  }

  private async updateBudgetActuals(categoryId: string, amount: number, type: TransactionType): Promise<void> {
    try {
      console.log(`Updating ${this.logContext} budget for category ${categoryId}: ${type} ${amount}`);
    } catch (error) {
      console.error(`Error updating ${this.logContext} budget actuals:`, error);
    }
  }

  private requireDonationsCollection(): string {
    if (!this.collections.donations) {
      throw new Error(`Donations are not configured for ${this.logContext}`);
    }

    return this.collections.donations;
  }

  private mapTransactionDocs(docs: QueryDocumentSnapshot<DocumentData>[]): Transaction[] {
    return docs.map(docSnap => this.mapTransactionDoc(docSnap));
  }

  private mapTransactionDoc(docSnap: QueryDocumentSnapshot<DocumentData>): Transaction {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: this.toDate(data.date),
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt)
    } as Transaction;
  }

  private mapCategoryDocs(docs: QueryDocumentSnapshot<DocumentData>[]): FinancialCategory[] {
    return docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: this.toDate(data.createdAt),
        updatedAt: this.toDate(data.updatedAt)
      } as FinancialCategory;
    });
  }

  private toDate(value: DateLike): Date {
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && 'toDate' in value) return value.toDate();
    return value ? new Date(value) : new Date();
  }

  private applyAmountFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    return transactions.filter(transaction => {
      if (filters.minAmount && transaction.amount < filters.minAmount) return false;
      if (filters.maxAmount && transaction.amount > filters.maxAmount) return false;
      return true;
    });
  }

  private applyTransactionFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    return this.applyAmountFilters(transactions, filters)
      .filter(transaction => !filters.type || transaction.type === filters.type)
      .filter(transaction => !filters.categoryId || transaction.category.id === filters.categoryId)
      .filter(transaction => !filters.status || transaction.status === filters.status)
      .filter(transaction => !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod)
      .filter(transaction => !filters.startDate || transaction.date >= filters.startDate)
      .filter(transaction => !filters.endDate || transaction.date <= filters.endDate)
      .filter(transaction => !filters.createdBy || transaction.createdBy === filters.createdBy);
  }

  private getApprovedTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter(transaction => transaction.status === TransactionStatus.APPROVED);
  }

  private sumTransactions(transactions: Transaction[], type: TransactionType): number {
    return transactions
      .filter(transaction => transaction.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  private sumDonations(donations: Donation[], type: DonationType): number {
    return donations
      .filter(donation => donation.type === type)
      .reduce((sum, donation) => sum + donation.amount, 0);
  }

  private getTopCategories(
    transactions: Transaction[],
    limitCount = 5
  ): { category: FinancialCategory; amount: number; count: number }[] {
    const categoryTotals = new Map<string, { category: FinancialCategory; amount: number; count: number }>();

    transactions.forEach(transaction => {
      const categoryId = transaction.category.id;
      const existing = categoryTotals.get(categoryId);

      if (existing) {
        existing.amount += transaction.amount;
        existing.count += 1;
        return;
      }

      categoryTotals.set(categoryId, {
        category: transaction.category,
        amount: transaction.amount,
        count: 1
      });
    });

    return Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limitCount);
  }

  private createTrendSlots(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly'
  ): Map<string, { income: number; expense: number; date: Date }> {
    const slots = new Map<string, { income: number; expense: number; date: Date }>();
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const key = this.getTrendPeriodKey(cursor, period);
      const slotDate = this.getTrendSlotDate(cursor, period);
      slots.set(key, { income: 0, expense: 0, date: slotDate });

      if (period === 'daily') cursor.setDate(cursor.getDate() + 1);
      else if (period === 'weekly') cursor.setDate(cursor.getDate() + 7);
      else cursor.setMonth(cursor.getMonth() + 1);
    }

    return slots;
  }

  private getTrendPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    if (period === 'daily') return formatDate(date, 'yyyy-MM-dd');
    if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return formatDate(weekStart, 'yyyy-MM-dd');
    }
    return formatDate(date, 'yyyy-MM');
  }

  private getTrendSlotDate(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    if (period === 'daily') return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart;
    }
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}
