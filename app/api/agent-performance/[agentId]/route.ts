import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Define the type for agent performance data
type AgentPerformanceType = {
  collectionRate: { rate: number; target: number; changeVsTarget: number };
  contactRate: { rate: number; target: number; changeVsTarget: number };
  promiseToPayConversion: { rate: number; target: number; changeVsTarget: number };
  collectionSummary: {
    collected: number;
    target: number;
    casesClosed: number;
    newPaymentPlans: number;
  };
  ranking: { position: number; percentile: number; change: number };
};

// Agent-specific performance data
const agentPerformanceData: Record<string, AgentPerformanceType> = {
  // Agnes - Top performer
  'agnes-id': {
    collectionRate: { rate: 98.5, target: 100, changeVsTarget: -1.5 },
    contactRate: { rate: 85.2, target: 80, changeVsTarget: 5.2 },
    promiseToPayConversion: { rate: 76.8, target: 70, changeVsTarget: 6.8 },
    collectionSummary: {
      collected: 1180000, // R1.18M
      target: 1200000,    // R1.2M
      casesClosed: 42,
      newPaymentPlans: 28
    },
    ranking: { position: 1, percentile: 100, change: 2 }
  },
  
  // Precious - Second place
  'precious-id': {
    collectionRate: { rate: 92.3, target: 100, changeVsTarget: -7.7 },
    contactRate: { rate: 79.5, target: 80, changeVsTarget: -0.5 },
    promiseToPayConversion: { rate: 72.1, target: 70, changeVsTarget: 2.1 },
    collectionSummary: {
      collected: 1107600, // R1.1076M
      target: 1200000,    // R1.2M
      casesClosed: 38,
      newPaymentPlans: 25
    },
    ranking: { position: 2, percentile: 90, change: 1 }
  },
  
  // Gloria - Third place
  'gloria-id': {
    collectionRate: { rate: 85.7, target: 100, changeVsTarget: -14.3 },
    contactRate: { rate: 76.8, target: 80, changeVsTarget: -3.2 },
    promiseToPayConversion: { rate: 68.5, target: 70, changeVsTarget: -1.5 },
    collectionSummary: {
      collected: 1028400, // R1.0284M
      target: 1200000,    // R1.2M
      casesClosed: 35,
      newPaymentPlans: 22
    },
    ranking: { position: 3, percentile: 80, change: 0 }
  }
};

// Helper function to get agent name from ID
function getAgentNameFromId(id: string): string {
  if (id.includes('agnes')) return 'Agnes';
  if (id.includes('precious')) return 'Precious';
  if (id.includes('gloria')) return 'Gloria';
  return 'Unknown Agent';
}

// GET handler for agent performance data
export async function GET(request: NextRequest) {
  try {
    // Extract agentId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const agentId = pathParts[pathParts.length - 1];
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    // Map user IDs to our agent keys
    let agentKey: string | undefined;
    
    // Get agent name from email or name if available in the request
    const searchParams = url.searchParams;
    const agentName = searchParams.get('name')?.toLowerCase() || '';
    const agentEmail = searchParams.get('email')?.toLowerCase() || '';
    
    // Check for specific agent matches based on ID, name or email
    if (
      agentId.toLowerCase().includes('agnes') || 
      agentName.includes('agnes') || 
      agentEmail.includes('agnes') ||
      agentId === 'user_01'
    ) {
      agentKey = 'agnes-id';
      console.log('Matched Agnes');
    } else if (
      agentId.toLowerCase().includes('precious') || 
      agentName.includes('precious') || 
      agentEmail.includes('precious') ||
      agentId === 'user_02'
    ) {
      agentKey = 'precious-id';
      console.log('Matched Precious');
    } else if (
      agentId.toLowerCase().includes('gloria') || 
      agentName.includes('gloria') || 
      agentEmail.includes('gloria') ||
      agentId === 'user_03'
    ) {
      agentKey = 'gloria-id';
      console.log('Matched Gloria');
    }
    
    // Fallback mapping based on numeric IDs
    if (!agentKey) {
      // Map numeric IDs to agents (for testing purposes)
      const numericId = parseInt(agentId.replace(/\D/g, ''));
      if (!isNaN(numericId)) {
        const remainder = numericId % 3;
        if (remainder === 1) agentKey = 'agnes-id';
        else if (remainder === 2) agentKey = 'precious-id';
        else agentKey = 'gloria-id';
        console.log(`Mapped numeric ID ${numericId} to ${agentKey}`);
      }
    }
    
    if (agentKey && agentPerformanceData[agentKey]) {
      console.log(`Using predefined performance data for ${getAgentNameFromId(agentId)}`);
      return NextResponse.json(agentPerformanceData[agentKey]);
    }

    // If no hardcoded data, proceed with database lookup
    console.log(`No predefined data for agent ${agentId}, using database`);
    
    // Get current month (first day of the month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0];

    // Fetch agent performance data
    const { data: performance, error: performanceError } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .eq('month_year', monthYear)
      .single();

    if (performanceError && performanceError.code !== 'PGRST116') {
      console.error('Error fetching agent performance:', performanceError);
      return NextResponse.json(
        { error: 'Failed to fetch agent performance' },
        { status: 500 }
      );
    }

    // If no performance record exists, create default values
    const performanceData = performance || {
      agent_id: agentId,
      month_year: monthYear,
      collected_amount: 0,
      target_amount: 1200000, // R1.2M target
      cases_closed: 0,
      new_payment_plans: 0,
      contacts_made: 0,
      total_accounts: 0,
      promises_to_pay: 0,
      promises_kept: 0
    };

    // Calculate metrics
    const collectionRate = performanceData.target_amount > 0 
      ? (performanceData.collected_amount / performanceData.target_amount) * 100 
      : 0;
    
    const contactRate = performanceData.total_accounts > 0 
      ? (performanceData.contacts_made / performanceData.total_accounts) * 100 
      : 0;
    
    const ptpConversion = performanceData.promises_to_pay > 0 
      ? (performanceData.promises_kept / performanceData.promises_to_pay) * 100 
      : 0;

    // Get agent ranking
    const { data: rankings, error: rankingError } = await supabase
      .from('agent_performance')
      .select('agent_id, collected_amount')
      .eq('month_year', monthYear)
      .order('collected_amount', { ascending: false });

    let ranking = {
      position: 1,
      percentile: 100,
      change: 0
    };

    if (!rankingError && rankings) {
      const agentRankIndex = rankings.findIndex(r => r.agent_id === agentId);
      if (agentRankIndex !== -1) {
        ranking.position = agentRankIndex + 1;
        ranking.percentile = Math.round((1 - (ranking.position / rankings.length)) * 100);
      }
    }

    // Format response to match dashboard expectations
    const response = {
      collectionRate: {
        rate: Math.round(collectionRate * 100) / 100, // Round to 2 decimal places
        target: 100,
        changeVsTarget: Math.round((collectionRate - 100) * 100) / 100
      },
      contactRate: {
        rate: Math.round(contactRate * 100) / 100,
        target: 80,
        changeVsTarget: Math.round((contactRate - 80) * 100) / 100
      },
      promiseToPayConversion: {
        rate: Math.round(ptpConversion * 100) / 100,
        target: 70,
        changeVsTarget: Math.round((ptpConversion - 70) * 100) / 100
      },
      collectionSummary: {
        collected: performanceData.collected_amount,
        target: performanceData.target_amount,
        casesClosed: performanceData.cases_closed,
        newPaymentPlans: performanceData.new_payment_plans
      },
      ranking: {
        position: ranking.position,
        percentile: ranking.percentile,
        change: ranking.change
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for updating agent performance data
export async function POST(request: NextRequest) {
  try {
    // Extract agentId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const agentId = pathParts[pathParts.length - 1];
    
    const body = await request.json();
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0];

    // Update or create agent performance record
    const { data, error } = await supabase
      .from('agent_performance')
      .upsert({
        agent_id: agentId,
        month_year: monthYear,
        ...body,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'agent_id,month_year'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating agent performance:', error);
      return NextResponse.json(
        { error: 'Failed to update agent performance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Agent performance update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}