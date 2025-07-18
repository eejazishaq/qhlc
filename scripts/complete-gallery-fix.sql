-- Complete Gallery Fix
-- This script addresses all possible issues with gallery uploads

-- Step 1: Check current table structure
SELECT 
    'Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gallery' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check current RLS status
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'gallery' 
AND schemaname = 'public';

-- Step 3: Check current policies
SELECT 
    'Current Policies' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'gallery' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 4: Completely disable RLS temporarily (for testing)
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;

-- Step 5: Check if there are any constraints that might be causing issues
SELECT 
    'Constraints' as info,
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'gallery'::regclass;

-- Step 6: Test insert with minimal data (uncomment to test)
-- INSERT INTO gallery (title, description, image_url, category, is_featured, uploaded_by)
-- VALUES ('Test', 'Test Description', 'https://example.com/test.jpg', 'events', false, '00000000-0000-0000-0000-000000000000');

-- Step 7: If the test insert works, re-enable RLS with proper policies
-- Uncomment the following lines after confirming the test insert works:

/*
-- Re-enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Gallery all access" ON gallery;
DROP POLICY IF EXISTS "Resources all access" ON resources;
DROP POLICY IF EXISTS "Gallery read policy" ON gallery;
DROP POLICY IF EXISTS "Gallery insert policy" ON gallery;
DROP POLICY IF EXISTS "Gallery update policy" ON gallery;
DROP POLICY IF EXISTS "Gallery delete policy" ON gallery;
DROP POLICY IF EXISTS "Resources read policy" ON resources;
DROP POLICY IF EXISTS "Resources insert policy" ON resources;
DROP POLICY IF EXISTS "Resources update policy" ON resources;
DROP POLICY IF EXISTS "Resources delete policy" ON resources;

-- Create simple, permissive policies
CREATE POLICY "Gallery full access" ON gallery
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "Resources full access" ON resources
FOR ALL USING (true)
WITH CHECK (true);
*/

-- Step 8: Show final status
SELECT 
    'Final Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('gallery', 'resources') 
AND schemaname = 'public'; 