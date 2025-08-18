-- Link existing Triple M users to tenant
-- Run this to connect your manually created users to Triple M tenant

DO $$
DECLARE
  triplem_tenant_id UUID;
  user_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Get Triple M tenant ID
  SELECT id INTO triplem_tenant_id FROM tenants WHERE subdomain = 'triplem';
  
  IF triplem_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Triple M tenant not found. Please ensure tenant exists first.';
  END IF;
  
  RAISE NOTICE 'Triple M tenant ID: %', triplem_tenant_id;
  
  -- Update existing users to belong to Triple M tenant
  -- This will find users by email and link them to the tenant
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    WHERE au.email IN (
      'tshilidzi@3mprojects.co.za',
      'ronald@3mprojects.co.za', 
      'kao@3mprojects.co.za',
      'patrick@3mprojects.co.za',
      'ester@3mprojects.co.za'
    )
  LOOP
    -- Insert or update profile for each user
    INSERT INTO profiles (
      id,
      email,
      full_name,
      tenant_id,
      role,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      CASE 
        WHEN user_record.email = 'tshilidzi@3mprojects.co.za' THEN 'Tshilidzi'
        WHEN user_record.email = 'ronald@3mprojects.co.za' THEN 'Ronald'
        WHEN user_record.email = 'kao@3mprojects.co.za' THEN 'Kao'
        WHEN user_record.email = 'patrick@3mprojects.co.za' THEN 'Patrick'
        WHEN user_record.email = 'ester@3mprojects.co.za' THEN 'Ester'
        ELSE split_part(user_record.email, '@', 1) -- fallback to email prefix
      END,
      triplem_tenant_id,
      'agent', -- Set all as agents, you can change specific ones later
      NOW(),
      NOW()
    ) 
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      role = EXCLUDED.role,
      updated_at = NOW();
    
    updated_count := updated_count + 1;
    RAISE NOTICE 'Linked user: % to Triple M tenant', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Successfully linked % users to Triple M tenant', updated_count;
END $$;

-- Verify the users were linked correctly
SELECT 
  'Triple M Users Summary:' as info,
  COUNT(*) as total_users
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem';

-- Show the linked users
SELECT 
  p.email,
  p.full_name,
  p.role,
  t.name as tenant_name,
  'Linked Successfully' as status
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'triplem'
ORDER BY p.email;
