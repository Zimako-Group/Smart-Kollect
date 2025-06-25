-- Script to disable Row Level Security (RLS) on the flags table for development
-- This is a temporary solution to avoid RLS policy issues during development
-- For production, you should enable RLS with proper policies

-- Disable RLS on the flags table
ALTER TABLE public.flags DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.flags TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Note: For production, you should enable RLS and create proper policies:
-- Example:
-- ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view flags for accounts they have access to" 
--    ON public.flags FOR SELECT 
--    USING (auth.uid() IN (
--      SELECT user_id FROM user_accounts WHERE account_id = customer_id
--    ));
