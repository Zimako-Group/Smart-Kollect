-- Script to confirm all user emails in Supabase Auth
-- This is useful for development environments where email confirmation is not needed

-- Update all users to have confirmed emails
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE email_confirmed_at IS NULL;

-- Optionally, you can also update specific users by email
-- UPDATE auth.users
-- SET email_confirmed_at = CURRENT_TIMESTAMP
-- WHERE email = 'specific.email@example.com' AND email_confirmed_at IS NULL;
