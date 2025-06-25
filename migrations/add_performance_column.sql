-- Add performance column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS performance JSONB DEFAULT '{"collectionRate": 0, "casesResolved": 0, "customerSatisfaction": 0}'::jsonb;

-- Add status column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing profiles with default performance data
UPDATE profiles 
SET performance = '{"collectionRate": 0, "casesResolved": 0, "customerSatisfaction": 0}'::jsonb
WHERE performance IS NULL;

-- Update existing profiles with default status
UPDATE profiles 
SET status = 'active'
WHERE status IS NULL;
