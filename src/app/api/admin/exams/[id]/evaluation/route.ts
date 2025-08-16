import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
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

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get all user submissions for this exam
    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select(`
        *,
        user:profiles!user_exams_user_id_fkey(
          id,
          full_name,
          mobile,
          user_type
        ),
        user_answers:user_answers(
          id,
          answer_text,
          is_correct,
          score_awarded,
          question:questions(
            id,
            question_text,
            type,
            correct_answer,
            marks,
            order_number
          )
        )
      `)
      .eq('exam_id', examId)
      .in('status', ['completed', 'evaluated'])
      .order('submitted_at', { ascending: false })

    if (userExamsError) {
      console.error('Error fetching user exams:', userExamsError)
      console.error('Error details:', {
        examId,
        error: userExamsError.message,
        code: userExamsError.code,
        details: userExamsError.details
      })
      return NextResponse.json({ 
        error: 'Failed to fetch user submissions',
        details: userExamsError.message 
      }, { status: 500 })
    }

    // Process the data to include evaluation statistics
    const processedUserExams = userExams?.map((userExam: any) => {
      const answers = userExam.user_answers || []
      const totalQuestions = answers.length
      const evaluatedQuestions = answers.filter((a: any) => a.is_correct !== null).length
      const autoEvaluatedQuestions = answers.filter((a: any) => 
        a.question && (a.question.type === 'mcq' || a.question.type === 'truefalse')
      ).length
      const manualEvaluationNeeded = answers.filter((a: any) => 
        a.question && a.question.type === 'text' && a.is_correct === null
      ).length

      return {
        ...userExam,
        evaluation_stats: {
          total_questions: totalQuestions,
          evaluated_questions: evaluatedQuestions,
          auto_evaluated: autoEvaluatedQuestions,
          manual_evaluation_needed: manualEvaluationNeeded,
          fully_evaluated: manualEvaluationNeeded === 0
        }
      }
    }) || []

    return NextResponse.json({
      exam,
      userExams: processedUserExams,
      summary: {
        total_submissions: processedUserExams.length,
        completed: processedUserExams.filter((ue: any) => ue.status === 'completed').length,
        evaluated: processedUserExams.filter((ue: any) => ue.status === 'evaluated').length,
        fully_evaluated: processedUserExams.filter((ue: any) => ue.evaluation_stats.fully_evaluated).length
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/exams/[id]/evaluation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
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
    const { user_answer_id, is_correct, score_awarded, remarks } = body

    if (!user_answer_id || is_correct === undefined || score_awarded === undefined) {
      return NextResponse.json({ error: 'Missing required fields: user_answer_id, is_correct, score_awarded' }, { status: 400 })
    }

    // Update the user answer
    const { data: updatedAnswer, error: updateError } = await supabase
      .from('user_answers')
      .update({
        is_correct,
        score_awarded,
        evaluated_by: user.id,
        remarks: remarks || null
      })
      .eq('id', user_answer_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user answer:', updateError)
      return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      answer: updatedAnswer,
      message: 'Answer evaluated successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/exams/[id]/evaluation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
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
    const { action, user_exam_ids } = body

    if (action === 'publish_results') {
      // Publish results for the exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .update({
          results_published: true,
          published_at: new Date().toISOString(),
          published_by: user.id
        })
        .eq('id', examId)
        .select()
        .single()

      if (examError) {
        console.error('Error publishing exam results:', examError)
        return NextResponse.json({ error: 'Failed to publish results' }, { status: 500 })
      }

      // Update all user exams to published status
      const { error: userExamsError } = await supabase
        .from('user_exams')
        .update({ status: 'published' })
        .eq('exam_id', examId)
        .in('status', ['completed', 'evaluated'])

      if (userExamsError) {
        console.error('Error updating user exams:', userExamsError)
        return NextResponse.json({ error: 'Failed to update user exams' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        exam,
        message: 'Results published successfully'
      })

    } else if (action === 'evaluate_users') {
      // Evaluate specific user exams
      if (!user_exam_ids || !Array.isArray(user_exam_ids)) {
        return NextResponse.json({ error: 'user_exam_ids array is required' }, { status: 400 })
      }

      const { error: updateError } = await supabase
        .from('user_exams')
        .update({ 
          status: 'evaluated',
          evaluator_id: user.id
        })
        .in('id', user_exam_ids)

      if (updateError) {
        console.error('Error evaluating user exams:', updateError)
        return NextResponse.json({ error: 'Failed to evaluate user exams' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${user_exam_ids.length} user(s) evaluated successfully`
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in PUT /api/admin/exams/[id]/evaluation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 