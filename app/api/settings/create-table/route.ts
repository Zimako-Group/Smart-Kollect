import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client using cookies for authentication
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
    
    // In production, require admin role to create tables
    if (session) {
      // Get user role from profile using admin client to bypass RLS
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
      
      console.log('User role for table creation:', profile.role);
      
      // Check if user is admin
      if (profile.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admin role required' },
          { status: 403 }
        );
      }
    } else {
      // For production, require authentication
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }
    
    // Try to check if the table exists and create it using our service function
    try {
      // Check if system_settings table exists
      const { data: tableExists, error: checkError } = await supabaseAdmin
        .from('system_settings')
        .select('id')
        .limit(1);
        
      if (checkError && checkError.code !== 'PGRST116') {
        // If the error is not "relation does not exist", something else is wrong
        console.error('Error checking if system_settings table exists:', checkError);
        return NextResponse.json(
          { success: false, error: 'Error checking if table exists: ' + checkError.message },
          { status: 500 }
        );
      }
      
      // If the table already exists, return success
      if (!checkError && tableExists && tableExists.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'System settings table already exists' 
        });
      }
      
      // If we get here, the table doesn't exist
      // Return instructions for manual table creation
      return NextResponse.json({
        success: false,
        error: 'System settings table does not exist. Please create it manually using the SQL in the migration file.',
        instructions: `
          To create the system_settings table, run the following SQL in the Supabase SQL Editor:
          
          -- Create the system_settings table
          CREATE TABLE IF NOT EXISTS system_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            value TEXT NOT NULL,
            type TEXT NOT NULL,
            options TEXT[],
            category TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create an update trigger to set updated_at
          CREATE OR REPLACE FUNCTION update_modified_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          DROP TRIGGER IF EXISTS set_system_settings_updated_at ON system_settings;
          CREATE TRIGGER set_system_settings_updated_at
          BEFORE UPDATE ON system_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
          
          -- Enable RLS
          ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
          
          -- Create admin policy
          CREATE POLICY "Admins can do everything on system_settings"
            ON system_settings
            USING (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
              )
            );
          
          -- Create read policy for authenticated users
          CREATE POLICY "Authenticated users can read system_settings"
            ON system_settings
            FOR SELECT
            USING (auth.role() = 'authenticated');
        `
      }, { status: 400 });
    } catch (error) {
      console.error('Error in table creation process:', error);
      return NextResponse.json(
        { success: false, error: 'Error in table creation process: ' + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/settings/create-table:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
