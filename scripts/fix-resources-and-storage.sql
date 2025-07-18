-- Comprehensive Fix for Resources and Storage Issues
-- This script fixes all known issues with resources management and file uploads

-- Step 1: Fix Resources Table Structure
-- ======================================

-- Create file_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('pdf', 'video', 'audio', 'image');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create resource_category enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE resource_category AS ENUM ('study', 'exam', 'certificate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type file_type NOT NULL,
    file_size INTEGER,
    category resource_category NOT NULL,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ BEGIN
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);

-- Step 2: Fix RLS Policies for Resources
-- ======================================

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resources are viewable by all" ON resources;
DROP POLICY IF EXISTS "Users can view own uploaded resources" ON resources;
DROP POLICY IF EXISTS "Users can upload resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON resources;
DROP POLICY IF EXISTS "Public resources are viewable by all" ON resources;
DROP POLICY IF EXISTS "Users can update own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete own resources" ON resources;
DROP POLICY IF EXISTS "Resources read policy" ON resources;
DROP POLICY IF EXISTS "Resources insert policy" ON resources;
DROP POLICY IF EXISTS "Resources update policy" ON resources;
DROP POLICY IF EXISTS "Resources delete policy" ON resources;
DROP POLICY IF EXISTS "Resources all access" ON resources;

-- Create comprehensive RLS policies
-- Public resources are viewable by all
CREATE POLICY "Public resources are viewable by all" ON resources
    FOR SELECT USING (is_public = true);

-- Users can view their own uploaded resources
CREATE POLICY "Users can view own uploaded resources" ON resources
    FOR SELECT USING (uploaded_by = auth.uid());

-- Users can upload resources (only admins)
CREATE POLICY "Users can upload resources" ON resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can manage all resources
CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Users can update their own resources
CREATE POLICY "Users can update own resources" ON resources
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Users can delete their own resources
CREATE POLICY "Users can delete own resources" ON resources
    FOR DELETE USING (uploaded_by = auth.uid());

-- Step 3: Fix Storage Buckets
-- ===========================

-- Create storage buckets if they don't exist
-- Note: This requires the storage extension to be enabled
-- The actual bucket creation will be handled by the API

-- Step 4: Fix Storage Policies
-- ============================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Certificates bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Gallery bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Gallery upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Resources bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Resources upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Profiles bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Profiles upload policy" ON storage.objects;

-- Create storage policies for resources bucket
CREATE POLICY "Resources bucket policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Resources upload policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Resources update policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Resources delete policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

-- Create storage policies for gallery bucket
CREATE POLICY "Gallery bucket policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Gallery upload policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Gallery update policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Gallery delete policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');

-- Create storage policies for profiles bucket
CREATE POLICY "Profiles bucket policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Profiles upload policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Profiles update policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Profiles delete policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Create storage policies for certificates bucket
CREATE POLICY "Certificates bucket policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Certificates upload policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Certificates update policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Certificates delete policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- Step 5: Insert Sample Data (Optional)
-- =====================================

-- Insert a sample resource for testing
INSERT INTO resources (title, description, file_url, file_type, file_size, category, is_public, uploaded_by)
SELECT 
    'Sample Study Material',
    'This is a sample study material for testing purposes.',
    'https://example.com/sample.pdf',
    'pdf',
    1024000,
    'study',
    true,
    p.id
FROM profiles p 
WHERE p.user_type IN ('admin', 'super_admin') 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 6: Show Results
-- ====================

SELECT '=== RESOURCES AND STORAGE FIX COMPLETED ===' as status;

-- Show resources table structure
SELECT 
    'Resources Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'resources' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show resources RLS policies
SELECT 
    'Resources RLS Policies' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'resources' 
AND schemaname = 'public'
ORDER BY policyname;

-- Show storage policies
SELECT 
    'Storage Policies' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Show sample resources
SELECT 
    'Sample Resources' as info,
    id,
    title,
    category,
    is_public,
    created_at
FROM resources
ORDER BY created_at DESC
LIMIT 5; 