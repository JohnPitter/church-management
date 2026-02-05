// Unit Tests - DonationDonutChart Component
// Comprehensive tests for donut chart displaying donation distribution by type

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DonationDonutChart } from '../DonationDonutChart';
import { DonationType } from '../../../../modules/financial/church-finance/domain/entities/Financial';

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
  Doughnut: ({ data, options }: any) => (
    <canvas data-testid="donut-chart" aria-label="Donation Chart" />
  )
}));

// Helper to create donation type data
const createDonationData = (
  type: DonationType,
  amount: number,
  count: number,
  label: string
) => ({
  type,
  amount,
  count,
  label
});

describe('DonationDonutChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the donut chart component with data', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should render the title', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText('Distribuição de Doações')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      const { container } = render(
        <DonationDonutChart data={data} className="custom-donut-class" />
      );

      expect(container.querySelector('.custom-donut-class')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state message when no data', () => {
      render(<DonationDonutChart data={[]} />);

      expect(screen.getByText('Distribuição de Doações')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma doação registrada para o período selecionado.')).toBeInTheDocument();
    });

    it('should not render donut chart when data is empty', () => {
      const { container } = render(<DonationDonutChart data={[]} />);

      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('Donation Type Handling', () => {
    it('should handle TITHE donation type', () => {
      const data = [createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle OFFERING donation type', () => {
      const data = [createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta')];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle all donation types simultaneously', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta'),
        createDonationData(DonationType.SPECIAL_OFFERING, 2000, 5, 'Oferta Especial'),
        createDonationData(DonationType.MISSION, 1500, 8, 'Missoes'),
        createDonationData(DonationType.BUILDING_FUND, 10000, 15, 'Construcao'),
        createDonationData(DonationType.CHARITY, 2500, 12, 'Caridade'),
        createDonationData(DonationType.OTHER, 500, 3, 'Outros')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
      expect(screen.getByText(/Tipos ativos:/)).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display labels correctly', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText(/Dizimo/)).toBeInTheDocument();
      expect(screen.getByText(/Oferta/)).toBeInTheDocument();
    });

    it('should display total amount in center', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText(/R\$.*8.*000/)).toBeInTheDocument();
    });

    it('should display total donation count', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText('30 doações')).toBeInTheDocument();
    });
  });

  describe('Detailed Breakdown', () => {
    it('should display breakdown list with all donations', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getAllByText(/Dizimo/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Oferta/).length).toBeGreaterThanOrEqual(1);
    });

    it('should display formatted amounts in breakdown', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
    });

    it('should display donation counts in breakdown', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getAllByText('10 doações').length).toBeGreaterThan(0);
    });
  });

  describe('Summary Stats', () => {
    it('should display average donation amount', () => {
      const data = [
        createDonationData(DonationType.TITHE, 1000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 500, 5, 'Oferta')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText(/Média por doação:/)).toBeInTheDocument();
    });

    it('should display number of active donation types', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 3000, 20, 'Oferta'),
        createDonationData(DonationType.MISSION, 1000, 5, 'Missoes')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText(/Tipos ativos:/)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Single Donation Type', () => {
    it('should render correctly with single donation type', () => {
      const data = [
        createDonationData(DonationType.TITHE, 10000, 50, 'Dizimo')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle donations with zero count', () => {
      const data = [
        createDonationData(DonationType.TITHE, 0, 0, 'Dizimo')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle large amounts', () => {
      const data = [
        createDonationData(DonationType.BUILDING_FUND, 9999999.99, 1000, 'Construcao')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle decimal amounts', () => {
      const data = [
        createDonationData(DonationType.TITHE, 1234.56, 5, 'Dizimo'),
        createDonationData(DonationType.OFFERING, 789.12, 3, 'Oferta')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const data = [
        createDonationData(DonationType.OTHER, 1000, 5, 'Doacao - Especial & Extra')
      ];

      render(<DonationDonutChart data={data} />);

      expect(screen.getByText(/Doacao - Especial & Extra/)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle undefined className', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      const { container } = render(<DonationDonutChart data={data} />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      const data = [
        createDonationData(DonationType.TITHE, 5000, 10, 'Dizimo')
      ];

      const { container } = render(<DonationDonutChart data={data} className="" />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});
