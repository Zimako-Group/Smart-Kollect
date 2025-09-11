import { NextRequest, NextResponse } from "next/server";
import { getAllAgents, getAgentById } from '@/lib/agent-service';
import { getSupabaseAdminClient } from '@/lib/supabaseClient';

// This API route gets agent information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (agentId) {
      // Get specific agent
      const agent = await getAgentById(agentId);
      
      if (!agent) {
        return NextResponse.json(
          { success: false, message: 'Agent not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        agent
      });
    } else {
      // Get all agents
      const agents = await getAllAgents();
      
      return NextResponse.json({ 
        success: true, 
        agents
      });
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch agents', error: String(error) },
      { status: 500 }
    );
  }
}