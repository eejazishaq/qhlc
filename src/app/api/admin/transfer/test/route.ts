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

    // Test basic profiles access
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, user_type')
      .limit(5)

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: profilesError.message 
      }, { status: 500 })
    }

    // Test exam_centers access
    const { data: centers, error: centersError } = await supabase
      .from('exam_centers')
      .select('id, name')
      .limit(5)

    if (centersError) {
      console.error('Centers query error:', centersError)
      return NextResponse.json({ 
        error: 'Failed to fetch centers',
        details: centersError.message 
      }, { status: 500 })
    }

    // Test areas access
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name')
      .limit(5)

    if (areasError) {
      console.error('Areas query error:', areasError)
      return NextResponse.json({ 
        error: 'Failed to fetch areas',
        details: areasError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All tables accessible',
      data: {
        profiles: profiles || [],
        centers: centers || [],
        areas: areas || [],
        user: {
          id: user.id,
          userType: profile?.user_type
        }
      }
    })

  } catch (error) {
    console.error('Error in test API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 