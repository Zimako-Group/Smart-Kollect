"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Calendar,
  Download,
  FileText,
  Filter,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  Percent,
  Share2,
  Mail,
  Printer,
  ChevronDown,
  BarChart3,
  Plus,
  MoreVertical,
  Trash,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { getAgents } from '@/lib/accounts-service';
import dynamic from 'next/dynamic';
import PaymentAnalysisCard from "./payment-analysis-card";
import MonthlyArrangementsCard from "./monthly-arrangements-card";
import HighRiskAccountsCard from "./high-risk-accounts-card";

// Dynamically import chart components with no SSR to avoid hydration issues
const CollectionTrendsChart = dynamic(
  () => import('@/components/CollectionTrendsChart'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[300px]"><RefreshCw className="h-8 w-8 text-slate-500 animate-spin" /></div> }
);

const DebtTypePieChart = dynamic(
  () => import('@/components/DebtTypePieChart'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[300px]"><RefreshCw className="h-8 w-8 text-slate-500 animate-spin" /></div> }
);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateDisplay } from "@/components/DateDisplay";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for our data
type TimeRange = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ReportFormat = 'pdf' | 'excel' | 'csv';

interface ReportMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface SavedReport {
  id: string;
  name: string;
  type: string;
  lastGenerated: string;
  format: ReportFormat;
  frequency: string;
}

interface AgentPerformance {
  id: string;
  name: string;
  performance: number;
  rank: number;
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [searchQuery, setSearchQuery] = useState("");
  const [topPerformers, setTopPerformers] = useState<AgentPerformance[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);

  // Effect to load data when component mounts or timeRange changes
  useEffect(() => {
    // Function to fetch metrics data
    const fetchMetricsData = async () => {
      setIsLoadingMetrics(true);
      try {
        // TODO: Replace with actual API call to fetch metrics data
        // const response = await fetch('/api/reports/metrics?timeRange=' + timeRange);
        // const data = await response.json();
        // setKeyMetrics(data);

        // For now, just set loading to false after a delay to simulate API call
        setTimeout(() => {
          setIsLoadingMetrics(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching metrics data:', error);
        setIsLoadingMetrics(false);
      }
    };

    // Function to fetch saved reports
    const fetchSavedReports = async () => {
      setIsLoadingReports(true);
      try {
        // TODO: Replace with actual API call to fetch saved reports
        // const response = await fetch('/api/reports/saved');
        // const data = await response.json();
        // setSavedReports(data);

        // For now, just set loading to false after a delay to simulate API call
        setTimeout(() => {
          setIsLoadingReports(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching saved reports:', error);
        setIsLoadingReports(false);
      }
    };

    // Function to fetch agent performance data
    const fetchAgentPerformance = async () => {
      setIsLoadingAgents(true);
      try {
        // Fetch real agents from the accounts service
        const agents = await getAgents();
        console.log('Fetched agents:', agents);

        if (agents && agents.length > 0) {
          // For now, we'll assign random performance scores
          // In a real implementation, you would fetch actual performance metrics
          const agentsWithPerformance = agents.map(agent => {
            // Extract agent name from various possible fields
            let agentName = 'Unknown Agent';
            
            if (agent.email) {
              // Use email username as fallback
              agentName = agent.email.split('@')[0];
            }
            
            // Try to get name from agent data - using type assertion safely
            try {
              // Check if agent has any metadata we can use
              const anyAgent = agent as any;
              
              if (anyAgent.user_metadata?.full_name) {
                agentName = anyAgent.user_metadata.full_name;
              } else if (anyAgent.user_metadata?.name) {
                agentName = anyAgent.user_metadata.name;
              } else if (anyAgent.raw_user_metadata?.full_name) {
                agentName = anyAgent.raw_user_metadata.full_name;
              } else if (anyAgent.raw_user_metadata?.name) {
                agentName = anyAgent.raw_user_metadata.name;
              }
            } catch (error) {
              console.log('Error extracting agent name:', error);
            }
            
            // Format the name to be title case
            agentName = agentName
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            
            return {
              id: agent.id,
              name: agentName,
              // Random performance between 70 and 95
              performance: Math.round((70 + Math.random() * 25) * 10) / 10
            };
          });

          // Sort by performance (highest first) and add rank
          const sortedAgents = agentsWithPerformance
            .sort((a, b) => b.performance - a.performance)
            .map((agent, index) => ({
              ...agent,
              rank: index + 1
            }));

          // Display all agents
          setTopPerformers(sortedAgents);
        }

        setIsLoadingAgents(false);
      } catch (error) {
        console.error('Error fetching agent performance:', error);
        setIsLoadingAgents(false);
      }
    };

    fetchMetricsData();
    fetchSavedReports();
    fetchAgentPerformance();
  }, [timeRange]);

  // State for loading metrics data - set to false since we've pre-populated the data
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Initialize key metrics with actual data
  const [keyMetrics, setKeyMetrics] = useState<ReportMetric[]>([
    {
      title: "Collection Rate",
      value: "66%",
      change: 5.3,
      trend: "down",
      icon: <Percent className="h-5 w-5" />,
      color: "text-blue-400",
    },
    {
      title: "Total Collected",
      value: "R19,432,161.76",
      change: -34,
      trend: "down",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-400",
    },
    {
      title: "Active Cases",
      value: "--",
      change: 0,
      trend: "neutral",
      icon: <FileText className="h-5 w-5" />,
      color: "text-purple-400",
    },
    {
      title: "Contact Rate",
      value: "--",
      change: 0,
      trend: "neutral",
      icon: <Users className="h-5 w-5" />,
      color: "text-amber-400",
    },
  ]);

  // Default metric structure for reference
  const metricStructure = [
    {
      title: "Collection Rate",
      icon: <Percent className="h-5 w-5" />,
      color: "text-blue-400",
    },
    {
      title: "Total Collected",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-400",
    },
    {
      title: "Active Cases",
      icon: <FileText className="h-5 w-5" />,
      color: "text-purple-400",
    },
    {
      title: "Contact Rate",
      icon: <Users className="h-5 w-5" />,
      color: "text-amber-400",
    },
  ];

  // State for loading reports data
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Empty array for saved reports - will be populated with real data
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Helper function to render trend indicators
  const renderTrend = (trend: 'up' | 'down' | 'neutral', change: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-400 text-xs font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {change}%
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-400 text-xs font-medium">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {Math.abs(change)}%
        </div>
      );
    }
    return null;
  };

  // Helper function to get file format icon
  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-400" />;
      case 'excel':
        return <BarChart3 className="h-4 w-4 text-green-400" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-400" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <DateDisplay />
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px] bg-slate-900/40 border-slate-700/50">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-gradient-to-r from-blue-600 to-blue-500">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Report Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>Collection Performance</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                <span>Agent Performance</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <PieChartIcon className="h-4 w-4 mr-2" />
                <span>Debt Aging Analysis</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LineChartIcon className="h-4 w-4 mr-2" />
                <span>Payment Trends</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Percent className="h-4 w-4 mr-2" />
                <span>Custom Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoadingMetrics ? (
          // Loading skeleton for metrics
          <>
            {[1, 2, 3, 4].map((_, index) => (
              <Card key={index} className="bg-card border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-slate-800 animate-pulse">
                        <div className="h-5 w-5 bg-slate-700 rounded-full"></div>
                      </div>
                      <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
                  </div>
                  <div className="mt-4">
                    <div className="h-8 w-32 bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-slate-700 rounded animate-pulse mt-2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : keyMetrics.length > 0 ? (
          // Render actual metrics if available
          keyMetrics.map((metric, index) => (
            <Card key={index} className="bg-card border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-full bg-slate-800 ${metric.color}`}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  {renderTrend(metric.trend, metric.change)}
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-xs text-slate-500">vs. last {timeRange}</div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state for metrics
          <>
            {metricStructure.map((metric, index) => (
              <Card key={index} className="bg-card border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full bg-slate-800 ${metric.color}`}>
                        {metric.icon}
                      </div>
                      <span className="text-sm font-medium">{metric.title}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-xs text-slate-500">No data available</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-900/40 border border-slate-800/60">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="collection" className="data-[state=active]:bg-slate-800">
              Collection Reports
            </TabsTrigger>
            <TabsTrigger value="agent" className="data-[state=active]:bg-slate-800">
              Agent Performance
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-slate-800">
              Saved Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Collection Trends Chart */}
              <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Collection Trends</CardTitle>
                      <CardDescription className="text-slate-400">
                        Monthly collection performance over time
                      </CardDescription>
                    </div>
                    <Select defaultValue="6months">
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-800/60 border-slate-700/50">
                        <SelectValue placeholder="Time Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="1year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <CollectionTrendsChart height={300} />
                  </div>
                </CardContent>
              </Card>

              {/* Collection by Debt Type */}
              <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Collection by Debt Type</CardTitle>
                  <CardDescription className="text-slate-400">
                    Distribution across categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <DebtTypePieChart height={300} />
                  </div>
                </CardContent>
              </Card>

              {/* Regional Performance */}
              <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Regional Performance</CardTitle>
                  <CardDescription className="text-slate-400">
                    Collection rates by region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <div className="text-center space-y-3 text-slate-500">
                      <BarChart className="h-16 w-16 mx-auto opacity-40" />
                      <p>Bar chart visualization would appear here</p>
                      <p className="text-xs">Shows collection rates by geographic region</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Performance Comparison */}
              <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Agent Performance Comparison</CardTitle>
                  <CardDescription className="text-slate-400">
                    Top performing agents by collection rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <div className="text-center space-y-3 text-slate-500">
                      <BarChart className="h-16 w-16 mx-auto opacity-40" />
                      <p>Horizontal bar chart visualization would appear here</p>
                      <p className="text-xs">Shows agent performance metrics compared to targets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collection Reports Tab */}
          <TabsContent value="collection" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Collection Reports</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-slate-700/50">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-slate-700/50">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Generate and view detailed collection reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {/* Report Card 1 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-blue-900/30 p-2.5">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Collection Performance</h3>
                        <p className="text-xs text-slate-400">Detailed collection metrics</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">March 5, 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <FileText className="h-3 w-3 mr-1 text-red-400" /> PDF
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

                  {/* Payment Analysis Card */}
                  <Suspense fallback={<div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 h-[180px] flex items-center justify-center"><RefreshCw className="h-6 w-6 text-slate-500 animate-spin" /></div>}>
                    <PaymentAnalysisCard />
                  </Suspense>

                  {/* Monthly Arrangements Card */}
                  <Suspense fallback={<div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 h-[180px] flex items-center justify-center"><RefreshCw className="h-6 w-6 text-slate-500 animate-spin" /></div>}>
                    <MonthlyArrangementsCard />
                  </Suspense>
                  
                  {/* Report Card 3 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-purple-900/30 p-2.5">
                        <PieChartIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Debt Aging Analysis</h3>
                        <p className="text-xs text-slate-400">Debt categorized by age</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">February 28, 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <FileText className="h-3 w-3 mr-1 text-red-400" /> PDF
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

                  {/* Report Card 4 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-amber-900/30 p-2.5">
                        <Clock className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Payment Plan Compliance</h3>
                        <p className="text-xs text-slate-400">Adherence to payment plans</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">March 7, 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1 text-green-400" /> Excel
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

                  {/* High Risk Accounts Card */}
                  <Suspense fallback={<div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 h-[180px] flex items-center justify-center"><RefreshCw className="h-6 w-6 text-slate-500 animate-spin" /></div>}>
                    <HighRiskAccountsCard />
                  </Suspense>

                  {/* Report Card 6 - Monthly Arrangements */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-cyan-900/30 p-2.5">
                        <Calendar className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Monthly Arrangements</h3>
                        <p className="text-xs text-slate-400">Arrangements made for the current month</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1 text-green-400" /> Excel
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

                  {/* Report Card 7 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-slate-700/50 p-2.5">
                        <FileText className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Custom Report</h3>
                        <p className="text-xs text-slate-400">Create a custom report</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center h-[72px]">
                      <Plus className="h-8 w-8 text-slate-600" />
                    </div>
                    <Button variant="outline" className="w-full border-slate-700 text-xs h-8">
                      Create New Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Performance Tab */}
          <TabsContent value="agent" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Agent Performance Reports</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-slate-700/50">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-slate-700/50">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Track and analyze agent productivity and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Agent Performance Overview */}
                    <div className="md:col-span-2 bg-slate-800/40 rounded-lg border border-slate-700/40 p-4">
                      <h3 className="font-medium text-slate-200 mb-3">Agent Performance Overview</h3>
                      <div className="h-[250px] w-full flex items-center justify-center">
                        <div className="text-center space-y-3 text-slate-500">
                          <BarChart className="h-16 w-16 mx-auto opacity-40" />
                          <p>Bar chart visualization would appear here</p>
                          <p className="text-xs">Shows key performance metrics for all agents</p>
                        </div>
                      </div>
                    </div>

                    {/* Agent Performance Ranking */}
                    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4">
                      <h3 className="font-medium text-slate-200 mb-3">Agent Performance Ranking</h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {isLoadingAgents ? (
                          // Loading skeleton for agents
                          <>
                            {[1, 2, 3, 4, 5].map((_, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse"></div>
                                  <div className="h-4 w-32 bg-slate-700 rounded animate-pulse"></div>
                                </div>
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse"></div>
                              </div>
                            ))}
                          </>
                        ) : topPerformers.length > 0 ? (
                          // Display real agent data
                          topPerformers.map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-md">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold">
                                  {agent.rank}
                                </div>
                                <span className="text-sm text-slate-200">{agent.name}</span>
                              </div>
                              <span className="text-green-400 text-sm font-medium">{agent.performance}%</span>
                            </div>
                          ))
                        ) : (
                          // No agents found
                          <div className="flex items-center justify-center p-6 text-center">
                            <div className="space-y-2">
                              <Users className="h-8 w-8 mx-auto text-slate-500" />
                              <p className="text-sm text-slate-400">No agent data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Agent Report 1 */}
                    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-full bg-blue-900/30 p-2.5">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-200">Agent Productivity Report</h3>
                          <p className="text-xs text-slate-400">Calls, contacts, and collections</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Frequency:</span>
                          <span className="text-slate-300">Weekly</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Last Generated:</span>
                          <span className="text-slate-300">March 5, 2025</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-xs h-8">
                        Generate Report
                      </Button>
                    </div>

                    {/* Agent Report 2 */}
                    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-full bg-purple-900/30 p-2.5">
                          <TrendingUp className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-200">Performance Trends</h3>
                          <p className="text-xs text-slate-400">Agent performance over time</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Frequency:</span>
                          <span className="text-slate-300">Monthly</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Last Generated:</span>
                          <span className="text-slate-300">March 1, 2025</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-xs h-8">
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Reports Tab */}
          <TabsContent value="saved" className="space-y-4">
            <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Reports</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-500" />
                      <Input
                        type="search"
                        placeholder="Search reports..."
                        className="pl-9 h-9 w-[200px] bg-slate-900/40 border-slate-700/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 border-slate-700/50">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Access your previously generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="text-left p-3 text-xs font-medium text-slate-400">Report Name</th>
                        <th className="text-left p-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left p-3 text-xs font-medium text-slate-400">Last Generated</th>
                        <th className="text-left p-3 text-xs font-medium text-slate-400">Format</th>
                        <th className="text-left p-3 text-xs font-medium text-slate-400">Frequency</th>
                        <th className="text-right p-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingReports ? (
                        // Loading skeleton for reports
                        [...Array(5)].map((_, index) => (
                          <tr key={index} className="border-b border-slate-800">
                            <td className="p-3">
                              <div className="h-5 w-40 bg-slate-700 rounded animate-pulse mb-1"></div>
                              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3">
                              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3">
                              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3">
                              <div className="h-4 w-16 bg-slate-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3">
                              <div className="h-4 w-20 bg-slate-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : savedReports.length > 0 ? (
                        // Render actual reports if available
                        savedReports.map((report) => (
                          <tr key={report.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                            <td className="p-3 text-sm">
                              <div className="font-medium text-slate-200">{report.name}</div>
                              <div className="text-xs text-slate-500">{report.id}</div>
                            </td>
                            <td className="p-3 text-sm text-slate-300">{report.type}</td>
                            <td className="p-3 text-sm text-slate-300">{report.lastGenerated}</td>
                            <td className="p-3">
                              <div className="flex items-center">
                                {getFormatIcon(report.format)}
                                <span className="ml-1.5 text-sm text-slate-300">
                                  {report.format.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-slate-300">{report.frequency}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Download className="h-4 w-4 text-slate-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Share2 className="h-4 w-4 text-slate-400" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Mail className="h-4 w-4 mr-2" />
                                      <span>Email Report</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Printer className="h-4 w-4 mr-2" />
                                      <span>Print Report</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      <span>Regenerate</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-400">
                                      <Trash className="h-4 w-4 mr-2" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Empty state for reports
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center py-6">
                              <FileText className="h-10 w-10 text-slate-500 mb-3" />
                              <p className="text-sm font-medium mb-1">No saved reports</p>
                              <p className="text-xs text-slate-500 mb-4">Generate your first report to see it here</p>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                <span>Create Report</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}