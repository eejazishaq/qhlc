import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Fetch the exam center
    const { data: center, error } = await supabase
      .from('exam_centers')
      .select(`
        *,
        areas!inner(name, code, regions!inner(name, code, countries!inner(name, code)))
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching exam center:', error)
      return NextResponse.json({ error: 'Exam center not found' }, { status: 404 })
    }

    return NextResponse.json({ center })

  } catch (error) {
    console.error('Error in exam center GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
      is_active 
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

    // Check if exam center exists
    const { data: existingCenter } = await supabase
      .from('exam_centers')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCenter) {
      return NextResponse.json({ error: 'Exam center not found' }, { status: 404 })
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

    // Check if exam center name already exists in the same area for another center
    const { data: nameExists } = await supabase
      .from('exam_centers')
      .select('id')
      .eq('name', name.trim())
      .eq('area_id', area_id)
      .neq('id', id)
      .single()

    if (nameExists) {
      return NextResponse.json({ 
        error: 'Exam center name already exists in this area' 
      }, { status: 409 })
    }

    // Update the exam center
    const { data: updatedCenter, error: updateError } = await supabase
      .from('exam_centers')
      .update({
        name: name.trim(),
        address: address?.trim() || null,
        area_id,
        capacity: parseInt(capacity),
        contact_person: contact_person?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        areas!inner(name, code, regions!inner(name, code, countries!inner(name, code)))
      `)
      .single()

    if (updateError) {
      console.error('Error updating exam center:', updateError)
      return NextResponse.json({ error: 'Failed to update exam center' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      center: updatedCenter
    })

  } catch (error) {
    console.error('Error in exam center PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if exam center exists
    const { data: existingCenter } = await supabase
      .from('exam_centers')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCenter) {
      return NextResponse.json({ error: 'Exam center not found' }, { status: 404 })
    }

    // Check if exam center has users (cascade check)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('center_id', id)
      .limit(1)

    if (usersError) {
      console.error('Error checking users:', usersError)
      return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
    }

    if (users && users.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete exam center that has users assigned. Please reassign or remove all users first.' 
      }, { status: 409 })
    }

    // Delete the exam center
    const { error: deleteError } = await supabase
      .from('exam_centers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting exam center:', deleteError)
      return NextResponse.json({ error: 'Failed to delete exam center' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Exam center deleted successfully'
    })

  } catch (error) {
    console.error('Error in exam center DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
