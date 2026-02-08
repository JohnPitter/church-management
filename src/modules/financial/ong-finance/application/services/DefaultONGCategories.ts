// Infrastructure Service - Default ONG Financial Categories
// Pre-defined categories for ONG financial management

import { FinancialCategory, TransactionType } from '../../../church-finance/domain/entities/Financial';

export const DEFAULT_ONG_INCOME_CATEGORIES: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Doações de Pessoas Físicas',
    type: TransactionType.INCOME,
    description: 'Doações recebidas de pessoas físicas',
    color: '#10B981',
    icon: '💝',
    isActive: true
  },
  {
    name: 'Doações de Empresas',
    type: TransactionType.INCOME,
    description: 'Doações e patrocínios de empresas',
    color: '#059669',
    icon: '🏢',
    isActive: true
  },
  {
    name: 'Subvenções Governamentais',
    type: TransactionType.INCOME,
    description: 'Recursos de programas governamentais',
    color: '#047857',
    icon: '🏛️',
    isActive: true
  },
  {
    name: 'Projetos Financiados',
    type: TransactionType.INCOME,
    description: 'Recursos vinculados a projetos específicos',
    color: '#065F46',
    icon: '📋',
    isActive: true
  },
  {
    name: 'Eventos Beneficentes',
    type: TransactionType.INCOME,
    description: 'Receitas de bazares, jantares e eventos',
    color: '#8B5CF6',
    icon: '🎉',
    isActive: true
  },
  {
    name: 'Parcerias Institucionais',
    type: TransactionType.INCOME,
    description: 'Recursos de parcerias com outras organizações',
    color: '#06B6D4',
    icon: '🤝',
    isActive: true
  },
  {
    name: 'Vendas de Produtos',
    type: TransactionType.INCOME,
    description: 'Vendas de produtos e artesanatos',
    color: '#F59E0B',
    icon: '🛍️',
    isActive: true
  },
  {
    name: 'Outras Receitas',
    type: TransactionType.INCOME,
    description: 'Receitas não categorizadas',
    color: '#6B7280',
    icon: '📄',
    isActive: true
  }
];

export const DEFAULT_ONG_EXPENSE_CATEGORIES: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Salários e Encargos',
    type: TransactionType.EXPENSE,
    description: 'Salários, encargos e benefícios dos colaboradores',
    color: '#DC2626',
    icon: '👥',
    isActive: true
  },
  {
    name: 'Aluguel e Infraestrutura',
    type: TransactionType.EXPENSE,
    description: 'Aluguel, condomínio e manutenção do espaço',
    color: '#EA580C',
    icon: '🏠',
    isActive: true
  },
  {
    name: 'Contas Básicas',
    type: TransactionType.EXPENSE,
    description: 'Água, luz, telefone, internet',
    color: '#D97706',
    icon: '⚡',
    isActive: true
  },
  {
    name: 'Projetos Sociais',
    type: TransactionType.EXPENSE,
    description: 'Custos de execução de projetos sociais',
    color: '#7C3AED',
    icon: '🌍',
    isActive: true
  },
  {
    name: 'Assistência Social',
    type: TransactionType.EXPENSE,
    description: 'Cestas básicas, auxílios e ajudas diretas',
    color: '#DB2777',
    icon: '🤲',
    isActive: true
  },
  {
    name: 'Capacitação e Treinamento',
    type: TransactionType.EXPENSE,
    description: 'Cursos, workshops e formação da equipe',
    color: '#059669',
    icon: '📚',
    isActive: true
  },
  {
    name: 'Transporte',
    type: TransactionType.EXPENSE,
    description: 'Combustível, passagens e logística',
    color: '#EC4899',
    icon: '🚗',
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
    name: 'Alimentação',
    type: TransactionType.EXPENSE,
    description: 'Refeições para eventos e atividades',
    color: '#F97316',
    icon: '🍽️',
    isActive: true
  },
  {
    name: 'Equipamentos',
    type: TransactionType.EXPENSE,
    description: 'Compra e manutenção de equipamentos',
    color: '#8B5CF6',
    icon: '💻',
    isActive: true
  },
  {
    name: 'Marketing e Comunicação',
    type: TransactionType.EXPENSE,
    description: 'Divulgação, site e materiais gráficos',
    color: '#06B6D4',
    icon: '📢',
    isActive: true
  },
  {
    name: 'Impostos e Taxas',
    type: TransactionType.EXPENSE,
    description: 'Impostos, taxas e contribuições legais',
    color: '#374151',
    icon: '🏛️',
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
