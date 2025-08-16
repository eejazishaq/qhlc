import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        *,
        questions:questions(id, question_text, options, type, marks, order_number)
      `)
      .eq('id', params.id)
      .eq('status', 'active')
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found or not available' }, { status: 404 })
    }

    // Check if exam is within the allowed time window
    const now = new Date()
    const startDate = new Date(exam.start_date)
    const endDate = new Date(exam.end_date)

    if (now < startDate) {
      return NextResponse.json({ error: 'Exam has not started yet' }, { status: 400 })
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Exam has ended' }, { status: 400 })
    }

    // Check if user has already started this exam
    const { data: existingUserExam, error: existingError } = await supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', params.id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing user exam:', existingError)
      return NextResponse.json({ error: 'Failed to check exam status' }, { status: 500 })
    }

    if (existingUserExam) {
      if (existingUserExam.status === 'completed' || existingUserExam.status === 'evaluated') {
        return NextResponse.json({ error: 'You have already completed this exam' }, { status: 400 })
      }
      
      if (existingUserExam.status === 'pending') {
        // Return existing session if it's still pending
        return NextResponse.json({ 
          userExam: existingUserExam,
          exam: {
            ...exam,
            questions: exam.questions?.map((q: any) => ({
              ...q,
              correct_answer: undefined // Hide correct answers
            }))
          }
        })
      }
    }

    // Create new user exam session
    const { data: userExam, error: createError } = await supabase
      .from('user_exams')
      .insert({
        user_id: user.id,
        exam_id: params.id,
        started_at: now.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user exam:', createError)
      return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 })
    }

    // Return exam data without correct answers
    let questions = exam.questions?.map((q: any) => ({
      ...q,
      correct_answer: undefined // Hide correct answers
    })) || []

    const examData = {
      ...exam,
      questions: questions
    }

    return NextResponse.json({ 
      userExam,
      exam: examData
    })

  } catch (error) {
    console.error('Start exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 