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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Simple test: just count profiles
    const { count: totalProfiles, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ 
        error: 'Failed to count profiles',
        details: countError.message 
      }, { status: 500 })
    }

    // Simple test: get first 3 profiles
    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, user_type')
      .limit(3)

    if (sampleError) {
      return NextResponse.json({ 
        error: 'Failed to fetch sample profiles',
        details: sampleError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Basic profiles access test',
      data: {
        totalProfiles: totalProfiles || 0,
        sampleProfiles: sampleProfiles || [],
        user: {
          id: user.id,
          userType: profile?.user_type
        }
      }
    })

  } catch (error) {
    console.error('Error in simple test API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 