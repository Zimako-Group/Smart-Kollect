import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Function to get Supabase client at runtime
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// GET handler to fetch a specific settlement
export async function GET(request: NextRequest) {
  try {
    // Extract the id from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('Settlements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }
    
    return NextResponse.json({ settlement: data });
  } catch (error) {
    console.error('Error fetching settlement:', error);
    return NextResponse.json({ error: 'Failed to fetch settlement' }, { status: 500 });
  }
}

// PATCH handler to update a settlement
export async function PATCH(request: NextRequest) {
  try {
    // Extract the id from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const updates = await request.json();
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('Settlements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }
    
    return NextResponse.json({ settlement: data });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}

// DELETE handler to delete a settlement
export async function DELETE(request: NextRequest) {
  try {
    // Extract the id from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('Settlements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    return NextResponse.json({ error: 'Failed to delete settlement' }, { status: 500 });
  }
}