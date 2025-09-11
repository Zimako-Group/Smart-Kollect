#!/usr/bin/env node
// Script to test Supabase connection
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Using URL:', supabaseUrl);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test a simple query
    const { data, error } = await supabase
      .from('agents')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Connection failed:', error);
      process.exit(1);
    } else {
      console.log('Connection successful!');
      console.log('Agents table accessible');
      process.exit(0);
    }
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

testConnection();