-- Completely Disable RLS on All Content Tables
-- This script disables RLS on all tables that might be causing upload issues

-- Disable RLS on all content tables
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on other tables that might be related
ALTER TABLE user_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
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
DROP POLICY IF EXISTS "Gallery full access" ON gallery;
DROP POLICY IF EXISTS "Resources full access" ON resources;

-- Show the status of all tables
SELECT 
    'RLS Status After Disable' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('gallery', 'resources', 'certificates', 'profiles', 'user_exams', 'user_answers', 'attendance', 'progress', 'books', 'notifications') 
AND schemaname = 'public'
ORDER BY tablename;

-- Test insert into gallery (uncomment to test)
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
) RETURNING *;
*/ 