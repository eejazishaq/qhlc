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

    // Debug queries
    const results: any = {}

    // 1. Count total profiles
    const { count: totalCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    results.totalCount = totalCount
    results.countError = countError?.message

    // 2. Get all profiles without any filters
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
    
    results.allProfiles = allProfiles?.length || 0
    results.allError = allError?.message
    results.profiles = allProfiles

    // 3. Check RLS policies by getting current user's profile
    const { data: currentProfile, error: currentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    results.currentProfile = currentProfile
    results.currentError = currentError?.message

    // 4. Check auth.users table (this might not work due to permissions)
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
      
      results.authUsers = authUsers?.length || 0
      results.authError = authError?.message
      results.authUsersData = authUsers
    } catch (error) {
      results.authUsers = 'Error accessing auth.users'
      results.authError = error instanceof Error ? error.message : 'Unknown error'
    }

    // 5. Check if there are users without profiles
    try {
      const { data: usersWithoutProfiles, error: usersError } = await supabase
        .rpc('get_users_without_profiles')
      
      results.usersWithoutProfiles = usersWithoutProfiles?.length || 0
      results.usersError = usersError?.message
      results.usersWithoutProfilesData = usersWithoutProfiles
    } catch (error) {
      results.usersWithoutProfiles = 'Function not available'
      results.usersError = error instanceof Error ? error.message : 'Unknown error'
    }

    // 6. Test with service role (bypass RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } } }
    )

    const { data: serviceProfiles, error: serviceError } = await serviceSupabase
      .from('profiles')
      .select('*')
    
    results.serviceProfiles = serviceProfiles?.length || 0
    results.serviceError = serviceError?.message

    return NextResponse.json(results)

  } catch (error) {
    console.error('Error in debug users API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 