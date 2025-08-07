-- =====================================================
-- Payment History Table Migration Script
-- For Smart-Kollect Debt Collection System
-- =====================================================
-- This script creates tables to track weekly payment file uploads
-- and maintain historical payment data linked to debtor profiles
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS "PaymentHistory" CASCADE;
DROP TABLE IF EXISTS "PaymentFileUploads" CASCADE;

-- =====================================================
-- 1. Payment File Uploads Table
-- =====================================================
-- Tracks each weekly payment file upload
CREATE TABLE "PaymentFileUploads" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- File Information
  "file_name" TEXT NOT NULL,
  "file_size" BIGINT,
  "upload_date" DATE NOT NULL DEFAULT CURRENT_DATE,
  "uploaded_by" UUID REFERENCES "auth"."users"("id"),
  
  -- Processing Status
  "status" TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  "total_records" INTEGER DEFAULT 0,
  "processed_records" INTEGER DEFAULT 0,
  "failed_records" INTEGER DEFAULT 0,
  "error_log" TEXT,
  
  -- Processing Timestamps
  "processing_started_at" TIMESTAMP WITH TIME ZONE,
  "processing_completed_at" TIMESTAMP WITH TIME ZONE,
  
  -- Weekly Upload Tracking
  "upload_week" DATE NOT NULL, -- Start of the week (Monday)
  "upload_year" INTEGER NOT NULL,
  "upload_week_number" INTEGER NOT NULL,
  
  UNIQUE("upload_week") -- Ensure only one upload per week
);

-- =====================================================
-- 2. Payment History Table
-- =====================================================
-- Stores individual payment records from weekly uploads
CREATE TABLE "PaymentHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Link to debtor and upload batch
  "debtor_id" UUID REFERENCES "Debtors"("id") ON DELETE CASCADE,
  "upload_batch_id" UUID REFERENCES "PaymentFileUploads"("id") ON DELETE CASCADE,
  
  -- Payment File Data (matching your file structure)
  "account_no" TEXT NOT NULL,
  "account_holder_name" TEXT,
  "account_status" TEXT,
  "occ_own" TEXT, -- OCC/OWN column
  "indigent" TEXT,
  "outstanding_total_balance" NUMERIC(15, 2),
  "last_payment_amount" NUMERIC(15, 2),
  "last_payment_date" DATE, -- Properly formatted date from YYYYMMDD
  
  -- Original raw data for reference
  "raw_last_payment_date" TEXT, -- Original YYYYMMDD format
  
  -- Processing metadata
  "processed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "data_week" DATE NOT NULL, -- Week this data represents
  
  -- Ensure unique record per debtor per upload batch
  UNIQUE("debtor_id", "upload_batch_id")
);

-- =====================================================
-- 3. Indexes for Performance
-- =====================================================

-- PaymentFileUploads indexes
CREATE INDEX "payment_file_uploads_upload_date_idx" ON "PaymentFileUploads" ("upload_date");
CREATE INDEX "payment_file_uploads_status_idx" ON "PaymentFileUploads" ("status");
CREATE INDEX "payment_file_uploads_upload_week_idx" ON "PaymentFileUploads" ("upload_week");
CREATE INDEX "payment_file_uploads_uploaded_by_idx" ON "PaymentFileUploads" ("uploaded_by");

-- PaymentHistory indexes
CREATE INDEX "payment_history_debtor_id_idx" ON "PaymentHistory" ("debtor_id");
CREATE INDEX "payment_history_account_no_idx" ON "PaymentHistory" ("account_no");
CREATE INDEX "payment_history_last_payment_date_idx" ON "PaymentHistory" ("last_payment_date");
CREATE INDEX "payment_history_upload_batch_id_idx" ON "PaymentHistory" ("upload_batch_id");
CREATE INDEX "payment_history_data_week_idx" ON "PaymentHistory" ("data_week");
CREATE INDEX "payment_history_processed_at_idx" ON "PaymentHistory" ("processed_at");

-- Composite indexes for common queries
CREATE INDEX "payment_history_debtor_date_idx" ON "PaymentHistory" ("debtor_id", "last_payment_date" DESC);
CREATE INDEX "payment_history_debtor_week_idx" ON "PaymentHistory" ("debtor_id", "data_week" DESC);

-- =====================================================
-- 4. Helper Functions
-- =====================================================

-- Function to convert YYYYMMDD string to proper DATE
CREATE OR REPLACE FUNCTION convert_payment_date(date_string TEXT)
RETURNS DATE AS $$
BEGIN
  -- Handle null or empty strings
  IF date_string IS NULL OR date_string = '' OR date_string = 'N/A' THEN
    RETURN NULL;
  END IF;
  
  -- Ensure the string is exactly 8 characters (YYYYMMDD)
  IF LENGTH(date_string) != 8 THEN
    RETURN NULL;
  END IF;
  
  -- Convert YYYYMMDD to DATE
  RETURN TO_DATE(date_string, 'YYYYMMDD');
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if conversion fails
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get the start of the week (Monday) for a given date
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN input_date - (EXTRACT(DOW FROM input_date) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to safely convert text to numeric
CREATE OR REPLACE FUNCTION safe_numeric_conversion(value TEXT)
RETURNS NUMERIC AS $$
BEGIN
  -- Handle null or empty strings
  IF value IS NULL OR value = '' OR value = 'N/A' THEN
    RETURN 0;
  END IF;
  
  -- Remove any currency symbols and spaces
  value := REPLACE(REPLACE(REPLACE(value, 'R', ''), ' ', ''), ',', '');
  
  -- Convert to numeric
  RETURN value::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    -- Return 0 if conversion fails
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Triggers for Automatic Updates
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to both tables
CREATE TRIGGER update_payment_file_uploads_updated_at
  BEFORE UPDATE ON "PaymentFileUploads"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON "PaymentHistory"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Row Level Security (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE "PaymentFileUploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentHistory" ENABLE ROW LEVEL SECURITY;

-- Policies for PaymentFileUploads
CREATE POLICY "Authenticated users can view payment file uploads"
ON "PaymentFileUploads" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment file uploads"
ON "PaymentFileUploads" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own payment file uploads"
ON "PaymentFileUploads" FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

-- Policies for PaymentHistory
CREATE POLICY "Authenticated users can view payment history"
ON "PaymentHistory" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment history"
ON "PaymentHistory" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment history"
ON "PaymentHistory" FOR UPDATE
TO authenticated
USING (true);

-- =====================================================
-- 7. Useful Views for Common Queries
-- =====================================================

-- View to get latest payment information for each debtor
CREATE OR REPLACE VIEW "LatestPaymentHistory" AS
SELECT DISTINCT ON (ph.debtor_id)
  ph.debtor_id,
  ph.account_no,
  ph.account_holder_name,
  ph.account_status,
  ph.occ_own,
  ph.indigent,
  ph.outstanding_total_balance,
  ph.last_payment_amount,
  ph.last_payment_date,
  ph.data_week,
  ph.processed_at,
  pfu.upload_date,
  pfu.file_name
FROM "PaymentHistory" ph
JOIN "PaymentFileUploads" pfu ON ph.upload_batch_id = pfu.id
WHERE pfu.status = 'completed'
ORDER BY ph.debtor_id, ph.data_week DESC, ph.processed_at DESC;

-- View to get payment history with debtor information
CREATE OR REPLACE VIEW "PaymentHistoryWithDebtor" AS
SELECT 
  ph.*,
  d.name as debtor_name,
  d.surname_company_trust,
  d.cellphone_1,
  d.email_addr_1,
  pfu.upload_date,
  pfu.file_name,
  pfu.upload_week
FROM "PaymentHistory" ph
JOIN "Debtors" d ON ph.debtor_id = d.id
JOIN "PaymentFileUploads" pfu ON ph.upload_batch_id = pfu.id
ORDER BY ph.last_payment_date DESC, ph.processed_at DESC;

-- View for weekly upload summary
CREATE OR REPLACE VIEW "WeeklyUploadSummary" AS
SELECT 
  pfu.upload_week,
  pfu.upload_date,
  pfu.file_name,
  pfu.status,
  pfu.total_records,
  pfu.processed_records,
  pfu.failed_records,
  COUNT(ph.id) as payment_records_created,
  SUM(ph.last_payment_amount) as total_payment_amount,
  AVG(ph.outstanding_total_balance) as avg_outstanding_balance
FROM "PaymentFileUploads" pfu
LEFT JOIN "PaymentHistory" ph ON pfu.id = ph.upload_batch_id
GROUP BY pfu.id, pfu.upload_week, pfu.upload_date, pfu.file_name, pfu.status, 
         pfu.total_records, pfu.processed_records, pfu.failed_records
ORDER BY pfu.upload_week DESC;

-- =====================================================
-- 8. Sample Data Insertion Function
-- =====================================================

-- Function to process and insert payment file data
CREATE OR REPLACE FUNCTION process_payment_file_record(
  p_upload_batch_id UUID,
  p_account_no TEXT,
  p_account_holder_name TEXT,
  p_account_status TEXT,
  p_occ_own TEXT,
  p_indigent TEXT,
  p_outstanding_total_balance TEXT,
  p_last_payment_amount TEXT,
  p_last_payment_date TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_debtor_id UUID;
  v_formatted_date DATE;
  v_outstanding_balance NUMERIC;
  v_payment_amount NUMERIC;
  v_data_week DATE;
BEGIN
  -- Find debtor by account number
  SELECT id INTO v_debtor_id 
  FROM "Debtors" 
  WHERE acc_number = p_account_no 
  LIMIT 1;
  
  -- Skip if debtor not found
  IF v_debtor_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Convert and format data
  v_formatted_date := convert_payment_date(p_last_payment_date);
  v_outstanding_balance := safe_numeric_conversion(p_outstanding_total_balance);
  v_payment_amount := safe_numeric_conversion(p_last_payment_amount);
  v_data_week := get_week_start(CURRENT_DATE);
  
  -- Insert payment history record
  -- Store original date format in both last_payment_date and raw_last_payment_date
  INSERT INTO "PaymentHistory" (
    debtor_id,
    upload_batch_id,
    account_no,
    account_holder_name,
    account_status,
    occ_own,
    indigent,
    outstanding_total_balance,
    last_payment_amount,
    last_payment_date,
    raw_last_payment_date,
    data_week
  ) VALUES (
    v_debtor_id,
    p_upload_batch_id,
    p_account_no,
    p_account_holder_name,
    p_account_status,
    p_occ_own,
    p_indigent,
    v_outstanding_balance,
    v_payment_amount,
    p_last_payment_date, -- Store original format instead of converted date
    p_last_payment_date, -- Store original format
    v_data_week
  )
  ON CONFLICT (debtor_id, upload_batch_id) 
  DO UPDATE SET
    account_holder_name = EXCLUDED.account_holder_name,
    account_status = EXCLUDED.account_status,
    occ_own = EXCLUDED.occ_own,
    indigent = EXCLUDED.indigent,
    outstanding_total_balance = EXCLUDED.outstanding_total_balance,
    last_payment_amount = EXCLUDED.last_payment_amount,
    last_payment_date = EXCLUDED.last_payment_date, -- Both fields now store original format
    raw_last_payment_date = EXCLUDED.raw_last_payment_date,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Comments for Documentation
-- =====================================================

COMMENT ON TABLE "PaymentFileUploads" IS 'Tracks weekly payment file uploads with processing status and metadata';
COMMENT ON TABLE "PaymentHistory" IS 'Stores historical payment data from weekly file uploads, linked to debtor profiles';

COMMENT ON COLUMN "PaymentFileUploads"."upload_week" IS 'Start of the week (Monday) when file was uploaded';
COMMENT ON COLUMN "PaymentFileUploads"."status" IS 'Processing status: processing, completed, or failed';

COMMENT ON COLUMN "PaymentHistory"."last_payment_date" IS 'Properly formatted date converted from YYYYMMDD format';
COMMENT ON COLUMN "PaymentHistory"."raw_last_payment_date" IS 'Original YYYYMMDD format from file for reference';
COMMENT ON COLUMN "PaymentHistory"."data_week" IS 'Week this payment data represents';

COMMENT ON FUNCTION convert_payment_date(TEXT) IS 'Converts YYYYMMDD string format to proper DATE type';
COMMENT ON FUNCTION process_payment_file_record IS 'Processes and inserts a single payment record from file upload';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON "PaymentFileUploads" TO authenticated;
GRANT ALL ON "PaymentHistory" TO authenticated;
GRANT EXECUTE ON FUNCTION convert_payment_date(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_file_record TO authenticated;
GRANT SELECT ON "LatestPaymentHistory" TO authenticated;
GRANT SELECT ON "PaymentHistoryWithDebtor" TO authenticated;
GRANT SELECT ON "WeeklyUploadSummary" TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payment History tables created successfully!';
  RAISE NOTICE 'Tables created: PaymentFileUploads, PaymentHistory';
  RAISE NOTICE 'Views created: LatestPaymentHistory, PaymentHistoryWithDebtor, WeeklyUploadSummary';
  RAISE NOTICE 'Helper functions created for date conversion and data processing';
END $$;
