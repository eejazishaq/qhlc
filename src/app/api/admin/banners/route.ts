import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for public access
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    
   // Get authentication token from Authorization header
   const authHeader = request.headers.get('Authorization')
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
     console.log('No auth header found')
     return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
   }

   const token = authHeader.substring(7)
   
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

    // Fetch all banners ordered by display_order
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching banners:', error)
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
    }

    return NextResponse.json({ banners: banners || [] })
  } catch (error) {
    console.error('Error in banners GET:', error)
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized api' },
        { status: 401 }
      )
    }

    // Get user profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, image_url, link_url, is_active, display_order } = body

    // Validate required fields
    if (!title || !image_url) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 })
    }

    // If no display_order provided, get the next available order
    let finalDisplayOrder = display_order
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const { data: maxOrder } = await supabase
        .from('banners')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      finalDisplayOrder = (maxOrder?.display_order || 0) + 1
    }

    // Insert new banner
    const { data: banner, error } = await supabase
      .from('banners')
      .insert({
        title,
        description,
        image_url,
        link_url,
        is_active: is_active !== undefined ? is_active : true,
        display_order: finalDisplayOrder,
        created_by: user.id
      })

    if (error) {
      console.error('Error creating banner:', error)
      return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
    }

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Error in banners POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 