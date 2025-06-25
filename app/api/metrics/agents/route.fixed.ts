import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAuth } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { sipService } from '@/lib/sipService';

export async function GET(req: NextRequest) {
  try {
    // Check authentication using Supabase
    const cookieStore = cookies();
    const supabaseClient = supabase;
    
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const includeSipStatus = searchParams.get('includeSipStatus') === 'true';
    
    // Fetch agents with their status
    const { data: agents, error } = await supabase
      .from('Users')
      .select(`
        id,
        name,
        email,
        role,
        status,
        avatar_url,
        last_active,
        AgentStats (
          calls_handled,
          avg_call_time,
          satisfaction_score,
          availability_percentage
        )
      `)
      .in('role', ['agent', 'supervisor'])
      .ilike('name', `%${searchQuery}%`)
      .order('name');
      
    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents', message: error.message },
        { status: 500 }
      );
    }
    
    // Filter by status if specified
    let filteredAgents = agents;
    if (statusFilter !== 'all') {
      filteredAgents = agents.filter(agent => agent.status === statusFilter);
    }
    
    // Get active SIP connections from localStorage if requested
    let activeSipAgents: string[] = [];
    if (includeSipStatus) {
      try {
        // This would normally come from a real-time database or service
        // For now, we'll simulate it with a mock implementation
        const mockActiveSipAgents = agents
          .filter((agent: any) => agent.status === 'active')
          .slice(0, Math.floor(Math.random() * agents.length))
          .map((agent: any) => agent.id);
          
        activeSipAgents = mockActiveSipAgents;
      } catch (error) {
        console.error('Error getting active SIP agents:', error);
      }
    }
    
    // Format the response
    const formattedAgents = filteredAgents.map(agent => {
      const isSipConnected = includeSipStatus ? activeSipAgents.includes(agent.id) : false;
      
      // Update status based on SIP connection if needed
      let agentStatus = agent.status || 'offline';
      if (includeSipStatus && isSipConnected) {
        agentStatus = 'active'; // If agent is connected to SIP, they're active
      }
      
      // Handle AgentStats as an array (Supabase returns joined tables as arrays)
      const agentStatsData = Array.isArray(agent.AgentStats) && agent.AgentStats.length > 0 
        ? agent.AgentStats[0] 
        : null;
      
      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        status: agentStatus,
        avatarUrl: agent.avatar_url,
        lastActive: agent.last_active,
        sipConnected: isSipConnected,
        stats: {
          callsHandled: agentStatsData?.calls_handled || 0,
          avgCallTime: agentStatsData?.avg_call_time || 0,
          satisfactionScore: agentStatsData?.satisfaction_score || 0,
          availabilityPercentage: agentStatsData?.availability_percentage || 0
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        agents: formattedAgents,
        totalCount: formattedAgents.length,
        statusCounts: {
          active: agents.filter(a => a.status === 'active').length,
          paused: agents.filter(a => a.status === 'paused').length,
          offline: agents.filter(a => a.status === 'offline').length
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching agent data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent data', message: error.message },
      { status: 500 }
    );
  }
}

// API endpoint to update agent status
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const supabaseClient = supabase;
    
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { agentId, status } = body;
    
    if (!agentId || !status) {
      return NextResponse.json(
        { error: 'Agent ID and status are required' },
        { status: 400 }
      );
    }
    
    // Validate status value
    const validStatuses = ['active', 'paused', 'offline'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be one of: active, paused, offline' },
        { status: 400 }
      );
    }
    
    // Check if the user is updating their own status or has supervisor permissions
    const isOwnStatus = session.user.id === agentId;
    
    if (!isOwnStatus) {
      // Check if user has supervisor permissions
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('role')
        .eq('email', session.user.email)
        .single();
        
      if (userError || (userData?.role !== 'admin' && userData?.role !== 'supervisor')) {
        return NextResponse.json(
          { error: 'You do not have permission to update another agent\'s status' },
          { status: 403 }
        );
      }
    }
    
    // Update agent status
    const { error } = await supabase
      .from('Users')
      .update({ 
        status,
        last_active: new Date().toISOString()
      })
      .eq('id', agentId);
      
    if (error) {
      console.error('Error updating agent status:', error);
      return NextResponse.json(
        { error: 'Failed to update agent status', message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Agent status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating agent status:', error);
    return NextResponse.json(
      { error: 'Failed to update agent status', message: error.message },
      { status: 500 }
    );
  }
}
