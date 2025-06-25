"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Zap,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertCircle,
  Ban,
  ShieldAlert,
  RefreshCcw,
  Clock,
  Calendar,
  Filter,
  ArrowLeft
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock data for YeboPay transactions - empty since we have no transactions yet
const mockTransactions: any[] = [];

export default function YeboPayPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics - all set to 0 since we have no data
  const totalTransactions = 0;
  const successfulTransactions = 0;
  const unsuccessfulTransactions = 0;
  
  const totalValue = 0;
  const successfulValue = 0;
  const unsuccessfulValue = 0;
  
  // Calculate failure reasons - empty object since we have no data
  const failureReasons: Record<string, number> = {};

  // Filter transactions based on search, tab, and other filters
  const filteredTransactions = mockTransactions.filter(transaction => {
    // Search filter
    const matchesSearch = 
      searchTerm === "" || 
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tab filter
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "successful" && transaction.status === "successful") ||
      (activeTab === "unsuccessful" && transaction.status === "unsuccessful");
    
    return matchesSearch && matchesTab;
  });

  // Helper functions
  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "successful"
      ? "border-cyan-800 text-cyan-400"
      : "border-red-800 text-red-400";
  };

  const getStatusIcon = (status: string) => {
    return status === "successful" ? (
      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "Insufficient Funds":
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case "Auth Declined":
        return <Ban className="h-4 w-4 text-red-400" />;
      case "Auth Limit Exceeded":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "Invalid Card Number":
        return <CreditCard className="h-4 w-4 text-red-400" />;
      case "Suspected Fraud":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 w-9 p-0 border-slate-800 hover:bg-slate-800/50"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">YeboPay Transactions</h1>
            <p className="text-slate-400">
              {formatDate(new Date())} • Manage and monitor realtime payment transactions
            </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Transactions Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Transactions</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-slate-200">{totalTransactions}</h3>
                  <span className="text-xs text-slate-400">transactions</span>
                </div>
                <p className="text-xs flex items-center mt-1">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last month</span>
                </p>
              </div>
              <div className="rounded-full bg-slate-800/80 p-2.5 shadow-md">
                <Zap className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful Transactions Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Successful</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-slate-200">{successfulTransactions}</h3>
                  <span className="text-xs text-slate-400">transactions</span>
                </div>
                <p className="text-xs flex items-center mt-1">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">success rate</span>
                </p>
              </div>
              <div className="rounded-full bg-green-900/60 p-2.5 shadow-md">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unsuccessful Transactions Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Unsuccessful</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-slate-200">{unsuccessfulTransactions}</h3>
                  <span className="text-xs text-slate-400">transactions</span>
                </div>
                <p className="text-xs flex items-center mt-1">
                  <span className="text-red-400 flex items-center mr-1 font-medium">
                    <ArrowDownRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">failure rate</span>
                </p>
              </div>
              <div className="rounded-full bg-red-900/60 p-2.5 shadow-md">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Value</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-slate-200">{formatCurrency(totalValue)}</h3>
                </div>
                <p className="text-xs flex items-center mt-1">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last month</span>
                </p>
              </div>
              <div className="rounded-full bg-indigo-900/60 p-2.5 shadow-md">
                <CreditCard className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Successful vs Unsuccessful */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Transaction Success Rate</CardTitle>
            <CardDescription>
              Breakdown of successful vs unsuccessful transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-52">
              <div className="relative w-44 h-44">
                {/* Success/Failure Donut Chart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background Circle */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="12" 
                    />
                    
                    {/* Success Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#successGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${(successfulTransactions / totalTransactions) * 251.2} 251.2`}
                      strokeDashoffset="0" 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Failure Segment */}
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="url(#failureGradient)" 
                      strokeWidth="12" 
                      strokeDasharray={`${(unsuccessfulTransactions / totalTransactions) * 251.2} 251.2`}
                      strokeDashoffset={`${-(successfulTransactions / totalTransactions) * 251.2}`} 
                      transform="rotate(-90 50 50)" 
                      strokeLinecap="round"
                    />
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                      <linearGradient id="failureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-200">
                    {Math.round((successfulTransactions / totalTransactions) * 100)}%
                  </span>
                  <span className="text-xs text-slate-400">Success Rate</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 mr-2"></div>
                  <span className="text-sm text-slate-300">Successful</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xl font-semibold text-slate-200">{successfulTransactions}</span>
                  <span className="text-sm text-slate-400">{formatCurrency(successfulValue)}</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-400 mr-2"></div>
                  <span className="text-sm text-slate-300">Unsuccessful</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xl font-semibold text-slate-200">{unsuccessfulTransactions}</span>
                  <span className="text-sm text-slate-400">{formatCurrency(unsuccessfulValue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Failure Reasons */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Failure Reasons</CardTitle>
            <CardDescription>
              Breakdown of unsuccessful transaction reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(failureReasons).map(([reason, count]) => (
                <div key={reason} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      {getReasonIcon(reason)}
                      <span className="ml-2 text-slate-300">{reason}</span>
                    </div>
                    <span className="text-slate-400">{count} transactions</span>
                  </div>
                  <Progress 
                    value={Math.round((count / unsuccessfulTransactions) * 100)} 
                    className="h-2 bg-slate-800"
                  >
                    <div 
                      className={`h-full rounded-full ${
                        reason === "Insufficient Funds" ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                        reason === "Auth Declined" ? "bg-gradient-to-r from-red-600 to-red-400" :
                        reason === "Auth Limit Exceeded" ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                        reason === "Invalid Card Number" ? "bg-gradient-to-r from-rose-600 to-rose-400" :
                        reason === "Suspected Fraud" ? "bg-gradient-to-r from-purple-600 to-purple-400" :
                        "bg-gradient-to-r from-red-600 to-red-400"
                      }`}
                    />
                  </Progress>
                </div>
              ))}
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
                placeholder="Search transactions..."
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
                    className="h-7 px-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="successful"
                    className="h-7 px-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  >
                    Successful
                  </TabsTrigger>
                  <TabsTrigger
                    value="unsuccessful"
                    className="h-7 px-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                  >
                    Unsuccessful
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 gap-1 border-slate-800 hover:bg-slate-800/50 w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-semibold">YeboPay Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {totalTransactions} transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2.5 shadow-md ${
                        transaction.status === "successful" 
                          ? "bg-cyan-900/60" 
                          : "bg-red-900/60"
                      }`}>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">{transaction.customerName}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{transaction.id}</span>
                          <span>•</span>
                          <span>Acc: {transaction.accountNumber}</span>
                          <span>•</span>
                          <span>{transaction.cardType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className={getStatusBadge(transaction.status)}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300">
                        {formatDate(transaction.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 hover:bg-cyan-900/20 hover:text-cyan-400 hover:border-cyan-800"
                        onClick={() => toggleExpanded(transaction.id)}
                      >
                        {expandedItems[transaction.id] ? (
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
                            View Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-slate-200">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          {transaction.status === "unsuccessful" && (
                            <DropdownMenuItem className="text-cyan-400 focus:bg-cyan-900/20 focus:text-cyan-300">
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Retry Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedItems[transaction.id] && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Customer Details</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Name:</span> {transaction.customerName}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Account:</span> {transaction.accountNumber}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Reference:</span> {transaction.reference}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Payment Details</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Amount:</span> {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Date:</span> {formatDate(transaction.date)}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Time:</span> {formatTime(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-400">Card Information</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Card Type:</span> {transaction.cardType}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Card Number:</span> {transaction.cardNumber}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-500">Status:</span>{" "}
                              <span className={transaction.status === "successful" ? "text-cyan-400" : "text-red-400"}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </p>
                            {transaction.status === "unsuccessful" && transaction.reason && (
                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">Reason:</span>{" "}
                                <span className="text-red-400">{transaction.reason}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {transaction.status === "unsuccessful" && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 hover:bg-cyan-900/20 hover:text-cyan-400 hover:border-cyan-800"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Retry Payment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-800/60 p-3 mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No transactions found</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  No transactions match your current search and filter criteria. Try adjusting your filters or search term.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        {filteredTransactions.length > 0 && (
          <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-400">
              Showing {filteredTransactions.length} of {totalTransactions} transactions
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
    </div>
  );
}
