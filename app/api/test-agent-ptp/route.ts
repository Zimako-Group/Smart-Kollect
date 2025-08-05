import { NextRequest, NextResponse } from 'next/server';
import { getAgentMonthlyPTPCount } from '@/lib/ptp-service';

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'Agent ID is required'
      }, { status: 400 });
    }
    
    console.log('Testing monthly PTP count for agent:', agentId);
    
    // Get monthly PTP count for the agent
    const monthlyCount = await getAgentMonthlyPTPCount(agentId);
    
    console.log('Monthly PTP count result:', monthlyCount);
    
    return NextResponse.json({
      success: true,
      data: {
        agentId,
        monthlyPTPCount: monthlyCount
      }
    });
  } catch (error: any) {
    console.error('Error testing agent PTP count:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch agent PTP count'
    }, { status: 500 });
  }
}
