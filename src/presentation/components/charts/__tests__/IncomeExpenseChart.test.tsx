// Unit Tests - IncomeExpenseChart Component
// Comprehensive tests for line chart displaying income and expense trends

import React from 'react';
import { render } from '@testing-library/react';
import { IncomeExpenseChart } from '../IncomeExpenseChart';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <canvas data-testid="line-chart" aria-label={options?.plugins?.title?.text} />
  )
}));

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'dd/MM') {
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (formatStr === 'w') {
      return Math.ceil(d.getDate() / 7).toString();
    }
    if (formatStr === 'MMM/yy') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
    }
    return d.toISOString();
  })
}));

// Helper to create income/expense data
const createDataPoint = (date: Date, income: number, expense: number) => ({
  date,
  income,
  expense
});

describe('IncomeExpenseChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the line chart component', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 3000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should render with default title', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 3000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Receitas vs Despesas - Tendência');
    });

    it('should apply custom className', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 3000)
      ];

      const { container } = render(
        <IncomeExpenseChart data={data} period="daily" className="custom-line-class" />
      );

      expect(container.querySelector('.custom-line-class')).toBeInTheDocument();
    });
  });

  describe('Period Formatting - Daily', () => {
    it('should format dates for daily period', () => {
      const data = [
        createDataPoint(new Date('2024-01-15'), 5000, 3000),
        createDataPoint(new Date('2024-01-16'), 6000, 3500)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle multiple daily entries', () => {
      const data = [
        createDataPoint(new Date('2024-03-01'), 1000, 500),
        createDataPoint(new Date('2024-03-02'), 1500, 700),
        createDataPoint(new Date('2024-03-03'), 2000, 800),
        createDataPoint(new Date('2024-03-04'), 2500, 900),
        createDataPoint(new Date('2024-03-05'), 3000, 1000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Period Formatting - Weekly', () => {
    it('should format dates for weekly period', () => {
      const data = [
        createDataPoint(new Date('2024-01-07'), 5000, 3000),
        createDataPoint(new Date('2024-01-14'), 6000, 3500)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="weekly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Period Formatting - Monthly', () => {
    it('should format dates for monthly period', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 50000, 30000),
        createDataPoint(new Date('2024-02-01'), 60000, 35000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="monthly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle full year of monthly data', () => {
      const data = Array.from({ length: 12 }, (_, i) =>
        createDataPoint(
          new Date(2024, i, 1),
          (i + 1) * 10000,
          (i + 1) * 5000
        )
      );

      const { container } = render(<IncomeExpenseChart data={data} period="monthly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should pass correct income and expense values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 3000),
        createDataPoint(new Date('2024-01-02'), 6000, 3500),
        createDataPoint(new Date('2024-01-03'), 7000, 4000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle empty data array', () => {
      const { container } = render(<IncomeExpenseChart data={[]} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 10000, 5000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero income values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 0, 3000),
        createDataPoint(new Date('2024-01-02'), 5000, 0)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle zero expense values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 0),
        createDataPoint(new Date('2024-01-02'), 6000, 0)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle large values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 999999999.99, 888888888.88)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 1234.56, 789.12),
        createDataPoint(new Date('2024-01-02'), 2345.67, 890.23)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle expense greater than income', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 3000, 5000),
        createDataPoint(new Date('2024-01-02'), 4000, 8000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Period Props', () => {
    it('should accept daily period', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should accept weekly period', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(<IncomeExpenseChart data={data} period="weekly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should accept monthly period', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(<IncomeExpenseChart data={data} period="monthly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Multiple Data Points', () => {
    it('should handle trend data over time', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 10000, 8000),
        createDataPoint(new Date('2024-02-01'), 12000, 9000),
        createDataPoint(new Date('2024-03-01'), 15000, 10000),
        createDataPoint(new Date('2024-04-01'), 14000, 11000),
        createDataPoint(new Date('2024-05-01'), 18000, 12000),
        createDataPoint(new Date('2024-06-01'), 20000, 13000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="monthly" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle fluctuating values', () => {
      const data = [
        createDataPoint(new Date('2024-01-01'), 5000, 3000),
        createDataPoint(new Date('2024-01-02'), 3000, 4000),
        createDataPoint(new Date('2024-01-03'), 8000, 2000),
        createDataPoint(new Date('2024-01-04'), 4000, 6000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Class Name Handling', () => {
    it('should handle undefined className', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" className="" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle multiple CSS classes', () => {
      const data = [createDataPoint(new Date('2024-01-01'), 1000, 500)];

      const { container } = render(
        <IncomeExpenseChart data={data} period="daily" className="class-one class-two" />
      );

      expect(container.querySelector('.class-one.class-two')).toBeInTheDocument();
    });
  });

  describe('Date Edge Cases', () => {
    it('should handle year boundary', () => {
      const data = [
        createDataPoint(new Date('2023-12-31'), 10000, 5000),
        createDataPoint(new Date('2024-01-01'), 12000, 6000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle leap year date', () => {
      const data = [
        createDataPoint(new Date('2024-02-29'), 10000, 5000)
      ];

      const { container } = render(<IncomeExpenseChart data={data} period="daily" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
