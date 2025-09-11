import { NextRequest, NextResponse } from "next/server";
import { executeAgent } from '@/lib/agent-service';
import { getSupabaseAdminClient } from '@/lib/supabaseClient';

// This API route executes a specific agent
export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();
    
    if (!agentId) {
      return NextResponse.json(
        { success: false, message: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Executing agent ${agentId} via API...`);
    
    // Execute the agent
    const result = await executeAgent(agentId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent executed successfully',
      result
    });
  } catch (error) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to execute agent', error: String(error) },
      { status: 500 }
    );
  }
}