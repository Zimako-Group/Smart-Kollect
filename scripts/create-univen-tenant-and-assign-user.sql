-- Simple script to create Univen tenant and assign user
-- Run each section separately in Supabase SQL Editor

-- Section 1: Create Univen tenant first
INSERT INTO tenants (name, subdomain, domain, status, settings)
VALUES (
  'University of Venda', 
  'univen', 
  'univen.smartkollect.co.za', 
  'active',
  '{"theme": "univen", "features": ["customer-management", "payment-tracking", "reporting"]}'
)
ON CONFLICT (subdomain) DO UPDATE
SET name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    settings = EXCLUDED.settings;

-- Verify tenant was created
SELECT 'Univen Tenant Created:' as status;
SELECT * FROM tenants WHERE subdomain = 'univen';

-- Section 2: Get the Univen tenant ID and assign user
-- First, get the tenant ID
DO $$
DECLARE
  univen_tenant_id UUID;
BEGIN
  SELECT id INTO univen_tenant_id FROM tenants WHERE subdomain = 'univen';
  
  IF univen_tenant_id IS NOT NULL THEN
    -- Update the user profile
    UPDATE profiles 
    SET 
      tenant_id = univen_tenant_id,
      role = 'agent',
      updated_at = NOW()
    WHERE id = '894b8103-5129-4d94-953c-344a672c6670' OR email = 'demo@univen.co.za';
    
    RAISE NOTICE 'User assigned to Univen tenant successfully. Tenant ID: %', univen_tenant_id;
  ELSE
    RAISE EXCEPTION 'Univen tenant not found';
  END IF;
END $$;

-- Section 3: Verify the assignment
SELECT 'User Assignment Verification:' as status;
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

-- Section 4: Show all Univen users
SELECT 'All Univen Users:' as status;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  p.created_at as created_date
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'univen'
ORDER BY p.created_at DESC;
