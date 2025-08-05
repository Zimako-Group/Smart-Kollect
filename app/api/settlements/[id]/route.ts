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

// GET handler to fetch a specific settlement
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    
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
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    const updates = await request.json();
    
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
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    
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
