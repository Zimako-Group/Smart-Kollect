#!/usr/bin/env node

/**
 * Script to test fetching a specific customer by ID
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

async function testCustomerFetch() {
  try {
    console.log('Testing customer fetch...');
    
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
    
    // Get the first customer for testing
    const { data: customers, error: customersError } = await supabase
      .from('Debtors')
      .select('id, acc_number, name, surname_company_trust')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    if (customersError) {
      console.error('Error fetching customers:', customersError.message);
      return;
    }
    
    if (customers.length === 0) {
      console.log('No customers found for Mahikeng tenant');
      return;
    }
    
    const customer = customers[0];
    console.log('Testing with customer:', customer);
    
    // Try to fetch the customer by ID
    console.log('Fetching customer by ID:', customer.id);
    const { data: customerById, error: customerByIdError } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customer.id)
      .single();
    
    if (customerByIdError) {
      console.error('Error fetching customer by ID:', customerByIdError.message);
      return;
    }
    
    console.log('Successfully fetched customer by ID');
    console.log('Customer name:', customerById.name, customerById.surname_company_trust);
    console.log('Account number:', customerById.acc_number);
    
  } catch (error) {
    console.error('Error during customer fetch test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCustomerFetch();
}