-- Create accounts table for storing debtor information
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  cellphone TEXT,
  home_tel TEXT,
  work_tel TEXT,
  fax_no TEXT,
  next_of_kin_name TEXT,
  next_of_kin_no TEXT,
  postal_address TEXT,
  ro_ref TEXT,
  client_ref TEXT,
  easypay_ref TEXT,
  client TEXT,
  handover_date TEXT,
  handover_amount NUMERIC,
  employer TEXT,
  occupation TEXT,
  income NUMERIC,
  current_balance NUMERIC,
  original_amount NUMERIC,
  last_payment TEXT,
  last_payment_amount NUMERIC,
  days_since_last_payment INTEGER,
  status TEXT DEFAULT 'Unallocated',
  agent_id UUID REFERENCES profiles(id),
  batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS accounts_id_number_idx ON accounts(id_number);
CREATE INDEX IF NOT EXISTS accounts_agent_id_idx ON accounts(agent_id);
CREATE INDEX IF NOT EXISTS accounts_batch_id_idx ON accounts(batch_id);
CREATE INDEX IF NOT EXISTS accounts_status_idx ON accounts(status);

-- Create batches table to group accounts by upload
CREATE TABLE IF NOT EXISTS account_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_size INTEGER,
  record_count INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for the accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy for agents to view only their allocated accounts
CREATE POLICY "Agents can view their own accounts"
  ON accounts FOR SELECT
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'supervisor')
    )
  );

-- Policy for admins, managers, and supervisors to update accounts
CREATE POLICY "Admins, managers, and supervisors can update accounts"
  ON accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'supervisor')
    )
  );

-- Policy for admins to delete accounts
CREATE POLICY "Admins can delete accounts"
  ON accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for admins, managers, and supervisors to insert accounts
CREATE POLICY "Admins, managers, and supervisors can insert accounts"
  ON accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'supervisor')
    )
  );

-- Create RLS policies for the account_batches table
ALTER TABLE account_batches ENABLE ROW LEVEL SECURITY;

-- Policy for admins, managers, and supervisors to view all batches
CREATE POLICY "Admins, managers, and supervisors can view all batches"
  ON account_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager' OR role = 'supervisor')
    )
  );

-- Policy for admins to insert, update, and delete batches
CREATE POLICY "Admins can manage batches"
  ON account_batches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column for accounts
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update the updated_at column for account_batches
CREATE TRIGGER update_account_batches_updated_at
BEFORE UPDATE ON account_batches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
