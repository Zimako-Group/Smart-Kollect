-- First, drop the foreign key constraint
ALTER TABLE "PTP" DROP CONSTRAINT IF EXISTS "PTP_created_by_fkey";

-- Then modify the created_by column to be nullable
ALTER TABLE "PTP" ALTER COLUMN "created_by" DROP NOT NULL;

-- Add a new foreign key constraint with ON DELETE SET NULL
ALTER TABLE "PTP" 
  ADD CONSTRAINT "PTP_created_by_fkey" 
  FOREIGN KEY ("created_by") 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;
