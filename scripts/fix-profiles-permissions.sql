-- Comprehensive fix for profiles table permissions
-- Run this to ensure the service role and other roles can access the profiles table

-- 1. Grant all privileges to service_role (this is what the service role key uses)
GRANT ALL PRIVILEGES ON TABLE profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE profiles TO postgres;

-- 2. Grant all privileges to anon and authenticated roles
GRANT ALL PRIVILEGES ON TABLE profiles TO anon;
GRANT ALL PRIVILEGES ON TABLE profiles TO authenticated;

-- 3. Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Grant sequence permissions if using auto-increment
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Verify RLS is disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 6. Check current permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- 7. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles'; 