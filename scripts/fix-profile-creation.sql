-- Fix Profile Creation Issue
-- This script diagnoses and fixes the profile creation problem

-- Step 1: Check current profiles table structure
SELECT 
    'Current Profiles Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check RLS policies on profiles table
SELECT 
    'RLS Policies on Profiles' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 3: Check if RLS is enabled on profiles table
SELECT 
    'RLS Status on Profiles' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 4: Check existing users without profiles
SELECT 
    'Users without Profiles' as info,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Step 5: Create missing profiles for existing users
DO $$
DECLARE
    user_record RECORD;
    area_id UUID;
    center_id UUID;
BEGIN
    -- Get a default area and center
    SELECT id INTO area_id FROM areas LIMIT 1;
    SELECT id INTO center_id FROM exam_centers LIMIT 1;
    
    -- Loop through users without profiles
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Create profile for this user
        INSERT INTO profiles (
            id,
            full_name,
            mobile,
            whatsapp_no,
            gender,
            user_type,
            area_id,
            center_id,
            serial_number,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', 'User ' || user_record.id::text),
            COALESCE(user_record.raw_user_meta_data->>'mobile', '+966500000000'),
            NULL,
            'male', -- default gender
            'user',
            area_id,
            center_id,
            'QHLC-' || LPAD(user_record.id::text, 5, '0'),
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$;

-- Step 6: Fix RLS policies to allow profile creation during signup
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies that allow profile creation
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to create profiles (for signup)
CREATE POLICY "Allow profile creation during signup" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 7: Show final results
SELECT 
    'Profile Creation Fixed' as info,
    'Total Users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Profile Creation Fixed',
    'Users with Profiles',
    COUNT(*)
FROM profiles
UNION ALL
SELECT 
    'Profile Creation Fixed',
    'Users without Profiles',
    COUNT(*)
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Step 8: Show recent profiles
SELECT 
    'Recent Profiles' as info,
    p.full_name,
    p.mobile,
    p.user_type,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10; 