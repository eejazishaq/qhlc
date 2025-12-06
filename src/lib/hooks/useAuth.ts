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
        console.log('Getting initial session...')
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
        }

        const currentUser = session?.user
        
        if (currentUser) {
          console.log('User found:', currentUser.email)
          
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError)
          }

          setAuthState({
            user: currentUser,
            session,
            profile: profile || null,
            loading: false,
            error: null
          })
        } else {
          console.log('No user found')
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('Failed to get session:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to get session', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes - IMPORTANT: Non-async callback to avoid deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'INITIAL_SESSION') {
          // Already handled above, skip
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // Just update session, no loading, no profile refetch
          console.log('Token refreshed')
          setAuthState(prev => ({
            ...prev,
            session,
            user: session?.user || null
          }))
          return
        }

        if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null
          })
          return
        }

        // For SIGNED_IN and USER_UPDATED events
        if (session?.user) {
          console.log('User authenticated:', session.user.email)
          
          // Use setTimeout to avoid deadlock as per Supabase docs
          setTimeout(async () => {
            try {
              setAuthState(prev => ({ ...prev, loading: true }))
              
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError)
              }

              setAuthState({
                user: session.user,
                session,
                profile: profile || null,
                loading: false,
                error: null
              })
            } catch (error) {
              console.error('Error in auth state change:', error)
              setAuthState(prev => ({ ...prev, loading: false }))
            }
          }, 0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        } else {
          console.log('Profile not found for user:', userId)
        }
        return null
      }

      console.log('Profile fetched successfully:', profile)
      return profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const signInWithSerial = async (serialNumber: string, password: string) => {
    try {
      console.log('SignIn with serial called with serial:', serialNumber)
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      // First, verify that the serial number exists and get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, mobile, user_type, serial_number')
        .eq('serial_number', serialNumber.trim())
        .single()

      if (profileError || !profileData) {
        console.error('Profile lookup error:', profileError)
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Invalid credentials', 
          loading: false 
        }))
        return { error: 'Invalid credentials' }
      }

      try {
        const response = await fetch('/api/auth/serial-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serialNumber, password }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error('Serial login API error:', result.error)
          setAuthState(prev => ({ 
            ...prev, 
            error: result.error || 'Invalid credentials', 
            loading: false 
          }))
          return { error: result.error || 'Invalid credentials' }
        }

        // Now that we have the email, sign in with Supabase auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: result.email,
          password
        })

        console.log('Serial number signIn result:', { success: !error, error: error?.message })

        if (error) {
          console.error('Serial number signIn error:', error)
          setAuthState(prev => ({ 
            ...prev, 
            error: 'Invalid credentials', 
            loading: false 
          }))
          return { error: 'Invalid credentials' }
        }

        // Auth state change will handle the rest
        return { data }
        
      } catch (apiError) {
        console.error('API call error:', apiError)
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Authentication failed', 
          loading: false 
        }))
        return { error: 'Authentication failed' }
      }
      
    } catch (error) {
      console.error('Serial number signIn catch error:', error)
      const errorMessage = 'Invalid credentials'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('SignIn called with email:', email)
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('SignIn result:', { success: !error, error: error?.message })

      if (error) {
        console.error('SignIn error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          loading: false 
        }))
        return { error: error.message }
      }

      // Auth state change will handle the rest
      return { data }
    } catch (error) {
      console.error('SignIn catch error:', error)
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
      console.log('signUp called with:', { email, profileData })
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase not configured')
        return { error: 'Supabase not configured. Please set up your environment variables.' }
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      console.log('Loading state set to true')
      
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

      console.log('Supabase auth signUp result:', { data, error })

      if (error) {
        console.error('Auth signUp error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          loading: false 
        }))
        return { error: error.message }
      }

      // Create profile if signup successful
      if (data.user) {
        console.log('Creating profile for user:', data.user.id)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            ...profileData
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        } else {
          console.log('Profile created successfully')
          
          // Automatically sign in the user after successful profile creation
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (signInError) {
            console.error('Auto sign-in error:', signInError)
          } else {
            console.log('Auto sign-in successful')
            // Auth state change will handle the rest
            return { data: signInData }
          }
        }
      }

      console.log('Setting loading to false')
      setAuthState(prev => ({ ...prev, loading: false }))
      return { data }
    } catch (error) {
      console.error('SignUp catch error:', error)
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

      // Auth state change will handle the rest
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
    signInWithSerial,
    signUp,
    signOut,
    updateProfile,
    clearError
  }
}