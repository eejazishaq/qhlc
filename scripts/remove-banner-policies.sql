-- Remove all RLS policies from banners table
-- Run this in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can read active banners" ON banners;
DROP POLICY IF EXISTS "Admins can read all banners" ON banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;

-- Disable RLS completely
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- Verify policies are removed
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename = 'banners';

-- Check if RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'banners'; 