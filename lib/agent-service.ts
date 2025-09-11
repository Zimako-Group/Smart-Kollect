// Intelligent Agent Service for replacing traditional CRON jobs
import { createClient } from '@supabase/supabase-js';
import { checkForExpiredSettlements } from '@/lib/settlement-service';
import { checkForDefaultedManualPTPs } from '@/lib/manual-ptp-service';
import { initializeMonthlyPerformance } from '@/lib/agent-performance-service';

// Create server-side Supabase client for Node.js environment
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });
}

// Types for agent management
export interface Agent {
  id: string;
  name: string;
  type: 'settlement' | 'ptp' | 'payment' | 'allocation' | 'performance' | 'cleanup' | 'reporting';
  status: 'idle' | 'running' | 'sleeping' | 'error';
  lastRun?: string;
  nextRun?: string;
  schedule: string; // cron expression
  lastResult?: string;
  error?: string;
  metrics?: {
    executions: number;
    successes: number;
    failures: number;
    avgDuration: number;
  };
}

// Types for agent execution
export interface AgentExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}

// Initialize the agent system
export async function initializeAgentSystem(): Promise<void> {
  try {
    console.log('Initializing agent system...');
    
    // Register default agents
    await registerDefaultAgents();
    
    console.log('Agent system initialized successfully');
  } catch (error) {
    console.error('Error initializing agent system:', error);
  }
}

// Register default agents
async function registerDefaultAgents(): Promise<void> {
  const supabase = getServerSupabaseClient();
  
  const defaultAgents: Omit<Agent, 'id'>[] = [
    {
      name: 'Settlement Expiry Checker',
      type: 'settlement',
      status: 'sleeping',
      schedule: '0 0 * * *', // Daily at midnight
      metrics: {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0
      }
    },
    {
      name: 'PTP Default Checker',
      type: 'ptp',
      status: 'sleeping',
      schedule: '0 0 * * *', // Daily at midnight
      metrics: {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0
      }
    },
    {
      name: 'Monthly Performance Initializer',
      type: 'performance',
      status: 'sleeping',
      schedule: '0 1 1 * *', // First day of month at 1 AM
      metrics: {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0
      }
    }
  ];
  
  for (const agent of defaultAgents) {
    const { data, error } = await supabase
      .from('agents')
      .upsert(agent, { onConflict: 'name' });
      
    if (error) {
      console.error(`Error registering agent ${agent.name}:`, error);
    } else {
      console.log(`Agent ${agent.name} registered successfully`);
    }
  }
}

// Execute settlement agent
async function executeSettlementAgent(): Promise<AgentExecutionResult> {
  try {
    console.log('Executing Settlement Expiry Checker agent...');
    const expiredCount = await checkForExpiredSettlements();
    
    return {
      success: true,
      message: `Successfully checked for expired settlements. Found and updated ${expiredCount} expired settlements.`,
      data: { expiredCount },
      duration: 0 // Will be set by caller
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check for expired settlements: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0 // Will be set by caller
    };
  }
}

// Execute PTP agent
async function executePTPAgent(): Promise<AgentExecutionResult> {
  try {
    console.log('Executing PTP Default Checker agent...');
    await checkForDefaultedManualPTPs();
    
    return {
      success: true,
      message: 'Successfully checked for defaulted PTPs and updated their status.',
      duration: 0 // Will be set by caller
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check for defaulted PTPs: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0 // Will be set by caller
    };
  }
}

// Execute performance agent
async function executePerformanceAgent(): Promise<AgentExecutionResult> {
  try {
    console.log('Executing Monthly Performance Initializer agent...');
    await initializeMonthlyPerformance();
    
    return {
      success: true,
      message: 'Successfully initialized monthly performance records for all agents.',
      duration: 0 // Will be set by caller
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize monthly performance records: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0 // Will be set by caller
    };
  }
}

// Execute a specific agent by ID
export async function executeAgent(agentId: string): Promise<AgentExecutionResult> {
  const supabase = getServerSupabaseClient();
  const startTime = Date.now();
  
  try {
    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
      
    if (agentError || !agent) {
      return {
        success: false,
        message: `Agent not found: ${agentId}`,
        duration: 0
      };
    }
    
    // Update agent status to running
    await updateAgentStatus(agentId, 'running');
    
    let result: AgentExecutionResult;
    
    // Execute based on agent type
    switch (agent.type) {
      case 'settlement':
        result = await executeSettlementAgent();
        break;
      case 'ptp':
        result = await executePTPAgent();
        break;
      case 'performance':
        result = await executePerformanceAgent();
        break;
      default:
        result = {
          success: false,
          message: `Unknown agent type: ${agent.type}`,
          duration: 0
        };
    }
    
    const duration = Date.now() - startTime;
    
    // Update agent metrics
    await updateAgentMetrics(agentId, result.success, duration);
    
    // Update agent status
    await updateAgentStatus(agentId, 'sleeping', new Date().toISOString());
    
    return {
      ...result,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Update agent with error
    await updateAgentStatus(agentId, 'error', new Date().toISOString(), error instanceof Error ? error.message : String(error));
    
    // Update agent metrics
    await updateAgentMetrics(agentId, false, duration);
    
    return {
      success: false,
      message: `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
      duration
    };
  }
}

// Update agent status
async function updateAgentStatus(agentId: string, status: Agent['status'], lastRun?: string, error?: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const updateData: any = { status };
  
  if (lastRun) {
    updateData.lastRun = lastRun;
  }
  
  if (error) {
    updateData.error = error;
  } else if (status !== 'error') {
    // Clear error when not in error state
    updateData.error = null;
  }
  
  const { error: updateError } = await supabase
    .from('agents')
    .update(updateData)
    .eq('id', agentId);
    
  if (updateError) {
    console.error(`Error updating agent ${agentId} status:`, updateError);
  }
}

// Update agent metrics
async function updateAgentMetrics(agentId: string, success: boolean, duration: number): Promise<void> {
  const supabase = getServerSupabaseClient();
  
  try {
    // Get current agent data
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('metrics')
      .eq('id', agentId)
      .single();
      
    if (fetchError || !agent) {
      console.error(`Error fetching agent ${agentId} for metrics update:`, fetchError);
      return;
    }
    
    // Calculate new metrics
    const currentMetrics = agent.metrics || {
      executions: 0,
      successes: 0,
      failures: 0,
      avgDuration: 0
    };
    
    const newMetrics = {
      ...currentMetrics,
      executions: currentMetrics.executions + 1,
      successes: success ? currentMetrics.successes + 1 : currentMetrics.successes,
      failures: success ? currentMetrics.failures : currentMetrics.failures + 1,
      avgDuration: ((currentMetrics.avgDuration * currentMetrics.executions) + duration) / (currentMetrics.executions + 1)
    };
    
    // Update metrics
    const { error: updateError } = await supabase
      .from('agents')
      .update({ metrics: newMetrics })
      .eq('id', agentId);
      
    if (updateError) {
      console.error(`Error updating agent ${agentId} metrics:`, updateError);
    }
  } catch (error) {
    console.error(`Error in updateAgentMetrics for agent ${agentId}:`, error);
  }
}

// Get all agents
export async function getAllAgents(): Promise<Agent[]> {
  const supabase = getServerSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllAgents:', error);
    return [];
  }
}

// Get agent by ID
export async function getAgentById(agentId: string): Promise<Agent | null> {
  const supabase = getServerSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
      
    if (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error(`Error in getAgentById for ${agentId}:`, error);
    return null;
  }
}