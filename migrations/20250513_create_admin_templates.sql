-- Create admin_templates table
CREATE TABLE IF NOT EXISTS admin_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT,
  date DATE NOT NULL,
  query_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  escalated_department TEXT,
  agent_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE admin_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all admin templates
CREATE POLICY "Allow authenticated users to view all admin templates"
  ON admin_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own admin templates
CREATE POLICY "Allow authenticated users to insert their own admin templates"
  ON admin_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Allow agents to update their own admin templates
CREATE POLICY "Allow agents to update their own admin templates"
  ON admin_templates
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS admin_templates_agent_id_idx ON admin_templates(agent_id);
CREATE INDEX IF NOT EXISTS admin_templates_status_idx ON admin_templates(status);
CREATE INDEX IF NOT EXISTS admin_templates_query_type_idx ON admin_templates(query_type);
CREATE INDEX IF NOT EXISTS admin_templates_date_idx ON admin_templates(date);
