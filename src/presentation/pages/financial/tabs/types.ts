import type { Dispatch, SetStateAction } from 'react';
import type {
  Transaction,
  FinancialCategory,
  TransactionType,
  TransactionStatus,
} from '@modules/financial/church-finance/domain/entities/Financial';
import type {
  FinancialSummary,
  TransactionFilters,
} from '@modules/financial/church-finance/application/services/FinancialService';
import type { Department } from '@modules/church-management/departments/domain/entities/Department';

export interface FinancialTabProps {
  // Overview só renderiza com summary truthy; tipado como full para evitar null checks nas abas
  summary: FinancialSummary | null | any;
  transactions: Transaction[];
  categories: FinancialCategory[];
  filters: TransactionFilters;
  setFilters: Dispatch<SetStateAction<TransactionFilters>>;
  setSelectedTab: (tab: string) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
  setShowCreateModal: (open: boolean) => void;
  setShowDonationModal: (open: boolean) => void;
  setShowCategoryModal: (open: boolean) => void;
  setEditingCategory: (c: FinancialCategory | null) => void;
  setEditingTransaction: (t: Transaction | null) => void;
  openCategoryMenuId: string | null;
  setOpenCategoryMenuId: (id: string | null) => void;
  handleDeleteTransaction: (t: Transaction) => void | Promise<void>;
  handleDeleteCategory: (c: FinancialCategory) => void | Promise<void>;
  handleEditCategory: (c: FinancialCategory) => void;
  handleEditTransaction: (t: Transaction) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  totalTransactions: number;
  totalPages: number;
  loadingTransactions: boolean;
  loadTransactionsPage: (page?: number) => void | Promise<void>;
  departments: Department[];
  departmentSummary: any;
  setShowCreateDepartmentModal: (open: boolean) => void;
  setShowDepartmentTransactionModal: (open: boolean) => void;
  setShowDepartmentReportModal: (open: boolean) => void;
  setShowDepartmentHistoryModal: (open: boolean) => void;
  setSelectedDepartment: (d: Department | null) => void;
  setEditingDepartment: (d: Department | null) => void;
  selectedDepartment: Department | null;
  editingDepartment: Department | null;
  handleOpenTransactionModal: (d: Department) => void;
  handleOpenReportModal: (d: Department) => void;
  handleOpenHistoryModal: (d: Department) => void;
  handleEditDepartment: (d: Department) => void;
  handleToggleActiveDepartment: (d: Department) => void | Promise<void>;
  chartData: {
    incomeExpenseTrend: { date: Date; income: number; expense: number }[];
    incomeCategories: { category: FinancialCategory; amount: number; count: number }[];
    expenseCategories: { category: FinancialCategory; amount: number; count: number }[];
    monthlyComparison: { month: Date; income: number; expense: number; netIncome: number }[];
    donationData: { type: any; amount: number; count: number; label: string }[];
    memberFidelity: {
      contributingMembers: number;
      totalActiveMembers: number;
      percentage: number;
    };
    trendPeriod: 'daily' | 'weekly' | 'monthly';
  };
  selectedPeriod: string;
  getPeriodDates: (period: string) => { startDate: Date; endDate: Date };
  handleExportData: (format: 'xlsx' | 'json') => void | Promise<void>;
  formatDate: (...args: any[]) => string;
  // settings vem do SettingsContext — tipagem frouxa para não acoplar à shape completa
  settings: any;
  loading: boolean;
  getTypeIcon: (type: TransactionType) => string;
  getTypeColor: (type: TransactionType) => string;
  getStatusColor: (status: TransactionStatus) => string;
  getStatusText: (status: TransactionStatus) => string;
}
