import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Get authentication token from Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
      }
  
      const token = authHeader.substring(7)
      
      // Verify the token and get user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
      }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const areaId = searchParams.get('areaId') || ''
    const centerId = searchParams.get('centerId') || ''
    const status = searchParams.get('status') || ''
    const subject = searchParams.get('subject') || ''
    const teacher = searchParams.get('teacher') || ''

    // Build query
    let query = supabase
      .from('qhlc_classes')
      .select('*')

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,teacher_name.ilike.%${search}%`)
    }

    if (areaId) {
      query = query.eq('area_id', areaId)
    }

    if (centerId) {
      query = query.eq('center_id', centerId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (subject) {
      query = query.ilike('subject', `%${subject}%`)
    }

    if (teacher) {
      query = query.ilike('teacher_name', `%${teacher}%`)
    }

    // Apply sorting (newest first)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: classes, error, count } = await query

    if (error) {
      console.error('Error fetching classes:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = count
    if (!totalCount) {
      const { count: total } = await supabase
        .from('qhlc_classes')
        .select('*', { count: 'exact', head: true })
      totalCount = total || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        classes: classes || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error in classes API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }
  
    const token = authHeader.substring(7)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
  
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  
    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
  
    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      subject, 
      teacher_name, 
      area_id, 
      center_id, 
      address, 
      google_map_link, 
      contact_number, 
      email, 
      status = 'active' 
    } = body

    // Validate required fields
    if (!title || !teacher_name || !area_id || !center_id || !address || !contact_number) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, teacher_name, area_id, center_id, address, contact_number' 
      }, { status: 400 })
    }

    // Create the class
    const { data: newClass, error: insertError } = await supabase
      .from('qhlc_classes')
      .insert({
        title,
        description,
        subject,
        teacher_name,
        area_id,
        center_id,
        address,
        google_map_link,
        contact_number,
        email,
        status
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating class:', insertError)
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    })

  } catch (error) {
    console.error('Error in create class API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id,
      title, 
      description, 
      subject, 
      teacher_name, 
      area_id, 
      center_id, 
      address, 
      google_map_link, 
      contact_number, 
      email, 
      status 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Update the class
    const { data: updatedClass, error: updateError } = await supabase
      .from('qhlc_classes')
      .update({
        title,
        description,
        subject,
        teacher_name,
        area_id,
        center_id,
        address,
        google_map_link,
        contact_number,
        email,
        status
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating class:', updateError)
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    })

  } catch (error) {
    console.error('Error in update class API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Delete the class
    const { error: deleteError } = await supabase
      .from('qhlc_classes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting class:', deleteError)
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete class API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 