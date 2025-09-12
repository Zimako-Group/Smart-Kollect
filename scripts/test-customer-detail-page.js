#!/usr/bin/env node

/**
 * Script to test the customer detail page functionality
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

// Customer ID from the error
const customerId = '5b0eeb53-ced6-4736-928b-6f8f5a590ddd';

async function testCustomerDetailPage() {
  try {
    console.log('Testing customer detail page functionality...');
    
    // First get the Mahikeng tenant ID
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', 'mahikeng')
      .single();
    
    if (tenantError) {
      console.error('Error fetching Mahikeng tenant:', tenantError.message);
      return;
    }
    
    if (!tenantData) {
      console.log('Mahikeng tenant not found');
      return;
    }
    
    const tenantId = tenantData.id;
    console.log('Mahikeng tenant ID:', tenantId);
    
    // Set the tenant context (simulating what the middleware does)
    console.log('Setting tenant context...');
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
    console.error('Error during customer detail page test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCustomerDetailPage();
}