-- Minimal Schema for Testing - Run this AFTER the cleanup script
-- This creates just the essential tables without complex RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic types
CREATE TYPE user_type AS ENUM ('user', 'coordinator', 'convener', 'admin', 'super_admin');
CREATE TYPE gender AS ENUM ('male', 'female');

-- Create basic tables
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exam_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    capacity INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_exams table
CREATE TABLE user_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    total_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_profiles_mobile ON profiles(mobile);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_user_exams_user_id ON user_exams(user_id);
CREATE INDEX idx_user_exams_exam_id ON user_exams(exam_id);

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

-- Insert sample data
INSERT INTO countries (name, code) VALUES ('Saudi Arabia', 'SA');

INSERT INTO regions (country_id, name, code) 
SELECT id, 'Riyadh Region', 'RYD' FROM countries WHERE code = 'SA';

INSERT INTO areas (region_id, name, code)
SELECT r.id, 'Riyadh City', 'RYD-01' FROM regions r WHERE r.code = 'RYD';

INSERT INTO exam_centers (area_id, name, address, contact_person, contact_phone, capacity)
SELECT a.id, 'QHLC Riyadh Center', 'King Fahd Road, Riyadh', 'Ahmed Al-Rashid', '+966501234567', 200
FROM areas a WHERE a.code = 'RYD-01';

INSERT INTO exams (title, description, duration, total_marks, passing_marks, status, start_date, end_date)
VALUES (
    'Quran Memorization Test - Level 1',
    'Basic Quran memorization test covering first 5 surahs',
    60,
    100,
    70,
    'active',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '30 days'
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', false);

-- NO RLS POLICIES FOR NOW - We'll add them later after testing 