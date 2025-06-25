"use client";

import React, { useState, useMemo, useEffect } from "react";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { deletePTP } from "@/lib/ptp-service";
import * as RechartsPrimitive from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  ArrowDown,
  ArrowUp,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Users,
  BarChart,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Phone,
  ClipboardCheck,
  MessageSquare,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PTPPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // State for PTP data
  const [ptps, setPtps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ptpToDelete, setPtpToDelete] = useState<any>(null);
  
  // Get current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get the current user's ID when the component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // First try to get user from localStorage where it's stored by AuthContext
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('Found user ID in localStorage:', parsedUser.id);
            setCurrentUserId(parsedUser.id);
            return;
          }
        }
        
        // Fallback to session if localStorage doesn't have the user
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id || null;
        console.log('Current user ID from session:', userId);
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Function to mark a PTP as fulfilled
  const markAsFulfilled = async (ptpId: string, ptpType: string) => {
    try {
      // Show loading toast
      toast.loading('Updating PTP status...');
      
      // Determine which table to update based on PTP type
      const table = ptpType === 'manual' ? 'ManualPTP' : 'PTP';
      
      // Update the PTP status in the database
      const { data, error } = await supabaseAdmin
        .from(table)
        .update({ status: 'paid' })
        .eq('id', ptpId)
        .select()
        .single();
      
      if (error) {
        toast.dismiss();
        toast.error(`Failed to update PTP: ${error.message}`);
        console.error('Error updating PTP status:', error);
        return;
      }
      
      // Update the local state
      setPtps(prevPtps => 
        prevPtps.map(ptp => 
          ptp.id === ptpId ? { ...ptp, status: 'paid' } : ptp
        )
      );
      
      toast.dismiss();
      toast.success('PTP marked as fulfilled');
      
      // Create account activity for the fulfilled PTP
      try {
        await fetch('/api/account-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: data.debtor_id,
            activityType: 'status_change',
            activitySubtype: 'ptp_fulfilled',
            description: 'Promise to Pay fulfilled',
            amount: data.amount,
            createdBy: currentUserId,
            metadata: {
              ptpId: data.id,
              previousStatus: 'pending',
              newStatus: 'paid',
              paymentMethod: data.payment_method,
              fulfilledAt: new Date().toISOString()
            }
          }),
        });
      } catch (activityError) {
        console.error('Error creating account activity:', activityError);
        // Don't throw here to prevent breaking the main flow
      }
      
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Error: ${error.message}`);
      console.error('Error marking PTP as fulfilled:', error);
    }
  };

  // Function to handle showing the delete confirmation dialog
  const handleDeletePTP = (ptp: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setPtpToDelete(ptp);
    setShowDeleteDialog(true);
  };

  // Function to confirm and execute PTP deletion
  const confirmDeletePTP = async () => {
    if (!ptpToDelete) return;
    
    try {
      // Show loading toast
      toast.loading('Deleting PTP...');
      
      // Call the deletePTP function from the service
      await deletePTP(ptpToDelete.id, ptpToDelete.ptp_type);
      
      // Update the local state by removing the deleted PTP
      setPtps(prevPtps => prevPtps.filter(ptp => ptp.id !== ptpToDelete.id));
      
      // Close the dialog and clear the PTP to delete
      setShowDeleteDialog(false);
      setPtpToDelete(null);
      
      toast.dismiss();
      toast.success('PTP deleted successfully');
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to delete PTP: ${error.message}`);
      console.error('Error deleting PTP:', error);
    }
  };

  // Function to cancel PTP deletion
  const cancelDeletePTP = () => {
    setShowDeleteDialog(false);
    setPtpToDelete(null);
  };

  // Fetch PTP data from the database
  useEffect(() => {
    const fetchPTPs = async () => {
      if (!currentUserId) {
        console.log('No current user ID available, waiting to fetch PTPs');
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching PTPs for agent ID:', currentUserId);
        
        // Get regular PTPs with related debtor information
        const { data: ptpData, error: ptpError } = await supabaseAdmin
          .from('PTP')
          .select('*, Debtors(name, surname_company_trust, acc_number)')
          .eq('created_by', currentUserId)
          .order('created_at', { ascending: false });

        if (ptpError) {
          console.error('Error fetching regular PTPs:', ptpError);
        }
        
        // Get manual PTPs with related debtor information
        const { data: manualPtpData, error: manualPtpError } = await supabaseAdmin
          .from('ManualPTP')
          .select('*, Debtors(name, surname_company_trust, acc_number)')
          .eq('created_by', currentUserId)
          .order('created_at', { ascending: false });

        if (manualPtpError) {
          console.error('Error fetching manual PTPs:', manualPtpError);
        }
        
        // Combine both types of PTPs
        const allPtpData = [
          ...(ptpData || []).map(ptp => ({
            ...ptp,
            ptp_type: 'regular'
          })),
          ...(manualPtpData || []).map(ptp => ({
            ...ptp,
            ptp_type: 'manual'
          }))
        ];
        
        console.log('Fetched PTPs successfully:', allPtpData);
        
        // Get all unique agent IDs from the PTPs
        const agentIds = allPtpData
          .map(ptp => ptp.created_by)
          .filter(id => id !== null && id !== undefined);
        
        // Filter for unique IDs without using Set
        const uniqueAgentIds = agentIds.filter((id, index, self) => 
          self.indexOf(id) === index
        );
        
        // Fetch agent names from profiles table
        const agentNames: Record<string, string> = {};
        
        if (uniqueAgentIds.length > 0) {
          const { data: agentsData, error: agentsError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .in('id', uniqueAgentIds);
          
          if (agentsError) {
            console.error('Error fetching agent names:', agentsError);
          } else if (agentsData) {
            // Create a map of agent IDs to names
            agentsData.forEach(agent => {
              agentNames[agent.id] = agent.full_name || 'Unknown Agent';
            });
          }
        }
        
        // Enhance PTP data with agent names
        const enhancedPTPs = allPtpData.map(ptp => ({
          ...ptp,
          agent_name: ptp.created_by ? (agentNames[ptp.created_by] || 'Unknown Agent') : 'System'
        }));

        setPtps(enhancedPTPs);
      } catch (error) {
        console.error('Error in fetchPTPs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUserId) {
      fetchPTPs();
    }
  }, [currentUserId]);
  
  // Filter PTPs based on search term and active tab
  const filteredPTPs = useMemo(() => {
    return ptps.filter(ptp => {
      // Filter by tab
      if (activeTab !== 'all' && ptp.status !== activeTab) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const debtorName = `${ptp.Debtors?.name || ''} ${ptp.Debtors?.surname_company_trust || ''}`;
        const accountNumber = ptp.Debtors?.acc_number || '';
        const searchLower = searchTerm.toLowerCase();
        
        return (
          debtorName.toLowerCase().includes(searchLower) ||
          accountNumber.toLowerCase().includes(searchLower) ||
          ptp.id.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [ptps, activeTab, searchTerm]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | null, includeTime: boolean = false) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    }).format(date);
  };

  // Calculate days until or days late
  const calculateDaysDifference = (promiseDate: Date) => {
    const today = new Date();
    const diffTime = promiseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate metrics from actual data
  const totalPTPs = ptps.length;
  const fulfilledPTPs = ptps.filter(ptp => ptp.status === 'paid').length;
  const pendingPTPs = ptps.filter(ptp => ptp.status === 'pending').length;
  const defaultedPTPs = ptps.filter(ptp => ptp.status === 'defaulted').length;
  const totalValue = ptps.reduce((sum, ptp) => sum + (ptp.amount || 0), 0);
  
  // Calculate percentages for the pie chart
  const fulfilledPercentage = totalPTPs > 0 ? Math.round((fulfilledPTPs / totalPTPs) * 100) : 0;
  const pendingPercentage = totalPTPs > 0 ? Math.round((pendingPTPs / totalPTPs) * 100) : 0;
  const defaultedPercentage = totalPTPs > 0 ? Math.round((defaultedPTPs / totalPTPs) * 100) : 0;
  
  // Calculate stroke dash arrays for the SVG pie chart
  const circumference = 2 * Math.PI * 40; // 2πr where r=40
  const fulfilledDash = (fulfilledPercentage / 100) * circumference;
  const pendingDash = (pendingPercentage / 100) * circumference;
  const defaultedDash = (defaultedPercentage / 100) * circumference;
  
  // Calculate stroke dash offsets
  const fulfilledOffset = 0;
  const pendingOffset = -fulfilledDash;
  const defaultedOffset = -(fulfilledDash + pendingDash);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 h-8 gap-1 text-slate-400 hover:text-slate-300"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-200">Promise To Pay (Cash)</h1>
          <p className="text-slate-400">
            View and manage all cash Promise To Pay agreements with debtors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 gap-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/user/customers')}
          >
            <Plus className="h-4 w-4" />
            New PTP
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total PTPs Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total PTPs
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {totalPTPs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>12% from last month</span>
              </div>
              <Badge variant="outline" className="bg-blue-950/40 text-blue-400 border-blue-800/50">
                Mar 2025
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Growth rate</span>
                <span className="font-medium text-slate-300">78%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                  style={{ width: "78%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fulfilled PTPs Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Fulfilled PTPs
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {fulfilledPTPs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>8% from last month</span>
              </div>
              <Badge variant="outline" className="bg-green-950/40 text-green-400 border-green-800/50">
                0% of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Fulfillment rate</span>
                <span className="font-medium text-slate-300">0%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.3)]"
                  style={{ width: `0%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending PTPs Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Pending PTPs
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {pendingPTPs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Clock className="h-3 w-3" />
                <span>Due this week: 0</span>
              </div>
              <Badge variant="outline" className="bg-amber-950/40 text-amber-400 border-amber-800/50">
                0% of total
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Upcoming due</span>
                <span className="font-medium text-slate-300">0%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                  style={{ width: `0%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total Value
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {formatCurrency(totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>15% from last month</span>
              </div>
              <Badge variant="outline" className="bg-indigo-950/40 text-indigo-400 border-indigo-800/50">
                Avg: R0.00
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Collection target</span>
                <span className="font-medium text-slate-300">85%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search PTPs..."
                className="pl-9 bg-slate-950/50 border-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="w-full md:w-auto"
              >
                <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5">
                  <TabsTrigger
                    value="all"
                    className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="fulfilled"
                    className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Fulfilled
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="defaulted"
                    className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Defaulted
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Promise Date</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Amount Range</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                  >
                    <option value="all">All Amounts</option>
                    <option value="small">Under R1,000</option>
                    <option value="medium">R1,000 - R3,000</option>
                    <option value="large">Over R3,000</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Agent</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                  >
                    <option value="all">All Agents</option>
                    <option value="sarah">Sarah Johnson</option>
                    <option value="michael">Michael Chen</option>
                    <option value="jessica">Jessica Lee</option>
                    <option value="robert">Robert Kim</option>
                    <option value="emma">Emma Davis</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Sort By</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                  >
                    <option value="date-desc">Promise Date (Newest)</option>
                    <option value="date-asc">Promise Date (Oldest)</option>
                    <option value="amount-desc">Amount (Highest)</option>
                    <option value="amount-asc">Amount (Lowest)</option>
                    <option value="name">Customer Name</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* PTP Transactions Table */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">PTP Transactions</CardTitle>
          <CardDescription>
            All cash PTP transactions with debtors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name, account or reference..."
                className="pl-8 bg-slate-800/50 border-slate-700 text-slate-300 placeholder:text-slate-500 focus-visible:ring-blue-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-1 border-slate-800",
                  showFilters ? "bg-slate-800 text-slate-200" : "hover:bg-slate-800/50"
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-slate-800/50 border border-slate-700/50 h-9">
                  <TabsTrigger value="all" className="h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="fulfilled" className="h-7 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                    Fulfilled
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="h-7 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="defaulted" className="h-7 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    Defaulted
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-800/80">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Date Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      dateFilter === "all" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setDateFilter("all")}
                  >
                    All Time
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      dateFilter === "week" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setDateFilter("week")}
                  >
                    This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      dateFilter === "month" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setDateFilter("month")}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      dateFilter === "overdue" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setDateFilter("overdue")}
                  >
                    Overdue
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Amount</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      amountFilter === "all" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setAmountFilter("all")}
                  >
                    All Amounts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      amountFilter === "small" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setAmountFilter("small")}
                  >
                    &lt; R1,000
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      amountFilter === "medium" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setAmountFilter("medium")}
                  >
                    R1,000 - R3,000
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 border-slate-800 hover:bg-slate-800/50",
                      amountFilter === "large" && "bg-slate-800 text-slate-200"
                    )}
                    onClick={() => setAmountFilter("large")}
                  >
                    &gt; R3,000
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col justify-between">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Actions</h4>
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-800 hover:bg-slate-800/50 flex-1"
                    onClick={() => {
                      setDateFilter("all");
                      setAmountFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 flex-1"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Transactions Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Promise Date</th>
                  <th className="py-3 px-4 text-left">Created Date</th>
                  <th className="py-3 px-4 text-left">Payment Method</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Agent</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-10 w-10 text-slate-600 mb-2 animate-spin" />
                        <p>Loading PTP agreements...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPTPs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ClipboardCheck className="h-10 w-10 text-slate-600 mb-2" />
                        <p>No Promise To Pay agreements found</p>
                        <p className="text-xs text-slate-500">Create a new PTP agreement using the button above</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPTPs.map((ptp) => (
                    <tr key={ptp.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                        {ptp.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">
                            {ptp.Debtors?.name} {ptp.Debtors?.surname_company_trust}
                          </span>
                          <span className="text-xs text-slate-400">
                            Acc: {ptp.Debtors?.acc_number}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {formatCurrency(ptp.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">
                            {formatDate(new Date(ptp.date))}
                          </span>
                          {ptp.status !== 'paid' && (
                            calculateDaysDifference(new Date(ptp.date)) > 0 ? (
                              <span className="text-xs text-amber-400">
                                Due in {calculateDaysDifference(new Date(ptp.date))} days
                              </span>
                            ) : (
                              <span className="text-xs text-red-400">
                                Overdue by {Math.abs(calculateDaysDifference(new Date(ptp.date)))} days
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">
                            {formatDate(new Date(ptp.created_at), true)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(ptp.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Badge
                            className={cn(
                              "px-2 py-0.5 capitalize",
                              ptp.payment_method === 'cash' && "bg-green-600/20 text-green-400",
                              ptp.payment_method === 'eft' && "bg-blue-600/20 text-blue-400",
                              ptp.payment_method === 'easypay' && "bg-purple-600/20 text-purple-400"
                            )}
                          >
                            {ptp.payment_method || 'Unknown'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "px-2 py-0.5",
                              ptp.status === 'paid' && "bg-green-600/20 text-green-400 hover:bg-green-600/30",
                              ptp.status === 'pending' && "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30",
                              ptp.status === 'defaulted' && "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                            )}
                          >
                            {ptp.status === 'paid' ? 'Fulfilled' : 
                             ptp.status === 'pending' ? 'Pending' : 'Defaulted'}
                          </Badge>
                          {ptp.ptp_type === 'manual' && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="text-xs">{ptp.agent_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                            onClick={() => router.push(`/user/customers/${ptp.debtor_id}`)}
                            title="View customer profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {ptp.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-green-300 hover:bg-green-900/30"
                              onClick={() => markAsFulfilled(ptp.id, ptp.ptp_type)}
                              title="Mark as fulfilled"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-300 hover:bg-red-900/30"
                            onClick={(e) => handleDeletePTP(ptp, e)}
                            title="Delete PTP"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-300">{filteredPTPs.length}</span> of <span className="font-medium text-slate-300">{ptps.length}</span> PTPs
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
                className="h-8 w-8 p-0 border-slate-800 bg-blue-600 text-white hover:bg-blue-700"
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PTP Status Distribution */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">PTP Status</CardTitle>
            <CardDescription>
              Distribution of PTP statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-52">
              <div className="relative w-44 h-44">
                {/* Status Distribution Donut Chart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background Circle */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="12" 
                    />
                    
                    {/* Fulfilled Segment */}
                    <g className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
                      <title>Fulfilled: {fulfilledPTPs} PTPs ({fulfilledPercentage}%)</title>
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="url(#fulfilledGradient)" 
                        strokeWidth="12" 
                        strokeDasharray={`${fulfilledDash} ${circumference}`}
                        strokeDashoffset={`${fulfilledOffset}`} 
                        transform="rotate(-90 50 50)" 
                        strokeLinecap="round"
                      />
                    </g>
                    
                    {/* Pending Segment */}
                    <g className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
                      <title>Pending: {pendingPTPs} PTPs ({pendingPercentage}%)</title>
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="url(#pendingGradient)" 
                        strokeWidth="12" 
                        strokeDasharray={`${pendingDash} ${circumference}`}
                        strokeDashoffset={`${pendingOffset}`} 
                        transform="rotate(-90 50 50)" 
                        strokeLinecap="round"
                      />
                    </g>
                    
                    {/* Defaulted Segment */}
                    <g className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
                      <title>Defaulted: {defaultedPTPs} PTPs ({defaultedPercentage}%)</title>
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="url(#defaultedGradient)" 
                        strokeWidth="12" 
                        strokeDasharray={`${defaultedDash} ${circumference}`}
                        strokeDashoffset={`${defaultedOffset}`} 
                        transform="rotate(-90 50 50)" 
                        strokeLinecap="round"
                      />
                    </g>
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="fulfilledGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                      <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                      <linearGradient id="defaultedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-200">
                    {fulfilledPercentage}%
                  </span>
                  <span className="text-xs text-slate-400">Fulfilled</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Fulfilled</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{fulfilledPTPs}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Pending</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{pendingPTPs}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Defaulted</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{defaultedPTPs}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* PTP Trends */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">PTP Trends</CardTitle>
            <CardDescription>
              Monthly PTP performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {/* Bar Chart */}
              <div className="h-[220px] w-full">
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                  <RechartsPrimitive.BarChart
                    data={[
                      { month: 'Jan', total: 8, fulfilled: 5 },
                      { month: 'Feb', total: 9, fulfilled: 6 },
                      { month: 'Mar', total: 10, fulfilled: 7 },
                      { month: 'Apr', total: 11, fulfilled: 8 },
                      { month: 'May', total: 12, fulfilled: 9 }
                    ]}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    barGap={2}
                  >
                    <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <RechartsPrimitive.XAxis 
                      dataKey="month" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <RechartsPrimitive.YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                      domain={[0, 'dataMax + 2']}
                    />
                    <RechartsPrimitive.Tooltip 
                      cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-800 border border-slate-700 rounded-md p-2 shadow-md">
                              <p className="text-slate-300 text-xs font-medium mb-1">{payload[0].payload.month}</p>
                              <p className="text-blue-400 text-xs">Total: {payload[0].value}</p>
                              <p className="text-green-400 text-xs">Fulfilled: {payload[1].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <RechartsPrimitive.Bar 
                      dataKey="total" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                    />
                    <RechartsPrimitive.Bar 
                      dataKey="fulfilled" 
                      fill="#22c55e" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                    />
                  </RechartsPrimitive.BarChart>
                </RechartsPrimitive.ResponsiveContainer>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                  <span className="text-xs text-slate-300">Fulfilled PTPs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                  <span className="text-xs text-slate-300">Total PTPs</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Delete PTP Agreement?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete this Promise To Pay agreement. This action cannot be undone.
              {ptpToDelete && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-slate-300">{ptpToDelete.Debtors?.name} {ptpToDelete.Debtors?.surname_company_trust}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-300">{formatCurrency(ptpToDelete.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">PTP ID:</span>
                    <span className="text-slate-300">{ptpToDelete.id.substring(0, 8)}...</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              onClick={cancelDeletePTP}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeletePTP}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
