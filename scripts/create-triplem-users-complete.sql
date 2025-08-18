-- Complete Triple M user creation script
-- This creates both auth users and profiles in one go

-- First, get the Triple M tenant ID
DO $$
DECLARE
  triplem_tenant_id UUID;
  user_data RECORD;
  auth_user_id UUID;
BEGIN
  -- Get Triple M tenant ID
  SELECT id INTO triplem_tenant_id FROM tenants WHERE subdomain = 'triplem';
  
  IF triplem_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Triple M tenant not found. Please ensure tenant exists first.';
  END IF;
  
  RAISE NOTICE 'Creating users for Triple M tenant: %', triplem_tenant_id;
  
  -- Create auth users and profiles
  FOR user_data IN 
    SELECT * FROM (VALUES
      ('agent1@triplem.co.za', 'Agent One', 'agent'),
      ('agent2@triplem.co.za', 'Agent Two', 'agent'),
      ('agent3@triplem.co.za', 'Agent Three', 'agent'),
      ('agent4@triplem.co.za', 'Agent Four', 'agent'),
      ('agent5@triplem.co.za', 'Agent Five', 'agent'),
      ('agent6@triplem.co.za', 'Agent Six', 'agent'),
      ('agent7@triplem.co.za', 'Agent Seven', 'agent'),
      ('agent8@triplem.co.za', 'Agent Eight', 'agent'),
      ('agent9@triplem.co.za', 'Agent Nine', 'agent'),
      ('admin@triplem.co.za', 'Triple M Admin', 'admin')
    ) AS t(email, full_name, role)
  LOOP
    -- Generate a UUID for the user
    auth_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this requires service role privileges)
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      auth_user_id,
      user_data.email,
      crypt('TempPass123!', gen_salt('bf')), -- Temporary password - users should change this
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      false,
      'authenticated'
    ) ON CONFLICT (email) DO NOTHING;
    
    -- Insert profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      tenant_id,
      role,
      created_at,
      updated_at
    ) VALUES (
      auth_user_id,
      user_data.email,
      user_data.full_name,
      triplem_tenant_id,
      user_data.role,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      role = EXCLUDED.role;
      
    RAISE NOTICE 'Created user: % (%)', user_data.full_name, user_data.email;
  END LOOP;
  
  RAISE NOTICE 'Successfully created 10 Triple M users';
END $$;

-- Verify users were created
SELECT 
  'Triple M Users Summary:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'agent' THEN 1 END) as agents,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem';

-- Show the created users
SELECT 
  p.email,
  p.full_name,
  p.role,
  t.name as tenant_name
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem'
ORDER BY p.role, p.email;
