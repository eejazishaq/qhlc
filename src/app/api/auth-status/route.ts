import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
        expires_at: session.expires_at
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      } : null,
      errors: {
        sessionError: sessionError?.message,
        userError: userError?.message
      }
    })

  } catch (error) {
    console.error('Auth status error:', error)
    return NextResponse.json({
      error: 'Failed to check auth status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 