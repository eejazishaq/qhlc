-- Temporarily disable RLS on user_exams table for testing
-- Run this in your Supabase SQL Editor

-- Disable RLS completely
ALTER TABLE user_exams DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL PRIVILEGES ON TABLE user_exams TO authenticated;
GRANT ALL PRIVILEGES ON TABLE user_exams TO anon;
GRANT ALL PRIVILEGES ON TABLE user_exams TO service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_exams';

-- Show current policies (should be none)
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename = 'user_exams'; 