-- QHLC Diagnose Table Access Issues
-- This script helps identify why tables might not be accessible

-- Check if tables exist
SELECT 
    'Table Exists' as check_type,
    tablename as table_name,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('resources', 'gallery')
ORDER BY tablename;

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    tablename as table_name,
    CASE 
        WHEN rowsecurity THEN '🔒 ENABLED'
        ELSE '🔓 DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('resources', 'gallery')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename as table_name,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ HAS POLICY'
        ELSE '❌ NO POLICY'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('resources', 'gallery')
ORDER BY tablename, policyname;

-- Check permissions
SELECT 
    'Permissions' as check_type,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND table_name IN ('resources', 'gallery')
ORDER BY table_name, privilege_type;

-- Test direct access (this might fail due to RLS)
DO $$
BEGIN
    RAISE NOTICE 'Testing direct access to resources table...';
    PERFORM COUNT(*) FROM resources LIMIT 1;
    RAISE NOTICE '✅ Resources table is accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Resources table access failed: %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Testing direct access to gallery table...';
    PERFORM COUNT(*) FROM gallery LIMIT 1;
    RAISE NOTICE '✅ Gallery table is accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Gallery table access failed: %', SQLERRM;
END $$;

-- Check if we're authenticated
SELECT 
    'Authentication' as check_type,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ AUTHENTICATED'
        ELSE '❌ NOT AUTHENTICATED'
    END as auth_status,
    auth.uid() as user_id;

-- Check current user role
SELECT 
    'Current User' as check_type,
    current_user as username,
    session_user as session_username;

-- Summary
SELECT 
    'SUMMARY' as check_type,
    'resources' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resources' AND schemaname = 'public') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as table_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resources' AND schemaname = 'public') THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as has_policies
UNION ALL
SELECT 
    'SUMMARY' as check_type,
    'gallery' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gallery' AND schemaname = 'public') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as table_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gallery' AND schemaname = 'public') THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as has_policies; 