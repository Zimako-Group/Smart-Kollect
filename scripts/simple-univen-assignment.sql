-- Step 1: Check if user exists
SELECT 'Step 1: Checking if user exists' as step;
SELECT id, email, full_name, role, tenant_id 
FROM profiles 
WHERE id = '894b8103-5129-4d94-953c-344a672c6670' OR email = 'demo@univen.co.za';

-- Step 2: Create Univen tenant (run this separately)
INSERT INTO tenants (name, subdomain, domain, status, settings)
VALUES (
  'University of Venda', 
  'univen', 
  'univen.smartkollect.co.za', 
  'active',
  '{"theme": "univen", "features": ["customer-management", "payment-tracking", "reporting"]}'
);

-- Step 3: Verify tenant was created
SELECT 'Step 3: Checking if Univen tenant was created' as step;
SELECT * FROM tenants WHERE subdomain = 'univen';

-- Step 4: Get tenant ID and assign user (run this separately)
-- Replace the tenant_id below with the actual ID from step 3
UPDATE profiles 
SET 
  tenant_id = 'REPLACE_WITH_ACTUAL_TENANT_ID',
  role = 'agent',
  updated_at = NOW()
WHERE id = '894b8103-5129-4d94-953c-344a672c6670' OR email = 'demo@univen.co.za';

-- Step 5: Verify assignment
SELECT 'Step 5: Verifying user assignment' as step;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  t.name as tenant_name,
  t.subdomain as tenant_subdomain
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670' OR p.email = 'demo@univen.co.za';

-- Step 6: Check all Univen users
SELECT 'Step 6: All users in Univen tenant' as step;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  p.created_at as created_date
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'univen';
