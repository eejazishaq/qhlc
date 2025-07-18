-- IMMEDIATE FIX: Remove the problematic RLS policy that's causing infinite recursion
-- Run this in your Supabase SQL editor immediately

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON profiles;

-- Create a simple, safe policy that doesn't cause recursion
CREATE POLICY "Enable read access for authenticated users" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Alternative: If you want to keep some restrictions, use this instead:
-- CREATE POLICY "Users can view own profile" ON profiles
-- FOR SELECT USING (auth.uid() = id);

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 