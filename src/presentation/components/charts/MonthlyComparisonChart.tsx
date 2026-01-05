// Financial Chart Component - Monthly Comparison Bar Chart
// Displays bar chart comparing income, expenses, and net income by month

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyData {
  month: Date;
  income: number;
  expense: number;
  netIncome: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
  className?: string;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  className = ''
}) => {
  const chartData = {
    labels: data.map(item => format(item.month, 'MMM/yy')),
    datasets: [
      {
        label: 'Receitas',
        data: data.map(item => item.income),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Despesas',
        data: data.map(item => item.expense),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Saldo Líquido',
        data: data.map(item => item.netIncome),
        backgroundColor: data.map(item => 
          item.netIncome >= 0 
            ? 'rgba(59, 130, 246, 0.8)' 
            : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: data.map(item => 
          item.netIncome >= 0 
            ? '#3B82F6' 
            : '#F56565'
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      title: {
        display: true,
        text: 'Comparação Mensal - Receitas, Despesas e Saldo',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const value = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          },
          afterBody: function(tooltipItems) {
            const dataIndex = tooltipItems[0].dataIndex;
            const monthData = data[dataIndex];
            
            const percentageChange = dataIndex > 0 
              ? ((monthData.netIncome - data[dataIndex - 1].netIncome) / Math.abs(data[dataIndex - 1].netIncome) * 100)
              : 0;
            
            if (dataIndex > 0) {
              const trend = percentageChange >= 0 ? '↗️' : '↘️';
              return `${trend} ${Math.abs(percentageChange).toFixed(1)}% vs mês anterior`;
            }
            
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Mês',
          font: {
            size: 12,
            weight: 500
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Valor (R$)',
          font: {
            size: 12,
            weight: 500
          }
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(Number(value));
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-80">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Comparação Mensal</h3>
          <p className="text-sm text-gray-500 text-center">
            Dados insuficientes para gerar o gráfico de comparação mensal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">Média Receitas</div>
            <div className="font-medium text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.reduce((sum, item) => sum + item.income, 0) / data.length)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Média Despesas</div>
            <div className="font-medium text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.reduce((sum, item) => sum + item.expense, 0) / data.length)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Média Saldo</div>
            <div className={`font-medium ${
              data.reduce((sum, item) => sum + item.netIncome, 0) / data.length >= 0 
                ? 'text-blue-600' 
                : 'text-red-600'
            }`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.reduce((sum, item) => sum + item.netIncome, 0) / data.length)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};