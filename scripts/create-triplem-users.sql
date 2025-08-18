-- Create Triple M agent users
-- Run this AFTER creating the auth users in Supabase Dashboard

-- Get Triple M tenant ID
DO $$
DECLARE
  triplem_tenant_id UUID;
BEGIN
  SELECT id INTO triplem_tenant_id FROM tenants WHERE subdomain = 'triplem';
  
  IF triplem_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Triple M tenant not found. Please ensure tenant exists first.';
  END IF;
  
  RAISE NOTICE 'Triple M tenant ID: %', triplem_tenant_id;
  
  -- Insert profiles for Triple M users
  -- Replace the UUIDs below with actual user IDs from Supabase Auth
  INSERT INTO profiles (id, email, full_name, tenant_id, role) VALUES
    -- Replace these UUIDs with actual user IDs from Supabase Auth after creating users
    ('00000000-0000-0000-0000-000000000001', 'agent1@triplem.co.za', 'Agent One', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000002', 'agent2@triplem.co.za', 'Agent Two', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000003', 'agent3@triplem.co.za', 'Agent Three', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000004', 'agent4@triplem.co.za', 'Agent Four', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000005', 'agent5@triplem.co.za', 'Agent Five', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000006', 'agent6@triplem.co.za', 'Agent Six', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000007', 'agent7@triplem.co.za', 'Agent Seven', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000008', 'agent8@triplem.co.za', 'Agent Eight', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000009', 'agent9@triplem.co.za', 'Agent Nine', triplem_tenant_id, 'agent'),
    ('00000000-0000-0000-0000-000000000010', 'admin@triplem.co.za', 'Triple M Admin', triplem_tenant_id, 'admin')
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;
    
  RAISE NOTICE 'Created profiles for 10 Triple M users';
END $$;

-- Verify the users were created
SELECT 
  'Triple M Users Created:' as status,
  COUNT(*) as user_count
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem';
