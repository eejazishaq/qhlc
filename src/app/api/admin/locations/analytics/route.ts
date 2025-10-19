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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // Fetch location analytics data
    const [
      countriesResult,
      regionsResult,
      areasResult,
      centersResult,
      usersResult,
      examResults
    ] = await Promise.all([
      // Countries analytics
      supabase
        .from('countries')
        .select('id, name, code, is_active, created_at')
        .order('created_at', { ascending: false }),
      
      // Regions analytics
      supabase
        .from('regions')
        .select(`
          id, name, code, is_active, created_at,
          countries!inner(id, name, code)
        `)
        .order('created_at', { ascending: false }),
      
      // Areas analytics
      supabase
        .from('areas')
        .select(`
          id, name, code, is_active, created_at,
          regions!inner(id, name, code, countries!inner(id, name, code))
        `)
        .order('created_at', { ascending: false }),
      
      // Exam centers analytics
      supabase
        .from('exam_centers')
        .select(`
          id, name, capacity, is_active, created_at,
          areas!inner(id, name, code, regions!inner(id, name, code, countries!inner(id, name, code)))
        `)
        .order('created_at', { ascending: false }),
      
      // Users by location - need to join manually since direct relationships don't work
      supabase
        .from('profiles')
        .select(`
          id, full_name, user_type, is_active, created_at, area_id, center_id
        `)
        .not('user_type', 'eq', 'admin')
        .not('user_type', 'eq', 'super_admin'),
      
      // Exam results by location - use user_id to avoid relationship conflicts
      supabase
        .from('user_exams')
        .select(`
          id, user_id, exam_id, total_score, status, created_at,
          exams!inner(id, title, total_marks)
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
    ])

    // Handle potential errors - log but don't fail completely
    const errors = [countriesResult.error, regionsResult.error, areasResult.error, centersResult.error, usersResult.error, examResults.error].filter(Boolean)
    if (errors.length > 0) {
      console.error('Analytics errors (continuing with partial data):', errors)
    }

    // Process the data
    const countries = countriesResult.data || []
    const regions = regionsResult.data || []
    const areas = areasResult.data || []
    const centers = centersResult.data || []
    const users = usersResult.data || []
    const exams = examResults.data || []

    // Create lookup maps for areas, centers, and users to get location data
    const areasMap = new Map()
    const centersMap = new Map()
    const usersMap = new Map()
    
    areas.forEach(area => {
      areasMap.set(area.id, {
        id: area.id,
        name: area.name,
        code: area.code,
        regions: area.regions
      })
    })

    centers.forEach(center => {
      centersMap.set(center.id, {
        id: center.id,
        name: center.name,
        capacity: center.capacity,
        areas: center.areas
      })
    })

    // Create user map for exam performance lookup
    users.forEach(user => {
      const area = areasMap.get(user.area_id)
      const center = centersMap.get(user.center_id)
      usersMap.set(user.id, {
        id: user.id,
        full_name: user.full_name,
        user_type: user.user_type,
        area_id: user.area_id,
        center_id: user.center_id,
        area: area,
        center: center
      })
    })

    // Calculate location statistics
    const locationStats = {
      total: {
        countries: countries.length,
        regions: regions.length,
        areas: areas.length,
        centers: centers.length,
        users: users.length,
        totalCapacity: centers.reduce((sum, center) => sum + (center.capacity || 0), 0)
      },
      active: {
        countries: countries.filter(c => c.is_active).length,
        regions: regions.filter(r => r.is_active).length,
        areas: areas.filter(a => a.is_active).length,
        centers: centers.filter(c => c.is_active).length,
        users: users.filter(u => u.is_active).length
      }
    }

    // Calculate capacity utilization
    const capacityUtilization = centers.map(center => {
      const usersAtCenter = users.filter(user => user.center_id === center.id)
      return {
        id: center.id,
        name: center.name,
        capacity: center.capacity,
        areaName: center.areas?.name || 'N/A',
        regionName: center.areas?.regions?.name || 'N/A',
        countryName: center.areas?.regions?.countries?.name || 'N/A',
        utilization: usersAtCenter.length,
        utilizationPercentage: center.capacity > 0 
          ? Math.round((usersAtCenter.length / center.capacity) * 100)
          : 0
      }
    })

    // Users by location breakdown
    const usersByLocation = {
      byCountry: {},
      byRegion: {},
      byArea: {},
      byCenter: {},
      byUserType: {}
    }

    users.forEach(user => {
      // Get area data from the lookup map
      const area = areasMap.get(user.area_id)
      const region = area?.regions
      const country = region?.countries
      
      // Get center data from the lookup map
      const center = centersMap.get(user.center_id)

      // Count by country
      if (country) {
        usersByLocation.byCountry[country.name] = (usersByLocation.byCountry[country.name] || 0) + 1
      }

      // Count by region
      if (region) {
        usersByLocation.byRegion[region.name] = (usersByLocation.byRegion[region.name] || 0) + 1
      }

      // Count by area
      if (area) {
        usersByLocation.byArea[area.name] = (usersByLocation.byArea[area.name] || 0) + 1
      }

      // Count by center
      if (center) {
        usersByLocation.byCenter[center.name] = (usersByLocation.byCenter[center.name] || 0) + 1
      }

      // Count by user type
      usersByLocation.byUserType[user.user_type] = (usersByLocation.byUserType[user.user_type] || 0) + 1
    })

    // Exam performance by location
    const examPerformance = {
      byCountry: {},
      byRegion: {},
      byArea: {},
      byCenter: {}
    }

    exams.forEach(exam => {
      const user = usersMap.get(exam.user_id)
      if (!user) return // Skip if user not found
      
      const area = user.area
      const region = area?.regions
      const country = region?.countries
      const center = user.center

      const score = exam.total_score || 0
      const totalMarks = exam.exams?.total_marks || 1
      const percentage = Math.round((score / totalMarks) * 100)

      // Add to country performance
      if (country) {
        if (!examPerformance.byCountry[country.name]) {
          examPerformance.byCountry[country.name] = { total: 0, sum: 0, avg: 0 }
        }
        examPerformance.byCountry[country.name].total++
        examPerformance.byCountry[country.name].sum += percentage
        examPerformance.byCountry[country.name].avg = Math.round(examPerformance.byCountry[country.name].sum / examPerformance.byCountry[country.name].total)
      }

      // Add to region performance
      if (region) {
        if (!examPerformance.byRegion[region.name]) {
          examPerformance.byRegion[region.name] = { total: 0, sum: 0, avg: 0 }
        }
        examPerformance.byRegion[region.name].total++
        examPerformance.byRegion[region.name].sum += percentage
        examPerformance.byRegion[region.name].avg = Math.round(examPerformance.byRegion[region.name].sum / examPerformance.byRegion[region.name].total)
      }

      // Add to area performance
      if (area) {
        if (!examPerformance.byArea[area.name]) {
          examPerformance.byArea[area.name] = { total: 0, sum: 0, avg: 0 }
        }
        examPerformance.byArea[area.name].total++
        examPerformance.byArea[area.name].sum += percentage
        examPerformance.byArea[area.name].avg = Math.round(examPerformance.byArea[area.name].sum / examPerformance.byArea[area.name].total)
      }

      // Add to center performance
      if (center) {
        if (!examPerformance.byCenter[center.name]) {
          examPerformance.byCenter[center.name] = { total: 0, sum: 0, avg: 0 }
        }
        examPerformance.byCenter[center.name].total++
        examPerformance.byCenter[center.name].sum += percentage
        examPerformance.byCenter[center.name].avg = Math.round(examPerformance.byCenter[center.name].sum / examPerformance.byCenter[center.name].total)
      }
    })

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = {
      newUsers: users.filter(user => new Date(user.created_at) >= thirtyDaysAgo).length,
      newCenters: centers.filter(center => new Date(center.created_at) >= thirtyDaysAgo).length,
      newExams: exams.filter(exam => new Date(exam.created_at) >= thirtyDaysAgo).length
    }

    return NextResponse.json({
      locationStats,
      capacityUtilization,
      usersByLocation,
      examPerformance,
      recentActivity,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in location analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
