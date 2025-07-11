// Agent dashboard data fetching utilities
import { supabase } from './supabaseClient';
import { getAgentAccountMetrics } from './agent-accounts';
import { getAgentPTPCount, getAgentMonthlyPTPCount } from './ptp-service';
import { getPendingSettlementsCount } from './settlement-service';

// Types for agent metrics
export interface AgentMetrics {
  allocatedAccounts: {
    total: number;
    remaining: number;
    contactRate: number;
    value: number;
    overdueCount: number;
    overdueValue: number;
    highPriorityCount: number;
  };
  debiChecks: {
    total: number;
    target: number;
    percentOfTarget: number;
    changeVsLastMonth: number;
  };
  yeboPay: {
    total: number;
    successRate: number;
    value: number;
    changeVsLastMonth: number;
  };
  settlements: {
    total: number;
    adherenceRate: number;
    value: number;
    changeVsLastMonth: number;
  };
  ptp: {
    total: number;
    target: number;
    percentOfTarget: number;
    changeVsLastMonth: number;
  };
  contactRate: {
    rate: number;
    callsToday: number;
    changeVsLastWeek: number;
    successRate: number;
    target: number;
    changeVsTarget: number;
  };
  flags: {
    total: number;
    active: number;
    highPriority: number;
    resolutionRate: number;
    changeVsLastWeek: number;
  };
  reminders: {
    pending: number;
    dueToday: number;
    completionRate: number;
    completed: number;
  };
  urgentFollowUps: {
    total: number;
  };
  todaysCallbacks: {
    total: number;
  };
  paymentPlansDue: {
    total: number;
  };
  collectionRate: {
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

// Default metrics
export const defaultAgentMetrics: AgentMetrics = {
  allocatedAccounts: { total: 0, remaining: 0, contactRate: 0, value: 0, overdueCount: 0, overdueValue: 0, highPriorityCount: 0 },
  debiChecks: { total: 0, target: 60, percentOfTarget: 0, changeVsLastMonth: 0 },
  yeboPay: { total: 0, successRate: 0, value: 0, changeVsLastMonth: 0 },
  settlements: { total: 0, adherenceRate: 0, value: 0, changeVsLastMonth: 0 },
  ptp: { total: 0, target: 35, percentOfTarget: 0, changeVsLastMonth: 0 },
  contactRate: { rate: 0, callsToday: 0, changeVsLastWeek: 0, successRate: 0, target: 0, changeVsTarget: 0 },
  flags: { total: 0, active: 0, highPriority: 0, resolutionRate: 0, changeVsLastWeek: 0 },
  reminders: { pending: 0, dueToday: 0, completionRate: 0, completed: 0 },
  urgentFollowUps: { total: 0 },
  todaysCallbacks: { total: 0 },
  paymentPlansDue: { total: 0 },
  collectionRate: { rate: 0, target: 0, changeVsTarget: 0 },
  promiseToPayConversion: { rate: 0, target: 0, changeVsTarget: 0 },
  collectionSummary: { collected: 0, target: 0, casesClosed: 0, newPaymentPlans: 0 },
  ranking: { position: 0, percentile: 0, change: 0 }
};

// Fetch agent performance from profiles table
export async function fetchAgentPerformance(agentId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('performance')
    .eq('id', agentId)
    .single();
    
  if (error) {
    console.error("Error fetching agent performance:", error);
    return null;
  }
  
  return data?.performance;
}

// Fetch agent's allocated accounts
export async function fetchAgentAllocatedAccounts(agentId: string) {
  try {
    // Get real account metrics from the agent-accounts utility
    const accountMetrics = await getAgentAccountMetrics(agentId);
    
    return {
      total: accountMetrics.totalAccounts,
      contactRate: accountMetrics.contactRate,
      value: accountMetrics.totalValue
    };
  } catch (error) {
    console.error("Error fetching allocated accounts:", error);
    return {
      total: 0,
      contactRate: 0,
      value: 0
    };
  }
}

// Fetch agent's metrics for dashboard
export async function fetchAgentDashboardMetrics(agentId: string): Promise<AgentMetrics> {
  try {
    console.log(`[AGENT-DASHBOARD] Starting fetchAgentDashboardMetrics for agent: ${agentId}`);
    
    // Fetch agent performance data
    const performance = await fetchAgentPerformance(agentId);
    
    // Fetch allocated accounts
    const allocatedAccounts = await fetchAgentAllocatedAccounts(agentId);
    
    // Fetch agent's monthly PTP count (current month only)
    console.log(`[AGENT-DASHBOARD] About to fetch monthly PTP count for agent: ${agentId}`);
    const ptpCount = await getAgentMonthlyPTPCount(agentId);
    console.log(`[AGENT-DASHBOARD] ✅ Fetched monthly PTP count for agent ${agentId}: ${ptpCount}`);
    console.log(`[AGENT-DASHBOARD] PTP count type: ${typeof ptpCount}`);
    
    if (ptpCount === 0) {
      console.warn(`[AGENT-DASHBOARD] ⚠️  PTP count is 0 for agent ${agentId} - this might be expected if no PTPs this month`);
    }
    
    // Calculate PTP percentage of target
    const ptpTarget = 35; // Default target
    const ptpPercentOfTarget = ptpTarget > 0 ? (ptpCount / ptpTarget) * 100 : 0;
    console.log(`[AGENT-DASHBOARD] 📊 PTP calculations:`, {
      ptpCount,
      ptpTarget,
      ptpPercentOfTarget
    });
    
    // Get the agent's name from the profiles table to use for settlements lookup
    console.log(`[AGENT-DASHBOARD] 🔍 About to fetch agent name for settlements lookup...`);
    const { data: agentData, error: agentError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', agentId)
      .single();
      
    if (agentError) {
      console.error("[AGENT-DASHBOARD] ❌ Error fetching agent name:", agentError);
      return defaultAgentMetrics;
    }
    
    const agentName = agentData?.full_name;
    console.log(`[AGENT-DASHBOARD] ✅ Agent name for ID ${agentId}: ${agentName}`);
    console.log(`[AGENT-DASHBOARD] 🏃 Continuing with settlements lookup...`);
    
    // Debug: Query settlements table directly to see what's there
    const { data: allSettlements, error: settlementsError } = await supabase
      .from('Settlements')
      .select('*');
      
    if (settlementsError) {
      console.error("Error fetching all settlements:", settlementsError);
    } else {
      console.log(`[DASHBOARD] All settlements in database: ${allSettlements.length}`);
      console.log('[DASHBOARD] First few settlements:', allSettlements.slice(0, 3));
      
      // Check for agent's settlements specifically
      const agentSettlements = allSettlements.filter(s => 
        s.agent_name === agentName || 
        s.agent_name === agentName?.trim());
      console.log(`[DASHBOARD] Found ${agentSettlements.length} settlements for agent ${agentName}`);
      
      // Check for pending settlements specifically
      const pendingSettlements = allSettlements.filter(s => 
        (s.status === 'pending' || s.status === 'Pending') && 
        (s.agent_name === agentName || s.agent_name === agentName?.trim()));
      console.log(`[DASHBOARD] Found ${pendingSettlements.length} PENDING settlements for agent ${agentName}`);
    }
    
    // Get the pending settlements count directly from the filtered results
    let pendingSettlementsCount = 0;
    if (agentName && allSettlements) {
      // Use the direct count from our filtered results above instead of calling the function
      const pendingSettlements = allSettlements.filter(s => 
        (s.status === 'pending' || s.status === 'Pending') && 
        (s.agent_name === agentName || s.agent_name === agentName?.trim()));
      pendingSettlementsCount = pendingSettlements.length;
      console.log(`[DASHBOARD] Using direct count of pending settlements for agent ${agentName}: ${pendingSettlementsCount}`);
    } else {
      // Fallback to the original method if we couldn't get settlements directly
      if (agentName) {
        pendingSettlementsCount = await getPendingSettlementsCount(agentName);
        console.log(`[DASHBOARD] Falling back to getPendingSettlementsCount: ${pendingSettlementsCount}`);
      }
    }
    
    // In a real implementation, you would fetch all these metrics from your database
    // For now, returning mock data that matches your current UI
    console.log(`[AGENT-DASHBOARD] 🔍 About to return PTP data:`, {
      ptpCount,
      ptpTarget,
      ptpPercentOfTarget: Math.round(ptpPercentOfTarget)
    });
    
    const result = {
      allocatedAccounts: {
        total: allocatedAccounts.total,
        remaining: allocatedAccounts.total, // Initially set remaining to total, will be updated by agent-accounts.ts
        contactRate: allocatedAccounts.contactRate,
        value: allocatedAccounts.value,
        overdueCount: 0,
        overdueValue: 0,
        highPriorityCount: 0
      },
      debiChecks: {
        total: 0,
        target: 60,
        percentOfTarget: 0,
        changeVsLastMonth: 0
      },
      yeboPay: {
        total: 0,
        successRate: 0,
        value: 0,
        changeVsLastMonth: 0
      },
      settlements: {
        total: pendingSettlementsCount, // Use the real pending settlements count
        adherenceRate: 0,
        value: 0,
        changeVsLastMonth: 0
      },
      ptp: {
        total: ptpCount, // Use the real PTP count
        target: ptpTarget,
        percentOfTarget: Math.round(ptpPercentOfTarget),
        changeVsLastMonth: 8.2
      },
      contactRate: {
        rate: 63.2,
        callsToday: 89,
        changeVsLastWeek: 5.7,
        successRate: 63.2,
        target: 70,
        changeVsTarget: 2
      },
      flags: {
        total: 17,
        active: 17,
        highPriority: 5,
        resolutionRate: 58,
        changeVsLastWeek: 3.2
      },
      reminders: {
        pending: 12,
        dueToday: 3,
        completionRate: 75,
        completed: 4.3
      },
      urgentFollowUps: {
        total: 0
      },
      todaysCallbacks: {
        total: 0
      },
      paymentPlansDue: {
        total: 0
      },
      collectionRate: {
        rate: 68,
        target: 65,
        changeVsTarget: 3
      },
      promiseToPayConversion: {
        rate: 58,
        target: 60,
        changeVsTarget: -2
      },
      collectionSummary: {
        collected: 145231.89,
        target: 200000,
        casesClosed: 37,
        newPaymentPlans: 42
      },
      ranking: {
        position: 2,
        percentile: 10,
        change: 3
      }
    };
    
    console.log(`[AGENT-DASHBOARD] 🚀 Returning PTP result:`, result.ptp);
    return result;
  } catch (error) {
    console.error("Error fetching agent dashboard metrics:", error);
    return defaultAgentMetrics;
  }
}

// Update agent performance metrics
export async function updateAgentPerformance(agentId: string, performance: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ performance })
    .eq('id', agentId);
    
  if (error) {
    console.error("Error updating agent performance:", error);
    return false;
  }
  
  return true;
}
