-- Quick Banner Setup - Run this in Supabase SQL Editor

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
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
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can read active banners" ON banners
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can read all banners" ON banners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert banners" ON banners
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update banners" ON banners
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete banners" ON banners
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Insert sample data
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) VALUES
('Welcome to QHLC', 'Start your Quranic learning journey today', 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=Welcome+to+QHLC', '/register', true, 1),
('New Exam Available', 'Check out our latest Quran memorization exam', 'https://via.placeholder.com/1200x400/059669/ffffff?text=New+Exam+Available', '/exams', true, 2)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON banners TO anon;
GRANT SELECT ON banners TO authenticated;
GRANT ALL ON banners TO authenticated; 