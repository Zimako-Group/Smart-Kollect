-- Create Settlements table
CREATE TABLE IF NOT EXISTS "Settlements" (
  "id" UUID PRIMARY KEY,
  "customer_id" UUID REFERENCES "Debtors"("id") ON DELETE CASCADE,
  "customer_name" TEXT NOT NULL,
  "account_number" TEXT NOT NULL,
  "original_amount" NUMERIC NOT NULL,
  "settlement_amount" NUMERIC NOT NULL,
  "discount_percentage" INTEGER NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "expiry_date" DATE NOT NULL,
  "agent_name" TEXT NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS settlements_customer_id_idx ON "Settlements"("customer_id");
CREATE INDEX IF NOT EXISTS settlements_status_idx ON "Settlements"("status");

-- Add RLS policies
ALTER TABLE "Settlements" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all settlements
DROP POLICY IF EXISTS "Allow authenticated users to view all settlements" ON "Settlements";
CREATE POLICY "Allow authenticated users to view all settlements"
  ON "Settlements"
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to insert settlements
DROP POLICY IF EXISTS "Allow authenticated users to insert settlements" ON "Settlements";
CREATE POLICY "Allow authenticated users to insert settlements"
  ON "Settlements"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to update their own settlements
DROP POLICY IF EXISTS "Allow authenticated users to update settlements" ON "Settlements";
CREATE POLICY "Allow authenticated users to update settlements"
  ON "Settlements"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy to allow authenticated users to delete settlements
DROP POLICY IF EXISTS "Allow authenticated users to delete settlements" ON "Settlements";
CREATE POLICY "Allow authenticated users to delete settlements"
  ON "Settlements"
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "Settlements" TO authenticated;
