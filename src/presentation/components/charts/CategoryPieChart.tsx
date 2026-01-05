// Financial Chart Component - Category Distribution Pie Chart
// Displays pie chart showing expense/income distribution by categories

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FinancialCategory } from '../../../modules/financial/church-finance/domain/entities/Financial';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
  category: FinancialCategory;
  amount: number;
  count: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title: string;
  type: 'income' | 'expense';
  className?: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  title,
  type,
  className = ''
}) => {
  // Sort data by amount and take top 8 categories
  const sortedData = data
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Calculate total for "Others" category
  const displayedTotal = sortedData.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = data.reduce((sum, item) => sum + item.amount, 0);
  const othersAmount = grandTotal - displayedTotal;

  const chartData = {
    labels: [
      ...sortedData.map(item => item.category.name),
      ...(othersAmount > 0 ? ['Outros'] : [])
    ],
    datasets: [
      {
        data: [
          ...sortedData.map(item => item.amount),
          ...(othersAmount > 0 ? [othersAmount] : [])
        ],
        backgroundColor: [
          ...sortedData.map(item => item.category.color),
          ...(othersAmount > 0 ? ['#9CA3AF'] : [])
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
        hoverBorderWidth: 3,
      }
    ]
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: 500
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels?.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number;
                const total = (data.datasets[0].data as number[]).reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const backgroundColor = data.datasets[0].backgroundColor as string[];
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: backgroundColor[i],
                  strokeStyle: '#ffffff',
                  lineWidth: 2,
                  pointStyle: 'circle' as const,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: true,
        text: title,
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
            }).format(context.parsed);
            
            const total = (context.dataset.data as number[]).reduce((sum, val) => sum + val, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            
            return `${context.label}: ${value} (${percentage}%)`;
          },
          afterLabel: function(context) {
            // Find the corresponding category data for transaction count
            const labelIndex = context.dataIndex;
            if (labelIndex < sortedData.length) {
              const categoryData = sortedData[labelIndex];
              return `${categoryData.count} transações`;
            }
            return '';
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    }
  };

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-80">
          <div className="text-4xl mb-4">
            {type === 'income' ? '💰' : '💸'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 text-center">
            Nenhuma transação encontrada para o período selecionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div style={{ height: '400px' }}>
        <Pie data={chartData} options={options} />
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(grandTotal)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Categorias:</span>
            <span className="ml-2 font-medium">{data.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};