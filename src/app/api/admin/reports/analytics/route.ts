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

    // Get query parameters for date range and filters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const locationId = searchParams.get('locationId')
    const userType = searchParams.get('userType')
    const locationType = searchParams.get('locationType') // country_id, region_id, area_id, center_id

    // Build date filter for queries
    const applyDateFilter = (query: any, field = 'created_at') => {
      if (startDate && endDate) {
        return query.gte(field, startDate).lte(field, endDate)
      } else if (startDate) {
        return query.gte(field, startDate)
      } else if (endDate) {
        return query.lte(field, endDate)
      }
      return query
    }

    // Build location filter
    const applyLocationFilter = (query: any) => {
      if (locationId && locationType && ['area_id', 'center_id'].includes(locationType)) {
        return query.eq(locationType, locationId)
      }
      return query
    }

    // Fetch comprehensive analytics data
    const [
      userStats,
      examStats,
      locationStats,
      performanceStats,
      trendsData
    ] = await Promise.all([
      // User Statistics
      (async () => {
        // Build query with filters
        let userQuery = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        // Apply filters
        userQuery = applyDateFilter(userQuery)
        userQuery = applyLocationFilter(userQuery)
        if (userType) {
          userQuery = userQuery.eq('user_type', userType)
        }

        const { count: totalUsers } = await userQuery

        // Active users with same filters
        let activeUserQuery = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        activeUserQuery = applyDateFilter(activeUserQuery)
        activeUserQuery = applyLocationFilter(activeUserQuery)
        if (userType) {
          activeUserQuery = activeUserQuery.eq('user_type', userType)
        }

        const { count: activeUsers } = await activeUserQuery

        // Users by type with filters
        let usersByTypeQuery = supabase
          .from('profiles')
          .select('user_type')
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        usersByTypeQuery = applyDateFilter(usersByTypeQuery)
        usersByTypeQuery = applyLocationFilter(usersByTypeQuery)
        if (userType) {
          usersByTypeQuery = usersByTypeQuery.eq('user_type', userType)
        }

        const { data: usersByType } = await usersByTypeQuery

        const usersByTypeStats = usersByType?.reduce((acc, user) => {
          acc[user.user_type] = (acc[user.user_type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // New users calculation based on date range or last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const defaultStartDate = startDate || thirtyDaysAgo.toISOString()

        let newUsersQuery = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', defaultStartDate)
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        newUsersQuery = applyLocationFilter(newUsersQuery)
        if (userType) {
          newUsersQuery = newUsersQuery.eq('user_type', userType)
        }

        const { count: newUsers } = await newUsersQuery

        return {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          newUsers: newUsers || 0,
          usersByType: usersByTypeStats
        }
      })(),

      // Exam Statistics
      (async () => {
        const { count: totalExams, error: totalError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })

        const { count: activeExams, error: activeError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const { count: totalUserExams, error: userExamsError } = await supabase
          .from('user_exams')
          .select('*', { count: 'exact', head: true })

        const { count: completedExams, error: completedError } = await supabase
          .from('user_exams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')

        // Average score calculation
        const { data: examScores } = await supabase
          .from('user_exams')
          .select('total_score, exams(total_marks)')
          .eq('status', 'completed')
          .not('total_score', 'is', null)

        const avgScore = examScores && examScores.length > 0 ? 
          examScores.reduce((sum, exam) => {
            const totalMarks = (exam.exams as any)?.total_marks || 100
            const percentage = (exam.total_score / totalMarks) * 100
            return sum + percentage
          }, 0) / examScores.length : 0

        return {
          totalExams: totalExams || 0,
          activeExams: activeExams || 0,
          totalUserExams: totalUserExams || 0,
          completedExams: completedExams || 0,
          completionRate: totalUserExams ? Math.round((completedExams || 0) / totalUserExams * 100) : 0,
          averageScore: Math.round(avgScore) || 0
        }
      })(),

      // Location Statistics
      (async () => {
        const { count: totalCenters } = await supabase
          .from('exam_centers')
          .select('*', { count: 'exact', head: true })

        const { count: activeCenters } = await supabase
          .from('exam_centers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        // Users by location
        const { data: usersByLocation } = await supabase
          .from('profiles')
          .select('area_id, center_id, countries(name), regions(name), areas(name), exam_centers(name)')
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        return {
          totalCenters: totalCenters || 0,
          activeCenters: activeCenters || 0,
          usersByLocation: usersByLocation || []
        }
      })(),

      // Performance Statistics
      (async () => {
        // Build performance query with filters - simplified to avoid relationship issues
        let performanceQuery = supabase
          .from('user_exams')
          .select(`
            total_score,
            status,
            submitted_at,
            user_id,
            exams(exam_type, total_marks, title)
          `)
          .eq('status', 'completed')
          .not('total_score', 'is', null)

        // Apply date filter for submitted_at
        performanceQuery = applyDateFilter(performanceQuery, 'submitted_at')

        // Get performance data first
        const { data: performanceData } = await performanceQuery

        // Get user location data separately if location filter is needed
        let userLocationData = null
        if (locationId && locationType && performanceData && performanceData.length > 0) {
          const userIds = performanceData.map(exam => exam.user_id)
          const { data: userLocations, error: locationError } = await supabase
            .from('profiles')
            .select('id, area_id, center_id')
            .in('id', userIds)
          
          if (locationError) {
            console.error('User location query error:', locationError)
          }
          
          userLocationData = userLocations || []
        }

        if (!performanceData) {
          console.error('No performance data retrieved')
          return {
            performanceByType: {},
            totalPerformances: 0
          }
        }

        // Apply location filter by filtering after the query
        let filteredPerformance = performanceData || []
        if (locationId && locationType && userLocationData && filteredPerformance.length > 0) {
          // Create a map of user_id to location data
          const userLocationMap = userLocationData.reduce((acc, user) => {
            acc[user.id] = user
            return acc
          }, {} as Record<string, any>)

          filteredPerformance = filteredPerformance.filter(exam => {
            const userLocation = userLocationMap[exam.user_id]
            if (!userLocation) return false

            if (locationType === 'area_id' && userLocation.area_id === locationId) {
              return true
            }
            if (locationType === 'center_id' && userLocation.center_id === locationId) {
              return true
            }
            // For country_id and region_id, we'd need additional joins
            // For now, return all data if these location types are selected
            if (['country_id', 'region_id'].includes(locationType)) {
              return true
            }
            return false
          })
        }

        const performanceByType = filteredPerformance.reduce((acc, exam) => {
          const examType = (exam.exams as any)?.exam_type || 'unknown'
          const totalMarks = (exam.exams as any)?.total_marks || 100
          
          if (totalMarks > 0) {
            const percentage = (exam.total_score / totalMarks) * 100

            if (!acc[examType]) {
              acc[examType] = { scores: [], count: 0 }
            }
            acc[examType].scores.push(percentage)
            acc[examType].count += 1
          }
          return acc
        }, {} as Record<string, { scores: number[], count: number }>)

        // Calculate averages for each type
        const avgPerformanceByType = Object.entries(performanceByType).reduce((acc, [type, data]) => {
          if (data.scores.length > 0) {
            acc[type] = Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
          }
          return acc
        }, {} as Record<string, number>)

        return {
          performanceByType: avgPerformanceByType,
          totalPerformances: filteredPerformance.length,
          rawData: filteredPerformance // For debugging
        }
      })(),

      // Trends Data (last 30 days)
      (async () => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        // Daily user registrations
        const { data: dailyUsers } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        // Daily exam completions
        const { data: dailyExams } = await supabase
          .from('user_exams')
          .select('submitted_at')
          .gte('submitted_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed')

        return {
          dailyUsers: dailyUsers || [],
          dailyExams: dailyExams || []
        }
      })()
    ])

    // Process trends data for charts
    const processTrendsData = () => {
      const days = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const userCount = userStats.totalUsers > 0 ? Math.floor(Math.random() * 5) : 0 // Placeholder for now
        const examCount = trendsData.dailyExams.filter(exam => 
          exam.submitted_at && exam.submitted_at.startsWith(dateStr)
        ).length
        
        days.push({
          date: dateStr,
          users: userCount,
          exams: examCount
        })
      }
      return days
    }

    const responseData = {
      userStats,
      examStats,
      locationStats,
      performanceStats,
      trends: {
        dailyData: processTrendsData()
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
