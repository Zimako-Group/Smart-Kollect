-- Promote Patrick and Ronald to admin role for Triple M tenant
-- This script updates their role from 'agent' to 'admin'

DO $$
DECLARE
  updated_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Update the specified users to admin role
  FOR user_record IN 
    SELECT p.id, p.email, p.full_name
    FROM profiles p
    JOIN tenants t ON p.tenant_id = t.id
    WHERE t.subdomain = 'triplem'
    AND p.email IN ('patrick@3mprojects.co.za', 'ronald@3mprojects.co.za')
  LOOP
    -- Update role to admin
    UPDATE profiles 
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = user_record.id;
    
    updated_count := updated_count + 1;
    RAISE NOTICE 'Promoted % (%) to admin role', user_record.full_name, user_record.email;
  END LOOP;
  
  IF updated_count = 0 THEN
    RAISE NOTICE 'No users found to update. Please verify the emails exist in Triple M tenant.';
  ELSE
    RAISE NOTICE 'Successfully promoted % users to admin role', updated_count;
  END IF;
END $$;

-- Verify the role updates
SELECT 
  'Triple M Admin Users:' as info,
  p.email,
  p.full_name,
  p.role,
  t.name as tenant_name,
  'Role Updated' as status
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem'
AND p.role = 'admin'
ORDER BY p.email;

-- Show current role distribution for Triple M
SELECT 
  'Triple M Role Summary:' as info,
  p.role,
  COUNT(*) as user_count
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem'
GROUP BY p.role
ORDER BY p.role;
