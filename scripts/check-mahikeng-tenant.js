#!/usr/bin/env node

/**
 * Script to check if Mahikeng tenant exists in the database
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and Service Key are required.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMahikengTenant() {
  try {
    console.log('Checking if Mahikeng tenant exists...');
    
    // Check if Mahikeng tenant exists
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'mahikeng')
      .single();
    
    if (error) {
      console.error('Error checking Mahikeng tenant:', error.message);
      return;
    }
    
    if (!data) {
      console.log('Mahikeng tenant not found in database');
      return;
    }
    
    console.log('Mahikeng tenant found:');
    console.log('ID:', data.id);
    console.log('Name:', data.name);
    console.log('Subdomain:', data.subdomain);
    console.log('Domain:', data.domain);
    console.log('Status:', data.status);
    
  } catch (error) {
    console.error('Error during tenant check:', error.message);
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  checkMahikengTenant();
}