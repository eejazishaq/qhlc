-- Add shuffle_questions field to exams table
-- This script adds the shuffle_questions boolean field to existing exams tables

-- Add the column if it doesn't exist
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

-- Update existing exams to have shuffle_questions = false by default
UPDATE exams SET shuffle_questions = false WHERE shuffle_questions IS NULL; 