export * from './../modules/financial/church-finance/domain/entities/Financial';
export { DefaultCategoriesService, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './application/services/DefaultFinancialCategories';
export { AdminFinancialPage } from './presentation/pages/AdminFinancialPage';

// Financial service exports (renamed to avoid collisions with ChurchFinancialService)
export {
  FinancialService,
  financialService,
  type TransactionFilters as FinancialTransactionFilters,
  type FinancialSummary as FinancialServiceSummary,
  type DonationSummary as FinancialServiceDonationSummary
} from './application/services/FinancialService';

// Church-wide financial service exports with explicit aliases
export {
  ChurchFinancialService,
  churchFinancialService,
  type TransactionFilters as ChurchTransactionFilters,
  type FinancialSummary as ChurchFinancialSummary,
  type DonationSummary as ChurchDonationSummary
} from './application/services/ChurchFinancialService';

