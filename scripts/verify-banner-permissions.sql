-- Verify Banner Permissions
-- Run this in Supabase SQL Editor

-- Check current permissions
SELECT 'Current permissions for banners table:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'banners'
ORDER BY grantee, privilege_type;

-- Check RLS status
SELECT 'RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'banners';

-- Check if there are any policies
SELECT 'Current policies:' as info;
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

-- Test all operations as authenticated user
-- Note: This will only work if you're authenticated as an admin

-- Test 1: Read
SELECT 'Test 1: Reading banners' as test_name;
SELECT COUNT(*) as banner_count FROM banners;

-- Test 2: Insert
SELECT 'Test 2: Inserting banner' as test_name;
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) 
VALUES ('Permission Test', 'Testing permissions', 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=Test', '/test', true, 9999)
ON CONFLICT DO NOTHING;

-- Test 3: Update
SELECT 'Test 3: Updating banner' as test_name;
UPDATE banners 
SET title = 'Updated Permission Test' 
WHERE title = 'Permission Test';

-- Test 4: Delete
SELECT 'Test 4: Deleting test banner' as test_name;
DELETE FROM banners 
WHERE title = 'Updated Permission Test';

-- Show final state
SELECT 'Final banner count:' as info;
SELECT COUNT(*) as final_count FROM banners;

-- Show all current banners
SELECT 'All current banners:' as info;
SELECT id, title, is_active, display_order, created_at 
FROM banners 
ORDER BY display_order; 