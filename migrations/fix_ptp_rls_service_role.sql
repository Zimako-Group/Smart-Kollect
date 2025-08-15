-- Fix PTP RLS policies to allow service role access
-- This migration ensures that the service role can bypass RLS for PTP operations

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role can access all PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can insert PTPs" ON "PTP";
DROP POLICY IF EXISTS "System user can access all PTPs" ON "PTP";

-- Create policy for service role to have full access (bypasses RLS)
CREATE POLICY "Service role can access all PTPs" 
ON "PTP" 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to insert PTPs
CREATE POLICY "Authenticated users can insert PTPs" 
ON "PTP" 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = created_by OR created_by IS NULL)
);

-- Create policy for authenticated users to view PTPs
CREATE POLICY "Authenticated users can view PTPs" 
ON "PTP" 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = created_by OR 
   EXISTS (
     SELECT 1 FROM "profiles"
     WHERE "profiles".id = auth.uid()
     AND "profiles".role IN ('admin', 'manager')
   ))
);

-- Create policy for authenticated users to update their own PTPs
CREATE POLICY "Authenticated users can update their PTPs" 
ON "PTP" 
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create policy for authenticated users to delete their own PTPs
CREATE POLICY "Authenticated users can delete their PTPs" 
ON "PTP" 
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Grant necessary permissions to service_role
GRANT ALL ON "PTP" TO service_role;

-- Ensure the service role can bypass RLS
ALTER TABLE "PTP" FORCE ROW LEVEL SECURITY;
