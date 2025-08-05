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

// System user ID for operations that require a user ID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(
  request: NextRequest
) {
  try {
    // Check if we have the service role key
    if (!supabaseAdmin) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error - missing service role key' },
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

    console.log(`Allocating account ${accountId} to agent ${agentId}`);

    // Check if account is already allocated
    console.log(`[ALLOCATION API] Checking if account ${accountId} is already allocated`);
    
    // First, check if the account exists in the debtors table
    const { data: debtorCheck, error: debtorError } = await supabaseAdmin
      .from('debtors')
      .select('id, acc_number')
      .eq('id', accountId)
      .maybeSingle();
      
    if (debtorError) {
      console.error('[ALLOCATION API] Error checking debtor:', debtorError);
      return NextResponse.json(
        { error: `Error checking debtor: ${debtorError.message}` },
        { status: 500 }
      );
    }
    
    if (!debtorCheck) {
      console.error('[ALLOCATION API] Debtor not found with ID:', accountId);
      return NextResponse.json(
        { error: `Account with ID ${accountId} not found in the debtors table` },
        { status: 404 }
      );
    }
    
    console.log('[ALLOCATION API] Found debtor:', debtorCheck);
    
    // Now check if the account is already allocated
    const { data: existingAllocation, error: checkError } = await supabaseAdmin
      .from('AccountAllocations')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('[ALLOCATION API] Error checking existing allocation:', checkError);
      return NextResponse.json(
        { error: `Error checking existing allocation: ${checkError.message}` },
        { status: 500 }
      );
    }
    
    console.log('[ALLOCATION API] Existing allocation check result:', existingAllocation ? 'Found existing allocation' : 'No existing allocation');

    let result;

    if (existingAllocation) {
      // Update existing allocation
      console.log(`[ALLOCATION API] Updating existing allocation ${existingAllocation.id}`);
      result = await supabaseAdmin
        .from('AccountAllocations')
        .update({
          agent_id: agentId,
          updated_at: new Date().toISOString(),
          status: 'active', // Ensure status is set to active
        })
        .eq('id', existingAllocation.id);
    } else {
      // Create new allocation
      console.log(`[ALLOCATION API] Creating new allocation for account ${accountId} to agent ${agentId}`);
      
      // Create a new allocation record
      const allocationData = {
        account_id: accountId,
        agent_id: agentId,
        allocation_date: new Date().toISOString(),
        status: 'active',
      };
      
      console.log('[ALLOCATION API] Allocation data to insert:', allocationData);
      
      result = await supabaseAdmin
        .from('AccountAllocations')
        .insert(allocationData);
    }
    
    // Log the result for debugging
    if (result.error) {
      console.error('[ALLOCATION API] Operation failed:', result.error);
    } else {
      console.log('[ALLOCATION API] Operation successful:', result.data ? JSON.stringify(result.data) : 'No data returned');
      
      // Double-check that the allocation exists
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('AccountAllocations')
        .select('*')
        .eq('account_id', accountId)
        .eq('agent_id', agentId)
        .eq('status', 'active');
        
      if (verifyError) {
        console.error('[ALLOCATION API] Verification check failed:', verifyError);
      } else {
        console.log('[ALLOCATION API] Verification result:', verifyData ? JSON.stringify(verifyData) : 'No data found');
      }
    }

    if (result.error) {
      console.error('Error allocating account:', result.error);
      return NextResponse.json(
        { error: `Error allocating account: ${result.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in account allocation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Unexpected error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
