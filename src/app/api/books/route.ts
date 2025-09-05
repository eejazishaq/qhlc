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
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    let query = supabase
      .from('books')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { count: total } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
      .ilike('title', search ? `%${search}%` : '%')

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: books, error } = await query

    if (error) {
      console.error('Public books query error:', error)
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }

    return NextResponse.json({
      books: books || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Public books API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 