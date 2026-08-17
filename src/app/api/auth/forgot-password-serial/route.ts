import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordResetWhatsApp } from '@/lib/notifications/whatsappPasswordReset'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, mobile } = await request.json()
    
    if (!serialNumber || !serialNumber.trim()) {
      return NextResponse.json(
        { error: 'Registration number is required' },
        { status: 400 }
      )
    }

    if (!mobile || !mobile.trim()) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Normalize serial number (remove QHLC- prefix if present)
    const normalizedSerial = serialNumber.trim().replace(/^QHLC-/, '')
    
    // Find the profile by serial number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, serial_number, mobile, email, full_name, whatsapp_no')
      .eq('serial_number', normalizedSerial)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError)
      // Don't reveal if serial exists for security
      return NextResponse.json(
        { error: 'Invalid registration number or mobile number' },
        { status: 400 }
      )
    }

    // Verify mobile number matches (normalize both for comparison)
    const normalizedMobile = mobile.trim().replace(/\s+/g, '')
    const profileMobile = profile.mobile?.trim().replace(/\s+/g, '') || ''

    if (normalizedMobile !== profileMobile) {
      console.error('Mobile number mismatch:', { provided: normalizedMobile, stored: profileMobile })
      return NextResponse.json(
        { error: 'Invalid registration number or mobile number' },
        { status: 400 }
      )
    }

    // Get the user's email from the profile (for children, this is serial@qhlc.com)
    const userEmail = profile.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email not found for this account. Please contact administrator.' },
        { status: 400 }
      )
    }

    // Simple 8-digit numeric temporary password (e.g. 42343243)
    const generateEightDigitPassword = () => {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      const n = 10_000_000 + (buf[0] % 90_000_000)
      return String(n)
    }

    const newPassword = generateEightDigitPassword()

    // Update the user's password using admin API
    // First, we need to find the auth user by email
    const { data: authUsers, error: authUserError } = await supabase.auth.admin.listUsers()
    
    if (authUserError) {
      console.error('Error listing users:', authUserError)
      return NextResponse.json(
        { error: 'Failed to reset password. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Find the user by email
    const authUser = authUsers.users.find(u => u.email === userEmail)

    if (!authUser) {
      console.error('Auth user not found for email:', userEmail)
      return NextResponse.json(
        { error: 'User account not found. Please contact administrator.' },
        { status: 400 }
      )
    }

    // Update the password using admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password. Please contact administrator.' },
        { status: 500 }
      )
    }

    console.log(`Password reset for user: ${profile.full_name} (${normalizedSerial})`)

    const waPhone = profile.whatsapp_no?.trim() || normalizedMobile
    const waResult = await sendPasswordResetWhatsApp({
      phone: waPhone,
      password: newPassword,
      fullName: profile.full_name,
    })

    if (!waResult.ok && !waResult.skipped) {
      console.error('[forgot-password-serial] WhatsApp send failed:', waResult.error)
    }

    return NextResponse.json({
      success: true,
      message: waResult.ok
        ? 'Your password has been reset. We sent the 8-digit code to your WhatsApp. You can also copy it below.'
        : 'Your password has been reset. Use the 8-digit code below to sign in, then change your password.',
      temporaryPassword: newPassword,
      note: 'Please save this password and change it after logging in.',
      whatsappSent: waResult.ok,
    })
  } catch (error) {
    console.error('Serial password reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

