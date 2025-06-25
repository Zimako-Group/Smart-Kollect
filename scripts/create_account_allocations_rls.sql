-- Function to create RLS policies for AccountAllocations table
CREATE OR REPLACE FUNCTION create_account_allocations_rls_policies()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_count int;
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Agents can view their own allocations" ON "AccountAllocations";
  DROP POLICY IF EXISTS "Admins can view all allocations" ON "AccountAllocations";
  DROP POLICY IF EXISTS "Admins can insert allocations" ON "AccountAllocations";
  DROP POLICY IF EXISTS "Admins can update allocations" ON "AccountAllocations";
  DROP POLICY IF EXISTS "System can perform all operations" ON "AccountAllocations";
  
  -- Enable RLS on AccountAllocations table
  ALTER TABLE "AccountAllocations" ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for agents to view their own allocations
  CREATE POLICY "Agents can view their own allocations"
    ON "AccountAllocations"
    FOR SELECT
    USING (auth.uid() = agent_id);
  
  -- Create policy for admins to view all allocations
  CREATE POLICY "Admins can view all allocations"
    ON "AccountAllocations"
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
      )
    );
  
  -- Create policy for admins to insert allocations
  CREATE POLICY "Admins can insert allocations"
    ON "AccountAllocations"
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
      )
    );
  
  -- Create policy for admins to update allocations
  CREATE POLICY "Admins can update allocations"
    ON "AccountAllocations"
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
      )
    );
  
  -- Create policy for system user to perform all operations
  CREATE POLICY "System can perform all operations"
    ON "AccountAllocations"
    USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Count the number of policies created
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'AccountAllocations';
  
  RETURN 'Successfully created ' || policy_count || ' RLS policies for AccountAllocations table';
END;
$$;

-- Function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql_query;
  result := jsonb_build_object('status', 'success', 'message', 'SQL executed successfully');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('status', 'error', 'message', SQLERRM, 'detail', SQLSTATE);
  RETURN result;
END;
$$;
