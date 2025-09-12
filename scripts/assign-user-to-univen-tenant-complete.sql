-- Complete script to assign user demo@univen.co.za to Univen tenant
-- This script includes comprehensive error handling and verification
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  -- User details
  user_email TEXT := 'demo@univen.co.za';
  user_uuid UUID := '894b8103-5129-4d94-953c-344a672c6670';
  
  -- Variables
  univen_tenant_id UUID;
  user_exists BOOLEAN;
  tenant_exists BOOLEAN;
  update_success BOOLEAN;
  verification_success BOOLEAN;
  
  -- Record variable for user info
  user_record RECORD;
BEGIN
  RAISE NOTICE 'Starting user assignment process for % (%)', user_email, user_uuid;
  
  -- Step 1: Check if user exists in profiles table
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid OR email = user_email
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'ERROR: User % with UUID % does not exist in profiles table', user_email, user_uuid;
  END IF;
  
  RAISE NOTICE '✓ User exists in profiles table';
  
  -- Get current user details for logging
  SELECT * INTO user_record FROM profiles WHERE id = user_uuid OR email = user_email;
  RAISE NOTICE 'Current user details: ID=%, Email=%, Role=%, Tenant_ID=%', 
    user_record.id, user_record.email, user_record.role, user_record.tenant_id;
  
  -- Step 2: Check if Univen tenant exists
  SELECT EXISTS (
    SELECT 1 FROM tenants 
    WHERE subdomain = 'univen'
  ) INTO tenant_exists;
  
  IF NOT tenant_exists THEN
    RAISE NOTICE 'Univen tenant does not exist, creating it...';
    
    -- Create Univen tenant with comprehensive settings
    INSERT INTO tenants (name, subdomain, domain, status, settings)
    VALUES (
      'University of Venda', 
      'univen', 
      'univen.smartkollect.co.za', 
      'active',
      jsonb_build_object(
        'theme', 'univen',
        'features', jsonb_build_array(
          'customer-management', 
          'payment-tracking', 
          'reporting',
          'agent-dashboard',
          'call-management'
        ),
        'contact_info', jsonb_build_object(
          'name', 'University of Venda',
          'email', 'info@univen.ac.za',
          'phone', '+27 15 962 8000'
        ),
        'branding', jsonb_build_object(
          'primary_color', '#003366',
          'secondary_color', '#FFD700',
          'logo_url', '/images/univen-logo.png'
        )
      )
    )
    RETURNING id INTO univen_tenant_id;
    
    RAISE NOTICE '✓ Created Univen tenant with ID: %', univen_tenant_id;
  ELSE
    -- Get existing Univen tenant ID
    SELECT id INTO univen_tenant_id FROM tenants WHERE subdomain = 'univen';
    RAISE NOTICE '✓ Found existing Univen tenant with ID: %', univen_tenant_id;
  END IF;
  
  -- Step 3: Update user profile to assign to Univen tenant and set role
  RAISE NOTICE 'Assigning user to Univen tenant with agent role...';
  
  UPDATE profiles 
  SET 
    tenant_id = univen_tenant_id,
    role = 'agent',
    updated_at = NOW()
  WHERE id = user_uuid OR email = user_email;
  
  GET DIAGNOSTICS update_success = ROW_COUNT;
  
  IF NOT update_success THEN
    RAISE EXCEPTION 'ERROR: Failed to update user % with UUID %', user_email, user_uuid;
  END IF;
  
  RAISE NOTICE '✓ Successfully updated user profile';
  
  -- Step 4: Verify the assignment
  RAISE NOTICE 'Verifying assignment...';
  
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND tenant_id = univen_tenant_id 
    AND role = 'agent'
  ) INTO verification_success;
  
  IF NOT verification_success THEN
    RAISE EXCEPTION 'ERROR: Verification failed - user assignment was not successful';
  END IF;
  
  RAISE NOTICE '✓ Verification successful: User is now assigned to Univen tenant';
  
  -- Step 5: Log final status
  RAISE NOTICE '=== ASSIGNMENT COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'User: % (%)', user_email, user_uuid;
  RAISE NOTICE 'Tenant: University of Venda (ID: %)', univen_tenant_id;
  RAISE NOTICE 'Role: agent';
  RAISE NOTICE 'Subdomain: univen.smartkollect.co.za';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERROR during user assignment: %', SQLERRM;
END $$;

-- Final verification queries
SELECT '=== FINAL VERIFICATION REPORT ===' as report;

-- 1. Show the assigned user details
SELECT 'Assigned User Details:' as section;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  p.tenant_id,
  t.name as tenant_name,
  t.subdomain as tenant_subdomain,
  t.domain as tenant_domain,
  p.created_at as created_date,
  p.updated_at as updated_date
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670' OR p.email = 'demo@univen.co.za';

-- 2. Show all users in Univen tenant
SELECT 'All Univen Tenant Users:' as section;
SELECT 
  p.id as user_id,
  p.email as user_email,
  p.full_name as user_name,
  p.role as user_role,
  p.created_at as created_date
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'univen'
ORDER BY p.created_at DESC;

-- 3. Show Univen tenant details
SELECT 'Univen Tenant Details:' as section;
SELECT 
  id,
  name,
  subdomain,
  domain,
  status,
  settings,
  created_at,
  updated_at
FROM tenants 
WHERE subdomain = 'univen';

-- 4. Show tenant distribution overview
SELECT 'Tenant Distribution Overview:' as section;
SELECT 
  COALESCE(t.name, 'No Tenant') as tenant_name,
  COALESCE(t.subdomain, 'none') as subdomain,
  COUNT(p.id) as user_count,
  STRING_AGG(DISTINCT p.role, ', ') as roles
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
GROUP BY t.name, t.subdomain
ORDER BY user_count DESC;
