// Infrastructure Service - Default Financial Categories
// Pre-defined categories for church financial management

import { FinancialCategory, TransactionType } from '../../domain/entities/Financial';

export const DEFAULT_INCOME_CATEGORIES: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Dízimos',
    type: TransactionType.INCOME,
    description: 'Dízimos dos membros',
    color: '#10B981',
    icon: '💰',
    isActive: true
  },
  {
    name: 'Ofertas',
    type: TransactionType.INCOME,
    description: 'Ofertas voluntárias',
    color: '#059669',
    icon: '🎁',
    isActive: true
  },
  {
    name: 'Ofertas Especiais',
    type: TransactionType.INCOME,
    description: 'Campanhas e ofertas especiais',
    color: '#047857',
    icon: '⭐',
    isActive: true
  },
  {
    name: 'Missões',
    type: TransactionType.INCOME,
    description: 'Doações para missões',
    color: '#065F46',
    icon: '🌍',
    isActive: true
  },
  {
    name: 'Construção',
    type: TransactionType.INCOME,
    description: 'Fundo de construção e reforma',
    color: '#6B7280',
    icon: '🏗️',
    isActive: true
  },
  {
    name: 'Eventos',
    type: TransactionType.INCOME,
    description: 'Receitas de eventos e atividades',
    color: '#8B5CF6',
    icon: '🎉',
    isActive: true
  },
  {
    name: 'Doações Diversas',
    type: TransactionType.INCOME,
    description: 'Outras doações e contribuições',
    color: '#06B6D4',
    icon: '💝',
    isActive: true
  },
  {
    name: 'Vendas',
    type: TransactionType.INCOME,
    description: 'Vendas de produtos e materiais',
    color: '#F59E0B',
    icon: '🛍️',
    isActive: true
  },
  {
    name: 'Aluguéis',
    type: TransactionType.INCOME,
    description: 'Receitas de aluguel de espaços',
    color: '#EF4444',
    icon: '🏢',
    isActive: true
  }
];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Salários e Encargos',
    type: TransactionType.EXPENSE,
    description: 'Salários, encargos e benefícios',
    color: '#DC2626',
    icon: '👥',
    isActive: true
  },
  {
    name: 'Contas Básicas',
    type: TransactionType.EXPENSE,
    description: 'Água, luz, telefone, internet',
    color: '#EA580C',
    icon: '⚡',
    isActive: true
  },
  {
    name: 'Aluguel',
    type: TransactionType.EXPENSE,
    description: 'Aluguel de imóveis e espaços',
    color: '#D97706',
    icon: '🏠',
    isActive: true
  },
  {
    name: 'Manutenção',
    type: TransactionType.EXPENSE,
    description: 'Manutenção e reparos',
    color: '#CA8A04',
    icon: '🔧',
    isActive: true
  },
  {
    name: 'Material de Limpeza',
    type: TransactionType.EXPENSE,
    description: 'Produtos de limpeza e higiene',
    color: '#16A34A',
    icon: '🧽',
    isActive: true
  },
  {
    name: 'Material de Escritório',
    type: TransactionType.EXPENSE,
    description: 'Papelaria e materiais administrativos',
    color: '#0EA5E9',
    icon: '📝',
    isActive: true
  },
  {
    name: 'Equipamentos',
    type: TransactionType.EXPENSE,
    description: 'Compra e manutenção de equipamentos',
    color: '#8B5CF6',
    icon: '🎤',
    isActive: true
  },
  {
    name: 'Transporte',
    type: TransactionType.EXPENSE,
    description: 'Combustível e despesas de transporte',
    color: '#EC4899',
    icon: '🚗',
    isActive: true
  },
  {
    name: 'Alimentação',
    type: TransactionType.EXPENSE,
    description: 'Lanches e refeições para eventos',
    color: '#F97316',
    icon: '🍕',
    isActive: true
  },
  {
    name: 'Marketing',
    type: TransactionType.EXPENSE,
    description: 'Publicidade e materiais promocionais',
    color: '#06B6D4',
    icon: '📢',
    isActive: true
  },
  {
    name: 'Missões',
    type: TransactionType.EXPENSE,
    description: 'Gastos com atividades missionárias',
    color: '#8B5A3C',
    icon: '✈️',
    isActive: true
  },
  {
    name: 'Assistência Social',
    type: TransactionType.EXPENSE,
    description: 'Auxílios e ajudas sociais',
    color: '#7C3AED',
    icon: '🤝',
    isActive: true
  },
  {
    name: 'Eventos',
    type: TransactionType.EXPENSE,
    description: 'Custos de eventos e atividades',
    color: '#DB2777',
    icon: '🎊',
    isActive: true
  },
  {
    name: 'Impostos e Taxas',
    type: TransactionType.EXPENSE,
    description: 'Impostos, taxas e contribuições',
    color: '#374151',
    icon: '🏛️',
    isActive: true
  },
  {
    name: 'Seguros',
    type: TransactionType.EXPENSE,
    description: 'Seguros diversos',
    color: '#4B5563',
    icon: '🛡️',
    isActive: true
  },
  {
    name: 'Capacitação',
    type: TransactionType.EXPENSE,
    description: 'Cursos, treinamentos e capacitação',
    color: '#059669',
    icon: '📚',
    isActive: true
  },
  {
    name: 'Despesas Bancárias',
    type: TransactionType.EXPENSE,
    description: 'Tarifas bancárias e financeiras',
    color: '#7F1D1D',
    icon: '🏦',
    isActive: true
  },
  {
    name: 'Outras Despesas',
    type: TransactionType.EXPENSE,
    description: 'Despesas não categorizadas',
    color: '#6B7280',
    icon: '📋',
    isActive: true
  }
];

export class DefaultCategoriesService {
  static async createDefaultCategories(): Promise<void> {
    try {
      const { financialService } = await import('./FinancialService');
      
      console.log('Creating default income categories...');
      for (const category of DEFAULT_INCOME_CATEGORIES) {
        try {
          await financialService.createCategory(category);
        } catch (error) {
          console.warn(`Category ${category.name} may already exist:`, error);
        }
      }
      
      console.log('Creating default expense categories...');
      for (const category of DEFAULT_EXPENSE_CATEGORIES) {
        try {
          await financialService.createCategory(category);
        } catch (error) {
          console.warn(`Category ${category.name} may already exist:`, error);
        }
      }
      
      console.log('Default categories created successfully!');
    } catch (error) {
      console.error('Error creating default categories:', error);
      throw new Error('Erro ao criar categorias padrão');
    }
  }
  
  static getCategoryByName(name: string, type: TransactionType): FinancialCategory | undefined {
    const categories = type === TransactionType.INCOME 
      ? DEFAULT_INCOME_CATEGORIES 
      : DEFAULT_EXPENSE_CATEGORIES;
      
    const found = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    
    if (found) {
      return {
        ...found,
        id: `default_${name.toLowerCase().replace(/\s+/g, '_')}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return undefined;
  }
  
  static getAllDefaultCategories(): FinancialCategory[] {
    return [
      ...DEFAULT_INCOME_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `income_${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `expense_${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    ];
  }
}
