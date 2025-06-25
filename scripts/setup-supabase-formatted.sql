-- ZIMAKO DCMS DATABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor

-- Create profiles table for user information and roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('admin', 'agent', 'manager', 'supervisor')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- First, create a policy that allows the service role to do everything
-- This is important for the trigger function to work
CREATE POLICY "Service role can do everything" 
  ON profiles 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy for admins to view all profiles - fixed to avoid recursion
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id AND 
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )
  );

-- Policy for admins to update all profiles - fixed to avoid recursion
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id AND 
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )
  );

-- Policy to allow insert for authenticated users (needed for registration)
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'agent' -- Default role for new users
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT,
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role, permission_id)
);

-- Insert basic permissions
INSERT INTO permissions (name, description) VALUES
  ('view_dashboard', 'Can view dashboard'),
  ('manage_debtors', 'Can manage debtors'),
  ('make_calls', 'Can make calls to debtors'),
  ('view_reports', 'Can view reports'),
  ('manage_users', 'Can manage users'),
  ('manage_settings', 'Can manage system settings')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Agent role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'agent', id FROM permissions 
WHERE name IN ('view_dashboard', 'manage_debtors', 'make_calls')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Manager role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions 
WHERE name IN ('view_dashboard', 'manage_debtors', 'make_calls', 'view_reports')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Supervisor role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor', id FROM permissions 
WHERE name IN ('view_dashboard', 'manage_debtors', 'make_calls', 'view_reports', 'manage_users')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Create the initial agent user (if not exists)
-- Note: You'll need to create the user through the Authentication UI first,
-- then run this to set their role
INSERT INTO profiles (id, full_name, email, role)
SELECT id, 'TJ Marvin', 'tjmarvin83@gmail.com', 'agent'
FROM auth.users
WHERE email = 'tjmarvin83@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'agent';
