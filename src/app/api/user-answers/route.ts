import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-client'

function unwrapQuestion(question: unknown) {
  if (!question) return null
  return Array.isArray(question) ? question[0] : question
}

function normalizeAnswerText(s: string | null | undefined) {
  return (s ?? '').trim()
}

export async function GET(request: NextRequest) {
  try {
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = createSupabaseRouteHandlerClient(token)

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userExamId = searchParams.get('user_exam_id')
    // While taking an exam: raw answers only — no re-grading / no total_score updates
    const skipGrading =
      searchParams.get('skip_grading') === '1' || searchParams.get('skip_grading') === 'true'

    if (!userExamId) {
      return NextResponse.json({ error: 'User exam ID is required' }, { status: 400 })
    }

    const { data: userExamRow, error: userExamError } = await supabase
      .from('user_exams')
      .select('id, user_id, total_score')
      .eq('id', userExamId)
      .eq('user_id', user.id)
      .single()

    if (userExamError || !userExamRow) {
      return NextResponse.json({ error: 'User exam not found or unauthorized' }, { status: 404 })
    }

    // In-exam load: raw rows only — no join to `questions` (avoids RLS/join issues) and no re-grade
    if (skipGrading) {
      const { data: userAnswers, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_exam_id', userExamId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching user answers:', error)
        return NextResponse.json({ error: 'Failed to fetch user answers' }, { status: 500 })
      }

      return NextResponse.json({ user_answers: userAnswers || [] })
    }

    // Get user answers for the specific user exam (joined to latest question data)
    const { data: userAnswers, error } = await supabase
      .from('user_answers')
      .select(`
        *,
        question:questions(
          id,
          question_text,
          type,
          options,
          correct_answer,
          marks
        )
      `)
      .eq('user_exam_id', userExamId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user answers:', error)
      return NextResponse.json({ error: 'Failed to fetch user answers' }, { status: 500 })
    }

    const rows = userAnswers || []

    // Re-grade auto-scored questions using current correct_answer / marks (fixes stale scores after admin edits)
    const updatePromises: Promise<unknown>[] = []
    const merged = rows.map((row) => {
      const q = unwrapQuestion(row.question) as {
        type?: string
        correct_answer?: string
        marks?: number
      } | null
      if (!q || (q.type !== 'mcq' && q.type !== 'truefalse')) {
        return { ...row, question: q ?? unwrapQuestion(row.question) }
      }

      const isCorrect =
        normalizeAnswerText(row.answer_text) === normalizeAnswerText(q.correct_answer)
      const scoreAwarded = isCorrect ? Number(q.marks) || 0 : 0

      if (row.is_correct !== isCorrect || Number(row.score_awarded) !== scoreAwarded) {
        updatePromises.push(
          supabase
            .from('user_answers')
            .update({ is_correct: isCorrect, score_awarded: scoreAwarded })
            .eq('id', row.id)
            .then(() => undefined)
        )
      }

      return {
        ...row,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        question: q
      }
    })

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    const newTotal = merged.reduce((sum, a) => sum + (Number(a.score_awarded) || 0), 0)
    const prevTotal = Number(userExamRow.total_score)
    if (!Number.isNaN(newTotal) && newTotal !== prevTotal) {
      await supabase
        .from('user_exams')
        .update({ total_score: newTotal })
        .eq('id', userExamId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ user_answers: merged })
  } catch (error) {
    console.error('Error in GET /api/user-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = createSupabaseRouteHandlerClient(token)

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const body = await request.json()
    const { user_exam_id, question_id, answer } = body

    if (!user_exam_id || !question_id) {
      return NextResponse.json({ error: 'User exam ID and question ID are required' }, { status: 400 })
    }

    // Verify the user exam belongs to the current user
    const { data: userExam, error: userExamError } = await supabase
      .from('user_exams')
      .select('id')
      .eq('id', user_exam_id)
      .eq('user_id', user.id)
      .single()

    if (userExamError || !userExam) {
      return NextResponse.json({ error: 'User exam not found or unauthorized' }, { status: 404 })
    }

    const trimmed = typeof answer === 'string' ? answer.trim() : ''

    // Check if answer already exists
    const { data: existingAnswer } = await supabase
      .from('user_answers')
      .select('id')
      .eq('user_exam_id', user_exam_id)
      .eq('question_id', question_id)
      .maybeSingle()

    // Empty answer = skip: remove row if any (do not persist "skipped")
    if (trimmed === '') {
      if (existingAnswer) {
        const { error: delErr } = await supabase.from('user_answers').delete().eq('id', existingAnswer.id)
        if (delErr) {
          console.error('Error deleting skipped answer:', delErr)
          return NextResponse.json({ error: 'Failed to clear answer' }, { status: 500 })
        }
      }
      return NextResponse.json({ user_answer: null, deleted: !!existingAnswer })
    }

    let result
    if (existingAnswer) {
      // Update existing answer
      const { data: updatedAnswer, error: updateError } = await supabase
        .from('user_answers')
        .update({ answer_text: trimmed })
        .eq('id', existingAnswer.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user answer:', updateError)
        return NextResponse.json({ error: 'Failed to update answer' }, { status: 500 })
      }

      result = updatedAnswer
    } else {
      // Create new answer
      const { data: newAnswer, error: insertError } = await supabase
        .from('user_answers')
        .insert({
          user_exam_id,
          question_id,
          answer_text: trimmed
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user answer:', insertError)
        return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
      }

      result = newAnswer
    }

    return NextResponse.json({ user_answer: result })
  } catch (error) {
    console.error('Error in POST /api/user-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 