import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // const cookieStore = await cookies()
    // const token = cookieStore.get('sb-kgangiolfxkwqkvbiwdb-auth-token')?.value || 
    //               cookieStore.get('sb-kgangiolfxkwqkvbiwdb-auth-token.0')?.value

    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

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
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('profiles')
      .select('*')

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,serial_number.ilike.%${search}%`)
    }

    if (role && role !== 'all') {
      query = query.eq('user_type', role)
    }

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
    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Fetch areas and centers data separately
    const { data: areas } = await supabase
      .from('areas')
      .select('id, name')

    const { data: centers } = await supabase
      .from('exam_centers')
      .select('id, name')

    // Create lookup maps
    const areasMap = new Map(areas?.map(area => [area.id, area]) || [])
    const centersMap = new Map(centers?.map(center => [center.id, center]) || [])

    // Merge the data
    const usersWithLocations = users?.map(user => ({
      ...user,
      areas: areasMap.get(user.area_id) || null,
      centers: centersMap.get(user.center_id) || null
    })) || []

    // Get total count for pagination
    let totalCount = count
    if (!totalCount) {
      const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      totalCount = total || 0
    }

    return NextResponse.json({
      users: usersWithLocations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error in users API:', error)
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
      full_name,
      mobile,
      whatsapp_no,
      gender,
      user_type,
      area_id,
      center_id,
      father_name,
      dob,
      iqama_number,
      is_active = true
    } = body

    // Validate required fields
    if (!full_name || !mobile || !gender || !user_type || !area_id || !center_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalize gender field to match database expectations (lowercase)
    const normalizedGender = gender?.toLowerCase() === 'female'
      ? 'female'
      : gender?.toLowerCase() === 'male'
      ? 'male'
      : null;

    if (!normalizedGender) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
    }

    // Check if mobile number already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
    }

    // Generate serial number
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const serialNumber = `QHLC-${String((count || 0) + 1).padStart(5, '0')}`

    // Create user profile - don't specify ID, let the database auto-generate it
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        full_name,
        mobile,
        whatsapp_no,
        gender: normalizedGender,
        user_type,
        area_id,
        center_id,
        father_name: father_name || null,
        dob: dob || null,
        iqama_number: iqama_number || null,
        serial_number: serialNumber,
        is_active
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({ user: newUser }, { status: 201 })

  } catch (error) {
    console.error('Error in create user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 