-- Update Consolidated Payments for Mahikeng tenant - August 2025 only
-- This script specifically updates the August 2025 payment data for the Mahikeng tenant

-- First, verify the Mahikeng tenant exists
DO $$
DECLARE
    mahikeng_tenant_id UUID;
BEGIN
    -- Get the Mahikeng tenant ID
    SELECT id INTO mahikeng_tenant_id 
    FROM "tenants" 
    WHERE subdomain = 'mahikeng';
    
    -- Check if tenant exists
    IF mahikeng_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Mahikeng tenant not found. Please ensure the tenant exists before running this script.';
    END IF;
    
    RAISE NOTICE 'Found Mahikeng tenant with ID: %', mahikeng_tenant_id;
END $$;

-- Update August 2025 consolidated payment for Mahikeng tenant
-- Setting August payment amount to 24327291.34
UPDATE "consolidated_payments" 
SET 
    amount = 24327291.34,
    updated_at = NOW()
WHERE 
    tenant_id = (SELECT id FROM "tenants" WHERE subdomain = 'mahikeng')
    AND month = 8 
    AND year = 2025;

-- Verify the update was successful
DO $$
DECLARE
    updated_count INTEGER;
    current_amount DECIMAL(15,2);
BEGIN
    -- Check if the update affected any rows
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count = 0 THEN
        RAISE NOTICE 'No rows were updated. The August 2025 record may not exist for Mahikeng tenant.';
        
        -- Insert the record if it doesn't exist
        INSERT INTO "consolidated_payments" (tenant_id, month, year, month_display, amount)
        SELECT 
            t.id as tenant_id,
            8 as month,
            2025 as year,
            'Aug 2025' as month_display,
            24327291.34 as amount
        FROM "tenants" t
        WHERE t.subdomain = 'mahikeng'
        ON CONFLICT (tenant_id, month, year) DO UPDATE SET
            amount = EXCLUDED.amount,
            updated_at = NOW();
            
        RAISE NOTICE 'Inserted new August 2025 record for Mahikeng tenant.';
    ELSE
        RAISE NOTICE 'Successfully updated % row(s) for August 2025 Mahikeng payments.', updated_count;
    END IF;
    
    -- Display the current August 2025 amount for verification
    SELECT cp.amount INTO current_amount
    FROM "consolidated_payments" cp
    JOIN "tenants" t ON cp.tenant_id = t.id
    WHERE t.subdomain = 'mahikeng' 
    AND cp.month = 8 
    AND cp.year = 2025;
    
    RAISE NOTICE 'Current August 2025 payment amount for Mahikeng: %', current_amount;
END $$;

-- Optional: Display all consolidated payments for Mahikeng tenant for verification
SELECT 
    t.subdomain as tenant,
    cp.month_display,
    cp.amount,
    cp.updated_at
FROM "consolidated_payments" cp
JOIN "tenants" t ON cp.tenant_id = t.id
WHERE t.subdomain = 'mahikeng'
ORDER BY cp.year, cp.month;
