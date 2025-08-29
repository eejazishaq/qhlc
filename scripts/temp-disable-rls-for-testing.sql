-- Temporarily disable RLS for testing Admin Transfer API
-- WARNING: This is for development/testing only. Do NOT use in production!

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on exam_centers table if it exists
ALTER TABLE exam_centers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on areas table if it exists
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'exam_centers', 'areas');

-- To re-enable RLS later, use:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exam_centers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE areas ENABLE ROW LEVEL SECURITY; 