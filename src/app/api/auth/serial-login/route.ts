import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, password } = await request.json()
    
    if (!serialNumber || !password) {
      return NextResponse.json(
        { error: 'Serial number and password are required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // First, find the user profile by serial number (including email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, user_type, serial_number, email')
      .eq('serial_number', serialNumber.trim())
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if email exists in the profile
    if (!profile.email) {
      return NextResponse.json({
        success: false,
        error: 'Email not found for this user. Please contact administrator.',
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          mobile: profile.mobile,
          user_type: profile.user_type,
          serial_number: profile.serial_number
        }
      })
    }

    // Now we have the email, return it for client-side authentication
    return NextResponse.json({
      success: true,
      email: profile.email,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        mobile: profile.mobile,
        user_type: profile.user_type,
        serial_number: profile.serial_number
      }
    })

  } catch (error) {
    console.error('Serial login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 