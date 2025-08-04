"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/lib/redux/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentBreakPanel } from "@/components/AgentBreakPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { addDays, format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowUpRight,
  BadgePercent,
  Banknote,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  ListChecks,
  Phone,
  PhoneCall,
  AlertCircle,
  Users,
  BarChart2,
  TrendingUp,
  Trophy,
  Zap,
  CreditCard,
  Receipt,
  Filter,
  FileText,
  Calendar,
  ArrowDownRight,
  DollarSign,
  BarChart,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateDisplay } from "@/components/DateDisplay";
import { useDialer } from "@/contexts/DialerContext";
import { Dialer } from "@/components/Dialer";
import BrokenPTP from "@/components/BrokenPTP";
import ViewSchedule from "@/components/ViewSchedule";
import PaymentsDue from "@/components/PaymentsDue";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { defaultAgentMetrics } from "@/lib/agent-dashboard";
import { useAgentPerformance } from "@/hooks/useAgentPerformance";
import { useDashboardCache } from "@/hooks/useDashboardCache";
import { Analytics } from "@vercel/analytics/next";

// Dynamically import chart components with no SSR to avoid hydration issues

export default function DashboardPage() {
  const { isDialerOpen, setIsDialerOpen } = useDialer();
  const [showBrokenPTP, setShowBrokenPTP] = useState(false);
  const [showViewSchedule, setShowViewSchedule] = useState(false);
  const [showPaymentsDue, setShowPaymentsDue] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Get flags from Redux store
  const flags = useAppSelector(state => state.flags.flags);
  // Count unresolved flags
  const unresolvedFlagsCount = flags.filter(flag => !flag.isResolved).length;

  console.log("[DASHBOARD] Dashboard page component mounted");
  console.log("[DASHBOARD] User state:", user ? { id: user.id, role: user.role } : "No user");
  console.log("[DASHBOARD] Auth loading state:", authLoading);

  // Use the new caching system
  const {
    data: dashboardData,
    isLoading: cacheLoading,
    isRefreshing,
    error: cacheError,
    refreshAll,
    refreshMetrics,
    refreshCounts
  } = useDashboardCache(user?.id || null, user?.name || null);

  // Agent performance metrics (keep existing hook for compatibility)
  const { metrics: agentPerformanceMetrics, loading: performanceLoading } = useAgentPerformance(
    user?.id || null,
    user?.name || null,
    user?.email || null
  );

  // Combine cached data with performance metrics
  const combinedAgentMetrics = dashboardData ? {
    ...dashboardData.combinedMetrics,
    // Override with real performance metrics if available
    collectionRate: agentPerformanceMetrics?.collectionRate || dashboardData.combinedMetrics.collectionRate,
    promiseToPayConversion: agentPerformanceMetrics?.promiseToPayConversion || dashboardData.combinedMetrics.promiseToPayConversion,
    collectionSummary: agentPerformanceMetrics?.collectionSummary || dashboardData.combinedMetrics.collectionSummary,
    ranking: agentPerformanceMetrics?.ranking || dashboardData.combinedMetrics.ranking
  } : defaultAgentMetrics;
  
  // Debug: Log PTP data being used in the dashboard
  console.log(`[DASHBOARD-COMPONENT] 🎯 PTP data check:`, {
    hasDashboardData: !!dashboardData,
    combinedMetricsPTP: dashboardData?.combinedMetrics?.ptp,
    finalPTPData: combinedAgentMetrics.ptp,
    ptpTotal: combinedAgentMetrics.ptp?.total
  });

  const topOverdueAccounts = dashboardData?.topOverdueAccounts || [];
  const pendingSettlementsCount = dashboardData?.pendingSettlementsCount || 0;
  const callbacksCount = dashboardData?.callbacksCount || 0;
  const brokenPTPsCount = dashboardData?.brokenPTPsCount || 0;

  // Loading state
  const isLoading = authLoading || cacheLoading || performanceLoading;
  const error = cacheError;

  // If still in initial auth loading state, show enhanced loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Main loading content */}
        <div className="relative z-10 flex h-screen items-center justify-center p-8">
          <div className="text-center max-w-md">
            {/* SmartKollect Logo/Brand */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl mb-4 relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 animate-pulse"></div>
                <BarChart2 className="h-10 w-10 text-white relative z-10" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">SmartKollect</h1>
              <p className="text-slate-400 text-sm">Intelligent Debt Collection Platform</p>
            </div>

            {/* Advanced Loading Animation */}
            <div className="mb-8">
              <div className="relative">
                {/* Outer rotating ring */}
                <div className="w-24 h-24 mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-slate-600/20"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '3s'}}></div>
                  
                  {/* Center pulsing dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Loading Dashboard</span>
                <span className="text-sm text-slate-400">Please wait...</span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>

            {/* Loading Steps */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300">Authenticating user...</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300">Loading dashboard metrics...</span>
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-auto" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="text-slate-500">Preparing workspace...</span>
                <Clock className="h-4 w-4 text-slate-500 ml-auto" />
              </div>
            </div>

            {/* Skeleton Preview */}
            <div className="mt-12 p-6 bg-slate-800/20 rounded-2xl border border-slate-700/30 backdrop-blur-sm">
              <div className="text-xs text-slate-400 mb-4 text-left">Dashboard Preview</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-slate-700/50" />
                  <Skeleton className="h-8 w-3/4 bg-slate-700/50" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-slate-700/50" />
                  <Skeleton className="h-8 w-2/3 bg-slate-700/50" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full bg-slate-700/50" />
                <Skeleton className="h-3 w-4/5 bg-slate-700/50" />
                <Skeleton className="h-3 w-3/5 bg-slate-700/50" />
              </div>
            </div>

            {/* Helpful tip */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Pro Tip:</span>
              </div>
              <p className="text-blue-200/80 text-xs mt-1">
                Your dashboard is being optimized for the best performance. This usually takes just a few seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user is found after loading completes, show login button
  if (!user && !authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You need to be logged in to view this dashboard. Please log in to continue.
          </p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // If there was an error loading data
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show skeleton loading state while fetching data
  if (isLoading) {
    return (
      <div className="w-full space-y-6 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-48 bg-slate-800/70" />
            <Skeleton className="h-5 w-64 mt-2 bg-slate-800/50" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-800/70 rounded-md" />
            <Skeleton className="h-10 w-32 bg-slate-800/70 rounded-md" />
          </div>
        </div>

        {/* Performance Summary Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-slate-800/70" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-800/40 bg-slate-900/90 shadow-md">
                <div className="h-1 bg-slate-800/70"></div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full bg-slate-800/70" />
                      <Skeleton className="h-6 w-28 bg-slate-800/70" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full bg-slate-800/70" />
                  </div>
                  <Skeleton className="h-8 w-full bg-slate-800/70 mb-2" />
                  <Skeleton className="h-6 w-3/4 bg-slate-800/50" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-full bg-slate-800/50 mb-2" />
                    <Skeleton className="h-2 w-full bg-slate-800/40 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Skeleton className="h-12 w-full sm:w-96 bg-slate-800/70 rounded-xl" />
            <Skeleton className="h-10 w-24 bg-slate-800/70 rounded-md" />
          </div>

          {/* Card Skeleton */}
          <div className="bg-slate-900/40 border border-slate-800/60 shadow-lg rounded-lg">
            <div className="p-6 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-8 w-8 rounded-full bg-slate-800/70" />
                <Skeleton className="h-6 w-48 bg-slate-800/70" />
              </div>
              <Skeleton className="h-4 w-64 mt-2 bg-slate-800/50" />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-4 hover:bg-slate-800/30 p-2 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-slate-800/70" />
                      <div>
                        <Skeleton className="h-5 w-32 bg-slate-800/70" />
                        <Skeleton className="h-4 w-24 mt-1 bg-slate-800/50" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-20 rounded-full bg-slate-800/70" />
                      <Skeleton className="h-8 w-8 rounded-full bg-slate-800/70" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Skeleton className="h-10 w-32 mx-auto bg-slate-800/70 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Open dialer when "Start Calling" button is clicked
  const handleOpenDialer = () => {
    setIsDialerOpen(true);
  };

  // Only have one return statement in your component
  return (
    <div className="w-full space-y-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.name ? `${user.name}'s Dashboard` : 'Debt Collection Dashboard'}
          </h1>
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
          {user?.id && <AgentBreakPanel agentId={user.id} />}
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleOpenDialer}
          >
            <PhoneCall className="h-4 w-4 mr-1" />
            Start Calling
          </Button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-200">
            Performance Summary
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh all data</span>
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {/* Allocated Accounts Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-indigo-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/allocated-accounts')}
          >
            <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-indigo-900/60 p-2 shadow-md">
                    <Users className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h3 className="font-medium text-indigo-400">Allocated Accounts</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">{combinedAgentMetrics.allocatedAccounts.total}</div>
                <div className="text-sm text-slate-400 mb-1">
                  total
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> {combinedAgentMetrics.allocatedAccounts.contactRate}%
                  </span>
                  <span className="text-slate-400">contacted</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-400 border border-indigo-800/40">
                  R{(combinedAgentMetrics.allocatedAccounts.value / 1000000).toFixed(1)}M value
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Contact progress</span>
                  <span className="font-medium text-slate-300">{combinedAgentMetrics.allocatedAccounts.contactRate}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                    style={{ width: `${combinedAgentMetrics.allocatedAccounts.contactRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Debi Checks Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-green-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/debi-checks')}
          >
            <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-900/60 p-2 shadow-md">
                    <ListChecks className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="font-medium text-green-400">
                    Debi Check
                  </h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">
                  0
                </div>
                <div className="text-sm text-slate-400 mb-1">
                  of 60 target
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last month</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800/40">
                  0% of target
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Progress to target</span>
                  <span className="font-medium text-slate-300">0%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* YeboPay Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-cyan-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/yebopay')}
          >
            <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-cyan-900/60 p-2 shadow-md">
                    <Zap className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="font-medium text-cyan-400">YeboPay (Realtime Payments)</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">0</div>
                <div className="text-sm text-slate-400 mb-1">
                  transactions
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last month</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-900/40 text-cyan-400 border border-cyan-800/40">
                  R0k value
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Success rate</span>
                  <span className="font-medium text-slate-300">0%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Settlements Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-purple-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/settlements')}
          >
            <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-purple-900/60 p-2 shadow-md">
                    <BadgePercent className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-purple-400">Pending Settlements</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">{pendingSettlementsCount}</div>
                <div className="text-sm text-slate-400 mb-1">
                  awaiting approval
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-purple-400 flex items-center mr-1 font-medium">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </span>
                  <span className="text-slate-400">settlements</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-800/40">
                  Need approval
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Settlements status</span>
                  <span className="font-medium text-slate-300">{pendingSettlementsCount} pending</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_6px_rgba(147,51,234,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* PTP (Cash) Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-blue-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/ptp')}
          >
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-900/60 p-2 shadow-md">
                    <Banknote className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="font-medium text-blue-400">PTP (Cash)</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">{combinedAgentMetrics.ptp.total}</div>
                <div className="text-sm text-slate-400 mb-1">
                  of {combinedAgentMetrics.ptp.target} target
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> {combinedAgentMetrics.ptp.changeVsLastMonth}%
                  </span>
                  <span className="text-slate-400">vs last month</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800/40">
                  {combinedAgentMetrics.ptp.percentOfTarget}% of target
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Progress to target</span>
                  <span className="font-medium text-slate-300">{combinedAgentMetrics.ptp.percentOfTarget}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                    style={{ width: `${combinedAgentMetrics.ptp.percentOfTarget}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Rate Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-amber-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/contact-rate')}
          >
            <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-900/60 p-2 shadow-md">
                    <PhoneCall className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="font-medium text-amber-400">Contact Rate</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">0%</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last week</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800/40">
                  0 calls today
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Success rate</span>
                  <span className="font-medium text-slate-300">0%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Flags Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-rose-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-rose-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/flags')}
          >
            <div className="h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-rose-900/60 p-2 shadow-md">
                    <Flag className="h-4 w-4 text-rose-400" />
                  </div>
                  <h3 className="font-medium text-rose-400">Flags</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">{unresolvedFlagsCount}</div>
                <div className="text-sm text-slate-400 mb-1">
                  active flags
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-red-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> 0%
                  </span>
                  <span className="text-slate-400">vs last week</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-900/40 text-rose-400 border border-rose-800/40">
                  0 high priority
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Resolution rate</span>
                  <span className="font-medium text-slate-300">0%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reminders Card */}
          <div 
            className="group relative overflow-hidden rounded-xl border border-orange-800/40 bg-gradient-to-br from-slate-900 to-slate-900/90 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/20 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => router.push('/user/reminders')}
          >
            <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-orange-900/60 p-2 shadow-md">
                    <BellRing className="h-4 w-4 text-orange-400" />
                  </div>
                  <h3 className="font-medium text-orange-400">Reminders</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-slate-200">{callbacksCount}</div>
                <div className="text-sm text-slate-400 mb-1">
                  pending/missed
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs flex items-center">
                  <span className="text-green-400 flex items-center mr-1 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> {callbacksCount > 0 ? '0%' : '100%'}
                  </span>
                  <span className="text-slate-400">completed</span>
                </p>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-800/40">
                  {callbacksCount} due today
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Completion rate</span>
                  <span className="font-medium text-slate-300">0%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.3)]"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Center */}
      <Card className="overflow-hidden border-0 shadow-[0_4px_24px_0_rgba(0,0,0,0.08)]">
        <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
        <CardHeader className="pb-3">

          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Today&#39;s Action Center
              </CardTitle>
              <CardDescription className="mt-1">
                Your prioritized tasks for maximum collection efficiency
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View All Tasks
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {/* Urgent Follow-ups Card */}
            <div className="group relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-red-500 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[135px] text-center">
                  URGENT
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="font-medium text-red-800">
                      Urgent Follow-ups
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-red-700">{brokenPTPsCount}</div>
                  <div className="text-sm text-red-600 mb-1">
                    Broken PTP&apos;s
                  </div>
                </div>
                <p className="text-xs text-red-600 mb-4">
                  Customers who promised to pay but have not yet paid
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm"
                  onClick={() => setShowBrokenPTP(true)}
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  Call Now
                </Button>
              </div>
            </div>

            {/* Today's Callbacks Card */}
            <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-amber-100 p-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-medium text-amber-800">
                      Pending Callbacks
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-amber-700">{callbacksCount}</div>
                  <div className="text-sm text-amber-600 mb-1">
                    pending/missed
                  </div>
                </div>
                <p className="text-xs text-amber-600 mb-4">
                  All pending and missed callbacks for today
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm"
                  onClick={() => setShowViewSchedule(true)}
                >
                  <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                  View Schedule
                </Button>
              </div>
            </div>

            {/* Payment Plans Due Card */}
            <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-green-800">
                      Settlement&apos;s Due
                    </h3>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-bold text-green-700">0</div>
                  <div className="text-sm text-green-600 mb-1">
                    Settlements Due
                  </div>
                </div>
                <p className="text-xs text-green-600 mb-4">
                  Active payment plans with installments due today
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                  onClick={() => setShowPaymentsDue(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  View Payments
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cases" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <TabsList className="h-auto p-0.5 bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-700/30 shadow-md flex flex-wrap gap-1 w-full sm:w-auto">
            <TabsTrigger
              value="cases"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-blue-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-blue-900/60 p-1.5 mr-2 shadow-sm">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-300" />
                </div>
                <span>Priority Cases</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-green-900/30 data-[state=active]:text-green-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-green-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-900/60 p-1.5 mr-2 shadow-sm">
                  <Receipt className="h-3.5 w-3.5 text-green-300" />
                </div>
                <span>Recent Payments</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex-1 relative px-3 py-2 text-sm font-medium text-slate-300 rounded-lg data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 data-[state=active]:shadow data-[state=active]:border-b-2 data-[state=active]:border-purple-400 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-purple-900/60 p-1.5 mr-2 shadow-sm">
                  <BarChart2 className="h-3.5 w-3.5 text-purple-300" />
                </div>
                <span>Your Performance</span>
              </div>
            </TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <TabsContent value="cases" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-blue-900/60 p-1.5 shadow-sm">
                  <AlertCircle className="h-4 w-4 text-blue-300" />
                </div>
                <CardTitle>High Priority Cases</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Top overdue accounts allocated to you requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topOverdueAccounts.length > 0 ? (
                  topOverdueAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between border-b border-slate-700/50 pb-4 hover:bg-slate-800/30 p-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => router.push(`/user/customers/${account.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10 border-2 border-slate-700 shadow-md">
                          <AvatarFallback
                            className={
                              account.priority === "high"
                                ? "bg-red-900 text-red-200"
                                : account.priority === "medium"
                                ? "bg-amber-900 text-amber-200"
                                : "bg-slate-700 text-slate-200"
                            }
                          >
                            {account.customerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {account.customerName}
                          </p>
                          <p className="text-xs text-slate-400">
                            R{account.balance.toFixed(2)} • {account.daysOverdue} days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={
                            account.priority === "high"
                              ? "bg-red-900/30 text-red-300 border-red-800"
                              : account.priority === "medium"
                              ? "bg-amber-900/30 text-amber-300 border-amber-800"
                              : "bg-green-900/30 text-green-300 border-green-800"
                          }
                        >
                          {account.status === 'overdue' ? 'Overdue' : `${account.daysOverdue} days`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No overdue accounts found.</p>
                  </div>
                )}
              </div>
              </CardContent>
              <CardFooter>
                <div className="mt-6 text-center w-full">
                  <Button
                    variant="outline"
                    className="text-slate-300 border-slate-700 bg-slate-800/70 hover:bg-slate-700 hover:text-slate-100"
                  >
                    View All Cases <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-green-900/60 p-1.5 shadow-sm">
                  <Receipt className="h-4 w-4 text-green-300" />
                </div>
                <CardTitle>Recent Payments</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Payments received in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: "Robert Taylor",
                    amount: 2500.0,
                    date: "2025-03-07",
                    method: "EFT",
                  },
                  {
                    id: 2,
                    name: "Jennifer Adams",
                    amount: 1200.5,
                    date: "2025-03-06",
                    method: "Credit Card",
                  },
                  {
                    id: 3,
                    name: "Thomas Johnson",
                    amount: 3750.25,
                    date: "2025-03-05",
                    method: "Debit Order",
                  },
                  {
                    id: 4,
                    name: "Lisa Williams",
                    amount: 950.0,
                    date: "2025-03-04",
                    method: "EFT",
                  },
                  {
                    id: 5,
                    name: "Kevin Martin",
                    amount: 1800.75,
                    date: "2025-03-03",
                    method: "Credit Card",
                  },
                ].map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b border-slate-700/50 pb-4 hover:bg-slate-800/30 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-900 to-emerald-700 flex items-center justify-center shadow-md">
                        <CheckCircle2 className="h-5 w-5 text-green-200" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          Payment from {payment.name}
                        </p>
                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                          <span>
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{payment.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-700/30">
                      +R
                      {payment.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-purple-900/60 p-1.5 shadow-sm">
                    <BarChart2 className="h-4 w-4 text-purple-300" />
                  </div>
                  <CardTitle>Your Performance Metrics</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  onClick={() => {
                    if (user?.id) {
                      refreshMetrics();
                    }
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh metrics</span>
                </Button>
              </div>
              <CardDescription className="text-slate-400">
                Your collection performance for the current month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                <div className="space-y-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/40">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Collection Rate
                      </span>
                      <span className="text-sm font-medium text-blue-300">
                        {combinedAgentMetrics.collectionRate.rate}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                        style={{ width: `${combinedAgentMetrics.collectionRate.rate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: {combinedAgentMetrics.collectionRate.target}%</span>
                      <span className="text-green-400">{combinedAgentMetrics.collectionRate.changeVsTarget}% above target</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Contact Rate
                      </span>
                      <span className="text-sm font-medium text-green-300">
                        {combinedAgentMetrics.contactRate.rate}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                        style={{ width: `${combinedAgentMetrics.contactRate.rate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: {combinedAgentMetrics.contactRate.target}%</span>
                      <span className="text-green-400">{combinedAgentMetrics.contactRate.changeVsTarget}% above target</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        Promise to Pay Conversion
                      </span>
                      <span className="text-sm font-medium text-amber-300">
                        {combinedAgentMetrics.promiseToPayConversion.rate}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        style={{ width: `${combinedAgentMetrics.promiseToPayConversion.rate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Target: {combinedAgentMetrics.promiseToPayConversion.target}%</span>
                      <span className="text-red-400">{combinedAgentMetrics.promiseToPayConversion.changeVsTarget}% below target</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/40">
                    <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-300" />
                      Monthly Collection Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Collected</p>
                        <p className="text-lg font-bold text-blue-300">
                          R{combinedAgentMetrics.collectionSummary.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Target</p>
                        <p className="text-lg font-bold text-slate-300">
                          R{combinedAgentMetrics.collectionSummary.target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/40">
                    <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-300" />
                      Your Ranking
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-amber-100 font-bold text-xl shadow-lg border-2 border-amber-600/50">
                        #{combinedAgentMetrics.ranking.position}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-300">
                          Top Performer
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          You are in the top {combinedAgentMetrics.ranking.percentile}% of collectors
                        </p>
                        <div className="mt-2 bg-amber-900/30 text-amber-300 text-xs py-1 px-2 rounded-full inline-flex items-center gap-1 border border-amber-700/30">
                          <TrendingUp className="h-3 w-3" />
                          <span>Up {combinedAgentMetrics.ranking.change} positions this month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialer Component */}
      <Dialer open={isDialerOpen} onOpenChange={setIsDialerOpen} />

      {/* BrokenPTP Dialog */}
      {showBrokenPTP && (
        <BrokenPTP onClose={() => setShowBrokenPTP(false)} />
      )}

      {/* ViewSchedule Modal */}
      {showViewSchedule && (
        <ViewSchedule onClose={() => setShowViewSchedule(false)} />
      )}

      {/* PaymentsDue Modal */}
      {showPaymentsDue && (
        <PaymentsDue onClose={() => setShowPaymentsDue(false)} />
      )}
      
      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}