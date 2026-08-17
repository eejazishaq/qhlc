-- Fixes: permission denied for table countries (42501) on /api/locations?public=true
-- Run in Supabase → SQL Editor.
--
-- Also verify .env has SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role secret).

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON TABLE public.countries TO service_role;
GRANT SELECT ON TABLE public.countries TO anon;
GRANT SELECT ON TABLE public.countries TO authenticated;

-- If countries has RLS enabled and you use the anon key anywhere, add a SELECT policy
-- for active rows, e.g.:
--   CREATE POLICY countries_read_active ON public.countries
--   FOR SELECT TO anon USING (is_active = true);
