// Agent Monitoring Service - Real-time monitoring and statistics
import { createClient } from '@supabase/supabase-js';
import { Agent } from './agent-service';

// Create server-side Supabase client for monitoring
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

// Get agent statistics and health metrics
export async function getAgentStatistics(): Promise<{
  totalAgents: number;
  activeAgents: number;
  sleepingAgents: number;
  errorAgents: number;
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
}> {
  const supabase = getServerSupabaseClient();
  
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    if (!agents || agents.length === 0) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        sleepingAgents: 0,
        errorAgents: 0,
        totalExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0
      };
    }
    
    const stats = agents.reduce((acc, agent) => {
      // Count by status
      switch (agent.status) {
        case 'running':
          acc.activeAgents++;
          break;
        case 'sleeping':
          acc.sleepingAgents++;
          break;
        case 'error':
          acc.errorAgents++;
          break;
      }
      
      // Aggregate metrics
      if (agent.metrics) {
        acc.totalExecutions += agent.metrics.executions || 0;
        acc.totalSuccesses += agent.metrics.successes || 0;
        acc.totalDuration += (agent.metrics.avgDuration || 0) * (agent.metrics.executions || 0);
      }
      
      return acc;
    }, {
      totalAgents: agents.length,
      activeAgents: 0,
      sleepingAgents: 0,
      errorAgents: 0,
      totalExecutions: 0,
      totalSuccesses: 0,
      totalDuration: 0
    });
    
    return {
      ...stats,
      successRate: stats.totalExecutions > 0 ? (stats.totalSuccesses / stats.totalExecutions) * 100 : 0,
      avgExecutionTime: stats.totalExecutions > 0 ? stats.totalDuration / stats.totalExecutions : 0
    };
  } catch (error) {
    console.error('Error getting agent statistics:', error);
    throw error;
  }
}

// Get recent agent executions
export async function getRecentExecutions(limit: number = 10): Promise<Array<{
  agentId: string;
  agentName: string;
  lastRun: string;
  status: string;
  duration?: number;
  result?: string;
  error?: string;
}>> {
  const supabase = getServerSupabaseClient();
  
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .not('lastRun', 'is', null)
      .order('lastRun', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return (agents || []).map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      lastRun: agent.lastRun,
      status: agent.status,
      duration: agent.metrics?.avgDuration,
      result: agent.lastResult,
      error: agent.error
    }));
  } catch (error) {
    console.error('Error getting recent executions:', error);
    throw error;
  }
}

// Get agent health status
export async function getAgentHealth(): Promise<{
  healthy: number;
  warning: number;
  critical: number;
  agents: Array<{
    id: string;
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    lastRun?: string;
    successRate: number;
    avgResponseTime: number;
    issues: string[];
  }>;
}> {
  const supabase = getServerSupabaseClient();
  
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    const healthData = {
      healthy: 0,
      warning: 0,
      critical: 0,
      agents: [] as any[]
    };
    
    for (const agent of agents || []) {
      const issues: string[] = [];
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      // Check for errors
      if (agent.status === 'error') {
        issues.push('Agent in error state');
        healthStatus = 'critical';
      }
      
      // Check success rate
      const successRate = agent.metrics?.executions > 0 
        ? (agent.metrics.successes / agent.metrics.executions) * 100 
        : 100;
        
      if (successRate < 50) {
        issues.push('Low success rate');
        healthStatus = 'critical';
      } else if (successRate < 80) {
        issues.push('Moderate success rate');
        if (healthStatus === 'healthy') healthStatus = 'warning';
      }
      
      // Check if agent hasn't run recently (more than 25 hours for daily agents)
      if (agent.lastRun) {
        const lastRunTime = new Date(agent.lastRun);
        const hoursSinceLastRun = (Date.now() - lastRunTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRun > 25 && agent.schedule.includes('0 0 * * *')) {
          issues.push('Overdue execution');
          if (healthStatus === 'healthy') healthStatus = 'warning';
        }
      }
      
      // Check average execution time (flag if > 5 minutes)
      if (agent.metrics?.avgDuration > 300000) {
        issues.push('Slow execution time');
        if (healthStatus === 'healthy') healthStatus = 'warning';
      }
      
      healthData.agents.push({
        id: agent.id,
        name: agent.name,
        status: healthStatus,
        lastRun: agent.lastRun,
        successRate,
        avgResponseTime: agent.metrics?.avgDuration || 0,
        issues
      });
      
      // Count by health status
      healthData[healthStatus]++;
    }
    
    return healthData;
  } catch (error) {
    console.error('Error getting agent health:', error);
    throw error;
  }
}

// Get system performance metrics
export async function getSystemMetrics(): Promise<{
  totalAgents: number;
  executionsToday: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  systemLoad: 'low' | 'medium' | 'high';
}> {
  try {
    const stats = await getAgentStatistics();
    
    // Calculate system load based on error rate and execution times
    let systemLoad: 'low' | 'medium' | 'high' = 'low';
    
    if (stats.errorAgents > 0 || stats.successRate < 80) {
      systemLoad = 'high';
    } else if (stats.avgExecutionTime > 60000 || stats.successRate < 95) {
      systemLoad = 'medium';
    }
    
    return {
      totalAgents: stats.totalAgents,
      executionsToday: stats.totalExecutions, // In a real system, you'd filter by today
      successfulExecutions: Math.round(stats.totalExecutions * (stats.successRate / 100)),
      failedExecutions: stats.totalExecutions - Math.round(stats.totalExecutions * (stats.successRate / 100)),
      avgExecutionTime: stats.avgExecutionTime,
      systemLoad
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    throw error;
  }
}
