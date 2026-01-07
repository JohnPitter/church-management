// Department Finance Domain - Re-export from church-management module
// This ensures type consistency across the application

export type {
  Department,
  DepartmentTransaction,
  DepartmentMonthlyBalance,
  DepartmentTransfer,
  DepartmentSummary
} from '@modules/church-management/departments/domain/entities/Department';

export {
  DepartmentTransactionType,
  DepartmentTransactionStatus,
  DepartmentEntity
} from '@modules/church-management/departments/domain/entities/Department';
