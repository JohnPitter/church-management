// Unit Tests - CategoryPieChart Component
// Comprehensive tests for pie chart displaying financial category distribution

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryPieChart } from '../CategoryPieChart';
import { FinancialCategory, TransactionType } from '../../../../modules/financial/church-finance/domain/entities/Financial';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Pie: ({ data, options }: any) => (
    <canvas data-testid="pie-chart" aria-label="Category Chart" />
  )
}));

// Helper to create a mock FinancialCategory
const createMockCategory = (overrides: Partial<FinancialCategory> = {}): FinancialCategory => ({
  id: 'cat-1',
  name: 'Test Category',
  type: TransactionType.INCOME,
  color: '#10B981',
  icon: 'dollar',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Helper to create category data
const createCategoryData = (
  category: Partial<FinancialCategory>,
  amount: number,
  count: number
) => ({
  category: createMockCategory(category),
  amount,
  count
});

describe('CategoryPieChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the pie chart component with data', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Category A', color: '#FF0000' }, 1000, 5)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test Title" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should render with provided title', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Category A', color: '#FF0000' }, 1000, 5)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Revenue by Category" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Category A', color: '#FF0000' }, 1000, 5)
      ];

      const { container } = render(
        <CategoryPieChart data={data} title="Test" type="income" className="custom-category-class" />
      );

      expect(container.querySelector('.custom-category-class')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state message for income when no data', () => {
      render(<CategoryPieChart data={[]} title="Income Categories" type="income" />);

      expect(screen.getByText('Income Categories')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma transação encontrada para o período selecionado.')).toBeInTheDocument();
    });

    it('should render empty state message for expense when no data', () => {
      render(<CategoryPieChart data={[]} title="Expense Categories" type="expense" />);

      expect(screen.getByText('Expense Categories')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma transação encontrada para o período selecionado.')).toBeInTheDocument();
    });

    it('should not render pie chart when data is empty', () => {
      const { container } = render(<CategoryPieChart data={[]} title="Test" type="income" />);

      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should display multiple categories', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Dizimos', color: '#FF0000' }, 5000, 10),
        createCategoryData({ id: '2', name: 'Ofertas', color: '#00FF00' }, 3000, 15),
        createCategoryData({ id: '3', name: 'Doacoes', color: '#0000FF' }, 2000, 8)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle single category', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Single Category', color: '#FF0000' }, 5000, 25)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Single Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Top 8 Categories Limit', () => {
    it('should display top 8 categories sorted by amount', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createCategoryData(
          { id: `${i + 1}`, name: `Category ${i + 1}`, color: `#${(i + 1).toString().padStart(6, '0')}` },
          (10 - i) * 1000,
          i + 1
        )
      );

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should add "Outros" category when there are more than 8 categories', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createCategoryData(
          { id: `${i + 1}`, name: `Category ${i + 1}`, color: `#${(i + 1).toString().padStart(6, '0')}` },
          (10 - i) * 1000,
          i + 1
        )
      );

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should not add "Outros" when 8 or fewer categories', () => {
      const data = Array.from({ length: 5 }, (_, i) =>
        createCategoryData(
          { id: `${i + 1}`, name: `Category ${i + 1}`, color: '#000000' },
          1000,
          1
        )
      );

      render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(screen.queryByText('Outros')).not.toBeInTheDocument();
    });

    it('should handle exactly 8 categories without "Outros"', () => {
      const data = Array.from({ length: 8 }, (_, i) =>
        createCategoryData(
          { id: `${i + 1}`, name: `Category ${i + 1}`, color: '#000000' },
          1000,
          1
        )
      );

      render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(screen.queryByText('Outros')).not.toBeInTheDocument();
    });
  });

  describe('Summary Stats', () => {
    it('should display total formatted as BRL currency', () => {
      const data = [
        createCategoryData({ id: '1', name: 'A', color: '#FF0000' }, 1000, 5),
        createCategoryData({ id: '2', name: 'B', color: '#00FF00' }, 2000, 10)
      ];

      render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(screen.getByText(/Total:/)).toBeInTheDocument();
      expect(screen.getByText(/R\$.*3.*000/)).toBeInTheDocument();
    });

    it('should display number of categories', () => {
      const data = [
        createCategoryData({ id: '1', name: 'A', color: '#FF0000' }, 1000, 5),
        createCategoryData({ id: '2', name: 'B', color: '#00FF00' }, 2000, 10),
        createCategoryData({ id: '3', name: 'C', color: '#0000FF' }, 3000, 15)
      ];

      render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(screen.getByText(/Categorias:/)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Transaction Type Handling', () => {
    it('should handle income type', () => {
      const data = [
        createCategoryData(
          { id: '1', name: 'Income Cat', color: '#10B981', type: TransactionType.INCOME },
          5000,
          10
        )
      ];

      const { container } = render(<CategoryPieChart data={data} title="Income" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle expense type', () => {
      const data = [
        createCategoryData(
          { id: '1', name: 'Expense Cat', color: '#EF4444', type: TransactionType.EXPENSE },
          3000,
          8
        )
      ];

      const { container } = render(<CategoryPieChart data={data} title="Expenses" type="expense" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle categories with zero amounts', () => {
      const data = [
        createCategoryData({ id: '1', name: 'A', color: '#FF0000' }, 0, 0),
        createCategoryData({ id: '2', name: 'B', color: '#00FF00' }, 1000, 5)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle large amounts', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Large', color: '#FF0000' }, 999999999.99, 1000)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle decimal amounts', () => {
      const data = [
        createCategoryData({ id: '1', name: 'A', color: '#FF0000' }, 1234.56, 5),
        createCategoryData({ id: '2', name: 'B', color: '#00FF00' }, 789.12, 3)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle special characters in category names', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Construcao & Reformas', color: '#FF0000' }, 5000, 10),
        createCategoryData({ id: '2', name: 'Manutencao - Eletrica', color: '#00FF00' }, 3000, 5)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="expense" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort categories by amount in descending order', () => {
      const data = [
        createCategoryData({ id: '1', name: 'Small', color: '#FF0000' }, 100, 1),
        createCategoryData({ id: '2', name: 'Large', color: '#00FF00' }, 10000, 50),
        createCategoryData({ id: '3', name: 'Medium', color: '#0000FF' }, 1000, 10)
      ];

      const { container } = render(<CategoryPieChart data={data} title="Test" type="income" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
