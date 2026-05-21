import { render, screen } from '@testing-library/react';
import { AssistanceTimelineChart } from '../AssistanceTimelineChart';

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: 'CategoryScale',
  LinearScale: 'LinearScale',
  PointElement: 'PointElement',
  LineElement: 'LineElement',
  Title: 'Title',
  Tooltip: 'Tooltip',
  Legend: 'Legend',
  Filler: 'Filler',
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="assistance-timeline-chart">
      <span>{options.plugins.title.text}</span>
      <span>{data.labels.join(',')}</span>
      <span>{data.datasets[0].data.join(',')}</span>
      <span>{data.datasets[1].data.join(',')}</span>
    </div>
  ),
}));

describe('AssistanceTimelineChart', () => {
  it('registra modulos do chart e renderiza dados', () => {
    render(
      <AssistanceTimelineChart
        title="Linha do Tempo"
        className="chart-wrapper"
        data={[
          { label: 'Jan', agendamentos: 3, atendidos: 2 },
          { label: 'Fev', agendamentos: 5, atendidos: 4 },
        ]}
      />
    );

    expect(screen.getByTestId('assistance-timeline-chart')).toHaveTextContent('Linha do Tempo');
    expect(screen.getByTestId('assistance-timeline-chart')).toHaveTextContent('Jan,Fev');
    expect(screen.getByTestId('assistance-timeline-chart')).toHaveTextContent('3,5');
    expect(screen.getByTestId('assistance-timeline-chart')).toHaveTextContent('2,4');
  });
});
