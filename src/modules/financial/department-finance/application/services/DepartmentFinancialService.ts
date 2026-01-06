// Infrastructure Service - Department Financial Service
// Service for managing department financial boxes (independent from general church finances)

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
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Department,
  DepartmentTransaction,
  DepartmentTransactionType,
  DepartmentTransactionStatus,
  DepartmentTransfer,
  DepartmentMonthlyBalance,
  DepartmentSummary,
  DepartmentEntity
} from 'domain/entities/Department';
import { startOfMonth, endOfMonth, format as formatDate } from 'date-fns';

export interface DepartmentFilters {
  isActive?: boolean;
  responsibleUserId?: string;
}

export interface DepartmentTransactionFilters {
  departmentId?: string;
  type?: DepartmentTransactionType;
  status?: DepartmentTransactionStatus;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}

/**
 * DepartmentFinancialService
 *
 * Manages department financial boxes that are INDEPENDENT from general church finances.
 * Each department has its own balance that does NOT sum into the monthly general cash flow.
 *
 * Collections used:
 * - church_departments: Department definitions
 * - church_department_transactions: Individual department transactions
 * - church_department_transfers: Transfers between departments
 */
export class DepartmentFinancialService {
  private departmentsCollection = 'church_departments';
  private transactionsCollection = 'church_department_transactions';
  private transfersCollection = 'church_department_transfers';

  // ==================== DEPARTMENT MANAGEMENT ====================

  /**
   * Create a new department
   */
  async createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const errors = DepartmentEntity.validateDepartment(department);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const now = new Date();
      const docRef = await addDoc(collection(db, this.departmentsCollection), {
        ...department,
        currentBalance: department.currentBalance || 0,
        initialBalance: department.initialBalance || 0,
        isActive: department.isActive !== undefined ? department.isActive : true,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating department:', error);
      throw new Error('Erro ao criar departamento');
    }
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    try {
      const docRef = doc(db, this.departmentsCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw new Error('Erro ao atualizar departamento');
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string): Promise<void> {
    try {
      // Check if department has transactions
      const transactionsQuery = query(
        collection(db, this.transactionsCollection),
        where('departmentId', '==', id),
        limit(1)
      );
      const transactionsSnap = await getDocs(transactionsQuery);

      if (!transactionsSnap.empty) {
        throw new Error('Não é possível excluir departamento com transações. Desative-o ao invés de excluir.');
      }

      await deleteDoc(doc(db, this.departmentsCollection, id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartment(id: string): Promise<Department | null> {
    try {
      const docRef = doc(db, this.departmentsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Department;
    } catch (error) {
      console.error('Error getting department:', error);
      throw new Error('Erro ao buscar departamento');
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(filters: DepartmentFilters = {}): Promise<Department[]> {
    try {
      let q = query(collection(db, this.departmentsCollection));

      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      if (filters.responsibleUserId) {
        q = query(q, where('responsibleUserId', '==', filters.responsibleUserId));
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
        } as Department;
      });
    } catch (error) {
      console.error('Error getting departments:', error);
      throw new Error('Erro ao buscar departamentos');
    }
  }

  // ==================== TRANSACTION MANAGEMENT ====================

  /**
   * Create department transaction (deposit or withdrawal)
   */
  async createTransaction(transaction: Omit<DepartmentTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const errors = DepartmentEntity.validateTransaction(transaction);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      // Get department
      const department = await this.getDepartment(transaction.departmentId);
      if (!department) {
        throw new Error('Departamento não encontrado');
      }

      if (!department.isActive) {
        throw new Error('Departamento inativo');
      }

      // Check balance for withdrawals
      if (transaction.type === DepartmentTransactionType.WITHDRAWAL) {
        if (!DepartmentEntity.hasSufficientBalance(department.currentBalance, transaction.amount)) {
          throw new Error(`Saldo insuficiente. Saldo atual: ${DepartmentEntity.formatCurrency(department.currentBalance)}`);
        }
      }

      const now = new Date();
      const reference = transaction.reference || DepartmentEntity.generateReferenceNumber('DEPT');

      // Use transaction to ensure atomicity
      const transactionId = await runTransaction(db, async (firestoreTransaction) => {
        // Create transaction record
        const transactionRef = doc(collection(db, this.transactionsCollection));
        firestoreTransaction.set(transactionRef, {
          ...transaction,
          reference,
          date: Timestamp.fromDate(transaction.date),
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });

        // Update department balance if approved
        if (transaction.status === DepartmentTransactionStatus.APPROVED) {
          const departmentRef = doc(db, this.departmentsCollection, transaction.departmentId);
          const newBalance = transaction.type === DepartmentTransactionType.DEPOSIT
            ? department.currentBalance + transaction.amount
            : department.currentBalance - transaction.amount;

          firestoreTransaction.update(departmentRef, {
            currentBalance: newBalance,
            updatedAt: Timestamp.fromDate(now)
          });
        }

        return transactionRef.id;
      });

      return transactionId;
    } catch (error) {
      console.error('Error creating department transaction:', error);
      throw error;
    }
  }

  /**
   * Approve/reject transaction
   */
  async updateTransactionStatus(
    id: string,
    status: DepartmentTransactionStatus,
    approvedBy: string
  ): Promise<void> {
    try {
      const transactionDoc = await getDoc(doc(db, this.transactionsCollection, id));
      if (!transactionDoc.exists()) {
        throw new Error('Transação não encontrada');
      }

      const transactionData = transactionDoc.data() as DepartmentTransaction;

      if (transactionData.status !== DepartmentTransactionStatus.PENDING) {
        throw new Error('Somente transações pendentes podem ser aprovadas/rejeitadas');
      }

      const department = await this.getDepartment(transactionData.departmentId);
      if (!department) {
        throw new Error('Departamento não encontrado');
      }

      await runTransaction(db, async (firestoreTransaction) => {
        const transactionRef = doc(db, this.transactionsCollection, id);
        const departmentRef = doc(db, this.departmentsCollection, transactionData.departmentId);

        // Update transaction status
        firestoreTransaction.update(transactionRef, {
          status,
          approvedBy: status === DepartmentTransactionStatus.APPROVED ? approvedBy : null,
          approvedAt: status === DepartmentTransactionStatus.APPROVED ? Timestamp.fromDate(new Date()) : null,
          updatedAt: Timestamp.fromDate(new Date())
        });

        // Update department balance if approved
        if (status === DepartmentTransactionStatus.APPROVED) {
          let newBalance = department.currentBalance;

          if (transactionData.type === DepartmentTransactionType.DEPOSIT ||
              transactionData.type === DepartmentTransactionType.TRANSFER_IN) {
            newBalance += transactionData.amount;
          } else if (transactionData.type === DepartmentTransactionType.WITHDRAWAL ||
                     transactionData.type === DepartmentTransactionType.TRANSFER_OUT) {
            newBalance -= transactionData.amount;
          }

          // Check balance for withdrawals
          if (newBalance < 0) {
            throw new Error('Saldo insuficiente');
          }

          firestoreTransaction.update(departmentRef, {
            currentBalance: newBalance,
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Get department transactions
   */
  async getTransactions(filters: DepartmentTransactionFilters = {}, limitCount = 100): Promise<DepartmentTransaction[]> {
    try {
      let q = query(collection(db, this.transactionsCollection));

      if (filters.departmentId) {
        q = query(q, where('departmentId', '==', filters.departmentId));
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
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

      q = query(q, orderBy('date', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          approvedAt: data.approvedAt ? data.approvedAt.toDate() : undefined
        } as DepartmentTransaction;
      });
    } catch (error) {
      console.error('Error getting department transactions:', error);
      throw new Error('Erro ao buscar transações do departamento');
    }
  }

  // ==================== TRANSFER MANAGEMENT ====================

  /**
   * Create transfer between departments
   */
  async createTransfer(transfer: Omit<DepartmentTransfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const errors = DepartmentEntity.validateTransfer(transfer);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      // Get both departments
      const [fromDept, toDept] = await Promise.all([
        this.getDepartment(transfer.fromDepartmentId),
        this.getDepartment(transfer.toDepartmentId)
      ]);

      if (!fromDept) {
        throw new Error('Departamento de origem não encontrado');
      }

      if (!toDept) {
        throw new Error('Departamento de destino não encontrado');
      }

      if (!fromDept.isActive) {
        throw new Error('Departamento de origem está inativo');
      }

      if (!toDept.isActive) {
        throw new Error('Departamento de destino está inativo');
      }

      // Check balance
      if (!DepartmentEntity.hasSufficientBalance(fromDept.currentBalance, transfer.amount)) {
        throw new Error(`Saldo insuficiente no departamento de origem. Saldo: ${DepartmentEntity.formatCurrency(fromDept.currentBalance)}`);
      }

      const now = new Date();
      const reference = transfer.reference || DepartmentEntity.generateReferenceNumber('TRANSF');

      const transferId = await runTransaction(db, async (firestoreTransaction) => {
        // Create transfer record
        const transferRef = doc(collection(db, this.transfersCollection));
        firestoreTransaction.set(transferRef, {
          ...transfer,
          reference,
          date: Timestamp.fromDate(transfer.date),
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });

        // Create transactions for both departments
        const outTransactionRef = doc(collection(db, this.transactionsCollection));
        firestoreTransaction.set(outTransactionRef, {
          departmentId: transfer.fromDepartmentId,
          departmentName: transfer.fromDepartmentName,
          type: DepartmentTransactionType.TRANSFER_OUT,
          amount: transfer.amount,
          description: `Transferência para ${transfer.toDepartmentName}: ${transfer.description}`,
          notes: transfer.notes,
          reference,
          date: Timestamp.fromDate(transfer.date),
          status: transfer.status,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          createdBy: transfer.createdBy
        });

        const inTransactionRef = doc(collection(db, this.transactionsCollection));
        firestoreTransaction.set(inTransactionRef, {
          departmentId: transfer.toDepartmentId,
          departmentName: transfer.toDepartmentName,
          type: DepartmentTransactionType.TRANSFER_IN,
          amount: transfer.amount,
          description: `Transferência de ${transfer.fromDepartmentName}: ${transfer.description}`,
          notes: transfer.notes,
          reference,
          date: Timestamp.fromDate(transfer.date),
          status: transfer.status,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          createdBy: transfer.createdBy
        });

        // Update balances if approved
        if (transfer.status === DepartmentTransactionStatus.APPROVED) {
          const fromDeptRef = doc(db, this.departmentsCollection, transfer.fromDepartmentId);
          const toDeptRef = doc(db, this.departmentsCollection, transfer.toDepartmentId);

          firestoreTransaction.update(fromDeptRef, {
            currentBalance: fromDept.currentBalance - transfer.amount,
            updatedAt: Timestamp.fromDate(now)
          });

          firestoreTransaction.update(toDeptRef, {
            currentBalance: toDept.currentBalance + transfer.amount,
            updatedAt: Timestamp.fromDate(now)
          });
        }

        return transferRef.id;
      });

      return transferId;
    } catch (error) {
      console.error('Error creating department transfer:', error);
      throw error;
    }
  }

  // ==================== REPORTS AND SUMMARIES ====================

  /**
   * Get department monthly balance
   */
  async getMonthlyBalance(departmentId: string, year: number, month: number): Promise<DepartmentMonthlyBalance> {
    try {
      const department = await this.getDepartment(departmentId);
      if (!department) {
        throw new Error('Departamento não encontrado');
      }

      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      const transactions = await this.getTransactions({
        departmentId,
        status: DepartmentTransactionStatus.APPROVED,
        startDate,
        endDate
      }, 1000);

      const totalDeposits = transactions
        .filter(t => t.type === DepartmentTransactionType.DEPOSIT)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalWithdrawals = transactions
        .filter(t => t.type === DepartmentTransactionType.WITHDRAWAL)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTransfersIn = transactions
        .filter(t => t.type === DepartmentTransactionType.TRANSFER_IN)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTransfersOut = transactions
        .filter(t => t.type === DepartmentTransactionType.TRANSFER_OUT)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate initial balance for the month
      const previousTransactions = await this.getTransactions({
        departmentId,
        status: DepartmentTransactionStatus.APPROVED,
        endDate: new Date(startDate.getTime() - 1)
      }, 10000);

      const initialBalance = department.initialBalance || 0;
      const previousDeposits = previousTransactions
        .filter(t => t.type === DepartmentTransactionType.DEPOSIT || t.type === DepartmentTransactionType.TRANSFER_IN)
        .reduce((sum, t) => sum + t.amount, 0);
      const previousWithdrawals = previousTransactions
        .filter(t => t.type === DepartmentTransactionType.WITHDRAWAL || t.type === DepartmentTransactionType.TRANSFER_OUT)
        .reduce((sum, t) => sum + t.amount, 0);

      const monthInitialBalance = initialBalance + previousDeposits - previousWithdrawals;

      const finalBalance = DepartmentEntity.calculateBalance(
        monthInitialBalance,
        totalDeposits,
        totalWithdrawals,
        totalTransfersIn,
        totalTransfersOut
      );

      return {
        departmentId,
        departmentName: department.name,
        year,
        month,
        initialBalance: monthInitialBalance,
        totalDeposits,
        totalWithdrawals,
        totalTransfersIn,
        totalTransfersOut,
        finalBalance,
        transactionCount: transactions.length,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting monthly balance:', error);
      throw new Error('Erro ao gerar saldo mensal');
    }
  }

  /**
   * Get summary of all departments
   */
  async getDepartmentSummary(): Promise<DepartmentSummary> {
    try {
      const departments = await this.getDepartments();

      const totalDepartments = departments.length;
      const activeDepartments = departments.filter(d => d.isActive).length;
      const totalBalance = departments.reduce((sum, d) => sum + d.currentBalance, 0);

      // Try to get total deposits and withdrawals for all departments
      // If index is not ready yet, return summary without transaction totals
      let totalDeposits = 0;
      let totalWithdrawals = 0;

      try {
        const allTransactions = await Promise.all(
          departments.map(dept => this.getTransactions({
            departmentId: dept.id,
            status: DepartmentTransactionStatus.APPROVED
          }, 10000))
        );

        const flatTransactions = allTransactions.flat();

        totalDeposits = flatTransactions
          .filter(t => t.type === DepartmentTransactionType.DEPOSIT)
          .reduce((sum, t) => sum + t.amount, 0);

        totalWithdrawals = flatTransactions
          .filter(t => t.type === DepartmentTransactionType.WITHDRAWAL)
          .reduce((sum, t) => sum + t.amount, 0);
      } catch (transactionError) {
        console.warn('Could not load transaction totals (index may be building):', transactionError);
        // Return summary without transaction totals
      }

      return {
        totalDepartments,
        activeDepartments,
        totalBalance,
        totalDeposits,
        totalWithdrawals,
        departments: departments.map(d => ({
          id: d.id,
          name: d.name,
          balance: d.currentBalance,
          color: d.color
        }))
      };
    } catch (error) {
      console.error('Error getting department summary:', error);
      throw new Error('Erro ao gerar resumo dos departamentos');
    }
  }
}

// Export singleton instance
export const departmentFinancialService = new DepartmentFinancialService();
