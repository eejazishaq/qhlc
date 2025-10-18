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

    // Fetch the area
    const { data: area, error } = await supabase
      .from('areas')
      .select(`
        *,
        regions!inner(name, code, countries!inner(name, code))
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching area:', error)
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }

    return NextResponse.json({ area })

  } catch (error) {
    console.error('Error in area GET API:', error)
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
    const { name, code, region_id, is_active } = body

    // Validate required fields
    if (!name || !code || !region_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, code, and region_id are required' 
      }, { status: 400 })
    }

    // Check if area exists
    const { data: existingArea } = await supabase
      .from('areas')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }

    // Check if region exists
    const { data: region } = await supabase
      .from('regions')
      .select('id')
      .eq('id', region_id)
      .single()

    if (!region) {
      return NextResponse.json({ 
        error: 'Region not found' 
      }, { status: 404 })
    }

    // Check if area code already exists in the same region for another area
    const { data: codeExists } = await supabase
      .from('areas')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .eq('region_id', region_id)
      .neq('id', id)
      .single()

    if (codeExists) {
      return NextResponse.json({ 
        error: 'Area code already exists in this region' 
      }, { status: 409 })
    }

    // Update the area
    const { data: updatedArea, error: updateError } = await supabase
      .from('areas')
      .update({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        region_id,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        regions!inner(name, code, countries!inner(name, code))
      `)
      .single()

    if (updateError) {
      console.error('Error updating area:', updateError)
      return NextResponse.json({ error: 'Failed to update area' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      area: updatedArea
    })

  } catch (error) {
    console.error('Error in area PUT API:', error)
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

    // Check if area exists
    const { data: existingArea } = await supabase
      .from('areas')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }

    // Check if area has exam centers (cascade check)
    const { data: centers, error: centersError } = await supabase
      .from('exam_centers')
      .select('id')
      .eq('area_id', id)
      .limit(1)

    if (centersError) {
      console.error('Error checking exam centers:', centersError)
      return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
    }

    if (centers && centers.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete area that has exam centers. Please delete all exam centers first.' 
      }, { status: 409 })
    }

    // Delete the area
    const { error: deleteError } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting area:', deleteError)
      return NextResponse.json({ error: 'Failed to delete area' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Area deleted successfully'
    })

  } catch (error) {
    console.error('Error in area DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
