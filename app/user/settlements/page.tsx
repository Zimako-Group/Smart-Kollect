"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getSettlements, updateSettlement, deleteSettlement } from "@/lib/settlement-service";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
  BadgePercent,
  CheckCircle,
  Clock,
  XCircle,
  PieChart,
  BarChart3,
  DollarSign,
  Percent,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function SettlementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settlementToUpdate, setSettlementToUpdate] = useState<Settlement | null>(null);
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);

  // Helper functions for formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Define the settlement type
  type Settlement = {
    id: string;
    customerName: string;
    accountNumber: string;
    reference?: string;
    date: Date;
    amount: number;
    status: string;
    settlementType: "Full" | "Partial";
    paymentMethod?: string;
    agentName: string;
    originalAmount: number;
    settlementAmount: number;
    discountPercentage: number;
    description?: string;
    expiryDate: string;
    customerId: string;
  };

  // Create a state to track when to refresh data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to load agent-specific settlements
  useEffect(() => {
    const loadAgentSettlements = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('Fetching fresh settlements data...');
        const allSettlements = await getSettlements();
        
        // Filter settlements to only show those created by the current agent
        const agentSettlements = allSettlements
          .filter((settlement: any) => settlement.agent_name === user.name)
          .map((settlement: any) => ({
            id: settlement.id,
            customerId: settlement.customer_id,
            customerName: settlement.customer_name,
            accountNumber: settlement.account_number,
            reference: settlement.id.substring(0, 8),
            date: new Date(settlement.created_at),
            amount: settlement.settlement_amount,
            status: settlement.status.toLowerCase(), // Ensure consistent lowercase status values
            settlementType: settlement.discount_percentage < 100 ? "Partial" as const : "Full" as const,
            paymentMethod: "Bank Transfer", // Default value since we don't have this in the DB yet
            agentName: settlement.agent_name,
            originalAmount: settlement.original_amount,
            settlementAmount: settlement.settlement_amount,
            discountPercentage: settlement.discount_percentage,
            description: settlement.description,
            expiryDate: settlement.expiry_date
          }));
        
        setSettlements(agentSettlements);
      } catch (error) {
        console.error('Error loading agent settlements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAgentSettlements();

    // Add event listener for page visibility changes to refresh data when returning to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshTrigger]);

  // Calculate summary metrics from real data
  const totalSettlements = settlements.length;
  const completedSettlements = settlements.filter(s => s.status === "completed").length;
  const pendingSettlements = settlements.filter(s => s.status === "pending").length;
  const failedSettlements = settlements.filter(s => s.status === "rejected").length;
  const totalValue = settlements.reduce((sum, s) => sum + s.amount, 0);
  const completedValue = settlements.filter(s => s.status === "completed").reduce((sum, s) => sum + s.amount, 0);
  const pendingValue = settlements.filter(s => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);

  // Settlement types breakdown
  const fullSettlements = settlements.filter(s => s.settlementType === "Full").length;
  const partialSettlements = settlements.filter(s => s.settlementType === "Partial").length;

  // Filter settlements based on search and filters
  const filteredSettlements = useMemo(() => {
    return settlements.filter(settlement => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        settlement.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.accountNumber.includes(searchTerm) ||
        (settlement.reference && settlement.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by tab
      const matchesTab = 
        activeTab === "all" || 
        (activeTab === "completed" && settlement.status === "completed") ||
        (activeTab === "pending" && settlement.status === "pending") ||
        (activeTab === "failed" && settlement.status === "rejected");
      
      // Filter by date
      const matchesDate = dateFilter === "all";
      
      // Filter by amount
      const matchesAmount = amountFilter === "all";
      
      return matchesSearch && matchesTab && matchesDate && matchesAmount;
    });
  }, [settlements, searchTerm, activeTab, dateFilter, amountFilter]);

  // Toggle expanded state for a settlement
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle showing the confirmation dialog for updating settlement status
  const handleUpdateStatus = (settlement: Settlement, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion when clicking the button
    
    if (settlement.status !== 'pending') {
      return; // Only allow updating pending settlements
    }
    
    // Set the settlement to update and show the confirmation dialog
    setSettlementToUpdate(settlement);
    setShowConfirmDialog(true);
  };
  
  // Handle showing the confirmation dialog for deleting a settlement
  const handleDeleteSettlement = (settlement: Settlement, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion when clicking the button
    
    setSettlementToDelete(settlement);
    setShowDeleteDialog(true);
  };

  // Handle confirming the status update
  const confirmStatusUpdate = async () => {
    if (!settlementToUpdate) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Update the settlement status in the database
      await updateSettlement(settlementToUpdate.id, { status: 'completed' });
      
      // Update the local state
      const updatedSettlements = settlements.map(s => 
        s.id === settlementToUpdate.id ? { ...s, status: 'completed' } : s
      );
      
      setSettlements(updatedSettlements);
      
      // Show success message (you could add a toast notification here)
      console.log(`Settlement ${settlementToUpdate.id} marked as completed`);
    } catch (error) {
      console.error('Error updating settlement status:', error);
      // Show error message (you could add a toast notification here)
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setSettlementToUpdate(null);
    }
  };
  
  // Handle canceling the status update
  const cancelStatusUpdate = () => {
    setShowConfirmDialog(false);
    setSettlementToUpdate(null);
  };

  // Handle confirming the settlement deletion
  const confirmDeleteSettlement = async () => {
    if (!settlementToDelete) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Delete the settlement from the database
      const success = await deleteSettlement(settlementToDelete.id);
      
      if (success) {
        // Update the local state by removing the deleted settlement
        setSettlements(prevSettlements => 
          prevSettlements.filter(s => s.id !== settlementToDelete.id)
        );
        
        // Show success message (you could add a toast notification here)
        console.log(`Settlement ${settlementToDelete.id} deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting settlement:', error);
      // Show error message (you could add a toast notification here)
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setSettlementToDelete(null);
    }
  };
  
  // Handle canceling the settlement deletion
  const cancelDeleteSettlement = () => {
    setShowDeleteDialog(false);
    setSettlementToDelete(null);
  };

  // Get appropriate status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500/50 text-green-400";
      case "pending":
        return "border-amber-500/50 text-amber-400";
      case "failed":
        return "border-red-500/50 text-red-400";
      default:
        return "border-slate-500/50 text-slate-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <BadgePercent className="h-5 w-5 text-slate-400" />;
    }
  };

  // Placeholder for the page content
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 w-9 p-0 border-slate-800 hover:bg-slate-800/50"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">My Settlements</h1>
            <p className="text-slate-400">View and manage your personal settlement transactions</p>
            {user && <p className="text-purple-400 text-sm mt-1">Agent: {user.name}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
          >
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Settlements Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-purple-400">Total Settlements</p>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{totalSettlements}</h3>
              </div>
              <div className="rounded-full bg-purple-900/60 p-2.5 shadow-md">
                <BadgePercent className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-slate-400 mb-3">
              <ArrowUp className="h-3.5 w-3.5 text-green-400 mr-1" />
              <span className="text-green-400 font-medium">12.5%</span>
              <span className="ml-1">vs last month</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-purple-500/50 text-purple-400 px-2 py-0.5 text-xs">
                {fullSettlements} Full
              </Badge>
              <Badge variant="outline" className="border-purple-500/50 text-purple-400 px-2 py-0.5 text-xs">
                {partialSettlements} Partial
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Completed Settlements Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-green-400">Completed</p>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{completedSettlements}</h3>
              </div>
              <div className="rounded-full bg-green-900/60 p-2.5 shadow-md">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-slate-400 mb-3">
              <span className="text-green-400 font-medium">{Math.round((completedSettlements / totalSettlements) * 100)}%</span>
              <span className="ml-1">success rate</span>
            </div>
            <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full"
                style={{ width: `${(completedSettlements / totalSettlements) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Settlements Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-amber-400">Pending</p>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{pendingSettlements}</h3>
              </div>
              <div className="rounded-full bg-amber-900/60 p-2.5 shadow-md">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-slate-400 mb-3">
              <span className="text-amber-400 font-medium">{Math.round((pendingSettlements / totalSettlements) * 100)}%</span>
              <span className="ml-1">of total</span>
            </div>
            <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full"
                style={{ width: `${(pendingSettlements / totalSettlements) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-indigo-400">Total Value</p>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{formatCurrency(totalValue)}</h3>
              </div>
              <div className="rounded-full bg-indigo-900/60 p-2.5 shadow-md">
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center text-xs text-slate-400 mb-3">
              <ArrowUp className="h-3.5 w-3.5 text-green-400 mr-1" />
              <span className="text-green-400 font-medium">8.3%</span>
              <span className="ml-1">vs last month</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 px-2 py-0.5 text-xs">
                {formatCurrency(completedValue)} Completed
              </Badge>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 px-2 py-0.5 text-xs">
                {formatCurrency(pendingValue)} Pending
              </Badge>
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
                placeholder="Search settlements..."
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
                    className="h-7 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="h-7 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    Completed
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="h-7 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    Pending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Date Range</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
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
                  <label className="text-xs font-medium text-slate-400">Settlement Type</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                  >
                    <option value="all">All Types</option>
                    <option value="full">Full</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Payment Method</label>
                  <select 
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300"
                  >
                    <option value="all">All Methods</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
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
      
      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settlement Status Distribution */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Settlement Status</CardTitle>
            <CardDescription>
              Distribution of settlement statuses
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
                    
                    {/* Completed Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#completedGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${(completedSettlements / totalSettlements) * 251.2} 251.2`}
                      strokeDashoffset="0" 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Pending Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#pendingGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${(pendingSettlements / totalSettlements) * 251.2} 251.2`}
                      strokeDashoffset={`${-(completedSettlements / totalSettlements) * 251.2}`} 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Failed Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#failedGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${(failedSettlements / totalSettlements) * 251.2} 251.2`}
                      strokeDashoffset={`${-((completedSettlements + pendingSettlements) / totalSettlements) * 251.2}`} 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                      <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                      <linearGradient id="failedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-200">
                    {Math.round((completedSettlements / totalSettlements) * 100)}%
                  </span>
                  <span className="text-xs text-slate-400">Completed</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Completed</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{completedSettlements}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Pending</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{pendingSettlements}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-400 mr-2"></div>
                  <span className="text-xs text-slate-300">Failed</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{failedSettlements}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Settlement Type Distribution */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Settlement Value</CardTitle>
            <CardDescription>
              Value distribution by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {/* Completed Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 mr-2"></div>
                    <span className="text-sm text-slate-300">Completed</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">{formatCurrency(completedValue)}</div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                    style={{ width: `${(completedValue / totalValue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  {Math.round((completedValue / totalValue) * 100)}% of total
                </div>
              </div>
              
              {/* Pending Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 mr-2"></div>
                    <span className="text-sm text-slate-300">Pending</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">{formatCurrency(pendingValue)}</div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                    style={{ width: `${(pendingValue / totalValue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  {Math.round((pendingValue / totalValue) * 100)}% of total
                </div>
              </div>
              
              {/* Payment Method Distribution */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Payment Methods</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
                      <span className="text-xs text-slate-300">Bank Transfer</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-200">
                      {settlements.filter((s: Settlement) => s.paymentMethod === "Bank Transfer").length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></div>
                      <span className="text-xs text-slate-300">Cash</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-200">
                      {settlements.filter((s: Settlement) => s.paymentMethod === "Cash").length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Settlements Table */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Settlements</CardTitle>
            <CardDescription>
              View and manage all settlement transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-1 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              New Settlement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Method</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Agent</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement: Settlement) => (
                  <React.Fragment key={settlement.id}>
                    <tr 
                      className={cn(
                        "border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer transition-colors",
                        expandedItems[settlement.id] && "bg-slate-800/30"
                      )}
                      onClick={() => {
                        setExpandedItems(prev => ({
                          ...prev,
                          [settlement.id]: !prev[settlement.id]
                        }));
                      }}
                    >
                      <td className="py-3 px-4 text-sm text-slate-300">{settlement.id}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{settlement.customerName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-200">{formatCurrency(settlement.amount)}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{formatDate(settlement.date)}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          settlement.status === "completed" && "bg-green-500/20 text-green-400",
                          settlement.status === "pending" && "bg-amber-500/20 text-amber-400",
                          settlement.status === "failed" && "bg-red-500/20 text-red-400"
                        )}>
                          {settlement.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {settlement.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                          {settlement.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                          {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">{settlement.paymentMethod}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{settlement.settlementType}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{settlement.agentName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${settlement.status === 'pending' ? 'text-amber-400 hover:text-green-400' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={(e) => handleUpdateStatus(settlement, e)}
                            title={settlement.status === 'pending' ? 'Mark as completed' : 'View details'}
                          >
                            {settlement.status === 'pending' ? 
                              <CheckCircle className="h-4 w-4" /> : 
                              <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-400"
                            onClick={(e) => handleDeleteSettlement(settlement, e)}
                            title="Delete settlement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedItems[settlement.id] && (
                      <tr className="bg-slate-800/30">
                        <td colSpan={7} className="py-4 px-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-purple-400">Customer Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Name:</span>
                                  <span className="text-xs text-slate-300">{settlement.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Account Number:</span>
                                  <span className="text-xs text-slate-300">{settlement.accountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Customer ID:</span>
                                  <span className="text-xs text-slate-300">{settlement.customerId}</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-purple-400">Settlement Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Original Amount:</span>
                                  <span className="text-xs text-slate-300">{formatCurrency(settlement.originalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Settlement Amount:</span>
                                  <span className="text-xs text-slate-300">{formatCurrency(settlement.settlementAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Discount:</span>
                                  <span className="text-xs text-slate-300">{settlement.discountPercentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Expiry Date:</span>
                                  <span className="text-xs text-slate-300">{formatDate(new Date(settlement.expiryDate))}</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-purple-400">Status Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Status:</span>
                                  <span className={cn(
                                    "text-xs",
                                    settlement.status === "completed" && "text-green-400",
                                    settlement.status === "pending" && "text-amber-400",
                                    settlement.status === "rejected" && "text-red-400"
                                  )}>
                                    {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Settlement Type:</span>
                                  <span className="text-xs text-slate-300">{settlement.settlementType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Created By:</span>
                                  <span className="text-xs text-slate-300">{settlement.agentName}</span>
                                </div>
                                {settlement.description && (
                                  <div className="mt-2">
                                    <span className="text-xs text-slate-400 block mb-1">Description:</span>
                                    <p className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded">{settlement.description}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 border-slate-700 hover:bg-slate-800"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-300">1</span> to <span className="font-medium text-slate-300">{settlements.length}</span> of <span className="font-medium text-slate-300">{settlements.length}</span> settlements
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-slate-800"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-slate-800 bg-purple-600 text-white border-purple-600"
              >
                1
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-slate-800"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Status Update */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Mark Settlement as Completed?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will update the settlement status from pending to completed. This action cannot be undone.
              {settlementToUpdate && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-slate-300">{settlementToUpdate.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-300">{formatCurrency(settlementToUpdate.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Settlement ID:</span>
                    <span className="text-slate-300">{settlementToUpdate.id.substring(0, 8)}...</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              onClick={cancelStatusUpdate}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={confirmStatusUpdate}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Settlement Deletion */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Delete Settlement?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete this settlement record. This action cannot be undone.
              {settlementToDelete && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-slate-300">{settlementToDelete.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-300">{formatCurrency(settlementToDelete.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Settlement ID:</span>
                    <span className="text-slate-300">{settlementToDelete.id.substring(0, 8)}...</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              onClick={cancelDeleteSettlement}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteSettlement}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
