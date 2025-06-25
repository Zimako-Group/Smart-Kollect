// IMPORTANT: Import the singleton Supabase client to avoid multiple instances
import { supabase } from './supabaseClient';

// This file now uses the singleton client from supabaseClient.ts
// instead of creating a new client, which was causing authentication issues

// Get environment variables for debugging only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Export the singleton client (which is actually imported from supabaseClient.ts)
export { supabase };

// Debug function to log Supabase client details
export const debugSupabaseClient = () => {
  console.log('Supabase client details:');
  console.log('- URL:', supabaseUrl);
  console.log('- Auth key present:', !!supabaseAnonKey);
  console.log('- Auth key length:', supabaseAnonKey?.length);
  
  // Check if the URL is properly formatted
  try {
    if (supabaseUrl) {
      new URL(supabaseUrl);
      console.log('- URL format: valid');
    } else {
      console.log('- URL not available for validation');
    }
  } catch (e) {
    console.error('- URL format: invalid', e);
  }
  
  return {
    url: supabaseUrl,
    keyPresent: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length
  };
};

// Check if we can access the database directly without authentication
// This will work if your RLS policies allow public access or if you're using the service_role key
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...');
    debugSupabaseClient();
    
    // Try a simple table query without authentication
    console.log('Testing database access without authentication...');
    const { data, error: tableError } = await supabase
      .from('sms_history')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (tableError) {
      console.error('Database access error:', tableError);
      
      // Log more details about the error
      if (tableError.code) console.error('Error code:', tableError.code);
      if (tableError.message) console.error('Error message:', tableError.message);
      if (tableError.details) console.error('Error details:', tableError.details);
      if (tableError.hint) console.error('Error hint:', tableError.hint);
      
      if (tableError.code === '42P01') {
        console.log('Table does not exist, but connection is working');
        return true;
      } else if (tableError.message.includes('permission denied')) {
        console.error('Permission denied. You need to update RLS policies or use service_role key');
        return false;
      } else {
        console.error('Supabase connection test failed:', tableError);
        return false;
      }
    }
    
    console.log('Supabase connection successful, data:', data);
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
};
