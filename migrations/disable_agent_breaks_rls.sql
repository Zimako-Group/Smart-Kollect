-- Disable RLS for agent_breaks table
ALTER TABLE agent_breaks DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_all ON agent_breaks;
DROP POLICY IF EXISTS agent_select_own ON agent_breaks;
DROP POLICY IF EXISTS agent_insert_own ON agent_breaks;
DROP POLICY IF EXISTS agent_update_own ON agent_breaks;

-- Comment explaining the change
COMMENT ON TABLE agent_breaks IS 'Table for tracking agent breaks. RLS disabled for easier access.';
