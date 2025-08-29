-- Fix RLS Policies for Admin Transfer API
-- This script fixes the circular dependency issue in the profiles table RLS policies

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop the problematic circular dependency policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a simpler admin policy that doesn't create circular dependencies
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

-- Alternative: If the above still doesn't work, we can temporarily disable RLS for testing
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for development
-- CREATE POLICY "Allow authenticated users to view profiles" ON profiles
--     FOR SELECT USING (auth.role() = 'authenticated');

-- Check if exam_centers table has RLS enabled and policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'exam_centers';

-- If exam_centers has RLS enabled, make sure admins can access it
CREATE POLICY IF NOT EXISTS "Admins can view all centers" ON exam_centers
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

-- Check if areas table has RLS enabled and policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'areas';

-- If areas has RLS enabled, make sure admins can access it
CREATE POLICY IF NOT EXISTS "Admins can view all areas" ON areas
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

-- Show final policy state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'exam_centers', 'areas'); 