-- Test basic queries for Admin Transfer API
-- This script tests if we can access the basic data without complex relationships

-- Test 1: Can we access profiles table?
SELECT 
    'Profiles table accessible' as test,
    COUNT(*) as user_count
FROM profiles 
WHERE is_active = true;

-- Test 2: Can we access exam_centers table?
SELECT 
    'Exam centers table accessible' as test,
    COUNT(*) as center_count
FROM exam_centers 
WHERE is_active = true;

-- Test 3: Can we access areas table?
SELECT 
    'Areas table accessible' as test,
    COUNT(*) as area_count
FROM areas 
WHERE is_active = true;

-- Test 4: Show sample data from each table
SELECT 
    'Sample profiles' as info,
    id,
    full_name,
    mobile,
    user_type,
    center_id,
    area_id,
    is_active
FROM profiles 
WHERE is_active = true 
LIMIT 3;

SELECT 
    'Sample centers' as info,
    id,
    name,
    area_id
FROM exam_centers 
WHERE is_active = true 
LIMIT 3;

SELECT 
    'Sample areas' as info,
    id,
    name
FROM areas 
WHERE is_active = true 
LIMIT 3;

-- Test 5: Check if RLS is enabled on these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'exam_centers', 'areas'); 