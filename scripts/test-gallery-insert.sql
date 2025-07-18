-- Test Gallery Insert
-- This script helps identify the exact issue with gallery insertions

-- Step 1: Check if we can connect and see the table
SELECT 'Testing connection and table access' as status;

-- Step 2: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gallery' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'gallery' 
AND schemaname = 'public';

-- Step 4: Check current policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'gallery' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 5: Check current user context
SELECT 
    'Current User Context' as info,
    auth.uid() as user_id,
    auth.role() as user_role;

-- Step 6: Check if user exists in profiles
SELECT 
    'User Profile Check' as info,
    id,
    full_name,
    user_type,
    is_active
FROM profiles 
WHERE id = auth.uid();

-- Step 7: Try a simple insert with hardcoded values (for testing)
-- Uncomment the following lines to test:

/*
INSERT INTO gallery (
    title, 
    description, 
    image_url, 
    category, 
    is_featured, 
    uploaded_by
) VALUES (
    'Test Image',
    'Test Description',
    'https://example.com/test.jpg',
    'events',
    false,
    auth.uid()
) RETURNING *;
*/

-- Step 8: If the above works, try with a specific UUID
-- Replace 'your-user-id-here' with an actual UUID from your profiles table

/*
INSERT INTO gallery (
    title, 
    description, 
    image_url, 
    category, 
    is_featured, 
    uploaded_by
) VALUES (
    'Test Image 2',
    'Test Description 2',
    'https://example.com/test2.jpg',
    'activities',
    true,
    'your-user-id-here'::uuid
) RETURNING *;
*/

-- Step 9: Show any existing gallery items
SELECT 
    'Existing Gallery Items' as info,
    COUNT(*) as total_items
FROM gallery; 