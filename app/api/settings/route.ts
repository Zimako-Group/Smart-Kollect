import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { getSettingsByCategory, updateSettings } from '@/lib/settings-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/settings?category=general
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // For GET requests, we'll allow unauthenticated access in development
    // but in production, we'll require authentication
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in to view settings' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    if (!category) {
      // Get all settings
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('*');
        
      if (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data });
    }
    
    // Get settings by category
    const settings = await getSettingsByCategory(category);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the user session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Authentication error: ' + sessionError.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.error('No session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in to update settings' },
        { status: 401 }
      );
    }
    
    // Get user role from profile using the admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to get user profile: ' + profileError.message },
        { status: 500 }
      );
    }
    
    if (!profile) {
      console.error('No profile found for user:', session.user.id);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    console.log('User role:', profile.role);
    
    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { category, settings } = body;
    
    if (!category || !settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Use the updateSettings function from the settings service
    // Note: we're only passing the settings array, not the category
    const success = await updateSettings(settings);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/settings:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
