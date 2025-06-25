import { supabase, supabaseAdmin } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export type BreakType = 'lunch' | 'tea' | 'bathroom' | 'other';

export interface AgentBreak {
  id: string;
  agentId: string;
  breakType: BreakType;
  startTime: string;
  endTime: string | null;
  duration: number | null; // Duration in minutes
  notes: string | null;
  createdAt: string;
}

/**
 * Start a break for an agent
 */
export async function startAgentBreak(
  agentId: string,
  breakType: BreakType,
  notes: string | null = null
): Promise<{ success: boolean; breakId: string | null; error: string | null }> {
  try {
    console.log(`[AGENT BREAKS] Starting ${breakType} break for agent ${agentId}`);
    
    // Check if the agent already has an active break
    const { data: activeBreaks, error: checkError } = await supabaseAdmin
      .from('agent_breaks')
      .select('*')
      .eq('agent_id', agentId)
      .is('end_time', null)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is what we want
      console.error('[AGENT BREAKS] Error checking for active breaks:', checkError);
      return { success: false, breakId: null, error: 'Error checking for active breaks' };
    }
    
    if (activeBreaks) {
      return { 
        success: false, 
        breakId: null, 
        error: `You already have an active ${activeBreaks.break_type} break. Please end it before starting a new one.` 
      };
    }
    
    // Create a new break record
    const breakId = uuidv4();
    const now = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('agent_breaks')
      .insert({
        id: breakId,
        agent_id: agentId,
        break_type: breakType,
        start_time: now,
        end_time: null,
        notes: notes,
        created_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('[AGENT BREAKS] Error starting break:', error);
      return { success: false, breakId: null, error: error.message };
    }
    
    console.log('[AGENT BREAKS] Break started successfully:', data);
    return { success: true, breakId: breakId, error: null };
  } catch (error) {
    console.error('[AGENT BREAKS] Error in startAgentBreak:', error);
    return { success: false, breakId: null, error: 'An unexpected error occurred' };
  }
}

/**
 * End an active break for an agent
 */
export async function endAgentBreak(
  agentId: string
): Promise<{ success: boolean; error: string | null; duration: number | null }> {
  try {
    console.log(`[AGENT BREAKS] Ending break for agent ${agentId}`);
    
    // Find the active break for this agent
    const { data: activeBreak, error: findError } = await supabaseAdmin
      .from('agent_breaks')
      .select('*')
      .eq('agent_id', agentId)
      .is('end_time', null)
      .single();
    
    if (findError) {
      console.error('[AGENT BREAKS] Error finding active break:', findError);
      return { success: false, error: 'No active break found', duration: null };
    }
    
    if (!activeBreak) {
      return { success: false, error: 'No active break found', duration: null };
    }
    
    // Calculate duration in minutes
    const startTime = new Date(activeBreak.start_time);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    // Update the break record with end time and duration
    const { data, error } = await supabaseAdmin
      .from('agent_breaks')
      .update({
        end_time: endTime.toISOString(),
        duration: durationMinutes
      })
      .eq('id', activeBreak.id)
      .select()
      .single();
    
    if (error) {
      console.error('[AGENT BREAKS] Error ending break:', error);
      return { success: false, error: error.message, duration: null };
    }
    
    console.log('[AGENT BREAKS] Break ended successfully:', data);
    return { success: true, error: null, duration: durationMinutes };
  } catch (error) {
    console.error('[AGENT BREAKS] Error in endAgentBreak:', error);
    return { success: false, error: 'An unexpected error occurred', duration: null };
  }
}

/**
 * Get the current active break for an agent if any
 */
export async function getActiveBreak(agentId: string): Promise<AgentBreak | null> {
  try {
    console.log(`[AGENT BREAKS] Checking for active break for agent ${agentId}`);
    
    const { data, error } = await supabaseAdmin
      .from('agent_breaks')
      .select('*')
      .eq('agent_id', agentId)
      .is('end_time', null)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('[AGENT BREAKS] Error checking for active break:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Format the break data to match our interface
    return {
      id: data.id,
      agentId: data.agent_id,
      breakType: data.break_type,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('[AGENT BREAKS] Error in getActiveBreak:', error);
    return null;
  }
}

/**
 * Get break history for an agent
 */
export async function getAgentBreakHistory(
  agentId: string,
  limit: number = 10
): Promise<AgentBreak[]> {
  try {
    console.log(`[AGENT BREAKS] Getting break history for agent ${agentId}`);
    
    const { data, error } = await supabaseAdmin
      .from('agent_breaks')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[AGENT BREAKS] Error getting break history:', error);
      return [];
    }
    
    // Format the break data to match our interface
    return data.map(item => ({
      id: item.id,
      agentId: item.agent_id,
      breakType: item.break_type,
      startTime: item.start_time,
      endTime: item.end_time,
      duration: item.duration,
      notes: item.notes,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('[AGENT BREAKS] Error in getAgentBreakHistory:', error);
    return [];
  }
}

/**
 * Get break statistics for an agent
 */
export async function getAgentBreakStats(
  agentId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalBreaks: number;
  totalDuration: number;
  breaksByType: Record<BreakType, { count: number; duration: number }>;
}> {
  try {
    console.log(`[AGENT BREAKS] Getting break stats for agent ${agentId} from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabaseAdmin
      .from('agent_breaks')
      .select('*')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) {
      console.error('[AGENT BREAKS] Error getting break stats:', error);
      return {
        totalBreaks: 0,
        totalDuration: 0,
        breaksByType: {
          lunch: { count: 0, duration: 0 },
          tea: { count: 0, duration: 0 },
          bathroom: { count: 0, duration: 0 },
          other: { count: 0, duration: 0 }
        }
      };
    }
    
    // Initialize stats
    const stats = {
      totalBreaks: data.length,
      totalDuration: 0,
      breaksByType: {
        lunch: { count: 0, duration: 0 },
        tea: { count: 0, duration: 0 },
        bathroom: { count: 0, duration: 0 },
        other: { count: 0, duration: 0 }
      }
    };
    
    // Calculate stats
    data.forEach(breakItem => {
      const duration = breakItem.duration || 0;
      stats.totalDuration += duration;
      
      const breakType = breakItem.break_type as BreakType;
      stats.breaksByType[breakType].count += 1;
      stats.breaksByType[breakType].duration += duration;
    });
    
    return stats;
  } catch (error) {
    console.error('[AGENT BREAKS] Error in getAgentBreakStats:', error);
    return {
      totalBreaks: 0,
      totalDuration: 0,
      breaksByType: {
        lunch: { count: 0, duration: 0 },
        tea: { count: 0, duration: 0 },
        bathroom: { count: 0, duration: 0 },
        other: { count: 0, duration: 0 }
      }
    };
  }
}
