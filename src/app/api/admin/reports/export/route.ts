import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const locationId = searchParams.get('locationId')
    const locationType = searchParams.get('locationType')
    const userType = searchParams.get('userType')

    // Generate simple CSV for now (can be enhanced to PDF later)
    let csvData = ''
    let filename = 'report'

    switch (reportType) {
      case 'users':
        // Fetch user data based on filters
        let userQuery = supabase
          .from('profiles')
          .select('id, full_name, email, user_type, is_active, created_at')
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')
        
        if (startDate && endDate) {
          userQuery = userQuery.gte('created_at', startDate).lte('created_at', endDate)
        }
        if (userType) {
          userQuery = userQuery.eq('user_type', userType)
        }

        const { data: users } = await userQuery
        csvData = generateUsersCSV(users || [])
        filename = 'users-report'
        break

      case 'exams':
        // Fetch exam data
        let examQuery = supabase
          .from('user_exams')
          .select(`
            id, total_score, status, submitted_at,
            profiles!inner(full_name, user_type),
            exams!inner(title, exam_type, total_marks)
          `)
          .eq('status', 'completed')

        if (startDate && endDate) {
          examQuery = examQuery.gte('submitted_at', startDate).lte('submitted_at', endDate)
        }

        const { data: examResults } = await examQuery
        csvData = generateExamsCSV(examResults || [])
        filename = 'exams-report'
        break

      case 'trends':
        // Fetch trend data
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: trendUsers } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .not('user_type', 'eq', 'admin')
          .not('user_type', 'eq', 'super_admin')

        const { data: trendExams } = await supabase
          .from('user_exams')
          .select('submitted_at')
          .gte('submitted_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed')

        csvData = generateTrendsCSV(trendUsers || [], trendExams || [])
        filename = 'trends-report'
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateUsersCSV(users: any[]): string {
  const headers = ['ID', 'Full Name', 'Email', 'User Type', 'Status', 'Created At']
  const rows = users.map(user => [
    user.id,
    user.full_name || '',
    user.email || '',
    user.user_type || '',
    user.is_active ? 'Active' : 'Inactive',
    new Date(user.created_at).toLocaleDateString()
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generateExamsCSV(examResults: any[]): string {
  const headers = ['ID', 'Student Name', 'Exam Title', 'Exam Type', 'Score', 'Total Marks', 'Percentage', 'Submitted At']
  const rows = examResults.map(result => {
    const profile = result.profiles
    const exam = result.exams
    const percentage = exam.total_marks > 0 ? Math.round((result.total_score / exam.total_marks) * 100) : 0
    
    return [
      result.id,
      profile.full_name || '',
      exam.title || '',
      exam.exam_type || '',
      result.total_score || 0,
      exam.total_marks || 0,
      percentage,
      new Date(result.submitted_at).toLocaleDateString()
    ]
  })
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generateTrendsCSV(users: any[], exams: any[]): string {
  const headers = ['Date', 'New Users', 'Exam Completions']
  
  // Group by date
  const userCounts: Record<string, number> = {}
  const examCounts: Record<string, number> = {}
  
  users.forEach(user => {
    const date = user.created_at.split('T')[0]
    userCounts[date] = (userCounts[date] || 0) + 1
  })
  
  exams.forEach(exam => {
    const date = exam.submitted_at.split('T')[0]
    examCounts[date] = (examCounts[date] || 0) + 1
  })
  
  // Get all dates
  const allDates = new Set([...Object.keys(userCounts), ...Object.keys(examCounts)])
  const sortedDates = Array.from(allDates).sort()
  
  const rows = sortedDates.map(date => [
    date,
    userCounts[date] || 0,
    examCounts[date] || 0
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
