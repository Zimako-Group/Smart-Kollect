"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Download,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Eye,
  Trash2,
  UserCheck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AdminFlag {
  id: string;
  customer_id: string;
  type: string;
  priority: "high" | "medium" | "low";
  notes: string;
  created_at: string;
  created_by: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  // Joined data
  customerName?: string;
  customerAccount?: string;
  createdByName?: string;
  resolvedByName?: string;
}

export default function AdminFlagsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<AdminFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<AdminFlag[]>([]);
  
  // Filter states
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch flags data
  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      
      // Fetch flags with related data
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
        toast.error("Failed to fetch flags", {
          description: "There was an error loading the flags data."
        });
        return;
      }

      // Get unique customer IDs and user IDs
      const customerIds = [...new Set(flagsData.map(flag => flag.customer_id))];
      const userIds = [...new Set([
        ...flagsData.map(flag => flag.created_by),
        ...flagsData.filter(flag => flag.resolved_by).map(flag => flag.resolved_by)
      ].filter(id => id))];

      // Fetch customer data
      const { data: customersData } = await supabase
        .from('Debtors')
        .select('id, name, acc_number')
        .in('id', customerIds);

      // Fetch user data
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Create lookup maps
      const customersMap = (customersData || []).reduce((map, customer) => {
        map[customer.id] = customer;
        return map;
      }, {} as Record<string, any>);

      const usersMap = (usersData || []).reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {} as Record<string, any>);

      // Transform flags with joined data
      const transformedFlags: AdminFlag[] = flagsData.map(flag => ({
        ...flag,
        customerName: customersMap[flag.customer_id]?.name || 'Unknown Customer',
        customerAccount: customersMap[flag.customer_id]?.acc_number || 'N/A',
        createdByName: usersMap[flag.created_by]?.full_name || 'Unknown User',
        resolvedByName: flag.resolved_by ? usersMap[flag.resolved_by]?.full_name : undefined,
      }));

      setFlags(transformedFlags);
      setFilteredFlags(transformedFlags);
      
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error("Failed to fetch flags", {
        description: "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter flags based on current filters
  useEffect(() => {
    let filtered = [...flags];

    // Tab filter
    if (activeTab === "active") {
      filtered = filtered.filter(f => !f.is_resolved);
    } else if (activeTab === "resolved") {
      filtered = filtered.filter(f => f.is_resolved);
    } else if (activeTab === "high") {
      filtered = filtered.filter(f => f.priority === 'high' && !f.is_resolved);
    } else if (activeTab === "medium") {
      filtered = filtered.filter(f => f.priority === 'medium' && !f.is_resolved);
    } else if (activeTab === "low") {
      filtered = filtered.filter(f => f.priority === 'low' && !f.is_resolved);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.customerName?.toLowerCase().includes(term) ||
        f.customerAccount?.toLowerCase().includes(term) ||
        f.type.toLowerCase().includes(term) ||
        f.notes.toLowerCase().includes(term) ||
        f.createdByName?.toLowerCase().includes(term)
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(f => f.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(f => f.type.toLowerCase().includes(typeFilter.toLowerCase()));
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (dateRange !== "all") {
        filtered = filtered.filter(f => new Date(f.created_at) >= filterDate);
      }
    }

    setFilteredFlags(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [flags, activeTab, searchTerm, priorityFilter, typeFilter, dateRange]);

  // Calculate statistics
  const stats = {
    total: flags.length,
    active: flags.filter(f => !f.is_resolved).length,
    resolved: flags.filter(f => f.is_resolved).length,
    highPriority: flags.filter(f => f.priority === 'high' && !f.is_resolved).length,
    mediumPriority: flags.filter(f => f.priority === 'medium' && !f.is_resolved).length,
    lowPriority: flags.filter(f => f.priority === 'low' && !f.is_resolved).length,
  };

  // Get unique flag types for filter dropdown
  const flagTypes = [...new Set(flags.map(f => f.type))].sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredFlags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFlags = filteredFlags.slice(startIndex, endIndex);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setPriorityFilter("all");
    setTypeFilter("all");
    setDateRange("all");
    setActiveTab("all");
  };

  // Resolve flag function
  const resolveFlag = async (flagId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      
      const { error } = await supabase
        .from('flags')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: 'current-admin-id' // Replace with actual admin ID
        })
        .eq('id', flagId);

      if (error) {
        console.error('Error resolving flag:', error);
        toast.error("Failed to resolve flag", {
          description: "There was an error resolving the flag."
        });
        return;
      }

      // Update local state
      setFlags(prevFlags => 
        prevFlags.map(flag => 
          flag.id === flagId 
            ? { 
                ...flag, 
                is_resolved: true, 
                resolved_at: new Date().toISOString(),
                resolved_by: 'current-admin-id'
              }
            : flag
        )
      );

      toast.success("Flag resolved successfully", {
        description: "The flag has been marked as resolved."
      });

    } catch (error) {
      console.error('Error resolving flag:', error);
      toast.error("Failed to resolve flag", {
        description: "An unexpected error occurred."
      });
    }
  };

  // Delete flag function
  const deleteFlag = async (flagId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      
      const { error } = await supabase
        .from('flags')
        .delete()
        .eq('id', flagId);

      if (error) {
        console.error('Error deleting flag:', error);
        toast.error("Failed to delete flag", {
          description: "There was an error deleting the flag."
        });
        return;
      }

      // Update local state
      setFlags(prevFlags => prevFlags.filter(flag => flag.id !== flagId));

      toast.success("Flag deleted successfully", {
        description: "The flag has been permanently removed."
      });

    } catch (error) {
      console.error('Error deleting flag:', error);
      toast.error("Failed to delete flag", {
        description: "An unexpected error occurred."
      });
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'low': return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  };

  // Get flag type color
  const getFlagTypeColor = (type: string) => {
    const colors = [
      'bg-blue-600/20 text-blue-400 border-blue-600/30',
      'bg-purple-600/20 text-purple-400 border-purple-600/30',
      'bg-green-600/20 text-green-400 border-green-600/30',
      'bg-orange-600/20 text-orange-400 border-orange-600/30',
      'bg-pink-600/20 text-pink-400 border-pink-600/30',
      'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
    ];
    const index = type.length % colors.length;
    return colors[index];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate comprehensive flags report
  const generateReport = async () => {
    try {
      toast.info("Generating report...", {
        description: "Please wait while we compile your flags report."
      });

      // Prepare report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Admin User', // Replace with actual admin name
        totalFlags: stats.total,
        activeFlags: stats.active,
        resolvedFlags: stats.resolved,
        highPriorityFlags: stats.highPriority,
        mediumPriorityFlags: stats.mediumPriority,
        lowPriorityFlags: stats.lowPriority,
        
        // Flag type breakdown
        flagTypeBreakdown: flagTypes.map(type => ({
          type,
          count: flags.filter(f => f.type === type).length,
          active: flags.filter(f => f.type === type && !f.is_resolved).length,
          resolved: flags.filter(f => f.type === type && f.is_resolved).length
        })),
        
        // Recent activity (last 30 days)
        recentActivity: {
          created: flags.filter(f => {
            const createdDate = new Date(f.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdDate >= thirtyDaysAgo;
          }).length,
          resolved: flags.filter(f => {
            if (!f.resolved_at) return false;
            const resolvedDate = new Date(f.resolved_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return resolvedDate >= thirtyDaysAgo;
          }).length
        },
        
        // Top creators
        topCreators: Object.entries(
          flags.reduce((acc, flag) => {
            const creator = flag.createdByName || 'Unknown';
            acc[creator] = (acc[creator] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
        
        // Resolution performance
        resolutionPerformance: {
          averageResolutionTime: calculateAverageResolutionTime(),
          resolutionRate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0'
        },
        
        // Detailed flags data (filtered)
        flagsData: filteredFlags.map(flag => ({
          customerName: flag.customerName,
          customerAccount: flag.customerAccount,
          type: flag.type,
          priority: flag.priority,
          status: flag.is_resolved ? 'Resolved' : 'Active',
          createdAt: formatDate(flag.created_at),
          createdBy: flag.createdByName,
          resolvedAt: flag.resolved_at ? formatDate(flag.resolved_at) : null,
          resolvedBy: flag.resolvedByName || null,
          notes: flag.notes
        }))
      };

      // Generate and download the report
      await downloadReport(reportData);
      
      toast.success("Report generated successfully!", {
        description: "Your flags report has been downloaded."
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Failed to generate report", {
        description: "There was an error creating the report. Please try again."
      });
    }
  };

  // Calculate average resolution time
  const calculateAverageResolutionTime = () => {
    const resolvedFlags = flags.filter(f => f.is_resolved && f.resolved_at);
    if (resolvedFlags.length === 0) return 'N/A';
    
    const totalTime = resolvedFlags.reduce((acc, flag) => {
      const created = new Date(flag.created_at);
      const resolved = new Date(flag.resolved_at!);
      const diffDays = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return acc + diffDays;
    }, 0);
    
    const average = Math.round(totalTime / resolvedFlags.length);
    return `${average} days`;
  };

  // Download report as CSV/JSON
  const downloadReport = async (reportData: any) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Create CSV content
    const csvContent = generateCSVContent(reportData);
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `flags-report-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate CSV content
  const generateCSVContent = (reportData: any) => {
    let csv = 'Flags Management Report\n\n';
    
    // Report header
    csv += `Generated At,${new Date(reportData.generatedAt).toLocaleString()}\n`;
    csv += `Generated By,${reportData.generatedBy}\n\n`;
    
    // Summary statistics
    csv += 'SUMMARY STATISTICS\n';
    csv += `Total Flags,${reportData.totalFlags}\n`;
    csv += `Active Flags,${reportData.activeFlags}\n`;
    csv += `Resolved Flags,${reportData.resolvedFlags}\n`;
    csv += `High Priority,${reportData.highPriorityFlags}\n`;
    csv += `Medium Priority,${reportData.mediumPriorityFlags}\n`;
    csv += `Low Priority,${reportData.lowPriorityFlags}\n`;
    csv += `Resolution Rate,${reportData.resolutionPerformance.resolutionRate}%\n`;
    csv += `Average Resolution Time,${reportData.resolutionPerformance.averageResolutionTime}\n\n`;
    
    // Flag type breakdown
    csv += 'FLAG TYPE BREAKDOWN\n';
    csv += 'Type,Total,Active,Resolved\n';
    reportData.flagTypeBreakdown.forEach((item: any) => {
      csv += `${item.type},${item.count},${item.active},${item.resolved}\n`;
    });
    csv += '\n';
    
    // Recent activity
    csv += 'RECENT ACTIVITY (Last 30 Days)\n';
    csv += `Flags Created,${reportData.recentActivity.created}\n`;
    csv += `Flags Resolved,${reportData.recentActivity.resolved}\n\n`;
    
    // Top creators
    csv += 'TOP FLAG CREATORS\n';
    csv += 'Name,Count\n';
    reportData.topCreators.forEach((creator: any) => {
      csv += `${creator.name},${creator.count}\n`;
    });
    csv += '\n';
    
    // Detailed flags data
    csv += 'DETAILED FLAGS DATA\n';
    csv += 'Customer Name,Account Number,Flag Type,Priority,Status,Created At,Created By,Resolved At,Resolved By,Notes\n';
    reportData.flagsData.forEach((flag: any) => {
      csv += `"${flag.customerName}","${flag.customerAccount}","${flag.type}","${flag.priority}","${flag.status}","${flag.createdAt}","${flag.createdBy}","${flag.resolvedAt || ''}","${flag.resolvedBy || ''}","${flag.notes?.replace(/"/g, '""') || ''}"\n`;
    });
    
    return csv;
  };

  // Export filtered data
  const exportData = async () => {
    try {
      toast.info("Exporting data...", {
        description: "Preparing your filtered data for download."
      });

      const timestamp = new Date().toISOString().split('T')[0];
      
      // Create simplified CSV for current filtered data
      let csv = 'Customer Name,Account Number,Flag Type,Priority,Status,Created At,Created By,Resolved At,Resolved By,Notes\n';
      
      filteredFlags.forEach(flag => {
        csv += `"${flag.customerName}","${flag.customerAccount}","${flag.type}","${flag.priority}","${flag.is_resolved ? 'Resolved' : 'Active'}","${formatDate(flag.created_at)}","${flag.createdByName}","${flag.resolved_at ? formatDate(flag.resolved_at) : ''}","${flag.resolvedByName || ''}","${flag.notes?.replace(/"/g, '""') || ''}"\n`;
      });
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `flags-export-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully!", {
        description: `${filteredFlags.length} flags exported to CSV.`
      });

    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export data", {
        description: "There was an error exporting the data."
      });
    }
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
            onClick={() => router.push('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Flags Management</h1>
            <p className="text-sm text-slate-400">Monitor and manage all customer flags</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportData}
            className="border-slate-800 hover:bg-slate-800/50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="default"
            onClick={generateReport}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Total Flags */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Flags</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-blue-400">
              <Flag className="h-3 w-3 mr-1" />
              All time
            </div>
          </CardContent>
        </Card>

        {/* Active Flags */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Active Flags</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs attention
            </div>
          </CardContent>
        </Card>

        {/* Resolved Flags */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Resolved</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </div>
          </CardContent>
        </Card>

        {/* High Priority */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">High Priority</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.highPriority}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              Urgent
            </div>
          </CardContent>
        </Card>

        {/* Medium Priority */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Medium Priority</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.mediumPriority}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-yellow-400">
              <Clock className="h-3 w-3 mr-1" />
              Monitor
            </div>
          </CardContent>
        </Card>

        {/* Low Priority */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-gray-600 to-gray-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Low Priority</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">{stats.lowPriority}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Routine
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-200">Advanced Filters</CardTitle>
              <CardDescription className="text-slate-400">
                Filter and search through {flags.length} flags
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-slate-700 hover:bg-slate-800/50 text-slate-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer name, account, flag type, notes, or created by..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Flag Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  {flagTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Items per Page</label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-200">Flags Management</CardTitle>
          <CardDescription className="text-slate-400">
            Showing {filteredFlags.length} of {flags.length} flags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-slate-700">
                Active ({stats.active})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-slate-700">
                Resolved ({stats.resolved})
              </TabsTrigger>
              <TabsTrigger value="high" className="data-[state=active]:bg-slate-700">
                High ({stats.highPriority})
              </TabsTrigger>
              <TabsTrigger value="medium" className="data-[state=active]:bg-slate-700">
                Medium ({stats.mediumPriority})
              </TabsTrigger>
              <TabsTrigger value="low" className="data-[state=active]:bg-slate-700">
                Low ({stats.lowPriority})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <span className="ml-2 text-slate-400">Loading flags...</span>
                </div>
              ) : filteredFlags.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No flags found</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Flags Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Flag Type</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Priority</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Created</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Created By</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-300">Notes</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFlags.map((flag) => (
                          <tr key={flag.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            {/* Customer */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-200">{flag.customerName}</span>
                                <span className="text-sm text-slate-400">#{flag.customerAccount}</span>
                              </div>
                            </td>

                            {/* Flag Type */}
                            <td className="py-4 px-4">
                              <Badge className={`${getFlagTypeColor(flag.type)} border`}>
                                {flag.type}
                              </Badge>
                            </td>

                            {/* Priority */}
                            <td className="py-4 px-4">
                              <Badge className={`${getPriorityColor(flag.priority)} border`}>
                                {flag.priority.toUpperCase()}
                              </Badge>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {flag.is_resolved ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="text-green-400 text-sm">Resolved</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                  <span className="text-amber-400 text-sm">Active</span>
                                </div>
                              )}
                            </td>

                            {/* Created */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-200">{formatDate(flag.created_at)}</span>
                                {flag.is_resolved && flag.resolved_at && (
                                  <span className="text-xs text-green-400">
                                    Resolved: {formatDate(flag.resolved_at)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Created By */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-200">{flag.createdByName}</span>
                                {flag.is_resolved && flag.resolvedByName && (
                                  <span className="text-xs text-green-400">
                                    Resolved by: {flag.resolvedByName}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Notes */}
                            <td className="py-4 px-4 max-w-xs">
                              <p className="text-sm text-slate-300 truncate" title={flag.notes}>
                                {flag.notes || 'No notes'}
                              </p>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-slate-700 hover:bg-slate-700"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {!flag.is_resolved && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resolveFlag(flag.id)}
                                    className="h-8 w-8 p-0 border-green-700 hover:bg-green-700/20 text-green-400"
                                    title="Resolve Flag"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteFlag(flag.id)}
                                  className="h-8 w-8 p-0 border-red-700 hover:bg-red-700/20 text-red-400"
                                  title="Delete Flag"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
                      <div className="text-sm text-slate-400">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredFlags.length)} of {filteredFlags.length} flags
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="border-slate-700 hover:bg-slate-800/50"
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="border-slate-700 hover:bg-slate-800/50"
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={currentPage === pageNum 
                                  ? "bg-rose-600 hover:bg-rose-700" 
                                  : "border-slate-700 hover:bg-slate-800/50"
                                }
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="border-slate-700 hover:bg-slate-800/50"
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="border-slate-700 hover:bg-slate-800/50"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
