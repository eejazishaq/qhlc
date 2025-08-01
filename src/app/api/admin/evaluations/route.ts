import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('===Admin Evaluations API Called===')
    const supabase = createClient()
    
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found')
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    console.log('User profile:', { user_type: profile.user_type })

    if (!['admin', 'super_admin'].includes(profile.user_type)) {
      console.log('Unauthorized access attempt')
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
          full_name
        ),
        exam:exams(
          id,
          title,
          total_marks,
          passing_marks
        )
      `)
      .in('status', ['completed', 'evaluated', 'pending'])
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })

    if (userExamsError) {
      console.error('Error fetching user exams:', userExamsError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    console.log('===Admin Evaluations Debug===', {
      userExams: userExams,
      count: userExams?.length || 0
    })

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
              marks,
              correct_answer,
              options
            )
          `)
          .eq('user_exam_id', userExam.id)

        if (answersError) {
          console.error('Error fetching answers:', answersError)
          return userExam
        }

        console.log('===Answers for User Exam===', {
          user_exam_id: userExam.id,
          answers_count: answers?.length || 0,
          answers: answers?.map(a => ({
            question_type: (a.question as any)?.type,
            is_correct: a.is_correct,
            needs_evaluation: (a.question as any)?.type === 'text' && a.is_correct === null
          }))
        })

        const processedAnswers = (answers || []).map(answer => {
          const question = answer.question as any
          return {
            id: answer.id,
            question_id: answer.question_id,
            question_text: question?.question_text || '',
            question_type: question?.type || '',
            answer_text: answer.answer_text,
            is_correct: answer.is_correct,
            score_awarded: answer.score_awarded || 0,
            max_score: question?.marks || 0,
            needs_evaluation: question?.type === 'text' && answer.is_correct === null,
            correct_answer: question?.correct_answer || '',
            options: question?.options || []
          }
        })

        return {
          ...userExam,
          answers: processedAnswers
        }
      })
    )

    console.log('===Admin Evaluations Final Response===', {
      submissionsCount: submissionsWithAnswers.length,
      submissions: submissionsWithAnswers.map(s => ({
        id: s.id,
        user_name: (s.user as any)?.full_name,
        exam_title: (s.exam as any)?.title,
        status: s.status,
        answers_count: (s as any).answers?.length || 0
      }))
    })

    return NextResponse.json({ 
      submissions: submissionsWithAnswers 
    })

  } catch (error) {
    console.error('Error in GET /api/admin/evaluations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 