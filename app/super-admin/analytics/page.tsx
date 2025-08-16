'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Phone, FileText, Activity, Calendar, Download, Filter, BarChart3, PieChart, LineChart, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', mahikeng: 450000, obs: 320000 },
    { month: 'Feb', mahikeng: 520000, obs: 380000 },
    { month: 'Mar', mahikeng: 480000, obs: 420000 },
    { month: 'Apr', mahikeng: 590000, obs: 460000 },
    { month: 'May', mahikeng: 620000, obs: 510000 },
    { month: 'Jun', mahikeng: 680000, obs: 550000 }
  ];

  const performanceMetrics = [
    { tenant: 'Mahikeng Municipality', collections: 'R2.4M', calls: 12450, ptp: 3200, settlements: 890, successRate: 72 },
    { tenant: 'OBS Collections', collections: 'R1.8M', calls: 9800, ptp: 2100, settlements: 650, successRate: 68 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            System Analytics
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive analytics across all tenants</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="mahikeng">Mahikeng Municipality</SelectItem>
              <SelectItem value="obs">OBS Collections</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <ArrowUp className="w-3 h-3 mr-1" />
                12.5%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">R4.2M</p>
              <p className="text-xs text-gray-500">This month across all tenants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <ArrowUp className="w-3 h-3 mr-1" />
                8.3%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-xs text-gray-500">Currently active across system</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Phone className="w-5 h-5 text-purple-400" />
              </div>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                <ArrowDown className="w-3 h-3 mr-1" />
                3.2%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Calls</p>
              <p className="text-2xl font-bold text-white">22,250</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <ArrowUp className="w-3 h-3 mr-1" />
                5.7%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">71.2%</p>
              <p className="text-xs text-gray-500">Average across all tenants</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-purple-400" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue across all tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  {/* Placeholder for actual chart */}
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">Revenue chart visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Distribution */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Activity Distribution
                </CardTitle>
                <CardDescription>Breakdown of system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Calls Made</span>
                      <span className="text-gray-400">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>PTPs Created</span>
                      <span className="text-gray-400">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Settlements</span>
                      <span className="text-gray-400">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Other Activities</span>
                      <span className="text-gray-400">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
              <CardDescription>Based on collection success rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'John Doe', tenant: 'Mahikeng', collections: 'R450K', calls: 320, rate: 82 },
                  { name: 'Sarah Smith', tenant: 'OBS', collections: 'R380K', calls: 280, rate: 78 },
                  { name: 'Mike Johnson', tenant: 'Mahikeng', collections: 'R320K', calls: 250, rate: 75 },
                  { name: 'Emily Brown', tenant: 'OBS', collections: 'R290K', calls: 240, rate: 72 },
                  { name: 'David Wilson', tenant: 'Mahikeng', collections: 'R260K', calls: 220, rate: 70 }
                ].map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-gray-400">{agent.tenant}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{agent.collections}</p>
                        <p className="text-xs text-gray-400">{agent.calls} calls</p>
                      </div>
                      <Badge className={`${agent.rate >= 80 ? 'bg-green-500/20 text-green-300' : agent.rate >= 70 ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'}`}>
                        {agent.rate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue breakdown by tenant and period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Monthly Revenue Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Month</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Mahikeng</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">OBS</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Total</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-800/50">
                          <td className="py-3 px-4 text-sm">{row.month}</td>
                          <td className="py-3 px-4 text-sm text-right">R{(row.mahikeng / 1000).toFixed(0)}K</td>
                          <td className="py-3 px-4 text-sm text-right">R{(row.obs / 1000).toFixed(0)}K</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            R{((row.mahikeng + row.obs) / 1000).toFixed(0)}K
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <Badge className={index > 0 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                              {index > 0 ? '+8.5%' : '-'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Revenue Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400 mb-2">Average Monthly Revenue</p>
                      <p className="text-2xl font-bold text-white">R890K</p>
                      <p className="text-xs text-green-400 mt-1">+12% from last quarter</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400 mb-2">Highest Revenue Month</p>
                      <p className="text-2xl font-bold text-white">R1.23M</p>
                      <p className="text-xs text-gray-500 mt-1">June 2024</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400 mb-2">YTD Revenue</p>
                      <p className="text-2xl font-bold text-white">R5.34M</p>
                      <p className="text-xs text-blue-400 mt-1">68% of annual target</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators by tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium text-white">{metric.tenant}</h3>
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {metric.successRate}% Success Rate
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Collections</p>
                        <p className="text-lg font-semibold text-white">{metric.collections}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Calls</p>
                        <p className="text-lg font-semibold text-white">{metric.calls.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">PTPs</p>
                        <p className="text-lg font-semibold text-white">{metric.ptp.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Settlements</p>
                        <p className="text-lg font-semibold text-white">{metric.settlements}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Comparison Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Tenant Activity Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Mahikeng Municipality</span>
                      <span className="text-sm text-gray-400">58%</span>
                    </div>
                    <Progress value={58} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">OBS Collections</span>
                      <span className="text-sm text-gray-400">42%</span>
                    </div>
                    <Progress value={42} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm">Mahikeng Municipality</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">85 users</span>
                      <Badge className="bg-blue-500/20 text-blue-300">54%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm">OBS Collections</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">71 users</span>
                      <Badge className="bg-purple-500/20 text-purple-300">46%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle>System Trends</CardTitle>
              <CardDescription>Key trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Positive Trends
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-300">Collection rate improved by 15% this quarter</p>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-300">User engagement up 23% month-over-month</p>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-300">Settlement time reduced by 2.5 days on average</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">Call answer rate decreased by 8%</p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">PTP default rate increased to 18%</p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">Agent productivity down 5% in afternoon shifts</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
