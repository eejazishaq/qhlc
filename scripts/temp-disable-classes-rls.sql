-- Temporarily disable RLS for Classes Table (FOR TESTING ONLY)
-- WARNING: This is for development/testing only. Do NOT use in production!

-- Disable RLS on classes table
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'classes';

-- Test if we can now access the classes table
SELECT COUNT(*) FROM classes;

-- To re-enable RLS later, use:
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY; 