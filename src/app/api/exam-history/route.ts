import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('API called - starting...')
    const supabase = createClient()
    
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header')
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('Token received:', token.substring(0, 10) + '...')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const examType = searchParams.get('exam_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Step 1: Get all published exams
    console.log('Fetching published exams...')
    const { data: publishedExams, error: publishedError } = await supabase
      .from('exams')
      .select('id')
      .eq('results_published', true)

    if (publishedError) {
      console.error('Error fetching published exams:', publishedError)
      return NextResponse.json({ error: 'Failed to fetch published exams' }, { status: 500 })
    }

    console.log('Published exams found:', publishedExams?.length || 0)

    if (!publishedExams || publishedExams.length === 0) {
      // No published exams, return empty results
      console.log('No published exams found, returning empty results')
      return NextResponse.json({
        userExams: [],
        statistics: {
          totalExams: 0,
          passedExams: 0,
          failedExams: 0,
          averageScore: 0,
          passRate: 0
        },
        performanceTrend: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
    }

    const publishedExamIds = publishedExams.map(exam => exam.id)
    console.log('Published exam IDs:', publishedExamIds)

    // Step 2: Get user exams for published exams
    console.log('Fetching user exams for published exams...')
    let query = supabase
      .from('user_exams')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          duration,
          total_marks,
          passing_marks,
          exam_type,
          status,
          start_date,
          end_date,
          results_published
        )
      `)
      .eq('user_id', user.id)
      .in('exam_id', publishedExamIds)
      .in('status', ['completed', 'evaluated', 'published'])
      .order('submitted_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (examType) {
      query = query.eq('exam.exam_type', examType)
    }

    if (startDate) {
      query = query.gte('submitted_at', startDate)
    }

    if (endDate) {
      query = query.lte('submitted_at', endDate)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: userExams, error } = await query

    if (error) {
      console.error('Error fetching user exams:', error)
      return NextResponse.json({ error: 'Failed to fetch user exams' }, { status: 500 })
    }

    console.log('User exams found:', userExams?.length || 0)

    // Calculate statistics
    const totalExams = userExams?.length || 0
    const passedExams = userExams?.filter(ue => 
      ue.total_score >= (ue.exam?.passing_marks || 0)
    ).length || 0
    const failedExams = totalExams - passedExams
    const averageScore = totalExams > 0 
      ? Math.round(userExams.reduce((sum, ue) => sum + ue.total_score, 0) / totalExams)
      : 0

    // Get total count for pagination (without limit/offset)
    let countQuery = supabase
      .from('user_exams')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('exam_id', publishedExamIds)
      .in('status', ['completed', 'evaluated', 'published'])

    if (status) countQuery = countQuery.eq('status', status)
    if (examType) countQuery = countQuery.eq('exam.exam_type', examType)
    if (startDate) countQuery = countQuery.gte('submitted_at', startDate)
    if (endDate) countQuery = countQuery.lte('submitted_at', endDate)

    const { count: totalCount } = await countQuery

    // Calculate performance trends (last 6 months) - simplified approach
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: trendData } = await supabase
      .from('user_exams')
      .select(`
        submitted_at,
        total_score,
        exam:exams(total_marks)
      `)
      .eq('user_id', user.id)
      .in('exam_id', publishedExamIds)
      .in('status', ['completed', 'evaluated', 'published'])
      .gte('submitted_at', sixMonthsAgo.toISOString())
      .order('submitted_at', { ascending: true })

    // Group by month for trend analysis
    const monthlyTrends = trendData?.reduce((acc, ue) => {
      if (ue.submitted_at) {
        const month = new Date(ue.submitted_at).toISOString().slice(0, 7) // YYYY-MM format
        if (!acc[month]) {
          acc[month] = { count: 0, totalScore: 0, totalMarks: 0 }
        }
        acc[month].count++
        acc[month].totalScore += ue.total_score
        acc[month].totalMarks += (ue.exam as any)?.total_marks || 0
      }
      return acc
    }, {} as Record<string, { count: number, totalScore: number, totalMarks: number }>)

    // Convert to array format for charting
    const performanceTrend = Object.entries(monthlyTrends || {}).map(([month, data]) => ({
      month,
      averageScore: data.totalMarks > 0 ? Math.round((data.totalScore / data.totalMarks) * 100) : 0,
      examCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month))

    console.log('Returning data:', {
      totalExams,
      passedExams,
      failedExams,
      averageScore,
      performanceTrendLength: performanceTrend.length
    })

    return NextResponse.json({
      userExams: userExams || [],
      statistics: {
        totalExams,
        passedExams,
        failedExams,
        averageScore,
        passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0
      },
      performanceTrend,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/exam-history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 