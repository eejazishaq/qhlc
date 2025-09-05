import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = (searchParams.get('public') || '').toLowerCase() === 'true'

    if (isPublic) {
      // Public mode: return active areas and centers without auth
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const [{ data: areas, error: areasError }, { data: centers, error: centersError }] = await Promise.all([
        supabase
          .from('areas')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('exam_centers')
          .select('id, name, area_id')
          .eq('is_active', true)
          .order('name')
      ])

      if (areasError) {
        console.error('Error fetching areas (public):', areasError)
        return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
      }
      if (centersError) {
        console.error('Error fetching centers (public):', centersError)
        return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 })
      }

      return NextResponse.json({ areas: areas || [], centers: centers || [] })
    }

    // Existing admin-protected behavior
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

    // Fetch areas
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (areasError) {
      console.error('Error fetching areas:', areasError)
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
    }

    // Fetch centers
    const { data: centers, error: centersError } = await supabase
      .from('exam_centers')
      .select('id, name, area_id')
      .eq('is_active', true)
      .order('name')

    if (centersError) {
      console.error('Error fetching centers:', centersError)
      return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 })
    }

    return NextResponse.json({
      areas: areas || [],
      centers: centers || []
    })

  } catch (error) {
    console.error('Error in locations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 