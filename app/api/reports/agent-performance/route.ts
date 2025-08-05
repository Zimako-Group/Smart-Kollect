import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAgents } from '@/lib/accounts-service';
import { getCachedOrFresh, CACHE_TTL } from '@/lib/redis';

export async function GET(
  request: NextRequest
) {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'monthly';
    
    // Create a cache key based on the time range
    const cacheKey = `reports:agent-performance:${timeRange}`;
    
    // Use the getCachedOrFresh utility to handle caching
    const agentPerformance = await getCachedOrFresh(
      cacheKey,
      async () => {
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to monthly
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Get all agents
    const agents = await getAgents();
    
    if (!agents || agents.length === 0) {
      return NextResponse.json([]);
    }
    
    // For each agent, calculate performance metrics
    const agentPerformancePromises = agents.map(async (agent) => {
      // Extract agent name
      let agentName = 'Unknown Agent';
      
      if (agent.email) {
        // Use email username as fallback
        agentName = agent.email.split('@')[0];
      }
      
      // Check if agent has any metadata we can use
      try {
        const anyAgent = agent as any;
        
        if (anyAgent.user_metadata?.full_name) {
          agentName = anyAgent.user_metadata.full_name;
        } else if (anyAgent.user_metadata?.name) {
          agentName = anyAgent.user_metadata.name;
        } else if (anyAgent.raw_user_metadata?.full_name) {
          agentName = anyAgent.raw_user_metadata.full_name;
        } else if (anyAgent.raw_user_metadata?.name) {
          agentName = anyAgent.raw_user_metadata.name;
        }
      } catch (error) {
        console.log('Error extracting agent name:', error);
      }
      
      // Format the name to be title case
      agentName = agentName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Get accounts assigned to this agent
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('agent_id', agent.id);
        
      if (accountsError) {
        console.error(`Error fetching accounts for agent ${agent.id}:`, accountsError);
        return null;
      }
      
      const accountIds = accountsData?.map(account => account.id) || [];
      
      // If agent has no accounts, return basic info
      if (accountIds.length === 0) {
        return {
          id: agent.id,
          name: agentName,
          accounts_count: 0,
          collections_amount: 0,
          collections_count: 0,
          performance: 0
        };
      }
      
      // Get payments collected by this agent in the time period
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .in('account_id', accountIds)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);
        
      if (paymentsError) {
        console.error(`Error fetching payments for agent ${agent.id}:`, paymentsError);
        return null;
      }
      
      // Calculate total collections
      const collectionsAmount = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const collectionsCount = paymentsData?.length || 0;
      
      // Get total outstanding balance for agent's accounts
      const { data: outstandingData, error: outstandingError } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('agent_id', agent.id);
        
      if (outstandingError) {
        console.error(`Error fetching outstanding balance for agent ${agent.id}:`, outstandingError);
        return null;
      }
      
      // Calculate total outstanding manually from the returned accounts
      const totalOutstanding = outstandingData?.reduce((sum, account) => sum + (account.current_balance || 0), 0) || 0;
      
      // Calculate performance score (collection rate)
      // This is a simplified calculation - you may want to use a more complex formula
      const performance = totalOutstanding > 0 
        ? (collectionsAmount / totalOutstanding) * 100 
        : collectionsCount > 0 ? 80 : 0; // If no outstanding but has collections, give a default score
      
      return {
        id: agent.id,
        name: agentName,
        accounts_count: accountIds.length,
        collections_amount: collectionsAmount,
        collections_count: collectionsCount,
        performance: parseFloat(performance.toFixed(1))
      };
    });
    
    // Wait for all promises to resolve
    const agentPerformanceResults = await Promise.all(agentPerformancePromises);
    
    // Filter out null results and sort by performance (highest first)
    const agentPerformance = agentPerformanceResults
      .filter(result => result !== null)
      .sort((a, b) => (b?.performance || 0) - (a?.performance || 0))
      .map((agent, index) => ({
        ...agent,
        rank: index + 1
      }));
    
    return agentPerformance;
      },
      CACHE_TTL.MEDIUM
    );
    
    return NextResponse.json(agentPerformance);
  } catch (error: any) {
    console.error('Error in agent performance API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
