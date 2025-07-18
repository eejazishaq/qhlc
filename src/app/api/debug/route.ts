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

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test 1: Check if areas table has data
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('*')
      .limit(5)

    // Test 2: Check if exam_centers table has data
    const { data: centers, error: centersError } = await supabase
      .from('exam_centers')
      .select('*')
      .limit(5)

    // Test 3: Check if profiles table has data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    // Test 4: Try the join query
    const { data: joinedData, error: joinError } = await supabase
      .from('profiles')
      .select(`
        *,
        areas:area_id(name),
        centers:center_id(name)
      `)
      .limit(5)

    return NextResponse.json({
      areas: {
        data: areas,
        error: areasError,
        count: areas?.length || 0
      },
      centers: {
        data: centers,
        error: centersError,
        count: centers?.length || 0
      },
      profiles: {
        data: profiles,
        error: profilesError,
        count: profiles?.length || 0
      },
      joinedData: {
        data: joinedData,
        error: joinError,
        count: joinedData?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 