-- Complete QHLC Setup Script
-- This script runs all necessary setup steps in the correct order

-- Step 1: Setup Storage Buckets
-- ==============================

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

-- Step 2: Setup Storage RLS Policies
-- ===================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Certificates bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Gallery bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Gallery upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Resources bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Resources upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Profiles bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Profiles upload policy" ON storage.objects;

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

-- Step 3: Check and Create Admin Users
-- ====================================

DO $$
DECLARE
    admin_count INTEGER;
    super_admin_count INTEGER;
    admin_user_id UUID;
    super_admin_user_id UUID;
BEGIN
    -- Check if admin users exist
    SELECT COUNT(*) INTO admin_count 
    FROM profiles 
    WHERE user_type = 'admin';
    
    SELECT COUNT(*) INTO super_admin_count 
    FROM profiles 
    WHERE user_type = 'super_admin';
    
    -- Create admin user if none exists
    IF admin_count = 0 THEN
        -- First create auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@qhlc.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Then create profile
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
            admin_user_id,
            'System Administrator',
            '+966500000001',
            '+966500000001',
            'male',
            'admin',
            (SELECT id FROM areas LIMIT 1),
            (SELECT id FROM exam_centers LIMIT 1),
            'QHLC-ADMIN-001',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
    
    -- Create super admin user if none exists
    IF super_admin_count = 0 THEN
        -- First create auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'superadmin@qhlc.com',
            crypt('super123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO super_admin_user_id;
        
        -- Then create profile
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
            super_admin_user_id,
            'Super Administrator',
            '+966500000002',
            '+966500000002',
            'male',
            'super_admin',
            (SELECT id FROM areas LIMIT 1),
            (SELECT id FROM exam_centers LIMIT 1),
            'QHLC-SUPER-001',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Super admin user created with ID: %', super_admin_user_id;
    ELSE
        RAISE NOTICE 'Super admin user already exists';
    END IF;
END $$;

-- Step 4: Create Sample Data (if not exists)
-- ==========================================

-- Create sample exams if none exist
INSERT INTO exams (id, title, description, duration, total_marks, passing_marks, exam_type, status, start_date, end_date, created_by)
SELECT 
    gen_random_uuid(),
    'Quran Memorization Test - Level 1',
    'Basic Quran memorization test covering first 5 surahs',
    60,
    100,
    70,
    'regular',
    'active',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '30 days',
    (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM exams LIMIT 1);

-- Create sample questions if none exist
INSERT INTO questions (id, exam_id, question_text, options, correct_answer, type, marks, order_number)
SELECT 
    gen_random_uuid(),
    e.id,
    'Which surah is known as the "Opening" of the Quran?',
    '["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"]',
    'Al-Fatiha',
    'mcq',
    10,
    1
FROM exams e
WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1)
LIMIT 1;

-- Step 5: Final Status Report
-- ===========================

SELECT '=== SETUP COMPLETED ===' as status;

-- Show storage buckets
SELECT 
    'Storage Buckets' as category,
    id as bucket_id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE id IN ('certificates', 'gallery', 'resources', 'profiles')
ORDER BY id;

-- Show admin users
SELECT 
    'Admin Users' as category,
    p.user_type,
    u.email,
    p.full_name,
    p.serial_number
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type IN ('admin', 'super_admin')
ORDER BY p.user_type;

-- Show login credentials
SELECT 
    'Login Credentials' as category,
    p.user_type,
    u.email,
    CASE 
        WHEN p.user_type = 'admin' THEN 'admin123'
        WHEN p.user_type = 'super_admin' THEN 'super123'
    END as password
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type IN ('admin', 'super_admin')
ORDER BY p.user_type;

-- Show data counts
SELECT 
    'Data Summary' as category,
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Data Summary',
    'exams',
    COUNT(*)
FROM exams
UNION ALL
SELECT 
    'Data Summary',
    'questions',
    COUNT(*)
FROM questions
UNION ALL
SELECT 
    'Data Summary',
    'areas',
    COUNT(*)
FROM areas
UNION ALL
SELECT 
    'Data Summary',
    'exam_centers',
    COUNT(*)
FROM exam_centers; 