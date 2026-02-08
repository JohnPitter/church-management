// Infrastructure Service - ONG Financial Service
// Independent financial service for ONG operations, completely separated from church finances

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
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  FinancialEntity
} from '../../../church-finance/domain/entities/Financial';
import { format as formatDate } from 'date-fns';
import { DEFAULT_ONG_INCOME_CATEGORIES, DEFAULT_ONG_EXPENSE_CATEGORIES } from './DefaultONGCategories';

// ONG-specific transaction filters
export interface ONGTransactionFilters {
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

// ONG-specific financial summary
export interface ONGFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  pendingTransactions: number;
  topCategories: { category: FinancialCategory; amount: number; count: number }[];
}

/**
 * ONGFinancialService
 *
 * COMPLETELY INDEPENDENT financial service for ONG operations.
 * Uses separate Firestore collections with 'ong_' prefix to ensure
 * complete isolation from church financial data.
 *
 * Collections used:
 * - ong_transactions: All ONG financial transactions
 * - ong_categories: ONG-specific financial categories
 * - ong_budgets: ONG budget planning and tracking
 */
export class ONGFinancialService {
  // ONG-specific collections with 'ong_' prefix for complete separation
  private transactionsCollection = 'ong_transactions';
  private categoriesCollection = 'ong_categories';
  private budgetsCollection = 'ong_budgets';

  // ==================== TRANSACTION MANAGEMENT ====================

  /**
   * Create a new ONG financial transaction
   */
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

      // Update budget actual amounts if approved
      if (transaction.status === TransactionStatus.APPROVED) {
        await this.updateBudgetActuals(transaction.category.id, transaction.amount, transaction.type);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating ONG transaction:', error);
      throw new Error('Erro ao criar transação da ONG');
    }
  }

  /**
   * Update an existing ONG transaction
   */
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
      console.error('Error updating ONG transaction:', error);
      throw new Error('Erro ao atualizar transação da ONG');
    }
  }

  /**
   * Delete an ONG transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.transactionsCollection, id));
    } catch (error) {
      console.error('Error deleting ONG transaction:', error);
      throw new Error('Erro ao excluir transação da ONG');
    }
  }

  /**
   * Get a single ONG transaction by ID
   */
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
      console.error('Error getting ONG transaction:', error);
      throw new Error('Erro ao buscar transação da ONG');
    }
  }

  /**
   * Get ONG transactions with filters
   */
  async getTransactions(filters: ONGTransactionFilters = {}, limitCount = 50): Promise<Transaction[]> {
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
      return this.mapTransactionDocs(snapshot.docs).filter(transaction => {
        if (filters.minAmount && transaction.amount < filters.minAmount) return false;
        if (filters.maxAmount && transaction.amount > filters.maxAmount) return false;
        return true;
      });
    } catch (error) {
      console.warn('Composite index query failed for ONG transactions, falling back to client-side filter:', error);
      return this.getTransactionsFallback(filters, limitCount);
    }
  }

  /**
   * Fallback: fetch all ONG transactions and filter client-side when composite indexes are missing
   */
  private async getTransactionsFallback(filters: ONGTransactionFilters, limitCount: number): Promise<Transaction[]> {
    try {
      const q = query(collection(db, this.transactionsCollection), orderBy('date', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      let results = this.mapTransactionDocs(snapshot.docs);

      if (filters.type) results = results.filter(t => t.type === filters.type);
      if (filters.categoryId) results = results.filter(t => t.category.id === filters.categoryId);
      if (filters.status) results = results.filter(t => t.status === filters.status);
      if (filters.paymentMethod) results = results.filter(t => t.paymentMethod === filters.paymentMethod);
      if (filters.startDate) results = results.filter(t => t.date >= filters.startDate!);
      if (filters.endDate) results = results.filter(t => t.date <= filters.endDate!);
      if (filters.createdBy) results = results.filter(t => t.createdBy === filters.createdBy);
      if (filters.minAmount) results = results.filter(t => t.amount >= filters.minAmount!);
      if (filters.maxAmount) results = results.filter(t => t.amount <= filters.maxAmount!);

      return results.slice(0, limitCount);
    } catch (fallbackError) {
      console.error('Fallback also failed for ONG transactions:', fallbackError);
      return [];
    }
  }

  /**
   * Map Firestore docs to Transaction objects with safe date conversion
   */
  private mapTransactionDocs(docs: any[]): Transaction[] {
    return docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Transaction;
    });
  }

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Create a new ONG financial category
   */
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
      console.error('Error creating ONG category:', error);
      throw new Error('Erro ao criar categoria da ONG');
    }
  }

  /**
   * Get ONG financial categories
   */
  async getCategories(type?: TransactionType): Promise<FinancialCategory[]> {
    try {
      let q = query(collection(db, this.categoriesCollection), where('isActive', '==', true));

      if (type) {
        q = query(q, where('type', '==', type));
      }

      q = query(q, orderBy('name'));

      const snapshot = await getDocs(q);
      const results = this.mapCategoryDocs(snapshot.docs);

      // Auto-initialize default categories if collection is empty
      if (results.length === 0 && !type) {
        await this.initializeDefaultCategories();
        return this.getCategoriesFallback(type);
      }

      return results;
    } catch (error) {
      console.warn('Composite index query failed for ONG categories, falling back to client-side filter:', error);
      const fallbackResults = await this.getCategoriesFallback(type);

      // Auto-initialize default categories if collection is empty
      if (fallbackResults.length === 0 && !type) {
        await this.initializeDefaultCategories();
        return this.getCategoriesFallback(type);
      }

      return fallbackResults;
    }
  }

  /**
   * Fallback: fetch all ONG categories and filter client-side when composite indexes are missing
   */
  private async getCategoriesFallback(type?: TransactionType): Promise<FinancialCategory[]> {
    try {
      const q = query(collection(db, this.categoriesCollection));
      const snapshot = await getDocs(q);
      let results = this.mapCategoryDocs(snapshot.docs);

      results = results.filter(c => c.isActive !== false);
      if (type) results = results.filter(c => c.type === type);
      results.sort((a, b) => a.name.localeCompare(b.name));

      return results;
    } catch (fallbackError) {
      console.error('Fallback also failed for ONG categories:', fallbackError);
      return [];
    }
  }

  /**
   * Map Firestore docs to FinancialCategory objects with safe date conversion
   */
  private mapCategoryDocs(docs: any[]): FinancialCategory[] {
    return docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as FinancialCategory;
    });
  }

  /**
   * Initialize default ONG categories if the collection is empty
   */
  async initializeDefaultCategories(): Promise<void> {
    try {
      const snapshot = await getDocs(query(collection(db, this.categoriesCollection), limit(1)));
      if (!snapshot.empty) return; // Categories already exist

      const allDefaults = [...DEFAULT_ONG_INCOME_CATEGORIES, ...DEFAULT_ONG_EXPENSE_CATEGORIES];
      const now = new Date();

      for (const category of allDefaults) {
        await addDoc(collection(db, this.categoriesCollection), {
          ...category,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });
      }
    } catch (error) {
      console.error('Error initializing default ONG categories:', error);
    }
  }

  // ==================== FINANCIAL SUMMARY AND REPORTS ====================

  /**
   * Get ONG financial summary for a date range
   */
  async getFinancialSummary(startDate: Date, endDate: Date): Promise<ONGFinancialSummary> {
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
      console.error('Error getting ONG financial summary:', error);
      throw new Error('Erro ao gerar resumo financeiro da ONG');
    }
  }

  // ==================== CHART DATA METHODS ====================

  /**
   * Get ONG income vs expense trend data
   */
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
      console.error('Error getting ONG income expense trend:', error);
      return [];
    }
  }

  /**
   * Get ONG category breakdown data for charts
   */
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
      console.error('Error getting ONG category chart data:', error);
      return [];
    }
  }

  /**
   * Get ONG monthly financial comparison
   */
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
      console.error('Error getting ONG monthly comparison:', error);
      return [];
    }
  }

  // ==================== EXPORT METHODS ====================

  /**
   * Export ONG transactions in CSV or JSON format
   */
  async exportTransactions(filters: ONGTransactionFilters, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
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

        return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      }
    } catch (error) {
      console.error('Error exporting ONG transactions:', error);
      throw new Error('Erro ao exportar transações da ONG');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get count of transactions matching filters
   */
  private async getTransactionCount(filters: ONGTransactionFilters): Promise<number> {
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
      console.error('Error counting ONG transactions:', error);

      // Fallback: manual count
      try {
        const simpleQuery = query(collection(db, this.transactionsCollection), limit(1000));
        const snapshot = await getDocs(simpleQuery);

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

  /**
   * Update budget actuals when transactions are approved
   */
  private async updateBudgetActuals(categoryId: string, amount: number, type: TransactionType): Promise<void> {
    try {
      // This would update the current active ONG budget's actual amounts
      console.log(`Updating ONG budget for category ${categoryId}: ${type} ${amount}`);
      // Implementation would depend on budget structure
    } catch (error) {
      console.error('Error updating ONG budget actuals:', error);
    }
  }
}

// Export singleton instance for ONG financial operations
export const ongFinancialService = new ONGFinancialService();
