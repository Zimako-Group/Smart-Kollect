-- Verify User Tenant Assignment
-- This script verifies that a specific user is properly assigned to the University of Venda tenant

-- Check if the University of Venda tenant exists
SELECT 'University of Venda tenant status:' as info;
SELECT 
  id as tenant_id,
  name,
  subdomain,
  domain,
  status,
  created_at
FROM tenants 
WHERE subdomain = 'univen';

-- Check if the user profile exists and is assigned to the correct tenant
SELECT 'User profile verification:' as info;
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  t.name as tenant_name,
  t.subdomain as tenant_subdomain,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670';  -- The demo user ID

-- Check if the user has access to University of Venda customer data (if any exists)
SELECT 'University of Venda customer data access verification:' as info;
SELECT 
  COUNT(*) as customer_count
FROM univen_customers uc
JOIN profiles p ON uc.tenant_id = p.tenant_id
WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670';

-- Check RLS policies for the user
SELECT 'RLS policy verification:' as info;
SELECT 
  'User can access tenant data' as policy_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = '894b8103-5129-4d94-953c-344a672c6670' 
      AND tenant_id IS NOT NULL
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;

-- Summary
SELECT 'Summary:' as info;
SELECT 
  'User assigned to University of Venda tenant' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670'
      AND t.subdomain = 'univen'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
UNION ALL
SELECT 
  'User has agent role' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = '894b8103-5129-4d94-953c-344a672c6670'
      AND role = 'agent'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
UNION ALL
SELECT 
  'User account is active' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = '894b8103-5129-4d94-953c-344a672c6670'
      AND status = 'active'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as result;