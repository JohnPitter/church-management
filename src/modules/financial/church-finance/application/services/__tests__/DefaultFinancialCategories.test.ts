import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DefaultCategoriesService,
} from '../DefaultFinancialCategories';
import { TransactionType } from '../../../domain/entities/Financial';

const mockCreateCategory = jest.fn();

jest.mock('../FinancialService', () => ({
  financialService: {
    createCategory: (...args: any[]) => mockCreateCategory(...args),
  },
}));

describe('DefaultFinancialCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('expoe categorias padrao de receita e despesa', () => {
    expect(DEFAULT_INCOME_CATEGORIES.length).toBeGreaterThan(5);
    expect(DEFAULT_EXPENSE_CATEGORIES.length).toBeGreaterThan(5);
    expect(DEFAULT_INCOME_CATEGORIES.every(cat => cat.type === TransactionType.INCOME)).toBe(true);
    expect(DEFAULT_EXPENSE_CATEGORIES.every(cat => cat.type === TransactionType.EXPENSE)).toBe(true);
  });

  it('cria categorias padrao e tolera duplicadas', async () => {
    mockCreateCategory.mockRejectedValueOnce(new Error('dup')).mockResolvedValue(undefined);

    await DefaultCategoriesService.createDefaultCategories();

    expect(mockCreateCategory.mock.calls.length).toBe(
      DEFAULT_INCOME_CATEGORIES.length + DEFAULT_EXPENSE_CATEGORIES.length
    );
    expect(console.warn).toHaveBeenCalled();
  });

  it('busca categoria por nome e lista todas com ids sinteticos', () => {
    const income = DefaultCategoriesService.getCategoryByName('dízimos', TransactionType.INCOME);
    const all = DefaultCategoriesService.getAllDefaultCategories();

    expect(income?.id).toContain('default_');
    expect(income?.name).toBe('Dízimos');
    expect(all.length).toBe(DEFAULT_INCOME_CATEGORIES.length + DEFAULT_EXPENSE_CATEGORIES.length);
  });

  it('propaga erro ao falhar na criacao em lote', async () => {
    jest.resetModules();
    jest.doMock('../FinancialService', () => {
      throw new Error('import failed');
    });

    const { DefaultCategoriesService: FreshService } = await import('../DefaultFinancialCategories');
    await expect(FreshService.createDefaultCategories()).rejects.toThrow('Erro ao criar categorias padrão');
  });
});
