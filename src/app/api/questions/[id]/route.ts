import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      question_text,
      options,
      correct_answer,
      type,
      marks,
      order_number
    } = body

    // Build update object with only provided fields
    const updateData: any = {}
    if (question_text !== undefined) updateData.question_text = question_text
    if (options !== undefined) updateData.options = options
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer
    if (type !== undefined) updateData.type = type
    if (marks !== undefined) updateData.marks = marks
    if (order_number !== undefined) updateData.order_number = order_number

    // Validate question type if provided
    if (type && !['mcq', 'truefalse', 'text'].includes(type)) {
      return NextResponse.json({ error: 'Invalid question type' }, { status: 400 })
    }

    // Validate options for MCQ questions if provided
    if (type === 'mcq' && options && (!Array.isArray(options) || options.length < 2)) {
      return NextResponse.json({ error: 'MCQ questions must have at least 2 options' }, { status: 400 })
    }

    // Validate correct answer is in options for MCQ if both are provided
    if (type === 'mcq' && options && correct_answer && !options.includes(correct_answer)) {
      return NextResponse.json({ error: 'Correct answer must be one of the provided options' }, { status: 400 })
    }

    // Validate true/false questions if correct_answer is provided
    if (type === 'truefalse' && correct_answer && !['true', 'false', 'True', 'False'].includes(correct_answer)) {
      return NextResponse.json({ error: 'True/false questions must have "true" or "false" as correct answer' }, { status: 400 })
    }

    // Check if question exists and get exam status
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select(`
        *,
        exam:exams(id, status)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      console.error('Error fetching question:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    // Allow admins to update questions in active exams (with a warning)
    if (existingQuestion.exam.status === 'active' && profile.user_type !== 'super_admin') {
      console.warn(`Admin ${user.id} is updating question ${id} in active exam ${existingQuestion.exam.id}`)
      // For now, allow updates but log them for monitoring
      // In production, you might want to add additional confirmation or restrict certain fields
    }

    // Update question
    const { data: question, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ question })

  } catch (error) {
    console.error('Update question API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if question exists and get exam status
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select(`
        *,
        exam:exams(id, status)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      console.error('Error fetching question:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    // Allow admins to delete questions from active exams (with a warning)
    if (existingQuestion.exam.status === 'active' && profile.user_type !== 'super_admin') {
      console.warn(`Admin ${user.id} is deleting question ${id} from active exam ${existingQuestion.exam.id}`)
      // For now, allow deletions but log them for monitoring
      // In production, you might want to add additional confirmation
    }

    // Check if question has been answered by any users
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('id')
      .eq('question_id', id)

    if (answersError) {
      console.error('Error checking user answers:', answersError)
      return NextResponse.json({ error: 'Failed to check question usage' }, { status: 500 })
    }

    if (userAnswers && userAnswers.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete question that has been answered by users. Consider deactivating the exam instead.' 
      }, { status: 400 })
    }

    // Delete question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Question deleted successfully' })

  } catch (error) {
    console.error('Delete question API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 