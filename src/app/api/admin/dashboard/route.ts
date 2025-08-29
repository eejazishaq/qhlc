import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
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

    // Get all statistics in parallel for better performance
    const [
      userStats,
      examStats,
      questionStats,
      centerStats,
      recentActivity,
      systemHealth
    ] = await Promise.all([
      // User Statistics
      (async () => {
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const { count: newThisMonth } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

        const { data: usersByRole } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('is_active', true)

        const roleStats = usersByRole?.reduce((acc, user) => {
          acc[user.user_type] = (acc[user.user_type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        return {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          newThisMonth: newThisMonth || 0,
          roleStats
        }
      })(),

      // Exam Statistics
      (async () => {
        const { count: totalExams } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })

        const { count: activeExams } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const { count: totalUserExams } = await supabase
          .from('user_exams')
          .select('*', { count: 'exact', head: true })

        const { count: completedExams } = await supabase
          .from('user_exams')
          .select('*', { count: 'exact', head: true })
          .in('status', ['completed', 'evaluated', 'published'])

        const { count: pendingEvaluation } = await supabase
          .from('user_exams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')

        return {
          totalExams: totalExams || 0,
          activeExams: activeExams || 0,
          totalUserExams: totalUserExams || 0,
          completedExams: completedExams || 0,
          pendingEvaluation: pendingEvaluation || 0
        }
      })(),

      // Question Statistics
      (async () => {
        const { count: totalQuestions } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })

        const { count: activeQuestions } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        return {
          totalQuestions: totalQuestions || 0,
          activeQuestions: activeQuestions || 0
        }
      })(),

      // Center Statistics
      (async () => {
        const { count: totalCenters } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })

        const { count: activeCenters } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        return {
          totalCenters: totalCenters || 0,
          activeCenters: activeCenters || 0
        }
      })(),

      // Recent Activity
      (async () => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Recent user registrations
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('id, full_name, user_type, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        // Recent exam completions
        const { data: recentExams } = await supabase
          .from('user_exams')
          .select(`
            id,
            status,
            completed_at,
            user:profiles(full_name),
            exam:exams(title)
          `)
          .gte('completed_at', sevenDaysAgo.toISOString())
          .order('completed_at', { ascending: false })
          .limit(5)

        return {
          recentUsers: recentUsers || [],
          recentExams: recentExams || []
        }
      })(),

      // System Health
      (async () => {
        // Check database connection
        const { data: dbTest } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)

        const dbStatus = dbTest ? 'Healthy' : 'Unhealthy'

        // Get storage usage (placeholder - you can implement actual storage calculation)
        const storageUsage = '0%'

        // Get active sessions (placeholder - you can implement actual session tracking)
        const activeSessions = 0

        return {
          databaseStatus: dbStatus,
          storageUsage,
          activeSessions
        }
      })()
    ])

    // Calculate analytics
    const userGrowth = userStats.newThisMonth > 0 ? 
      Math.round((userStats.newThisMonth / userStats.totalUsers) * 100) : 0

    const examCompletionRate = examStats.totalUserExams > 0 ? 
      Math.round((examStats.completedExams / examStats.totalUserExams) * 100) : 0

    const systemUsage = userStats.activeUsers > 0 ? 
      Math.round((userStats.activeUsers / userStats.totalUsers) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          users: userStats,
          exams: examStats,
          questions: questionStats,
          centers: centerStats
        },
        analytics: {
          userGrowth,
          examCompletionRate,
          systemUsage
        },
        recentActivity,
        systemHealth
      }
    })

  } catch (error) {
    console.error('Error in admin dashboard API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 