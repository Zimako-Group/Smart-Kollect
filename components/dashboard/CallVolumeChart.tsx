"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div style={{height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading chart...</div> });

interface CallVolumeData {
  date: string;
  inbound: number;
  outbound: number;
}

interface CallVolumeChartProps {
  data: CallVolumeData[];
  isDarkMode: boolean;
}

export function CallVolumeChart({ data, isDarkMode }: CallVolumeChartProps) {
  const [mounted, setMounted] = useState(false);

  // Only render chart on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare data for ApexCharts
  const chartSeries = [
    { name: 'Inbound Calls', data: data.map(item => item.inbound) },
    { name: 'Outbound Calls', data: data.map(item => item.outbound) }
  ];

  const chartOptions: any = {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      foreColor: isDarkMode ? '#CBD5E1' : '#475569'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#3B82F6', '#10B981'], // blue for inbound, green for outbound
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: data.map(item => item.date),
      labels: {
        style: {
          colors: isDarkMode ? '#CBD5E1' : '#475569',
          fontFamily: 'inherit'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? '#CBD5E1' : '#475569',
          fontFamily: 'inherit'
        },
        formatter: function(val: number) {
          return val.toFixed(0);
        }
      }
    },
    grid: {
      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5,
      labels: {
        colors: isDarkMode ? '#CBD5E1' : '#475569'
      }
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      x: {
        format: 'dd MMM yyyy'
      }
    },
    responsive: [{
      breakpoint: 576,
      options: {
        legend: {
          position: 'bottom',
          offsetX: 0,
          offsetY: 0
        }
      }
    }]
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Volume Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ zIndex: 20, position: 'relative', opacity: 1, visibility: 'visible' }}>
      <CardHeader>
        <CardTitle>Call Volume Trends</CardTitle>
      </CardHeader>
      <CardContent style={{ zIndex: 20, position: 'relative', opacity: 1, visibility: 'visible' }}>
        {data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No call volume data available
          </div>
        ) : (
          <div style={{ zIndex: 999, position: 'relative', opacity: 1, visibility: 'visible', minHeight: '450px', display: 'block' }}>
            {typeof window !== 'undefined' && (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="area"
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
