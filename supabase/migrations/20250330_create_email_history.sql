-- Create EmailHistory table
CREATE TABLE IF NOT EXISTS "EmailHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recipient_email" TEXT NOT NULL,
  "recipient_name" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "sender_id" UUID NOT NULL REFERENCES auth.users(id),
  "account_number" TEXT, -- Using acc_number format to match Debtors table
  "cc_emails" TEXT[] DEFAULT '{}',
  "attachment_count" INTEGER DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on account_number for faster lookups
CREATE INDEX IF NOT EXISTS "idx_email_history_account_number" ON "EmailHistory" ("account_number");

-- Add index on recipient_email for faster lookups
CREATE INDEX IF NOT EXISTS "idx_email_history_recipient_email" ON "EmailHistory" ("recipient_email");

-- Add index on sender_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_email_history_sender_id" ON "EmailHistory" ("sender_id");

-- Add RLS policies
ALTER TABLE "EmailHistory" ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view emails they sent
CREATE POLICY "Users can view their own emails" 
ON "EmailHistory" 
FOR SELECT 
USING (auth.uid() = sender_id);

-- Policy for authenticated users to insert emails
CREATE POLICY "Users can insert emails" 
ON "EmailHistory" 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id OR sender_id = '00000000-0000-0000-0000-000000000000');

-- Policy for system user to view all emails (for batch processing)
CREATE POLICY "System user can view all emails" 
ON "EmailHistory" 
FOR SELECT 
USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Policy for admins to view all emails
CREATE POLICY "Admins can view all emails" 
ON "EmailHistory" 
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
CREATE TRIGGER update_email_history_updated_at
BEFORE UPDATE ON "EmailHistory"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
