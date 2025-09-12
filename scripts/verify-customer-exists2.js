#!/usr/bin/env node

/**
 * Script to verify if a specific customer exists
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
const customerId = 'd593e45c-307e-4311-b74f-85eec4083386';

async function verifyCustomerExists() {
  try {
    console.log('Verifying if customer exists:', customerId);
    
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
    
    // Try to fetch the customer by ID with tenant context
    console.log('Fetching customer by ID with tenant context');
    const { data: customer, error } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error.message);
      // Try without tenant context to see if it exists at all
      console.log('Trying to fetch customer without tenant context');
      const { data: customerWithoutTenant, error: errorWithoutTenant } = await supabase
        .from('Debtors')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (errorWithoutTenant) {
        console.error('Customer does not exist at all:', errorWithoutTenant.message);
      } else {
        console.log('Customer exists but may not belong to Mahikeng tenant:');
        console.log('Customer tenant ID:', customerWithoutTenant.tenant_id);
        
        // Check what tenant this customer belongs to
        if (customerWithoutTenant.tenant_id) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('name, subdomain')
            .eq('id', customerWithoutTenant.tenant_id)
            .single();
          
          if (tenant) {
            console.log('Customer belongs to tenant:', tenant.name, `(${tenant.subdomain})`);
          }
        }
      }
      return;
    }
    
    if (!customer) {
      console.log('Customer not found');
      return;
    }
    
    console.log('Customer found:');
    console.log('Name:', customer.name, customer.surname_company_trust);
    console.log('Account number:', customer.acc_number);
    console.log('Tenant ID:', customer.tenant_id);
    
  } catch (error) {
    console.error('Error during customer verification:', error.message);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  verifyCustomerExists();
}