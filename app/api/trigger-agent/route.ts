import { NextResponse } from 'next/server';
import { executeAgent, getServerSupabaseClient } from '@/lib/agent-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET endpoint to trigger a specific agent by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const authHeader = request.headers.get('authorization');
    
    // Check for authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // In production, use a secure token from environment variables
    const expectedToken = process.env.CRON_AUTH_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      );
    }
    
    // Execute the agent
    const result = await executeAgent(agentId);
    
    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} executed`,
      result
    });
  } catch (error) {
    console.error('Error triggering agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger a specific agent by type
export async function POST(request: Request) {
  try {
    const { agentType } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    // Check for authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // In production, use a secure token from environment variables
    const expectedToken = process.env.CRON_AUTH_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }
    
    if (!agentType) {
      return NextResponse.json(
        { error: 'Missing agentType in request body' },
        { status: 400 }
      );
    }
    
    // Get the agent by type
    const supabase = getServerSupabaseClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('type', agentType)
      .single();
      
    if (error || !agent) {
      return NextResponse.json(
        { error: `Agent with type ${agentType} not found` },
        { status: 404 }
      );
    }
    
    // Execute the agent
    const result = await executeAgent(agent.id);
    
    return NextResponse.json({
      success: true,
      message: `Agent ${agent.name} (${agent.id}) executed`,
      result
    });
  } catch (error) {
    console.error('Error triggering agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}