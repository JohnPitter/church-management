import { render, screen } from '@testing-library/react';
import { MonthlyComparisonChart } from '../MonthlyComparisonChart';

jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Mar/26'),
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: 'CategoryScale',
  LinearScale: 'LinearScale',
  BarElement: 'BarElement',
  Title: 'Title',
  Tooltip: 'Tooltip',
  Legend: 'Legend',
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="monthly-comparison-bar">
      <span>{options.plugins.title.text}</span>
      <span>{data.labels.join(',')}</span>
      <span>{data.datasets.map((d: any) => d.label).join(',')}</span>
    </div>
  ),
}));

describe('MonthlyComparisonChart', () => {
  it('renderiza estado vazio quando nao ha dados', () => {
    render(<MonthlyComparisonChart data={[]} className="chart-box" />);

    expect(screen.getByText('Comparação Mensal')).toBeInTheDocument();
    expect(screen.getByText(/Dados insuficientes/i)).toBeInTheDocument();
  });

  it('renderiza grafico e medias resumidas', () => {
    render(
      <MonthlyComparisonChart
        data={[
          { month: new Date('2026-03-01'), income: 1000, expense: 500, netIncome: 500 },
          { month: new Date('2026-04-01'), income: 3000, expense: 1500, netIncome: 1500 },
        ]}
      />
    );

    expect(screen.getByTestId('monthly-comparison-bar')).toHaveTextContent('Comparação Mensal - Receitas, Despesas e Saldo');
    expect(screen.getByText('Média Receitas')).toBeInTheDocument();
    expect(screen.getByText('Média Despesas')).toBeInTheDocument();
    expect(screen.getByText('Média Saldo')).toBeInTheDocument();
  });
});
