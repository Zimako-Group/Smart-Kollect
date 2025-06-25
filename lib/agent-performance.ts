// Agent performance tracking utilities
import { supabase } from './supabaseClient';

// Types for agent performance
export interface AgentPerformance {
  collectionRate: number;
  casesResolved: number;
  customerSatisfaction: number;
  // Extended metrics
  callsCompleted?: number;
  ptpsSecured?: number;
  settlementsNegotiated?: number;
  debiChecksCompleted?: number;
  yeboPayTransactions?: number;
  flagsResolved?: number;
  remindersCompleted?: number;
}

// Default performance metrics
export const defaultAgentPerformance: AgentPerformance = {
  collectionRate: 0,
  casesResolved: 0,
  customerSatisfaction: 0,
  callsCompleted: 0,
  ptpsSecured: 0,
  settlementsNegotiated: 0,
  debiChecksCompleted: 0,
  yeboPayTransactions: 0,
  flagsResolved: 0,
  remindersCompleted: 0
};

/**
 * Fetch agent performance from the profiles table
 * @param agentId The agent's user ID
 * @returns The agent's performance metrics or null if not found
 */
export async function getAgentPerformance(agentId: string): Promise<AgentPerformance | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('performance')
      .eq('id', agentId)
      .single();
      
    if (error) {
      console.error("Error fetching agent performance:", error);
      return null;
    }
    
    return data?.performance || defaultAgentPerformance;
  } catch (error) {
    console.error("Error in getAgentPerformance:", error);
    return null;
  }
}

/**
 * Update agent performance metrics
 * @param agentId The agent's user ID
 * @param performance The updated performance metrics
 * @returns True if update was successful, false otherwise
 */
export async function updateAgentPerformance(
  agentId: string, 
  performance: Partial<AgentPerformance>
): Promise<boolean> {
  try {
    // First get current performance
    const currentPerformance = (await getAgentPerformance(agentId)) || defaultAgentPerformance;
    
    // Merge with new performance data
    const updatedPerformance = {
      ...currentPerformance,
      ...performance
    };
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ performance: updatedPerformance })
      .eq('id', agentId);
      
    if (error) {
      console.error("Error updating agent performance:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateAgentPerformance:", error);
    return false;
  }
}

/**
 * Update specific performance metric for an agent
 * @param agentId The agent's user ID
 * @param metric The metric name to update
 * @param value The new value for the metric
 * @returns True if update was successful, false otherwise
 */
export async function updateAgentMetric(
  agentId: string,
  metric: keyof AgentPerformance,
  value: number
): Promise<boolean> {
  try {
    // Get current performance
    const currentPerformance = (await getAgentPerformance(agentId)) || defaultAgentPerformance;
    
    // Update specific metric
    const updatedPerformance = {
      ...currentPerformance,
      [metric]: value
    };
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ performance: updatedPerformance })
      .eq('id', agentId);
      
    if (error) {
      console.error(`Error updating agent metric ${metric}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in updateAgentMetric for ${metric}:`, error);
    return false;
  }
}

/**
 * Increment a specific performance metric for an agent
 * @param agentId The agent's user ID
 * @param metric The metric name to increment
 * @param incrementBy The amount to increment by (default: 1)
 * @returns True if update was successful, false otherwise
 */
export async function incrementAgentMetric(
  agentId: string,
  metric: keyof AgentPerformance,
  incrementBy: number = 1
): Promise<boolean> {
  try {
    // Get current performance
    const currentPerformance = (await getAgentPerformance(agentId)) || defaultAgentPerformance;
    
    // Calculate new value
    const currentValue = currentPerformance[metric] || 0;
    const newValue = currentValue + incrementBy;
    
    // Update specific metric
    const updatedPerformance = {
      ...currentPerformance,
      [metric]: newValue
    };
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ performance: updatedPerformance })
      .eq('id', agentId);
      
    if (error) {
      console.error(`Error incrementing agent metric ${metric}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in incrementAgentMetric for ${metric}:`, error);
    return false;
  }
}

/**
 * Track a successful collection for an agent
 * This updates multiple metrics including collection rate and cases resolved
 * @param agentId The agent's user ID
 * @param amount The amount collected
 * @returns True if update was successful, false otherwise
 */
export async function trackSuccessfulCollection(
  agentId: string,
  amount: number
): Promise<boolean> {
  try {
    // Get current performance
    const currentPerformance = (await getAgentPerformance(agentId)) || defaultAgentPerformance;
    
    // Update metrics
    const updatedPerformance = {
      ...currentPerformance,
      casesResolved: (currentPerformance.casesResolved || 0) + 1,
      // You might have a more complex calculation for collection rate
      // This is a simplified example
      collectionRate: Math.min((currentPerformance.collectionRate || 0) + 0.5, 100)
    };
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ performance: updatedPerformance })
      .eq('id', agentId);
      
    if (error) {
      console.error("Error tracking successful collection:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in trackSuccessfulCollection:", error);
    return false;
  }
}

/**
 * Record customer satisfaction rating for an agent
 * @param agentId The agent's user ID
 * @param rating The customer satisfaction rating (typically 1-5)
 * @returns True if update was successful, false otherwise
 */
export async function recordCustomerSatisfaction(
  agentId: string,
  rating: number
): Promise<boolean> {
  try {
    // Get current performance
    const currentPerformance = (await getAgentPerformance(agentId)) || defaultAgentPerformance;
    
    // Calculate new average satisfaction
    const currentSatisfaction = currentPerformance.customerSatisfaction || 0;
    const currentCount = currentPerformance.callsCompleted || 1; // Avoid division by zero
    
    // Simple moving average calculation
    const newSatisfaction = (currentSatisfaction * (currentCount - 1) + rating) / currentCount;
    
    // Update metrics
    const updatedPerformance = {
      ...currentPerformance,
      customerSatisfaction: newSatisfaction
    };
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ performance: updatedPerformance })
      .eq('id', agentId);
      
    if (error) {
      console.error("Error recording customer satisfaction:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in recordCustomerSatisfaction:", error);
    return false;
  }
}
