-- Fix RLS policies for certificates table
-- This script enables users to create and manage their own certificates

-- First, check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'certificates';

-- Enable RLS if not already enabled
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON certificates;

-- Create policy for users to view their own certificates
CREATE POLICY "Users can view their own certificates" ON certificates
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own certificates
CREATE POLICY "Users can insert their own certificates" ON certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own certificates
CREATE POLICY "Users can update their own certificates" ON certificates
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own certificates
CREATE POLICY "Users can delete their own certificates" ON certificates
    FOR DELETE USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'certificates';

-- Test the policies
-- This should show the current user's certificates
SELECT * FROM certificates WHERE user_id = auth.uid(); 