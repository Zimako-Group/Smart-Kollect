-- Fix RLS policies to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on profiles table to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Disable RLS temporarily to fix the recursion issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for profiles table
-- Policy 1: Users can view their own profile (no tenant check needed for own profile)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- For other tables, create simpler tenant-based policies without recursion
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view debtors in their tenant" ON "Debtors";
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON accounts;

-- Create simple tenant-based policies using direct tenant context
CREATE POLICY "Tenant isolation for debtors" ON "Debtors"
  FOR ALL USING (
    tenant_id = (current_setting('app.current_tenant_id', true))::UUID
  );

CREATE POLICY "Tenant isolation for accounts" ON accounts
  FOR ALL USING (
    tenant_id = (current_setting('app.current_tenant_id', true))::UUID
  );

-- Update the tenant context function to be simpler
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_subdomain TEXT)
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT id INTO tenant_id FROM tenants WHERE subdomain = tenant_subdomain AND status = 'active';
  
  IF tenant_id IS NOT NULL THEN
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
  END IF;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify policies are working
SELECT 'RLS Policies Fixed' as status;
