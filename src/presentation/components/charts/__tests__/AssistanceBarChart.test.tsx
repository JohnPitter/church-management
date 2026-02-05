// Unit Tests - AssistanceBarChart Component
// Comprehensive tests for bar chart displaying appointments by type

import React from 'react';
import { render } from '@testing-library/react';
import { AssistanceBarChart } from '../AssistanceBarChart';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <canvas data-testid="bar-chart" aria-label={options?.plugins?.title?.text} />
  )
}));

describe('AssistanceBarChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the bar chart component', () => {
      const data = {
        'Consulta Médica': 10,
        'Atendimento Social': 5
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should render with default title', () => {
      const data = {
        'Consulta': 5
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Atendimentos por Tipo');
    });

    it('should render with custom title', () => {
      const data = {
        'Consulta': 5
      };

      const { container } = render(<AssistanceBarChart data={data} title="Custom Chart Title" />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Custom Chart Title');
    });

    it('should apply custom className', () => {
      const data = {
        'Consulta': 5
      };

      const { container } = render(
        <AssistanceBarChart data={data} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Data Handling', () => {
    it('should handle multiple appointment types', () => {
      const data = {
        'Consulta Médica': 10,
        'Atendimento Psicológico': 8,
        'Assistência Social': 15
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const data = {
        'Single Type': 42
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle empty data object', () => {
      const data = {};

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle data with zero values', () => {
      const data = {
        'Type A': 0,
        'Type B': 5,
        'Type C': 0
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const data = {
        'Large Value': 999999,
        'Another Large': 1000000
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      const data = {
        'Decimal A': 10.5,
        'Decimal B': 20.75
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Multiple Data Types', () => {
    it('should handle six different appointment types', () => {
      const data = {
        'Type 1': 10,
        'Type 2': 20,
        'Type 3': 30,
        'Type 4': 40,
        'Type 5': 50,
        'Type 6': 60
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle more than six types', () => {
      const data = {
        'Type 1': 10,
        'Type 2': 20,
        'Type 3': 30,
        'Type 4': 40,
        'Type 5': 50,
        'Type 6': 60,
        'Type 7': 70,
        'Type 8': 80
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Props Combinations', () => {
    it('should handle all props together', () => {
      const data = {
        'Consulta': 10,
        'Visita': 5
      };

      const { container } = render(
        <AssistanceBarChart
          data={data}
          title="All Props Title"
          className="combined-class"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'All Props Title');
      expect(container.firstChild).toHaveClass('combined-class');
    });

    it('should handle empty className', () => {
      const data = { 'Test': 1 };

      const { container } = render(
        <AssistanceBarChart data={data} className="" />
      );

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle undefined optional props', () => {
      const data = { 'Test': 1 };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Portuguese Language Support', () => {
    it('should handle Portuguese appointment type names', () => {
      const data = {
        'Atendimento Médico': 15,
        'Consulta Psicológica': 8,
        'Assistência Jurídica': 12,
        'Visita Domiciliar': 6
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const data = {
        'Açúcar & Café': 5,
        'Médico - João': 10
      };

      const { container } = render(<AssistanceBarChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
