-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create SMS History table
CREATE TABLE IF NOT EXISTS sms_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT,
  acc_number TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on acc_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_history_acc_number ON sms_history(acc_number);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_sms_history_status ON sms_history(status);

-- Enable Row Level Security
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;

-- Create a stored procedure to check if a policy exists and create it if it doesn't
DO $$
BEGIN
    -- Check if the policy for public SELECT access exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sms_history' AND policyname = 'sms_history_select_policy'
    ) THEN
        -- Create policy for public SELECT access
        CREATE POLICY sms_history_select_policy ON sms_history 
            FOR SELECT USING (true);
    END IF;

    -- Check if the policy for public INSERT access exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sms_history' AND policyname = 'sms_history_insert_policy'
    ) THEN
        -- Create policy for public INSERT access
        CREATE POLICY sms_history_insert_policy ON sms_history 
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Check if the policy for public UPDATE access exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sms_history' AND policyname = 'sms_history_update_policy'
    ) THEN
        -- Create policy for public UPDATE access
        CREATE POLICY sms_history_update_policy ON sms_history 
            FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Create a function to check service status (for connection testing)
CREATE OR REPLACE FUNCTION get_service_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'status', 'ok',
    'timestamp', now()
  );
END;
$$;
