-- Persist learner registration type (adult vs child). Run in Supabase SQL editor.
-- Safe to run once; adjust if your profiles table lives in another schema.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_type text;

UPDATE public.profiles
SET registration_type = 'adult'
WHERE registration_type IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN registration_type SET DEFAULT 'adult';

ALTER TABLE public.profiles
  ALTER COLUMN registration_type SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_registration_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_registration_type_check
  CHECK (registration_type IN ('adult', 'child'));

COMMENT ON COLUMN public.profiles.registration_type IS 'Self-service registration: adult or child learner';
