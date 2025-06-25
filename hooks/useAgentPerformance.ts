import { useState, useEffect, useCallback } from 'react';

export interface AgentMetrics {
  collectionRate: {
    rate: number;
    target: number;
    changeVsTarget: number;
  };
  contactRate: {
    rate: number;
    target: number;
    changeVsTarget: number;
  };
  promiseToPayConversion: {
    rate: number;
    target: number;
    changeVsTarget: number;
  };
  collectionSummary: {
    collected: number;
    target: number;
    casesClosed: number;
    newPaymentPlans: number;
  };
  ranking: {
    position: number;
    percentile: number;
    change: number;
  };
}

export function useAgentPerformance(agentId: string | null) {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentMetrics = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agent-performance/${agentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching agent metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agent metrics');
      
      // Set default metrics on error to prevent dashboard from breaking
      setMetrics({
        collectionRate: { rate: 0, target: 100, changeVsTarget: -100 },
        contactRate: { rate: 0, target: 80, changeVsTarget: -80 },
        promiseToPayConversion: { rate: 0, target: 70, changeVsTarget: -70 },
        collectionSummary: { collected: 0, target: 1200000, casesClosed: 0, newPaymentPlans: 0 },
        ranking: { position: 1, percentile: 0, change: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgentMetrics();
  }, [fetchAgentMetrics]);

  const refetch = useCallback(() => {
    if (agentId) {
      fetchAgentMetrics();
    }
  }, [agentId, fetchAgentMetrics]);

  return { metrics, loading, error, refetch };
}

// Hook for refreshing agent performance after payment allocation
export function useRefreshAgentPerformance() {
  const [refreshing, setRefreshing] = useState(false);

  const refreshPerformance = async (agentId: string) => {
    try {
      setRefreshing(true);
      
      // Trigger a refetch by making a request to the API
      const response = await fetch(`/api/agent-performance/${agentId}`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh agent performance');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error refreshing agent performance:', error);
      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshPerformance, refreshing };
}
