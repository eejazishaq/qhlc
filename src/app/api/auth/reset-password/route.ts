import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      // The token from Supabase password reset is an access_token
      // We need to set the session first, then update the password
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '', // Refresh token not needed for password reset
      })

      if (sessionError || !sessionData.session) {
        console.error('Session error:', sessionError)
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new password reset link.' },
          { status: 400 }
        )
      }

      // Now update the password using the authenticated session
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update password' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully'
      })
    } catch (error) {
      console.error('Reset password error:', error)
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset link.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

