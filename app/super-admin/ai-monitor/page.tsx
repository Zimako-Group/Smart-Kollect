"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  BarChart3,
  Activity,
  Eye,
  Calendar,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabaseClient';

interface AIFeedback {
  id: string;
  tenant_id: string;
  agent_id: string;
  customer_id: string;
  analysis_session_id: string;
  feedback_type: 'upvote' | 'downvote';
  suggestion: string | null;
  created_at: string;
  updated_at: string;
  agent_name?: string;
  tenant_name?: string;
}

interface AIFeedbackRaw {
  id: string;
  tenant_id: string;
  agent_id: string;
  customer_id: string;
  analysis_session_id: string;
  feedback_type: 'upvote' | 'downvote';
  suggestion: string | null;
  created_at: string;
  updated_at: string;
  profiles: { name: string } | null;
  tenants: { name: string } | null;
}

interface AIMetrics {
  totalFeedback: number;
  upvotes: number;
  downvotes: number;
  satisfactionRate: number;
  activeTenants: number;
  activeAgents: number;
  todaysFeedback: number;
  weeklyGrowth: number;
}

export default function AIMonitorPage() {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalFeedback: 0,
    upvotes: 0,
    downvotes: 0,
    satisfactionRate: 0,
    activeTenants: 0,
    activeAgents: 0,
    todaysFeedback: 0,
    weeklyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);


  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      const supabase = getSupabaseClient();
      const adminClient = getSupabaseAdminClient();
      
      // Fetch feedback data first
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ai_analysis_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (feedbackError) {
        console.error('Supabase query error:', feedbackError);
        throw feedbackError;
      }

      console.log('Raw feedback data:', feedbackData);

      // Fetch agent and tenant names using API route with admin access
      const agentIds = [...new Set(feedbackData?.map((f: any) => f.agent_id) || [])];
      const tenantSubdomains = [...new Set(feedbackData?.map((f: any) => f.tenant_id) || [])];
      
      console.log('Agent IDs to fetch:', agentIds);
      console.log('Tenant subdomains to fetch:', tenantSubdomains);
      
      const response = await fetch(`/api/ai-feedback-data?agentIds=${agentIds.join(',')}&tenantSubdomains=${tenantSubdomains.join(',')}`);
      const { agents: agentsData, tenants: tenantData, errors } = await response.json();
      
      console.log('Agents data:', agentsData);
      console.log('Tenant data:', tenantData);
      console.log('API errors:', errors);

      // Create lookup maps
      const agentMap = new Map(agentsData?.map((agent: any) => [agent.id, agent.full_name]) || []);
      const tenantMap = new Map(tenantData?.map((tenant: any) => [tenant.subdomain, tenant.name]) || []);

      const processedFeedback: AIFeedback[] = feedbackData?.map((item: any) => ({
        ...item,
        agent_name: agentMap.get(item.agent_id) || 'Unknown Agent',
        tenant_name: tenantMap.get(item.tenant_id) || item.tenant_id
      })) || [];

      setFeedback(processedFeedback);

      // Calculate metrics
      const upvotes = processedFeedback.filter((f: AIFeedback) => f.feedback_type === 'upvote').length;
      const downvotes = processedFeedback.filter((f: AIFeedback) => f.feedback_type === 'downvote').length;
      const total = upvotes + downvotes;
      const satisfactionRate = total > 0 ? (upvotes / total) * 100 : 0;
      
      const uniqueTenants = new Set(processedFeedback.map((f: AIFeedback) => f.tenant_id)).size;
      const uniqueAgents = new Set(processedFeedback.map((f: AIFeedback) => f.agent_id)).size;
      
      const today = new Date().toISOString().split('T')[0];
      const todaysFeedback = processedFeedback.filter((f: AIFeedback) => 
        f.created_at.startsWith(today)
      ).length;

      setMetrics({
        totalFeedback: total,
        upvotes,
        downvotes,
        satisfactionRate,
        activeTenants: uniqueTenants,
        activeAgents: uniqueAgents,
        todaysFeedback,
        weeklyGrowth: 12.5 // This would be calculated from historical data
      });

      // Fetch tenants for filter
      const { data: tenantsFilterData } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name');
      
      setTenants(tenantsFilterData || []);

    } catch (error) {
      console.error('Error fetching AI feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();

    // Set up real-time subscription
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('ai_feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_analysis_feedback'
        },
        () => {
          fetchFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.suggestion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = filterTenant === 'all' || item.tenant_id === filterTenant;
    const matchesType = filterType === 'all' || item.feedback_type === filterType;
    
    return matchesSearch && matchesTenant && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Tenant', 'Agent', 'Feedback Type', 'Suggestion'],
      ...filteredFeedback.map(item => [
        formatDate(item.created_at),
        item.tenant_name,
        item.agent_name,
        item.feedback_type,
        item.suggestion || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            AI Analysis Monitor
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time monitoring of AI analysis feedback across all tenants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchFeedback}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportData}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalFeedback}</div>
            <p className="text-xs text-gray-400">
              <span className="text-green-400">+{metrics.weeklyGrowth}%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Satisfaction Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.satisfactionRate.toFixed(1)}%</div>
            <Progress value={metrics.satisfactionRate} className="mt-2" />
            <p className="text-xs text-gray-400 mt-2">
              {metrics.upvotes} upvotes, {metrics.downvotes} downvotes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.activeTenants}</div>
            <p className="text-xs text-gray-400">
              {metrics.activeAgents} active agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Today's Feedback</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.todaysFeedback}</div>
            <p className="text-xs text-gray-400">
              Real-time activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by agent, tenant, or suggestion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Select value={filterTenant} onValueChange={setFilterTenant}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="upvote">Upvotes</SelectItem>
                <SelectItem value="downvote">Downvotes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent AI Analysis Feedback
          </CardTitle>
          <CardDescription className="text-gray-400">
            Real-time feedback from agents across all tenants ({filteredFeedback.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">Loading feedback data...</span>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback data found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {item.feedback_type === 'upvote' ? (
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <ThumbsUp className="h-4 w-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-500/20 rounded-full">
                        <ThumbsDown className="h-4 w-4 text-red-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className="border-blue-500 text-blue-400"
                      >
                        {item.tenant_name}
                      </Badge>
                      <span className="text-gray-300 text-sm">
                        {item.agent_name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    
                    {item.suggestion && (
                      <div className="bg-gray-900/50 p-3 rounded border-l-4 border-orange-500">
                        <p className="text-gray-300 text-sm">
                          <strong className="text-orange-400">Suggestion:</strong> {item.suggestion}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Session: {item.analysis_session_id.slice(0, 8)}...</span>
                      <span>Customer: {item.customer_id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
