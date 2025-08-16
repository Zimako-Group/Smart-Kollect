-- =====================================================
-- SUPER ADMIN USER CREATION SCRIPT FOR SMART-KOLLECT
-- =====================================================
-- This script creates a super admin user with full system access
-- 
-- User Details:
-- Email: tshepangs@zimako.co.za
-- Password: 832287767@Tj
-- Role: super_admin
-- =====================================================

-- PREREQUISITE: First update the profiles table constraint to allow super_admin role
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'agent', 'manager', 'supervisor', 'indigent clerk', 'system', 'super_admin'));

-- Step 1: Create the user in Supabase Auth
-- Note: You'll need to create the user through Supabase Dashboard first
-- Go to Authentication > Users > Invite User
-- Use email: tshepangs@zimako.co.za
-- Set password: 832287767@Tj

-- Step 2: Once the user is created in Auth, get their UUID from the dashboard
-- Replace 'USER_UUID_HERE' with the actual UUID from the auth.users table

-- Step 3: Run this script to set up the user profile with super_admin role
DO $$
DECLARE
    user_uuid UUID;
    tenant_uuid UUID;
BEGIN
    -- Get the user UUID (replace with actual UUID after creating user in Auth)
    -- You can find this in Supabase Dashboard > Authentication > Users
    -- Or query: SELECT id FROM auth.users WHERE email = 'tshepangs@zimako.co.za';
    
    -- IMPORTANT: Replace this placeholder with the actual UUID
    user_uuid := 'ec61b859-d7d2-454b-beaf-8916d94f628d'::UUID;
    
    -- Get or create the Zimako tenant (for super admin association)
    SELECT id INTO tenant_uuid 
    FROM tenants 
    WHERE subdomain = 'zimako' OR name = 'Zimako';
    
    -- If Zimako tenant doesn't exist, create it
    IF tenant_uuid IS NULL THEN
        INSERT INTO tenants (
            name,
            subdomain,
            status,
            settings,
            created_at,
            updated_at
        ) VALUES (
            'Zimako',
            'zimako',
            'active',
            jsonb_build_object(
                'company_name', 'Zimako',
                'primary_color', '#3B82F6',
                'logo_url', '',
                'timezone', 'Africa/Johannesburg',
                'is_super_admin_tenant', true
            ),
            NOW(),
            NOW()
        )
        RETURNING id INTO tenant_uuid;
    END IF;
    
    -- Check if profile already exists (by email OR id)
    IF EXISTS (SELECT 1 FROM profiles WHERE email = 'tshepangs@zimako.co.za') THEN
        -- Update existing profile to super_admin
        UPDATE profiles
        SET 
            role = 'super_admin',
            tenant_id = tenant_uuid,
            full_name = 'Tshepang Sambo',
            status = 'active',
            updated_at = NOW()
        WHERE email = 'tshepangs@zimako.co.za';
        
        RAISE NOTICE 'Updated existing profile to super_admin role';
    ELSIF EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid) THEN
        -- Update existing profile with this UUID
        UPDATE profiles
        SET 
            email = 'tshepangs@zimako.co.za',
            role = 'super_admin',
            tenant_id = tenant_uuid,
            full_name = 'Tshepang Sambo',
            status = 'active',
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RAISE NOTICE 'Updated existing profile to super_admin role';
    ELSE
        -- Create new profile with super_admin role
        INSERT INTO profiles (
            id,
            tenant_id,
            email,
            full_name,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            tenant_uuid,
            'tshepangs@zimako.co.za',
            'Tshepang Sambo',
            'super_admin',
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new profile with super_admin role';
    END IF;
    
    -- Grant super admin permissions (if you have a permissions table)
    -- This is optional depending on your permission system
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permissions') THEN
        -- Clear any existing permissions
        DELETE FROM user_permissions WHERE user_id = user_uuid;
        
        -- Grant all permissions
        INSERT INTO user_permissions (user_id, permission, granted_at)
        VALUES 
            (user_uuid, 'system.manage', NOW()),
            (user_uuid, 'tenants.manage', NOW()),
            (user_uuid, 'users.manage', NOW()),
            (user_uuid, 'settings.manage', NOW()),
            (user_uuid, 'analytics.view', NOW()),
            (user_uuid, 'security.manage', NOW());
    END IF;
    
    RAISE NOTICE 'Super admin user setup completed successfully';
END $$;

-- Step 4: Verify the setup
-- Run these queries to confirm the user is properly configured:

-- Check profile
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.status,
    t.name as tenant_name,
    t.subdomain
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.email = 'tshepangs@zimako.co.za';

-- Check auth user (requires admin access)
-- SELECT id, email, created_at, last_sign_in_at 
-- FROM auth.users 
-- WHERE email = 'tshepangs@zimako.co.za';

-- =====================================================
-- ALTERNATIVE: Direct Insert Method (Use with caution)
-- =====================================================
-- If you have direct database access and want to create everything at once,
-- use this approach (requires database admin privileges):

/*
-- Create auth user directly (ONLY if you have database admin access)
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
    gen_random_uuid(),
    'tshepangs@zimako.co.za',
    crypt('832287767@Tj', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Tshepang Serobatse"}',
    true,
    'authenticated'
) RETURNING id;

-- Then use the returned ID to create the profile as shown above
*/

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. First create the user in Supabase Dashboard (Authentication > Users)
-- 2. Get the user's UUID from the dashboard
-- 3. Replace 'USER_UUID_HERE' with the actual UUID
-- 4. Run this script in the SQL Editor
-- 5. The user can then log in with:
--    Email: tshepangs@zimako.co.za
--    Password: 832287767@Tj
--    They will have full super_admin access to the system
