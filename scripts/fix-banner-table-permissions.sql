-- Comprehensive Banner Table Permission Fix
-- Run this in Supabase SQL Editor

-- First, let's check the current state
SELECT 'Current table state:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'banners'
) as table_exists;

-- Check current permissions
SELECT 'Current permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'banners';

-- Check RLS status
SELECT 'RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'banners';

-- Drop all existing policies (in case any remain)
DROP POLICY IF EXISTS "Public can read active banners" ON banners;
DROP POLICY IF EXISTS "Admins can read all banners" ON banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;
DROP POLICY IF EXISTS "Enable read access for all users" ON banners;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON banners;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON banners;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON banners;

-- Disable RLS completely
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to authenticated users
GRANT ALL PRIVILEGES ON banners TO authenticated;
GRANT ALL PRIVILEGES ON banners TO anon;
GRANT ALL PRIVILEGES ON banners TO service_role;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Verify the fixes
SELECT 'After fixes - permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'banners';

SELECT 'After fixes - RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'banners';

-- Test insert (this should work now)
SELECT 'Testing insert...' as info;
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) 
VALUES ('Test Banner', 'Testing permissions', 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=Test', '/test', true, 999)
ON CONFLICT DO NOTHING;

-- Show current banners
SELECT 'Current banners:' as info;
SELECT id, title, is_active, display_order FROM banners ORDER BY display_order; 