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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get user exam result
    const { data: userExam, error: userExamError } = await supabase
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
          created_by:profiles!exams_created_by_fkey(full_name)
        )
      `)
      .eq('user_id', user.id)
      .eq('exam_id', params.id)
      .single()

    if (userExamError || !userExam) {
      return NextResponse.json({ error: 'Exam result not found' }, { status: 404 })
    }

    // Check if exam is completed
    if (userExam.status === 'pending') {
      return NextResponse.json({ error: 'Exam has not been completed yet' }, { status: 400 })
    }

    // Get detailed answers with questions
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        *,
        question:questions(
          id,
          question_text,
          options,
          correct_answer,
          type,
          marks,
          order_number
        )
      `)
      .eq('user_exam_id', userExam.id)
      .order('question.order_number', { ascending: true })

    if (answersError) {
      console.error('Error fetching user answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch exam results' }, { status: 500 })
    }

    // Calculate statistics
    const totalQuestions = userAnswers?.length || 0
    const correctAnswers = userAnswers?.filter((a: any) => a.is_correct === true).length || 0
    const incorrectAnswers = userAnswers?.filter((a: any) => a.is_correct === false).length || 0
    const pendingEvaluation = userAnswers?.filter((a: any) => a.is_correct === null).length || 0
    const totalScore = userAnswers?.reduce((sum: number, a: any) => sum + (a.score_awarded || 0), 0) || 0
    const percentage = userExam.exam.total_marks > 0 ? (totalScore / userExam.exam.total_marks) * 100 : 0
    const passed = totalScore >= userExam.exam.passing_marks

    // Prepare answer details
    const answerDetails = userAnswers?.map((answer: any) => ({
      questionId: answer.question_id,
      questionText: answer.question.question_text,
      questionType: answer.question.type,
      userAnswer: answer.answer_text,
      correctAnswer: answer.question.correct_answer,
      isCorrect: answer.is_correct,
      scoreAwarded: answer.score_awarded,
      maxScore: answer.question.marks,
      options: answer.question.options
    })) || []

    // Role-based access control for answer details
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      // Hide correct answers for non-admin users
      answerDetails.forEach((answer: any) => {
        answer.correctAnswer = undefined
      })
    }

    // Calculate time taken
    const startTime = new Date(userExam.started_at)
    const submitTime = new Date(userExam.submitted_at)
    const timeTaken = (submitTime.getTime() - startTime.getTime()) / 1000 / 60 // minutes

    const result = {
      userExam: {
        id: userExam.id,
        status: userExam.status,
        startedAt: userExam.started_at,
        submittedAt: userExam.submitted_at,
        timeTaken,
        totalScore,
        evaluatorId: userExam.evaluator_id,
        remarks: userExam.remarks
      },
      exam: {
        id: userExam.exam.id,
        title: userExam.exam.title,
        description: userExam.exam.description,
        duration: userExam.exam.duration,
        totalMarks: userExam.exam.total_marks,
        passingMarks: userExam.exam.passing_marks,
        examType: userExam.exam.exam_type,
        createdBy: userExam.exam.created_by?.full_name
      },
      statistics: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        pendingEvaluation,
        totalScore,
        percentage: Math.round(percentage * 100) / 100,
        passed,
        timeTaken: Math.round(timeTaken * 100) / 100
      },
      answers: answerDetails
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get exam result API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 