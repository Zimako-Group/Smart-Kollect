-- Create PaymentBatches table to store information about uploaded payment files
CREATE TABLE IF NOT EXISTS "PaymentBatches" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL CHECK ("status" IN ('processing', 'completed', 'failed')),
  "total_records" INTEGER NOT NULL DEFAULT 0,
  "successful_records" INTEGER NOT NULL DEFAULT 0,
  "failed_records" INTEGER NOT NULL DEFAULT 0,
  "created_by" UUID NOT NULL REFERENCES "auth"."users" ("id"),
  "file_name" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL
);

-- Add account_number field to Payments table if it doesn't exist
ALTER TABLE "Payments" 
ADD COLUMN IF NOT EXISTS "account_number" TEXT,
ADD COLUMN IF NOT EXISTS "batch_id" UUID REFERENCES "PaymentBatches" ("id");

-- Create index on acc_number in Debtors table for faster lookups
CREATE INDEX IF NOT EXISTS "debtors_acc_number_idx" ON "Debtors" ("acc_number");

-- Create index on batch_id in Payments table for faster lookups
CREATE INDEX IF NOT EXISTS "payments_batch_id_idx" ON "Payments" ("batch_id");

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS "PaymentBatches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Payments" ENABLE ROW LEVEL SECURITY;

-- Update policies for PaymentBatches table
DO $$
BEGIN
  -- Drop and recreate the insert policy for PaymentBatches
  DROP POLICY IF EXISTS "Users can insert their own payment batches" ON "PaymentBatches";
  CREATE POLICY "Users can insert their own payment batches"
  ON "PaymentBatches"
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by = '00000000-0000-0000-0000-000000000000');
  
  -- Drop and recreate the update policy for PaymentBatches
  DROP POLICY IF EXISTS "Users can update their own payment batches" ON "PaymentBatches";
  CREATE POLICY "Users can update their own payment batches"
  ON "PaymentBatches"
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR created_by = '00000000-0000-0000-0000-000000000000');
  
  -- Drop and recreate the delete policy for PaymentBatches
  DROP POLICY IF EXISTS "Users can delete their own payment batches" ON "PaymentBatches";
  CREATE POLICY "Users can delete their own payment batches"
  ON "PaymentBatches"
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR created_by = '00000000-0000-0000-0000-000000000000');
END
$$;

-- Update policies for Payments table
DO $$
BEGIN
  -- Drop and recreate the insert policy for Payments
  DROP POLICY IF EXISTS "Users can insert payments" ON "Payments";
  CREATE POLICY "Users can insert payments"
  ON "Payments"
  FOR INSERT
  TO authenticated
  WITH CHECK (recorded_by = auth.uid() OR recorded_by = '00000000-0000-0000-0000-000000000000');
  
  -- Drop and recreate the update policy for Payments
  DROP POLICY IF EXISTS "Users can update payments" ON "Payments";
  CREATE POLICY "Users can update payments"
  ON "Payments"
  FOR UPDATE
  TO authenticated
  USING (recorded_by = auth.uid() OR recorded_by = '00000000-0000-0000-0000-000000000000');
  
  -- Drop and recreate the delete policy for Payments
  DROP POLICY IF EXISTS "Users can delete payments" ON "Payments";
  CREATE POLICY "Users can delete payments"
  ON "Payments"
  FOR DELETE
  TO authenticated
  USING (recorded_by = auth.uid() OR recorded_by = '00000000-0000-0000-0000-000000000000');
END
$$;
