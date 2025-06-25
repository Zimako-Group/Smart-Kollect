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
 * API endpoint for setting up database tables
 * GET /api/setup
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we have the service role key
    if (!supabaseAdmin) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create the agent_allocations table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.agent_allocations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        account_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'active',
        UNIQUE(account_id)
      );
    `;
    
    const { error: createTableError } = await supabaseAdmin.rpc('pgclient', { query: createTableQuery });
    
    if (createTableError) {
      // If pgclient function doesn't exist, try direct SQL
      console.error('Error using pgclient:', createTableError);
      
      // Try direct SQL execution
      try {
        // First check if the table exists
        const { data: tableExists, error: checkError } = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'agent_allocations')
          .eq('table_schema', 'public');
          
        if (checkError) {
          console.error('Error checking if table exists:', checkError);
          return NextResponse.json(
            { error: 'Failed to check if table exists' },
            { status: 500 }
          );
        }
        
        if (tableExists && tableExists.length > 0) {
          return NextResponse.json({ 
            message: 'Table agent_allocations already exists',
            success: true
          });
        }
        
        // Create the table using a different approach
        // Since we can't execute raw SQL directly, let's try to create the table using Supabase's API
        
        // We'll need to use the REST API to create the table
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        if (supabaseServiceKey) {
          headers.append('Authorization', `Bearer ${supabaseServiceKey}`);
          headers.append('apikey', supabaseServiceKey);
        }
        
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'agent_allocations',
            schema: 'public',
            columns: [
              {
                name: 'id',
                type: 'uuid',
                isPrimaryKey: true,
                defaultValue: 'uuid_generate_v4()'
              },
              {
                name: 'account_id',
                type: 'uuid',
                isNullable: false
              },
              {
                name: 'agent_id',
                type: 'uuid',
                isNullable: false
              },
              {
                name: 'allocated_at',
                type: 'timestamptz',
                defaultValue: 'now()'
              },
              {
                name: 'status',
                type: 'text',
                defaultValue: "'active'"
              }
            ]
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating table via REST API:', errorData);
          return NextResponse.json(
            { error: 'Failed to create table via REST API', details: errorData },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          message: 'Table agent_allocations created successfully via REST API',
          success: true
        });
      } catch (error) {
        console.error('Error creating table:', error);
        return NextResponse.json(
          { error: 'Failed to create table', details: error },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      message: 'Table agent_allocations created successfully',
      success: true
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
