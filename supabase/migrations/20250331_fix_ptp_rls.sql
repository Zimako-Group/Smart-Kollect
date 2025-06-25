-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert PTPs" ON "PTP";

-- Create a more permissive insert policy that allows any authenticated user to insert PTPs
CREATE POLICY "Users can insert PTPs" 
ON "PTP" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Update policy for system user to have full access to PTPs (for batch processing)
DROP POLICY IF EXISTS "System user can view all PTPs" ON "PTP";
CREATE POLICY "System user can access all PTPs" 
ON "PTP" 
FOR ALL
USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Add update policy for authenticated users
CREATE POLICY "Users can update their own PTPs" 
ON "PTP" 
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add delete policy for authenticated users
CREATE POLICY "Users can delete their own PTPs" 
ON "PTP" 
FOR DELETE
USING (auth.uid() = created_by);
