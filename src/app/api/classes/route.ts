import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const areaId = searchParams.get('areaId') || ''
    const centerId = searchParams.get('centerId') || ''
    const subject = searchParams.get('subject') || ''
    const teacher = searchParams.get('teacher') || ''

    let query = supabase
      .from('qhlc_classes')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,teacher_name.ilike.%${search}%`)
    }

    if (areaId) {
      query = query.eq('area_id', areaId)
    }

    if (centerId) {
      query = query.eq('center_id', centerId)
    }

    if (subject) {
      query = query.ilike('subject', `%${subject}%`)
    }

    if (teacher) {
      query = query.ilike('teacher_name', `%${teacher}%`)
    }

    const { count: total } = await supabase
      .from('qhlc_classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: classes, error } = await query

    if (error) {
      console.error('Public classes query error:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    return NextResponse.json({
      classes: classes || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Public classes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 