// Assistance Chart Component - Line Chart for Appointments Timeline
// Displays line chart showing appointments trend over time

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimelineData {
  label: string;
  agendamentos: number;
  atendidos: number;
}

interface AssistanceTimelineChartProps {
  data: TimelineData[];
  title?: string;
  className?: string;
}

export const AssistanceTimelineChart: React.FC<AssistanceTimelineChartProps> = ({
  data,
  title = 'Evolução dos Atendimentos',
  className = ''
}) => {
  const labels = data.map(d => d.label);
  const agendamentos = data.map(d => d.agendamentos);
  const atendidos = data.map(d => d.atendidos);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Agendados',
        data: agendamentos,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Concluídos',
        data: atendidos,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className={className}>
      <Line data={chartData} options={options} />
    </div>
  );
};
