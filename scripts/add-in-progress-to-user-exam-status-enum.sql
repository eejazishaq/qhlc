-- Optional: persist "in_progress" on user_exams.status (matches app code).
-- If this value is missing from the enum, updates that set status to in_progress may fail;
-- the API still works by filtering active attempts in application code.

-- PostgreSQL 15+ (Supabase):
ALTER TYPE user_exam_status ADD VALUE IF NOT EXISTS 'in_progress';
