import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-client'

type Evaluation = {
  user_answer_id: string
  is_correct: boolean
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'No authentication token available' }, { status: 401 }) }
  }

  const supabase = createSupabaseRouteHandlerClient(authHeader.substring(7))
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'User profile not found' }, { status: 404 }) }
  }

  if (!['admin', 'super_admin'].includes(profile.user_type)) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
  }

  return { supabase, user }
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await requireAdmin(request)
    if ('error' in authorized) return authorized.error

    const { supabase } = authorized
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('exam_id')
    const questionId = searchParams.get('question_id')

    if (!examId || !questionId) {
      return NextResponse.json({ error: 'exam_id and question_id are required' }, { status: 400 })
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, exam_id, question_text, type, marks, order_number')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found for this exam' }, { status: 404 })
    }

    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        id,
        answer_text,
        is_correct,
        score_awarded,
        user_exam:user_exams!user_answers_user_exam_id_fkey(
          id,
          status,
          submitted_at,
          user:profiles!user_exams_user_id_fkey(id, full_name, mobile, serial_number)
        )
      `)
      .eq('question_id', questionId)

    if (answersError) {
      console.error('Error loading bulk evaluation answers:', answersError)
      return NextResponse.json({ error: 'Failed to load student answers' }, { status: 500 })
    }

    const submittedAnswers = (answers ?? [])
      .filter((answer: any) => ['completed', 'evaluated', 'published'].includes(answer.user_exam?.status))
      .map((answer: any) => ({
        id: answer.id,
        answer_text: answer.answer_text ?? '',
        is_correct: answer.is_correct,
        score_awarded: answer.score_awarded,
        user_exam_id: answer.user_exam.id,
        user: answer.user_exam.user,
      }))

    return NextResponse.json({ question, answers: submittedAnswers })
  } catch (error) {
    console.error('Error in GET /api/admin/evaluations/bulk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await requireAdmin(request)
    if ('error' in authorized) return authorized.error

    const { supabase, user } = authorized
    const { exam_id: examId, question_id: questionId, evaluations } = await request.json() as {
      exam_id?: string
      question_id?: string
      evaluations?: Evaluation[]
    }

    if (!examId || !questionId || !Array.isArray(evaluations) || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'exam_id, question_id, and at least one evaluation are required' },
        { status: 400 }
      )
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, exam_id, marks')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found for this exam' }, { status: 404 })
    }

    const answerIds = evaluations.map((evaluation) => evaluation.user_answer_id)
    if (new Set(answerIds).size !== answerIds.length || evaluations.some(
      (evaluation) => typeof evaluation.user_answer_id !== 'string' || typeof evaluation.is_correct !== 'boolean'
    )) {
      return NextResponse.json({ error: 'Invalid evaluation data' }, { status: 400 })
    }

    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('id, user_exam_id, question_id')
      .in('id', answerIds)
      .eq('question_id', questionId)

    if (answersError || answers?.length !== evaluations.length) {
      return NextResponse.json({ error: 'One or more answers are invalid' }, { status: 400 })
    }

    const updates = await Promise.all(
      evaluations.map((evaluation) => supabase
        .from('user_answers')
        .update({
          is_correct: evaluation.is_correct,
          score_awarded: evaluation.is_correct ? question.marks : 0,
          evaluated_by: user.id,
        })
        .eq('id', evaluation.user_answer_id)
        .select('user_exam_id')
        .single()
      )
    )

    const updateFailure = updates.find(({ error }) => error)
    if (updateFailure?.error) {
      console.error('Error saving bulk evaluation:', updateFailure.error)
      return NextResponse.json({ error: 'Failed to save evaluations' }, { status: 500 })
    }

    const userExamIds = [...new Set(answers.map((answer) => answer.user_exam_id))]
    const totals = await Promise.all(
      userExamIds.map(async (userExamId) => {
        const { data: userAnswers, error } = await supabase
          .from('user_answers')
          .select('score_awarded, is_correct')
          .eq('user_exam_id', userExamId)

        if (error) throw error
        const totalScore = (userAnswers ?? []).reduce(
          (total, answer) => total + (Number(answer.score_awarded) || 0),
          0
        )
        const fullyEvaluated = (userAnswers ?? []).every((answer) => answer.is_correct !== null)

        return supabase
          .from('user_exams')
          .update({
            total_score: totalScore,
            evaluator_id: user.id,
            ...(fullyEvaluated ? { status: 'evaluated' as const } : {}),
          })
          .eq('id', userExamId)
      })
    )

    const totalFailure = totals.find(({ error }) => error)
    if (totalFailure?.error) {
      console.error('Error recalculating exam totals:', totalFailure.error)
      return NextResponse.json({ error: 'Evaluations saved, but scores could not be recalculated' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: evaluations.length,
      message: `${evaluations.length} answer(s) evaluated successfully`,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/evaluations/bulk:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
