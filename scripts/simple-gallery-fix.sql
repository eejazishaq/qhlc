-- Simple Gallery RLS Fix
-- This script provides a quick fix for the gallery upload issue

-- Option 1: Temporarily disable RLS on gallery table (for testing)
-- ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a very permissive policy (recommended for development)
-- First, drop any existing policies
DROP POLICY IF EXISTS "Gallery read policy" ON gallery;
DROP POLICY IF EXISTS "Gallery insert policy" ON gallery;
DROP POLICY IF EXISTS "Gallery update policy" ON gallery;
DROP POLICY IF EXISTS "Gallery delete policy" ON gallery;
DROP POLICY IF EXISTS "Enable read access for all users" ON gallery;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON gallery;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON gallery;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON gallery;
DROP POLICY IF EXISTS "Gallery RLS Policy" ON gallery;

-- Create a simple policy that allows all authenticated users to do everything
CREATE POLICY "Gallery all access" ON gallery
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Also fix resources table with the same approach
DROP POLICY IF EXISTS "Resources read policy" ON resources;
DROP POLICY IF EXISTS "Resources insert policy" ON resources;
DROP POLICY IF EXISTS "Resources update policy" ON resources;
DROP POLICY IF EXISTS "Resources delete policy" ON resources;
DROP POLICY IF EXISTS "Enable read access for all users" ON resources;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON resources;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON resources;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON resources;
DROP POLICY IF EXISTS "Resources RLS Policy" ON resources;

CREATE POLICY "Resources all access" ON resources
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Show the updated policies
SELECT 
    'Fixed Policies' as status,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('gallery', 'resources') 
AND schemaname = 'public'
ORDER BY tablename, policyname; 