'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Chart options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#94a3b8', // slate-400
        font: {
          family: 'Inter, sans-serif',
        },
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: '#1e293b', // slate-800
      titleColor: '#f8fafc', // slate-50
      bodyColor: '#f8fafc', // slate-50
      borderColor: '#334155', // slate-700
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          return `${label}: ${value}%`;
        }
      }
    },
  },
};

// Sample data for the chart
const generateSampleData = () => {
  return {
    labels: ['Property Tax', 'Utilities', 'Traffic Fines', 'Business Licenses', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgb(59, 130, 246)',  // blue-500
          'rgb(16, 185, 129)',  // green-500
          'rgb(245, 158, 11)',  // amber-500
          'rgb(139, 92, 246)',  // purple-500
          'rgb(236, 72, 153)',  // pink-500
        ],
        borderColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

interface DebtTypePieChartProps {
  height?: number;
}

const DebtTypePieChart: React.FC<DebtTypePieChartProps> = ({ height = 300 }) => {
  const data = generateSampleData();
  
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Pie options={options} data={data} />
    </div>
  );
};

export default DebtTypePieChart;
