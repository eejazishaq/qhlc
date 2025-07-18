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

    // Get all user exams with user and exam details
    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select(`
        id,
        user_exam_id: id,
        status,
        submitted_at,
        total_score,
        user:profiles!user_exams_user_id_fkey(
          id,
          full_name,
          email
        ),
        exam:exams(
          id,
          title,
          total_marks,
          passing_marks
        )
      `)
      .in('status', ['completed', 'evaluated'])
      .order('submitted_at', { ascending: false })

    if (userExamsError) {
      console.error('Error fetching user exams:', userExamsError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    // Get answers for each user exam
    const submissionsWithAnswers = await Promise.all(
      (userExams || []).map(async (userExam) => {
        const { data: answers, error: answersError } = await supabase
          .from('user_answers')
          .select(`
            id,
            question_id,
            answer_text,
            is_correct,
            score_awarded,
            question:questions!user_answers_question_id_fkey(
              id,
              question_text,
              type,
              marks
            )
          `)
          .eq('user_exam_id', userExam.id)

        if (answersError) {
          console.error('Error fetching answers:', answersError)
          return userExam
        }

        const processedAnswers = (answers || []).map(answer => ({
          id: answer.id,
          question_id: answer.question_id,
          question_text: answer.question?.question_text || '',
          question_type: answer.question?.type || '',
          answer_text: answer.answer_text,
          is_correct: answer.is_correct,
          score_awarded: answer.score_awarded || 0,
          max_score: answer.question?.marks || 0,
          needs_evaluation: answer.question?.type === 'text' && answer.is_correct === null
        }))

        return {
          ...userExam,
          answers: processedAnswers
        }
      })
    )

    return NextResponse.json({ 
      submissions: submissionsWithAnswers 
    })

  } catch (error) {
    console.error('Error in GET /api/admin/evaluations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 