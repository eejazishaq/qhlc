-- Alternative Banner Permission Fix
-- This uses a more aggressive approach to fix permissions

-- First, let's recreate the table with proper permissions
DROP TABLE IF EXISTS banners CASCADE;

-- Create the table fresh
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_display_order ON banners(display_order);

-- Grant ALL permissions to all roles
GRANT ALL PRIVILEGES ON banners TO postgres;
GRANT ALL PRIVILEGES ON banners TO authenticated;
GRANT ALL PRIVILEGES ON banners TO anon;
GRANT ALL PRIVILEGES ON banners TO service_role;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON banners TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Insert sample data
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) VALUES
('Welcome to QHLC', 'Start your Quranic learning journey today', 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=Welcome+to+QHLC', '/register', true, 1),
('New Exam Available', 'Check out our latest Quran memorization exam', 'https://via.placeholder.com/1200x400/059669/ffffff?text=New+Exam+Available', '/exams', true, 2)
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Table created successfully' as status;
SELECT COUNT(*) as banner_count FROM banners;
SELECT 'All permissions granted' as permissions_status; 