-- Fix ManualPTP RLS policies to allow service role access and agent creation
-- This migration ensures that the service role can bypass RLS for ManualPTP operations
-- and that agents can create manual PTPs

-- First, disable RLS temporarily to clean up policies
ALTER TABLE public."ManualPTP" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Service role can access all ManualPTPs" ON public."ManualPTP";
DROP POLICY IF EXISTS "Users can insert ManualPTPs" ON public."ManualPTP";
DROP POLICY IF EXISTS "Authenticated users can insert ManualPTPs" ON public."ManualPTP";
DROP POLICY IF EXISTS "Users can view their ManualPTPs" ON public."ManualPTP";
DROP POLICY IF EXISTS "Users can update their ManualPTPs" ON public."ManualPTP";
DROP POLICY IF EXISTS "Users can delete their ManualPTPs" ON public."ManualPTP";

-- Re-enable RLS
ALTER TABLE public."ManualPTP" ENABLE ROW LEVEL SECURITY;

-- Grant full access to service_role (this bypasses RLS automatically)
GRANT ALL ON public."ManualPTP" TO service_role;

-- Create policy for service role to have full access (bypasses RLS)
CREATE POLICY "Service role can access all ManualPTPs" 
ON public."ManualPTP" 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to insert ManualPTPs
CREATE POLICY "Authenticated users can insert ManualPTPs" 
ON public."ManualPTP" 
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

-- Policy for reading ManualPTPs: users can read their own, admins/supervisors/managers can read all
CREATE POLICY "Users can view ManualPTPs" 
ON public."ManualPTP" 
FOR SELECT 
TO authenticated
USING (
  created_by = auth.uid() OR
  created_by IS NULL OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
);

-- Policy for updating ManualPTPs: users can update their own, admins/supervisors/managers can update any
CREATE POLICY "Users can update ManualPTPs" 
ON public."ManualPTP" 
FOR UPDATE 
TO authenticated
USING (
  created_by = auth.uid() OR
  created_by IS NULL OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  created_by IS NULL OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND 
    profiles.role IN ('admin', 'supervisor', 'manager')
  )
);

-- Policy for deleting ManualPTPs: users can delete their own, admins/supervisors/managers can delete any
CREATE POLICY "Users can delete ManualPTPs" 
ON public."ManualPTP" 
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  created_by IS NULL OR
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
