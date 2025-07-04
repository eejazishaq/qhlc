import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          mobile: string
          whatsapp_no: string | null
          gender: 'male' | 'female'
          user_type: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
          area_id: string
          center_id: string
          father_name: string | null
          dob: string | null
          iqama_number: string | null
          serial_number: string
          profile_image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          mobile: string
          whatsapp_no?: string | null
          gender: 'male' | 'female'
          user_type?: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
          area_id: string
          center_id: string
          father_name?: string | null
          dob?: string | null
          iqama_number?: string | null
          serial_number?: string
          profile_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          mobile?: string
          whatsapp_no?: string | null
          gender?: 'male' | 'female'
          user_type?: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
          area_id?: string
          center_id?: string
          father_name?: string | null
          dob?: string | null
          iqama_number?: string | null
          serial_number?: string
          profile_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string
          duration: number
          total_marks: number
          passing_marks: number
          exam_type: 'mock' | 'regular' | 'final'
          status: 'draft' | 'active' | 'inactive'
          start_date: string
          end_date: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          duration: number
          total_marks: number
          passing_marks: number
          exam_type: 'mock' | 'regular' | 'final'
          status?: 'draft' | 'active' | 'inactive'
          start_date: string
          end_date: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          duration?: number
          total_marks?: number
          passing_marks?: number
          exam_type?: 'mock' | 'regular' | 'final'
          status?: 'draft' | 'active' | 'inactive'
          start_date?: string
          end_date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_exams: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          started_at: string | null
          submitted_at: string | null
          status: 'pending' | 'completed' | 'evaluated'
          total_score: number | null
          evaluator_id: string | null
          remarks: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          started_at?: string | null
          submitted_at?: string | null
          status?: 'pending' | 'completed' | 'evaluated'
          total_score?: number | null
          evaluator_id?: string | null
          remarks?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          started_at?: string | null
          submitted_at?: string | null
          status?: 'pending' | 'completed' | 'evaluated'
          total_score?: number | null
          evaluator_id?: string | null
          remarks?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  
  if (error?.message) {
    return {
      error: true,
      message: error.message
    }
  }
  
  return {
    error: true,
    message: 'An unexpected error occurred'
  }
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Helper function to get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
} 