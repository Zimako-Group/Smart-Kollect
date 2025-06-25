import { supabase } from './supabaseClient';

/**
 * Interface for an account interaction
 */
export interface AccountInteraction {
  id?: string;
  account_id: string;
  agent_id: string;
  interaction_type: InteractionType;
  interaction_details?: string;
  created_at?: string;
}

/**
 * Types of interactions an agent can have with an account
 */
export enum InteractionType {
  VIEWED = 'viewed',
  CALLED = 'called',
  EMAILED = 'emailed',
  MESSAGED = 'messaged',
  PAYMENT_ARRANGEMENT = 'payment_arrangement',
  PAYMENT_RECEIVED = 'payment_received',
  NOTE_ADDED = 'note_added',
  OTHER = 'other'
}

/**
 * Record an interaction between an agent and an account
 */
export async function recordAccountInteraction(
  accountId: string,
  agentId: string,
  interactionType: InteractionType,
  details?: string
): Promise<{ success: boolean; error?: string; interaction?: AccountInteraction }> {
  try {
    console.log(`[INTERACTION SERVICE] Recording ${interactionType} interaction for account ${accountId} by agent ${agentId}`);
    
    // Create the interaction record
    const interaction: AccountInteraction = {
      account_id: accountId,
      agent_id: agentId,
      interaction_type: interactionType,
      interaction_details: details || '',
    };
    
    // Insert into the database
    const { data, error } = await supabase
      .from('account_interactions')
      .insert(interaction)
      .select()
      .single();
    
    if (error) {
      console.error('[INTERACTION SERVICE] Error recording interaction:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[INTERACTION SERVICE] Interaction recorded successfully:', data);
    return { success: true, interaction: data };
  } catch (error) {
    console.error('[INTERACTION SERVICE] Unexpected error recording interaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get recent interactions for an account
 */
export async function getAccountInteractions(
  accountId: string,
  limit: number = 10
): Promise<{ interactions: AccountInteraction[]; error?: string }> {
  try {
    console.log(`[INTERACTION SERVICE] Getting interactions for account ${accountId}`);
    
    const { data, error } = await supabase
      .from('account_interactions')
      .select(`
        id,
        account_id,
        agent_id,
        interaction_type,
        interaction_details,
        created_at,
        profiles:agent_id (full_name)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[INTERACTION SERVICE] Error getting interactions:', error);
      return { interactions: [], error: error.message };
    }
    
    console.log(`[INTERACTION SERVICE] Retrieved ${data.length} interactions`);
    return { interactions: data };
  } catch (error) {
    console.error('[INTERACTION SERVICE] Unexpected error getting interactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { interactions: [], error: errorMessage };
  }
}

/**
 * Get recent interactions by an agent
 */
export async function getAgentInteractions(
  agentId: string,
  limit: number = 20
): Promise<{ interactions: AccountInteraction[]; error?: string }> {
  try {
    console.log(`[INTERACTION SERVICE] Getting interactions for agent ${agentId}`);
    
    const { data, error } = await supabase
      .from('account_interactions')
      .select(`
        id,
        account_id,
        agent_id,
        interaction_type,
        interaction_details,
        created_at,
        Debtors:account_id (id, name, surname_company_trust, acc_number)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[INTERACTION SERVICE] Error getting agent interactions:', error);
      return { interactions: [], error: error.message };
    }
    
    console.log(`[INTERACTION SERVICE] Retrieved ${data.length} agent interactions`);
    return { interactions: data };
  } catch (error) {
    console.error('[INTERACTION SERVICE] Unexpected error getting agent interactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { interactions: [], error: errorMessage };
  }
}
