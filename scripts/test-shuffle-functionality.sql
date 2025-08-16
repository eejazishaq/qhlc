-- Test script to verify shuffle functionality
-- This script tests the shuffle_questions field and question shuffling

-- 1. Add shuffle_questions field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'shuffle_questions'
    ) THEN
        ALTER TABLE exams ADD COLUMN shuffle_questions BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added shuffle_questions column to exams table';
    ELSE
        RAISE NOTICE 'shuffle_questions column already exists in exams table';
    END IF;
END $$;

-- 2. Update existing exams to have shuffle_questions = false by default
UPDATE exams SET shuffle_questions = false WHERE shuffle_questions IS NULL;

-- 3. Test: Create a sample exam with shuffle enabled
INSERT INTO exams (
    title, 
    description, 
    duration, 
    total_marks, 
    passing_marks, 
    exam_type, 
    status, 
    start_date, 
    end_date, 
    shuffle_questions,
    created_by
) VALUES (
    'Test Shuffle Exam',
    'Test exam to verify question shuffling functionality',
    30,
    50,
    25,
    'mock',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    true,
    (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- 4. Test: Create sample questions for the test exam
INSERT INTO questions (
    exam_id,
    question_text,
    type,
    correct_answer,
    marks,
    order_number
) VALUES 
    ((SELECT id FROM exams WHERE title = 'Test Shuffle Exam' LIMIT 1), 'Question 1?', 'mcq', 'A', 5, 1),
    ((SELECT id FROM exams WHERE title = 'Test Shuffle Exam' LIMIT 1), 'Question 2?', 'mcq', 'B', 5, 2),
    ((SELECT id FROM exams WHERE title = 'Test Shuffle Exam' LIMIT 1), 'Question 3?', 'mcq', 'C', 5, 3),
    ((SELECT id FROM exams WHERE title = 'Test Shuffle Exam' LIMIT 1), 'Question 4?', 'mcq', 'D', 5, 4),
    ((SELECT id FROM exams WHERE title = 'Test Shuffle Exam' LIMIT 1), 'Question 5?', 'mcq', 'A', 5, 5)
ON CONFLICT DO NOTHING;

-- 5. Verify the setup
SELECT 
    e.title,
    e.shuffle_questions,
    COUNT(q.id) as question_count
FROM exams e
LEFT JOIN questions q ON e.id = q.exam_id
WHERE e.title = 'Test Shuffle Exam'
GROUP BY e.id, e.title, e.shuffle_questions;

-- 6. Show questions in original order
SELECT 
    q.order_number,
    q.question_text
FROM questions q
JOIN exams e ON q.exam_id = e.id
WHERE e.title = 'Test Shuffle Exam'
ORDER BY q.order_number; 