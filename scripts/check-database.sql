-- Check database contents
-- Run this in your Supabase SQL editor

-- 1. Check profiles table
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_profiles,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_profiles
FROM profiles;

-- 2. List all profiles
SELECT 
    id,
    full_name,
    user_type,
    is_active,
    created_at,
    area_id,
    center_id
FROM profiles
ORDER BY created_at DESC;

-- 3. Check auth.users table (if accessible)
SELECT 
    COUNT(*) as total_auth_users
FROM auth.users;

-- 4. List auth users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 5. Check for users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN p.id IS NULL THEN 'No Profile' ELSE 'Has Profile' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 6. Check areas and centers
SELECT 'Areas' as table_name, COUNT(*) as count FROM areas
UNION ALL
SELECT 'Centers' as table_name, COUNT(*) as count FROM exam_centers;

-- 7. List areas
SELECT id, name, is_active FROM areas ORDER BY name;

-- 8. List centers
SELECT id, name, area_id, is_active FROM exam_centers ORDER BY name; 