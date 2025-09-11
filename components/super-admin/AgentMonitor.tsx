"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Agent {
  id: string;
  name: string;
  type: 'settlement' | 'ptp' | 'payment' | 'allocation' | 'performance' | 'cleanup' | 'reporting';
  status: 'idle' | 'running' | 'sleeping' | 'error';
  lastRun?: string;
  nextRun?: string;
  schedule: string;
  lastResult?: string;
  error?: string;
  metrics?: {
    executions: number;
    successes: number;
    failures: number;
    avgDuration: number;
  };
}

export default function AgentMonitor() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingAgent, setExecutingAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agents');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.message || 'Failed to fetch agents');
        console.error('API Error:', data.message);
      }
    } catch (error) {
      setError(`Error fetching agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Network Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    
    // Set up polling for agent status updates
    const interval = setInterval(fetchAgents, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const executeAgent = async (agentId: string) => {
    try {
      setExecutingAgent(agentId);
      
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh agent list
        fetchAgents();
      } else {
        console.error('Error executing agent:', data.message);
      }
    } catch (error) {
      console.error('Error executing agent:', error);
    } finally {
      setExecutingAgent(null);
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'sleeping': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: Agent['type']) => {
    switch (type) {
      case 'settlement': return 'from-purple-500 to-indigo-500';
      case 'ptp': return 'from-blue-500 to-cyan-500';
      case 'payment': return 'from-green-500 to-emerald-500';
      case 'allocation': return 'from-orange-500 to-amber-500';
      case 'performance': return 'from-pink-500 to-rose-500';
      case 'cleanup': return 'from-red-500 to-rose-500';
      case 'reporting': return 'from-teal-500 to-cyan-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              Agent Status
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Real-time monitoring of your intelligent agents
            </p>
          </div>
          <Button 
            onClick={() => fetchAgents()} 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {error ? (
          <div className="text-center py-8 text-red-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Error loading agents</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={() => fetchAgents()} 
              className="mt-4 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Loading agents...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No agents found</p>
            <Button 
              onClick={() => fetchAgents()} 
              className="mt-4 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0 mb-4 md:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                      {agent.status === 'running' && (
                        <div className="absolute inset-0 h-3 w-3 rounded-full bg-blue-500 animate-ping"></div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <Badge className={`bg-gradient-to-r ${getTypeColor(agent.type)} text-white border-0`}>
                      {agent.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Last run: {formatDate(agent.lastRun)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>
                        Success: {agent.metrics?.successes || 0}/{agent.metrics?.executions || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      <span>
                        Avg: {agent.metrics?.avgDuration ? formatDuration(agent.metrics.avgDuration) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {agent.error && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{agent.error}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeAgent(agent.id)}
                    disabled={agent.status === 'running' || executingAgent === agent.id}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {executingAgent === agent.id ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}