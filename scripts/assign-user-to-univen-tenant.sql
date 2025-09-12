-- Assign User to University of Venda Tenant
-- This script assigns a specific user to the University of Venda tenant and sets their role to agent

-- First, ensure the University of Venda tenant exists
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- Get the University of Venda tenant ID
DO $$
DECLARE
  univen_tenant_id UUID;
  user_id UUID := '894b8103-5129-4d94-953c-344a672c6670'; -- The demo user ID
  user_email TEXT := 'demo@univen.co.za';
BEGIN
  -- Get University of Venda tenant ID
  SELECT id INTO univen_tenant_id FROM tenants WHERE subdomain = 'univen';
  
  IF univen_tenant_id IS NOT NULL THEN
    -- Assign the user to the University of Venda tenant
    UPDATE profiles 
    SET 
      tenant_id = univen_tenant_id,
      role = 'agent',  -- Set role to agent
      status = 'active',
      updated_at = NOW()
    WHERE id = user_id;
    
    -- Check if the update was successful
    IF FOUND THEN
      RAISE NOTICE 'User % (%) successfully assigned to University of Venda tenant with agent role', user_email, user_id;
    ELSE
      -- If user profile doesn't exist, create it
      INSERT INTO profiles (id, email, full_name, role, tenant_id, status)
      VALUES (user_id, user_email, 'University of Venda Demo User', 'agent', univen_tenant_id, 'active')
      ON CONFLICT (id) DO UPDATE 
      SET 
        tenant_id = univen_tenant_id,
        role = 'agent',
        status = 'active',
        updated_at = NOW();
      
      RAISE NOTICE 'User % (%) profile created/updated for University of Venda tenant with agent role', user_email, user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'University of Venda tenant not found';
  END IF;
  
  -- Verify the assignment
  RAISE NOTICE 'Verification:';
  SELECT p.id, p.email, p.full_name, p.role, t.name as tenant_name, t.subdomain
  FROM profiles p
  JOIN tenants t ON p.tenant_id = t.id
  WHERE p.id = user_id;
END $$;

-- Alternative simpler approach if the DO block doesn't work in your environment
-- Uncomment the following lines if needed:

-- UPDATE profiles 
-- SET 
--   tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen'),
--   role = 'agent',
--   status = 'active',
--   updated_at = NOW()
-- WHERE id = '894b8103-5129-4d94-953c-344a672c6670';

-- SELECT 'User assignment verification:' as info;
-- SELECT p.id, p.email, p.full_name, p.role, t.name as tenant_name
-- FROM profiles p
-- JOIN tenants t ON p.tenant_id = t.id
-- WHERE p.id = '894b8103-5129-4d94-953c-344a672c6670';