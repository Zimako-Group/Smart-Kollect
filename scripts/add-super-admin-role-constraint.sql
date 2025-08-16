-- =====================================================
-- ADD SUPER_ADMIN ROLE TO PROFILES TABLE CONSTRAINT
-- =====================================================
-- This migration adds 'super_admin' to the allowed roles in the profiles table
-- Run this BEFORE creating the super admin user
-- =====================================================

-- Drop the existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with super_admin included
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'agent', 'manager', 'supervisor', 'indigent clerk', 'system', 'super_admin'));

-- Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname = 'profiles_role_check';

-- Output message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added super_admin role to profiles table constraint';
END $$;
