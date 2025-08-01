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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current date for filtering
    const now = new Date().toISOString()

    // Build query for available exams
    let query = supabase
      .from('exams')
      .select(`
        *,
        created_by:profiles!exams_created_by_fkey(full_name),
        questions:questions(count),
        user_exams:user_exams(
          id,
          status,
          total_score,
          submitted_at
        )
      `)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })

    // Filter by exam type if specified
    if (examType) {
      query = query.eq('exam_type', examType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: exams, error, count } = await query

    console.log('Available exams query result:', { exams, error, count })
    console.log('Current time:', now)
    console.log('Query filters:', { status: 'active', start_date: `<= ${now}`, end_date: `>= ${now}` })

    if (error) {
      console.error('Error fetching available exams:', error)
      return NextResponse.json({ error: 'Failed to fetch available exams' }, { status: 500 })
    }

    // Process exams to include user attempt information
    const processedExams = exams?.map((exam: any) => {
      const userAttempts = exam.user_exams || []
      const completedAttempts = userAttempts.filter((attempt: any) => attempt.status === 'completed' || attempt.status === 'evaluated')
      const activeAttempts = userAttempts.filter((attempt: any) => 
        ['pending', 'in_progress'].includes(attempt.status)
      )

      return {
        ...exam,
        question_count: exam.questions?.[0]?.count || 0,
        user_attempts: userAttempts,
        completed_attempts: completedAttempts,
        active_attempts: activeAttempts,
        can_take: activeAttempts.length === 0,
        best_score: completedAttempts.length > 0 
          ? Math.max(...completedAttempts.map((a: any) => a.total_score || 0))
          : null
      }
    }) || []

    return NextResponse.json({
      exams: processedExams,
      pagination: {
        limit,
        offset,
        total: count || processedExams.length
      }
    })

  } catch (error) {
    console.error('Available exams API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 