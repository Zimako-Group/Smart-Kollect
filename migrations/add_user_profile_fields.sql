-- Add additional user profile fields to profiles table
-- Run this in Supabase SQL Editor

-- Add phone field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add job_title field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add bio field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add language field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add timezone field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Johannesburg';

-- Add tenant_id field if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add notification preferences as JSONB
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "emailNotifications": true,
  "smsNotifications": true,
  "pushNotifications": false,
  "paymentReminders": true,
  "newDebtorAssignments": true,
  "campaignUpdates": true,
  "systemAnnouncements": true,
  "teamMessages": true
}'::jsonb;

-- Add appearance preferences as JSONB
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS appearance_preferences JSONB DEFAULT '{
  "theme": "system",
  "fontSize": "medium",
  "colorScheme": "default",
  "reducedMotion": false,
  "compactMode": false
}'::jsonb;

-- Add two factor authentication field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Update existing profiles with default values where NULL
UPDATE profiles 
SET 
  language = COALESCE(language, 'en'),
  timezone = COALESCE(timezone, 'Africa/Johannesburg'),
  notification_preferences = COALESCE(notification_preferences, '{
    "emailNotifications": true,
    "smsNotifications": true,
    "pushNotifications": false,
    "paymentReminders": true,
    "newDebtorAssignments": true,
    "campaignUpdates": true,
    "systemAnnouncements": true,
    "teamMessages": true
  }'::jsonb),
  appearance_preferences = COALESCE(appearance_preferences, '{
    "theme": "system",
    "fontSize": "medium",
    "colorScheme": "default",
    "reducedMotion": false,
    "compactMode": false
  }'::jsonb),
  two_factor_enabled = COALESCE(two_factor_enabled, false)
WHERE 
  language IS NULL 
  OR timezone IS NULL 
  OR notification_preferences IS NULL 
  OR appearance_preferences IS NULL 
  OR two_factor_enabled IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update RLS policies to include new fields
-- Users can view and update their own profile including new fields
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Comment to document the new fields
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.job_title IS 'User job title or position';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.language IS 'User preferred language (default: en)';
COMMENT ON COLUMN profiles.timezone IS 'User timezone (default: Africa/Johannesburg)';
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences as JSON';
COMMENT ON COLUMN profiles.appearance_preferences IS 'User appearance preferences as JSON';
COMMENT ON COLUMN profiles.two_factor_enabled IS 'Whether two-factor authentication is enabled';
