-- Disable Row Level Security for admin_templates table
ALTER TABLE admin_templates DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view all admin templates" ON admin_templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own admin templates" ON admin_templates;
DROP POLICY IF EXISTS "Allow agents to update their own admin templates" ON admin_templates;

-- Confirm changes
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_templates';
