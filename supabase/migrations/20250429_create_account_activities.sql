-- Create account_activities table
CREATE TABLE IF NOT EXISTS public.account_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_subtype TEXT,
  description TEXT,
  amount DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id ON public.account_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_created_at ON public.account_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_account_activities_activity_type ON public.account_activities(activity_type);

-- Add RLS policies
ALTER TABLE public.account_activities ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own activities or activities for accounts they have access to
CREATE POLICY "Users can view account activities they have access to" 
  ON public.account_activities 
  FOR SELECT 
  USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM public.agent_allocations 
      WHERE agent_allocations.account_id = account_activities.account_id 
      AND agent_allocations.agent_id = auth.uid()
      AND agent_allocations.status = 'active'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supervisor')
    )
  );

-- Policy to allow users to insert their own activities
CREATE POLICY "Users can insert their own activities" 
  ON public.account_activities 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Add comment to table
COMMENT ON TABLE public.account_activities IS 'Stores all account activities like payments, communications, notes, status changes';

-- Add comments to columns
COMMENT ON COLUMN public.account_activities.id IS 'Unique identifier for the activity';
COMMENT ON COLUMN public.account_activities.account_id IS 'Reference to the account this activity belongs to';
COMMENT ON COLUMN public.account_activities.activity_type IS 'Type of activity (payment, communication, note, status_change)';
COMMENT ON COLUMN public.account_activities.activity_subtype IS 'Subtype of activity (e.g. sms, email, call for communication)';
COMMENT ON COLUMN public.account_activities.description IS 'Description of the activity';
COMMENT ON COLUMN public.account_activities.amount IS 'Amount for payment activities';
COMMENT ON COLUMN public.account_activities.created_at IS 'Timestamp when the activity was created';
COMMENT ON COLUMN public.account_activities.created_by IS 'User who created the activity';
COMMENT ON COLUMN public.account_activities.metadata IS 'Additional metadata for the activity in JSON format';
