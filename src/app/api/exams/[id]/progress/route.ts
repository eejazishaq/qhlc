import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Get user exam session
    const { data: userExam, error: userExamError } = await supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', params.id)
      .single()

    if (userExamError || !userExam) {
      return NextResponse.json({ error: 'No active exam session found' }, { status: 404 })
    }

    if (userExam.status === 'completed' || userExam.status === 'evaluated') {
      return NextResponse.json({ error: 'Exam has already been completed' }, { status: 400 })
    }

    // Get saved answers
    const { data: savedAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id, answer_text')
      .eq('user_exam_id', userExam.id)

    if (answersError) {
      console.error('Error fetching saved answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Calculate time remaining
    const now = new Date()
    const startTime = new Date(userExam.started_at)
    const timeElapsed = (now.getTime() - startTime.getTime()) / 1000 / 60 // minutes

    // Get exam details for time limit
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('duration, total_marks')
      .eq('id', params.id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const timeRemaining = Math.max(0, exam.duration - timeElapsed)

    return NextResponse.json({
      userExam,
      savedAnswers: savedAnswers || [],
      timeElapsed,
      timeRemaining,
      timeLimit: exam.duration,
      totalMarks: exam.total_marks
    })

  } catch (error) {
    console.error('Get exam progress API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Parse request body
    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 })
    }

    // Get user exam session
    const { data: userExam, error: userExamError } = await supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', params.id)
      .single()

    if (userExamError || !userExam) {
      return NextResponse.json({ error: 'No active exam session found' }, { status: 404 })
    }

    if (userExam.status === 'completed' || userExam.status === 'evaluated') {
      return NextResponse.json({ error: 'Exam has already been completed' }, { status: 400 })
    }

    // Check if exam is still within time limit
    const now = new Date()
    const startTime = new Date(userExam.started_at)
    const timeElapsed = (now.getTime() - startTime.getTime()) / 1000 / 60 // minutes

    // Get exam details for time limit
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('duration')
      .eq('id', params.id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (timeElapsed > exam.duration) {
      return NextResponse.json({ error: 'Exam time limit exceeded' }, { status: 400 })
    }

    // Process answers for auto-save
    const userAnswers = []

    for (const answer of answers) {
      const { question_id, answer_text } = answer

      // Check if answer already exists
      const { data: existingAnswer } = await supabase
        .from('user_answers')
        .select('id')
        .eq('user_exam_id', userExam.id)
        .eq('question_id', question_id)
        .single()

      if (existingAnswer) {
        // Update existing answer
        const { error: updateError } = await supabase
          .from('user_answers')
          .update({ answer_text })
          .eq('id', existingAnswer.id)

        if (updateError) {
          console.error('Error updating answer:', updateError)
        }
      } else {
        // Prepare new answer for insertion
        userAnswers.push({
          user_exam_id: userExam.id,
          question_id,
          answer_text,
          is_correct: null, // Will be evaluated on submission
          score_awarded: 0
        })
      }
    }

    // Insert new answers
    if (userAnswers.length > 0) {
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(userAnswers)

      if (insertError) {
        console.error('Error inserting answers:', insertError)
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'Progress saved successfully',
      savedAnswers: answers.length
    })

  } catch (error) {
    console.error('Save exam progress API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 