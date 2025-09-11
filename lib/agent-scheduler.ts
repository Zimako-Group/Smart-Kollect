// Agent Scheduler - Handles automatic execution of agents based on cron schedules
import { createClient } from '@supabase/supabase-js';
import { executeAgent, getAllAgents, Agent, AgentExecutionResult } from './agent-service';
import cron, { ScheduledTask } from 'node-cron';

// Create server-side Supabase client for scheduler
function getServerSupabaseClient() {
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

// Store active cron jobs
const activeCronJobs = new Map<string, ScheduledTask>();

// Initialize the scheduler
export async function initializeScheduler(): Promise<void> {
  try {
    console.log('Initializing agent scheduler...');
    
    // Get all agents from database
    const agents = await getAllAgents();
    
    // Schedule each agent
    for (const agent of agents) {
      await scheduleAgent(agent);
    }
    
    console.log(`Scheduler initialized with ${agents.length} agents`);
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    throw error;
  }
}

// Schedule a single agent
export async function scheduleAgent(agent: Agent): Promise<void> {
  try {
    // Stop existing job if it exists
    if (activeCronJobs.has(agent.id)) {
      activeCronJobs.get(agent.id)?.stop();
      activeCronJobs.delete(agent.id);
    }
    
    // Validate cron expression
    if (!cron.validate(agent.schedule)) {
      console.error(`Invalid cron expression for agent ${agent.name}: ${agent.schedule}`);
      return;
    }
    
    // Define schedule options with inline type annotation
    const scheduleOptions: {
      scheduled?: boolean;
      timezone?: string;
    } = {
      scheduled: false, // Don't start immediately
      timezone: 'Africa/Johannesburg' // South African timezone
    };
    
    // Create new cron job
    const task = cron.schedule(agent.schedule, async () => {
      console.log(`Executing scheduled agent: ${agent.name}`);
      
      try {
        const result: AgentExecutionResult = await executeAgent(agent.id);
        console.log(`Agent ${agent.name} executed successfully:`, result);
      } catch (error) {
        console.error(`Error executing scheduled agent ${agent.name}:`, error);
      }
    }, scheduleOptions);
    
    // Start the task
    task.start();
    
    // Store the task
    activeCronJobs.set(agent.id, task);
    
    console.log(`Agent ${agent.name} scheduled with cron: ${agent.schedule}`);
  } catch (error) {
    console.error(`Error scheduling agent ${agent.name}:`, error);
  }
}

// Unschedule an agent
export async function unscheduleAgent(agentId: string): Promise<void> {
  const task = activeCronJobs.get(agentId);
  if (task) {
    task.stop();
    activeCronJobs.delete(agentId);
    console.log(`Agent ${agentId} unscheduled`);
  }
}

// Reschedule all agents (useful when agents are updated)
export async function rescheduleAllAgents(): Promise<void> {
  try {
    console.log('Rescheduling all agents...');
    
    // Stop all existing jobs
    for (const [agentId, task] of activeCronJobs) {
      task.stop();
    }
    activeCronJobs.clear();
    
    // Reinitialize scheduler
    await initializeScheduler();
  } catch (error) {
    console.error('Error rescheduling agents:', error);
    throw error;
  }
}

// Get scheduler status
export function getSchedulerStatus(): {
  activeJobs: number;
  scheduledAgents: string[];
} {
  return {
    activeJobs: activeCronJobs.size,
    scheduledAgents: Array.from(activeCronJobs.keys())
  };
}

// Manual trigger for testing
export async function triggerAgentExecution(agentId: string): Promise<any> {
  try {
    console.log(`Manually triggering agent: ${agentId}`);
    const result = await executeAgent(agentId);
    return result;
  } catch (error) {
    console.error(`Error manually triggering agent ${agentId}:`, error);
    throw error;
  }
}

// Shutdown scheduler (cleanup)
export function shutdownScheduler(): void {
  console.log('Shutting down agent scheduler...');
  
  for (const [agentId, task] of activeCronJobs) {
    task.stop();
  }
  activeCronJobs.clear();
  
  console.log('Agent scheduler shut down');
}
