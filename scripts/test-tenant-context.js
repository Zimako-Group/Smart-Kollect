#!/usr/bin/env node

/**
 * Script to test tenant context setting
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

async function testTenantContext() {
  try {
    console.log('Testing tenant context setting...');
    
    // Set the tenant context (simulating what the middleware does)
    console.log('Setting tenant context to mahikeng...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('set_tenant_context', { 
      tenant_subdomain: 'mahikeng' 
    });
    
    if (rpcError) {
      console.error('Error setting tenant context:', rpcError.message);
      return;
    }
    
    console.log('Tenant context set successfully');
    
    // Now try to fetch the customer with the tenant context set
    console.log('Fetching customer with tenant context set...');
    const customerId = 'd593e45c-307e-4311-b74f-85eec4083386';
    const { data: customer, error: customerError } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer with tenant context:', customerError.message);
      return;
    }
    
    if (!customer) {
      console.log('Customer not found with tenant context');
      return;
    }
    
    console.log('Successfully fetched customer with tenant context:');
    console.log('Name:', customer.name, customer.surname_company_trust);
    console.log('Account number:', customer.acc_number);
    console.log('Tenant ID:', customer.tenant_id);
    
  } catch (error) {
    console.error('Error during tenant context test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testTenantContext();
}