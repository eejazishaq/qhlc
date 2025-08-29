-- Create Classes Table for QHLC Class Management
-- This table stores class information with teacher details, location, and contact info

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    teacher_name TEXT NOT NULL,
    area_id UUID REFERENCES areas(id),
    center_id UUID REFERENCES exam_centers(id),
    address TEXT NOT NULL,
    google_map_link TEXT,
    contact_number TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_area_id ON classes(area_id);
CREATE INDEX IF NOT EXISTS idx_classes_center_id ON classes(center_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_name ON classes(teacher_name);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_classes_updated_at();

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can view all classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert classes" ON classes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update classes" ON classes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete classes" ON classes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Insert sample data for testing (optional)
INSERT INTO classes (
    title, 
    description, 
    subject, 
    teacher_name, 
    area_id, 
    center_id, 
    address, 
    google_map_link, 
    contact_number, 
    email, 
    status
) VALUES 
(
    'Quran Memorization Class',
    'Weekly Quran memorization class for beginners and intermediate students',
    'Quran Studies',
    'Sheikh Ahmed Al-Rashid',
    (SELECT id FROM areas WHERE name = 'Riyadh City' LIMIT 1),
    (SELECT id FROM exam_centers WHERE name = 'QHLC Riyadh Center' LIMIT 1),
    'King Fahd Road, Riyadh, Saudi Arabia',
    'https://maps.google.com/?q=King+Fahd+Road+Riyadh',
    '+966501234567',
    'ahmed.alrashid@qhlc.edu.sa',
    'active'
),
(
    'Islamic Studies Advanced',
    'Advanced level Islamic studies covering fiqh, hadith, and Islamic history',
    'Islamic Studies',
    'Dr. Fatima Al-Zahra',
    (SELECT id FROM areas WHERE name = 'Jeddah City' LIMIT 1),
    (SELECT id FROM exam_centers WHERE name = 'QHLC Jeddah Center' LIMIT 1),
    'Corniche Road, Jeddah, Saudi Arabia',
    'https://maps.google.com/?q=Corniche+Road+Jeddah',
    '+966502345678',
    'fatima.alzahra@qhlc.edu.sa',
    'active'
);

-- Show the created table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM classes; 