-- Fix Gallery RLS Policies
-- This script fixes the RLS policies for the gallery table to allow admin users to insert records

-- First, let's check the current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'gallery' 
AND schemaname = 'public'
ORDER BY policyname;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON gallery;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON gallery;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON gallery;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON gallery;
DROP POLICY IF EXISTS "Gallery RLS Policy" ON gallery;

-- Create new policies that allow admin users to perform all operations
-- Policy 1: Allow all users to read gallery items
CREATE POLICY "Gallery read policy" ON gallery
FOR SELECT USING (true);

-- Policy 2: Allow authenticated users to insert gallery items
CREATE POLICY "Gallery insert policy" ON gallery
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow users to update their own gallery items or admin users to update any
CREATE POLICY "Gallery update policy" ON gallery
FOR UPDATE USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- Policy 4: Allow users to delete their own gallery items or admin users to delete any
CREATE POLICY "Gallery delete policy" ON gallery
FOR DELETE USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- Also fix the resources table RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON resources;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON resources;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON resources;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON resources;
DROP POLICY IF EXISTS "Resources RLS Policy" ON resources;

-- Create new policies for resources table
CREATE POLICY "Resources read policy" ON resources
FOR SELECT USING (true);

CREATE POLICY "Resources insert policy" ON resources
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Resources update policy" ON resources
FOR UPDATE USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Resources delete policy" ON resources
FOR DELETE USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- Show the updated policies
SELECT 
    'Updated Gallery Policies' as table_name,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('gallery', 'resources') 
AND schemaname = 'public'
ORDER BY tablename, policyname; 