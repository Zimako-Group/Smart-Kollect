#!/usr/bin/env node

/**
 * Script to test the customer service function with tenant context
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL and Anon Key are required.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file');
  process.exit(1);
}

// Create Supabase client with anon key (simulating client-side)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock the tenant context function
let mockTenantId = null;

// Mock the getCurrentTenantId function
async function getCurrentTenantId() {
  // In a real scenario, this would get the tenant ID from the user's profile
  // For this test, we'll simulate setting it
  return mockTenantId;
}

// Updated getCustomerById function that uses tenant context
async function getCustomerById(customerId) {
  try {
    // Get tenant context
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant context found');
    }

    // First try to fetch by id (UUID format) with tenant context
    let { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Process the customer data (simplified)
    const customer = {
      id: data.id,
      acc_number: data.acc_number || 'N/A',
      surname_company_trust: data.surname_company_trust || 'N/A',
      name: data.name || 'N/A',
      // ... other fields
    };

    return customer;
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }
}

async function testCustomerService() {
  try {
    console.log('Testing customer service function with tenant context...');
    
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
    
    // Set the mock tenant ID
    mockTenantId = tenantId;
    
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
    
    // Now try to fetch the customer using our customer service function
    console.log('Fetching customer using customer service function...');
    const customerId = 'd593e45c-307e-4311-b74f-85eec4083386';
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      console.log('Customer not found using customer service function');
      return;
    }
    
    console.log('Successfully fetched customer using customer service function:');
    console.log('Name:', customer.name, customer.surname_company_trust);
    console.log('Account number:', customer.acc_number);
    
  } catch (error) {
    console.error('Error during customer service test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCustomerService();
}