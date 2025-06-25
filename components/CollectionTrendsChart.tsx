'use client';

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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
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

// Chart options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#94a3b8', // slate-400
        font: {
          family: 'Inter, sans-serif',
        },
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
      intersect: false,
      mode: 'index' as const,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#94a3b8', // slate-400
      },
    },
    y: {
      grid: {
        color: '#1e293b', // slate-800
        drawBorder: false,
      },
      ticks: {
        color: '#94a3b8', // slate-400
        callback: function(value: any) {
          return value + '%';
        },
      },
      suggestedMin: 0,
      suggestedMax: 100,
    },
  },
  elements: {
    line: {
      tension: 0.3,
    },
    point: {
      radius: 2,
      hoverRadius: 5,
    },
  },
};

// Sample data for the chart
const generateSampleData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Get the last 6 months
  const labels = Array(6).fill(0).map((_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    return months[monthIndex];
  });
  
  // Generate realistic collection rate data (trending upward)
  const collectionRateData = [
    45 + Math.random() * 10,
    48 + Math.random() * 10,
    52 + Math.random() * 10,
    55 + Math.random() * 10,
    58 + Math.random() * 10,
    62 + Math.random() * 10,
  ].map(val => parseFloat(val.toFixed(1)));
  
  // Target rate (constant)
  const targetRateData = Array(6).fill(75);
  
  return {
    labels,
    datasets: [
      {
        label: 'Collection Rate',
        data: collectionRateData,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'Target Rate',
        data: targetRateData,
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.0)',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };
};

interface CollectionTrendsChartProps {
  height?: number;
}

const CollectionTrendsChart: React.FC<CollectionTrendsChartProps> = ({ height = 300 }) => {
  const data = generateSampleData();
  
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default CollectionTrendsChart;
