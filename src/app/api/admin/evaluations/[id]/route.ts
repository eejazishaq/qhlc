import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get user profile to check admin role
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

    const body = await request.json()
    const { evaluations } = body

    if (!evaluations || !Array.isArray(evaluations)) {
      return NextResponse.json({ error: 'Evaluations array is required' }, { status: 400 })
    }

    // Update each answer with the evaluation
    for (const evaluation of evaluations) {
      const { id: answerId, is_correct, score_awarded } = evaluation

      if (answerId && (is_correct !== null || score_awarded !== null)) {
        const updateData: any = {
          evaluated_by: user.id
        }

        if (is_correct !== null) {
          updateData.is_correct = is_correct
        }

        if (score_awarded !== null) {
          updateData.score_awarded = score_awarded
        }

        const { error: updateError } = await supabase
          .from('user_answers')
          .update(updateData)
          .eq('id', answerId)

        if (updateError) {
          console.error('Error updating answer:', updateError)
          return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 })
        }
      }
    }

    // Recalculate total score for the user exam
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('score_awarded')
      .eq('user_exam_id', id)

    if (answersError) {
      console.error('Error fetching user answers for score calculation:', answersError)
      return NextResponse.json({ error: 'Failed to calculate total score' }, { status: 500 })
    }

    const totalScore = (userAnswers || []).reduce((sum, answer) => sum + (answer.score_awarded || 0), 0)

    // Update user exam status and total score
    const { error: examUpdateError } = await supabase
      .from('user_exams')
      .update({
        status: 'evaluated',
        total_score: totalScore,
        evaluator_id: user.id
      })
      .eq('id', id)

    if (examUpdateError) {
      console.error('Error updating user exam:', examUpdateError)
      return NextResponse.json({ error: 'Failed to update exam status' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Evaluation submitted successfully',
      totalScore,
      evaluatedAnswers: evaluations.length
    })

  } catch (error) {
    console.error('Error in POST /api/admin/evaluations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 