import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

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

// Optional: Add POST endpoint to manually update agent performance
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
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
