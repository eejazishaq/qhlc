-- Diagnose Gallery RLS Issue
-- This script helps identify why the gallery insert is failing

-- 1. Check if RLS is enabled on gallery table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'gallery' 
AND schemaname = 'public';

-- 2. Check current RLS policies on gallery table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'gallery' 
AND schemaname = 'public'
ORDER BY policyname;

-- 3. Check gallery table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gallery' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any existing gallery records
SELECT COUNT(*) as total_gallery_items FROM gallery;

-- 5. Check current user context (run this as the authenticated user)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 6. Check if the current user has admin privileges
SELECT 
    p.id,
    p.full_name,
    p.user_type,
    p.is_active
FROM profiles p
WHERE p.id = auth.uid();

-- 7. Test insert with explicit values (this will help identify the issue)
-- Note: This is just for testing, don't run in production
-- INSERT INTO gallery (title, description, image_url, category, is_featured, uploaded_by)
-- VALUES ('Test Image', 'Test Description', 'https://example.com/test.jpg', 'events', false, auth.uid()); 