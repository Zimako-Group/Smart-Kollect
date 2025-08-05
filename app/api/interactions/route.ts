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
 * API endpoint for recording account interactions
 * POST /api/interactions
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
    const { accountId, agentId, interactionType, details } = body;

    // Validate required fields
    if (!accountId || !agentId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, agentId, and interactionType are required' },
        { status: 400 }
      );
    }

    console.log(`[INTERACTION API] Recording ${interactionType} interaction for account ${accountId} by agent ${agentId}`);

    // Create the interaction record
    const { data: interaction, error: insertError } = await supabaseAdmin
      .from('account_interactions')
      .insert({
        account_id: accountId,
        agent_id: agentId,
        interaction_type: interactionType,
        interaction_details: details || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[INTERACTION API] Error recording interaction:', insertError);
      
      // If the error is about the table not existing
      if (insertError.message.includes('relation "account_interactions" does not exist')) {
        return NextResponse.json(
          { error: 'The interactions table does not exist. Please run the database migration.' },
          { status: 500 }
        );
      }
      
      // For any other error
      return NextResponse.json(
        { error: 'Failed to record interaction' },
        { status: 500 }
      );
    }

    console.log('[INTERACTION API] Successfully recorded interaction:', interaction);
    
    // Update the last_interaction_date in agent_allocations
    const currentTimestamp = new Date().toISOString();
    console.log(`[INTERACTION API] Updating last_interaction_date to ${currentTimestamp} for account ${accountId} and agent ${agentId}`);
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('agent_allocations')
      .update({
        last_interaction_date: currentTimestamp
      })
      .eq('account_id', accountId)
      .eq('agent_id', agentId)
      .select();
      
    if (updateError) {
      console.error('[INTERACTION API] Error updating last_interaction_date:', updateError);
      return NextResponse.json(
        { error: 'Failed to update interaction date' },
        { status: 500 }
      );
    }
    
    console.log('[INTERACTION API] Successfully updated last_interaction_date:', updateData);
    
    // Double-check that the update was successful
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('agent_allocations')
      .select('last_interaction_date')
      .eq('account_id', accountId)
      .eq('agent_id', agentId)
      .single();
      
    if (checkError) {
      console.warn('[INTERACTION API] Warning: Failed to verify last_interaction_date update:', checkError);
    } else {
      console.log('[INTERACTION API] Verified last_interaction_date update:', checkData);
    }

    return NextResponse.json({ success: true, interaction });
  } catch (error) {
    console.error('[INTERACTION API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for getting account interactions
 * GET /api/interactions?accountId=xxx&limit=10
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

    // Get query parameters
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const agentId = url.searchParams.get('agentId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Validate required fields
    if (!accountId && !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: either accountId or agentId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('account_interactions')
      .select(`
        id,
        account_id,
        agent_id,
        interaction_type,
        interaction_details,
        created_at,
        profiles:agent_id (id, full_name),
        Debtors:account_id (id, name, surname_company_trust, acc_number)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by account or agent
    if (accountId) {
      query = query.eq('account_id', accountId);
      console.log(`[INTERACTION API] Getting interactions for account ${accountId}`);
    } else if (agentId) {
      query = query.eq('agent_id', agentId);
      console.log(`[INTERACTION API] Getting interactions for agent ${agentId}`);
    }

    // Execute the query
    const { data: interactions, error } = await query;

    if (error) {
      console.error('[INTERACTION API] Error getting interactions:', error);
      return NextResponse.json(
        { error: 'Failed to get interactions' },
        { status: 500 }
      );
    }

    console.log(`[INTERACTION API] Retrieved ${interactions?.length || 0} interactions`);
    return NextResponse.json({ interactions: interactions || [] });
  } catch (error) {
    console.error('[INTERACTION API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
