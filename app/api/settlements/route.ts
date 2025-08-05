import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET handler to fetch all settlements
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Settlements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ settlements: data || [] });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

// POST handler to create a new settlement
export async function POST(
  request: NextRequest
) {
  try {
    console.log('API - POST /api/settlements - Request received');
    const settlementData = await request.json();
    console.log('API - Settlement data received:', settlementData);
    
    // Add created_at timestamp if not provided
    if (!settlementData.created_at) {
      settlementData.created_at = new Date().toISOString();
    }
    
    // Check if Supabase is properly initialized
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API - Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    console.log('API - Attempting to insert data into Supabase');
    const { data, error } = await supabase
      .from('Settlements')
      .insert(settlementData)
      .select()
      .single();
    
    if (error) {
      console.error('API - Supabase error:', error);
      throw error;
    }
    
    console.log('API - Settlement created successfully:', data);
    return NextResponse.json({ settlement: data });
  } catch (error: any) {
    console.error('API - Error creating settlement:', error);
    console.error('API - Error details:', error.message);
    return NextResponse.json({ error: `Failed to create settlement: ${error.message}` }, { status: 500 });
  }
}
