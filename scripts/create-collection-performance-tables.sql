-- Create Collection Performance and Consolidated Payments tables with tenant isolation

-- Collection Performance table for monthly performance tracking
CREATE TABLE IF NOT EXISTS "collection_performance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "month" INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  "year" INTEGER NOT NULL CHECK (year >= 2020),
  "month_name" TEXT NOT NULL, -- e.g., "Jan", "Feb", etc.
  "collections" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "target" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique month/year per tenant
  UNIQUE(tenant_id, month, year)
);

-- Consolidated Payments table for monthly payment tracking
CREATE TABLE IF NOT EXISTS "consolidated_payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "month" INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  "year" INTEGER NOT NULL CHECK (year >= 2020),
  "month_display" TEXT NOT NULL, -- e.g., "Apr 2025", "May 2025"
  "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique month/year per tenant
  UNIQUE(tenant_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS collection_performance_tenant_idx ON "collection_performance"("tenant_id");
CREATE INDEX IF NOT EXISTS collection_performance_date_idx ON "collection_performance"("year", "month");
CREATE INDEX IF NOT EXISTS consolidated_payments_tenant_idx ON "consolidated_payments"("tenant_id");
CREATE INDEX IF NOT EXISTS consolidated_payments_date_idx ON "consolidated_payments"("year", "month");

-- Enable RLS
ALTER TABLE "collection_performance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consolidated_payments" ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for collection_performance if they exist
DROP POLICY IF EXISTS "Users can view collection performance for their tenant" ON "collection_performance";
DROP POLICY IF EXISTS "Users can insert collection performance for their tenant" ON "collection_performance";
DROP POLICY IF EXISTS "Users can update collection performance for their tenant" ON "collection_performance";

-- RLS Policies for collection_performance
CREATE POLICY "Users can view collection performance for their tenant"
  ON "collection_performance"
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert collection performance for their tenant"
  ON "collection_performance"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update collection performance for their tenant"
  ON "collection_performance"
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

-- Drop existing RLS policies for consolidated_payments if they exist
DROP POLICY IF EXISTS "Users can view consolidated payments for their tenant" ON "consolidated_payments";
DROP POLICY IF EXISTS "Users can insert consolidated payments for their tenant" ON "consolidated_payments";
DROP POLICY IF EXISTS "Users can update consolidated payments for their tenant" ON "consolidated_payments";

-- RLS Policies for consolidated_payments
CREATE POLICY "Users can view consolidated payments for their tenant"
  ON "consolidated_payments"
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert consolidated payments for their tenant"
  ON "consolidated_payments"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update consolidated payments for their tenant"
  ON "consolidated_payments"
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

-- Insert sample data for Mahikeng tenant
INSERT INTO "collection_performance" (tenant_id, month, year, month_name, collections, target)
SELECT 
  t.id as tenant_id,
  month_data.month,
  month_data.year,
  month_data.month_name,
  month_data.collections,
  month_data.target
FROM "tenants" t,
(VALUES 
  (1, 2025, 'Jan', 0, 20000000),
  (2, 2025, 'Feb', 0, 20000000),
  (3, 2025, 'Mar', 0, 20000000),
  (4, 2025, 'Apr', 16633251.62, 20000000),
  (5, 2025, 'May', 29475034, 20000000),
  (6, 2025, 'Jun', 25756766.28, 20000000),
  (7, 2025, 'Jul', 27612881.25, 20000000),
  (8, 2025, 'Aug', 0, 20000000)
) AS month_data(month, year, month_name, collections, target)
WHERE t.subdomain = 'mahikeng'
ON CONFLICT (tenant_id, month, year) DO NOTHING;

-- Insert sample data for consolidated payments for Mahikeng tenant
INSERT INTO "consolidated_payments" (tenant_id, month, year, month_display, amount)
SELECT 
  t.id as tenant_id,
  month_data.month,
  month_data.year,
  month_data.month_display,
  month_data.amount
FROM "tenants" t,
(VALUES 
  (4, 2025, 'Apr 2025', 16633251.62),
  (5, 2025, 'May 2025', 29475034.23),
  (6, 2025, 'Jun 2025', 25756766.28),
  (7, 2025, 'Jul 2025', 27612881.25),
  (8, 2025, 'Aug 2025', 0),
  (9, 2025, 'Sep 2025', 0),
  (10, 2025, 'Oct 2025', 0),
  (11, 2025, 'Nov 2025', 0),
  (12, 2025, 'Dec 2025', 0)
) AS month_data(month, year, month_display, amount)
WHERE t.subdomain = 'mahikeng'
ON CONFLICT (tenant_id, month, year) DO NOTHING;

-- Insert sample data for Triple M tenant (all values set to 0)
INSERT INTO "collection_performance" (tenant_id, month, year, month_name, collections, target)
SELECT 
  t.id as tenant_id,
  month_data.month,
  month_data.year,
  month_data.month_name,
  month_data.collections,
  month_data.target
FROM "tenants" t,
(VALUES 
  (1, 2025, 'Jan', 0, 0),
  (2, 2025, 'Feb', 0, 0),
  (3, 2025, 'Mar', 0, 0),
  (4, 2025, 'Apr', 0, 0),
  (5, 2025, 'May', 0, 0),
  (6, 2025, 'Jun', 0, 0),
  (7, 2025, 'Jul', 0, 0),
  (8, 2025, 'Aug', 0, 0)
) AS month_data(month, year, month_name, collections, target)
WHERE t.subdomain = 'triplem'
ON CONFLICT (tenant_id, month, year) DO NOTHING;

-- Insert sample data for consolidated payments for Triple M tenant (all values set to 0)
INSERT INTO "consolidated_payments" (tenant_id, month, year, month_display, amount)
SELECT 
  t.id as tenant_id,
  month_data.month,
  month_data.year,
  month_data.month_display,
  month_data.amount
FROM "tenants" t,
(VALUES 
  (4, 2025, 'Apr 2025', 0),
  (5, 2025, 'May 2025', 0),
  (6, 2025, 'Jun 2025', 0),
  (7, 2025, 'Jul 2025', 0),
  (8, 2025, 'Aug 2025', 0),
  (9, 2025, 'Sep 2025', 0),
  (10, 2025, 'Oct 2025', 0),
  (11, 2025, 'Nov 2025', 0),
  (12, 2025, 'Dec 2025', 0)
) AS month_data(month, year, month_display, amount)
WHERE t.subdomain = 'triplem'
ON CONFLICT (tenant_id, month, year) DO NOTHING;

-- Add comments
COMMENT ON TABLE "collection_performance" IS 'Monthly collection performance data with tenant isolation';
COMMENT ON TABLE "consolidated_payments" IS 'Monthly consolidated payment data with tenant isolation';
