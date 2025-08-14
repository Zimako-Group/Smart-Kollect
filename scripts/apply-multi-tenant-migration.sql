-- Smart-Kollect Multi-Tenant Migration Script
-- This script sets up multi-tenant architecture with Triple M as the new tenant

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tenant_id to all relevant tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "Debtors" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "PTP" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "ManualPTP" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "Settlements" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE account_activities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "PaymentHistory" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE active_calls ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE call_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE callbacks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_debtors_tenant_id ON "Debtors"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ptp_tenant_id ON "PTP"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manualptp_tenant_id ON "ManualPTP"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_tenant_id ON "Settlements"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_tenant_id ON account_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_tenant_id ON payment_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant_id ON "PaymentHistory"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_active_calls_tenant_id ON active_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_history_tenant_id ON call_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_callbacks_tenant_id ON callbacks(tenant_id);

-- Insert default tenants
INSERT INTO tenants (name, subdomain, domain) VALUES 
  ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za'),
  ('Triple M Financial Services', 'triplem', 'triplem.smartkollect.co.za')
ON CONFLICT (subdomain) DO NOTHING;

-- Get tenant IDs for migration
DO $$
DECLARE
  mahikeng_tenant_id UUID;
BEGIN
  SELECT id INTO mahikeng_tenant_id FROM tenants WHERE subdomain = 'mahikeng';
  
  -- Update existing data to belong to Mahikeng tenant
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
  UPDATE callbacks SET tenant_id = mahikeng_tenant_id WHERE tenant_id IS NULL;
END $$;

-- Create RLS policies for tenant isolation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debtors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PTP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManualPTP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_subdomain TEXT)
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT id INTO tenant_id FROM tenants WHERE subdomain = tenant_subdomain;
  
  IF tenant_id IS NOT NULL THEN
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
  END IF;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view debtors in their tenant" ON "Debtors";
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON accounts;
DROP POLICY IF EXISTS "Users can manage PTP in their tenant" ON "PTP";
DROP POLICY IF EXISTS "Users can manage ManualPTP in their tenant" ON "ManualPTP";
DROP POLICY IF EXISTS "Users can manage settlements in their tenant" ON "Settlements";
DROP POLICY IF EXISTS "Users can manage account activities in their tenant" ON account_activities;
DROP POLICY IF EXISTS "Users can manage payment records in their tenant" ON payment_records;
DROP POLICY IF EXISTS "Users can view payment history in their tenant" ON "PaymentHistory";
DROP POLICY IF EXISTS "Users can manage active calls in their tenant" ON active_calls;
DROP POLICY IF EXISTS "Users can manage call history in their tenant" ON call_history;
DROP POLICY IF EXISTS "Users can manage notes in their tenant" ON notes;
DROP POLICY IF EXISTS "Users can manage callbacks in their tenant" ON callbacks;

-- Create RLS policies for each table
-- Profiles table
CREATE POLICY "Users can view profiles in their tenant" ON profiles
  FOR SELECT USING (tenant_id = get_current_tenant_id() OR auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Debtors table
CREATE POLICY "Users can view debtors in their tenant" ON "Debtors"
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Accounts table
CREATE POLICY "Users can view accounts in their tenant" ON accounts
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- PTP table
CREATE POLICY "Users can manage PTP in their tenant" ON "PTP"
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ManualPTP table
CREATE POLICY "Users can manage ManualPTP in their tenant" ON "ManualPTP"
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Settlements table
CREATE POLICY "Users can manage settlements in their tenant" ON "Settlements"
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Account activities table
CREATE POLICY "Users can manage account activities in their tenant" ON account_activities
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Payment records table
CREATE POLICY "Users can manage payment records in their tenant" ON payment_records
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Payment history table
CREATE POLICY "Users can view payment history in their tenant" ON "PaymentHistory"
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Active calls table
CREATE POLICY "Users can manage active calls in their tenant" ON active_calls
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Call history table
CREATE POLICY "Users can manage call history in their tenant" ON call_history
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Notes table
CREATE POLICY "Users can manage notes in their tenant" ON notes
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Callbacks table
CREATE POLICY "Users can manage callbacks in their tenant" ON callbacks
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
