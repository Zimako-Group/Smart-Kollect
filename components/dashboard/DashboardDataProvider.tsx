"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { sipService } from "@/lib/sipService";
import { useDialer } from "@/contexts/DialerContext";

// Define types for our dashboard data
interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  pausedAgents: number;
  offlineAgents: number;
  agentStatusDistribution: { status: string; count: number }[];
}

export interface CallMetrics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  avgCallDuration: number;
  serviceLevel: number;
  callsInQueue: number;
  callVolumeByHour: {
    date: string;
    inbound: number;
    outbound: number;
  }[];
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  lastActive: string | null;
  stats: {
    callsHandled: number;
    avgCallTime: number;
    satisfactionScore: number;
    availabilityPercentage: number;
  };
}

interface ActiveCall {
  id: string;
  type: string;
  startTime: string;
  duration: number;
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  customer: {
    name: string;
    phone: string;
    accountNumber: string | null;
  };
}

interface QueuedCall {
  id: string;
  customer: {
    name: string;
    phone: string;
    accountNumber: string | null;
  };
  waitTime: number;
  priority: string;
  enteredQueueAt: string;
}

interface PTPMetrics {
  totalPTPs: number;
  fulfilledPTPs: number;
  pendingPTPs: number;
  defaultedPTPs: number;
  fulfilledPercentage: number;
}

interface DashboardData {
  agentMetrics: AgentMetrics | null;
  callMetrics: CallMetrics | null;
  agents: Agent[];
  activeCalls: ActiveCall[];
  queuedCalls: QueuedCall[];
  ptpMetrics: PTPMetrics | null;
  lastUpdated: Date | null;
}

interface DashboardContextType {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  autoRefresh: boolean;
  setAutoRefresh: (auto: boolean) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  sipStatus: {
    connected: boolean;
    activeAgents: string[];
    callsInProgress: number;
  };
}

// Create context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { callState, isBuzzBoxInitialized } = useDialer();
  const [data, setData] = useState<DashboardData>({
    agentMetrics: null,
    callMetrics: null,
    agents: [],
    activeCalls: [],
    queuedCalls: [],
    ptpMetrics: null,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [sipStatus, setSipStatus] = useState({
    connected: false,
    activeAgents: [] as string[],
    callsInProgress: 0
  });
  
  // Keep track of SIP events
  const activeAgentsRef = useRef<string[]>([]);
  const callsInProgressRef = useRef<number>(0);

  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch main metrics with bypassAuth parameter for wallboard display
      const metricsResponse = await fetch(`/api/metrics?timeRange=${timeRange}&bypassAuth=true`);
      if (!metricsResponse.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsResponse.statusText}`);
      }
      const metricsData = await metricsResponse.json();
      
      // Fetch agent data with bypassAuth parameter
      const agentsResponse = await fetch('/api/metrics/agents?bypassAuth=true');
      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agent data: ${agentsResponse.statusText}`);
      }
      const agentsData = await agentsResponse.json();
      
      // Fetch call data with bypassAuth parameter
      const callsResponse = await fetch('/api/metrics/calls?bypassAuth=true');
      if (!callsResponse.ok) {
        throw new Error(`Failed to fetch call data: ${callsResponse.statusText}`);
      }
      const callsData = await callsResponse.json();
      
      // Fetch PTP metrics with bypassAuth parameter
      const ptpResponse = await fetch('/api/metrics/ptp?bypassAuth=true');
      if (!ptpResponse.ok) {
        console.warn(`Failed to fetch PTP metrics: ${ptpResponse.statusText}`);
      }
      const ptpData = await ptpResponse.json().catch(() => ({ data: { ptpMetrics: null } }));
      
      // Update state with fetched data
      setData({
        agentMetrics: metricsData.data.agentMetrics,
        callMetrics: metricsData.data.callMetrics,
        agents: agentsData.data.agents,
        activeCalls: callsData.data.activeCalls,
        queuedCalls: callsData.data.queuedCalls,
        ptpMetrics: ptpData.data.ptpMetrics,
        lastUpdated: new Date(),
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast({
        title: "Error",
        description: err.message || 'Failed to load dashboard data',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Set up auto-refresh
  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();
    
    // Set up auto-refresh interval
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData]);
  
  // Monitor SIP status changes
  useEffect(() => {
    // Update SIP connection status based on the dialer context
    setSipStatus(prevStatus => ({
      ...prevStatus,
      connected: isBuzzBoxInitialized && (callState === 'registered' || callState === 'connected' || callState === 'incoming')
    }));
    
    // If an agent connects to SIP, add them to active agents
    if (isBuzzBoxInitialized && callState === 'registered') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          if (user && user.id) {
            // Add agent to active agents if not already there
            if (!activeAgentsRef.current.includes(user.id)) {
              activeAgentsRef.current = [...activeAgentsRef.current, user.id];
              setSipStatus(prevStatus => ({
                ...prevStatus,
                activeAgents: [...prevStatus.activeAgents, user.id]
              }));
              
              // Refresh data to update agent status
              fetchDashboardData();
            }
          }
        } catch (e) {
          console.error('Error parsing current user:', e);
        }
      }
    }
    
    // If a call is in progress, update the calls in progress count
    if (callState === 'connected') {
      callsInProgressRef.current += 1;
      setSipStatus(prevStatus => ({
        ...prevStatus,
        callsInProgress: callsInProgressRef.current
      }));
      
      // Refresh data to update call metrics
      fetchDashboardData();
    }
    
    // If a call ends, update the calls in progress count
    if (callState === 'ended' && callsInProgressRef.current > 0) {
      callsInProgressRef.current -= 1;
      setSipStatus(prevStatus => ({
        ...prevStatus,
        callsInProgress: callsInProgressRef.current
      }));
      
      // Refresh data to update call metrics
      fetchDashboardData();
    }
  }, [callState, isBuzzBoxInitialized, fetchDashboardData]);

  // Context value
  const value = {
    data,
    isLoading,
    error,
    refreshData,
    refreshInterval,
    setRefreshInterval,
    autoRefresh,
    setAutoRefresh,
    timeRange,
    setTimeRange,
    sipStatus,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
