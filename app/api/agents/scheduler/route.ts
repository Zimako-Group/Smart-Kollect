import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeScheduler, 
  rescheduleAllAgents, 
  getSchedulerStatus,
  triggerAgentExecution,
  shutdownScheduler 
} from '@/lib/agent-scheduler';

// GET - Get scheduler status
export async function GET() {
  try {
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get scheduler status', error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Control scheduler operations
export async function POST(request: NextRequest) {
  try {
    const { action, agentId } = await request.json();
    
    switch (action) {
      case 'initialize':
        await initializeScheduler();
        return NextResponse.json({
          success: true,
          message: 'Scheduler initialized successfully'
        });
        
      case 'reschedule':
        await rescheduleAllAgents();
        return NextResponse.json({
          success: true,
          message: 'All agents rescheduled successfully'
        });
        
      case 'trigger':
        if (!agentId) {
          return NextResponse.json(
            { success: false, message: 'Agent ID is required for trigger action' },
            { status: 400 }
          );
        }
        
        const result = await triggerAgentExecution(agentId);
        return NextResponse.json({
          success: true,
          message: 'Agent triggered successfully',
          result
        });
        
      case 'shutdown':
        shutdownScheduler();
        return NextResponse.json({
          success: true,
          message: 'Scheduler shut down successfully'
        });
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: initialize, reschedule, trigger, or shutdown' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      { success: false, message: 'Scheduler operation failed', error: String(error) },
      { status: 500 }
    );
  }
}
