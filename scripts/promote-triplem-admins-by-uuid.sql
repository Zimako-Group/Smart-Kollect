-- Promote Patrick and Ronald to admin role using their specific UUIDs
-- This script updates their role from 'agent' to 'admin' using UUID lookup

DO $$
DECLARE
  patrick_uuid UUID := '468b5af7-3ddc-4124-b9bd-2909d8ec95f8';
  ronald_uuid UUID := '1b3643e6-f7ee-44ba-ad06-031af3418855';
  triplem_tenant_id UUID;
  updated_count INTEGER := 0;
BEGIN
  -- Get Triple M tenant ID
  SELECT id INTO triplem_tenant_id FROM tenants WHERE subdomain = 'triplem';
  
  IF triplem_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Triple M tenant not found.';
  END IF;
  
  -- Update Patrick to admin
  UPDATE profiles 
  SET role = 'admin',
      updated_at = NOW()
  WHERE id = patrick_uuid;
  
  IF FOUND THEN
    updated_count := updated_count + 1;
    RAISE NOTICE 'Promoted Patrick (UUID: %) to admin role', patrick_uuid;
  ELSE
    RAISE NOTICE 'Patrick (UUID: %) not found in profiles table', patrick_uuid;
  END IF;
  
  -- Update Ronald to admin
  UPDATE profiles 
  SET role = 'admin',
      updated_at = NOW()
  WHERE id = ronald_uuid;
  
  IF FOUND THEN
    updated_count := updated_count + 1;
    RAISE NOTICE 'Promoted Ronald (UUID: %) to admin role', ronald_uuid;
  ELSE
    RAISE NOTICE 'Ronald (UUID: %) not found in profiles table', ronald_uuid;
  END IF;
  
  RAISE NOTICE 'Successfully promoted % users to admin role', updated_count;
END $$;

-- Verify the role updates by UUID
SELECT 
  'Updated Admin Users:' as info,
  p.id,
  p.email,
  p.full_name,
  p.role,
  t.name as tenant_name
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id IN ('468b5af7-3ddc-4124-b9bd-2909d8ec95f8', '1b3643e6-f7ee-44ba-ad06-031af3418855')
ORDER BY p.email;

-- Show current Triple M role distribution
SELECT 
  'Triple M Role Summary:' as info,
  p.role,
  COUNT(*) as user_count
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem'
GROUP BY p.role
ORDER BY p.role;
