-- Test Banner Table Access
-- Run this in Supabase SQL Editor to verify permissions

-- Test 1: Check if we can read from banners
SELECT 'Test 1: Reading from banners table' as test_name;
SELECT COUNT(*) as banner_count FROM banners;

-- Test 2: Check if we can insert into banners
SELECT 'Test 2: Inserting into banners table' as test_name;
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) 
VALUES ('Permission Test', 'Testing if we can insert', 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=Permission+Test', '/test', true, 1000)
ON CONFLICT DO NOTHING;

-- Test 3: Check if we can update banners
SELECT 'Test 3: Updating banners table' as test_name;
UPDATE banners 
SET title = 'Updated Permission Test' 
WHERE title = 'Permission Test';

-- Test 4: Check if we can delete from banners
SELECT 'Test 4: Deleting from banners table' as test_name;
DELETE FROM banners 
WHERE title = 'Updated Permission Test';

-- Test 5: Show final state
SELECT 'Test 5: Final banner count' as test_name;
SELECT COUNT(*) as final_banner_count FROM banners;

-- Test 6: Show all current banners
SELECT 'Test 6: All current banners' as test_name;
SELECT id, title, is_active, display_order, created_at 
FROM banners 
ORDER BY display_order; 