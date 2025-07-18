import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get all exams without any filters
    const { data: allExams, error: allError } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all exams:', allError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    // Get active exams
    const { data: activeExams, error: activeError } = await supabase
      .from('exams')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (activeError) {
      console.error('Error fetching active exams:', activeError)
      return NextResponse.json({ error: 'Failed to fetch active exams' }, { status: 500 })
    }

    const now = new Date().toISOString()

    return NextResponse.json({
      current_time: now,
      all_exams: allExams || [],
      active_exams: activeExams || [],
      total_exams: allExams?.length || 0,
      active_exams_count: activeExams?.length || 0
    })

  } catch (error) {
    console.error('Test exams API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 