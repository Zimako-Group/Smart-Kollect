import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentStatistics,
  getRecentExecutions,
  getAgentHealth,
  getSystemMetrics
} from '@/lib/agent-monitoring-service';

// GET - Get monitoring data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    switch (type) {
      case 'statistics':
        const stats = await getAgentStatistics();
        return NextResponse.json({
          success: true,
          data: stats
        });
        
      case 'executions':
        const limit = parseInt(searchParams.get('limit') || '10');
        const executions = await getRecentExecutions(limit);
        return NextResponse.json({
          success: true,
          data: executions
        });
        
      case 'health':
        const health = await getAgentHealth();
        return NextResponse.json({
          success: true,
          data: health
        });
        
      case 'system':
        const systemMetrics = await getSystemMetrics();
        return NextResponse.json({
          success: true,
          data: systemMetrics
        });
        
      case 'all':
      default:
        const [allStats, allExecutions, allHealth, allSystem] = await Promise.all([
          getAgentStatistics(),
          getRecentExecutions(5),
          getAgentHealth(),
          getSystemMetrics()
        ]);
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: allStats,
            recentExecutions: allExecutions,
            health: allHealth,
            system: allSystem
          }
        });
    }
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get monitoring data', error: String(error) },
      { status: 500 }
    );
  }
}
