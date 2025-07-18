import { supabase } from '@/lib/supabase/client'

export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  // Merge headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  }

  // Make the request
  return fetch(url, {
    ...options,
    headers
  })
} 