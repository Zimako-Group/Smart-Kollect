-- Make profiles publicly readable (simplest approach)
-- This will ensure all users can see all profiles

-- First, enable RLS on the profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a policy that makes all profiles publicly readable
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Keep other policies for update/insert as needed
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON profiles;

-- Create policy to allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Create policy to allow admins to update all profiles
CREATE POLICY "Allow admins to update all profiles" 
ON profiles FOR UPDATE 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Create policy to allow admins to insert profiles
CREATE POLICY "Allow admins to insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin' OR auth.uid() = id
);
