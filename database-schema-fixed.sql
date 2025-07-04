-- QHLC Database Schema (Fixed Version)
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('user', 'coordinator', 'convener', 'admin', 'super_admin');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE exam_type AS ENUM ('mock', 'regular', 'final');
CREATE TYPE exam_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE user_exam_status AS ENUM ('pending', 'completed', 'evaluated');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE progress_status AS ENUM ('memorized', 'reviewing', 'learning');
CREATE TYPE book_status AS ENUM ('issued', 'returned', 'overdue');
CREATE TYPE book_type AS ENUM ('quran', 'tafseer', 'other');
CREATE TYPE file_type AS ENUM ('pdf', 'video', 'audio', 'image');
CREATE TYPE resource_category AS ENUM ('study', 'exam', 'certificate');
CREATE TYPE gallery_category AS ENUM ('events', 'activities', 'other');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- Create countries table
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regions table
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create areas table
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_centers table
CREATE TABLE exam_centers (
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

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
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

-- Create exams table
CREATE TABLE exams (
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

-- Create questions table
CREATE TABLE questions (
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

-- Create user_exams table
CREATE TABLE user_exams (
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

-- Create user_answers table
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_exam_id UUID REFERENCES user_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_correct BOOLEAN,
    score_awarded INTEGER DEFAULT 0,
    evaluated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    center_id UUID REFERENCES exam_centers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES profiles(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table
CREATE TABLE progress (
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

-- Create books table
CREATE TABLE books (
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

-- Create resources table
CREATE TABLE resources (
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

-- Create gallery table
CREATE TABLE gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category gallery_category NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    issued_date DATE NOT NULL,
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
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

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_mobile ON profiles(mobile);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_center_id ON profiles(center_id);
CREATE INDEX idx_user_exams_user_id ON user_exams(user_id);
CREATE INDEX idx_user_exams_exam_id ON user_exams(exam_id);
CREATE INDEX idx_user_exams_status ON user_exams(status);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_center_id ON attendance(center_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_type ON exams(exam_type);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_user_answers_user_exam_id ON user_answers(user_exam_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create function to generate serial number
CREATE OR REPLACE FUNCTION generate_serial_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.serial_number := 'QHLC-' || LPAD(NEW.id::text, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for serial number generation
CREATE TRIGGER trigger_generate_serial_number
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_serial_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Insert Saudi Arabia
INSERT INTO countries (name, code) VALUES ('Saudi Arabia', 'SA');

-- Insert regions
INSERT INTO regions (country_id, name, code) 
SELECT id, 'Riyadh Region', 'RYD' FROM countries WHERE code = 'SA';

INSERT INTO regions (country_id, name, code) 
SELECT id, 'Makkah Region', 'MKK' FROM countries WHERE code = 'SA';

-- Insert areas
INSERT INTO areas (region_id, name, code)
SELECT r.id, 'Riyadh City', 'RYD-01' FROM regions r WHERE r.code = 'RYD';

INSERT INTO areas (region_id, name, code)
SELECT r.id, 'Jeddah City', 'JED-01' FROM regions r WHERE r.code = 'MKK';

-- Insert exam centers
INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity)
SELECT a.id, 'QHLC Riyadh Center', 'King Fahd Road, Riyadh', 'Ahmed Al-Rashid', '+966501234567', 200
FROM areas a WHERE a.code = 'RYD-01';

INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity)
SELECT a.id, 'QHLC Jeddah Center', 'Corniche Road, Jeddah', 'Fatima Al-Zahra', '+966507654321', 150
FROM areas a WHERE a.code = 'JED-01';

-- Insert sample exam
INSERT INTO exams (title, description, duration, total_marks, passing_marks, exam_type, status, start_date, end_date, created_by)
VALUES (
    'Quran Memorization Test - Level 1',
    'Basic Quran memorization test covering first 5 surahs',
    60,
    100,
    70,
    'regular',
    'active',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    NULL -- Will be set when admin creates
);

-- Insert sample questions
INSERT INTO questions (exam_id, question_text, options, correct_answer, type, marks, order_number)
SELECT 
    e.id,
    'Which surah is known as the "Opening" of the Quran?',
    '["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"]',
    'Al-Fatiha',
    'mcq',
    10,
    1
FROM exams e WHERE e.title = 'Quran Memorization Test - Level 1';

INSERT INTO questions (exam_id, question_text, options, correct_answer, type, marks, order_number)
SELECT 
    e.id,
    'How many verses are in Surah Al-Fatiha?',
    '["5", "6", "7", "8"]',
    '7',
    'mcq',
    10,
    2
FROM exams e WHERE e.title = 'Quran Memorization Test - Level 1';

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable Row Level Security (RLS) - SIMPLIFIED VERSION
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
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SIMPLIFIED RLS POLICIES (to avoid recursion)

-- Profiles policies - allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);

-- User exams policies
CREATE POLICY "Allow all operations on user_exams" ON user_exams FOR ALL USING (true);

-- Exams policies
CREATE POLICY "Allow all operations on exams" ON exams FOR ALL USING (true);

-- Questions policies
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true);

-- User answers policies
CREATE POLICY "Allow all operations on user_answers" ON user_answers FOR ALL USING (true);

-- Attendance policies
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);

-- Progress policies
CREATE POLICY "Allow all operations on progress" ON progress FOR ALL USING (true);

-- Books policies
CREATE POLICY "Allow all operations on books" ON books FOR ALL USING (true);

-- Resources policies
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true);

-- Gallery policies
CREATE POLICY "Allow all operations on gallery" ON gallery FOR ALL USING (true);

-- Certificates policies
CREATE POLICY "Allow all operations on certificates" ON certificates FOR ALL USING (true);

-- Audit logs policies
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true);

-- Notifications policies
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);

-- Storage policies
CREATE POLICY "Allow all operations on storage" ON storage.objects FOR ALL USING (true); 