import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Get exam with questions and user exam data
    const { data: exam, error } = await supabase
      .from('exams')
      .select(`
        *,
        created_by:profiles!exams_created_by_fkey(full_name),
        questions:questions(
          id, 
          question_text, 
          options, 
          correct_answer, 
          type, 
          marks, 
          order_number
        ),
        user_exams:user_exams(
          id, 
          status, 
          total_score, 
          submitted_at,
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }
      console.error('Error fetching exam:', error)
      return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
    }

    // Role-based access control
    if (['admin', 'super_admin'].includes(profile.user_type)) {
      // Admins can see all exam details including correct answers
    } else if (profile.user_type === 'coordinator') {
      // Coordinators can see exam details but not correct answers for questions
      if (exam.questions) {
        exam.questions = exam.questions.map((q: any) => ({
          ...q,
          correct_answer: undefined // Hide correct answers
        }))
      }
    } else {
      // Regular users can only see active exams and no correct answers
      if (exam.status !== 'active') {
        return NextResponse.json({ error: 'Exam not available' }, { status: 403 })
      }
      
      if (exam.questions) {
        exam.questions = exam.questions.map((q: any) => ({
          ...q,
          correct_answer: undefined // Hide correct answers
        }))
      }
    }

    return NextResponse.json({ exam })

  } catch (error) {
    console.error('Get exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      title,
      description,
      duration,
      total_marks,
      passing_marks,
      exam_type,
      status,
      start_date,
      end_date
    } = body

    // Build update object with only provided fields
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (duration !== undefined) updateData.duration = duration
    if (total_marks !== undefined) updateData.total_marks = total_marks
    if (passing_marks !== undefined) updateData.passing_marks = passing_marks
    if (exam_type !== undefined) updateData.exam_type = exam_type
    if (status !== undefined) updateData.status = status
    if (start_date !== undefined) updateData.start_date = new Date(start_date).toISOString()
    if (end_date !== undefined) updateData.end_date = new Date(end_date).toISOString()

    // Validate exam type if provided
    if (exam_type && !['mock', 'regular', 'final'].includes(exam_type)) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 })
    }

    // Validate status if provided
    if (status && !['draft', 'active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      if (startDate >= endDate) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    // Update exam
    const { data: exam, error } = await supabase
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }
      console.error('Error updating exam:', error)
      return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
    }

    return NextResponse.json({ exam })

  } catch (error) {
    console.error('Update exam API error:', error)
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

    // Check if exam exists and has no active user exams
    const { data: existingExam, error: fetchError } = await supabase
      .from('exams')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }
      console.error('Error fetching exam:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
    }

    // Check if exam has active user exams
    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select('id')
      .eq('exam_id', id)
      .in('status', ['pending', 'completed'])

    if (userExamsError) {
      console.error('Error checking user exams:', userExamsError)
      return NextResponse.json({ error: 'Failed to check exam usage' }, { status: 500 })
    }

    if (userExams && userExams.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete exam with active user attempts. Consider deactivating instead.' 
      }, { status: 400 })
    }

    // Delete exam (this will cascade delete questions due to foreign key constraints)
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting exam:', error)
      return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Exam deleted successfully' })

  } catch (error) {
    console.error('Delete exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 