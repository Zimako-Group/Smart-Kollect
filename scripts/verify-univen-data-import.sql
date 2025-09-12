-- Verify University of Venda Data Import
-- This script verifies that data has been correctly imported into the univen_customers table

-- 1. Check if the University of Venda tenant exists
SELECT 'University of Venda tenant verification:' as info;
SELECT id, name, subdomain, status FROM tenants WHERE subdomain = 'univen';

-- 2. Count total records in univen_customers table
SELECT 'Total records in univen_customers table:' as info;
SELECT COUNT(*) as total_records FROM univen_customers;

-- 3. Count records for University of Venda tenant
SELECT 'Records for University of Venda tenant:' as info;
SELECT 
  COUNT(*) as univen_records,
  t.name as tenant_name
FROM univen_customers uc
JOIN tenants t ON uc.tenant_id = t.id
WHERE t.subdomain = 'univen'
GROUP BY t.name;

-- 4. Sample data verification
SELECT 'Sample of imported data:' as info;
SELECT 
  "Client Reference",
  "First Name",
  "Surname",
  "Cellphone",
  "Current Balance",
  created_at
FROM univen_customers 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen')
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check for data completeness
SELECT 'Data completeness check:' as info;
SELECT 
  COUNT(*) as total_records,
  COUNT("Client Reference") as records_with_client_reference,
  COUNT("First Name") as records_with_first_name,
  COUNT("Surname") as records_with_surname,
  COUNT("Cellphone") as records_with_cellphone,
  COUNT("Current Balance") as records_with_balance
FROM univen_customers 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen');

-- 6. Check for duplicate client references
SELECT 'Duplicate client references check:' as info;
SELECT 
  "Client Reference",
  COUNT(*) as duplicate_count
FROM univen_customers 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen')
  AND "Client Reference" IS NOT NULL
GROUP BY "Client Reference"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 7. Balance statistics
SELECT 'Balance statistics:' as info;
SELECT 
  COUNT(*) as record_count,
  MIN("Current Balance") as min_balance,
  MAX("Current Balance") as max_balance,
  AVG("Current Balance") as avg_balance,
  SUM("Current Balance") as total_balance
FROM univen_customers 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen')
  AND "Current Balance" IS NOT NULL;

-- 8. Recent imports
SELECT 'Most recently imported records:' as info;
SELECT 
  "Client Reference",
  "First Name",
  "Surname",
  created_at
FROM univen_customers 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'univen')
ORDER BY created_at DESC
LIMIT 5;