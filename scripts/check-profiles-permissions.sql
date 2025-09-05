-- Check current status of profiles table permissions and RLS
-- Run this to see what's happening

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- Check if anon role has access
SELECT 
  has_table_privilege('anon', 'profiles', 'INSERT') as anon_can_insert,
  has_table_privilege('anon', 'profiles', 'SELECT') as anon_can_select,
  has_table_privilege('anon', 'profiles', 'UPDATE') as anon_can_update;

-- Check if authenticated role has access
SELECT 
  has_table_privilege('authenticated', 'profiles', 'INSERT') as auth_can_insert,
  has_table_privilege('authenticated', 'profiles', 'SELECT') as auth_can_select,
  has_table_privilege('authenticated', 'profiles', 'UPDATE') as auth_can_update; 