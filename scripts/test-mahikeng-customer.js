const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomer() {
  try {
    // Get Mahikeng tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'mahikeng')
      .single();

    if (tenantError) {
      console.error('Error fetching Mahikeng tenant:', tenantError);
      return;
    }

    console.log('Mahikeng tenant:', tenant);

    // Test customer ID from the error
    const customerId = 'd593e45c-307e-4311-b74f-85eec4083386';

    // Check if customer exists and belongs to Mahikeng tenant
    const { data: customer, error: customerError } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenant.id)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return;
    }

    if (!customer) {
      console.log('Customer not found or does not belong to Mahikeng tenant');
      return;
    }

    console.log('Customer found:', {
      id: customer.id,
      name: customer.name,
      surname_company_trust: customer.surname_company_trust,
      acc_number: customer.acc_number,
      tenant_id: customer.tenant_id
    });

    // Test the tenant context function
    console.log('Setting tenant context...');
    const { data: contextResult, error: contextError } = await supabase.rpc('set_tenant_context', {
      tenant_subdomain: 'mahikeng'
    });

    if (contextError) {
      console.error('Error setting tenant context:', contextError);
      return;
    }

    console.log('Tenant context set:', contextResult);

    // Try to fetch the customer again with tenant context
    const { data: customerWithContext, error: customerWithContextError } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerWithContextError) {
      console.error('Error fetching customer with context:', customerWithContextError);
      return;
    }

    console.log('Customer with context:', {
      id: customerWithContext.id,
      name: customerWithContext.name,
      surname_company_trust: customerWithContext.surname_company_trust,
      acc_number: customerWithContext.acc_number,
      tenant_id: customerWithContext.tenant_id
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCustomer();