-- Create agent_breaks table
CREATE TABLE IF NOT EXISTS agent_breaks (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL CHECK (break_type IN ('lunch', 'tea', 'bathroom', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- Duration in minutes
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index on agent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_breaks_agent_id ON agent_breaks(agent_id);

-- Create index on start_time for date range queries
CREATE INDEX IF NOT EXISTS idx_agent_breaks_start_time ON agent_breaks(start_time);

-- Add RLS policies
ALTER TABLE agent_breaks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY admin_all ON agent_breaks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Agents can view their own breaks
CREATE POLICY agent_select_own ON agent_breaks
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Agents can insert their own breaks
CREATE POLICY agent_insert_own ON agent_breaks
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Agents can update their own breaks
CREATE POLICY agent_update_own ON agent_breaks
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_breaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_agent_breaks_updated_at
BEFORE UPDATE ON agent_breaks
FOR EACH ROW
EXECUTE FUNCTION update_agent_breaks_updated_at();
