-- Fixed script to assign user demo@univen.co.za to Univen tenant
-- This script works properly in Supabase SQL Editor
-- Run this in Supabase SQL Editor

-- First, check if user exists
SELECT 'Checking if user exists...' as status;
SELECT id, email, full_name, role, tenant_id 
FROM profiles 
WHERE id = '894b8103-5129-4d94-953c-344a672c6670' OR email = 'demo@univen.co.za';

-- Check if Univen tenant exists
SELECT 'Checking if Univen tenant exists...' as status;
SELECT id, name, subdomain, domain, status 
FROM tenants 
WHERE subdomain = 'univen';

-- Create Univen tenant if it doesn't exist
INSERT INTO tenants (name, subdomain, domain, status, settings)
VALUES (
  'University of Venda', 
  'univen', 
  'univen.smartkollect.co.za', 
  'active',
  '{"theme": "univen", "features": ["customer-management", "payment-tracking", "reporting"]}'
)
ON CONFLICT (subdomain) DO NOTHING;

-- Get Univen tenant ID
DO $$
DECLARE
  univen_tenant_id UUID;
BEGIN
  SELECT id INTO univen_tenant_id FROM tenants WHERE subdomain = 'univen';
  
  IF univen_tenant_id IS NOT NULL THEN
    RAISE NOTICE 'Univen tenant ID: %', univen_tenant_id;
    
    -- Update user to assign to Univen tenant and set role as agent
    UPDATE profiles 
    SET 
      tenant_id = univen_tenant_id,
      role = 'agent',
      updated_at = NOW()
    WHERE id = '894b8103-5129-4d94-953c-344a672c6670' OR email = 'demo@univen.co.za';
    
    RAISE NOTICE 'User assigned to Univen tenant successfully';
  ELSE
    RAISE EXCEPTION 'Failed to get Univen tenant ID';
  END IF;
END $$;

-- Final verification
SELECT '=== FINAL VERIFICATION ===' as report;

-- Show the assigned user details
SELECT 'Assigned User Details:' as section;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  p.tenant_id,
  t.name as tenant_name,
  t.subdomain as tenant_subdomain,
  t.domain as tenant_domain
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670' OR p.email = 'demo@univen.co.za';

-- Show all users in Univen tenant
SELECT 'All Univen Tenant Users:' as section;
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

-- Show Univen tenant details
SELECT 'Univen Tenant Details:' as section;
SELECT 
  id,
  name,
  subdomain,
  domain,
  status,
  settings,
  created_at,
  updated_at
FROM tenants 
WHERE subdomain = 'univen';

-- Show tenant distribution overview
SELECT 'Tenant Distribution Overview:' as section;
SELECT 
  COALESCE(t.name, 'No Tenant') as tenant_name,
  COALESCE(t.subdomain, 'none') as subdomain,
  COUNT(p.id) as user_count,
  STRING_AGG(DISTINCT p.role, ', ') as roles
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
GROUP BY t.name, t.subdomain
ORDER BY user_count DESC;
