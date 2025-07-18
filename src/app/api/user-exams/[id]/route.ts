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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get the specific user exam
    const { data: userExam, error } = await supabase
      .from('user_exams')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          duration,
          total_marks,
          passing_marks,
          exam_type,
          status,
          start_date,
          end_date
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user exam:', error)
      return NextResponse.json({ error: 'Failed to fetch user exam' }, { status: 500 })
    }

    if (!userExam) {
      return NextResponse.json({ error: 'User exam not found' }, { status: 404 })
    }

    return NextResponse.json({ userExam })
  } catch (error) {
    console.error('Error in GET /api/user-exams/[id]:', error)
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

    const body = await request.json()
    const { status, submitted_at, total_score } = body

    // Update the user exam
    const { data: userExam, error } = await supabase
      .from('user_exams')
      .update({
        status,
        submitted_at,
        total_score
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user exam:', error)
      return NextResponse.json({ error: 'Failed to update user exam' }, { status: 500 })
    }

    return NextResponse.json({ userExam })
  } catch (error) {
    console.error('Error in PUT /api/user-exams/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 