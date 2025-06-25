import { supabase } from '@/lib/supabaseClient';

/**
 * Service for managing agent performance metrics
 * This service is called during payment allocation to update agent performance
 */

export interface AgentPerformanceUpdate {
  agent_id: string;
  payment_amount: number;
  account_number: string;
  payment_date?: string;
}

/**
 * Update agent performance metrics when a payment is allocated
 */
export async function updateAgentPerformance(
  agentId: string, 
  paymentAmount: number, 
  accountNumber: string,
  paymentDate?: string
): Promise<void> {
  try {
    console.log(`Updating agent performance for agent ${agentId}, payment: R${paymentAmount}, account: ${accountNumber}`);
    
    // Get current month (first day of the month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if agent performance record exists for current month
    const { data: existingPerformance, error: fetchError } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .eq('month_year', monthYear)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching agent performance:', fetchError);
      throw new Error(`Failed to fetch agent performance: ${fetchError.message}`);
    }
    
    if (existingPerformance) {
      // Update existing record - add payment amount to collected amount
      const newCollectedAmount = (existingPerformance.collected_amount || 0) + paymentAmount;
      
      const { error: updateError } = await supabase
        .from('agent_performance')
        .update({
          collected_amount: newCollectedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPerformance.id);
      
      if (updateError) {
        console.error('Error updating agent performance:', updateError);
        throw new Error(`Failed to update agent performance: ${updateError.message}`);
      }
      
      console.log(`Updated agent ${agentId} performance: R${existingPerformance.collected_amount} -> R${newCollectedAmount}`);
    } else {
      // Create new record for this month
      const { error: insertError } = await supabase
        .from('agent_performance')
        .insert({
          agent_id: agentId,
          month_year: monthYear,
          collected_amount: paymentAmount,
          target_amount: 1200000, // R1.2M target as specified
          cases_closed: 0,
          new_payment_plans: 0,
          contacts_made: 0,
          total_accounts: 0,
          promises_to_pay: 0,
          promises_kept: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating agent performance record:', insertError);
        throw new Error(`Failed to create agent performance: ${insertError.message}`);
      }
      
      console.log(`Created new agent performance record for ${agentId} with R${paymentAmount} collected`);
    }
    
  } catch (error) {
    console.error('Agent performance update error:', error);
    // Don't throw error to avoid breaking payment allocation
    // Just log the error and continue
  }
}

/**
 * Batch update agent performance for multiple payments
 * This is more efficient when processing many payments at once
 */
export async function batchUpdateAgentPerformance(updates: AgentPerformanceUpdate[]): Promise<void> {
  try {
    console.log(`Batch updating agent performance for ${updates.length} payments`);
    
    // Group updates by agent_id
    const updatesByAgent = new Map<string, number>();
    
    for (const update of updates) {
      const currentAmount = updatesByAgent.get(update.agent_id) || 0;
      updatesByAgent.set(update.agent_id, currentAmount + update.payment_amount);
    }
    
    // Process each agent's total
    for (const [agentId, totalAmount] of updatesByAgent) {
      await updateAgentPerformance(agentId, totalAmount, 'batch_update');
    }
    
    console.log(`Completed batch update for ${updatesByAgent.size} agents`);
    
  } catch (error) {
    console.error('Batch agent performance update error:', error);
    // Don't throw error to avoid breaking payment allocation
  }
}

/**
 * Get current month's performance for an agent
 */
export async function getAgentCurrentPerformance(agentId: string) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .eq('month_year', monthYear)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get agent performance: ${error.message}`);
    }
    
    return data || {
      agent_id: agentId,
      month_year: monthYear,
      collected_amount: 0,
      target_amount: 1200000,
      cases_closed: 0,
      new_payment_plans: 0,
      contacts_made: 0,
      total_accounts: 0,
      promises_to_pay: 0,
      promises_kept: 0
    };
    
  } catch (error) {
    console.error('Error getting agent performance:', error);
    throw error;
  }
}

/**
 * Initialize agent performance tracking for all agents
 * This can be run monthly to ensure all agents have performance records
 */
export async function initializeMonthlyPerformance(): Promise<void> {
  try {
    console.log('Initializing monthly performance records for all agents');
    
    // Get all agents (users with role 'agent')
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'agent');
    
    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0];
    
    // Check which agents already have records for this month
    const { data: existingRecords, error: existingError } = await supabase
      .from('agent_performance')
      .select('agent_id')
      .eq('month_year', monthYear);
    
    if (existingError) {
      throw new Error(`Failed to fetch existing records: ${existingError.message}`);
    }
    
    const existingAgentIds = new Set(existingRecords?.map(r => r.agent_id) || []);
    
    // Create records for agents who don't have them yet
    const newRecords = agents
      ?.filter(agent => !existingAgentIds.has(agent.id))
      .map(agent => ({
        agent_id: agent.id,
        month_year: monthYear,
        collected_amount: 0,
        target_amount: 1200000,
        cases_closed: 0,
        new_payment_plans: 0,
        contacts_made: 0,
        total_accounts: 0,
        promises_to_pay: 0,
        promises_kept: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [];
    
    if (newRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('agent_performance')
        .insert(newRecords);
      
      if (insertError) {
        throw new Error(`Failed to create performance records: ${insertError.message}`);
      }
      
      console.log(`Created ${newRecords.length} new monthly performance records`);
    } else {
      console.log('All agents already have performance records for this month');
    }
    
  } catch (error) {
    console.error('Error initializing monthly performance:', error);
    throw error;
  }
}
