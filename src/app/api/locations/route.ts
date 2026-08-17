import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = (searchParams.get('public') || '').toLowerCase() === 'true'

    if (isPublic) {
      // Same as /api/books, /api/resources, /api/classes: anon key, no JWT (public read via RLS / grants)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const [
        { data: areas, error: areasError },
        { data: centers, error: centersError },
        { data: countries, error: countriesError },
      ] = await Promise.all([
        supabase
          .from('areas')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('exam_centers')
          .select('id, name, area_id')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('countries')
          .select('name, code, phone_code')
          .eq('is_active', true)
          .order('name'),
      ])

      if (areasError) {
        console.error('Error fetching areas (public):', areasError)
        return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
      }
      if (centersError) {
        console.error('Error fetching centers (public):', centersError)
        return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 })
      }
      if (countriesError) {
        console.error('Error fetching countries (public):', countriesError)
        console.error(
          'Hint: run scripts/grant-public-locations-anon.sql in Supabase (same access pattern as public books/resources).'
        )
      }

      const seen = new Set<string>()
      const phoneDialCodes: { value: string; label: string }[] = []
      for (const c of countries || []) {
        const raw = c.phone_code?.trim()
        if (!raw) continue
        const digits = raw.replace(/\D/g, '')
        if (!digits) continue
        const value = `+${digits}`
        if (seen.has(value)) continue
        seen.add(value)
        phoneDialCodes.push({
          value,
          label: `${value} (${String(c.code).toUpperCase()})`,
        })
      }

      return NextResponse.json({
        areas: areas || [],
        centers: centers || [],
        phoneDialCodes,
      })
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