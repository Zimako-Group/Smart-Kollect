-- Create agent_allocations table
CREATE TABLE IF NOT EXISTS public.agent_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(account_id)
);

-- Add comment to table
COMMENT ON TABLE public.agent_allocations IS 'Stores account allocations to agents';

-- Add comments to columns
COMMENT ON COLUMN public.agent_allocations.id IS 'Unique identifier for the allocation';
COMMENT ON COLUMN public.agent_allocations.account_id IS 'Reference to the account being allocated';
COMMENT ON COLUMN public.agent_allocations.agent_id IS 'Reference to the agent the account is allocated to';
COMMENT ON COLUMN public.agent_allocations.allocated_at IS 'Timestamp when the allocation was created';
COMMENT ON COLUMN public.agent_allocations.status IS 'Status of the allocation (active, inactive, etc.)';
