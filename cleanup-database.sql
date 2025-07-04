-- Cleanup Script - Run this FIRST in your Supabase SQL Editor
-- This will remove all existing policies and tables to start fresh

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own exams" ON user_exams;
DROP POLICY IF EXISTS "Users can insert own exams" ON user_exams;
DROP POLICY IF EXISTS "Admins can view all user exams" ON user_exams;
DROP POLICY IF EXISTS "All authenticated users can view active exams" ON exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
DROP POLICY IF EXISTS "Public resources are viewable by all" ON resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;
DROP POLICY IF EXISTS "Gallery is viewable by all authenticated users" ON gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public gallery access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage gallery" ON storage.objects;

-- Drop all tables (this will also remove any policies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS gallery CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS user_exams CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS exam_centers CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS gender CASCADE;
DROP TYPE IF EXISTS exam_type CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS user_exam_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS progress_status CASCADE;
DROP TYPE IF EXISTS book_status CASCADE;
DROP TYPE IF EXISTS book_type CASCADE;
DROP TYPE IF EXISTS file_type CASCADE;
DROP TYPE IF EXISTS resource_category CASCADE;
DROP TYPE IF EXISTS gallery_category CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_serial_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove storage buckets
DELETE FROM storage.buckets WHERE id IN ('certificates', 'gallery', 'resources', 'profiles');

-- Reset sequences if any
-- (PostgreSQL will handle this automatically when we recreate tables) 