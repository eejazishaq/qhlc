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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const countryId = searchParams.get('countryId') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build query
    let query = supabase
      .from('regions')
      .select(`
        *,
        countries!inner(name, code)
      `)

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    // Apply country filter
    if (countryId) {
      query = query.eq('country_id', countryId)
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: regions, error, count } = await query

    if (error) {
      console.error('Error fetching regions:', error)
      return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = count
    if (!totalCount) {
      const { count: total } = await supabase
        .from('regions')
        .select('*', { count: 'exact', head: true })
      totalCount = total || 0
    }

    return NextResponse.json({
      regions: regions || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error in regions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, code, country_id, is_active = true } = body

    // Validate required fields
    if (!name || !code || !country_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, code, and country_id are required' 
      }, { status: 400 })
    }

    // Check if country exists
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('id', country_id)
      .single()

    if (!country) {
      return NextResponse.json({ 
        error: 'Country not found' 
      }, { status: 404 })
    }

    // Check if region code already exists in the same country
    const { data: existingRegion } = await supabase
      .from('regions')
      .select('id')
      .eq('code', code)
      .eq('country_id', country_id)
      .single()

    if (existingRegion) {
      return NextResponse.json({ 
        error: 'Region code already exists in this country' 
      }, { status: 409 })
    }

    // Create the region
    const { data: newRegion, error: insertError } = await supabase
      .from('regions')
      .insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        country_id,
        is_active
      })
      .select(`
        *,
        countries!inner(name, code)
      `)
      .single()

    if (insertError) {
      console.error('Error creating region:', insertError)
      return NextResponse.json({ error: 'Failed to create region' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      region: newRegion
    }, { status: 201 })

  } catch (error) {
    console.error('Error in regions POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
