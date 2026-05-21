import {
  BaseFinancialService,
  type FinancialSummary,
  type TransactionFilters
} from '../../../shared/application/services/BaseFinancialService';
import { DEFAULT_ONG_EXPENSE_CATEGORIES, DEFAULT_ONG_INCOME_CATEGORIES } from './DefaultONGCategories';

const ONG_FINANCIAL_COLLECTIONS = {
  transactions: 'ong_transactions',
  categories: 'ong_categories',
  budgets: 'ong_budgets'
} as const;

export type ONGFinancialSummary = FinancialSummary;
export type ONGTransactionFilters = TransactionFilters;

export class ONGFinancialService extends BaseFinancialService {
  constructor() {
    super({
      collections: ONG_FINANCIAL_COLLECTIONS,
      errorContext: ' da ONG',
      logContext: 'ONG financial',
      fallbackOnQueryError: true,
      exportTitle: 'RELATORIO FINANCEIRO - ONG',
      exportSheetName: 'Transacoes ONG'
    });
  }

  async initializeDefaultCategories(): Promise<void> {
    try {
      await this.seedCategories([
        ...DEFAULT_ONG_INCOME_CATEGORIES,
        ...DEFAULT_ONG_EXPENSE_CATEGORIES
      ]);
    } catch (error) {
      console.error('Error initializing default ONG categories:', error);
    }
  }
}

export const ongFinancialService = new ONGFinancialService();
