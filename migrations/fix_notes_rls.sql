-- Option 1: Disable RLS on the notes table completely (for testing)
-- WARNING: This removes all security restrictions, only use in development
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a more permissive policy for all authenticated users
-- This is safer than disabling RLS completely
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Agents can read all non-private notes" ON public.notes;

-- Create a policy that allows all authenticated users to perform all operations
CREATE POLICY "Allow all operations for authenticated users" 
ON public.notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 3: Grant the service role bypass RLS privileges
-- This allows the service role to bypass RLS while keeping it active for other users
ALTER TABLE public.notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Grant the service role permission to bypass RLS
-- Note: You'll need to run this as a superuser or database owner
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.notes TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Instructions:
-- 1. Run Option 1 for a quick fix during development (least secure)
-- 2. Run Option 2 for a more controlled approach that still maintains some security
-- 3. Run Option 3 if you want to keep RLS active but ensure the service role can bypass it
--    (this is the recommended approach for production)
