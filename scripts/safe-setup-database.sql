-- QHLC Safe Database Setup Script
-- This script safely sets up the database without overwriting existing tables
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('user', 'coordinator', 'convener', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_type AS ENUM ('mock', 'regular', 'final');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('draft', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_exam_status AS ENUM ('pending', 'completed', 'evaluated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('memorized', 'reviewing', 'learning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE book_status AS ENUM ('issued', 'returned', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE book_type AS ENUM ('quran', 'tafseer', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('pdf', 'video', 'audio', 'image');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_category AS ENUM ('study', 'exam', 'certificate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gallery_category AS ENUM ('events', 'activities', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create countries table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create areas table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_centers table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS exam_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    capacity INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    whatsapp_no TEXT,
    gender gender NOT NULL,
    user_type user_type DEFAULT 'user',
    area_id UUID REFERENCES areas(id),
    center_id UUID REFERENCES exam_centers(id),
    father_name TEXT,
    dob DATE,
    iqama_number TEXT,
    serial_number TEXT UNIQUE,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    exam_type exam_type NOT NULL,
    status exam_status DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB, -- for multiple choice questions
    correct_answer TEXT NOT NULL,
    type TEXT NOT NULL, -- 'mcq', 'truefalse', 'text'
    marks INTEGER NOT NULL DEFAULT 1,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_exams table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status user_exam_status DEFAULT 'pending',
    total_score INTEGER,
    evaluator_id UUID REFERENCES profiles(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_answers table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_exam_id UUID REFERENCES user_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_correct BOOLEAN,
    score_awarded INTEGER DEFAULT 0,
    evaluated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    center_id UUID REFERENCES exam_centers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES profiles(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    surah_number INTEGER NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
    ayah_start INTEGER NOT NULL,
    ayah_end INTEGER NOT NULL,
    status progress_status NOT NULL,
    notes TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_type book_type NOT NULL,
    title TEXT NOT NULL,
    issued_date DATE NOT NULL,
    return_date DATE NOT NULL,
    returned_date DATE,
    status book_status DEFAULT 'issued',
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table (only if it doesn't exist)
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
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category gallery_category NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_center_id ON profiles(center_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_user_id ON user_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_exam_id ON user_exams(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_status ON user_exams(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_center_id ON attendance(center_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_type ON exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_exam_id ON user_answers(user_exam_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create sequence for serial numbers (only if it doesn't exist)
CREATE SEQUENCE IF NOT EXISTS serial_number_seq START 1;

-- Function to generate serial number (only if it doesn't exist)
CREATE OR REPLACE FUNCTION generate_serial_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.serial_number := 'QHLC-' || LPAD(CAST(nextval('serial_number_seq') AS TEXT), 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_generate_serial_number ON profiles;
CREATE TRIGGER trigger_generate_serial_number
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_serial_number();

-- Function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist and recreate
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_exams_updated_at ON exams;
CREATE TRIGGER trigger_update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data only if it doesn't exist
INSERT INTO countries (name, code) 
SELECT 'Saudi Arabia', 'SA'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE code = 'SA');

INSERT INTO regions (country_id, name, code) 
SELECT 
    (SELECT id FROM countries WHERE code = 'SA'),
    'Riyadh Region',
    'RYD'
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE code = 'RYD');

INSERT INTO regions (country_id, name, code) 
SELECT 
    (SELECT id FROM countries WHERE code = 'SA'),
    'Makkah Region',
    'MKK'
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE code = 'MKK');

INSERT INTO regions (country_id, name, code) 
SELECT 
    (SELECT id FROM countries WHERE code = 'SA'),
    'Eastern Province',
    'EAS'
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE code = 'EAS');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'RYD'),
    'Riyadh City',
    'RYD-01'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'RYD-01');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'RYD'),
    'Al Kharj',
    'RYD-02'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'RYD-02');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'MKK'),
    'Makkah City',
    'MKK-01'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'MKK-01');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'MKK'),
    'Jeddah',
    'MKK-02'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'MKK-02');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'EAS'),
    'Dammam',
    'EAS-01'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'EAS-01');

INSERT INTO areas (region_id, name, code) 
SELECT 
    (SELECT id FROM regions WHERE code = 'EAS'),
    'Al Khobar',
    'EAS-02'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE code = 'EAS-02');

INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity) 
SELECT 
    (SELECT id FROM areas WHERE code = 'RYD-01'),
    'QHLC Riyadh Main Center',
    'King Fahd Road, Riyadh',
    'Ahmed Al-Rashid',
    '+966-11-123-4567',
    200
WHERE NOT EXISTS (SELECT 1 FROM exam_centers WHERE name = 'QHLC Riyadh Main Center');

INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity) 
SELECT 
    (SELECT id FROM areas WHERE code = 'MKK-01'),
    'QHLC Makkah Center',
    'Al Haram Street, Makkah',
    'Mohammed Al-Zahrani',
    '+966-12-234-5678',
    150
WHERE NOT EXISTS (SELECT 1 FROM exam_centers WHERE name = 'QHLC Makkah Center');

INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity) 
SELECT 
    (SELECT id FROM areas WHERE code = 'EAS-01'),
    'QHLC Dammam Center',
    'King Abdulaziz Road, Dammam',
    'Abdullah Al-Sheikh',
    '+966-13-345-6789',
    180
WHERE NOT EXISTS (SELECT 1 FROM exam_centers WHERE name = 'QHLC Dammam Center');

-- Create storage buckets (only if they don't exist)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'certificates', 'certificates', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certificates');

INSERT INTO storage.buckets (id, name, public) 
SELECT 'gallery', 'gallery', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'gallery');

INSERT INTO storage.buckets (id, name, public) 
SELECT 'resources', 'resources', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resources');

INSERT INTO storage.buckets (id, name, public) 
SELECT 'profiles', 'profiles', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profiles');

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

-- Drop existing policies and recreate them (to ensure they're up to date)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own exams" ON user_exams;
DROP POLICY IF EXISTS "Users can create own exam attempts" ON user_exams;
DROP POLICY IF EXISTS "Users can update own exam attempts" ON user_exams;

DROP POLICY IF EXISTS "Public resources are viewable by all" ON resources;
DROP POLICY IF EXISTS "Users can view own uploaded resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON resources;

DROP POLICY IF EXISTS "Gallery is viewable by all" ON gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view own exams" ON user_exams
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own exam attempts" ON user_exams
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exam attempts" ON user_exams
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public resources are viewable by all" ON resources
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own uploaded resources" ON resources
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Gallery is viewable by all" ON gallery
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery" ON gallery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create helper functions (only if they don't exist)
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    mobile TEXT,
    whatsapp_no TEXT,
    gender gender,
    user_type user_type,
    area_id UUID,
    center_id UUID,
    father_name TEXT,
    dob DATE,
    iqama_number TEXT,
    serial_number TEXT,
    profile_image TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.mobile,
        p.whatsapp_no,
        p.gender,
        p.user_type,
        p.area_id,
        p.center_id,
        p.father_name,
        p.dob,
        p.iqama_number,
        p.serial_number,
        p.profile_image,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS TABLE (
    total_exams BIGINT,
    certificates BIGINT,
    study_hours INTEGER,
    progress_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(exam_count.count, 0)::BIGINT as total_exams,
        COALESCE(cert_count.count, 0)::BIGINT as certificates,
        COALESCE(study_hours.total_duration, 0)::INTEGER as study_hours,
        COALESCE(progress_stats.percentage, 0)::INTEGER as progress_percentage
    FROM 
        (SELECT COUNT(*) as count FROM user_exams WHERE user_id = user_uuid) exam_count,
        (SELECT COUNT(*) as count FROM certificates WHERE user_id = user_uuid) cert_count,
        (SELECT COALESCE(SUM(e.duration), 0) as total_duration 
         FROM user_exams ue 
         JOIN exams e ON ue.exam_id = e.id 
         WHERE ue.user_id = user_uuid AND ue.status = 'completed') study_hours,
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'memorized')::DECIMAL / COUNT(*)::DECIMAL) * 100)
            END as percentage
         FROM progress 
         WHERE user_id = user_uuid) progress_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'QHLC Database setup completed successfully! All existing tables were preserved.' as status; 