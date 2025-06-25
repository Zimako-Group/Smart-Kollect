"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/store";
import { fetchCustomerFlags, setFlags } from "@/lib/redux/features/flags/flagsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Flag,
  AlertTriangle,
  AlertCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Percent,
  Search,
  CalendarDays,
  User,
  UserCheck,
  UserX,
  Phone,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  Eye,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FlagsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  
  // Get flags data from Redux store
  const flags = useAppSelector((state) => state.flags.flags);
  const flagsLoading = useAppSelector((state) => state.flags.loading);
  const flagsError = useAppSelector((state) => state.flags.error);
  
  // Fetch all flags when the component mounts
  useEffect(() => {
    const fetchAllFlags = async () => {
      try {
        setLoading(true);
        
        // Fetch all flags directly from the database
        const { supabase } = await import('@/lib/supabase');
        
        // Fetch all flags
        const { data: flagsData, error } = await supabase
          .from('flags')
          .select(`
            id,
            customer_id,
            type,
            priority,
            notes,
            created_at,
            created_by,
            is_resolved,
            resolved_at,
            resolved_by
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching flags:', error);
          return;
        }
        
        // Get unique customer IDs from flags
        const customerIds = [...new Set(flagsData.map((flag: any) => flag.customer_id))];
        
        // Fetch customer information
        const { data: customersData, error: customersError } = await supabase
          .from('Debtors')
          .select('id, name, acc_number')
          .in('id', customerIds);
          
        if (customersError) {
          console.error('Error fetching customers:', customersError);
        }
        
        // Create a map of customers by id for easy lookup
        const customersMap = (customersData || []).reduce((map: any, customer: any) => {
          map[customer.id] = customer;
          return map;
        }, {});
        
        // Get unique user IDs (creators and resolvers)
        const userIds = [...new Set(
          flagsData.map((flag: any) => flag.created_by)
            .concat(flagsData.filter((flag: any) => flag.resolved_by).map((flag: any) => flag.resolved_by))
            .filter((id: string) => id !== null && id !== undefined)
        )];
        
        // Fetch user information
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
        }
        
        // Create a map of users by id for easy lookup
        const usersMap = (usersData || []).reduce((map: any, user: any) => {
          map[user.id] = user;
          return map;
        }, {});
        
        // Transform database flags to application flags
        const transformedFlags = flagsData.map((item: any) => {
          const customer = customersMap[item.customer_id];
          const createdByUser = usersMap[item.created_by];
          const resolvedByUser = item.resolved_by ? usersMap[item.resolved_by] : null;
          
          return {
            id: item.id,
            accountId: item.customer_id,
            accountName: customer ? customer.name : 'Unknown Account',
            accountNumber: customer ? customer.acc_number : '',
            type: item.type,
            priority: item.priority,
            notes: item.notes,
            dateAdded: item.created_at,
            addedBy: createdByUser ? createdByUser.full_name : 'Unknown User',
            addedById: item.created_by,
            isResolved: item.is_resolved,
            dateResolved: item.resolved_at,
            resolvedBy: resolvedByUser ? resolvedByUser.full_name : undefined,
            resolvedById: item.resolved_by
          };
        });
        
        // Update the Redux store with the fetched flags
        dispatch(setFlags(transformedFlags));
      } catch (error) {
        console.error('Error fetching all flags:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllFlags();
  }, [dispatch]);
  
  // Calculate metrics based on the flags data
  const flagsData = {
    totalFlags: flags.filter(flag => !flag.isResolved).length,
    highPriority: flags.filter(flag => flag.priority === 'high' && !flag.isResolved).length,
    mediumPriority: flags.filter(flag => flag.priority === 'medium' && !flag.isResolved).length,
    lowPriority: flags.filter(flag => flag.priority === 'low' && !flag.isResolved).length,
    recentlyAdded: flags.filter(flag => {
      const now = new Date();
      const flagDate = new Date(flag.dateAdded);
      const diffTime = Math.abs(now.getTime() - flagDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && !flag.isResolved;
    }).length,
    resolvedThisMonth: flags.filter(flag => {
      if (!flag.isResolved || !flag.dateResolved) return false;
      const now = new Date();
      const resolvedDate = new Date(flag.dateResolved);
      return resolvedDate.getMonth() === now.getMonth() && 
             resolvedDate.getFullYear() === now.getFullYear();
    }).length,
    flagsByType: [
      { type: "Payment Dispute", count: flags.filter(flag => flag.type === "dispute" && !flag.isResolved).length },
      { type: "Legal Action", count: flags.filter(flag => flag.type === "legal" && !flag.isResolved).length },
      { type: "Deceased", count: flags.filter(flag => flag.type === "deceased" && !flag.isResolved).length },
      { type: "Fraud Alert", count: flags.filter(flag => flag.type === "fraud" && !flag.isResolved).length },
      { type: "Trace Alert", count: flags.filter(flag => flag.type === "trace" && !flag.isResolved).length },
      { type: "Special Handling", count: flags.filter(flag => flag.type === "special" && !flag.isResolved).length }
    ],
    flagsByAge: [
      { range: "0-7 days", count: flags.filter(flag => {
        if (flag.isResolved) return false;
        const now = new Date();
        const flagDate = new Date(flag.dateAdded);
        const diffTime = Math.abs(now.getTime() - flagDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length },
      { range: "8-14 days", count: flags.filter(flag => {
        if (flag.isResolved) return false;
        const now = new Date();
        const flagDate = new Date(flag.dateAdded);
        const diffTime = Math.abs(now.getTime() - flagDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7 && diffDays <= 14;
      }).length },
      { range: "15-30 days", count: flags.filter(flag => {
        if (flag.isResolved) return false;
        const now = new Date();
        const flagDate = new Date(flag.dateAdded);
        const diffTime = Math.abs(now.getTime() - flagDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 14 && diffDays <= 30;
      }).length },
      { range: "31+ days", count: flags.filter(flag => {
        if (flag.isResolved) return false;
        const now = new Date();
        const flagDate = new Date(flag.dateAdded);
        const diffTime = Math.abs(now.getTime() - flagDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      }).length }
    ]
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-800"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-200">Flagged Accounts</h1>
            <p className="text-sm text-slate-400">View and manage accounts requiring special attention</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
            className="w-full md:w-auto"
          >
            <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5">
              <TabsTrigger
                value="week"
                className="h-7 px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="h-7 px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="quarter"
                className="h-7 px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
              >
                Quarter
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="default"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Flags Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total Flags
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {flagsData.totalFlags}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <ArrowUp className="h-3 w-3" />
                <span>4 from last month</span>
              </div>
              <Badge variant="outline" className="bg-rose-950/40 text-rose-400 border-rose-800/50">
                {flagsData.recentlyAdded} new this week
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Resolution rate</span>
                <span className="font-medium text-slate-300">
                  {flagsData.resolvedThisMonth} resolved
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_6px_rgba(225,29,72,0.3)]"
                  style={{ width: `${(flagsData.resolvedThisMonth / (flagsData.totalFlags + flagsData.resolvedThisMonth)) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Priority Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              High Priority
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {flagsData.highPriority}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                <span>Requires immediate attention</span>
              </div>
              <Badge variant="outline" className="bg-red-950/40 text-red-400 border-red-800/50">
                {Math.round((flagsData.highPriority / flagsData.totalFlags) * 100)}% of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">High priority flags</span>
                <span className="font-medium text-slate-300">{flagsData.highPriority}/{flagsData.totalFlags}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_6px_rgba(220,38,38,0.3)]"
                  style={{ width: `${(flagsData.highPriority / flagsData.totalFlags) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medium Priority Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Medium Priority
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {flagsData.mediumPriority}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <span>Needs attention soon</span>
              </div>
              <Badge variant="outline" className="bg-amber-950/40 text-amber-400 border-amber-800/50">
                {Math.round((flagsData.mediumPriority / flagsData.totalFlags) * 100)}% of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Medium priority flags</span>
                <span className="font-medium text-slate-300">{flagsData.mediumPriority}/{flagsData.totalFlags}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_6px_rgba(217,119,6,0.3)]"
                  style={{ width: `${(flagsData.mediumPriority / flagsData.totalFlags) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Priority Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Low Priority
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {flagsData.lowPriority}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <Flag className="h-3 w-3" />
                <span>For awareness</span>
              </div>
              <Badge variant="outline" className="bg-blue-950/40 text-blue-400 border-blue-800/50">
                {Math.round((flagsData.lowPriority / flagsData.totalFlags) * 100)}% of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Low priority flags</span>
                <span className="font-medium text-slate-300">{flagsData.lowPriority}/{flagsData.totalFlags}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_6px_rgba(37,99,235,0.3)]"
                  style={{ width: `${(flagsData.lowPriority / flagsData.totalFlags) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flags by Type */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Flags by Type</CardTitle>
            <CardDescription>
              Distribution of flags by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flagsData.flagsByType.map((item, index) => {
                // Generate different colors for each type
                const colors = [
                  "from-red-600 to-red-400",
                  "from-amber-600 to-amber-400",
                  "from-blue-600 to-blue-400",
                  "from-purple-600 to-purple-400",
                  "from-cyan-600 to-cyan-400",
                  "from-emerald-600 to-emerald-400"
                ];
                const colorClass = colors[index % colors.length];
                const percentage = (item.count / flagsData.totalFlags) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${colorClass}`}></div>
                        <span className="text-sm text-slate-300">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{item.count}</span>
                        <span className="text-xs text-slate-400">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Flags by Age */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Flags by Age</CardTitle>
            <CardDescription>
              Age distribution of open flags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <div className="w-3/4 max-w-[180px]">
                {/* Radial Chart */}
                <div className="relative">
                  <svg viewBox="0 0 100 100" className="w-full">
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="20" 
                    />
                    
                    {flagsData.flagsByAge.map((item, index) => {
                      // Calculate start and end positions for each segment
                      const total = flagsData.flagsByAge.reduce((sum, i) => sum + i.count, 0);
                      const percentage = item.count / total;
                      
                      // Calculate previous segments total percentage
                      const previousSegments = flagsData.flagsByAge
                        .slice(0, index)
                        .reduce((sum, i) => sum + i.count / total, 0);
                      
                      // Convert to stroke dash values
                      const circumference = 2 * Math.PI * 40;
                      const dashLength = circumference * percentage;
                      const dashOffset = circumference * (1 - previousSegments - percentage);
                      
                      // Colors based on age (older = more red)
                      const colors = [
                        "url(#age0-7)",
                        "url(#age8-14)",
                        "url(#age15-30)",
                        "url(#age31plus)"
                      ];
                      
                      return (
                        <circle 
                          key={index}
                          cx="50" cy="50" r="40" 
                          fill="none" 
                          stroke={colors[index]} 
                          strokeWidth="20" 
                          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                          strokeDashoffset={dashOffset}
                          transform="rotate(-90 50 50)" 
                        />
                      );
                    })}
                    
                    {/* Gradients for age segments */}
                    <defs>
                      <linearGradient id="age0-7" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                      <linearGradient id="age8-14" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                      <linearGradient id="age15-30" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                      <linearGradient id="age31plus" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    
                    {/* Center circle */}
                    <circle 
                      cx="50" cy="50" r="30" 
                      fill="#0f172a" 
                    />
                    
                    {/* Center text */}
                    <text 
                      x="50" y="46" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fill="#f1f5f9"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {flagsData.totalFlags}
                    </text>
                    <text 
                      x="50" y="56" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fill="#94a3b8"
                      fontSize="6"
                    >
                      TOTAL FLAGS
                    </text>
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="mt-4 text-xs flex flex-wrap justify-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span className="text-slate-300">0-7 days</span>
                    <span className="ml-1 text-slate-400">{flagsData.flagsByAge[0].count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-cyan-500"></span>
                    <span className="text-slate-300">8-14 days</span>
                    <span className="ml-1 text-slate-400">{flagsData.flagsByAge[1].count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-300">15-30 days</span>
                    <span className="ml-1 text-slate-400">{flagsData.flagsByAge[2].count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-300">31+ days</span>
                    <span className="ml-1 text-slate-400">{flagsData.flagsByAge[3].count}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Flagged Accounts Table */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Flagged Accounts</CardTitle>
              <CardDescription>
                Accounts requiring special attention
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search accounts..."
                  className="pl-9 bg-slate-950/50 border-slate-800"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              className="w-full"
            >
              <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5 w-full sm:w-auto grid grid-cols-4 sm:flex">
                <TabsTrigger
                  value="all"
                  className="h-7 px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
                >
                  All ({flagsData.totalFlags})
                </TabsTrigger>
                <TabsTrigger
                  value="high"
                  className="h-7 px-3 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  High ({flagsData.highPriority})
                </TabsTrigger>
                <TabsTrigger
                  value="medium"
                  className="h-7 px-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                >
                  Medium ({flagsData.mediumPriority})
                </TabsTrigger>
                <TabsTrigger
                  value="low"
                  className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Low ({flagsData.lowPriority})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
                    {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Account</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Flag Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Date Added</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Added By</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading || flagsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
                        <h3 className="text-lg font-medium text-slate-300">Loading flags...</h3>
                      </div>
                    </td>
                  </tr>
                ) : flagsError ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                        <h3 className="text-lg font-medium text-slate-300">Error loading flags</h3>
                        <p className="text-sm text-slate-400 max-w-md">
                          {flagsError}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : flags.filter(flag => !flag.isResolved).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Flag className="h-12 w-12 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-300">No flagged accounts found</h3>
                        <p className="text-sm text-slate-400 max-w-md">
                          When accounts require special attention, they will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  flags.filter(flag => {
                    if (flag.isResolved) return false;
                    if (activeTab === "all") return true;
                    if (activeTab === "high" && flag.priority === "high") return true;
                    if (activeTab === "medium" && flag.priority === "medium") return true;
                    if (activeTab === "low" && flag.priority === "low") return true;
                    return false;
                  }).map(flag => (
                    <tr key={flag.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{flag.accountName}</span>
                          <span className="text-xs text-slate-400">{flag.accountNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
                          {flag.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{new Date(flag.dateAdded).toLocaleDateString()}</span>
                          <span className="text-xs text-slate-400">{new Date(flag.dateAdded).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {flag.priority === "high" && (
                          <Badge className="bg-red-900/30 text-red-400 border-red-800/50">
                            High
                          </Badge>
                        )}
                        {flag.priority === "medium" && (
                          <Badge className="bg-amber-900/30 text-amber-400 border-amber-800/50">
                            Medium
                          </Badge>
                        )}
                        {flag.priority === "low" && (
                          <Badge className="bg-blue-900/30 text-blue-400 border-blue-800/50">
                            Low
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                            {flag.addedBy.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-slate-300">{flag.addedBy}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-300">0</span> of <span className="font-medium text-slate-300">{flagsData.totalFlags}</span> flags
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 bg-slate-800/30 text-slate-500"
                disabled
              >
                1
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                2
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* All Flags Table */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90 mt-6">
        <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Flags</CardTitle>
          <CardDescription>
            Complete list of all account flags in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            </div>
          ) : flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-slate-800/50 rounded-full p-4 mb-3">
                <Flag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-1">No Flags Found</h3>
              <p className="text-sm text-slate-500 max-w-md">
                There are no flags in the system yet. Create a flag to highlight important information about an account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Account</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Flag Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date Added</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Added By</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {flags.map((flag) => {
                    // Format flag type for display
                    const flagTypeDisplay = {
                      'dispute': 'Payment Dispute',
                      'legal': 'Legal Action',
                      'deceased': 'Deceased',
                      'fraud': 'Fraud Alert',
                      'trace': 'Trace Alert',
                      'special': 'Special Handling',
                      'custom': flag.type // For custom flags, use the raw type
                    }[flag.type] || flag.type;
                    
                    // Format date
                    const dateAdded = new Date(flag.dateAdded);
                    const formattedDate = dateAdded.toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                    
                    // Calculate days ago
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - dateAdded.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={flag.id} className="hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-300">{flag.accountName}</span>
                            <span className="text-xs text-slate-500">{flag.accountNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={
                              flag.type === 'dispute' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                              flag.type === 'legal' ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' :
                              flag.type === 'deceased' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' :
                              flag.type === 'fraud' ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' :
                              flag.type === 'trace' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50' :
                              'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                            }
                          >
                            {flagTypeDisplay}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-slate-300">{formattedDate}</span>
                            <span className="text-xs text-slate-500">{diffDays} days ago</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={
                              flag.priority === 'high' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                              flag.priority === 'medium' ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' :
                              'bg-blue-900/30 text-blue-400 border-blue-800/50'
                            }
                          >
                            {flag.priority.charAt(0).toUpperCase() + flag.priority.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={
                              flag.isResolved ? 
                                'bg-green-900/30 text-green-400 border-green-800/50' : 
                                'bg-slate-800/80 text-slate-300 border-slate-700/50'
                            }
                          >
                            {flag.isResolved ? 'Resolved' : 'Active'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs truncate text-slate-300 text-sm">
                            {flag.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                              {flag.addedBy.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-slate-300 text-sm">{flag.addedBy}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4 text-slate-400" />
                            </Button>
                            {!flag.isResolved && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
        <Button
          variant="outline"
          className="border-slate-800 hover:bg-slate-800/50"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All as Reviewed
        </Button>
        <Button
          variant="default"
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Flag className="h-4 w-4 mr-2" />
          Add New Flag
        </Button>
      </div>
    </div>
  );
}
