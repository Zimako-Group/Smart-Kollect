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

export async function GET(
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

    // Create RLS policy for AccountAllocations table to allow agents to view their own allocations
    const { error: policyError } = await supabaseAdmin.rpc('create_rls_policy_for_account_allocations');

    if (policyError) {
      console.error('Error creating RLS policy:', policyError);
      return NextResponse.json(
        { error: `Error creating RLS policy: ${policyError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'RLS policies updated successfully' });
  } catch (error) {
    console.error('Unexpected error updating RLS policies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Unexpected error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST endpoint to execute SQL directly
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

    const body = await request.json();
    const { action } = body;

    if (action === 'create_account_allocations_rls') {
      // SQL to create RLS policy for AccountAllocations
      const { data, error } = await supabaseAdmin.rpc('create_account_allocations_rls_policies');

      if (error) {
        console.error('Error executing SQL:', error);
        return NextResponse.json(
          { error: `Error executing SQL: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    } else if (action === 'execute_sql') {
      const { sql } = body;
      
      if (!sql) {
        return NextResponse.json(
          { error: 'Missing SQL statement' },
          { status: 400 }
        );
      }

      // Execute the SQL
      const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });

      if (error) {
        console.error('Error executing SQL:', error);
        return NextResponse.json(
          { error: `Error executing SQL: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Unexpected error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
