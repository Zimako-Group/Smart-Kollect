-- =====================================================
-- FIX SUPER ADMIN PROFILE LINKAGE
-- =====================================================
-- This script fixes the mismatch between auth user and profile
-- It ensures the profile exists with the correct auth user ID
-- =====================================================

DO $$
DECLARE
    auth_user_id UUID;
    existing_profile_id UUID;
    tenant_uuid UUID;
BEGIN
    -- Step 1: Get the actual auth user ID for tshepangs@zimako.co.za
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'tshepangs@zimako.co.za'
    LIMIT 1;
    
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found for email: tshepangs@zimako.co.za';
    END IF;
    
    RAISE NOTICE 'Found auth user with ID: %', auth_user_id;
    
    -- Step 2: Check if there's an existing profile with this email
    SELECT id INTO existing_profile_id
    FROM profiles
    WHERE email = 'tshepangs@zimako.co.za'
    LIMIT 1;
    
    -- Step 3: Get or create Zimako tenant
    SELECT id INTO tenant_uuid 
    FROM tenants 
    WHERE subdomain = 'zimako' OR name = 'Zimako'
    LIMIT 1;
    
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
        RAISE NOTICE 'Created Zimako tenant with ID: %', tenant_uuid;
    END IF;
    
    -- Step 4: Handle profile creation/update
    IF existing_profile_id IS NOT NULL THEN
        -- If profile exists but with wrong ID, we need to handle it carefully
        IF existing_profile_id != auth_user_id THEN
            -- First, create the new profile with correct auth user ID
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
                auth_user_id,
                tenant_uuid,
                'tshepangs@zimako.co.za_temp',  -- Temporary email to avoid duplicate
                'Tshepang Sambo',
                'super_admin',
                'active',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created new profile with correct auth user ID: %', auth_user_id;
            
            -- Update all foreign key references to point to the new ID
            -- Only update tables/columns that exist
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'agent_id') THEN
                UPDATE accounts SET agent_id = auth_user_id WHERE agent_id = existing_profile_id;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'account_activities' AND column_name = 'user_id') THEN
                UPDATE account_activities SET user_id = auth_user_id WHERE user_id = existing_profile_id;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'agent_id') THEN
                UPDATE call_logs SET agent_id = auth_user_id WHERE agent_id = existing_profile_id;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ptp' AND column_name = 'agent_id') THEN
                UPDATE ptp SET agent_id = auth_user_id WHERE agent_id = existing_profile_id;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_by') THEN
                UPDATE notes SET created_by = auth_user_id WHERE created_by = existing_profile_id;
            END IF;
            
            RAISE NOTICE 'Updated foreign key references where applicable';
            
            -- Now delete the old profile
            DELETE FROM profiles WHERE id = existing_profile_id;
            RAISE NOTICE 'Deleted old profile with ID: %', existing_profile_id;
            
            -- Update the new profile with the correct email
            UPDATE profiles 
            SET email = 'tshepangs@zimako.co.za'
            WHERE id = auth_user_id;
            RAISE NOTICE 'Updated profile email to correct value';
        ELSE
            -- Profile exists with correct ID, just update it
            UPDATE profiles
            SET 
                role = 'super_admin',
                tenant_id = tenant_uuid,
                full_name = 'Tshepang Sambo',
                status = 'active',
                updated_at = NOW()
            WHERE id = auth_user_id;
            RAISE NOTICE 'Updated existing profile to super_admin role';
        END IF;
    ELSE
        -- No profile exists, create new one with auth user ID
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
            auth_user_id,
            tenant_uuid,
            'tshepangs@zimako.co.za',
            'Tshepang Sambo',
            'super_admin',
            'active',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created new profile with auth user ID: %', auth_user_id;
    END IF;
    
    RAISE NOTICE 'Super admin profile setup completed successfully!';
END $$;

-- Verify the fix
SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    p.status,
    t.name as tenant_name,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN p.id = au.id THEN 'MATCHED ✓'
        ELSE 'MISMATCH ✗'
    END as id_match_status
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN auth.users au ON au.email = p.email
WHERE p.email = 'tshepangs@zimako.co.za';
