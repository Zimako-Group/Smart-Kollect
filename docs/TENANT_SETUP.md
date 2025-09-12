# Tenant Setup Guide

This document explains how to set up and verify tenants in the Smart-Kollect system.

## Required Tenants

The system requires the following tenants to be set up:

1. **Mahikeng** - `mahikeng.smartkollect.co.za`
2. **Triple M** - `triplem.smartkollect.co.za`
3. **University of Venda** - `univen.smartkollect.co.za`

## Setting Up Tenants

### 1. University of Venda Tenant

To set up the University of Venda tenant, run the following script in your Supabase SQL Editor:

```sql
-- Setup University of Venda Tenant
-- This script ensures the University of Venda tenant is properly created and configured

-- 1. Create the University of Venda tenant if it doesn't exist
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- 2. Verify the tenant was created
SELECT 'University of Venda tenant status:' as info;
SELECT id, name, subdomain, domain, status 
FROM tenants 
WHERE subdomain = 'univen';
```

The full script is available at: `scripts/setup-univen-tenant.sql`

### 2. Verify All Tenants

To verify that all required tenants are set up correctly, run:

```sql
-- Verify All Tenants Setup
-- This script checks if all required tenants exist and creates any missing ones

-- 1. Display current tenants
SELECT 'Current tenants in system:' as info;
SELECT id, name, subdomain, domain, status FROM tenants ORDER BY created_at;

-- 2. Ensure all required tenants exist
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('Mahikeng Local Municipality', 'mahikeng', 'mahikeng.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('Triple M Financial Services', 'triplem', 'triplem.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Final verification
SELECT 'Tenant assignment verification:' as info;
SELECT t.name as tenant_name, COUNT(p.id) as user_count
FROM tenants t
LEFT JOIN profiles p ON p.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.created_at;
```

The full script is available at: `scripts/verify-all-tenants.sql`

## Assigning Users to Tenants

### Assign a Specific User to University of Venda Tenant

To assign a specific user (like your demo user) to the University of Venda tenant:

```sql
-- Assign User to University of Venda Tenant
-- Replace the user_id and user_email with the actual values

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
```

The full script is available at: `scripts/assign-user-to-univen-tenant.sql`

### Create Multiple Demo Users for University of Venda

To create multiple demo users for the University of Venda tenant:

```sql
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
```

The full script is available at: `scripts/create-univen-demo-users.sql`

## Importing University of Venda Master File Data

To import the University of Venda master file data from Excel to the database:

1. Ensure the Excel file is in your Downloads folder and named `univen_master_file.xlsx`
2. Navigate to the scripts directory:
   ```bash
   cd c:\Users\tjmar\OneDrive\Documents\GitHub\Smart-Kollect\scripts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the import script:
   ```bash
   npm run import
   ```

For custom file paths:
```bash
npm run import:custom "C:\path\to\your\file.xlsx"
```

The import script is available at: `scripts/import-univen-master-file.js`

Documentation for the import process is available at: `scripts/README.md`

## Troubleshooting Subdomain Issues

### 1. Check Subdomain Extraction Logic

The subdomain extraction logic is implemented in `lib/tenant-service.ts`. You can test it using the test script:

```bash
node scripts/test-subdomain-extraction.js
```

### 2. Verify Middleware Configuration

The middleware in `middleware.ts` handles tenant routing. Make sure it's properly configured to:

1. Extract the subdomain from the hostname
2. Set the tenant context in Supabase for RLS
3. Allow access to valid tenants

### 3. Check DNS Configuration

For subdomains to work properly, ensure that:

1. The domain `smartkollect.co.za` is properly configured in your DNS provider
2. Each subdomain has a CNAME record pointing to your hosting provider (e.g., Vercel)
3. SSL certificates are properly configured for each subdomain

## Common Issues and Solutions

### Issue: Subdomain not working
**Solution**: 
1. Verify the tenant exists in the database
2. Check the subdomain extraction logic
3. Ensure DNS records are properly configured

### Issue: "Auth session missing!" error
**Solution**:
1. Check that the tenant context is being set properly in middleware
2. Verify that the user belongs to the correct tenant
3. Ensure RLS policies are properly configured

### Issue: Users not assigned to tenant
**Solution**:
1. Run the tenant assignment script to assign users to the appropriate tenant
2. Verify that new users are automatically assigned to a tenant during registration

## Testing Tenant Functionality

### 1. Test Mahikeng Subdomain
Visit `mahikeng.smartkollect.co.za` and ensure you can log in and access the system.

### 2. Test Triple M Subdomain
Visit `triplem.smartkollect.co.za` and ensure you can log in and access the system.

### 3. Test University of Venda Subdomain
Visit `univen.smartkollect.co.za` and ensure you can log in and access the system.

### 4. Test Main Domain
Visit `smartkollect.co.za` and ensure you see the marketing landing page.

## Database Schema

The tenant system uses the following database schema:

### Tenants Table
```sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### University of Venda Customers Table
The University of Venda customers table contains all the fields from your Excel file:

```sql
-- Client Information
"Client Reference" TEXT,
"Interest rate" NUMERIC,
"Interest date" DATE,
"In Duplum" TEXT,
"Masked Client Reference" TEXT,
"Client" TEXT,
"Client Group" TEXT,
"Status" TEXT,
"Status Date" DATE,
"Debtor under DC?" TEXT,
"Debtor Status Date" DATE,
"Days Overdue" INTEGER,
"Client Division" TEXT,
"Old Client Ref" TEXT,
"Client Profile Account" TEXT,
"EasyPay Reference" TEXT,

-- Financial Information
"Original Cost" NUMERIC,
"Capital on Default" NUMERIC,
"Date Opened" DATE,
"Hand Over Date" DATE,
"Hand Over Amount" NUMERIC,
"Payments To Date" NUMERIC,
"Interest To Date" NUMERIC,
"Adjustments To Date" NUMERIC,
"Fees & Expenses" NUMERIC,
"Collection Commission" NUMERIC,
"FCC (excl VAT)" NUMERIC,
"Current Balance" NUMERIC,
"Capital Amount" NUMERIC,

-- Payment Information
"Last Payment Method" TEXT,
"Days since Last Payment" INTEGER,
"Last Payment Date" DATE,
"Last Payment Amount" NUMERIC,

-- Call Information
"Outbound Phone Call Outcome" TEXT,
"Outbound Phone Call Comment" TEXT,
"Last Inbound Phone Call Date" DATE,
"Inbound Phone Call Outcome" TEXT,

-- Contact Information
"Cellphone" TEXT,
"Cellphone 2" TEXT,
"Cellphone 3" TEXT,
"Cellphone 4" TEXT,
"Email" TEXT,
"Email 2" TEXT,
"Email 3" TEXT,

-- Address Information
"Street Address 1" TEXT,
"Street Address 2" TEXT,
"Street Address 3" TEXT,
"Street Address 4" TEXT,
"Street Code" TEXT,
"Combined Street" TEXT,

-- Personal Information
"Gender" TEXT,
"Occupation" TEXT,
"Employer Name" TEXT,
"Employer Contact" TEXT,
"Last Contact" DATE,
"ID Number" TEXT,
"Title" TEXT,
"Initials" TEXT,
"First Name" TEXT,
"Second Name" TEXT,
"Surname" TEXT,

-- Account Information
"Account Load Date" DATE,
"Debtor Flags" TEXT,
"Account Flags" TEXT,
"Linked Account" TEXT,
"Bucket" TEXT,
"Campaign Exclusions" TEXT,
"Original Line" TEXT,
"error" TEXT,
```

### Tenant ID Columns
All relevant tables have a `tenant_id` column that references the tenants table:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE "Debtors" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- ... other tables
```

### Row Level Security Policies
RLS policies ensure that users can only access data belonging to their tenant:

```sql
CREATE POLICY "Users can view debtors in their tenant" ON "Debtors"
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```