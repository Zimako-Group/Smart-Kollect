#!/usr/bin/env node
// Script to check if agents table exists and has data
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local file
config({ path: '.env.local' });

async function checkAgentsTable() {
  console.log('Checking agents table...');
  
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
    
    // Check if agents table exists and has data
    const { data, error, count } = await supabase
      .from('agents')
      .select('*', { count: 'exact' });
      
    if (error) {
      console.error('Error querying agents table:', error);
      process.exit(1);
    } else {
      console.log(`Found ${count} agents in the database`);
      if (data && data.length > 0) {
        console.log('Agents:');
        data.forEach(agent => {
          console.log(`- ${agent.name} (${agent.type}) - Status: ${agent.status}`);
        });
      } else {
        console.log('No agents found in the database');
      }
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking agents table:', error);
    process.exit(1);
  }
}

checkAgentsTable();