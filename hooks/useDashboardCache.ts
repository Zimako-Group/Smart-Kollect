import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { fetchAgentDashboardMetrics, AgentMetrics, defaultAgentMetrics } from '@/lib/agent-dashboard';
import { getAgentAllocationMetrics, getAgentTopOverdueAccounts, getAgentAllocatedAccounts, AllocatedAccount } from '@/lib/allocation-service';
import { supabase } from '@/lib/supabase/client';
import { reminderService } from '@/lib/reminder-service';

// Cache keys
const CACHE_KEYS = {
  agentMetrics: (agentId: string) => ['agent-metrics', agentId],
  allocationMetrics: (agentId: string) => ['allocation-metrics', agentId],
  overdueAccounts: (agentId: string) => ['overdue-accounts', agentId],
  pendingSettlements: (agentName: string) => ['pending-settlements', agentName],
  callbacks: (agentId: string) => ['callbacks', agentId],
  brokenPTPs: (agentId: string) => ['broken-ptps', agentId],
  allocatedAccounts: (agentId: string) => ['allocated-accounts', agentId],
} as const;

// Cache durations (in milliseconds)
const CACHE_TIMES = {
  SHORT: 2 * 60 * 1000,    // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes - for moderately changing data
  LONG: 15 * 60 * 1000,    // 15 minutes - for slowly changing data
} as const;

interface DashboardData {
  combinedMetrics: AgentMetrics;
  topOverdueAccounts: AllocatedAccount[];
  pendingSettlementsCount: number;
  callbacksCount: number;
  brokenPTPsCount: number;
}

export function useDashboardCache(agentId: string | null, agentName: string | null) {
  const queryClient = useQueryClient();

  // Fetch agent dashboard metrics
  const agentMetricsQuery = useQuery({
    queryKey: CACHE_KEYS.agentMetrics(agentId || ''),
    queryFn: () => fetchAgentDashboardMetrics(agentId!),
    enabled: !!agentId,
    staleTime: 0, // Force refresh for testing
    gcTime: CACHE_TIMES.LONG,
  });

  // Fetch allocation metrics
  const allocationMetricsQuery = useQuery({
    queryKey: CACHE_KEYS.allocationMetrics(agentId || ''),
    queryFn: () => getAgentAllocationMetrics(agentId!),
    enabled: !!agentId,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  });

  // Fetch overdue accounts
  const overdueAccountsQuery = useQuery({
    queryKey: CACHE_KEYS.overdueAccounts(agentId || ''),
    queryFn: () => getAgentTopOverdueAccounts(agentId!, 5),
    enabled: !!agentId,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  });

  // Fetch pending settlements
  const pendingSettlementsQuery = useQuery({
    queryKey: CACHE_KEYS.pendingSettlements(agentName || ''),
    queryFn: async () => {
      const { data: agentSettlements, error } = await supabase
        .from('Settlements')
        .select('*')
        .eq('agent_name', agentName);
      
      if (error) throw error;
      
      const pendingSettlements = agentSettlements?.filter(settlement => 
        settlement.status?.toLowerCase() === 'pending') || [];
      
      return pendingSettlements.length;
    },
    enabled: !!agentName,
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
  });

  // Fetch callbacks count
  const callbacksQuery = useQuery({
    queryKey: CACHE_KEYS.callbacks(agentId || ''),
    queryFn: () => reminderService.getPendingMissedCallbacksCount(agentId!, { useAdmin: true }),
    enabled: !!agentId,
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
  });

  // Fetch broken PTPs count
  const brokenPTPsQuery = useQuery({
    queryKey: CACHE_KEYS.brokenPTPs(agentId || ''),
    queryFn: () => reminderService.getBrokenPTPsCount(agentId!, { useAdmin: true }),
    enabled: !!agentId,
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
  });

  // Fetch allocated accounts
  const allocatedAccountsQuery = useQuery({
    queryKey: CACHE_KEYS.allocatedAccounts(agentId || ''),
    queryFn: () => getAgentAllocatedAccounts(agentId!),
    enabled: !!agentId,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  });

  // Combine all data
  const combinedData: DashboardData | null = (() => {
    if (!agentMetricsQuery.data || !allocationMetricsQuery.data || !allocatedAccountsQuery.data) {
      return null;
    }

    const unworkedCount = allocatedAccountsQuery.data.filter(account => 
      !account.lastInteractionDate
    ).length;

    const combinedMetrics: AgentMetrics = {
      ...agentMetricsQuery.data,
      allocatedAccounts: {
        total: unworkedCount,
        remaining: unworkedCount,
        value: allocationMetricsQuery.data.totalValue,
        contactRate: allocationMetricsQuery.data.contactRate,
        overdueCount: allocationMetricsQuery.data.overdueAccounts,
        overdueValue: allocationMetricsQuery.data.overdueValue,
        highPriorityCount: allocationMetricsQuery.data.highPriorityAccounts,
      },
    };

    return {
      combinedMetrics,
      topOverdueAccounts: overdueAccountsQuery.data || [],
      pendingSettlementsCount: pendingSettlementsQuery.data || 0,
      callbacksCount: callbacksQuery.data || 0,
      brokenPTPsCount: brokenPTPsQuery.data || 0,
    };
  })();

  // Refresh functions for manual cache invalidation
  const refreshAll = useCallback(() => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.agentMetrics(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.allocationMetrics(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.overdueAccounts(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.callbacks(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.brokenPTPs(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.allocatedAccounts(agentId) });
    }
    if (agentName) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.pendingSettlements(agentName) });
    }
  }, [agentId, agentName, queryClient]);

  const refreshMetrics = useCallback(() => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.agentMetrics(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.allocationMetrics(agentId) });
    }
  }, [agentId, queryClient]);

  const refreshCounts = useCallback(() => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.callbacks(agentId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.brokenPTPs(agentId) });
    }
    if (agentName) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.pendingSettlements(agentName) });
    }
  }, [agentId, agentName, queryClient]);

  // Loading states
  const isLoading = agentMetricsQuery.isLoading || 
                   allocationMetricsQuery.isLoading || 
                   allocatedAccountsQuery.isLoading;

  const isRefreshing = agentMetricsQuery.isFetching || 
                      allocationMetricsQuery.isFetching || 
                      overdueAccountsQuery.isFetching ||
                      pendingSettlementsQuery.isFetching ||
                      callbacksQuery.isFetching ||
                      brokenPTPsQuery.isFetching ||
                      allocatedAccountsQuery.isFetching;

  // Error states
  const error = agentMetricsQuery.error || 
               allocationMetricsQuery.error || 
               overdueAccountsQuery.error ||
               pendingSettlementsQuery.error ||
               callbacksQuery.error ||
               brokenPTPsQuery.error ||
               allocatedAccountsQuery.error;

  return {
    data: combinedData,
    isLoading,
    isRefreshing,
    error: error?.message || null,
    refreshAll,
    refreshMetrics,
    refreshCounts,
    // Individual query states for granular control
    queries: {
      agentMetrics: agentMetricsQuery,
      allocationMetrics: allocationMetricsQuery,
      overdueAccounts: overdueAccountsQuery,
      pendingSettlements: pendingSettlementsQuery,
      callbacks: callbacksQuery,
      brokenPTPs: brokenPTPsQuery,
      allocatedAccounts: allocatedAccountsQuery,
    }
  };
}
