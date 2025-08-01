import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


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
     
     // Create Supabase client with the user's token
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         global: {
           headers: {
             Authorization: `Bearer ${token}`
           }
         }
       }
     )

     
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    console.log('User profile:', { user_type: profile.user_type })

    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, image_url, link_url, is_active, display_order } = body

    // Validate required fields
    if (!title || !image_url) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 })
    }

    // Update banner
    const { data: banner, error } = await supabase
      .from('banners')
      .update({
        title,
        description,
        image_url,
        link_url,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating banner:', error)
      return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
    }

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Error in banner PUT:', error)
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
    
    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    console.log('User profile:', { user_type: profile.user_type })

    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // Check if banner exists
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('id')
      .eq('id', id)
      .single()

      console.log('existingBanner', existingBanner);
      

    if (fetchError || !existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Delete banner
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting banner:', error)
      return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Error in banner DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 