-- Completely remove the foreign key constraint without recreating it
ALTER TABLE "PTP" DROP CONSTRAINT IF EXISTS "PTP_created_by_fkey";

-- Make created_by nullable
ALTER TABLE "PTP" ALTER COLUMN "created_by" DROP NOT NULL;
