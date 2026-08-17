import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { password, profileData } = await request.json()

    console.log('Registration request received:', { profileData })

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const registrationType = profileData?.registration_type
    if (registrationType !== 'adult' && registrationType !== 'child') {
      return NextResponse.json(
        { error: 'Invalid or missing registration type' },
        { status: 400 }
      )
    }

    const whatsappNo = typeof profileData?.whatsapp_no === 'string' ? profileData.whatsapp_no.trim() : ''
    if (!whatsappNo) {
      return NextResponse.json(
        { error: 'WhatsApp number is required' },
        { status: 400 }
      )
    }

    if (registrationType === 'child') {
      const father = typeof profileData?.father_name === 'string' ? profileData.father_name.trim() : ''
      if (!father) {
        return NextResponse.json(
          { error: 'Father\'s name is required for child registration' },
          { status: 400 }
        )
      }
    }

    const rawContactEmail =
      typeof profileData?.contact_email === 'string' ? profileData.contact_email.trim() : ''
    let contactEmail: string | null = null
    if (rawContactEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawContactEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }
      contactEmail = rawContactEmail.toLowerCase()
    }

    // Create Supabase client with service role key to use admin functions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin functions
    )

    console.log('Supabase admin client created')

    // Create the auth user first; Supabase requires an email — replace with serial-based email after insert
    const placeholderEmail = `reg+${Math.random().toString(36).slice(2, 12)}@qhlc.com`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: placeholderEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: profileData.full_name,
        mobile: profileData.mobile,
        ...(contactEmail ? { contact_email: contactEmail } : {})
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('No user data returned from auth.admin.createUser')
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('User created successfully with auto-confirmed email:', authData.user.id)

    // Insert profile WITHOUT manually setting serial_number so DB sequence/trigger generates it
    const baseProfileInsert = {
      id: authData.user.id,
      full_name: profileData.full_name,
      mobile: profileData.mobile || null,
      whatsapp_no: whatsappNo,
      gender: profileData.gender || 'male',
      father_name: registrationType === 'child' ? (profileData.father_name || '').trim() : null,
      dob: null,
      iqama_number: null,
      registration_type: registrationType,
      contact_email: contactEmail,
      area_id: profileData.area_id,
      center_id: profileData.center_id,
      user_type: profileData.user_type || 'user',
      // profiles.email will be set to serial-based login AFTER we know serial_number
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting to insert profile with admin client (no serial/email):', baseProfileInsert)

    const { data: insertedProfiles, error: profileInsertError } = await supabase
      .from('profiles')
      .insert(baseProfileInsert)
      .select('*')
      .single()

    console.log('Profile insert result:', { data: insertedProfiles, error: profileInsertError })

    if (profileInsertError || !insertedProfiles) {
      console.error('Profile creation error:', profileInsertError)
      
      if (profileInsertError && profileInsertError.message && profileInsertError.message.includes('duplicate key value violates unique constraint "profiles_mobile_key"')) {
        return NextResponse.json(
          { error: 'Mobile number is already registered. Please use a different mobile number or contact support.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Profile creation failed: ' + (profileInsertError?.message || 'Unknown error') },
        { status: 500 }
      )
    }

    const rawSerial: string = insertedProfiles.serial_number
    if (!rawSerial) {
      console.error('Serial number was not generated by DB')
      return NextResponse.json(
        { error: 'Failed to generate serial number' },
        { status: 500 }
      )
    }

    // Normalize serial to numeric-only (strip any QHLC- prefix)
    const normalizedSerial = rawSerial.replace(/^QHLC-/, '')
    const serialEmail = `${normalizedSerial}@qhlc.com`
    const finalEmail = serialEmail
    console.log(`Finalized serial/email -> serial: ${normalizedSerial}, email: ${finalEmail} (registration_type=${registrationType})`)

    // Update profile with the finalized email and serial
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ serial_number: normalizedSerial, email: finalEmail, updated_at: new Date().toISOString() })
      .eq('id', authData.user.id)

    if (profileUpdateError) {
      console.error('Failed to update profile with normalized serial/email:', profileUpdateError)
      return NextResponse.json(
        { error: 'Failed to finalize profile: ' + profileUpdateError.message },
        { status: 500 }
      )
    }

    const { error: authEmailUpdateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      email: serialEmail,
      email_confirm: true
    })
    if (authEmailUpdateError) {
      console.error('Failed to update auth user email:', authEmailUpdateError)
      return NextResponse.json(
        { error: 'Failed to update auth email: ' + authEmailUpdateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User registered successfully! Serial Number: ${normalizedSerial}, Email: ${finalEmail}`,
      user: authData.user,
      profile: { ...insertedProfiles, serial_number: normalizedSerial, email: finalEmail },
      serialNumber: normalizedSerial,
      email: finalEmail
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
} 