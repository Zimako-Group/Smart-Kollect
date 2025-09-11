#!/usr/bin/env node
// Script to check the actual column names in the agents table
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function checkAgentsColumns() {
  console.log('Checking agents table columns...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables!');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check the column information
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error querying agents table:', error);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log('Sample agent data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No agents found in the table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking agents columns:', error);
    process.exit(1);
  }
}

checkAgentsColumns();