-- Fix RLS policies for user_exams table
-- Run this in your Supabase SQL Editor

-- Enable RLS on user_exams table
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can insert their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can update their own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can update all exam attempts" ON user_exams;

-- Create policy for users to view their own exam attempts
CREATE POLICY "Users can view their own exam attempts" ON user_exams
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own exam attempts
CREATE POLICY "Users can insert their own exam attempts" ON user_exams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own exam attempts
CREATE POLICY "Users can update their own exam attempts" ON user_exams
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for admins to view all exam attempts
CREATE POLICY "Admins can view all exam attempts" ON user_exams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Create policy for admins to update all exam attempts
CREATE POLICY "Admins can update all exam attempts" ON user_exams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Create policy for admins to insert exam attempts for any user
CREATE POLICY "Admins can insert exam attempts for any user" ON user_exams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Grant necessary permissions
GRANT ALL ON user_exams TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 