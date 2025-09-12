#!/usr/bin/env node

/**
 * Test script for University of Venda customer insert
 * This script tests inserting a single record into the univen_customers table
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

async function testInsert() {
  try {
    console.log('Testing University of Venda customer insert...');
    
    // Get University of Venda tenant ID
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', 'univen')
      .single();
    
    if (tenantError) throw tenantError;
    if (!tenantData) throw new Error('University of Venda tenant not found');
    
    const tenantId = tenantData.id;
    console.log(`University of Venda tenant ID: ${tenantId}`);
    
    // Create a simple test record
    const testRecord = {
      tenant_id: tenantId,
      "Client Reference": "TEST123",
      "Client": "Test Client",
      "error": "Test error message"
    };
    
    console.log('Inserting test record:', testRecord);
    
    // Try to insert the test record
    const { data, error } = await supabase
      .from('univen_customers')
      .insert(testRecord);
    
    if (error) {
      console.error('Error inserting test record:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Successfully inserted test record:', data);
    }
    
  } catch (error) {
    console.error('Error during test insert:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testInsert();
}