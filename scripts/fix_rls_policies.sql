-- Fix RLS policies for profiles table to allow admins to see all profiles

-- First, enable RLS on the profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a simple policy that allows users to view their own profile
CREATE POLICY "Allow users to view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Create a policy that allows users with role 'admin' in their JWT claims to view all profiles
CREATE POLICY "Allow admins to view all profiles" 
ON profiles FOR SELECT 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Create policy to allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Create policy to allow users with role 'admin' in their JWT claims to update all profiles
CREATE POLICY "Allow admins to update all profiles" 
ON profiles FOR UPDATE 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Create policy to allow users with role 'admin' in their JWT claims to insert profiles
CREATE POLICY "Allow admins to insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);
