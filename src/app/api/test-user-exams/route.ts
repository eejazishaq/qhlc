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

    // Test 1: Check if user_exams table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_exams')
      .select('*')
      .limit(1)

    console.log('Table info:', { tableInfo, error: tableError })

    // Test 2: Get all user exams for this user
    const { data: userExams, error: userExamsError } = await supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', user.id)

    console.log('User exams:', { userExams, error: userExamsError })

    // Test 3: Get all exams
    const { data: allExams, error: allExamsError } = await supabase
      .from('exams')
      .select('*')
      .eq('status', 'active')

    console.log('Active exams:', { allExams, error: allExamsError })

    return NextResponse.json({
      user_id: user.id,
      table_exists: !tableError,
      table_error: tableError,
      user_exams_count: userExams?.length || 0,
      user_exams: userExams || [],
      active_exams_count: allExams?.length || 0,
      active_exams: allExams || []
    })

  } catch (error) {
    console.error('Test user exams API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 