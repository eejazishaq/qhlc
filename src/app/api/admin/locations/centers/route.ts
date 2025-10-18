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
    const areaId = searchParams.get('areaId') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build query
    let query = supabase
      .from('exam_centers')
      .select(`
        *,
        areas!inner(name, code, regions!inner(name, code, countries!inner(name, code)))
      `)

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,contact_person.ilike.%${search}%`)
    }

    // Apply area filter
    if (areaId) {
      query = query.eq('area_id', areaId)
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
    const { data: centers, error, count } = await query

    if (error) {
      console.error('Error fetching exam centers:', error)
      return NextResponse.json({ error: 'Failed to fetch exam centers' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = count
    if (!totalCount) {
      const { count: total } = await supabase
        .from('exam_centers')
        .select('*', { count: 'exact', head: true })
      totalCount = total || 0
    }

    return NextResponse.json({
      centers: centers || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error in exam centers API:', error)
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
    const { 
      name, 
      address, 
      area_id, 
      capacity, 
      contact_person, 
      contact_phone, 
      is_active = true 
    } = body

    // Validate required fields
    if (!name || !area_id || !capacity) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, area_id, and capacity are required' 
      }, { status: 400 })
    }

    // Validate capacity
    if (capacity < 1 || capacity > 1000) {
      return NextResponse.json({ 
        error: 'Capacity must be between 1 and 1000' 
      }, { status: 400 })
    }

    // Check if area exists
    const { data: area } = await supabase
      .from('areas')
      .select('id')
      .eq('id', area_id)
      .single()

    if (!area) {
      return NextResponse.json({ 
        error: 'Area not found' 
      }, { status: 404 })
    }

    // Check if exam center name already exists in the same area
    const { data: existingCenter } = await supabase
      .from('exam_centers')
      .select('id')
      .eq('name', name.trim())
      .eq('area_id', area_id)
      .single()

    if (existingCenter) {
      return NextResponse.json({ 
        error: 'Exam center name already exists in this area' 
      }, { status: 409 })
    }

    // Create the exam center
    const { data: newCenter, error: insertError } = await supabase
      .from('exam_centers')
      .insert({
        name: name.trim(),
        address: address?.trim() || null,
        area_id,
        capacity: parseInt(capacity),
        contact_person: contact_person?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        is_active
      })
      .select(`
        *,
        areas!inner(name, code, regions!inner(name, code, countries!inner(name, code)))
      `)
      .single()

    if (insertError) {
      console.error('Error creating exam center:', insertError)
      return NextResponse.json({ error: 'Failed to create exam center' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      center: newCenter
    }, { status: 201 })

  } catch (error) {
    console.error('Error in exam centers POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
