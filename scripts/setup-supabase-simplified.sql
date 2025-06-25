-- ZIMAKO DCMS DATABASE SETUP SCRIPT (SIMPLIFIED)
-- First, clean up any existing objects to start fresh
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS profiles;

-- Create profiles table for user information and roles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('admin', 'agent', 'manager', 'supervisor')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS but with simplified policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role (needed for admin operations)
CREATE POLICY "Service role has full access"
  ON profiles
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create permissions table for fine-grained access control
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
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

-- Create the initial users (agent and admin)
-- Placeholder IDs will be updated after user creation in Auth UI
INSERT INTO profiles (id, full_name, email, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'TJ Marvin', 'tjmarvin83@gmail.com', 'agent'),
  ('00000000-0000-0000-0000-000000000002', 'Rofhiwa Mudau', 'rofhiwa@zimako.co.za', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- IMPORTANT: After creating users in the Auth UI, run this to update the profiles with the correct IDs:
/*
UPDATE profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'tjmarvin83@gmail.com')
WHERE email = 'tjmarvin83@gmail.com';

UPDATE profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'rofhiwa@zimako.co.za')
WHERE email = 'rofhiwa@zimako.co.za';
*/
