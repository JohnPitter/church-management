import {
  BaseFinancialService,
  type DonationSummary,
  type FinancialSummary,
  type PaginatedResult,
  type TransactionFilters
} from '../../../shared/application/services/BaseFinancialService';

const CHURCH_FINANCIAL_COLLECTIONS = {
  transactions: 'church_transactions',
  categories: 'church_categories',
  budgets: 'church_budgets',
  donations: 'church_donations'
} as const;

export type {
  DonationSummary,
  FinancialSummary,
  PaginatedResult,
  TransactionFilters
};

export class ChurchFinancialService extends BaseFinancialService {
  constructor() {
    super({
      collections: CHURCH_FINANCIAL_COLLECTIONS,
      logContext: 'church financial',
      includeEmptyTrendSlots: false
    });
  }
}

export const churchFinancialService = new ChurchFinancialService();
export const financialService = churchFinancialService;
