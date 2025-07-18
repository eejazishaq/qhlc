-- QHLC Setup Initial Data Script
-- This script populates the database with essential initial data
-- Run this after the database schema is set up

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM exam_centers;
-- DELETE FROM areas;
-- DELETE FROM regions;
-- DELETE FROM countries;

-- Insert Saudi Arabia
INSERT INTO countries (id, name, code, is_active) 
VALUES 
    (gen_random_uuid(), 'Saudi Arabia', 'SA', true)
ON CONFLICT (code) DO NOTHING;

-- Get Saudi Arabia ID
DO $$
DECLARE
    saudi_id UUID;
BEGIN
    SELECT id INTO saudi_id FROM countries WHERE code = 'SA';
    
    -- Insert major regions of Saudi Arabia
    INSERT INTO regions (id, country_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), saudi_id, 'Riyadh Region', 'RYD', true),
        (gen_random_uuid(), saudi_id, 'Makkah Region', 'MKK', true),
        (gen_random_uuid(), saudi_id, 'Eastern Province', 'EAS', true),
        (gen_random_uuid(), saudi_id, 'Asir Region', 'ASR', true),
        (gen_random_uuid(), saudi_id, 'Qassim Region', 'QSM', true),
        (gen_random_uuid(), saudi_id, 'Hail Region', 'HAL', true),
        (gen_random_uuid(), saudi_id, 'Tabuk Region', 'TBK', true),
        (gen_random_uuid(), saudi_id, 'Northern Borders', 'NBR', true),
        (gen_random_uuid(), saudi_id, 'Jazan Region', 'JZN', true),
        (gen_random_uuid(), saudi_id, 'Najran Region', 'NJR', true),
        (gen_random_uuid(), saudi_id, 'Al Bahah Region', 'BAH', true),
        (gen_random_uuid(), saudi_id, 'Al Jouf Region', 'JOF', true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Insert areas for each region
DO $$
DECLARE
    ryd_id UUID;
    mkk_id UUID;
    eas_id UUID;
    asr_id UUID;
    qsm_id UUID;
    hal_id UUID;
    tbk_id UUID;
    nbr_id UUID;
    jzn_id UUID;
    njr_id UUID;
    bah_id UUID;
    jof_id UUID;
BEGIN
    -- Get region IDs
    SELECT id INTO ryd_id FROM regions WHERE code = 'RYD';
    SELECT id INTO mkk_id FROM regions WHERE code = 'MKK';
    SELECT id INTO eas_id FROM regions WHERE code = 'EAS';
    SELECT id INTO asr_id FROM regions WHERE code = 'ASR';
    SELECT id INTO qsm_id FROM regions WHERE code = 'QSM';
    SELECT id INTO hal_id FROM regions WHERE code = 'HAL';
    SELECT id INTO tbk_id FROM regions WHERE code = 'TBK';
    SELECT id INTO nbr_id FROM regions WHERE code = 'NBR';
    SELECT id INTO jzn_id FROM regions WHERE code = 'JZN';
    SELECT id INTO njr_id FROM regions WHERE code = 'NJR';
    SELECT id INTO bah_id FROM regions WHERE code = 'BAH';
    SELECT id INTO jof_id FROM regions WHERE code = 'JOF';
    
    -- Riyadh Region Areas
    INSERT INTO areas (id, region_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), ryd_id, 'Riyadh City', 'RYD-01', true),
        (gen_random_uuid(), ryd_id, 'Al Kharj', 'RYD-02', true),
        (gen_random_uuid(), ryd_id, 'Al Diriyah', 'RYD-03', true),
        (gen_random_uuid(), ryd_id, 'Al Majmaah', 'RYD-04', true),
        (gen_random_uuid(), ryd_id, 'Al Zulfi', 'RYD-05', true),
        (gen_random_uuid(), ryd_id, 'Al Ghat', 'RYD-06', true),
        (gen_random_uuid(), ryd_id, 'Al Aflaj', 'RYD-07', true),
        (gen_random_uuid(), ryd_id, 'Al Sulayyil', 'RYD-08', true),
        (gen_random_uuid(), ryd_id, 'Al Duwadmi', 'RYD-09', true),
        (gen_random_uuid(), ryd_id, 'Al Quwayiyah', 'RYD-10', true),
        (gen_random_uuid(), ryd_id, 'Al Rass', 'RYD-11', true),
        (gen_random_uuid(), ryd_id, 'Al Bukayriyah', 'RYD-12', true),
        (gen_random_uuid(), ryd_id, 'Unaizah', 'RYD-13', true),
        (gen_random_uuid(), ryd_id, 'Al Badayea', 'RYD-14', true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Makkah Region Areas
    INSERT INTO areas (id, region_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), mkk_id, 'Makkah Al Mukarramah', 'MKK-01', true),
        (gen_random_uuid(), mkk_id, 'Jeddah', 'MKK-02', true),
        (gen_random_uuid(), mkk_id, 'Taif', 'MKK-03', true),
        (gen_random_uuid(), mkk_id, 'Al Qunfudhah', 'MKK-04', true),
        (gen_random_uuid(), mkk_id, 'Al Lith', 'MKK-05', true),
        (gen_random_uuid(), mkk_id, 'Rabigh', 'MKK-06', true),
        (gen_random_uuid(), mkk_id, 'Al Jumum', 'MKK-07', true),
        (gen_random_uuid(), mkk_id, 'Khulais', 'MKK-08', true),
        (gen_random_uuid(), mkk_id, 'Al Kamel', 'MKK-09', true),
        (gen_random_uuid(), mkk_id, 'Al Khurmah', 'MKK-10', true),
        (gen_random_uuid(), mkk_id, 'Ranyah', 'MKK-11', true),
        (gen_random_uuid(), mkk_id, 'Turubah', 'MKK-12', true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Eastern Province Areas
    INSERT INTO areas (id, region_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), eas_id, 'Dammam', 'EAS-01', true),
        (gen_random_uuid(), eas_id, 'Al Khobar', 'EAS-02', true),
        (gen_random_uuid(), eas_id, 'Dhahran', 'EAS-03', true),
        (gen_random_uuid(), eas_id, 'Al Jubail', 'EAS-04', true),
        (gen_random_uuid(), eas_id, 'Al Ahsa', 'EAS-05', true),
        (gen_random_uuid(), eas_id, 'Al Qatif', 'EAS-06', true),
        (gen_random_uuid(), eas_id, 'Ras Tanura', 'EAS-07', true),
        (gen_random_uuid(), eas_id, 'Abqaiq', 'EAS-08', true),
        (gen_random_uuid(), eas_id, 'Al Khafji', 'EAS-09', true),
        (gen_random_uuid(), eas_id, 'Al Nairyah', 'EAS-10', true),
        (gen_random_uuid(), eas_id, 'Al Uqair', 'EAS-11', true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Add more areas for other regions as needed...
    -- For brevity, I'm adding a few key areas from each region
    
    -- Asir Region Areas
    INSERT INTO areas (id, region_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), asr_id, 'Abha', 'ASR-01', true),
        (gen_random_uuid(), asr_id, 'Khamis Mushait', 'ASR-02', true),
        (gen_random_uuid(), asr_id, 'Al Namas', 'ASR-03', true),
        (gen_random_uuid(), asr_id, 'Bisha', 'ASR-04', true),
        (gen_random_uuid(), asr_id, 'Al Baha', 'ASR-05', true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Qassim Region Areas
    INSERT INTO areas (id, region_id, name, code, is_active) 
    VALUES 
        (gen_random_uuid(), qsm_id, 'Buraydah', 'QSM-01', true),
        (gen_random_uuid(), qsm_id, 'Unaizah', 'QSM-02', true),
        (gen_random_uuid(), qsm_id, 'Al Rass', 'QSM-03', true),
        (gen_random_uuid(), qsm_id, 'Al Bukayriyah', 'QSM-04', true),
        (gen_random_uuid(), qsm_id, 'Al Badayea', 'QSM-05', true)
    ON CONFLICT (code) DO NOTHING;
    
END $$;

-- Insert sample exam centers
DO $$
DECLARE
    ryd_city_id UUID;
    jeddah_id UUID;
    dammam_id UUID;
    abha_id UUID;
    buraydah_id UUID;
BEGIN
    -- Get area IDs
    SELECT id INTO ryd_city_id FROM areas WHERE code = 'RYD-01';
    SELECT id INTO jeddah_id FROM areas WHERE code = 'MKK-02';
    SELECT id INTO dammam_id FROM areas WHERE code = 'EAS-01';
    SELECT id INTO abha_id FROM areas WHERE code = 'ASR-01';
    SELECT id INTO buraydah_id FROM areas WHERE code = 'QSM-01';
    
    -- Insert exam centers
    INSERT INTO exam_centers (id, area_id, name, address, contact_person, contact_phone, capacity, is_active) 
    VALUES 
        -- Riyadh Centers
        (gen_random_uuid(), ryd_city_id, 'QHLC Riyadh Main Center', 'King Fahd Road, Riyadh', 'Ahmed Al-Rashid', '+966-11-123-4567', 200, true),
        (gen_random_uuid(), ryd_city_id, 'QHLC Riyadh North Center', 'King Abdullah Road, Riyadh', 'Fatima Al-Zahra', '+966-11-234-5678', 150, true),
        (gen_random_uuid(), ryd_city_id, 'QHLC Riyadh South Center', 'Prince Sultan Road, Riyadh', 'Omar Al-Sheikh', '+966-11-345-6789', 180, true),
        
        -- Jeddah Centers
        (gen_random_uuid(), jeddah_id, 'QHLC Jeddah Main Center', 'King Abdulaziz Road, Jeddah', 'Khalid Al-Mansouri', '+966-12-123-4567', 250, true),
        (gen_random_uuid(), jeddah_id, 'QHLC Jeddah North Center', 'Prince Mohammed Road, Jeddah', 'Aisha Al-Hamdan', '+966-12-234-5678', 200, true),
        
        -- Dammam Centers
        (gen_random_uuid(), dammam_id, 'QHLC Dammam Main Center', 'King Fahd Road, Dammam', 'Abdullah Al-Qahtani', '+966-13-123-4567', 180, true),
        (gen_random_uuid(), dammam_id, 'QHLC Al Khobar Center', 'King Khalid Road, Al Khobar', 'Sara Al-Rashid', '+966-13-234-5678', 160, true),
        
        -- Abha Centers
        (gen_random_uuid(), abha_id, 'QHLC Abha Main Center', 'King Faisal Road, Abha', 'Yousef Al-Asiri', '+966-17-123-4567', 120, true),
        
        -- Buraydah Centers
        (gen_random_uuid(), buraydah_id, 'QHLC Buraydah Main Center', 'King Abdulaziz Road, Buraydah', 'Mohammed Al-Qahtani', '+966-16-123-4567', 100, true)
    ON CONFLICT DO NOTHING;
END $$;

-- Insert sample exams
INSERT INTO exams (id, title, description, duration, total_marks, passing_marks, exam_type, status, start_date, end_date, created_by) 
VALUES 
    (gen_random_uuid(), 'Quran Memorization Level 1', 'Basic Quran memorization test for beginners', 60, 100, 70, 'regular', 'active', NOW() + INTERVAL '7 days', NOW() + INTERVAL '30 days', NULL),
    (gen_random_uuid(), 'Tajweed Rules Assessment', 'Test on basic Tajweed rules and pronunciation', 45, 50, 35, 'regular', 'active', NOW() + INTERVAL '14 days', NOW() + INTERVAL '45 days', NULL),
    (gen_random_uuid(), 'Mock Exam - Level 1', 'Practice exam for Quran memorization', 60, 100, 70, 'mock', 'active', NOW(), NOW() + INTERVAL '7 days', NULL),
    (gen_random_uuid(), 'Final Assessment - Advanced', 'Advanced level Quran memorization and recitation', 90, 150, 105, 'final', 'draft', NOW() + INTERVAL '30 days', NOW() + INTERVAL '60 days', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample questions for the first exam
DO $$
DECLARE
    exam_id UUID;
BEGIN
    SELECT id INTO exam_id FROM exams WHERE title = 'Quran Memorization Level 1' LIMIT 1;
    
    IF exam_id IS NOT NULL THEN
        INSERT INTO questions (id, exam_id, question_text, options, correct_answer, type, marks, order_number) 
        VALUES 
            (gen_random_uuid(), exam_id, 'What is the first verse of Surah Al-Fatiha?', 
             '["بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", "الرَّحْمَٰنِ الرَّحِيمِ", "مَالِكِ يَوْمِ الدِّينِ"]', 
             'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'mcq', 10, 1),
            
            (gen_random_uuid(), exam_id, 'Complete the verse: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 
             '["الرَّحْمَٰنِ الرَّحِيمِ", "مَالِكِ يَوْمِ الدِّينِ", "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ"]', 
             'الرَّحْمَٰنِ الرَّحِيمِ', 'mcq', 10, 2),
            
            (gen_random_uuid(), exam_id, 'How many verses are in Surah Al-Fatiha?', 
             '["5", "6", "7", "8"]', 
             '7', 'mcq', 10, 3),
            
            (gen_random_uuid(), exam_id, 'What is the meaning of "Al-Fatiha"?', 
             '["The Opening", "The Closing", "The Middle", "The Beginning"]', 
             'The Opening', 'mcq', 10, 4),
            
            (gen_random_uuid(), exam_id, 'Recite the complete Surah Al-Fatiha from memory.', 
             '[]', 
             '', 'text', 50, 5)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample resources
INSERT INTO resources (id, title, description, file_url, file_type, file_size, category, is_public, download_count, uploaded_by) 
VALUES 
    (gen_random_uuid(), 'Quran Memorization Guide', 'Complete guide for Quran memorization techniques', 'https://example.com/quran-guide.pdf', 'pdf', 2048000, 'study', true, 0, NULL),
    (gen_random_uuid(), 'Tajweed Rules PDF', 'Comprehensive Tajweed rules and examples', 'https://example.com/tajweed-rules.pdf', 'pdf', 1536000, 'study', true, 0, NULL),
    (gen_random_uuid(), 'Quran Recitation Audio', 'Audio files for proper Quran recitation', 'https://example.com/recitation.mp3', 'audio', 5120000, 'study', true, 0, NULL),
    (gen_random_uuid(), 'Exam Preparation Tips', 'Tips and strategies for exam preparation', 'https://example.com/exam-tips.pdf', 'pdf', 1024000, 'exam', true, 0, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample gallery items
INSERT INTO gallery (id, title, description, image_url, category, is_featured, uploaded_by) 
VALUES 
    (gen_random_uuid(), 'QHLC Opening Ceremony', 'Grand opening ceremony of QHLC centers', 'https://example.com/opening-ceremony.jpg', 'events', true, NULL),
    (gen_random_uuid(), 'Students in Class', 'Students actively participating in Quran classes', 'https://example.com/students-class.jpg', 'activities', false, NULL),
    (gen_random_uuid(), 'Exam Hall', 'Students taking their Quran memorization exams', 'https://example.com/exam-hall.jpg', 'activities', false, NULL),
    (gen_random_uuid(), 'Certificate Distribution', 'Certificate distribution ceremony for successful students', 'https://example.com/certificates.jpg', 'events', true, NULL)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Initial data setup completed successfully!' as status;
SELECT 'Countries, regions, areas, exam centers, exams, questions, resources, and gallery items have been added.' as details; 