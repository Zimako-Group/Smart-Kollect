"use client";

import React from "react";
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
  Info,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  User,
  UserCheck,
  UserX,
  Phone,
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
      { type: "Fraud Alert", count: flags.filter(flag => (flag.type === "fraud" || flag.type === "Fraud Alert") && !flag.isResolved).length },
      { type: "Legal Action", count: flags.filter(flag => (flag.type === "legal" || flag.type === "Legal Action") && !flag.isResolved).length },
      { type: "Payment Dispute", count: flags.filter(flag => (flag.type === "dispute" || flag.type === "Payment Dispute") && !flag.isResolved).length },
      { type: "Bankruptcy", count: flags.filter(flag => (flag.type === "bankruptcy" || flag.type === "Bankruptcy") && !flag.isResolved).length },
      { type: "Deceased", count: flags.filter(flag => (flag.type === "deceased" || flag.type === "Deceased") && !flag.isResolved).length },
      { type: "Trace Alert", count: flags.filter(flag => (flag.type === "trace" || flag.type === "Trace Alert") && !flag.isResolved).length },
      { type: "Special Handling", count: flags.filter(flag => (flag.type === "special" || flag.type === "Special Handling") && !flag.isResolved).length },
      { type: "No Contact Details", count: flags.filter(flag => (flag.type === "no contact details" || flag.type === "No Contact Details") && !flag.isResolved).length }
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

  // Filter flags based on active tab
  const filteredFlags = flags.filter(flag => {
    switch (activeTab) {
      case "high":
        return flag.priority === "high" && !flag.isResolved;
      case "medium":
        return flag.priority === "medium" && !flag.isResolved;
      case "low":
        return flag.priority === "low" && !flag.isResolved;
      case "resolved":
        return flag.isResolved;
      default: // "all"
        return !flag.isResolved;
    }
  });

  // Pagination calculations
  const totalItems = filteredFlags.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFlags = filteredFlags.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
                  "from-red-600 to-red-400",      // Fraud Alert
                  "from-amber-600 to-amber-400",  // Legal Action
                  "from-blue-600 to-blue-400",   // Payment Dispute
                  "from-purple-600 to-purple-400", // Bankruptcy
                  "from-cyan-600 to-cyan-400",   // Deceased
                  "from-emerald-600 to-emerald-400", // Trace Alert
                  "from-pink-600 to-pink-400",   // Special Handling
                  "from-orange-600 to-orange-400" // Custom Flag
                ];
                const colorClass = colors[index % colors.length];
                // Handle division by zero and ensure percentage is valid
                const percentage = flagsData.totalFlags > 0 ? (item.count / flagsData.totalFlags) * 100 : 0;
                const safePercentage = isNaN(percentage) ? 0 : percentage;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${colorClass}`}></div>
                        <span className="text-sm text-slate-300">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{item.count}</span>
                        <span className="text-xs text-slate-400">({safePercentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.max(0, Math.min(100, safePercentage))}%` }}
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
                      
                      // Prevent division by zero
                      if (total === 0) {
                        return null; // Skip rendering this segment if total is zero
                      }
                      
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
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-100">Flagged Accounts</CardTitle>
              <CardDescription className="text-slate-400">
                Accounts requiring special attention
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 hover:bg-slate-800/50 text-slate-300 hover:text-slate-100"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                This Month
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Flag className="h-4 w-4 mr-1.5" />
                Add Flag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="mb-6 mt-2 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search by account name, number or flag type..."
                className="pl-10 bg-slate-950/50 border-slate-800 h-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 hover:bg-slate-800/50 h-10 px-3"
              >
                <Filter className="h-4 w-4 mr-1.5" />
                <span>Filters</span>
              </Button>
              <select 
                className="h-10 px-3 rounded-md bg-slate-950/50 border border-slate-800 text-slate-300 text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">Priority (High-Low)</option>
              </select>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="mb-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              className="w-full"
            >
              <TabsList className="h-10 bg-slate-950/50 border border-slate-800/70 p-1 w-full sm:w-auto grid grid-cols-4 sm:flex gap-1 rounded-md">
                <TabsTrigger
                  value="all"
                  className="h-8 px-4 rounded-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-150"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5" />
                    <span>All <span className="font-semibold ml-1">({flagsData.totalFlags})</span></span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="high"
                  className="h-8 px-4 rounded-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-150"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>High <span className="font-semibold ml-1">({flagsData.highPriority})</span></span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="medium"
                  className="h-8 px-4 rounded-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-150"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Medium <span className="font-semibold ml-1">({flagsData.mediumPriority})</span></span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="low"
                  className="h-8 px-4 rounded-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-150"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    <span>Low <span className="font-semibold ml-1">({flagsData.lowPriority})</span></span>
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
                    {/* Table */}
          <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Flag Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Date Added</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Notes</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Added By</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading || flagsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
                          <h3 className="text-lg font-medium text-slate-300">Loading flags...</h3>
                        </div>
                      </td>
                    </tr>
                  ) : flagsError ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
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
                      <td colSpan={8} className="py-16 text-center">
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
                    currentFlags.map(flag => {
                      // Format date and calculate days ago
                      const flagDate = new Date(flag.dateAdded);
                      const formattedDate = flagDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      
                      const today = new Date();
                      const diffTime = Math.abs(today.getTime() - flagDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      // Determine flag type display and styling
                      let flagTypeDisplay = flag.type;
                      let flagTypeClass = "bg-slate-800/50 text-slate-300 border-slate-700";
                      
                      if (flag.type === "Special Handling") {
                        flagTypeDisplay = "Special Handling";
                        flagTypeClass = "bg-purple-900/30 text-purple-400 border-purple-800/50";
                      } else if (flag.type === "Payment Issue") {
                        flagTypeDisplay = "Payment Issue";
                        flagTypeClass = "bg-rose-900/30 text-rose-400 border-rose-800/50";
                      } else if (flag.type === "Legal") {
                        flagTypeDisplay = "Legal";
                        flagTypeClass = "bg-cyan-900/30 text-cyan-400 border-cyan-800/50";
                      } else if (flag.type === "Dispute") {
                        flagTypeDisplay = "Dispute";
                        flagTypeClass = "bg-amber-900/30 text-amber-400 border-amber-800/50";
                      }
                      
                      return (
                        <tr 
                          key={flag.id} 
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors duration-150"
                        >
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-200">{flag.accountName}</span>
                              <span className="text-xs text-slate-400">{flag.accountNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline" 
                              className={`${flagTypeClass} whitespace-nowrap`}
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!flag.isResolved && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                  title="Mark as resolved"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                title="Delete flag"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 order-2 sm:order-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Rows per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="h-8 px-2 rounded-md bg-slate-950/50 border border-slate-800 text-slate-300 text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-slate-200">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> of <span className="font-medium text-slate-200">{totalItems}</span> flags
              </div>
            </div>
            
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-1">
                {/* Generate page numbers dynamically */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  const isCurrentPage = pageNumber === currentPage;
                  
                  return (
                    <Button 
                      key={pageNumber}
                      variant="outline" 
                      size="sm" 
                      onClick={() => goToPage(pageNumber)}
                      className={`h-9 w-9 p-0 border-slate-800 font-medium ${
                        isCurrentPage 
                          ? "bg-rose-600/20 border-rose-600/50 text-rose-100" 
                          : "hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-slate-600 px-1">...</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => goToPage(totalPages)}
                      className="h-9 w-9 p-0 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
