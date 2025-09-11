-- Create agents table for intelligent agent system
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('settlement', 'ptp', 'payment', 'allocation', 'performance', 'cleanup', 'reporting')),
  status TEXT NOT NULL DEFAULT 'sleeping' CHECK (status IN ('idle', 'running', 'sleeping', 'error')),
  lastRun TIMESTAMPTZ,
  nextRun TIMESTAMPTZ,
  schedule TEXT NOT NULL, -- cron expression
  lastResult TEXT,
  error TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to table and columns
COMMENT ON TABLE public.agents IS 'Intelligent agents that replace traditional CRON jobs';
COMMENT ON COLUMN public.agents.id IS 'Unique identifier for the agent';
COMMENT ON COLUMN public.agents.name IS 'Human-readable name of the agent';
COMMENT ON COLUMN public.agents.type IS 'Type of agent determining its function';
COMMENT ON COLUMN public.agents.status IS 'Current status of the agent';
COMMENT ON COLUMN public.agents.lastRun IS 'Timestamp of last execution';
COMMENT ON COLUMN public.agents.nextRun IS 'Timestamp of next scheduled execution';
COMMENT ON COLUMN public.agents.schedule IS 'Cron expression for scheduling';
COMMENT ON COLUMN public.agents.lastResult IS 'Result of last execution';
COMMENT ON COLUMN public.agents.error IS 'Error message if last execution failed';
COMMENT ON COLUMN public.agents.metrics IS 'Performance metrics for the agent';
COMMENT ON COLUMN public.agents.created_at IS 'Timestamp of when the agent was created';
COMMENT ON COLUMN public.agents.updated_at IS 'Timestamp of when the agent was last updated';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_type ON public.agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_next_run ON public.agents(nextRun);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all agents" ON public.agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert agents" ON public.agents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update agents" ON public.agents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();