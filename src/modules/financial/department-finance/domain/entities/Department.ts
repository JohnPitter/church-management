// Department Entity and related types

export interface Department {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  responsibleId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum DepartmentTransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out'
}

export enum DepartmentTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface DepartmentTransaction {
  id: string;
  departmentId: string;
  type: DepartmentTransactionType;
  status: DepartmentTransactionStatus;
  amount: number;
  description: string;
  category?: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentTransfer {
  id: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  amount: number;
  description: string;
  status: DepartmentTransactionStatus;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface DepartmentMonthlyBalance {
  departmentId: string;
  year: number;
  month: number;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

export interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  pendingTransactions: number;
}

export class DepartmentEntity implements Department {
  constructor(
    public id: string,
    public name: string,
    public description: string = '',
    public budget: number = 0,
    public responsibleId: string = '',
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Department {
    return {
      ...data,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
