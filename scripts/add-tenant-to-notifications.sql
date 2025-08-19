-- Add tenant_id to Notifications table for multi-tenant isolation
-- This migration adds tenant context to notifications

-- Add tenant_id column to Notifications table
ALTER TABLE "Notifications" 
ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Create index for tenant_id for faster lookups
CREATE INDEX IF NOT EXISTS notifications_tenant_id_idx ON "Notifications"("tenant_id");

-- Update existing notifications to assign them to a tenant
-- For now, we'll assign all existing notifications to the first tenant (Mahikeng)
-- In a real scenario, you'd need to determine tenant based on the customer_id or agent_name
UPDATE "Notifications" 
SET "tenant_id" = (
  SELECT id FROM "tenants" WHERE "subdomain" = 'mahikeng' LIMIT 1
)
WHERE "tenant_id" IS NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON "Notifications";
DROP POLICY IF EXISTS "Allow authenticated users to view notifications" ON "Notifications";
DROP POLICY IF EXISTS "Allow authenticated users to update notifications" ON "Notifications";
DROP POLICY IF EXISTS "Allow authenticated users to delete notifications" ON "Notifications";

-- Create new tenant-aware RLS policies
CREATE POLICY "Users can insert notifications for their tenant"
  ON "Notifications"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view notifications for their tenant"
  ON "Notifications"
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update notifications for their tenant"
  ON "Notifications"
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notifications for their tenant"
  ON "Notifications"
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update comment to reflect tenant isolation
COMMENT ON TABLE "Notifications" IS 'Stores system notifications for admins and agents with tenant isolation';
