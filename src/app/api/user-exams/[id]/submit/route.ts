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

    // Get the user exam
    const { data: userExam, error: userExamError } = await supabase
      .from('user_exams')
      .select(`
        *,
        exam:exams(
          id,
          title,
          duration,
          total_marks,
          passing_marks
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (userExamError || !userExam) {
      return NextResponse.json({ error: 'User exam not found' }, { status: 404 })
    }

    if (userExam.status === 'completed') {
      return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })
    }

    // Get user answers
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        *,
        question:questions(
          id,
          correct_answer,
          marks,
          type
        )
      `)
      .eq('user_exam_id', id)

    if (answersError) {
      console.error('Error fetching user answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    // Calculate total score
    let totalScore = 0
    const evaluatedAnswers = []

    for (const userAnswer of userAnswers || []) {
      const question = userAnswer.question
      let isCorrect = false
      let scoreAwarded = 0

      if (question.type === 'mcq' || question.type === 'truefalse') {
        // Auto-evaluate MCQ and true/false questions
        isCorrect = userAnswer.answer_text === question.correct_answer
        scoreAwarded = isCorrect ? question.marks : 0
        totalScore += scoreAwarded

        // Update the user answer with evaluation
        await supabase
          .from('user_answers')
          .update({
            is_correct: isCorrect,
            score_awarded: scoreAwarded
          })
          .eq('id', userAnswer.id)
      } else {
        // Text questions need manual evaluation
        // For now, we'll mark them as needing evaluation
        await supabase
          .from('user_answers')
          .update({
            is_correct: null,
            score_awarded: null
          })
          .eq('id', userAnswer.id)
      }

      evaluatedAnswers.push({
        ...userAnswer,
        is_correct: isCorrect,
        score_awarded: scoreAwarded
      })
    }

    // Update user exam status to completed (not evaluated - requires admin review)
    const { data: updatedUserExam, error: updateError } = await supabase
      .from('user_exams')
      .update({
        status: 'completed', // Keep as completed, not evaluated
        submitted_at: new Date().toISOString(),
        total_score: totalScore // Store auto-calculated score for reference
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user exam:', updateError)
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
    }

    return NextResponse.json({
      userExam: updatedUserExam,
      totalScore,
      evaluatedAnswers,
      message: 'Exam submitted successfully. Results will be available after evaluation.'
    })
  } catch (error) {
    console.error('Error in POST /api/user-exams/[id]/submit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 