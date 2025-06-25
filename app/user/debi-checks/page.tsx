"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateDisplay } from "@/components/DateDisplay";
import {
  ArrowUpRight,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Download,
  BarChart3,
  RefreshCcw,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample data for debi checks
const sampleDebiChecks = {
  approved: [],
  declined: [],
  error: [],
  failed: [],
  pending: [],
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case 'declined':
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case 'error':
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case 'failed':
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case 'pending':
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-rose-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-slate-500" />;
  }
};

export default function DebiChecksPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "declined" | "error" | "failed" | "pending">("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate data loading with useEffect to ensure it only runs client-side
  useEffect(() => {
    // In a real app, you would fetch data here
    try {
      // Data is already available in sampleDebiChecks
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load debi checks data");
      setIsLoading(false);
    }
  }, []);

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-green-400 hover:bg-slate-800/50 rounded-full"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Debi Checks</h1>
            <p className="text-slate-400">View and manage your debi checks</p>
          </div>
        </div>
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Error Loading Data</h3>
              <p className="text-slate-400 mb-4">{error}</p>
              <Button 
                variant="outline" 
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-green-400 hover:bg-slate-800/50 rounded-full"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Debi Checks</h1>
            <p className="text-slate-400">View and manage your debi checks</p>
          </div>
        </div>
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-slate-200">Loading Debi Checks</h3>
              <p className="text-slate-400">Please wait while we fetch your data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals - all set to 0 since we have no data
  const totalApproved = 0;
  const totalDeclined = 0;
  const totalError = 0;
  const totalFailed = 0;
  const totalPending = 0;
  const totalChecks = 0;

  // Calculate total values - all set to 0 since we have no data
  const approvedValue = 0;
  const declinedValue = 0;
  const errorValue = 0;
  const failedValue = 0;
  const pendingValue = 0;
  const totalValue = 0;

  // Toggle expanded state for an item
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get all checks based on active tab
  const getFilteredChecks = () => {
    let checks: any[] = [];
    
    if (activeTab === "all") {
      checks = [
        ...sampleDebiChecks.approved,
        ...sampleDebiChecks.declined,
        ...sampleDebiChecks.error,
        ...sampleDebiChecks.failed,
        ...sampleDebiChecks.pending
      ];
    } else {
      checks = sampleDebiChecks[activeTab as keyof typeof sampleDebiChecks] || [];
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      checks = checks.filter(check => 
        check.customerName.toLowerCase().includes(term) ||
        check.id.toLowerCase().includes(term) ||
        check.accountNumber.includes(term) ||
        check.reference.toLowerCase().includes(term)
      );
    }

    return checks;
  };

  const filteredChecks = getFilteredChecks();

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Debi Checks
            </h1>
          </div>
          <DateDisplay />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Calendar className="h-4 w-4 mr-1" />
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Debi Checks Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-indigo-900/60 p-2.5 shadow-md">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
              </div>
              <Badge variant="outline" className="bg-indigo-900/40 text-indigo-400 border-indigo-800/40">
                Total
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Debi Checks</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-200">{totalChecks}</h3>
                <p className="text-sm text-indigo-400 mb-1">checks</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs flex items-center">
                <span className="text-indigo-400 font-medium">{formatCurrency(totalValue)}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="text-green-400 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                </span>
                <span className="text-slate-400">vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Approved Checks Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-green-900/60 p-2.5 shadow-md">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <Badge variant="outline" className="bg-green-900/40 text-green-400 border-green-800/40">
                Approved
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Approved Checks</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-200">{totalApproved}</h3>
                <p className="text-sm text-green-400 mb-1">checks</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs flex items-center">
                <span className="text-green-400 font-medium">{formatCurrency(approvedValue)}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="text-green-400 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                </span>
                <span className="text-slate-400">vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Declined Checks Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-red-900/60 p-2.5 shadow-md">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <Badge variant="outline" className="bg-red-900/40 text-red-400 border-red-800/40">
                Declined
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Declined Checks</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-200">{totalDeclined}</h3>
                <p className="text-sm text-red-400 mb-1">checks</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs flex items-center">
                <span className="text-red-400 font-medium">{formatCurrency(declinedValue)}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="text-red-400 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                </span>
                <span className="text-slate-400">vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Checks Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-amber-900/60 p-2.5 shadow-md">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <Badge variant="outline" className="bg-amber-900/40 text-amber-400 border-amber-800/40">
                Error
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Error Checks</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-200">{totalError}</h3>
                <p className="text-sm text-amber-400 mb-1">checks</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs flex items-center">
                <span className="text-amber-400 font-medium">{formatCurrency(errorValue)}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="text-amber-400 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                </span>
                <span className="text-slate-400">vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Checks Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-blue-900/60 p-2.5 shadow-md">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <Badge variant="outline" className="bg-blue-900/40 text-blue-400 border-blue-800/40">
                Pending
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Pending Approval</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-200">{totalPending}</h3>
                <p className="text-sm text-blue-400 mb-1">checks</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs flex items-center">
                <span className="text-blue-400 font-medium">{formatCurrency(pendingValue)}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="text-blue-400 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                </span>
                <span className="text-slate-400">vs last month</span>
              </p>
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
                placeholder="Search debi checks..."
                className="pl-9 bg-slate-950/50 border-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
              className="w-full md:w-auto"
            >
              <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5">
                <TabsTrigger
                  value="all"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Approved
                </TabsTrigger>
                <TabsTrigger
                  value="declined"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Declined
                </TabsTrigger>
                <TabsTrigger
                  value="error"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Error
                </TabsTrigger>
                <TabsTrigger
                  value="failed"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Failed
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Pending
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Debi Checks List */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-semibold">Debi Checks</CardTitle>
          <CardDescription>
            Showing {filteredChecks.length} of {totalChecks} debi checks
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredChecks.length > 0 ? (
              filteredChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-800/80 p-2.5 shadow-md">
                        {getStatusIcon(check.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">{check.customerName}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{check.id}</span>
                          <span>•</span>
                          <span>Acc: {check.accountNumber}</span>
                          <span>•</span>
                          <span>{check.bank}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className={getStatusBadge(check.status)}>
                        {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                      </Badge>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300">
                        {formatCurrency(check.amount)}
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300">
                        {formatDate(check.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800"
                        onClick={() => toggleExpanded(check.id)}
                      >
                        {expandedItems[check.id] ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                          <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-slate-200">
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {check.status === "pending" && (
                            <>
                              <DropdownMenuItem className="text-green-400 focus:bg-green-900/20 focus:text-green-300">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 focus:bg-red-900/20 focus:text-red-300">
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline
                              </DropdownMenuItem>
                            </>
                          )}
                          {check.status === "error" && (
                            <DropdownMenuItem className="text-amber-400 focus:bg-amber-900/20 focus:text-amber-300">
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Retry
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-slate-200">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedItems[check.id] && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Customer Details</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Name:</span> {check.customerName}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Account:</span> {check.accountNumber}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Bank:</span> {check.bank}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Payment Details</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Amount:</span> {formatCurrency(check.amount)}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Date:</span> {formatDate(check.date)}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Reference:</span> {check.reference}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Status Information</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Status:</span>{" "}
                              <span className={check.status === "approved" ? "text-green-400" : 
                                check.status === "declined" ? "text-red-400" : 
                                check.status === "error" ? "text-amber-400" : 
                                check.status === "failed" ? "text-rose-400" : "text-blue-400"}>
                                {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                              </span>
                            </p>
                            {check.status === "declined" && (
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">Reason:</span>{" "}
                                <span className="text-red-400">{check.reason}</span>
                              </p>
                            )}
                            {check.status === "error" && (
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">Error:</span>{" "}
                                <span className="text-amber-400">{check.errorMessage}</span>
                              </p>
                            )}
                            {check.status === "failed" && (
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">Failure:</span>{" "}
                                <span className="text-rose-400">{check.failureReason}</span>
                              </p>
                            )}
                            {check.status === "pending" && (
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">Submitted:</span>{" "}
                                <span className="text-blue-400">{formatDate(check.submittedDate)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        {check.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Decline
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                          </div>
                        )}
                        {check.status === "error" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 hover:bg-amber-900/20 hover:text-amber-400 hover:border-amber-800"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-800/60 p-3 mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No debi checks found</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  No debi checks match your current search and filter criteria. Try adjusting your filters or search term.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        {filteredChecks.length > 0 && (
          <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-400">
              Showing {filteredChecks.length} of {totalChecks} debi checks
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Visual Stats Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Debi Check Statistics</CardTitle>
          <CardDescription>
            Visual representation of your debi check performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Status Distribution</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Approved</span>
                    <span className="text-slate-400">{Math.round((totalApproved / totalChecks) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((totalApproved / totalChecks) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Declined</span>
                    <span className="text-slate-400">{Math.round((totalDeclined / totalChecks) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((totalDeclined / totalChecks) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-400">Error</span>
                    <span className="text-slate-400">{Math.round((totalError / totalChecks) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((totalError / totalChecks) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-400">Failed</span>
                    <span className="text-slate-400">{Math.round((totalFailed / totalChecks) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((totalFailed / totalChecks) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400">Pending</span>
                    <span className="text-slate-400">{Math.round((totalPending / totalChecks) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((totalPending / totalChecks) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                  </Progress>
                </div>
              </div>
            </div>

            {/* Value Distribution */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Value Distribution</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Approved Value</span>
                    <span className="text-slate-400">{formatCurrency(approvedValue)}</span>
                  </div>
                  <Progress value={Math.round((approvedValue / totalValue) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Declined Value</span>
                    <span className="text-slate-400">{formatCurrency(declinedValue)}</span>
                  </div>
                  <Progress value={Math.round((declinedValue / totalValue) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-400">Error Value</span>
                    <span className="text-slate-400">{formatCurrency(errorValue)}</span>
                  </div>
                  <Progress value={Math.round((errorValue / totalValue) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-400">Failed Value</span>
                    <span className="text-slate-400">{formatCurrency(failedValue)}</span>
                  </div>
                  <Progress value={Math.round((failedValue / totalValue) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full" />
                  </Progress>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400">Pending Value</span>
                    <span className="text-slate-400">{formatCurrency(pendingValue)}</span>
                  </div>
                  <Progress value={Math.round((pendingValue / totalValue) * 100)} className="h-2 bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                  </Progress>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
