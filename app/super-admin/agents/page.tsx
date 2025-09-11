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
  Zap,
  Calendar,
  TrendingUp,
  Moon,
  PlayCircle,
  PauseCircle,
  CircleDot
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AgentMonitor from '@/components/super-admin/AgentMonitor';

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgResponseTime, setAvgResponseTime] = useState('0ms');

  // Agent status information
  const agentStatusInfo = [
    {
      status: 'sleeping',
      label: 'Sleeping',
      description: 'Agent is waiting for its next scheduled execution',
      icon: Moon,
      color: 'bg-green-500',
      bgColor: 'bg-green-500/20'
    },
    {
      status: 'running',
      label: 'Running',
      description: 'Agent is currently executing its tasks',
      icon: PlayCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/20'
    },
    {
      status: 'idle',
      label: 'Idle',
      description: 'Agent is not scheduled to run',
      icon: PauseCircle,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-500/20'
    },
    {
      status: 'error',
      label: 'Error',
      description: 'Agent encountered an error during last execution',
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-500/20'
    }
  ];

  // Fetch agents to calculate average response time
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/agents');
        const data = await response.json();
        
        if (data.success) {
          setAgents(data.agents);
          
          // Calculate average response time
          let totalDuration = 0;
          let agentCount = 0;
          
          data.agents.forEach((agent: Agent) => {
            if (agent.metrics && agent.metrics.avgDuration) {
              totalDuration += agent.metrics.avgDuration;
              agentCount++;
            }
          });
          
          if (agentCount > 0) {
            const avgDuration = totalDuration / agentCount;
            if (avgDuration < 1000) {
              setAvgResponseTime(`${Math.round(avgDuration)}ms`);
            } else if (avgDuration < 60000) {
              setAvgResponseTime(`${(avgDuration / 1000).toFixed(2)}s`);
            } else {
              setAvgResponseTime(`${(avgDuration / 60000).toFixed(2)}m`);
            }
          } else {
            setAvgResponseTime('0ms');
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    
    // Set up polling
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Bot className="h-10 w-10 text-gray-400" />
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Intelligent Agents</h1>
            <p className="text-gray-400">Monitor and manage your automated system agents</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Bot className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Agents</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter(agent => agent.status !== 'idle').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {agents.length > 0 
                    ? `${Math.round((agents.reduce((sum, agent) => sum + (agent.metrics?.successes || 0), 0) / 
                       agents.reduce((sum, agent) => sum + (agent.metrics?.executions || 0), 0)) * 100 || 0)}%`
                    : '0%'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Response</p>
                <p className="text-2xl font-bold text-white">{avgResponseTime}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Legend */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-gray-400" />
            Agent Status Legend
          </CardTitle>
          <CardDescription className="text-gray-400">
            Understanding the different states of your intelligent agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentStatusInfo.map((status) => (
              <div 
                key={status.status} 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800/30"
              >
                <div className={`p-2 rounded-full ${status.bgColor}`}>
                  <status.icon className={`h-5 w-5 ${status.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-white">{status.label}</p>
                  <p className="text-xs text-gray-400">{status.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Monitor */}
      <div className="mb-8">
        <AgentMonitor />
      </div>

      {/* Agent Information */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            Agent Information
          </CardTitle>
          <CardDescription className="text-gray-400">
            Overview of your intelligent agents and their schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Bot className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Settlement Expiry Checker</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Automatically checks for expired settlements and updates their status.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Schedule: Daily at midnight (0 0 * * *)</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">PTP Default Checker</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Monitors Promise to Pay agreements and flags defaulted payments.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Schedule: Daily at midnight (0 0 * * *)</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <TrendingUp className="h-5 w-5 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white">Monthly Performance Initializer</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Initializes monthly performance records for all collection agents.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Schedule: 1st day of month at 1 AM (0 1 1 * *)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}