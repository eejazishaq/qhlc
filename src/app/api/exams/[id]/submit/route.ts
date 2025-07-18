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
      return NextResponse.json({ error: 'Exam has already been submitted' }, { status: 400 })
    }

    // Get exam details with questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        *,
        questions:questions(id, question_text, options, correct_answer, type, marks, order_number)
      `)
      .eq('id', params.id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check if exam is still within time limit
    const now = new Date()
    const startTime = new Date(userExam.started_at)
    const timeElapsed = (now.getTime() - startTime.getTime()) / 1000 / 60 // minutes
    const timeLimit = exam.duration

    if (timeElapsed > timeLimit) {
      return NextResponse.json({ error: 'Exam time limit exceeded' }, { status: 400 })
    }

    // Process answers and calculate scores
    const userAnswers = []
    let totalScore = 0
    let autoEvaluatedCount = 0

    for (const answer of answers) {
      const { question_id, answer_text } = answer

      // Find the question
      const question = exam.questions?.find((q: any) => q.id === question_id)
      if (!question) {
        continue
      }

      let isCorrect: boolean | null = false
      let scoreAwarded = 0

      // Auto-evaluate based on question type
      if (question.type === 'mcq' || question.type === 'truefalse') {
        isCorrect = answer_text === question.correct_answer
        scoreAwarded = isCorrect ? question.marks : 0
        autoEvaluatedCount++
      } else {
        // Text questions need manual evaluation
        isCorrect = null
        scoreAwarded = 0
      }

      userAnswers.push({
        user_exam_id: userExam.id,
        question_id,
        answer_text,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        evaluated_by: isCorrect !== null ? user.id : null // Auto-evaluated by system
      })

      totalScore += scoreAwarded
    }

    // Insert user answers
    if (userAnswers.length > 0) {
      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(userAnswers)

      if (answersError) {
        console.error('Error inserting user answers:', answersError)
        return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
      }
    }

    // Update user exam status
    const examStatus = autoEvaluatedCount === exam.questions?.length ? 'completed' : 'pending'
    const { error: updateError } = await supabase
      .from('user_exams')
      .update({
        submitted_at: now.toISOString(),
        status: examStatus,
        total_score: totalScore
      })
      .eq('id', userExam.id)

    if (updateError) {
      console.error('Error updating user exam:', updateError)
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
    }

    // Generate certificate if exam is completed and passed
    if (examStatus === 'completed' && totalScore >= exam.passing_marks) {
      // TODO: Implement certificate generation
      // This would create a certificate record and generate a PDF
    }

    return NextResponse.json({
      message: 'Exam submitted successfully',
      totalScore,
      passingMarks: exam.passing_marks,
      passed: totalScore >= exam.passing_marks,
      status: examStatus,
      autoEvaluated: autoEvaluatedCount,
      totalQuestions: exam.questions?.length || 0
    })

  } catch (error) {
    console.error('Submit exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 