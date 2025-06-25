-- Create Payments table
CREATE TABLE IF NOT EXISTS "Payments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "debtor_id" UUID NOT NULL REFERENCES "Debtors"("id") ON DELETE CASCADE,
  "amount" NUMERIC NOT NULL,
  "payment_date" DATE NOT NULL,
  "payment_method" TEXT,
  "reference_number" TEXT,
  "description" TEXT,
  "recorded_by" UUID REFERENCES "auth"."users"("id"),
  "batch_id" UUID,
  "account_number" TEXT,
  "account_holder_name" TEXT,
  "erf_number" TEXT,
  "valuation" NUMERIC,
  "vat_reg_number" TEXT,
  "company_cc_number" TEXT,
  "postal_address_1" TEXT,
  "postal_address_2" TEXT,
  "postal_address_3" TEXT,
  "postal_code" TEXT,
  "id_number" TEXT,
  "email_address" TEXT,
  "cell_number" TEXT,
  "account_status" TEXT,
  "occ_own" TEXT,
  "account_type" TEXT,
  "owner_category" TEXT,
  "group_account" TEXT,
  "credit_instruction" TEXT,
  "credit_status" TEXT,
  "mailing_instruction" TEXT,
  "street_address" TEXT,
  "town_suburb" TEXT,
  "ward_property_category" TEXT,
  "gis_key" TEXT,
  "indigent" BOOLEAN DEFAULT FALSE,
  "pensioner" BOOLEAN DEFAULT FALSE,
  "hand_over" BOOLEAN DEFAULT FALSE,
  "outstanding_balance_capital" NUMERIC DEFAULT 0,
  "outstanding_balance_interest" NUMERIC DEFAULT 0,
  "outstanding_total_balance" NUMERIC DEFAULT 0,
  "last_payment_amount" NUMERIC DEFAULT 0,
  "last_payment_date" DATE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "payments_debtor_id_idx" ON "Payments" ("debtor_id");
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "Payments" ("payment_date");
CREATE INDEX IF NOT EXISTS "payments_account_number_idx" ON "Payments" ("account_number");

-- Add RLS policies
ALTER TABLE "Payments" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select payments
CREATE POLICY "Authenticated users can view payments" 
ON "Payments" FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for authenticated users to insert payments
CREATE POLICY "Authenticated users can insert payments" 
ON "Payments" FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy for authenticated users to update their own payments
CREATE POLICY "Authenticated users can update payments they recorded" 
ON "Payments" FOR UPDATE 
TO authenticated 
USING (auth.uid() = "recorded_by");

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON "Payments"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
