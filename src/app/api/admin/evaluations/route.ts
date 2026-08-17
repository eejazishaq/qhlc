import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-client'

function unwrapQuestion(question: unknown) {
  if (!question) return null
  return Array.isArray(question) ? question[0] : question
}

function normalizeAnswerText(s: string | null | undefined) {
  return (s ?? '').trim()
}

/** Compare student answer to key; true/false is case-insensitive. */
function autoScoreMatches(
  answerText: string | null | undefined,
  correctAnswer: string | null | undefined,
  questionType: string
): boolean {
  const a = normalizeAnswerText(answerText)
  const b = normalizeAnswerText(correctAnswer)
  if (questionType === 'truefalse') {
    return a.toLowerCase() === b.toLowerCase()
  }
  return a === b
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = createSupabaseRouteHandlerClient(token)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select(`
        id,
        user_exam_id: id,
        status,
        submitted_at,
        total_score,
        user:profiles!user_exams_user_id_fkey(
          id,
          full_name
        ),
        exam:exams(
          id,
          title,
          total_marks,
          passing_marks
        )
      `)
      .in('status', ['completed', 'evaluated', 'published'])
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })

    if (userExamsError) {
      console.error('Error fetching user exams:', userExamsError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    const submissionsWithAnswers = await Promise.all(
      (userExams || []).map(async (userExam) => {
        const { data: answers, error: answersError } = await supabase
          .from('user_answers')
          .select(`
            id,
            question_id,
            answer_text,
            is_correct,
            score_awarded,
            question:questions!user_answers_question_id_fkey(
              id,
              question_text,
              type,
              marks,
              correct_answer,
              options
            )
          `)
          .eq('user_exam_id', userExam.id)

        if (answersError) {
          console.error('Error fetching answers:', answersError)
          return { ...userExam, answers: [] }
        }

        const list = answers ?? []

        const processedAnswers = list.map((answer) => {
          const question = unwrapQuestion(answer.question) as {
            type?: string
            marks?: number
            question_text?: string
            correct_answer?: string
            options?: string[]
          } | null

          let isCorrect = answer.is_correct
          let scoreAwarded = Number(answer.score_awarded) || 0

          if (
            question &&
            (question.type === 'mcq' || question.type === 'truefalse')
          ) {
            const match = autoScoreMatches(
              answer.answer_text,
              question.correct_answer,
              question.type
            )
            isCorrect = match
            scoreAwarded = match ? Number(question.marks) || 0 : 0
          }

          return {
            id: answer.id,
            question_id: answer.question_id,
            question_text: question?.question_text || '',
            question_type: question?.type || '',
            answer_text: answer.answer_text,
            is_correct: isCorrect,
            score_awarded: scoreAwarded,
            max_score: question?.marks || 0,
            needs_evaluation:
              question?.type === 'text' && answer.is_correct === null,
            correct_answer: question?.correct_answer || '',
            options: question?.options || [],
          }
        })

        const newTotal = processedAnswers.reduce(
          (sum, a) => sum + (Number(a.score_awarded) || 0),
          0
        )

        const updatePromises: Promise<unknown>[] = []

        for (let i = 0; i < list.length; i++) {
          const raw = list[i]
          const proc = processedAnswers[i]
          const q = unwrapQuestion(raw.question) as { type?: string } | null
          if (!q || (q.type !== 'mcq' && q.type !== 'truefalse')) continue

          const prevCorrect = raw.is_correct
          const prevScore = Number(raw.score_awarded) || 0
          if (
            prevCorrect !== proc.is_correct ||
            prevScore !== proc.score_awarded
          ) {
            updatePromises.push(
              supabase
                .from('user_answers')
                .update({
                  is_correct: proc.is_correct,
                  score_awarded: proc.score_awarded,
                })
                .eq('id', raw.id)
            )
          }
        }

        const prevExamTotal = Number(userExam.total_score) || 0
        if (newTotal !== prevExamTotal) {
          updatePromises.push(
            supabase
              .from('user_exams')
              .update({ total_score: newTotal })
              .eq('id', userExam.id)
          )
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises)
        }

        return {
          ...userExam,
          total_score: newTotal,
          answers: processedAnswers,
        }
      })
    )

    return NextResponse.json({
      submissions: submissionsWithAnswers,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/evaluations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
