import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    // Build query with filters
    let query = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply status filter (public/private)
    if (status) {
      if (status === 'public') {
        query = query.eq('is_public', true)
      } else if (status === 'private') {
        query = query.eq('is_public', false)
      }
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: books, error } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch books',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      books: books || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in books API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, author, category, pdf_url, file_size, is_public, book_type } = body

    if (!title || !author || !pdf_url || !book_type) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['title', 'author', 'pdf_url', 'book_type'],
        received: { title, author, pdf_url, book_type }
      }, { status: 400 })
    }

    // Validate book_type enum values
    const validBookTypes = ['quran', 'tafseer', 'other']
    if (!validBookTypes.includes(book_type)) {
      return NextResponse.json({ 
        error: 'Invalid book_type',
        validTypes: validBookTypes,
        received: book_type
      }, { status: 400 })
    }

    const newBook = {
      title,
      description: description || '',
      author,
      category: category || 'Other',
      pdf_url,
      file_size: file_size || 0,
      is_public: is_public || false,
      book_type,
      status: 'issued',
      issued_date: new Date().toISOString().split('T')[0],
      return_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      uploaded_by: user.id
    }

    const { data: book, error } = await supabase
      .from('books')
      .insert(newBook)
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      return NextResponse.json({ error: 'Failed to create book' }, { status: 500 })
    }

    return NextResponse.json({ book }, { status: 201 })

  } catch (error) {
    console.error('Error in books API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, description, author, category, book_type, is_public } = body

    if (!id || !title || !author || !book_type) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['id', 'title', 'author', 'book_type'],
        received: { id, title, author, book_type }
      }, { status: 400 })
    }

    // Validate book_type enum values
    const validBookTypes = ['quran', 'tafseer', 'other']
    if (!validBookTypes.includes(book_type)) {
      return NextResponse.json({ 
        error: 'Invalid book_type',
        validTypes: validBookTypes,
        received: book_type
      }, { status: 400 })
    }

    const updateData = {
      title,
      description: description || '',
      author,
      category: category || 'Other',
      book_type,
      is_public: is_public || false,
      updated_at: new Date().toISOString()
    }

    const { data: book, error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
    }

    return NextResponse.json({ book })

  } catch (error) {
    console.error('Error in books API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authentication token available' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
      
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Get the book to check if it has a PDF file to delete
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('pdf_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching book for deletion:', fetchError)
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Delete the book
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting book:', deleteError)
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
    }

    // Try to delete the PDF file from storage if it exists
    if (book.pdf_url) {
      try {
        const urlParts = book.pdf_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `books/${fileName}`
        
        const { error: storageError } = await supabase.storage
          .from('books')
          .remove([filePath])
        
        if (storageError) {
          console.warn('Failed to delete PDF file from storage:', storageError)
          // Don't fail the request if storage deletion fails
        }
      } catch (storageError) {
        console.warn('Error deleting PDF file from storage:', storageError)
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ message: 'Book deleted successfully' })

  } catch (error) {
    console.error('Error in books API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 