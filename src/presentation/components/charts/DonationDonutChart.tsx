// Financial Chart Component - Donation Distribution Donut Chart
// Displays donut chart showing donation distribution by type (tithe, offering, etc.)

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DonationType } from '../../../modules/financial/church-finance/domain/entities/Financial';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonationTypeData {
  type: DonationType;
  amount: number;
  count: number;
  label: string;
}

interface DonationDonutChartProps {
  data: DonationTypeData[];
  className?: string;
}

export const DonationDonutChart: React.FC<DonationDonutChartProps> = ({
  data,
  className = ''
}) => {
  const donationColors = {
    [DonationType.TITHE]: '#10B981',
    [DonationType.OFFERING]: '#8B5CF6',
    [DonationType.SPECIAL_OFFERING]: '#F59E0B',
    [DonationType.MISSION]: '#3B82F6',
    [DonationType.BUILDING_FUND]: '#EF4444',
    [DonationType.CHARITY]: '#06B6D4',
    [DonationType.OTHER]: '#9CA3AF'
  };

  const donationIcons = {
    [DonationType.TITHE]: '🙏',
    [DonationType.OFFERING]: '💝',
    [DonationType.SPECIAL_OFFERING]: '✨',
    [DonationType.MISSION]: '🌍',
    [DonationType.BUILDING_FUND]: '🏗️',
    [DonationType.CHARITY]: '🤝',
    [DonationType.OTHER]: '📦'
  };

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => donationColors[item.type]),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 12,
        hoverBorderWidth: 4,
        cutout: '60%',
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels?.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number;
                const percentage = ((value / totalAmount) * 100).toFixed(1);
                const backgroundColor = data.datasets[0].backgroundColor as string[];
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: backgroundColor[i],
                  strokeStyle: '#ffffff',
                  lineWidth: 3,
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
            
            const percentage = ((context.parsed / totalAmount) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
          afterLabel: function(context) {
            const donationData = data[context.dataIndex];
            return `${donationData.count} doações`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
    }
  };

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-80">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Distribuição de Doações</h3>
          <p className="text-sm text-gray-500 text-center">
            Nenhuma doação registrada para o período selecionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Distribuição de Doações
        </h3>
      </div>
      
      <div className="relative" style={{ height: '300px' }}>
        <Doughnut data={chartData} options={options} />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(totalAmount)}
          </div>
          <div className="text-sm text-gray-500">
            {totalCount} doações
          </div>
        </div>
      </div>
      
      {/* Detailed breakdown */}
      <div className="mt-6 space-y-2">
        {data.map((item, index) => (
          <div key={item.type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: donationColors[item.type] }}
              ></div>
              <span className="text-sm font-medium text-gray-900">
                {donationIcons[item.type]} {item.label}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.amount)}
              </div>
              <div className="text-xs text-gray-500">
                {item.count} doações
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Média por doação:</span>
            <span className="ml-2 font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalAmount / totalCount)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tipos ativos:</span>
            <span className="ml-2 font-medium">{data.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};