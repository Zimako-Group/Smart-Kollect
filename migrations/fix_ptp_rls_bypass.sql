-- Fix PTP RLS to properly allow service role bypass
-- This ensures the service role can create PTPs without RLS restrictions

-- First, disable RLS temporarily to clean up policies
ALTER TABLE "PTP" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can insert PTPs" ON "PTP";
DROP POLICY IF EXISTS "Authenticated users can insert PTPs" ON "PTP";
DROP POLICY IF EXISTS "System user can view all PTPs" ON "PTP";
DROP POLICY IF EXISTS "System user can access all PTPs" ON "PTP";
DROP POLICY IF EXISTS "Admins can view all PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can update their own PTPs" ON "PTP";
DROP POLICY IF EXISTS "Authenticated users can update their PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can delete their own PTPs" ON "PTP";
DROP POLICY IF EXISTS "Authenticated users can delete their PTPs" ON "PTP";
DROP POLICY IF EXISTS "Authenticated users can view PTPs" ON "PTP";
DROP POLICY IF EXISTS "Service role can access all PTPs" ON "PTP";

-- Re-enable RLS
ALTER TABLE "PTP" ENABLE ROW LEVEL SECURITY;

-- Grant full access to service_role (this bypasses RLS automatically)
GRANT ALL ON "PTP" TO service_role;

-- Create policies for agents to create and manage PTPs
CREATE POLICY "Agents can create PTPs" 
ON "PTP" 
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM "profiles"
    WHERE "profiles".id = auth.uid()
    AND "profiles".role IN ('agent', 'admin', 'manager')
  )
);

CREATE POLICY "Users can view their own PTPs" 
ON "PTP" 
FOR SELECT
TO authenticated
USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own PTPs" 
ON "PTP" 
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own PTPs" 
ON "PTP" 
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Create policy for admins and managers to view all PTPs
CREATE POLICY "Admins can view all PTPs" 
ON "PTP" 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "profiles"
    WHERE "profiles".id = auth.uid()
    AND "profiles".role IN ('admin', 'manager')
  )
);

-- Create policy for admins and managers to manage all PTPs
CREATE POLICY "Admins can manage all PTPs" 
ON "PTP" 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "profiles"
    WHERE "profiles".id = auth.uid()
    AND "profiles".role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "profiles"
    WHERE "profiles".id = auth.uid()
    AND "profiles".role IN ('admin', 'manager')
  )
);

-- Ensure service_role has proper permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
