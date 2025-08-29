-- Fix RLS Policies for Classes Table
-- This script fixes the circular dependency issue in the classes table RLS policies

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'classes';

-- Drop the problematic circular dependency policies
DROP POLICY IF EXISTS "Admins can view all classes" ON classes;
DROP POLICY IF EXISTS "Admins can insert classes" ON classes;
DROP POLICY IF EXISTS "Admins can update classes" ON classes;
DROP POLICY IF EXISTS "Admins can delete classes" ON classes;

-- Create simpler admin policies that don't create circular dependencies
CREATE POLICY "Admins can view all classes" ON classes
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert classes" ON classes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update classes" ON classes
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete classes" ON classes
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE user_type IN ('admin', 'super_admin')
        )
    );

-- Alternative: If the above still doesn't work, we can temporarily disable RLS for testing
-- ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for development
-- CREATE POLICY "Allow authenticated users to manage classes" ON classes
--     FOR ALL USING (auth.role() = 'authenticated');

-- Show final policy state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE table_name = 'classes';

-- Test if we can now access the classes table
SELECT COUNT(*) FROM classes; 