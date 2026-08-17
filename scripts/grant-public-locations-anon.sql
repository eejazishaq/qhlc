-- Public /api/locations?public=true uses NEXT_PUBLIC_SUPABASE_ANON_KEY (like /api/books, /api/resources).
-- If you see permission denied (42501) on countries, areas, or exam_centers, run this in Supabase SQL Editor.

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.countries TO anon;
GRANT SELECT ON TABLE public.areas TO anon;
GRANT SELECT ON TABLE public.exam_centers TO anon;

-- If RLS is enabled on these tables, anon still needs a policy. Examples (adjust if policies already exist):
-- ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY countries_public_read ON public.countries FOR SELECT TO anon USING (is_active = true);
--
-- ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY areas_public_read ON public.areas FOR SELECT TO anon USING (is_active = true);
--
-- ALTER TABLE public.exam_centers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY exam_centers_public_read ON public.exam_centers FOR SELECT TO anon USING (is_active = true);
