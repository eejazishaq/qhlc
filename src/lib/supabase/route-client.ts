import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for Route Handlers that authenticate via `Authorization: Bearer <access_token>`.
 * Every PostgREST request includes the JWT so RLS `auth.uid()` matches the user (cookie-only
 * `createClient()` from server.ts does not reliably attach the Bearer token from the header).
 */
export function createSupabaseRouteHandlerClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}
