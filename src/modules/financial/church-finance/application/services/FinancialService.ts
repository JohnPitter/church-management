import {
  BaseFinancialService,
  type DonationSummary,
  type FinancialSummary,
  type PaginatedResult,
  type TransactionFilters
} from '../../../shared/application/services/BaseFinancialService';

const LEGACY_FINANCIAL_COLLECTIONS = {
  transactions: 'transactions',
  categories: 'financialCategories',
  budgets: 'budgets',
  donations: 'donations'
} as const;

export type {
  DonationSummary,
  FinancialSummary,
  PaginatedResult,
  TransactionFilters
};

export class FinancialService extends BaseFinancialService {
  constructor() {
    super({
      collections: LEGACY_FINANCIAL_COLLECTIONS,
      logContext: 'financial'
    });
  }
}

export const financialService = new FinancialService();
