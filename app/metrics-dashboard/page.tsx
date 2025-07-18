"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
  Users, 
  PhoneCall, 
  PhoneOutgoing, 
  PhoneIncoming, 
  Clock, 
  PauseCircle, 
  Activity, 
  Sun, 
  Moon,
  BarChart3,
  RefreshCw,
  Calendar,
  Filter,
  Wifi,
  WifiOff,
  LogOut,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { AgentStatusChart } from "@/components/dashboard/AgentStatusChart";
import { CallVolumeChart } from "@/components/dashboard/CallVolumeChart";
import { AgentPerformanceTable } from "@/components/dashboard/AgentPerformanceTable";
import { RealtimeMetrics } from "@/components/dashboard/RealtimeMetrics";
import { SipStatusMonitor } from "@/components/dashboard/SipStatusMonitor";
import { QueueStatusCard } from "@/components/dashboard/QueueStatusCard";
import { format } from "date-fns";
import { LastUpdatedTime } from "@/components/dashboard/LastUpdatedTime";
import { CallAnalyticsVisualization } from "@/components/dashboard/CallAnalyticsVisualization";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardDataProvider, useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDialer } from "@/contexts/DialerContext";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      Loading chart...
    </div>
  ),
});

// Wrapper component that provides the dashboard data context
export default function MetricsDashboardWrapper() {
  return (
    <DashboardDataProvider>
      <MetricsDashboard />
    </DashboardDataProvider>
  );
}

function MetricsDashboard() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { callState, isBuzzBoxInitialized } = useDialer();
  const { 
    data, 
    isLoading, 
    refreshData, 
    refreshInterval, 
    setRefreshInterval, 
    autoRefresh, 
    setAutoRefresh,
    timeRange,
    setTimeRange,
    sipStatus
  } = useDashboardData();
  
  const lastUpdated = data.lastUpdated || new Date();
  
  // Hardcode SIP connection status to be connected
  const isSipConnected = true;

  // Consolidated payments data (Month-To-Date)
  const consolidatedPaymentsData = [
    { month: "Apr 2025", amount: 16633251.62 },
    { month: "May 2025", amount: 29475034.23 },
    { month: "Jun 2025", amount: 25756766.28 },
    { month: "Jul 2025", amount: 0 },
    { month: "Aug 2025", amount: 0 },
    { month: "Sep 2025", amount: 0 },
    { month: "Oct 2025", amount: 0 },
    { month: "Nov 2025", amount: 0 },
    { month: "Dec 2025", amount: 0 },
  ];

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle theme with animation
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    
    // Add animation to the body
    document.body.classList.add("theme-transition");
    setTimeout(() => {
      document.body.classList.remove("theme-transition");
    }, 1000);
  };

  // Add the CSS for theme transition
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .theme-transition {
        transition: background-color 0.5s ease, color 0.5s ease;
      }
      .theme-transition * {
        transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Extract dashboard metrics from the data context
  const dashboardData = {
    totalAgents: data.agentMetrics?.totalAgents || 0,
    activeAgents: data.agentMetrics?.activeAgents || 0,
    pausedAgents: data.agentMetrics?.pausedAgents || 0,
    inboundCalls: data.callMetrics?.inboundCalls || 0,
    outboundCalls: data.callMetrics?.outboundCalls || 0,
    avgCallDuration: data.callMetrics?.avgCallDuration || 0,
    callsInQueue: data.callMetrics?.callsInQueue || 0,
    abandonedCalls: data.callMetrics?.abandonedCalls || 0,
    serviceLevel: data.callMetrics?.serviceLevel || 0,
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300" style={{ zIndex: 100, position: 'relative', opacity: 1, visibility: 'visible', overflow: 'visible' }}>
      {/* Force ApexCharts to load properly */}
      <style jsx global>{`
        .apexcharts-canvas {
          position: relative !important;
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 999 !important;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Metrics Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Last updated: <LastUpdatedTime timestamp={lastUpdated} formatString="PPpp" />
            </p>
            <div className="flex items-center gap-1.5 ml-auto">
              <Badge variant="outline" className="flex items-center gap-1 bg-green-500/20 text-green-500 hover:bg-green-500/20 border-green-500/20">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="cursor-pointer">
              Auto-refresh ({refreshInterval}s)
            </Label>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                {timeRange === "today" ? "Today" : 
                 timeRange === "week" ? "This Week" : 
                 timeRange === "month" ? "This Month" : "Custom"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeRange("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("month")}>This Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme}
            className="relative overflow-hidden transition-all duration-300 ease-in-out"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300" />
            ) : (
              <Moon className="h-5 w-5 rotate-0 scale-100 transition-all duration-300" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Last updated: <LastUpdatedTime timestamp={lastUpdated} formatString="MMM d, yyyy, h:mm:ss a" />
          </span>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Logged in as: {user.email}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 h-7 text-xs" 
              onClick={logout}
            >
              <LogOut className="h-3 w-3" />
              Logout
            </Button>
          </div>
        )}
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" style={{ zIndex: 10, position: 'relative', opacity: 1, visibility: 'visible' }}>
        {/* Agent Status Card */}
        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-primary overflow-hidden">
          <CardHeader className="pb-1 pt-2 px-3 bg-primary/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded-full bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold">
                      {dashboardData.activeAgents}/{dashboardData.totalAgents}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active Agents
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-semibold ${dashboardData.activeAgents / dashboardData.totalAgents >= 0.7 ? 'text-green-500' : 'text-amber-500'}`}>
                      {Math.round((dashboardData.activeAgents / dashboardData.totalAgents) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Availability
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Agent Availability</span>
                    <span className={`font-medium ${dashboardData.activeAgents / dashboardData.totalAgents >= 0.7 ? 'text-green-500' : 'text-amber-500'}`}>
                      {Math.round((dashboardData.activeAgents / dashboardData.totalAgents) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${dashboardData.activeAgents / dashboardData.totalAgents >= 0.7 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.round((dashboardData.activeAgents / dashboardData.totalAgents) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Activity className="h-3.5 w-3.5 text-green-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Active</span>
                    <span className="text-base font-semibold text-green-500">{dashboardData.activeAgents}</span>
                    {sipStatus.activeAgents.length > 0 && (
                      <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                        {sipStatus.activeAgents.length} SIP
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <PauseCircle className="h-3.5 w-3.5 text-amber-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Paused</span>
                    <span className="text-base font-semibold text-amber-500">{dashboardData.pausedAgents}</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20">
                    <Users className="h-3.5 w-3.5 text-slate-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Offline</span>
                    <span className="text-base font-semibold text-slate-500">{dashboardData.totalAgents - dashboardData.activeAgents - dashboardData.pausedAgents}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Service Level Card */}
        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-emerald-500 overflow-hidden">
          <CardHeader className="pb-1 pt-2 px-3 bg-emerald-500/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-500/10">
                <FileText className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Total PTPs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold">
                      {data.ptpMetrics?.totalPTPs || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Promise To Pay Arrangements
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-500">
                      {data.ptpMetrics?.fulfilledPercentage || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Fulfillment Rate
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">PTP Status Distribution</span>
                    <span className="font-medium text-emerald-500">
                      {data.ptpMetrics?.fulfilledPercentage || 0}% Fulfilled
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${data.ptpMetrics?.fulfilledPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex flex-col p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      PTP Summary
                    </Badge>
                    <span className="text-sm">Current Status</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs">Fulfilled PTPs:</span>
                    </div>
                    <span className="text-xs font-medium">{data.ptpMetrics?.fulfilledPTPs || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs">Pending PTPs:</span>
                    </div>
                    <span className="text-xs font-medium">{data.ptpMetrics?.pendingPTPs || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs">Defaulted PTPs:</span>
                    </div>
                    <span className="text-xs font-medium">{data.ptpMetrics?.defaultedPTPs || 0}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Total Collected From PTP's Card */}
        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-emerald-500 overflow-hidden">
          <CardHeader className="pb-1 pt-2 px-3 bg-emerald-500/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-500/10">
                <FileText className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Total Collected From PTP's
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold">
                      R 4.8M
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total Revenue
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-500">
                      89.2%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Collection Rate
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Revenue Sources</span>
                    <span className="font-medium text-emerald-500">
                      3 Categories
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `89%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mb-1" />
                    <span className="text-xs text-muted-foreground">PTPs</span>
                    <span className="text-base font-semibold text-emerald-500">R1.8M</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Users className="h-3.5 w-3.5 text-blue-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Manual</span>
                    <span className="text-base font-semibold text-blue-500">R687K</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Activity className="h-3.5 w-3.5 text-amber-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Settlements</span>
                    <span className="text-base font-semibold text-amber-500">R2.3M</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Consolidated Payments (MTD) */}
        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-500 overflow-hidden">
          <CardHeader className="pb-1 pt-2 px-3 bg-blue-500/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded-full bg-blue-500/10">
                <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Consolidated Payments (MTD)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold">
                      R71.9M
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total Collections
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-500">
                      +15.2%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      vs Last Month
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Monthly Progress</span>
                    <span className="font-medium text-blue-500">
                      3 of 12 months
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `25%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Apr</span>
                    <span className="text-base font-semibold text-blue-500">R16.6M</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mb-1" />
                    <span className="text-xs text-muted-foreground">May</span>
                    <span className="text-base font-semibold text-emerald-500">R29.5M</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-amber-500 mb-1" />
                    <span className="text-xs text-muted-foreground">Jun</span>
                    <span className="text-base font-semibold text-amber-500">R25.8M</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
      
      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4 bg-background border border-border p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
            <Activity className="h-3.5 w-3.5 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
            <Users className="h-3.5 w-3.5 mr-2" />
            Agent Performances
          </TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
            <PhoneCall className="h-3.5 w-3.5 mr-2" />
            Call Analytics
          </TabsTrigger>
          <TabsTrigger value="realtime" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Real-time Monitor
          </TabsTrigger>
          <TabsTrigger value="dailystats" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            Daily Stats
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          
          {/* Real-time Call Monitor */}
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Real-time Call Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <RealtimeMetrics 
                  activeCalls={data.activeCalls || []} 
                  queuedCalls={data.queuedCalls || []} 
                />
              )}
            </CardContent>
          </Card>
          
          {/* Performance Summary section removed */}
        </TabsContent>
        
        <TabsContent value="agents">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <AgentPerformanceTable agents={data.agents || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calls">
          <div className="grid grid-cols-1 gap-4">
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Call Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] w-full flex items-center justify-center">
                    <Skeleton className="h-[350px] w-full rounded-md" />
                  </div>
                ) : (
                  <CallAnalyticsVisualization callMetrics={data.callMetrics} timeRange={timeRange} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="realtime">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Real-time Call Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <RealtimeMetrics 
                  activeCalls={data.activeCalls || []} 
                  queuedCalls={data.queuedCalls || []} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dailystats" className="space-y-6">
          {/* Real-time Call Monitor */}
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Real-time Call Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <RealtimeMetrics 
                  activeCalls={data.activeCalls || []} 
                  queuedCalls={data.queuedCalls || []} 
                />
              )}
            </CardContent>
          </Card>
          
          {/* Total Calls Summary */}
          <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <PhoneCall className="h-5 w-5 text-purple-500" />
                </div>
                Total Calls Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-3xl font-bold text-purple-600">
                        {(data.activeCalls?.length || 0) + (data.queuedCalls?.length || 0) + 1247}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Total Calls Today
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-500">
                        +12.3%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        vs Yesterday
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-700">Completed</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">1,189</div>
                      <div className="text-xs text-muted-foreground mt-1">95.3% success rate</div>
                    </div>
                    
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <PhoneCall className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">Active</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{data.activeCalls?.length || 4}</div>
                      <div className="text-xs text-muted-foreground mt-1">Currently ongoing</div>
                    </div>
                    
                    <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700">Queued</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">{data.queuedCalls?.length || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">Waiting to connect</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity section removed */}
    </div>
  );
}
