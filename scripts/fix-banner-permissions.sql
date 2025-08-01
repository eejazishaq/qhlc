-- Fix Banner Permissions - Run this in Supabase SQL Editor

-- First, let's check if the table exists and its current state
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'banners'
) as table_exists;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public can read active banners" ON banners;
DROP POLICY IF EXISTS "Admins can read all banners" ON banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;

-- Disable RLS temporarily
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper syntax
CREATE POLICY "Public can read active banners" ON banners
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can read all banners" ON banners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert banners" ON banners
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update banners" ON banners
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete banners" ON banners
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON banners TO authenticated;
GRANT ALL PRIVILEGES ON banners TO anon;

-- Grant usage on sequence
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Test the policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'banners';

-- Test if we can insert a banner (this should work for admin users)
-- Note: This will only work if you're authenticated as an admin
SELECT COUNT(*) as current_banner_count FROM banners; 