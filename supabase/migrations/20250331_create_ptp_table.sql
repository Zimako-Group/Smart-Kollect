-- Create Promise To Pay (PTP) table
CREATE TABLE IF NOT EXISTS "PTP" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "debtor_id" UUID NOT NULL REFERENCES "Debtors"(id),
  "amount" DECIMAL(10, 2) NOT NULL,
  "date" DATE NOT NULL,
  "payment_method" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_by" UUID NOT NULL REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_ptp_debtor_id" ON "PTP" ("debtor_id");
CREATE INDEX IF NOT EXISTS "idx_ptp_created_by" ON "PTP" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_ptp_status" ON "PTP" ("status");
CREATE INDEX IF NOT EXISTS "idx_ptp_date" ON "PTP" ("date");

-- Add RLS policies
ALTER TABLE "PTP" ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own PTPs
CREATE POLICY "Users can view their own PTPs" 
ON "PTP" 
FOR SELECT 
USING (auth.uid() = created_by);

-- Policy for authenticated users to insert PTPs
CREATE POLICY "Users can insert PTPs" 
ON "PTP" 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR created_by = '00000000-0000-0000-0000-000000000000');

-- Policy for system user to view all PTPs (for batch processing)
CREATE POLICY "System user can view all PTPs" 
ON "PTP" 
FOR SELECT 
USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Policy for admins to view all PTPs
CREATE POLICY "Admins can view all PTPs" 
ON "PTP" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "profiles"
    WHERE "profiles".id = auth.uid()
    AND "profiles".role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on record update
CREATE TRIGGER update_ptp_updated_at
BEFORE UPDATE ON "PTP"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
