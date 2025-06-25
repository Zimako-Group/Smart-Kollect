-- Disable RLS for the PTP table
ALTER TABLE "PTP" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the PTP table
DROP POLICY IF EXISTS "Users can view their own PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can insert PTPs" ON "PTP";
DROP POLICY IF EXISTS "System user can view all PTPs" ON "PTP";
DROP POLICY IF EXISTS "System user can access all PTPs" ON "PTP";
DROP POLICY IF EXISTS "Admins can view all PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can update their own PTPs" ON "PTP";
DROP POLICY IF EXISTS "Users can delete their own PTPs" ON "PTP";
