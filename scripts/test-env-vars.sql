-- Test Environment Variables and Database Access
-- This script helps verify that the database connection is working

-- Test 1: Check if we can connect to the database
SELECT 'Database connection test' as test_name, NOW() as current_time;

-- Test 2: Check if gallery table exists and is accessible
SELECT 
    'Gallery table check' as test_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'gallery' 
        AND table_schema = 'public'
    ) as table_exists;

-- Test 3: Check gallery table structure
SELECT 
    'Gallery structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'gallery' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 4: Check RLS status
SELECT 
    'RLS status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'gallery' 
AND schemaname = 'public';

-- Test 5: Check current policies
SELECT 
    'Current policies' as test_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'gallery' 
AND schemaname = 'public'
ORDER BY policyname;

-- Test 6: Try a simple insert with a dummy UUID
-- Uncomment to test:
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
    '00000000-0000-0000-0000-000000000000'::uuid
) RETURNING id, title;
*/ 