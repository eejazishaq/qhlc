import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper function to get server-side session
export async function getServerSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

// Helper function to get server-side user
export async function getServerUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

// Helper function to get server-side user profile
export async function getServerUserProfile(userId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting server user profile:', error)
    return null
  }
}

// Helper function to check user role
export async function checkUserRole(userId: string, requiredRole: string) {
  try {
    const profile = await getServerUserProfile(userId)
    if (!profile) return false
    
    return profile.user_type === requiredRole || profile.user_type === 'super_admin'
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
} 