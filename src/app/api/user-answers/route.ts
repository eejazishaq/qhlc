import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userExamId = searchParams.get('user_exam_id')

    if (!userExamId) {
      return NextResponse.json({ error: 'User exam ID is required' }, { status: 400 })
    }

    // Get user answers for the specific user exam
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

    return NextResponse.json({ user_answers: userAnswers || [] })
  } catch (error) {
    console.error('Error in GET /api/user-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Check if answer already exists
    const { data: existingAnswer, error: existingError } = await supabase
      .from('user_answers')
      .select('id')
      .eq('user_exam_id', user_exam_id)
      .eq('question_id', question_id)
      .single()

    let result
    if (existingAnswer) {
      // Update existing answer
      const { data: updatedAnswer, error: updateError } = await supabase
        .from('user_answers')
        .update({ answer_text: answer })
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
          answer_text: answer
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