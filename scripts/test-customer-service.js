const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Mock the getCurrentTenantId function to return Mahikeng tenant ID
async function getCurrentTenantId() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get Mahikeng tenant
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', 'mahikeng')
    .single();
  
  if (error) {
    console.error('Error fetching Mahikeng tenant:', error);
    return null;
  }
  
  return tenant.id;
}

// Mock customer service function
async function getCustomerById(customerId) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
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

    // If that fails, try to fetch by acc_number with tenant context
    if (error && error.message.includes('invalid input syntax for type uuid')) {
      console.log('Trying to fetch by acc_number instead of id');
      const accNumberResult = await supabase
        .from('Debtors')
        .select('*')
        .eq('acc_number', customerId)
        .eq('tenant_id', tenantId);
      
      // Check if we got any results
      if (accNumberResult.data && accNumberResult.data.length > 0) {
        // Use the first match if multiple results
        data = accNumberResult.data[0];
        error = null;
      } else {
        // Try searching by phone numbers with tenant context
        console.log('Trying to fetch by phone numbers');
        const phoneResult = await supabase
          .from('Debtors')
          .select('*')
          .eq('tenant_id', tenantId)
          .or(
            `cell_number.eq."${customerId}",
            cell_number2.eq."${customerId}",
            cellphone_1.eq."${customerId}",
            cellphone_2.eq."${customerId}",
            cellphone_3.eq."${customerId}",
            cellphone_4.eq."${customerId}",
            home_tel.eq."${customerId}",
            work_tel.eq."${customerId}"`
          );
        
        if (phoneResult.data && phoneResult.data.length > 0) {
          // Use the first match if multiple results
          data = phoneResult.data[0];
          error = null;
        } else {
          data = null;
          error = {
            message: 'No customer found with the provided identifier',
            details: '',
            hint: '',
            code: 'NOT_FOUND',
            name: 'PostgrestError'
          };
        }
      }
    }

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }
}

async function testCustomerService() {
  try {
    // Test customer ID from the error
    const customerId = 'd593e45c-307e-4311-b74f-85eec4083386';
    
    console.log('Testing customer service with ID:', customerId);
    
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      console.log('Customer not found');
      return;
    }
    
    console.log('Customer found:', {
      id: customer.id,
      name: customer.name,
      surname_company_trust: customer.surname_company_trust,
      acc_number: customer.acc_number,
      tenant_id: customer.tenant_id
    });
    
  } catch (error) {
    console.error('Error testing customer service:', error);
  }
}

testCustomerService();