import { NextRequest, NextResponse } from "next/server";
import { initializeAgentSystem } from '@/lib/agent-service';
import { getSupabaseAdminClient } from '@/lib/supabaseClient';

// This API route initializes the agent system
export async function POST() {
  try {
    console.log('Initializing agent system via API...');
    
    // Check if user is admin
    const supabaseAdmin = getSupabaseAdminClient();
    
    // In a real implementation, you would check user permissions here
    // For now, we'll allow initialization
    
    // Initialize the agent system
    await initializeAgentSystem();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent system initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing agent system:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize agent system', error: String(error) },
      { status: 500 }
    );
  }
}