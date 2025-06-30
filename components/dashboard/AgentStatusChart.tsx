"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div style={{height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading chart...</div> });

interface AgentStatus {
  status: string;
  count: number;
}

interface AgentStatusChartProps {
  data: AgentStatus[];
  isDarkMode: boolean;
}

export function AgentStatusChart({ data, isDarkMode }: AgentStatusChartProps) {
  const [mounted, setMounted] = useState(false);

  // Only render chart on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
      case "active":
        return "#10B981"; // green
      case "busy":
      case "on call":
        return "#F59E0B"; // amber
      case "away":
      case "break":
        return "#6B7280"; // gray
      case "offline":
        return "#94A3B8"; // slate
      default:
        return "#6B7280"; // default gray
    }
  };

  // Prepare data for ApexCharts
  const chartOptions: any = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      foreColor: isDarkMode ? '#CBD5E1' : '#475569',
      toolbar: {
        show: false
      }
    },
    labels: data.map(item => item.status),
    colors: data.map(item => getStatusColor(item.status)),
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: isDarkMode ? '#CBD5E1' : '#475569'
      },
      itemMargin: {
        horizontal: 12,
        vertical: 5
      },
      fontSize: '14px',
      markers: {
        width: 12,
        height: 12,
        radius: 12
      }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 500,
              color: isDarkMode ? '#CBD5E1' : '#475569'
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 600,
              color: isDarkMode ? '#F8FAFC' : '#1E293B'
            },
            total: {
              show: true,
              label: 'Total Agents',
              fontSize: '14px',
              fontWeight: 500,
              color: isDarkMode ? '#CBD5E1' : '#475569',
              formatter: function(w: any) {
                return data.reduce((total, item) => total + item.count, 0).toString();
              }
            }
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: isDarkMode ? ['#1E293B'] : ['#F8FAFC']
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    tooltip: {
      enabled: true,
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: function(value: number) {
          return value.toString();
        },
        title: {
          formatter: function(seriesName: string) {
            return seriesName + ":";
          }
        }
      }
    }
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ zIndex: 20, position: 'relative', opacity: 1, visibility: 'visible' }}>
      <CardHeader>
        <CardTitle>Agent Status</CardTitle>
      </CardHeader>
      <CardContent style={{ zIndex: 20, position: 'relative', opacity: 1, visibility: 'visible' }}>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No agent data available
          </div>
        ) : (
          <div style={{ zIndex: 999, position: 'relative', opacity: 1, visibility: 'visible', minHeight: '450px', display: 'block' }}>
            {typeof window !== 'undefined' && (
              <Chart
                options={chartOptions}
                series={data.map(item => item.count)}
                type="donut"
                height={450}
                width="100%"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
