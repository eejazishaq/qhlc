-- Test script to check user_exams RLS policies and table structure
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_exams';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_exams';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_exams'
ORDER BY ordinal_position;

-- Check user_exam_status enum values
SELECT unnest(enum_range(NULL::user_exam_status)) as enum_values;

-- Test inserting a record (this will fail but show the exact error)
-- Replace 'your-user-id' with an actual user ID from your profiles table
-- INSERT INTO user_exams (user_id, exam_id, status, started_at, total_score) 
-- VALUES ('your-user-id', 'your-exam-id', 'pending', NOW(), 0); 