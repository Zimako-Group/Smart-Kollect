import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedOrFresh, CACHE_TTL } from '@/lib/redis';

// Main reports endpoint handler
export async function GET(request: NextRequest) {
  try {
    // Check authentication - using supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return available report types and endpoints
    return NextResponse.json({
      available_reports: [
        {
          name: 'Collection Metrics',
          endpoint: '/api/reports/metrics',
          description: 'Key collection metrics like collection rate, total collected, etc.'
        },
        {
          name: 'Agent Performance',
          endpoint: '/api/reports/agent-performance',
          description: 'Performance metrics for all agents'
        },
        {
          name: 'Collection Trends',
          endpoint: '/api/reports/trends',
          description: 'Collection trends over time'
        },
        {
          name: 'Debt Categories',
          endpoint: '/api/reports/categories',
          description: 'Distribution of debt by category'
        },
        {
          name: 'Saved Reports',
          endpoint: '/api/reports/saved',
          description: 'List of saved reports'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
