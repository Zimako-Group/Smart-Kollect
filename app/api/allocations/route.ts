import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (only available on server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase admin client with service role key
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * API endpoint for allocating accounts to agents
 * POST /api/allocations
 */
export async function POST(
  request: NextRequest
) {
  try {
    // Check if we have the service role key
    if (!supabaseAdmin) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { accountId, agentId } = body;

    // Validate required fields
    if (!accountId || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId and agentId are required' },
        { status: 400 }
      );
    }

    console.log(`[NEW ALLOCATION API] Allocating account ${accountId} to agent ${agentId}`);

    // First, check if the account exists
    const { data: account, error: accountError } = await supabaseAdmin
      .from('Debtors')
      .select('id, acc_number')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('[NEW ALLOCATION API] Account not found:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Then check if the agent exists
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('[NEW ALLOCATION API] Agent not found:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log(`[NEW ALLOCATION API] Verified account ${account.acc_number} and agent ${agent.full_name}`);

    // Delete any existing allocations for this account
    const { error: deleteError } = await supabaseAdmin
      .from('agent_allocations')
      .delete()
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('[NEW ALLOCATION API] Error deleting existing allocations:', deleteError);
      // Continue anyway - the table might not exist yet
    }

    // Create the allocation
    const { data: allocation, error: insertError } = await supabaseAdmin
      .from('agent_allocations')
      .insert({
        account_id: accountId,
        agent_id: agentId,
        allocated_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[NEW ALLOCATION API] Error creating allocation:', insertError);
      
      // If the error is about the table not existing, we can't create it through the API
      if (insertError.message.includes('relation "agent_allocations" does not exist')) {
        console.log('[NEW ALLOCATION API] Table does not exist');
        return NextResponse.json(
          { error: 'The allocation table does not exist. Please create it in the Supabase dashboard.' },
          { status: 500 }
        );
      }
      
      // For any other error
      return NextResponse.json(
        { error: 'Failed to allocate account' },
        { status: 500 }
      );
    }

    console.log('[NEW ALLOCATION API] Successfully created allocation:', allocation);
    return NextResponse.json({ success: true, allocation });
  } catch (error) {
    console.error('[NEW ALLOCATION API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for getting agent allocations
 * GET /api/allocations?agentId=xxx
 */
export async function GET(
  request: NextRequest
) {
  try {
    // Check if we have the service role key
    if (!supabaseAdmin) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the agent ID from the query params
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: agentId' },
        { status: 400 }
      );
    }

    console.log(`[NEW ALLOCATION API] Getting allocations for agent ${agentId}`);

    // Check if the table exists by trying to query it
    try {
      const { count, error: tableCheckError } = await supabaseAdmin
        .from('agent_allocations')
        .select('*', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.log('[NEW ALLOCATION API] Table does not exist, returning empty array');
        return NextResponse.json({ allocations: [] });
      }
    } catch (error) {
      console.log('[NEW ALLOCATION API] Table does not exist, returning empty array');
      return NextResponse.json({ allocations: [] });
    }

    // Get all allocations for this agent
    const { data: allocations, error: allocationsError } = await supabaseAdmin
      .from('agent_allocations')
      .select(`
        id,
        account_id,
        allocated_at,
        status,
        last_interaction_date
      `)
      .eq('agent_id', agentId)
      .eq('status', 'active');

    if (allocationsError) {
      console.error('[NEW ALLOCATION API] Error getting allocations:', allocationsError);
      return NextResponse.json(
        { error: 'Failed to get allocations' },
        { status: 500 }
      );
    }

    if (!allocations || allocations.length === 0) {
      console.log('[NEW ALLOCATION API] No allocations found for agent');
      return NextResponse.json({ allocations: [] });
    }

    console.log(`[NEW ALLOCATION API] Found ${allocations.length} allocations for agent`);

    // Get the account details for each allocation
    const accountIds = allocations.map(a => a.account_id);
    
    // Process account IDs in batches to avoid "Bad Request" errors
    const BATCH_SIZE = 100; // Supabase has limits on the number of items in an 'in' clause
    let allAccounts: any[] = [];
    
    console.log(`[NEW ALLOCATION API] Fetching account details in batches of ${BATCH_SIZE}`);
    
    // Process account IDs in batches
    for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
      const batchIds = accountIds.slice(i, i + BATCH_SIZE);
      console.log(`[NEW ALLOCATION API] Fetching batch ${i/BATCH_SIZE + 1} of ${Math.ceil(accountIds.length/BATCH_SIZE)} (${batchIds.length} accounts)`);
      
      try {
        const { data: batchAccounts, error: batchError } = await supabaseAdmin
          .from('Debtors')
          .select('*')
          .in('id', batchIds);
        
        if (batchError) {
          console.error(`[NEW ALLOCATION API] Error fetching batch ${i/BATCH_SIZE + 1}:`, batchError);
          continue; // Continue with the next batch even if this one fails
        }
        
        if (batchAccounts && batchAccounts.length > 0) {
          allAccounts = [...allAccounts, ...batchAccounts];
          console.log(`[NEW ALLOCATION API] Batch ${i/BATCH_SIZE + 1} returned ${batchAccounts.length} accounts`);
        }
      } catch (batchFetchError) {
        console.error(`[NEW ALLOCATION API] Exception fetching batch ${i/BATCH_SIZE + 1}:`, batchFetchError);
      }
    }
    
    console.log(`[NEW ALLOCATION API] Successfully fetched ${allAccounts.length} of ${accountIds.length} accounts`);
    
    // If we couldn't fetch any accounts, return an error
    if (allAccounts.length === 0 && accountIds.length > 0) {
      console.error('[NEW ALLOCATION API] Failed to fetch any account details');
      return NextResponse.json(
        { error: 'Failed to get account details' },
        { status: 500 }
      );
    }
    
    const accounts = allAccounts;

    // Combine the allocations with their account details
    const allocatedAccounts = allocations.map(allocation => {
      const account = accounts?.find(a => a.id === allocation.account_id);
      
      // Log warning if account not found
      if (!account) {
        console.warn(`[NEW ALLOCATION API] Warning: Account ${allocation.account_id} not found in Debtors table`);
      }
      
      return {
        allocation,
        account
      };
    });
    
    // Log details about missing accounts
    const missingAccounts = allocatedAccounts.filter(item => !item.account);
    if (missingAccounts.length > 0) {
      console.warn(`[NEW ALLOCATION API] Found ${missingAccounts.length} allocations with missing account data`);
      console.warn('Missing account IDs:', missingAccounts.map(item => item.allocation.account_id));
    }

    console.log('[NEW ALLOCATION API] Successfully retrieved allocated accounts');
    return NextResponse.json({ allocations: allocatedAccounts });
  } catch (error) {
    console.error('[NEW ALLOCATION API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
