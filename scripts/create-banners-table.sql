-- Create banners table for admin-managed banners
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

-- Create index for active banners
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_display_order ON banners(display_order);

-- Add trigger for updated_at
CREATE TRIGGER trigger_update_banners_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample banners (optional)
INSERT INTO banners (title, description, image_url, link_url, is_active, display_order) VALUES
('Welcome to QHLC', 'Start your Quranic learning journey today', '/api/storage/banners/welcome-banner.jpg', '/register', true, 1),
('New Exam Available', 'Check out our latest Quran memorization exam', '/api/storage/banners/exam-banner.jpg', '/exams', true, 2); 