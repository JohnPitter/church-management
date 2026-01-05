// Assistance Chart Component - Pie Chart for Status Distribution
// Displays pie chart showing appointments distribution by status

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface AssistanceStatusPieChartProps {
  data: Record<string, number>;
  title?: string;
  className?: string;
}

const statusColors: Record<string, { bg: string; border: string }> = {
  'agendado': { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
  'confirmado': { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
  'em andamento': { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
  'concluido': { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
  'cancelado': { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' },
  'faltou': { bg: 'rgba(107, 114, 128, 0.8)', border: 'rgba(107, 114, 128, 1)' },
};

export const AssistanceStatusPieChart: React.FC<AssistanceStatusPieChartProps> = ({
  data,
  title = 'Status dos Agendamentos',
  className = ''
}) => {
  const labels = Object.keys(data).map(key =>
    key.charAt(0).toUpperCase() + key.slice(1)
  );
  const values = Object.values(data);

  const backgroundColors = Object.keys(data).map(key =>
    statusColors[key]?.bg || 'rgba(156, 163, 175, 0.8)'
  );
  const borderColors = Object.keys(data).map(key =>
    statusColors[key]?.border || 'rgba(156, 163, 175, 1)'
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Agendamentos',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
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
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className={className}>
      <Pie data={chartData} options={options} />
    </div>
  );
};
