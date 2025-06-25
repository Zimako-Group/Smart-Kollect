-- Create payment_files table to track file uploads and metadata
CREATE TABLE IF NOT EXISTS payment_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  upload_week INTEGER NOT NULL,
  upload_year INTEGER NOT NULL,
  upload_month INTEGER NOT NULL,
  upload_day INTEGER NOT NULL,
  records_count INTEGER DEFAULT 0,
  valid_records_count INTEGER DEFAULT 0,
  invalid_records_count INTEGER DEFAULT 0,
  processing_status VARCHAR(50) DEFAULT 'pending',
  batch_id UUID,
  uploaded_by UUID REFERENCES auth.users(id),
  file_hash VARCHAR(64), -- SHA-256 hash to prevent duplicate uploads
  errors_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  processing_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}', -- Additional metadata like column mappings, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_files_upload_date ON payment_files(upload_date);
CREATE INDEX IF NOT EXISTS idx_payment_files_upload_week_year ON payment_files(upload_week, upload_year);
CREATE INDEX IF NOT EXISTS idx_payment_files_processing_status ON payment_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_payment_files_batch_id ON payment_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_files_uploaded_by ON payment_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_payment_files_file_hash ON payment_files(file_hash);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_files_updated_at
  BEFORE UPDATE ON payment_files
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_files_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE payment_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own uploads
CREATE POLICY "Users can view their own payment files" ON payment_files
  FOR SELECT USING (uploaded_by = auth.uid());

-- Policy to allow users to insert their own uploads
CREATE POLICY "Users can insert their own payment files" ON payment_files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update their own payment files" ON payment_files
  FOR UPDATE USING (uploaded_by = auth.uid());

-- Policy for admin users (if you have an admin role)
-- CREATE POLICY "Admins can view all payment files" ON payment_files
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add comments for documentation
COMMENT ON TABLE payment_files IS 'Tracks payment file uploads with metadata and processing status';
COMMENT ON COLUMN payment_files.file_hash IS 'SHA-256 hash of file content to prevent duplicate uploads';
COMMENT ON COLUMN payment_files.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN payment_files.metadata IS 'Additional metadata like column mappings, validation results, etc.';
