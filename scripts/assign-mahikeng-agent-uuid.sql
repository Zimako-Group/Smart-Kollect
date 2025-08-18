-- Assign specific UUID to Mahikeng agent
-- This script links the user pumla@fmtholdings.co.za to the specified UUID and Mahikeng tenant

DO $$
DECLARE
  mahikeng_tenant_id UUID;
  target_user_id UUID := '21d91eb5-8d94-4dc9-bfc5-a4abecf12456';
  target_email TEXT := 'pumla@fmtholdings.co.za';
BEGIN
  -- Get Mahikeng tenant ID
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  IF mahikeng_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Mahikeng tenant not found. Please ensure tenant exists first.';
  END IF;
  
  RAISE NOTICE 'Mahikeng tenant ID: %', mahikeng_tenant_id;
  RAISE NOTICE 'Assigning UUID % to user %', target_user_id, target_email;
  
  -- First, check if this UUID already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE NOTICE 'User with UUID % already exists in auth.users', target_user_id;
    
    -- Update the existing auth user's email if different
    UPDATE auth.users 
    SET email = target_email,
        updated_at = NOW()
    WHERE id = target_user_id;
    
  ELSE
    -- Insert new auth user with specific UUID
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
      target_user_id,
      target_email,
      crypt('TempPass123!', gen_salt('bf')), -- Temporary password
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      false,
      'authenticated'
    );
    
    RAISE NOTICE 'Created new auth user with UUID %', target_user_id;
  END IF;
  
  -- Insert or update profile with specific UUID and link to Mahikeng tenant
  INSERT INTO profiles (
    id,
    email,
    full_name,
    tenant_id,
    role,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    target_email,
    'Pumla', -- You can change this name as needed
    mahikeng_tenant_id,
    'agent',
    NOW(),
    NOW()
  ) 
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE 'Successfully assigned UUID % to % as Mahikeng agent', target_user_id, target_email;
END $$;

-- Verify the assignment
SELECT 
  'User Assignment Verification:' as info,
  p.id,
  p.email,
  p.full_name,
  p.role,
  t.name as tenant_name,
  t.subdomain
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id = '21d91eb5-8d94-4dc9-bfc5-a4abecf12456';
