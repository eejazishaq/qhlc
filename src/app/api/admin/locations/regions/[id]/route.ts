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

    // Fetch the region
    const { data: region, error } = await supabase
      .from('regions')
      .select(`
        *,
        countries!inner(name, code)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching region:', error)
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    }

    return NextResponse.json({ region })

  } catch (error) {
    console.error('Error in region GET API:', error)
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
    const { name, code, country_id, is_active } = body

    // Validate required fields
    if (!name || !code || !country_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, code, and country_id are required' 
      }, { status: 400 })
    }

    // Check if region exists
    const { data: existingRegion } = await supabase
      .from('regions')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingRegion) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
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

    // Check if region code already exists in the same country for another region
    const { data: codeExists } = await supabase
      .from('regions')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .eq('country_id', country_id)
      .neq('id', id)
      .single()

    if (codeExists) {
      return NextResponse.json({ 
        error: 'Region code already exists in this country' 
      }, { status: 409 })
    }

    // Update the region
    const { data: updatedRegion, error: updateError } = await supabase
      .from('regions')
      .update({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        country_id,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        countries!inner(name, code)
      `)
      .single()

    if (updateError) {
      console.error('Error updating region:', updateError)
      return NextResponse.json({ error: 'Failed to update region' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      region: updatedRegion
    })

  } catch (error) {
    console.error('Error in region PUT API:', error)
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

    // Check if region exists
    const { data: existingRegion } = await supabase
      .from('regions')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingRegion) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    }

    // Check if region has areas (cascade check)
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id')
      .eq('region_id', id)
      .limit(1)

    if (areasError) {
      console.error('Error checking areas:', areasError)
      return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
    }

    if (areas && areas.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete region that has areas. Please delete all areas first.' 
      }, { status: 409 })
    }

    // Delete the region
    const { error: deleteError } = await supabase
      .from('regions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting region:', deleteError)
      return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Region deleted successfully'
    })

  } catch (error) {
    console.error('Error in region DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
