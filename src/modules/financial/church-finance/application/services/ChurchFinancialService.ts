// Infrastructure Service - Church Financial Service
// Service for managing CHURCH financial transactions, budgets, and reports
// Completely independent from ONG financial system

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
  limit,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  Transaction, 
  FinancialCategory, 
  Donation,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  DonationType,
  FinancialEntity
} from '../../domain/entities/Financial';
import { startOfMonth, endOfMonth, format as formatDate } from 'date-fns';

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

/**
 * ChurchFinancialService
 *
 * COMPLETELY INDEPENDENT financial service for church operations.
 * Uses separate Firestore collections with 'church_' prefix to ensure
 * complete isolation from ONG financial data.
 *
 * Collections used:
 * - church_transactions: All church financial transactions
 * - church_categories: Church-specific financial categories
 * - church_budgets: Church budget planning and tracking
 * - church_donations: Church donations (tithes, offerings, etc.)
 */
export class ChurchFinancialService {
  private transactionsCollection = 'church_transactions';
  private categoriesCollection = 'church_categories';
  private budgetsCollection = 'church_budgets';
  private donationsCollection = 'church_donations';

  // Transaction Management
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const errors = FinancialEntity.validateTransaction(transaction);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const now = new Date();
      const docRef = await addDoc(collection(db, this.transactionsCollection), {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      // Update budget actual amounts
      if (transaction.status === TransactionStatus.APPROVED) {
        await this.updateBudgetActuals(transaction.category.id, transaction.amount, transaction.type);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Erro ao criar transação');
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const docRef = doc(db, this.transactionsCollection, id);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await updateDoc(docRef, updateData);

      // If status changed to approved, update budget
      if (updates.status === TransactionStatus.APPROVED && updates.category) {
        await this.updateBudgetActuals(updates.category.id, updates.amount || 0, updates.type || TransactionType.EXPENSE);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Erro ao atualizar transação');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.transactionsCollection, id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Erro ao excluir transação');
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const docRef = doc(db, this.transactionsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw new Error('Erro ao buscar transação');
    }
  }

  async getTransactions(filters: TransactionFilters = {}, limitCount = 50): Promise<Transaction[]> {
    try {
      let q = query(collection(db, this.transactionsCollection));

      // Apply filters
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.categoryId) {
        q = query(q, where('category.id', '==', filters.categoryId));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.paymentMethod) {
        q = query(q, where('paymentMethod', '==', filters.paymentMethod));
      }

      if (filters.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }

      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      // Order by date descending and limit
      q = query(q, orderBy('date', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Transaction;
      }).filter(transaction => {
        // Apply amount filters (client-side filtering)
        if (filters.minAmount && transaction.amount < filters.minAmount) return false;
        if (filters.maxAmount && transaction.amount > filters.maxAmount) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new Error('Erro ao buscar transações');
    }
  }

  // Category Management
  async createCategory(category: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.categoriesCollection), {
        ...category,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Erro ao criar categoria');
    }
  }

  async getCategories(type?: TransactionType): Promise<FinancialCategory[]> {
    try {
      let q = query(collection(db, this.categoriesCollection), where('isActive', '==', true));
      
      if (type) {
        q = query(q, where('type', '==', type));
      }
      
      q = query(q, orderBy('name'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as FinancialCategory;
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Erro ao buscar categorias');
    }
  }

  // Financial Summary and Reports
  async getFinancialSummary(startDate: Date, endDate: Date): Promise<FinancialSummary> {
    try {
      const transactions = await this.getTransactions({
        startDate,
        endDate,
        status: TransactionStatus.APPROVED
      }, 1000);

      const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingCount = await this.getTransactionCount({
        status: TransactionStatus.PENDING,
        startDate,
        endDate
      });

      // Calculate top categories
      const categoryTotals = new Map<string, { category: FinancialCategory; amount: number; count: number }>();
      
      transactions.forEach(transaction => {
        const categoryId = transaction.category.id;
        const existing = categoryTotals.get(categoryId);
        
        if (existing) {
          existing.amount += transaction.amount;
          existing.count += 1;
        } else {
          categoryTotals.set(categoryId, {
            category: transaction.category,
            amount: transaction.amount,
            count: 1
          });
        }
      });

      const topCategories = Array.from(categoryTotals.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        pendingTransactions: pendingCount,
        topCategories
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw new Error('Erro ao gerar resumo financeiro');
    }
  }

  // Donation Management
  async createDonation(donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const receiptNumber = donation.receiptNumber || FinancialEntity.generateReceiptNumber();
      
      const docRef = await addDoc(collection(db, this.donationsCollection), {
        ...donation,
        receiptNumber,
        date: Timestamp.fromDate(donation.date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      // Create corresponding transaction
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
      console.error('Error creating donation:', error);
      throw new Error('Erro ao criar doação');
    }
  }

  async getDonationSummary(startDate: Date, endDate: Date): Promise<DonationSummary> {
    try {
      const donations = await this.getDonations({ startDate, endDate });

      const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
      const totalTithes = donations
        .filter(d => d.type === DonationType.TITHE)
        .reduce((sum, d) => sum + d.amount, 0);
      const totalOfferings = donations
        .filter(d => d.type === DonationType.OFFERING)
        .reduce((sum, d) => sum + d.amount, 0);

      const uniqueDonors = new Set(donations.map(d => d.memberId).filter(Boolean)).size;
      const averageDonation = donations.length > 0 ? totalDonations / donations.length : 0;

      // Calculate monthly growth (simplified)
      const previousMonthStart = startOfMonth(new Date(startDate.getFullYear(), startDate.getMonth() - 1));
      const previousMonthEnd = endOfMonth(previousMonthStart);
      const previousMonthDonations = await this.getDonations({
        startDate: previousMonthStart,
        endDate: previousMonthEnd
      });
      const previousTotal = previousMonthDonations.reduce((sum, d) => sum + d.amount, 0);
      const monthlyGrowth = previousTotal > 0 ? ((totalDonations - previousTotal) / previousTotal) * 100 : 0;

      return {
        totalDonations,
        totalTithes,
        totalOfferings,
        donorCount: uniqueDonors,
        averageDonation,
        monthlyGrowth
      };
    } catch (error) {
      console.error('Error getting donation summary:', error);
      throw new Error('Erro ao gerar resumo de doações');
    }
  }

  // Private helper methods
  private async getTransactionCount(filters: TransactionFilters): Promise<number> {
    try {
      let q = query(collection(db, this.transactionsCollection));

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }

      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch (error) {
      console.error('Error counting transactions:', error);
      
      // Fallback: try to get count without complex queries
      try {
        const simpleQuery = query(collection(db, this.transactionsCollection), limit(1000));
        const snapshot = await getDocs(simpleQuery);
        
        // Filter manually
        const filteredDocs = snapshot.docs.filter(doc => {
          const data = doc.data();
          
          if (filters.status && data.status !== filters.status) return false;
          
          if (filters.startDate && data.date.toDate() < filters.startDate) return false;
          
          if (filters.endDate && data.date.toDate() > filters.endDate) return false;
          
          return true;
        });
        
        return filteredDocs.length;
      } catch (fallbackError) {
        console.error('Error with fallback count:', fallbackError);
        return 0;
      }
    }
  }

  private async getDonations(filters: { startDate?: Date; endDate?: Date } = {}): Promise<Donation[]> {
    try {
      let q = query(collection(db, this.donationsCollection));

      if (filters.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }

      q = query(q, orderBy('date', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Donation;
      });
    } catch (error) {
      console.error('Error getting donations:', error);
      throw new Error('Erro ao buscar doações');
    }
  }

  private async updateBudgetActuals(categoryId: string, amount: number, type: TransactionType): Promise<void> {
    try {
      // This would update the current active budget's actual amounts
      // Implementation would depend on budget structure
      console.log(`Updating budget for category ${categoryId}: ${type} ${amount}`);
    } catch (error) {
      console.error('Error updating budget actuals:', error);
    }
  }

  // Chart Data Methods
  async getIncomeExpenseTrend(startDate: Date, endDate: Date, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<{ date: Date; income: number; expense: number }[]> {
    try {
      const transactions = await this.getTransactions({
        startDate,
        endDate,
        status: TransactionStatus.APPROVED
      }, 1000);

      // Group transactions by period
      const groupedData = new Map<string, { income: number; expense: number; date: Date }>();
      
      transactions.forEach(transaction => {
        let periodKey: string;
        let periodDate: Date;
        
        switch (period) {
          case 'daily':
            periodKey = formatDate(transaction.date, 'yyyy-MM-dd');
            periodDate = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), transaction.date.getDate());
            break;
          case 'weekly':
            const weekStart = new Date(transaction.date);
            weekStart.setDate(transaction.date.getDate() - transaction.date.getDay());
            periodKey = formatDate(weekStart, 'yyyy-MM-dd');
            periodDate = weekStart;
            break;
          case 'monthly':
          default:
            periodKey = formatDate(transaction.date, 'yyyy-MM');
            periodDate = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);
            break;
        }
        
        if (!groupedData.has(periodKey)) {
          groupedData.set(periodKey, { income: 0, expense: 0, date: periodDate });
        }
        
        const data = groupedData.get(periodKey)!;
        if (transaction.type === TransactionType.INCOME) {
          data.income += transaction.amount;
        } else if (transaction.type === TransactionType.EXPENSE) {
          data.expense += transaction.amount;
        }
      });

      return Array.from(groupedData.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting income expense trend:', error);
      return [];
    }
  }

  async getCategoryChartData(startDate: Date, endDate: Date, type: TransactionType): Promise<{ category: FinancialCategory; amount: number; count: number }[]> {
    try {
      const transactions = await this.getTransactions({
        startDate,
        endDate,
        type,
        status: TransactionStatus.APPROVED
      }, 1000);

      const categoryTotals = new Map<string, { category: FinancialCategory; amount: number; count: number }>();
      
      transactions.forEach(transaction => {
        const categoryId = transaction.category.id;
        const existing = categoryTotals.get(categoryId);
        
        if (existing) {
          existing.amount += transaction.amount;
          existing.count += 1;
        } else {
          categoryTotals.set(categoryId, {
            category: transaction.category,
            amount: transaction.amount,
            count: 1
          });
        }
      });

      return Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Error getting category chart data:', error);
      return [];
    }
  }

  async getMonthlyComparison(startDate: Date, endDate: Date): Promise<{ month: Date; income: number; expense: number; netIncome: number }[]> {
    try {
      const transactions = await this.getTransactions({
        startDate,
        endDate,
        status: TransactionStatus.APPROVED
      }, 1000);

      const monthlyData = new Map<string, { month: Date; income: number; expense: number }>();
      
      transactions.forEach(transaction => {
        const monthKey = formatDate(transaction.date, 'yyyy-MM');
        const monthDate = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { month: monthDate, income: 0, expense: 0 });
        }
        
        const data = monthlyData.get(monthKey)!;
        if (transaction.type === TransactionType.INCOME) {
          data.income += transaction.amount;
        } else if (transaction.type === TransactionType.EXPENSE) {
          data.expense += transaction.amount;
        }
      });

      return Array.from(monthlyData.values())
        .map(data => ({
          ...data,
          netIncome: data.income - data.expense
        }))
        .sort((a, b) => a.month.getTime() - b.month.getTime());
    } catch (error) {
      console.error('Error getting monthly comparison:', error);
      return [];
    }
  }

  async getDonationChartData(startDate: Date, endDate: Date): Promise<{ type: DonationType; amount: number; count: number; label: string }[]> {
    try {
      const donations = await this.getDonations({ startDate, endDate });

      const donationLabels = {
        [DonationType.TITHE]: 'Dízimos',
        [DonationType.OFFERING]: 'Ofertas',
        [DonationType.SPECIAL_OFFERING]: 'Ofertas Especiais',
        [DonationType.MISSION]: 'Missões',
        [DonationType.BUILDING_FUND]: 'Construção/Obras',
        [DonationType.CHARITY]: 'Caridade',
        [DonationType.OTHER]: 'Outros'
      };

      const donationTotals = new Map<DonationType, { amount: number; count: number }>();
      
      donations.forEach(donation => {
        const existing = donationTotals.get(donation.type);
        if (existing) {
          existing.amount += donation.amount;
          existing.count += 1;
        } else {
          donationTotals.set(donation.type, { amount: donation.amount, count: 1 });
        }
      });

      return Array.from(donationTotals.entries()).map(([type, data]) => ({
        type,
        amount: data.amount,
        count: data.count,
        label: donationLabels[type]
      })).sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error('Error getting donation chart data:', error);
      return [];
    }
  }

  // Export data for reports
  async exportTransactions(filters: TransactionFilters, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const transactions = await this.getTransactions(filters, 1000);
      
      if (format === 'json') {
        return new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
      } else {
        // CSV export
        const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Método Pagamento', 'Status'];
        const rows = transactions.map(t => [
          formatDate(t.date, 'dd/MM/yyyy'),
          t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
          t.category.name,
          t.description,
          FinancialEntity.formatCurrency(t.amount),
          t.paymentMethod,
          t.status
        ]);
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw new Error('Erro ao exportar transações');
    }
  }
}

// Export singleton instance for church financial operations
export const churchFinancialService = new ChurchFinancialService();

// Mantém compatibilidade retroativa com código existente
// DEPRECATED: Use churchFinancialService para novos desenvolvimentos
export const financialService = churchFinancialService;
