'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CallMetrics } from '@/components/dashboard/DashboardDataProvider';
import { format, subDays } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CallAnalyticsVisualizationProps {
  callMetrics: CallMetrics | null;
  timeRange: string;
}

export function CallAnalyticsVisualization({ callMetrics, timeRange }: CallAnalyticsVisualizationProps) {
  if (!callMetrics) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Call Analytics</CardTitle>
          <CardDescription>Loading call analytics data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Generate mock historical data for charts
  const generateHistoricalData = () => {
    const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
    const labels = Array.from({ length: days }).map((_, i) => 
      format(subDays(new Date(), days - 1 - i), 'MMM d')
    );
    
    // Generate realistic call volume data with a pattern
    const inboundData = Array.from({ length: days }).map((_, i) => {
      // Create a pattern with higher volume on weekdays
      const dayOfWeek = new Date(subDays(new Date(), days - 1 - i)).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 15 : 35;
      return Math.floor(baseValue + Math.random() * 20);
    });
    
    const outboundData = Array.from({ length: days }).map((_, i) => {
      // Create a pattern with higher volume on weekdays
      const dayOfWeek = new Date(subDays(new Date(), days - 1 - i)).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 10 : 25;
      return Math.floor(baseValue + Math.random() * 15);
    });
    
    // Generate service level data with a realistic trend
    const serviceLevelData = Array.from({ length: days }).map((_, i) => {
      // Create a pattern with better service levels on weekends (less calls)
      const dayOfWeek = new Date(subDays(new Date(), days - 1 - i)).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 85 : 75;
      return Math.min(100, Math.floor(baseValue + Math.random() * 15));
    });
    
    // Generate abandoned rate data
    const abandonedRateData = Array.from({ length: days }).map((_, i) => {
      // Create a pattern with lower abandon rates on weekends
      const dayOfWeek = new Date(subDays(new Date(), days - 1 - i)).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 3 : 8;
      return Math.floor(baseValue + Math.random() * 5);
    });
    
    return {
      labels,
      inboundData,
      outboundData,
      serviceLevelData,
      abandonedRateData
    };
  };

  const { labels, inboundData, outboundData, serviceLevelData: serviceLevelValues, abandonedRateData } = generateHistoricalData();

  // Call volume chart data
  const callVolumeData = {
    labels,
    datasets: [
      {
        label: 'Inbound Calls',
        data: inboundData,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Outbound Calls',
        data: outboundData,
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  };

  // Service level chart data
  const serviceLevelData = {
    labels,
    datasets: [
      {
        label: 'Service Level (%)',
        data: serviceLevelValues,
        fill: false,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.1,
      },
      {
        label: 'Abandoned Rate (%)',
        data: abandonedRateData,
        fill: false,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1,
      },
    ],
  };

  // Call distribution chart data
  const callDistributionData = {
    labels: ['Inbound', 'Outbound', 'Missed', 'Abandoned'],
    datasets: [
      {
        data: [
          callMetrics.inboundCalls,
          callMetrics.outboundCalls,
          callMetrics.missedCalls,
          callMetrics.abandonedCalls,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(99, 102, 241, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(99, 102, 241)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Call Volume Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Service Level & Abandoned Rate',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Call Distribution',
      },
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Call Analytics</CardTitle>
        <CardDescription>
          Detailed analysis of call metrics and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="volume">Call Volume</TabsTrigger>
            <TabsTrigger value="service">Service Level</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="volume" className="h-80">
            <Bar data={callVolumeData} options={barOptions} />
          </TabsContent>
          
          <TabsContent value="service" className="h-80">
            <Line data={serviceLevelData} options={lineOptions} />
          </TabsContent>
          
          <TabsContent value="distribution" className="h-80">
            <div className="flex justify-center">
              <div className="w-2/3 h-80">
                <Pie data={callDistributionData} options={pieOptions} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Average Call Duration</p>
            <p className="text-2xl font-bold">{Math.floor(callMetrics.avgCallDuration / 60)}:{(callMetrics.avgCallDuration % 60).toString().padStart(2, '0')}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Service Level</p>
            <p className="text-2xl font-bold">{callMetrics.serviceLevel}%</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Abandoned Rate</p>
            <p className="text-2xl font-bold">
              {callMetrics.totalCalls > 0 
                ? Math.round((callMetrics.abandonedCalls / callMetrics.totalCalls) * 100) 
                : 0}%
            </p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Calls Today</p>
            <p className="text-2xl font-bold">{callMetrics.totalCalls}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
