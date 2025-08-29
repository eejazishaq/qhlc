import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
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

    // Get user profile
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
    const status = searchParams.get('status')
    const examType = searchParams.get('exam_type')

    // Build query for user certificates
    let query = supabase
      .from('certificates')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          exam_type,
          total_marks,
          passing_marks
        )
      `)
      .eq('user_id', user.id)
      .order('issued_date', { ascending: false })

    // Apply filters - simplified for current schema
    // Note: status and exam_type filters are disabled until database schema is updated
    if (examType) {
      query = query.eq('exam.exam_type', examType)
    }

    const { data: certificates, error } = await query

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
    }

    // Calculate statistics - simplified for current schema
    const totalCertificates = certificates?.length || 0

    return NextResponse.json({
      certificates: certificates || [],
      statistics: {
        totalCertificates,
        activeCertificates: totalCertificates, // All certificates are considered active for now
        totalDownloads: 0 // download_count field doesn't exist yet
      }
    })

  } catch (error) {
    console.error('Error in GET /api/certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { exam_id, action } = body

    if (action === 'generate') {
      // Generate certificate for a passed exam
      if (!exam_id) {
        return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
      }

      // Check if user has already passed this exam and has a certificate
      const { data: existingCertificate } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', exam_id)
        .single()

      if (existingCertificate) {
        return NextResponse.json({ 
          error: 'Certificate already exists for this exam',
          certificate: existingCertificate
        }, { status: 400 })
      }

      // Get user exam details to verify passing status
      const { data: userExam, error: userExamError } = await supabase
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
        .eq('exam_id', exam_id)
        .in('status', ['completed', 'evaluated', 'published'])
        .single()

        console.log('userExam', userExam);
        

      if (userExamError || !userExam) {
        return NextResponse.json({ error: 'User exam not found or not completed' }, { status: 404 })
      }

      // Check if results are published
      if (!userExam.exam.results_published) {
        return NextResponse.json({ error: 'Exam results not yet published' }, { status: 400 })
      }

      // Check if user passed the exam
      const passed = userExam.total_score >= userExam.exam.passing_marks
      if (!passed) {
        return NextResponse.json({ error: 'Cannot generate certificate for failed exam' }, { status: 400 })
      }

      // Calculate percentage
      const percentage = (userExam.total_score / userExam.exam.total_marks) * 100

      // Create certificate - only use fields that exist in the current database schema
      const certificateData = {
        user_id: user.id,
        exam_id: exam_id,
        certificate_url: '', // Will be generated when PDF is created
        issued_date: new Date().toISOString().split('T')[0],
        issued_by: user.id
      }

      const { data: certificate, error: createError } = await supabase
        .from('certificates')
        .insert(certificateData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating certificate:', createError)
        return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        certificate,
        message: 'Certificate generated successfully'
      })

    } else if (action === 'download') {
      // Track certificate download
      if (!exam_id) {
        return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
      }

      // Download tracking - simplified for current schema
      // Note: download_count and last_downloaded fields don't exist yet
      console.log('Download requested for certificate:', exam_id)

      return NextResponse.json({
        success: true,
        message: 'Download tracked successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 