import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
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

    const { id } = resolvedParams
    const body = await request.json()
    const { title, description, author, category, is_public } = body

    if (!title || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: book, error } = await supabase
      .from('books')
      .update({
        title,
        description: description || '',
        author,
        category: category || 'Other',
        is_public: is_public || false,
        updated_at: new Date().toISOString()
      })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
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

    const { id } = resolvedParams

    // Get book info for file deletion
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('pdf_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching book for deletion:', fetchError)
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Delete the book record
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting book:', deleteError)
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
    }

    // Try to delete the PDF file from storage (optional)
    if (book.pdf_url) {
      try {
        const filePath = book.pdf_url.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('qhlc-storage')
            .remove([`books/${filePath}`])
        }
      } catch (storageError) {
        console.warn('Could not delete PDF file from storage:', storageError)
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ message: 'Book deleted successfully' })

  } catch (error) {
    console.error('Error in books API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 