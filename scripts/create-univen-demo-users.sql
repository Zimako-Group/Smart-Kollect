-- Create and Assign Demo Users to University of Venda Tenant
-- This script creates demo users and assigns them to the University of Venda tenant

-- First, ensure the University of Venda tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- Function to create or update a demo user
CREATE OR REPLACE FUNCTION create_univen_demo_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT 'University of Venda Demo User'
) RETURNS VOID AS $$
DECLARE
  univen_tenant_id UUID;
BEGIN
  -- Get University of Venda tenant ID
  SELECT id INTO univen_tenant_id FROM tenants WHERE subdomain = 'univen';
  
  IF univen_tenant_id IS NULL THEN
    RAISE EXCEPTION 'University of Venda tenant not found';
  END IF;
  
  -- Create or update the user profile
  INSERT INTO profiles (id, email, full_name, role, tenant_id, status, created_at, updated_at)
  VALUES (user_id, user_email, user_name, 'agent', univen_tenant_id, 'active', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RAISE NOTICE 'User % (%) created/updated for University of Venda tenant', user_email, user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo users using the function
-- Demo User 1 (the one you specified)
SELECT create_univen_demo_user(
  '894b8103-5129-4d94-953c-344a672c6670',
  'demo@univen.co.za',
  'University of Venda Demo User'
);

-- Additional demo users (uncomment to create more)
-- SELECT create_univen_demo_user(
--   gen_random_uuid(),
--   'demo2@univen.co.za',
--   'University of Venda Demo User 2'
-- );

-- SELECT create_univen_demo_user(
--   gen_random_uuid(),
--   'demo3@univen.co.za',
--   'University of Venda Demo User 3'
-- );

-- Verification query
SELECT 'University of Venda tenant users:' as info;
SELECT 
  p.id, 
  p.email, 
  p.full_name, 
  p.role, 
  t.name as tenant_name,
  p.status,
  p.created_at
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'univen'
ORDER BY p.created_at;

-- Clean up function (optional - uncomment if you want to drop the function)
-- DROP FUNCTION IF EXISTS create_univen_demo_user(UUID, TEXT, TEXT);