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
 * API endpoint for bulk allocating accounts to an agent
 * POST /api/allocations/bulk
 */
export async function POST(request: NextRequest) {
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
    const { accountNumbers, agentId } = body;

    // Validate required fields
    if (!accountNumbers || !Array.isArray(accountNumbers) || accountNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid accountNumbers: must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required field: agentId' },
        { status: 400 }
      );
    }

    console.log(`[BULK ALLOCATION API] Allocating ${accountNumbers.length} accounts to agent ${agentId}`);

    // Check if the agent exists
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('[BULK ALLOCATION API] Agent not found:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log(`[BULK ALLOCATION API] Verified agent ${agent.full_name}`);

    console.log(`[BULK ALLOCATION API] Searching for ${accountNumbers.length} account numbers`);
    console.log('[BULK ALLOCATION API] First few account numbers:', accountNumbers.slice(0, 5));
    
    // Log the account numbers we're looking for to help with debugging
    console.log('[BULK ALLOCATION API] Account numbers to find:', accountNumbers);
    
    // Initialize notFound array at the top level so it's available throughout the function
    let notFound: string[] = [];
    
    // First, try to find accounts directly by account number
    const { data: directMatches, error: directMatchError } = await supabaseAdmin
      .from('Debtors')
      .select('id, acc_number')
      .in('acc_number', accountNumbers);
      
    if (directMatchError) {
      console.error('[BULK ALLOCATION API] Error with direct account matching:', directMatchError);
      // Continue with alternative matching approach
    }
    
    let accounts: any[] = directMatches || [];
    console.log(`[BULK ALLOCATION API] Found ${accounts.length} accounts with direct matching`);
    
    // If we didn't find all accounts with direct matching, try more flexible approaches
    if (!accounts.length || accounts.length < accountNumbers.length) {
      // Get all accounts to try alternative matching approaches
      const { data: allAccounts, error: fetchError } = await supabaseAdmin
        .from('Debtors')
        .select('id, acc_number');
  
      if (fetchError) {
        console.error('[BULK ALLOCATION API] Error fetching accounts:', fetchError);
        return NextResponse.json(
          { error: 'Error fetching accounts' },
          { status: 500 }
        );
      }
      
      if (!allAccounts || allAccounts.length === 0) {
        console.error('[BULK ALLOCATION API] No accounts found in database');
        return NextResponse.json(
          { error: 'No accounts found in database' },
          { status: 404 }
        );
      }
      
      console.log(`[BULK ALLOCATION API] Found ${allAccounts.length} total accounts in database`);
      console.log('[BULK ALLOCATION API] Sample account numbers in database:', 
        allAccounts.slice(0, 10).map(a => a.acc_number));
      
      // Create maps for different formats of account numbers
      const accountMap = new Map<string, any>();
      const numericMap = new Map<string, any>();
      
      allAccounts.forEach(account => {
        if (account.acc_number) {
          // Store original account number
          accountMap.set(account.acc_number, account);
          
          // Store normalized versions (lowercase, trimmed)
          const normalized = account.acc_number.toLowerCase().trim();
          accountMap.set(normalized, account);
          
          // Store without leading zeros
          const withoutLeadingZeros = normalized.replace(/^0+/, '');
          accountMap.set(withoutLeadingZeros, account);
          
          // Store numeric version (all non-digits removed)
          const numericOnly = normalized.replace(/\D/g, '');
          numericMap.set(numericOnly, account);
        }
      });
      
      // If we already have some direct matches, create a set of found IDs to avoid duplicates
      const foundIds = new Set(accounts.map(a => a.id));
      
      // Match the requested account numbers against the maps using multiple approaches
      const additionalAccounts: any[] = [];
      // Clear the notFound array before populating it again
      notFound = [];
      
      accountNumbers.forEach(accNum => {
        // Skip if we already found this account with direct matching
        const directMatch = accounts.find(a => a.acc_number === accNum);
        if (directMatch) return;
        
        // Try different formats of the account number
        const normalized = accNum.toLowerCase().trim();
        const withoutLeadingZeros = normalized.replace(/^0+/, '');
        const numericOnly = normalized.replace(/\D/g, '');
        
        let found = false;
        let matchedAccount;
        
        // Try exact match
        if (accountMap.has(accNum)) {
          matchedAccount = accountMap.get(accNum);
          found = true;
        }
        // Try normalized
        else if (accountMap.has(normalized)) {
          matchedAccount = accountMap.get(normalized);
          found = true;
        }
        // Try without leading zeros
        else if (accountMap.has(withoutLeadingZeros)) {
          matchedAccount = accountMap.get(withoutLeadingZeros);
          found = true;
        }
        // Try numeric only match
        else if (numericMap.has(numericOnly)) {
          matchedAccount = numericMap.get(numericOnly);
          found = true;
        }
        
        if (found && matchedAccount && !foundIds.has(matchedAccount.id)) {
          additionalAccounts.push(matchedAccount);
          foundIds.add(matchedAccount.id);
        } else {
          notFound.push(accNum);
        }
      });
      
      // Combine direct matches with additional matches
      accounts = [...accounts, ...additionalAccounts];
    }
    
    if (accounts.length === 0) {
      console.error('[BULK ALLOCATION API] No matching accounts found');
      console.log('[BULK ALLOCATION API] First few account numbers not found:', notFound.slice(0, 10));
      return NextResponse.json(
        { error: 'No matching accounts found. Please check the account numbers and try again.' },
        { status: 404 }
      );
    }
    
    console.log(`[BULK ALLOCATION API] Successfully matched ${accounts.length} of ${accountNumbers.length} account numbers`);
    if (notFound.length > 0) {
      console.log(`[BULK ALLOCATION API] ${notFound.length} account numbers not found`);
      console.log('[BULK ALLOCATION API] First few account numbers not found:', notFound.slice(0, 10));
    }

    console.log(`[BULK ALLOCATION API] Found ${accounts.length} of ${accountNumbers.length} requested accounts`);

    // Prepare allocation records
    const now = new Date().toISOString();
    const allocations = accounts.map(account => ({
      account_id: account.id,
      agent_id: agentId,
      allocated_at: now,
      status: 'active'
    }));

    // First, delete any existing allocations for these accounts
    const accountIds = accounts.map(account => account.id);
    
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('agent_allocations')
        .delete()
        .in('account_id', accountIds);

      if (deleteError && !deleteError.message.includes('relation "agent_allocations" does not exist')) {
        console.error('[BULK ALLOCATION API] Error deleting existing allocations:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete existing allocations' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.log('[BULK ALLOCATION API] Table might not exist yet, continuing with insert');
    }

    // Insert the new allocations
    try {
      const { data: insertedAllocations, error: insertError } = await supabaseAdmin
        .from('agent_allocations')
        .insert(allocations)
        .select();

      if (insertError) {
        console.error('[BULK ALLOCATION API] Error creating allocations:', insertError);
        return NextResponse.json(
          { error: 'Failed to allocate accounts: ' + insertError.message },
          { status: 500 }
        );
      }

      console.log(`[BULK ALLOCATION API] Successfully allocated ${insertedAllocations?.length || 0} accounts`);
      return NextResponse.json({ 
        success: true, 
        allocated: insertedAllocations?.length || 0,
        total: accountNumbers.length,
        notFound: accountNumbers.length - accounts.length
      });
    } catch (error: any) {
      console.error('[BULK ALLOCATION API] Error in bulk insert:', error);
      return NextResponse.json(
        { error: 'Failed to allocate accounts: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[BULK ALLOCATION API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
