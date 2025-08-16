-- Add evaluation and publishing fields to exams table
-- This script adds fields to control when exam results are published

-- Add new status to user_exam_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_exam_status' AND typarray::regtype::text LIKE '%published%') THEN
        ALTER TYPE user_exam_status ADD VALUE 'published';
        RAISE NOTICE 'Added published status to user_exam_status enum';
    ELSE
        RAISE NOTICE 'published status already exists in user_exam_status enum';
    END IF;
END $$;

-- Add results_published field to exams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'results_published'
    ) THEN
        ALTER TABLE exams ADD COLUMN results_published BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added results_published column to exams table';
    ELSE
        RAISE NOTICE 'results_published column already exists in exams table';
    END IF;
END $$;

-- Add published_at field to exams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'published_at'
    ) THEN
        ALTER TABLE exams ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added published_at column to exams table';
    ELSE
        RAISE NOTICE 'published_at column already exists in exams table';
    END IF;
END $$;

-- Add published_by field to exams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'published_by'
    ) THEN
        ALTER TABLE exams ADD COLUMN published_by UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added published_by column to exams table';
    ELSE
        RAISE NOTICE 'published_by column already exists in exams table';
    END IF;
END $$;

-- Update existing exams to have results_published = false
UPDATE exams SET results_published = false WHERE results_published IS NULL;

-- Update existing user_exams to have status = 'completed' instead of 'evaluated' if they were auto-evaluated
UPDATE user_exams SET status = 'completed' WHERE status = 'evaluated' AND evaluator_id IS NULL; 