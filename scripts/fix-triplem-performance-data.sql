-- Fix Triple M performance data to set all values to 0

-- Update existing Triple M collection performance data to 0
UPDATE "collection_performance" 
SET 
  collections = 0,
  target = 0,
  updated_at = NOW()
WHERE tenant_id IN (
  SELECT id FROM "tenants" WHERE subdomain = 'triplem'
);

-- Update existing Triple M consolidated payments data to 0
UPDATE "consolidated_payments" 
SET 
  amount = 0,
  updated_at = NOW()
WHERE tenant_id IN (
  SELECT id FROM "tenants" WHERE subdomain = 'triplem'
);

-- Verify the updates
SELECT 'Collection Performance - Triple M' as table_name, month_name, collections, target
FROM "collection_performance" cp
JOIN "tenants" t ON cp.tenant_id = t.id
WHERE t.subdomain = 'triplem'
ORDER BY cp.month;

SELECT 'Consolidated Payments - Triple M' as table_name, month_display, amount
FROM "consolidated_payments" cp
JOIN "tenants" t ON cp.tenant_id = t.id
WHERE t.subdomain = 'triplem'
ORDER BY cp.month;
