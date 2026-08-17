import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-client'

const REOPENABLE_STATUSES = new Set(['completed', 'evaluated', 'published'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userExamId } = await params
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
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let body: { clearAnswers?: boolean; restartTimer?: boolean; exam_id?: string } = {}
    try {
      body = await request.json()
    } catch {
      /* optional body */
    }

    const clearAnswers = body.clearAnswers === true
    const restartTimer = body.restartTimer !== false
    const expectedExamId = body.exam_id

    const { data: row, error: fetchErr } = await supabase
      .from('user_exams')
      .select('id, user_id, exam_id, status, started_at')
      .eq('id', userExamId)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 })
    }

    if (expectedExamId && expectedExamId !== row.exam_id) {
      return NextResponse.json({ error: 'Exam mismatch for this attempt' }, { status: 400 })
    }

    if (!REOPENABLE_STATUSES.has(String(row.status))) {
      return NextResponse.json(
        {
          error:
            'Only submitted or published attempts can be reopened (completed, evaluated, or published).',
        },
        { status: 400 }
      )
    }

    if (clearAnswers) {
      const { error: delErr } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_exam_id', userExamId)

      if (delErr) {
        console.error('Error clearing answers on reopen:', delErr)
        return NextResponse.json(
          { error: 'Failed to clear answers', details: delErr.message },
          { status: 500 }
        )
      }
    }

    let totalScore = 0
    if (!clearAnswers) {
      const { data: answers, error: ansErr } = await supabase
        .from('user_answers')
        .select('score_awarded')
        .eq('user_exam_id', userExamId)

      if (ansErr) {
        console.error('Error summing scores on reopen:', ansErr)
        return NextResponse.json({ error: 'Failed to read answers' }, { status: 500 })
      }

      totalScore = (answers || []).reduce((s, a) => s + (Number(a.score_awarded) || 0), 0)
    }

    const startedAt =
      restartTimer || !row.started_at
        ? new Date().toISOString()
        : row.started_at

    // Use `pending` — many deployments only have enum pending|completed|evaluated|published (no in_progress).
    const { data: updated, error: updErr } = await supabase
      .from('user_exams')
      .update({
        status: 'pending',
        submitted_at: null,
        started_at: startedAt,
        total_score: totalScore,
        evaluator_id: null,
        remarks: null,
      })
      .eq('id', userExamId)
      .select()
      .single()

    if (updErr) {
      console.error('Error reopening user exam:', updErr)
      return NextResponse.json(
        { error: 'Failed to reopen exam attempt', details: updErr.message, code: updErr.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      userExam: updated,
      message: 'Exam reopened for this student. They can continue from My Exams.',
    })
  } catch (error) {
    console.error('Error in POST reopen user exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
