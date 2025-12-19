import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, password } = await request.json()
    
    if (!serialNumber || !password) {
      return NextResponse.json(
        { error: 'Serial number and password are required' },
        { status: 400 }
      )
    }

    // Create Supabase client using server helper
    const supabase = createClient()

    // Normalize serial number: remove QHLC- prefix if present, trim whitespace
    // Keep leading zeros as they are part of the serial number
    const normalizedSerial = serialNumber.trim().replace(/^QHLC-/i, '')

    console.log('Serial login attempt:', { original: serialNumber, normalized: normalizedSerial })

    // First, find the user profile by serial number (including email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, user_type, serial_number, email')
      .eq('serial_number', normalizedSerial)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup error:', {
        error: profileError,
        serialNumber: normalizedSerial,
        message: profileError?.message,
        code: profileError?.code
      })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Profile found:', {
      serial_number: profile.serial_number,
      email: profile.email ? 'exists' : 'missing',
      user_id: profile.id
    })

    // Check if email exists in the profile
    if (!profile.email) {
      console.error('Email not found for profile:', profile.id)
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