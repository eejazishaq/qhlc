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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const centerId = searchParams.get('centerId') || ''
    const areaId = searchParams.get('areaId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all statistics and data in parallel for better performance
    const [
      userStats,
      centerStats,
      areaStats,
      transferStats,
      users,
      centers,
      areas
    ] = await Promise.all([
      // User Statistics
      (async () => {
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const { count: usersWithCenters } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .not('center_id', 'is', null)

        return {
          totalUsers: totalUsers || 0,
          usersWithCenters: usersWithCenters || 0,
          usersWithoutCenters: (totalUsers || 0) - (usersWithCenters || 0)
        }
      })(),

      // Center Statistics
      (async () => {
        const { count: totalCenters } = await supabase
          .from('exam_centers')
          .select('*', { count: 'exact', head: true })

        const { count: activeCenters } = await supabase
          .from('exam_centers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        return {
          totalCenters: totalCenters || 0,
          activeCenters: activeCenters || 0
        }
      })(),

      // Area Statistics
      (async () => {
        const { count: totalAreas } = await supabase
          .from('areas')
          .select('*', { count: 'exact', head: true })

        const { count: activeAreas } = await supabase
          .from('areas')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        return {
          totalAreas: totalAreas || 0,
          activeAreas: activeAreas || 0
        }
      })(),

      // Transfer Statistics (this month)
      (async () => {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        // For now, we'll count profile updates this month as transfers
        // In the future, you might want to create a separate transfers table
        const { count: transfersThisMonth } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', startOfMonth.toISOString())
          .not('center_id', 'is', null)

        return {
          transfersThisMonth: transfersThisMonth || 0
        }
      })(),

      // Users with center and area information
      (async () => {
        console.log('Debug - Starting users query...')
        
        let query = supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            mobile,
            user_type,
            center_id,
            area_id,
            is_active,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
        
        console.log('Debug - Basic query built')

        // Apply filters
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,serial_number.ilike.%${search}%`)
        }

        if (centerId) {
          query = query.eq('center_id', centerId)
        }

        if (areaId) {
          query = query.eq('area_id', areaId)
        }

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        console.log('Debug - About to execute query...')
        const { data: users, error, count } = await query

        console.log('Debug - Query executed, result:', { users: users?.length || 0, error, count })

        if (error) {
          console.error('Error fetching users:', error)
          return { users: [], totalCount: 0 }
        }

        // Now fetch center and area names for all users efficiently
        const centerIds = [...new Set((users || []).map(u => u.center_id).filter(Boolean))]
        const areaIds = [...new Set((users || []).map(u => u.area_id).filter(Boolean))]

        console.log('Debug - Users found:', users?.length || 0)
        console.log('Debug - Center IDs:', centerIds)
        console.log('Debug - Area IDs:', areaIds)

        // Batch fetch center names (only if we have center IDs)
        let centerMap = new Map()
        if (centerIds.length > 0) {
          const { data: centers, error: centerError } = await supabase
            .from('exam_centers')
            .select('id, name')
            .in('id', centerIds)
          
          if (centerError) {
            console.error('Error fetching centers:', centerError)
          } else {
            centerMap = new Map(centers?.map(c => [c.id, c.name]) || [])
            console.log('Debug - Centers fetched:', centers?.length || 0)
          }
        }

        // Batch fetch area names (only if we have area IDs)
        let areaMap = new Map()
        if (areaIds.length > 0) {
          const { data: areas, error: areaError } = await supabase
            .from('areas')
            .select('id, name')
            .in('id', areaIds)
          
          if (areaError) {
            console.error('Error fetching areas:', areaError)
          } else {
            areaMap = new Map(areas?.map(a => [a.id, a.name]) || [])
            console.log('Debug - Areas fetched:', areas?.length || 0)
          }
        }

        // Add names to users
        const usersWithDetails = (users || []).map(user => ({
          ...user,
          center_name: user.center_id ? centerMap.get(user.center_id) || null : null,
          area_name: user.area_id ? areaMap.get(user.area_id) || null : null
        }))

        console.log('Debug - Final users with details:', usersWithDetails.length)

        return {
          users: usersWithDetails,
          totalCount: count || 0
        }
      })(),

      // Centers with area information
      (async () => {
        const { data: centers, error } = await supabase
          .from('exam_centers')
          .select(`
            id,
            name,
            address,
            capacity,
            area_id,
            is_active
          `)
          .eq('is_active', true)
          .order('name')

        if (error) {
          console.error('Error fetching centers:', error)
          return []
        }

        // Now fetch area names for all centers efficiently
        const areaIds = [...new Set((centers || []).map(c => c.area_id).filter(Boolean))]

        // Batch fetch area names
        const { data: areas } = await supabase
          .from('areas')
          .select('id, name')
          .in('id', areaIds)

        // Create lookup map
        const areaMap = new Map(areas?.map(a => [a.id, a.name]) || [])

        // Add area names to centers
        const centersWithAreaNames = (centers || []).map(center => ({
          ...center,
          area_name: center.area_id ? areaMap.get(center.area_id) || null : null
        }))

        return centersWithAreaNames
      })(),

      // Areas
      (async () => {
        const { data: areas, error } = await supabase
          .from('areas')
          .select(`
            id,
            name
          `)
          .eq('is_active', true)
          .order('name')

        if (error) {
          console.error('Error fetching areas:', error)
          return []
        }

        return areas || []
      })()
    ])

    

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          users: userStats,
          centers: centerStats,
          areas: areaStats,
          transfers: transferStats
        },
        users: users.users,
        totalUsers: users.totalCount,
        centers,
        areas,
        pagination: {
          page,
          limit,
          total: users.totalCount,
          pages: Math.ceil(users.totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error in admin transfer API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, newCenterId, reason } = body

    if (!userId || !newCenterId) {
      return NextResponse.json({ error: 'User ID and new center ID are required' }, { status: 400 })
    }

    // Get the new center to find its area_id
    const { data: newCenter, error: centerError } = await supabase
      .from('exam_centers')
      .select('id, area_id')
      .eq('id', newCenterId)
      .single()

    if (centerError || !newCenter) {
      return NextResponse.json({ error: 'Invalid center ID' }, { status: 400 })
    }

    // Update user's center and area
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        center_id: newCenterId,
        area_id: newCenter.area_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user center:', updateError)
      return NextResponse.json({ error: 'Failed to transfer user' }, { status: 500 })
    }

    // TODO: Log the transfer in a transfers table for audit purposes
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: 'User transferred successfully'
    })

  } catch (error) {
    console.error('Error in transfer API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 