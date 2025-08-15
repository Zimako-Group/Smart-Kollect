-- Fix user tenant assignment for Mahikeng users
-- Run this in Supabase SQL Editor

-- First, check if tenants table exists and has data
SELECT 'Tenants in system:' as info;
SELECT name, subdomain, id FROM tenants;

-- Check current profiles without tenant_id
SELECT 'Users without tenant assignment:' as info;
SELECT id, email, full_name, tenant_id FROM profiles WHERE tenant_id IS NULL LIMIT 10;

-- Get Mahikeng tenant ID and assign all existing users to it
DO $$
DECLARE
  mahikeng_tenant_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get Mahikeng tenant ID
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  -- If no Mahikeng tenant exists, create it
  IF mahikeng_tenant_id IS NULL THEN
    INSERT INTO tenants (name, subdomain, domain, status)
    VALUES ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za', 'active')
    RETURNING id INTO mahikeng_tenant_id;
    
    RAISE NOTICE 'Created Mahikeng tenant with ID: %', mahikeng_tenant_id;
  ELSE
    RAISE NOTICE 'Found Mahikeng tenant with ID: %', mahikeng_tenant_id;
  END IF;
  
  -- Update all users without tenant_id to belong to Mahikeng
  UPDATE profiles 
  SET tenant_id = mahikeng_tenant_id 
  WHERE tenant_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users to Mahikeng tenant', updated_count;
END $$;

-- Verify the assignment worked
SELECT 'Final user distribution:' as info;
SELECT 
  COALESCE(t.name, 'No Tenant') as tenant_name,
  COALESCE(t.subdomain, 'none') as subdomain,
  COUNT(p.id) as user_count
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
GROUP BY t.name, t.subdomain
ORDER BY user_count DESC;

-- Show sample of assigned users
SELECT 'Sample of assigned users:' as info;
SELECT 
  p.email,
  p.full_name,
  t.name as tenant_name,
  t.subdomain
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'mahikeng'
LIMIT 5;
