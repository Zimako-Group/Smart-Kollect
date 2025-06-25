-- Completely disable Row Level Security for the notes table
-- WARNING: This removes all security restrictions, only use in development

-- First, drop all existing policies
DROP POLICY IF EXISTS "Agents can read all non-private notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.notes;

-- Then disable RLS completely
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.notes TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'notes';
