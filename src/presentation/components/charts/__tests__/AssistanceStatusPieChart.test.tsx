// Unit Tests - AssistanceStatusPieChart Component
// Comprehensive tests for pie chart displaying appointment status distribution

import React from 'react';
import { render } from '@testing-library/react';
import { AssistanceStatusPieChart } from '../AssistanceStatusPieChart';

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
    <canvas data-testid="pie-chart" aria-label={options?.plugins?.title?.text} />
  )
}));

describe('AssistanceStatusPieChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the pie chart component', () => {
      const data = {
        'agendado': 10,
        'confirmado': 5
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should render with default title', () => {
      const data = {
        'agendado': 5
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Status dos Agendamentos');
    });

    it('should render with custom title', () => {
      const data = {
        'agendado': 5
      };

      const { container } = render(<AssistanceStatusPieChart data={data} title="Custom Status Title" />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Custom Status Title');
    });

    it('should apply custom className', () => {
      const data = {
        'agendado': 5
      };

      const { container } = render(
        <AssistanceStatusPieChart data={data} className="custom-pie-class" />
      );

      expect(container.firstChild).toHaveClass('custom-pie-class');
    });
  });

  describe('Status Handling', () => {
    it('should handle multiple status types', () => {
      const data = {
        'agendado': 10,
        'confirmado': 8,
        'concluido': 15
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle multi-word status labels', () => {
      const data = {
        'em andamento': 10
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle all predefined status types', () => {
      const data = {
        'agendado': 10,
        'confirmado': 5,
        'em andamento': 3,
        'concluido': 8,
        'cancelado': 2,
        'faltou': 1
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle unknown status types', () => {
      const data = {
        'status_desconhecido': 5,
        'outro_status': 3
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle single status', () => {
      const data = {
        'agendado': 42
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle empty data object', () => {
      const data = {};

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle data with zero values', () => {
      const data = {
        'agendado': 0,
        'confirmado': 5,
        'cancelado': 0
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const data = {
        'agendado': 999999,
        'confirmado': 1000000
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Props Combinations', () => {
    it('should handle all props together', () => {
      const data = {
        'agendado': 10,
        'confirmado': 5
      };

      const { container } = render(
        <AssistanceStatusPieChart
          data={data}
          title="Combined Props Title"
          className="combined-pie-class"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-label', 'Combined Props Title');
      expect(container.firstChild).toHaveClass('combined-pie-class');
    });

    it('should handle empty className', () => {
      const data = { 'agendado': 1 };

      const { container } = render(
        <AssistanceStatusPieChart data={data} className="" />
      );

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle status with only spaces', () => {
      const data = {
        ' ': 5
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle numeric status keys', () => {
      const data = {
        '1': 10,
        '2': 20
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle very long status names', () => {
      const data = {
        'status_muito_longo_que_poderia_causar_problemas_de_layout': 10
      };

      const { container } = render(<AssistanceStatusPieChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
