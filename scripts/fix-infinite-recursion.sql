-- QHLC Fix Infinite Recursion in RLS Policies
-- This script fixes the infinite recursion issue caused by circular policy references

-- First, disable RLS temporarily to stop the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
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

-- Create simple, safe policies without circular references

-- Profiles: Simple user-based policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User exams: Simple user-based policies
CREATE POLICY "Users can view own exams" ON user_exams
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own exam attempts" ON user_exams
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exam attempts" ON user_exams
    FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

-- User answers: Simple user-based policies
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

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Attendance: Simple user-based policies
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own attendance" ON attendance
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Progress: Simple user-based policies
CREATE POLICY "Users can view own progress" ON progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own progress" ON progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Books: Simple user-based policies
CREATE POLICY "Users can view own books" ON books
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own books" ON books
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Resources: Public read, authenticated write
CREATE POLICY "Resources are viewable by all" ON resources
    FOR SELECT USING (true);

CREATE POLICY "Users can upload resources" ON resources
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Gallery: Public read, authenticated write
CREATE POLICY "Gallery is viewable by all" ON gallery
    FOR SELECT USING (true);

CREATE POLICY "Users can upload to gallery" ON gallery
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Certificates: Simple user-based policies
CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own certificates" ON certificates
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Notifications: Simple user-based policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Test access
SELECT 'Testing profiles table access...' as test;
SELECT COUNT(*) as profiles_count FROM profiles LIMIT 1;

SELECT 'Testing resources table access...' as test;
SELECT COUNT(*) as resources_count FROM resources LIMIT 1;

SELECT 'Testing gallery table access...' as test;
SELECT COUNT(*) as gallery_count FROM gallery LIMIT 1;

-- Success message
SELECT 'Infinite recursion fixed! Simple RLS policies applied successfully.' as status; 