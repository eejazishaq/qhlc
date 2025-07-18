import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Test auth - User:', user?.id, 'Error:', authError?.message)
    
    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false,
        error: authError?.message || 'No user found',
        userId: user?.id 
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type, full_name, email')
      .eq('id', user.id)
      .single()

    console.log('Test auth - Profile:', profile, 'Error:', profileError?.message)

    if (profileError || !profile) {
      return NextResponse.json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        },
        profile: null,
        profileError: profileError?.message || 'Profile not found'
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        id: profile.id,
        user_type: profile.user_type,
        full_name: profile.full_name,
        email: profile.email
      },
      canCreateResources: ['admin', 'super_admin'].includes(profile.user_type)
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 