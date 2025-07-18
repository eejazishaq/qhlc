-- QHLC Check Existing Tables Script
-- Run this in your Supabase SQL Editor to see what tables already exist

-- Check for existing tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'countries',
    'regions', 
    'areas',
    'exam_centers',
    'profiles',
    'exams',
    'questions',
    'user_exams',
    'user_answers',
    'attendance',
    'progress',
    'books',
    'resources',
    'gallery',
    'certificates',
    'audit_logs',
    'notifications'
)
ORDER BY tablename;

-- Check for existing custom types
SELECT 
    typname as type_name,
    typtype as type_type
FROM pg_type 
WHERE typname IN (
    'user_type',
    'gender',
    'exam_type',
    'exam_status',
    'user_exam_status',
    'attendance_status',
    'progress_status',
    'book_status',
    'book_type',
    'file_type',
    'resource_category',
    'gallery_category',
    'notification_type'
)
ORDER BY typname;

-- Check for existing functions
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN (
    'generate_serial_number',
    'update_updated_at_column',
    'get_user_profile',
    'get_user_dashboard_stats'
)
ORDER BY proname;

-- Check for existing triggers
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname IN (
    'trigger_generate_serial_number',
    'trigger_update_profiles_updated_at',
    'trigger_update_exams_updated_at'
)
ORDER BY tgname;

-- Check for existing indexes
SELECT 
    indexname as index_name,
    tablename as table_name,
    indexdef as index_definition
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
AND schemaname = 'public'
ORDER BY indexname;

-- Check for existing storage buckets
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public
FROM storage.buckets
WHERE id IN ('certificates', 'gallery', 'resources', 'profiles')
ORDER BY id;

-- Check for existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'exams',
    'questions',
    'user_exams',
    'user_answers',
    'attendance',
    'progress',
    'books',
    'resources',
    'gallery',
    'certificates',
    'notifications'
)
ORDER BY tablename, policyname;

-- Summary of what exists
SELECT 
    'Tables' as category,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'countries',
    'regions', 
    'areas',
    'exam_centers',
    'profiles',
    'exams',
    'questions',
    'user_exams',
    'user_answers',
    'attendance',
    'progress',
    'books',
    'resources',
    'gallery',
    'certificates',
    'audit_logs',
    'notifications'
)

UNION ALL

SELECT 
    'Custom Types' as category,
    COUNT(*) as count
FROM pg_type 
WHERE typname IN (
    'user_type',
    'gender',
    'exam_type',
    'exam_status',
    'user_exam_status',
    'attendance_status',
    'progress_status',
    'book_status',
    'book_type',
    'file_type',
    'resource_category',
    'gallery_category',
    'notification_type'
)

UNION ALL

SELECT 
    'Functions' as category,
    COUNT(*) as count
FROM pg_proc 
WHERE proname IN (
    'generate_serial_number',
    'update_updated_at_column',
    'get_user_profile',
    'get_user_dashboard_stats'
)

UNION ALL

SELECT 
    'Storage Buckets' as category,
    COUNT(*) as count
FROM storage.buckets
WHERE id IN ('certificates', 'gallery', 'resources', 'profiles'); 