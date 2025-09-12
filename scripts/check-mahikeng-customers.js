#!/usr/bin/env node

/**
 * Script to check if there are customers associated with the Mahikeng tenant
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

async function checkMahikengCustomers() {
  try {
    console.log('Checking Mahikeng tenant customers...');
    
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
    
    // Check if there are customers associated with this tenant
    const { data: customers, error: customersError } = await supabase
      .from('Debtors')
      .select('id, acc_number, name, surname_company_trust', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .limit(5);
    
    if (customersError) {
      console.error('Error fetching customers:', customersError.message);
      return;
    }
    
    console.log(`Found ${customers.length} customers for Mahikeng tenant:`);
    customers.forEach(customer => {
      console.log(`- ID: ${customer.id}, Account: ${customer.acc_number}, Name: ${customer.name} ${customer.surname_company_trust}`);
    });
    
  } catch (error) {
    console.error('Error during customer check:', error.message);
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  checkMahikengCustomers();
}