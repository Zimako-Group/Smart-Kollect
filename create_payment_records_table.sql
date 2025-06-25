-- Create payment_records table to store parsed payment file records
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to payment file
  payment_file_id UUID REFERENCES payment_files(id) ON DELETE CASCADE,
  batch_id UUID, -- For batch processing tracking
  
  -- Account Information
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255),
  account_status VARCHAR(50),
  
  -- Address Information
  postal_address_1 VARCHAR(255),
  postal_address_2 VARCHAR(255),
  postal_address_3 VARCHAR(255),
  street_address VARCHAR(255),
  town VARCHAR(100),
  suburb VARCHAR(100),
  ward VARCHAR(50),
  property_category VARCHAR(50),
  
  -- Financial Information
  outstanding_balance_capital DECIMAL(15,2),
  outstanding_balance_interest DECIMAL(15,2),
  outstanding_balance_other DECIMAL(15,2),
  outstanding_balance_total DECIMAL(15,2),
  agreement_outstanding DECIMAL(15,2),
  housing_outstanding DECIMAL(15,2),
  amount DECIMAL(15,2), -- Payment amount
  
  -- Agreement Information
  agreement_type VARCHAR(50),
  agreement_number VARCHAR(100),
  
  -- Customer Information
  owner_category VARCHAR(50),
  occ_own VARCHAR(10), -- Occupant/Owner status
  
  -- Contact Information
  email_address VARCHAR(255),
  cell_number VARCHAR(20),
  
  -- Special Flags
  indigent BOOLEAN DEFAULT FALSE,
  pensioner BOOLEAN DEFAULT FALSE,
  hand_over BOOLEAN DEFAULT FALSE,
  
  -- Processing Information
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed, skipped
  processing_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_file_id ON payment_records(payment_file_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_batch_id ON payment_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_account_number ON payment_records(account_number);
CREATE INDEX IF NOT EXISTS idx_payment_records_processing_status ON payment_records(processing_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_amount ON payment_records(amount);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_records_file_status ON payment_records(payment_file_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_batch_status ON payment_records(batch_id, processing_status);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_records_updated_at
  BEFORE UPDATE ON payment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_records_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see records from their own payment files
CREATE POLICY "Users can view their own payment records" ON payment_records
  FOR SELECT USING (
    payment_file_id IN (
      SELECT id FROM payment_files WHERE uploaded_by = auth.uid()
    )
  );

-- Policy to allow users to insert records for their own payment files
CREATE POLICY "Users can insert their own payment records" ON payment_records
  FOR INSERT WITH CHECK (
    payment_file_id IN (
      SELECT id FROM payment_files WHERE uploaded_by = auth.uid()
    )
  );

-- Policy to allow users to update records from their own payment files
CREATE POLICY "Users can update their own payment records" ON payment_records
  FOR UPDATE USING (
    payment_file_id IN (
      SELECT id FROM payment_files WHERE uploaded_by = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE payment_records IS 'Stores individual payment records parsed from uploaded payment files';
COMMENT ON COLUMN payment_records.payment_file_id IS 'Reference to the payment file this record came from';
COMMENT ON COLUMN payment_records.batch_id IS 'Batch ID for processing tracking and rollback capabilities';
COMMENT ON COLUMN payment_records.processing_status IS 'Status: pending, processed, failed, skipped';
COMMENT ON COLUMN payment_records.occ_own IS 'Occupant/Owner status (OCC/OWN)';
COMMENT ON COLUMN payment_records.amount IS 'Payment amount from the file';

-- Create a view for easy querying of payment records with file information
CREATE OR REPLACE VIEW payment_records_with_file_info AS
SELECT 
  pr.*,
  pf.file_name,
  pf.upload_date,
  pf.uploaded_by,
  pf.processing_status as file_processing_status
FROM payment_records pr
JOIN payment_files pf ON pr.payment_file_id = pf.id;

COMMENT ON VIEW payment_records_with_file_info IS 'Payment records joined with their source file information';
