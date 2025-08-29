-- Add email field to profiles table for serial number login
-- This allows users to login with just serial number + password

-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT;

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Update existing profiles with email from auth.users (if possible)
-- Note: This requires admin privileges and may not work in all Supabase setups
-- UPDATE profiles 
-- SET email = (
--   SELECT email 
--   FROM auth.users 
--   WHERE auth.users.id = profiles.id
-- );

-- Make email required for new profiles (optional - uncomment if you want to enforce this)
-- ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email (optional - uncomment if you want to enforce this)
-- ALTER TABLE profiles ADD CONSTRAINT unique_profiles_email UNIQUE (email);

-- Update RLS policies to allow email access
-- The existing policies should work, but you may need to update them if you have specific email-related policies

COMMENT ON COLUMN profiles.email IS 'User email address for authentication (required for serial number login)'; 