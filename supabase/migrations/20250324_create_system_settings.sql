-- Create the system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  value JSONB NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an update trigger to set updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_system_settings_updated_at ON system_settings;
CREATE TRIGGER set_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can do everything on system_settings"
  ON system_settings
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read system_settings"
  ON system_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a function to execute SQL (for admin use)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Create function to check if policies exist for a table
CREATE OR REPLACE FUNCTION check_policies_exist(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policies_exist BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = check_policies_exist.table_name
  ) INTO policies_exist;
  
  RETURN policies_exist;
END;
$$;

-- Create function to create the system_settings table
CREATE OR REPLACE FUNCTION create_system_settings_table()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the system_settings table
  CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    value JSONB NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create an update trigger to set updated_at
  CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS set_system_settings_updated_at ON system_settings;
  CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
  
  -- Enable RLS
  ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Create function to create system_settings policies
CREATE OR REPLACE FUNCTION create_system_settings_policies()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create admin policy
  CREATE POLICY "Admins can do everything on system_settings"
    ON system_settings
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  
  -- Create read policy for authenticated users
  CREATE POLICY "Authenticated users can read system_settings"
    ON system_settings
    FOR SELECT
    USING (auth.role() = 'authenticated');
END;
$$;

-- Create function to insert default settings
CREATE OR REPLACE FUNCTION insert_default_settings()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- General settings
  INSERT INTO system_settings (name, description, value, type, category)
  VALUES 
    ('Company Name', 'Your company name as it appears throughout the system', '"Zimako Debt Collection"', 'text', 'general'),
    ('Contact Email', 'Primary contact email for your business', '"support@zimako.com"', 'text', 'general'),
    ('Contact Phone', 'Primary contact phone number for your business', '"(+27) 123-456-7890"', 'text', 'general'),
    ('Business Address', 'Your company''s physical address', '"123 Main Street, Johannesburg, South Africa"', 'textarea', 'general'),
    ('Default Currency', 'Default currency for financial transactions', '"ZAR"', 'select', 'general'),
    ('Business Hours', 'Your company''s operating hours', '"Monday-Friday: 8:00 AM - 5:00 PM"', 'text', 'general'),
    ('Enable Dark Mode', 'Enable dark mode by default for all users', 'true', 'boolean', 'appearance'),
    ('Logo URL', 'URL to your company logo', '"/logo.png"', 'text', 'appearance'),
    ('Primary Color', 'Primary brand color (hex code)', '"#0f172a"', 'text', 'appearance'),
    ('Secondary Color', 'Secondary brand color (hex code)', '"#4f46e5"', 'text', 'appearance'),
    ('Enable Email Notifications', 'Send email notifications for important events', 'true', 'boolean', 'notifications'),
    ('Enable SMS Notifications', 'Send SMS notifications for important events', 'false', 'boolean', 'notifications'),
    ('Admin Email', 'Email address for system notifications', '"admin@zimako.com"', 'text', 'notifications'),
    ('Session Timeout', 'Session timeout in minutes', '30', 'number', 'security'),
    ('Require 2FA', 'Require two-factor authentication for all users', 'false', 'boolean', 'security'),
    ('Password Policy', 'Password requirements for users', '"Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character"', 'textarea', 'security'),
    ('API Key', 'API key for external integrations', '"sk_test_example_key"', 'text', 'integrations'),
    ('Payment Gateway', 'Default payment gateway', '"Stripe"', 'select', 'integrations'),
    ('Billing Cycle', 'Default billing cycle', '"Monthly"', 'select', 'billing'),
    ('Late Fee Percentage', 'Default late fee percentage', '5', 'number', 'billing')
  ON CONFLICT (id) DO NOTHING;
END;
$$;
