-- Assign all existing users to Mahikeng tenant
-- Run this in Supabase SQL Editor

-- Step 1: Ensure Mahikeng tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- Step 2: Get the Mahikeng tenant ID and assign all users
DO $$
DECLARE
  mahikeng_tenant_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get Mahikeng tenant ID
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  -- Update all users to belong to Mahikeng tenant
  UPDATE profiles 
  SET tenant_id = mahikeng_tenant_id 
  WHERE tenant_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users to Mahikeng tenant (ID: %)', updated_count, mahikeng_tenant_id;
END $$;

-- Step 3: Verify the assignment
SELECT 
  'Users assigned to Mahikeng:' as status,
  COUNT(*) as user_count
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'mahikeng';
