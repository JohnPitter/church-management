// Domain Entity - Department
// Represents church departments with independent financial boxes

export interface Department {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;

  // Financial tracking
  currentBalance: number;
  initialBalance?: number;

  // Responsible person
  responsibleUserId?: string;
  responsibleName?: string;

  // Status
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DepartmentTransaction {
  id: string;
  departmentId: string;
  departmentName: string;

  // Transaction details
  type: DepartmentTransactionType;
  amount: number;
  description: string;
  notes?: string;

  // Reference
  reference?: string;
  receiptNumber?: string;

  // Date
  date: Date;

  // Status
  status: DepartmentTransactionStatus;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export enum DepartmentTransactionType {
  DEPOSIT = 'deposit',           // Entrada de dinheiro no departamento
  WITHDRAWAL = 'withdrawal',     // Saída de dinheiro do departamento
  TRANSFER_IN = 'transfer_in',   // Transferência recebida de outro departamento
  TRANSFER_OUT = 'transfer_out'  // Transferência enviada para outro departamento
}

export enum DepartmentTransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface DepartmentMonthlyBalance {
  departmentId: string;
  departmentName: string;
  year: number;
  month: number;

  // Balances
  initialBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  finalBalance: number;

  // Transaction count
  transactionCount: number;

  // Metadata
  generatedAt: Date;
}

export interface DepartmentTransfer {
  id: string;

  // Source department
  fromDepartmentId: string;
  fromDepartmentName: string;

  // Destination department
  toDepartmentId: string;
  toDepartmentName: string;

  // Transfer details
  amount: number;
  description: string;
  notes?: string;
  reference?: string;

  // Date
  date: Date;

  // Status
  status: DepartmentTransactionStatus;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface DepartmentSummary {
  totalDepartments: number;
  activeDepartments: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  departments: {
    id: string;
    name: string;
    balance: number;
    color?: string;
  }[];
}

/**
 * DepartmentEntity
 * Business logic and validation for departments
 */
export class DepartmentEntity {
  /**
   * Validate department data
   */
  static validateDepartment(department: Partial<Department>): string[] {
    const errors: string[] = [];

    if (!department.name || department.name.trim().length === 0) {
      errors.push('Nome do departamento é obrigatório');
    }

    if (department.name && department.name.length > 100) {
      errors.push('Nome do departamento deve ter no máximo 100 caracteres');
    }

    if (department.currentBalance !== undefined && department.currentBalance < 0) {
      errors.push('Saldo atual não pode ser negativo');
    }

    if (department.initialBalance !== undefined && department.initialBalance < 0) {
      errors.push('Saldo inicial não pode ser negativo');
    }

    return errors;
  }

  /**
   * Validate department transaction
   */
  static validateTransaction(transaction: Partial<DepartmentTransaction>): string[] {
    const errors: string[] = [];

    if (!transaction.departmentId) {
      errors.push('Departamento é obrigatório');
    }

    if (!transaction.type) {
      errors.push('Tipo de transação é obrigatório');
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!transaction.description || transaction.description.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }

    if (transaction.description && transaction.description.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    if (!transaction.date) {
      errors.push('Data é obrigatória');
    }

    return errors;
  }

  /**
   * Validate department transfer
   */
  static validateTransfer(transfer: Partial<DepartmentTransfer>): string[] {
    const errors: string[] = [];

    if (!transfer.fromDepartmentId) {
      errors.push('Departamento de origem é obrigatório');
    }

    if (!transfer.toDepartmentId) {
      errors.push('Departamento de destino é obrigatório');
    }

    if (transfer.fromDepartmentId === transfer.toDepartmentId) {
      errors.push('Departamento de origem e destino não podem ser iguais');
    }

    if (!transfer.amount || transfer.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!transfer.description || transfer.description.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }

    if (!transfer.date) {
      errors.push('Data é obrigatória');
    }

    return errors;
  }

  /**
   * Calculate department balance
   */
  static calculateBalance(
    initialBalance: number,
    deposits: number,
    withdrawals: number,
    transfersIn: number,
    transfersOut: number
  ): number {
    return initialBalance + deposits - withdrawals + transfersIn - transfersOut;
  }

  /**
   * Check if department has sufficient balance
   */
  static hasSufficientBalance(currentBalance: number, amount: number): boolean {
    return currentBalance >= amount;
  }

  /**
   * Format currency (Brazilian Real)
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Get transaction type label
   */
  static getTransactionTypeLabel(type: DepartmentTransactionType): string {
    const labels = {
      [DepartmentTransactionType.DEPOSIT]: 'Depósito',
      [DepartmentTransactionType.WITHDRAWAL]: 'Retirada',
      [DepartmentTransactionType.TRANSFER_IN]: 'Transferência Recebida',
      [DepartmentTransactionType.TRANSFER_OUT]: 'Transferência Enviada'
    };
    return labels[type] || type;
  }

  /**
   * Get transaction status label
   */
  static getTransactionStatusLabel(status: DepartmentTransactionStatus): string {
    const labels = {
      [DepartmentTransactionStatus.PENDING]: 'Pendente',
      [DepartmentTransactionStatus.APPROVED]: 'Aprovada',
      [DepartmentTransactionStatus.REJECTED]: 'Rejeitada',
      [DepartmentTransactionStatus.CANCELLED]: 'Cancelada'
    };
    return labels[status] || status;
  }

  /**
   * Generate unique reference number
   */
  static generateReferenceNumber(prefix: string = 'DEPT'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
}
