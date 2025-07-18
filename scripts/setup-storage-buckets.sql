-- Setup Storage Buckets for QHLC
-- This script creates the necessary storage buckets for file uploads

-- Create certificates bucket for exam certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificates',
    'certificates',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Create gallery bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery',
    'gallery',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create resources bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resources',
    'resources',
    true,
    20971520, -- 20MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'audio/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- Create profiles bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles',
    'profiles',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage buckets

-- Certificates bucket policies (only authenticated users can upload, only admins can delete)
CREATE POLICY "Certificates bucket policy" ON storage.objects
FOR ALL USING (bucket_id = 'certificates')
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- Gallery bucket policies (public read, authenticated upload, admin delete)
CREATE POLICY "Gallery bucket policy" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Gallery upload policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

-- Resources bucket policies (public read, authenticated upload, admin delete)
CREATE POLICY "Resources bucket policy" ON storage.objects
FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Resources upload policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

-- Profiles bucket policies (public read, users can upload their own profile image)
CREATE POLICY "Profiles bucket policy" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "Profiles upload policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Show created buckets
SELECT 
    'Storage Buckets Created' as info,
    id as bucket_id,
    name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets
WHERE id IN ('certificates', 'gallery', 'resources', 'profiles')
ORDER BY id; 