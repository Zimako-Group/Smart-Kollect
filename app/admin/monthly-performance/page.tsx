"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Users,
  DollarSign,
  PhoneCall,
  CheckCircle,
} from "lucide-react";

// Define the agent type based on what we'll get from Supabase
type Agent = {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
  status?: 'active' | 'inactive' | 'on leave';
  performance?: {
    collectionRate?: number;
    casesResolved?: number;
    customerSatisfaction?: number;
  };
};

export default function MonthlyPerformancePage() {
  const [selectedMonth, setSelectedMonth] = useState("May 2025");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [comparisonMonths, setComparisonMonths] = useState<string[]>(["May 2025", "April 2025"]);
  const [showComparison, setShowComparison] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date for default selections
  // Fetch agent data from Supabase
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      // Fetch from profiles table where role is 'agent' or 'debt_collector'
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.agent,role.eq.debt_collector')
        .order('full_name');
      
      if (error) {
        throw error;
      }
      
      setAgents(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Calculate total collections
    const now = new Date();
    const currentMonth = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    
    // Set current month as default
    setSelectedMonth(currentMonth);
    
    // Set comparison months (current and previous)
    const prevMonth = new Date(now);
    prevMonth.setMonth(now.getMonth() - 1);
    const previousMonth = `${prevMonth.toLocaleString('default', { month: 'long' })} ${prevMonth.getFullYear()}`;
    
    setComparisonMonths([currentMonth, previousMonth]);
    
    // Fetch agents when component mounts
    fetchAgents();
  }, []);

  // Placeholder data for the monthly performance dashboard
  const performanceData = {
    totalCollections: "R1,250,500",
    collectionGrowth: "+15.2%",
    activeAgents: 24,
    avgPerformance: "92%",
    ptpConversion: "78%",
    contactRate: "65%",
    topPerformer: "Sipho Ndlovu",
    mostImproved: "Thandi Nkosi",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Monthly Performance
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of agent and team performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="May 2025">May 2025</SelectItem>
              <SelectItem value="April 2025">April 2025</SelectItem>
              <SelectItem value="March 2025">March 2025</SelectItem>
              <SelectItem value="February 2025">February 2025</SelectItem>
              <SelectItem value="January 2025">January 2025</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Teams">All Teams</SelectItem>
              <SelectItem value="Team A">Team A</SelectItem>
              <SelectItem value="Team B">Team B</SelectItem>
              <SelectItem value="Team C">Team C</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant={showComparison ? "default" : "outline"} 
            onClick={() => setShowComparison(!showComparison)}
            className="gap-2"
          >
            <BarChart className="h-4 w-4" />
            {showComparison ? "Hide Comparison" : "Show Comparison"}
          </Button>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Collections
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.totalCollections}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{performanceData.collectionGrowth}</span> from previous month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Agents
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.activeAgents}</div>
                <p className="text-xs text-muted-foreground">
                  Average performance: <span className="text-green-500">{performanceData.avgPerformance}</span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  PTP Conversion
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.ptpConversion}</div>
                <p className="text-xs text-muted-foreground">
                  Of all promises to pay made
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contact Rate
                </CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.contactRate}</div>
                <p className="text-xs text-muted-foreground">
                  Successful contacts vs attempts
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Collection Trend</CardTitle>
                  <CardDescription>
                    {showComparison 
                      ? `Comparing ${comparisonMonths[0]} with ${comparisonMonths[1]}` 
                      : `Daily collection amounts for ${selectedMonth}`}
                  </CardDescription>
                </div>
                {showComparison && (
                  <Select 
                    value={comparisonMonths[1]} 
                    onValueChange={(value) => {
                      if (value !== comparisonMonths[0]) {
                        setComparisonMonths([comparisonMonths[0], value]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Compare with..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="April 2025">April 2025</SelectItem>
                      <SelectItem value="March 2025">March 2025</SelectItem>
                      <SelectItem value="February 2025">February 2025</SelectItem>
                      <SelectItem value="January 2025">January 2025</SelectItem>
                      <SelectItem value="December 2024">December 2024</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="pl-2">
                {showComparison ? (
                  <div className="space-y-6">
                    {/* Month-on-Month Comparison Chart */}
                    <div className="h-[300px] relative">
                      {/* This would be replaced with an actual chart component */}
                      <div className="absolute inset-0 flex flex-col">
                        <div className="flex justify-between items-center mb-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <span className="text-sm">{comparisonMonths[0]} (Current Book)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                            <span className="text-sm">{comparisonMonths[1]}</span>
                          </div>
                        </div>
                        
                        {/* Simulated chart with bars */}
                        <div className="flex-1 flex items-end justify-around px-4">
                          {/* Week 1 */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="flex gap-1 w-full">
                              <div className="bg-blue-500 h-[120px] w-1/2 rounded-t"></div>
                              <div className="bg-gray-500 h-[90px] w-1/2 rounded-t"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Week 1</span>
                          </div>
                          
                          {/* Week 2 */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="flex gap-1 w-full">
                              <div className="bg-blue-500 h-[150px] w-1/2 rounded-t"></div>
                              <div className="bg-gray-500 h-[110px] w-1/2 rounded-t"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Week 2</span>
                          </div>
                          
                          {/* Week 3 */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="flex gap-1 w-full">
                              <div className="bg-blue-500 h-[180px] w-1/2 rounded-t"></div>
                              <div className="bg-gray-500 h-[160px] w-1/2 rounded-t"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Week 3</span>
                          </div>
                          
                          {/* Week 4 */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="flex gap-1 w-full">
                              <div className="bg-blue-500 h-[200px] w-1/2 rounded-t"></div>
                              <div className="bg-gray-500 h-[170px] w-1/2 rounded-t"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Week 4</span>
                          </div>
                          
                          {/* Current Book */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="flex gap-1 w-full">
                              <div className="bg-blue-500 h-[80px] w-1/2 rounded-t"></div>
                              <div className="bg-gray-500 h-[0px] w-1/2 rounded-t"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Current Book</span>
                          </div>
                        </div>
                        
                        {/* Y-axis labels (would be dynamic in real implementation) */}
                        <div className="absolute left-0 inset-y-0 flex flex-col justify-between py-8 text-xs text-muted-foreground">
                          <span>R500K</span>
                          <span>R400K</span>
                          <span>R300K</span>
                          <span>R200K</span>
                          <span>R100K</span>
                          <span>R0</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-muted/20 rounded-md p-3">
                        <h4 className="text-sm font-medium mb-1">Total Collections</h4>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-lg font-bold">R1,250,500</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[0]}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">R1,120,300</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[1]}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-green-500 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" /> +11.6% increase
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 rounded-md p-3">
                        <h4 className="text-sm font-medium mb-1">Collection Rate</h4>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-lg font-bold">78.3%</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[0]}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">72.1%</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[1]}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-green-500 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" /> +6.2% increase
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 rounded-md p-3">
                        <h4 className="text-sm font-medium mb-1">Active Accounts</h4>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-lg font-bold">2,450</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[0]}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">2,380</p>
                            <p className="text-xs text-muted-foreground">{comparisonMonths[1]}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-green-500 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" /> +2.9% increase
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center p-6">
                      <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Daily Collection Trend</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        This is a placeholder for the daily collection trend chart. Toggle comparison view to see month-on-month performance.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Agent Performance</h3>
              <p className="text-muted-foreground text-sm">
                {agents.length} {agents.length === 1 ? 'agent' : 'agents'} found
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAgents}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Loading agents...</p>
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
              <div className="text-center p-6">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Agents Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                  No agents were found in the database. Please add agents to view their performance metrics.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Agent Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center uppercase text-xs font-semibold">
                              {agent.avatar_url ? (
                                <img src={agent.avatar_url} alt={agent.full_name} className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                agent.full_name?.substring(0, 2) || '??'
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{agent.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">{agent.email}</td>
                        <td className="p-4 align-middle capitalize">{agent.role || 'N/A'}</td>
                        <td className="p-4 align-middle">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${agent.status === 'active' ? 'bg-green-500/10 text-green-500' : agent.status === 'inactive' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {agent.status || 'unknown'}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 align-middle">
                          <Link href={`/admin/monthly-performance/agents/${agent.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">View details</span>
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="collections" className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
          <div className="text-center p-6">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Collections Tab</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              This tab will provide detailed breakdowns of collections by category, payment method, and time periods.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection Performance Over Time</CardTitle>
              <CardDescription>
                Track month-on-month collection performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] relative">
                {/* This would be replaced with an actual chart component */}
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 px-10 pt-6">
                    {/* Simulated line chart for 6-month trend */}
                    <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="800" y2="0" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
                      <line x1="0" y1="75" x2="800" y2="75" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
                      <line x1="0" y1="150" x2="800" y2="150" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
                      <line x1="0" y1="225" x2="800" y2="225" stroke="#333" strokeWidth="1" strokeDasharray="5,5" />
                      <line x1="0" y1="300" x2="800" y2="300" stroke="#333" strokeWidth="1" />
                      
                      {/* Collection Amount Line */}
                      <path 
                        d="M0,200 L133,180 L266,150 L400,120 L533,90 L666,70 L800,50" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="3" 
                      />
                      
                      {/* Collection Rate Line */}
                      <path 
                        d="M0,220 L133,200 L266,190 L400,170 L533,160 L666,140 L800,130" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="3" 
                      />
                      
                      {/* Data points for Collection Amount */}
                      <circle cx="0" cy="200" r="5" fill="#3b82f6" />
                      <circle cx="133" cy="180" r="5" fill="#3b82f6" />
                      <circle cx="266" cy="150" r="5" fill="#3b82f6" />
                      <circle cx="400" cy="120" r="5" fill="#3b82f6" />
                      <circle cx="533" cy="90" r="5" fill="#3b82f6" />
                      <circle cx="666" cy="70" r="5" fill="#3b82f6" />
                      <circle cx="800" cy="50" r="5" fill="#3b82f6" />
                      
                      {/* Data points for Collection Rate */}
                      <circle cx="0" cy="220" r="5" fill="#10b981" />
                      <circle cx="133" cy="200" r="5" fill="#10b981" />
                      <circle cx="266" cy="190" r="5" fill="#10b981" />
                      <circle cx="400" cy="170" r="5" fill="#10b981" />
                      <circle cx="533" cy="160" r="5" fill="#10b981" />
                      <circle cx="666" cy="140" r="5" fill="#10b981" />
                      <circle cx="800" cy="130" r="5" fill="#10b981" />
                    </svg>
                    
                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-md border flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Collection Amount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Collection Rate %</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="h-8 flex justify-between px-10 text-xs text-muted-foreground">
                    <span>Dec 2024</span>
                    <span>Jan 2025</span>
                    <span>Feb 2025</span>
                    <span>Mar 2025</span>
                    <span>Apr 2025</span>
                    <span>May 2025</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Monthly Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+12.5%</div>
                    <p className="text-xs text-muted-foreground">Over the last 6 months</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Best Performing Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">May 2025</div>
                    <p className="text-xs text-muted-foreground">R1.25M collected</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Collection Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+8.2%</div>
                    <p className="text-xs text-muted-foreground">Improvement since Dec 2024</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Year-to-Date Performance</CardTitle>
              <CardDescription>
                Cumulative collection performance for 2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Collection Progress</h3>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          65% of Annual Target
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block">
                          R6.5M / R10M
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block text-green-600">
                          72% of PTP Target
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block">
                          1,440 / 2,000
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                      <div style={{ width: "72%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold inline-block text-purple-600">
                          58% of New Accounts Target
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block">
                          2,320 / 4,000
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                      <div style={{ width: "58%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Monthly Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-24 text-xs">January</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "45%" }}></div>
                      </div>
                      <div className="w-16 text-xs text-right">R450K</div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-24 text-xs">February</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "62%" }}></div>
                      </div>
                      <div className="w-16 text-xs text-right">R620K</div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-24 text-xs">March</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "78%" }}></div>
                      </div>
                      <div className="w-16 text-xs text-right">R780K</div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-24 text-xs">April</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "112%" }}></div>
                      </div>
                      <div className="w-16 text-xs text-right">R1.12M</div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-24 text-xs">May</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "125%" }}></div>
                      </div>
                      <div className="w-16 text-xs text-right">R1.25M</div>
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
