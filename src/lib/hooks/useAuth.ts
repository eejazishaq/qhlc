'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import type { Tables } from '../supabase/client'

interface Profile extends Tables<'profiles'> {
  // Additional profile fields can be added here
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Supabase not configured. Please set up your environment variables.',
        loading: false 
      }))
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (session?.user) {
          await fetchProfile(session.user.id)
        }

        setAuthState(prev => ({ 
          ...prev, 
          user: session?.user ?? null, 
          session, 
          loading: false 
        }))
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to get session', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({ ...prev, loading: true }))

        if (session?.user) {
          await fetchProfile(session.user.id)
          setAuthState(prev => ({ 
            ...prev, 
            user: session.user, 
            session, 
            loading: false 
          }))
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            user: null, 
            profile: null, 
            session: null, 
            loading: false 
          }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Don't log error if profile doesn't exist yet (during registration)
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        return
      }

      setAuthState(prev => ({ ...prev, profile }))
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          loading: false 
        }))
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profileData.full_name,
            mobile: profileData.mobile
          }
        }
      })

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          loading: false 
        }))
        return { error: error.message }
      }

      // Create profile if signup successful
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            ...profileData
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Don't fail the signup if profile creation fails
          // The user can still sign in and complete their profile later
        }
      }

      setAuthState(prev => ({ ...prev, loading: false }))
      return { data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          loading: false 
        }))
        return { error: error.message }
      }

      setAuthState(prev => ({ 
        ...prev, 
        user: null, 
        profile: null, 
        session: null, 
        loading: false 
      }))

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      if (!authState.user) {
        throw new Error('No user logged in')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single()

      if (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message 
        }))
        return { error: error.message }
      }

      setAuthState(prev => ({ ...prev, profile: data }))
      return { data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }))
      return { error: errorMessage }
    }
  }

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError
  }
} 