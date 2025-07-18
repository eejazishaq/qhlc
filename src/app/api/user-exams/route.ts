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
    const status = searchParams.get('status')
    const examId = searchParams.get('exam_id')

    // Build query for user exams
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
          end_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by exam if specified
    if (examId) {
      query = query.eq('exam_id', examId)
    }

    const { data: userExams, error } = await query

    if (error) {
      console.error('Error fetching user exams:', error)
      return NextResponse.json({ error: 'Failed to fetch user exams' }, { status: 500 })
    }

    return NextResponse.json({ userExams })
  } catch (error) {
    console.error('Error in GET /api/user-exams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting exam POST request ===')
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

    const body = await request.json()
    const { exam_id } = body

    console.log('Request body:', body)

    if (!exam_id) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    // Check if exam exists and is active
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .eq('status', 'active')
      .single()

    console.log('Exam check result:', { exam, error: examError })

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found or not active' }, { status: 404 })
    }

    // Check if exam is within date range
    const now = new Date()
    const startDate = new Date(exam.start_date)
    const endDate = new Date(exam.end_date)

    console.log('Date check:', {
      now: now.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nowBeforeStart: now < startDate,
      nowAfterEnd: now > endDate
    })

    if (now < startDate || now > endDate) {
      return NextResponse.json({ error: 'Exam is not available at this time' }, { status: 400 })
    }

    // Check if user already has an active attempt
    const { data: existingAttempt, error: existingError } = await supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', exam_id)
      .in('status', ['pending'])
      .single()

    console.log('Existing attempt check:', { existingAttempt, error: existingError })

    if (existingAttempt) {
      // Return existing attempt
      return NextResponse.json({ 
        userExam: existingAttempt,
        message: 'Resuming existing exam attempt'
      })
    }

    // Create new user exam
    const userExamData = {
      user_id: user.id,
      exam_id: exam_id,
      status: 'pending' as const, // Use correct enum value
      started_at: new Date().toISOString(),
      total_score: 0
    }

    console.log('Creating user exam with data:', userExamData)

    // Create new user exam
    const { data: userExam, error: createError } = await supabase
      .from('user_exams')
      .insert(userExamData)
      .select()
      .single()

    console.log('Create result:', { userExam, error: createError })

    if (createError) {
      console.error('Error creating user exam:', createError)
      return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 })
    }

    return NextResponse.json({ 
      userExam,
      message: 'Exam started successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/user-exams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 