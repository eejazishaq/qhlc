-- Test Banners Table - Run this to check if table exists

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'banners'
) as table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'banners'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'banners';

-- Check if there are any banners
SELECT COUNT(*) as banner_count FROM banners;

-- Show sample banners
SELECT id, title, is_active, display_order, created_at 
FROM banners 
ORDER BY display_order 
LIMIT 5; 