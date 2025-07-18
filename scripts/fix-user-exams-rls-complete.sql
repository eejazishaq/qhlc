-- Complete fix for user_exams RLS policies
-- Run this in your Supabase SQL Editor

-- Step 1: Temporarily disable RLS to clear any problematic policies
ALTER TABLE user_exams DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on user_exams table
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

-- Step 3: Re-enable RLS
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

-- Step 4: Create comprehensive policies

-- Policy 1: Users can view their own exam attempts
CREATE POLICY "Users can view their own exam attempts" ON user_exams
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy 2: Users can insert their own exam attempts
CREATE POLICY "Users can insert their own exam attempts" ON user_exams
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy 3: Users can update their own exam attempts
CREATE POLICY "Users can update their own exam attempts" ON user_exams
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy 4: Admins can view all exam attempts
CREATE POLICY "Admins can view all exam attempts" ON user_exams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id::text = auth.uid()::text
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Policy 5: Admins can update all exam attempts
CREATE POLICY "Admins can update all exam attempts" ON user_exams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id::text = auth.uid()::text
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Policy 6: Admins can insert exam attempts for any user
CREATE POLICY "Admins can insert exam attempts for any user" ON user_exams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id::text = auth.uid()::text
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Step 5: Grant necessary permissions
GRANT ALL ON user_exams TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 6: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'user_exams'
ORDER BY policyname; 