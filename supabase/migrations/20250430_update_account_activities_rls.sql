-- Completely disable RLS for the account_activities table for now
-- This will allow all operations without restrictions

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.account_activities;
DROP POLICY IF EXISTS "Users can view account activities they have access to" ON public.account_activities;
DROP POLICY IF EXISTS "Users can insert activities" ON public.account_activities;
DROP POLICY IF EXISTS "Users can update activities" ON public.account_activities;
DROP POLICY IF EXISTS "Users can delete activities" ON public.account_activities;

-- Then disable RLS completely
ALTER TABLE public.account_activities DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary measure to get things working
-- We can re-enable and refine RLS policies later once the basic functionality is working
