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

    // Get user's completed exams with published results
    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          exam_type,
          total_marks,
          passing_marks,
          results_published
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['completed', 'evaluated', 'published'])
      .order('submitted_at', { ascending: false })

    if (userExamsError) {
      console.error('Error fetching user exams:', userExamsError)
      return NextResponse.json({ error: 'Failed to fetch user exams' }, { status: 500 })
    }

    // Get existing certificates for this user
    const { data: existingCertificates, error: certsError } = await supabase
      .from('certificates')
      .select('exam_id')
      .eq('user_id', user.id)

    if (certsError) {
      console.error('Error fetching existing certificates:', certsError)
      return NextResponse.json({ error: 'Failed to fetch existing certificates' }, { status: 500 })
    }

    const existingCertificateExamIds = new Set(existingCertificates?.map(c => c.exam_id) || [])

    // Process user exams to determine certificate eligibility
    const availableCertificates = userExams
      ?.filter(userExam => {
        // Only include exams with published results
        return userExam.exam?.results_published === true
      })
      .map(userExam => {
        const exam = userExam.exam
        if (!exam) return null

        const passed = userExam.total_score >= exam.passing_marks
        const canGenerate = passed && !existingCertificateExamIds.has(exam.id)
        const percentage = (userExam.total_score / exam.total_marks) * 100

        // Debug logging
        console.log('Processing exam:', {
          exam_id: exam.id,
          exam_title: exam.title,
          user_score: userExam.total_score,
          passing_marks: exam.passing_marks,
          total_marks: exam.total_marks,
          passed,
          canGenerate,
          existingCertificate: existingCertificateExamIds.has(exam.id)
        })

        return {
          exam_id: exam.id,
          exam_title: exam.title,
          exam_type: exam.exam_type,
          score: userExam.total_score,
          total_marks: exam.total_marks,
          percentage: Math.round(percentage),
          passed,
          can_generate: canGenerate,
          existing_certificate: existingCertificateExamIds.has(exam.id) ? true : false,
          completion_date: userExam.submitted_at
        }
      })
      .filter(Boolean) // Remove null values

    // Separate passed and failed exams
    const passedExams = availableCertificates?.filter(cert => cert && cert.passed) || []
    const failedExams = availableCertificates?.filter(cert => cert && !cert.passed) || []

    // Calculate statistics
    const totalExams = availableCertificates?.length || 0
    const passedCount = passedExams.length
    const failedCount = failedExams.length
    const canGenerateCount = passedExams.filter(cert => cert && cert.can_generate).length
    const alreadyGeneratedCount = passedExams.filter(cert => cert && cert.existing_certificate).length

    // Debug logging
    console.log('Final results:', {
      totalExams,
      passedCount,
      failedCount,
      canGenerateCount,
      alreadyGeneratedCount,
      availableCertificates: availableCertificates?.length || 0,
      passedExams: passedExams?.length || 0,
      failedExams: failedExams?.length || 0
    })

    return NextResponse.json({
      availableCertificates: availableCertificates || [],
      passedExams,
      failedExams,
      statistics: {
        totalExams,
        passedCount,
        failedCount,
        canGenerateCount,
        alreadyGeneratedCount
      }
    })

  } catch (error) {
    console.error('Error in GET /api/certificates/available:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 