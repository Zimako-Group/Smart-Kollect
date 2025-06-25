"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateDisplay } from "@/components/DateDisplay";
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

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data for key metrics
  const keyMetrics: ReportMetric[] = [
    {
      title: "Collection Rate",
      value: "68.5%",
      change: 3.2,
      trend: "up",
      icon: <Percent className="h-5 w-5" />,
      color: "text-blue-400",
    },
    {
      title: "Total Collected",
      value: "R1,245,678.90",
      change: 12.7,
      trend: "up",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-400",
    },
    {
      title: "Active Cases",
      value: 487,
      change: -5.3,
      trend: "down",
      icon: <FileText className="h-5 w-5" />,
      color: "text-purple-400",
    },
    {
      title: "Contact Rate",
      value: "72.1%",
      change: 1.8,
      trend: "up",
      icon: <Users className="h-5 w-5" />,
      color: "text-amber-400",
    },
  ];

  // Mock data for saved reports
  const savedReports: SavedReport[] = [
    {
      id: "REP-2025-001",
      name: "Monthly Collection Performance",
      type: "Performance",
      lastGenerated: "2025-03-01",
      format: "pdf",
      frequency: "Monthly",
    },
    {
      id: "REP-2025-002",
      name: "Agent Productivity Report",
      type: "Agent Performance",
      lastGenerated: "2025-03-05",
      format: "excel",
      frequency: "Weekly",
    },
    {
      id: "REP-2025-003",
      name: "Aging Debt Analysis",
      type: "Financial",
      lastGenerated: "2025-02-28",
      format: "pdf",
      frequency: "Monthly",
    },
    {
      id: "REP-2025-004",
      name: "Payment Plan Compliance",
      type: "Compliance",
      lastGenerated: "2025-03-07",
      format: "excel",
      frequency: "Weekly",
    },
    {
      id: "REP-2025-005",
      name: "Regional Collection Breakdown",
      type: "Geographic",
      lastGenerated: "2025-02-15",
      format: "pdf",
      frequency: "Monthly",
    },
  ];

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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/40 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`rounded-full bg-slate-800/80 p-2 ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 text-slate-200">{metric.value}</div>
              <div className="flex items-center justify-between">
                {renderTrend(metric.trend, metric.change)}
                <span className="text-xs text-slate-400">vs. last {timeRange}</span>
              </div>
            </CardContent>
          </Card>
        ))}
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
                    <div className="text-center space-y-3 text-slate-500">
                      <LineChartIcon className="h-16 w-16 mx-auto opacity-40" />
                      <p>Collection trend chart visualization would appear here</p>
                      <p className="text-xs">Shows collection amounts and rates over time</p>
                    </div>
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
                    <div className="text-center space-y-3 text-slate-500">
                      <PieChartIcon className="h-16 w-16 mx-auto opacity-40" />
                      <p>Pie chart visualization would appear here</p>
                      <p className="text-xs">Shows breakdown by debt category</p>
                    </div>
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

                  {/* Report Card 2 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-green-900/30 p-2.5">
                        <DollarSign className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">Payment Analysis</h3>
                        <p className="text-xs text-slate-400">Payment methods & trends</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">March 1, 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1 text-green-400" /> Excel
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

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

                  {/* Report Card 5 */}
                  <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4 hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-red-900/30 p-2.5">
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">High Risk Accounts</h3>
                        <p className="text-xs text-slate-400">Accounts at risk of default</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-slate-300">March 6, 2025</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-slate-300 flex items-center">
                          <FileText className="h-3 w-3 mr-1 text-red-400" /> PDF
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 text-xs h-8">
                      Generate Report
                    </Button>
                  </div>

                  {/* Report Card 6 */}
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

                    {/* Top Performers */}
                    <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4">
                      <h3 className="font-medium text-slate-200 mb-3">Top Performers</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold">
                              1
                            </div>
                            <span className="text-sm text-slate-200">Sarah Johnson</span>
                          </div>
                          <span className="text-green-400 text-sm font-medium">87.5%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold">
                              2
                            </div>
                            <span className="text-sm text-slate-200">David Nkosi</span>
                          </div>
                          <span className="text-green-400 text-sm font-medium">82.3%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold">
                              3
                            </div>
                            <span className="text-sm text-slate-200">Thabo Molefe</span>
                          </div>
                          <span className="text-green-400 text-sm font-medium">79.8%</span>
                        </div>
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
                      {savedReports.map((report) => (
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
                      ))}
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