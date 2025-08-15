-- Fix Mahikeng users by linking them to the Mahikeng tenant
-- This script should be run after the multi-tenant migration

-- Get the Mahikeng tenant ID
DO $$
DECLARE
  mahikeng_tenant_id UUID;
  user_count INTEGER;
BEGIN
  -- Get Mahikeng tenant ID
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  IF mahikeng_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Mahikeng tenant not found. Please run the multi-tenant migration first.';
  END IF;
  
  -- Update all existing users without tenant_id to belong to Mahikeng
  UPDATE profiles 
  SET tenant_id = mahikeng_tenant_id 
  WHERE tenant_id IS NULL;
  
  -- Get count of updated users
  GET DIAGNOSTICS user_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % users to belong to Mahikeng tenant (ID: %)', user_count, mahikeng_tenant_id;
  
  -- Show summary of users by tenant
  RAISE NOTICE 'Current user distribution:';
  FOR rec IN 
    SELECT t.name, t.subdomain, COUNT(p.id) as user_count
    FROM tenants t
    LEFT JOIN profiles p ON t.id = p.tenant_id
    GROUP BY t.id, t.name, t.subdomain
    ORDER BY t.name
  LOOP
    RAISE NOTICE '  %: % users', rec.name, rec.user_count;
  END LOOP;
END $$;

-- Verify the fix
SELECT 
  t.name as tenant_name,
  t.subdomain,
  COUNT(p.id) as user_count
FROM tenants t
LEFT JOIN profiles p ON t.id = p.tenant_id
GROUP BY t.id, t.name, t.subdomain
ORDER BY t.name;
