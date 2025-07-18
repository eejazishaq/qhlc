-- Complete fix for user_exams table permissions and RLS
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_exams';

-- Step 2: Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON TABLE user_exams TO authenticated;
GRANT ALL PRIVILEGES ON TABLE user_exams TO anon;
GRANT ALL PRIVILEGES ON TABLE user_exams TO service_role;

-- Step 3: Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 4: Grant sequence permissions (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 5: Temporarily disable RLS completely
ALTER TABLE user_exams DISABLE ROW LEVEL SECURITY;

-- Step 6: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can insert their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can update their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can update all exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can insert exam attempts for any user" ON user_exams;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_exams;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_exams;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_exams;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_exams;

-- Step 7: Re-enable RLS with simple policies
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

-- Step 8: Create simple, permissive policies for testing
CREATE POLICY "Allow all operations for authenticated users" ON user_exams
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Verify the setup
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'user_exams'
ORDER BY policyname;

-- Step 10: Test insert (uncomment and run with a real user_id and exam_id)
-- INSERT INTO user_exams (user_id, exam_id, status, started_at, total_score) 
-- VALUES ('your-user-id', 'your-exam-id', 'pending', NOW(), 0); 