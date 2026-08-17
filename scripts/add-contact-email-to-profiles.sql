-- Optional contact email for learners (login still uses serial-based profiles.email).
-- Run in Supabase SQL editor if this column is not already present.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email text;

COMMENT ON COLUMN public.profiles.contact_email IS 'Optional user-supplied email; authentication uses profiles.email ({serial}@qhlc.com)';
