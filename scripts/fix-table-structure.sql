-- QHLC Fix Table Structure Script
-- This script fixes existing tables that have missing columns or incorrect structure
-- Run this BEFORE running the safe-setup-database.sql script

-- Check and fix profiles table structure
DO $$ 
BEGIN
    -- Add missing columns to profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'whatsapp_no') THEN
        ALTER TABLE profiles ADD COLUMN whatsapp_no TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender gender;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE profiles ADD COLUMN user_type user_type DEFAULT 'user';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'area_id') THEN
        ALTER TABLE profiles ADD COLUMN area_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'center_id') THEN
        ALTER TABLE profiles ADD COLUMN center_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'father_name') THEN
        ALTER TABLE profiles ADD COLUMN father_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dob') THEN
        ALTER TABLE profiles ADD COLUMN dob DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'iqama_number') THEN
        ALTER TABLE profiles ADD COLUMN iqama_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'serial_number') THEN
        ALTER TABLE profiles ADD COLUMN serial_number TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_image') THEN
        ALTER TABLE profiles ADD COLUMN profile_image TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Check and fix exams table structure
DO $$ 
BEGIN
    -- Add missing columns to exams table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'description') THEN
        ALTER TABLE exams ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'duration') THEN
        ALTER TABLE exams ADD COLUMN duration INTEGER NOT NULL DEFAULT 60;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'total_marks') THEN
        ALTER TABLE exams ADD COLUMN total_marks INTEGER NOT NULL DEFAULT 100;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'passing_marks') THEN
        ALTER TABLE exams ADD COLUMN passing_marks INTEGER NOT NULL DEFAULT 70;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'exam_type') THEN
        ALTER TABLE exams ADD COLUMN exam_type exam_type NOT NULL DEFAULT 'regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'status') THEN
        ALTER TABLE exams ADD COLUMN status exam_status DEFAULT 'draft';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'start_date') THEN
        ALTER TABLE exams ADD COLUMN start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'end_date') THEN
        ALTER TABLE exams ADD COLUMN end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 year');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'created_by') THEN
        ALTER TABLE exams ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'created_at') THEN
        ALTER TABLE exams ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'updated_at') THEN
        ALTER TABLE exams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Check and fix questions table structure
DO $$ 
BEGIN
    -- Add missing columns to questions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'options') THEN
        ALTER TABLE questions ADD COLUMN options JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'correct_answer') THEN
        ALTER TABLE questions ADD COLUMN correct_answer TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'type') THEN
        ALTER TABLE questions ADD COLUMN type TEXT NOT NULL DEFAULT 'mcq';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'marks') THEN
        ALTER TABLE questions ADD COLUMN marks INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'order_number') THEN
        ALTER TABLE questions ADD COLUMN order_number INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'created_at') THEN
        ALTER TABLE questions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Check and fix user_exams table structure
DO $$ 
BEGIN
    -- Add missing columns to user_exams table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'started_at') THEN
        ALTER TABLE user_exams ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'submitted_at') THEN
        ALTER TABLE user_exams ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'status') THEN
        ALTER TABLE user_exams ADD COLUMN status user_exam_status DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'total_score') THEN
        ALTER TABLE user_exams ADD COLUMN total_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'evaluator_id') THEN
        ALTER TABLE user_exams ADD COLUMN evaluator_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'remarks') THEN
        ALTER TABLE user_exams ADD COLUMN remarks TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_exams' AND column_name = 'created_at') THEN
        ALTER TABLE user_exams ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Check and fix user_answers table structure
DO $$ 
BEGIN
    -- Add missing columns to user_answers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_answers' AND column_name = 'answer_text') THEN
        ALTER TABLE user_answers ADD COLUMN answer_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_answers' AND column_name = 'is_correct') THEN
        ALTER TABLE user_answers ADD COLUMN is_correct BOOLEAN;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_answers' AND column_name = 'score_awarded') THEN
        ALTER TABLE user_answers ADD COLUMN score_awarded INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_answers' AND column_name = 'evaluated_by') THEN
        ALTER TABLE user_answers ADD COLUMN evaluated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_answers' AND column_name = 'created_at') THEN
        ALTER TABLE user_answers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for profiles.area_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_area_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_area_id_fkey 
        FOREIGN KEY (area_id) REFERENCES areas(id);
    END IF;
    
    -- Add foreign key for profiles.center_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_center_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_center_id_fkey 
        FOREIGN KEY (center_id) REFERENCES exam_centers(id);
    END IF;
    
    -- Add foreign key for exams.created_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exams_created_by_fkey' 
        AND table_name = 'exams'
    ) THEN
        ALTER TABLE exams ADD CONSTRAINT exams_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES profiles(id);
    END IF;
    
    -- Add foreign key for user_exams.evaluator_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_exams_evaluator_id_fkey' 
        AND table_name = 'user_exams'
    ) THEN
        ALTER TABLE user_exams ADD CONSTRAINT user_exams_evaluator_id_fkey 
        FOREIGN KEY (evaluator_id) REFERENCES profiles(id);
    END IF;
    
    -- Add foreign key for user_answers.evaluated_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_answers_evaluated_by_fkey' 
        AND table_name = 'user_answers'
    ) THEN
        ALTER TABLE user_answers ADD CONSTRAINT user_answers_evaluated_by_fkey 
        FOREIGN KEY (evaluated_by) REFERENCES profiles(id);
    END IF;
END $$;

-- Success message
SELECT 'Table structure fixes completed successfully!' as status; 