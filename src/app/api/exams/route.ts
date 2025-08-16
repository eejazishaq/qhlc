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
    const examType = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query based on user role
    let query = supabase
      .from('exams')
      .select(`
        *,
        created_by:profiles!exams_created_by_fkey(full_name),
        questions:questions(id, question_text, type, marks, order_number),
        user_exams:user_exams(id, status, total_score, submitted_at)
      `)
      .order('created_at', { ascending: false })

    // Filter by exam type if specified
    if (examType) {
      query = query.eq('exam_type', examType)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Role-based filtering
    if (['admin', 'super_admin'].includes(profile.user_type)) {
      // Admins can see all exams
    } else if (profile.user_type === 'coordinator') {
      // Coordinators can see exams for their center
      query = query.eq('exam_centers.area_id', profile.area_id)
    } else {
      // Regular users can only see active exams assigned to them
      query = query
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString())
        .lte('end_date', new Date().toISOString())
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: exams, error, count } = await query

    if (error) {
      console.error('Error fetching exams:', error)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    return NextResponse.json({
      exams,
      pagination: {
        limit,
        offset,
        total: count || exams.length
      }
    })

  } catch (error) {
    console.error('Exams API error:', error)
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
      title,
      description,
      duration,
      total_marks,
      passing_marks,
      exam_type,
      status = 'draft',
      start_date,
      end_date,
      shuffle_questions = false
    } = body

    // Validate required fields
    if (!title || !duration || !total_marks || !passing_marks || !exam_type || !start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, duration, total_marks, passing_marks, exam_type, start_date, end_date' 
      }, { status: 400 })
    }

    // Validate exam type
    const validExamTypes = ['mock', 'regular', 'final']
    if (!validExamTypes.includes(exam_type)) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'inactive']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Create exam
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title,
        description,
        duration,
        total_marks,
        passing_marks,
        exam_type,
        status,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        shuffle_questions,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating exam:', error)
      return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
    }

    return NextResponse.json({ exam }, { status: 201 })

  } catch (error) {
    console.error('Create exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 