-- Create a stored procedure to bypass RLS when creating profiles
CREATE OR REPLACE FUNCTION create_profile(
  profile_id UUID,
  profile_email TEXT,
  profile_full_name TEXT,
  profile_role TEXT,
  profile_status TEXT,
  profile_avatar_url TEXT DEFAULT NULL,
  profile_performance JSONB DEFAULT '{"collectionRate": 0, "casesResolved": 0, "customerSatisfaction": 0}'::jsonb
) RETURNS VOID AS $$
BEGIN
  -- Insert the profile with security definer to bypass RLS
  INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    status, 
    avatar_url, 
    performance
  ) 
  VALUES (
    profile_id, 
    profile_email, 
    profile_full_name, 
    profile_role, 
    profile_status, 
    profile_avatar_url, 
    profile_performance
  )
  ON CONFLICT (id) DO UPDATE SET
    email = profile_email,
    full_name = profile_full_name,
    role = profile_role,
    status = profile_status,
    avatar_url = profile_avatar_url,
    performance = profile_performance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
