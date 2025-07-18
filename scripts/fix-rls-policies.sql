-- QHLC Fix RLS Policies Script
-- This script fixes RLS policy issues that prevent access to existing tables
-- Run this to ensure all tables are accessible

-- First, let's check what tables exist and their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'countries',
    'regions', 
    'areas',
    'exam_centers',
    'profiles',
    'exams',
    'questions',
    'user_exams',
    'user_answers',
    'attendance',
    'progress',
    'books',
    'resources',
    'gallery',
    'certificates',
    'audit_logs',
    'notifications'
)
ORDER BY tablename;

-- Check existing RLS policies
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
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'exams',
    'questions',
    'user_exams',
    'user_answers',
    'attendance',
    'progress',
    'books',
    'resources',
    'gallery',
    'certificates',
    'notifications'
)
ORDER BY tablename, policyname;

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own exams" ON user_exams;
DROP POLICY IF EXISTS "Users can create own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can update own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Admins can view all exams" ON user_exams;

DROP POLICY IF EXISTS "Users can view own answers" ON user_answers;
DROP POLICY IF EXISTS "Users can create own answers" ON user_answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON user_answers;

DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Coordinators can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;

DROP POLICY IF EXISTS "Users can view own progress" ON progress;
DROP POLICY IF EXISTS "Coordinators can manage progress" ON progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON progress;

DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Coordinators can manage books" ON books;
DROP POLICY IF EXISTS "Admins can view all books" ON books;

DROP POLICY IF EXISTS "Public resources are viewable by all" ON resources;
DROP POLICY IF EXISTS "Users can view own uploaded resources" ON resources;
DROP POLICY IF EXISTS "Users can upload resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON resources;

DROP POLICY IF EXISTS "Gallery is viewable by all" ON gallery;
DROP POLICY IF EXISTS "Users can upload to gallery" ON gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;

DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;

-- Create comprehensive RLS policies for all tables

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- User exams policies
CREATE POLICY "Users can view own exams" ON user_exams
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own exam attempts" ON user_exams
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exam attempts" ON user_exams
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all exams" ON user_exams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- User answers policies
CREATE POLICY "Users can view own answers" ON user_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_exams 
            WHERE id = user_answers.user_exam_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own answers" ON user_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_exams 
            WHERE id = user_answers.user_exam_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all answers" ON user_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Coordinators can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('coordinator', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Progress policies
CREATE POLICY "Users can view own progress" ON progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Coordinators can manage progress" ON progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('coordinator', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all progress" ON progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Books policies
CREATE POLICY "Users can view own books" ON books
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Coordinators can manage books" ON books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('coordinator', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all books" ON books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Resources policies (most permissive for public access)
CREATE POLICY "Public resources are viewable by all" ON resources
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own uploaded resources" ON resources
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload resources" ON resources
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Gallery policies (public read, authenticated write)
CREATE POLICY "Gallery is viewable by all" ON gallery
    FOR SELECT USING (true);

CREATE POLICY "Users can upload to gallery" ON gallery
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage gallery" ON gallery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Certificates policies
CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage certificates" ON certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Test access to problematic tables
SELECT 'Testing resources table access...' as test;
SELECT COUNT(*) as resources_count FROM resources LIMIT 1;

SELECT 'Testing gallery table access...' as test;
SELECT COUNT(*) as gallery_count FROM gallery LIMIT 1;

-- Success message
SELECT 'RLS policies fixed successfully! All tables should now be accessible.' as status; 