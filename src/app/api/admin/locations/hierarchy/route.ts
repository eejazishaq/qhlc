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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'full' // full, countries, regions, areas, centers
    const countryId = searchParams.get('countryId') || ''
    const regionId = searchParams.get('regionId') || ''
    const areaId = searchParams.get('areaId') || ''

    if (type === 'countries') {
      // Return only countries
      const { data: countries, error } = await supabase
        .from('countries')
        .select('id, name, code, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching countries:', error)
        return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
      }

      return NextResponse.json({ countries: countries || [] })
    }

    if (type === 'regions' && countryId) {
      // Return regions for a specific country
      const { data: regions, error } = await supabase
        .from('regions')
        .select('id, name, code, is_active, country_id')
        .eq('country_id', countryId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching regions:', error)
        return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
      }

      return NextResponse.json({ regions: regions || [] })
    }

    if (type === 'areas' && regionId) {
      // Return areas for a specific region
      const { data: areas, error } = await supabase
        .from('areas')
        .select('id, name, code, is_active, region_id')
        .eq('region_id', regionId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching areas:', error)
        return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
      }

      return NextResponse.json({ areas: areas || [] })
    }

    if (type === 'centers' && areaId) {
      // Return exam centers for a specific area
      const { data: centers, error } = await supabase
        .from('exam_centers')
        .select('id, name, capacity, is_active, area_id')
        .eq('area_id', areaId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching exam centers:', error)
        return NextResponse.json({ error: 'Failed to fetch exam centers' }, { status: 500 })
      }

      return NextResponse.json({ centers: centers || [] })
    }

    // Return full hierarchy
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select(`
        id, name, code, is_active,
        regions!inner(
          id, name, code, is_active,
          areas!inner(
            id, name, code, is_active,
            exam_centers!inner(
              id, name, capacity, is_active
            )
          )
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (countriesError) {
      console.error('Error fetching hierarchy:', countriesError)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }

    // Transform the data to a cleaner structure
    const hierarchy = (countries || []).map(country => ({
      id: country.id,
      name: country.name,
      code: country.code,
      is_active: country.is_active,
      regions: (country.regions || []).map(region => ({
        id: region.id,
        name: region.name,
        code: region.code,
        is_active: region.is_active,
        country_id: country.id,
        areas: (region.areas || []).map(area => ({
          id: area.id,
          name: area.name,
          code: area.code,
          is_active: area.is_active,
          region_id: region.id,
          exam_centers: (area.exam_centers || []).map(center => ({
            id: center.id,
            name: center.name,
            capacity: center.capacity,
            is_active: center.is_active,
            area_id: area.id
          }))
        }))
      }))
    }))

    return NextResponse.json({ hierarchy })

  } catch (error) {
    console.error('Error in hierarchy API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
