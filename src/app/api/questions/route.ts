import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      exam_id,
      question_text,
      type,
      options,
      correct_answer,
      marks,
      order_number
    } = body

    // Validate required fields
    if (!exam_id || !question_text || !type || !marks || !order_number) {
      return NextResponse.json({ 
        error: 'Missing required fields: exam_id, question_text, type, marks, order_number' 
      }, { status: 400 })
    }

    // Validate correct_answer for MCQ and True/False questions
    if (type !== 'text' && !correct_answer) {
      return NextResponse.json({ 
        error: 'Correct answer is required for MCQ and True/False questions' 
      }, { status: 400 })
    }

    // Validate question type
    const validTypes = ['mcq', 'truefalse', 'text']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid question type' }, { status: 400 })
    }

    // Validate marks
    if (marks <= 0) {
      return NextResponse.json({ error: 'Marks must be greater than 0' }, { status: 400 })
    }

    // Validate order number
    if (order_number <= 0) {
      return NextResponse.json({ error: 'Order number must be greater than 0' }, { status: 400 })
    }

    // Check if exam exists and user has access to it
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, created_by')
      .eq('id', exam_id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Only exam creator or super admin can add questions
    if (exam.created_by !== user.id && profile.user_type !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions to modify this exam' }, { status: 403 })
    }

    // Prepare question data
    const questionData: any = {
      exam_id,
      question_text,
      type,
      correct_answer,
      marks,
      order_number
    }

    // Add options for MCQ questions
    if (type === 'mcq' && options && Array.isArray(options)) {
      questionData.options = options
    }

    // Create question
    const { data: question, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({ question }, { status: 201 })

  } catch (error) {
    console.error('Create question API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('exam_id')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('questions')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          exam_type,
          status
        )
      `)
      .order('created_at', { ascending: false })

    // If exam_id is provided, filter by it
    if (examId) {
      query = query.eq('exam_id', examId)
      query = query.order('order_number', { ascending: true })
    } else {
      // For admin view, check if user has admin privileges
      if (!['admin', 'super_admin'].includes(profile.user_type)) {
        return NextResponse.json({ error: 'Insufficient permissions to view all questions' }, { status: 403 })
      }
    }

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: questions, error, count } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({
      questions,
      pagination: {
        limit,
        offset,
        total: count || questions.length
      }
    })

  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 