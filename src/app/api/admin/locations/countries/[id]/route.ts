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

    // Fetch the country
    const { data: country, error } = await supabase
      .from('countries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching country:', error)
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    return NextResponse.json({ country })

  } catch (error) {
    console.error('Error in country GET API:', error)
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
    const { name, code, is_active } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and code are required' 
      }, { status: 400 })
    }

    // Check if country exists
    const { data: existingCountry } = await supabase
      .from('countries')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCountry) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    // Check if country code already exists for another country
    const { data: codeExists } = await supabase
      .from('countries')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .neq('id', id)
      .single()

    if (codeExists) {
      return NextResponse.json({ 
        error: 'Country code already exists' 
      }, { status: 409 })
    }

    // Update the country
    const { data: updatedCountry, error: updateError } = await supabase
      .from('countries')
      .update({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating country:', updateError)
      return NextResponse.json({ error: 'Failed to update country' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      country: updatedCountry
    })

  } catch (error) {
    console.error('Error in country PUT API:', error)
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

    // Check if country exists
    const { data: existingCountry } = await supabase
      .from('countries')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCountry) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    // Check if country has regions (cascade check)
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('id')
      .eq('country_id', id)
      .limit(1)

    if (regionsError) {
      console.error('Error checking regions:', regionsError)
      return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
    }

    if (regions && regions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete country that has regions. Please delete all regions first.' 
      }, { status: 409 })
    }

    // Delete the country
    const { error: deleteError } = await supabase
      .from('countries')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting country:', deleteError)
      return NextResponse.json({ error: 'Failed to delete country' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Country deleted successfully'
    })

  } catch (error) {
    console.error('Error in country DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
