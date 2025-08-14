-- Multi-tenant migration for Smart-Kollect
-- This adds tenant isolation to the existing database

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add tenant_id to all existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "Debtors" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "PTP" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "ManualPTP" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE account_activities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "PaymentHistory" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE active_calls ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE call_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE "Callbacks" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Create indexes for tenant_id columns
CREATE INDEX IF NOT EXISTS profiles_tenant_id_idx ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS debtors_tenant_id_idx ON "Debtors"(tenant_id);
CREATE INDEX IF NOT EXISTS accounts_tenant_id_idx ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS ptp_tenant_id_idx ON "PTP"(tenant_id);
CREATE INDEX IF NOT EXISTS manual_ptp_tenant_id_idx ON "ManualPTP"(tenant_id);
CREATE INDEX IF NOT EXISTS settlements_tenant_id_idx ON "Settlements"(tenant_id);

-- 4. Insert default tenants
INSERT INTO tenants (name, subdomain, domain) VALUES 
  ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za'),
  ('Triple M', 'triplem', 'triplem.smartkollect.co.za')
ON CONFLICT (subdomain) DO NOTHING;

-- 5. Update existing data to belong to Mahikeng tenant
DO $$
DECLARE
  mahikeng_tenant_id UUID;
BEGIN
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  IF mahikeng_tenant_id IS NOT NULL THEN
    UPDATE profiles SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "Debtors" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE accounts SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "PTP" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "ManualPTP" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "Settlements" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE account_activities SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE payment_records SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "PaymentHistory" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE active_calls SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE call_history SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE notes SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
    UPDATE "Callbacks" SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- 6. Update RLS policies to include tenant isolation
-- Drop existing policies and recreate with tenant isolation

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view profiles in their tenant" ON profiles
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their tenant" ON profiles
  FOR ALL USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Debtors table policies
DROP POLICY IF EXISTS "Users can view debtors" ON "Debtors";
DROP POLICY IF EXISTS "Users can update debtors" ON "Debtors";

CREATE POLICY "Users can view debtors in their tenant" ON "Debtors"
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage debtors in their tenant" ON "Debtors"
  FOR ALL USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- PTP table policies
DROP POLICY IF EXISTS "Users can view PTPs" ON "PTP";
DROP POLICY IF EXISTS "Admins can view all PTPs" ON "PTP";

CREATE POLICY "Users can view PTPs in their tenant" ON "PTP"
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage PTPs in their tenant" ON "PTP"
  FOR ALL USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT USING (
    id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- 7. Create function to get current user's tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_subdomain TEXT)
RETURNS UUID AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid 
  FROM tenants 
  WHERE subdomain = tenant_subdomain AND status = 'active';
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive tenant: %', tenant_subdomain;
  END IF;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
