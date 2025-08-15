-- Fix notes RLS to properly allow service role bypass
-- This ensures the service role can create notes without RLS restrictions

-- First, disable RLS temporarily to clean up policies
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Agents can read all non-private notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Re-enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Grant full access to service_role (this bypasses RLS automatically)
GRANT ALL ON public.notes TO service_role;

-- Create policies for agents to create and manage notes
CREATE POLICY "Agents can create notes" 
ON public.notes 
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('agent', 'admin', 'manager', 'supervisor')
  )
);

-- Policy for reading notes: agents can read all notes except private notes of other agents
CREATE POLICY "Agents can read notes" 
ON public.notes 
FOR SELECT 
TO authenticated
USING (
  is_private = FALSE OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
);

-- Policy for updating notes: users can update their own notes, admins/supervisors/managers can update any note
CREATE POLICY "Users can update their notes" 
ON public.notes 
FOR UPDATE 
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
);

-- Policy for deleting notes: users can delete their own notes, admins/supervisors/managers can delete any note
CREATE POLICY "Users can delete their notes" 
ON public.notes 
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
);

-- Ensure service_role has proper permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
