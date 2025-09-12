-- Verify All Tenants Setup
-- This script checks if all required tenants exist and creates any missing ones

-- 1. Display current tenants
SELECT 'Current tenants in system:' as info;
SELECT id, name, subdomain, domain, status FROM tenants ORDER BY created_at;

-- 2. Ensure Mahikeng tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Ensure Triple M tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('Triple M Financial Services', 'triplem', 'triplem.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- 4. Ensure University of Venda tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- 5. Verify all tenants after creation
SELECT 'All tenants after setup:' as info;
SELECT id, name, subdomain, domain, status FROM tenants ORDER BY created_at;

-- 6. Check if any users are not assigned to a tenant
SELECT 'Users without tenant assignment:' as info;
SELECT id, email, full_name, tenant_id FROM profiles WHERE tenant_id IS NULL LIMIT 10;

-- 7. If there are users without tenant assignment, assign them to Mahikeng (default)
DO $$
DECLARE
  mahikeng_tenant_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get Mahikeng tenant ID
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  -- If Mahikeng tenant exists, assign unassigned users to it
  IF mahikeng_tenant_id IS NOT NULL THEN
    UPDATE profiles 
    SET tenant_id = mahikeng_tenant_id 
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Assigned % users to Mahikeng tenant', updated_count;
  ELSE
    RAISE NOTICE 'Mahikeng tenant not found, could not assign users';
  END IF;
END $$;

-- 8. Final verification
SELECT 'Tenant assignment verification:' as info;
SELECT t.name as tenant_name, COUNT(p.id) as user_count
FROM tenants t
LEFT JOIN profiles p ON p.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.created_at;