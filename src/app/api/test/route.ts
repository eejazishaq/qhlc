import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }, { status: 500 })
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Test database connection - fixed syntax
    const { data, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message
      }, { status: 500 })
    }

    // Test insert with service role
    const testData = {
      title: 'Test Image',
      description: 'Test Description',
      image_url: 'https://example.com/test.jpg',
      category: 'events' as const,
      is_featured: false,
      uploaded_by: '00000000-0000-0000-0000-000000000000'
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('gallery')
      .insert([testData])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        error: 'Insert test failed',
        details: insertError.message
      }, { status: 500 })
    }

    // Clean up test data
    await supabaseAdmin
      .from('gallery')
      .delete()
      .eq('id', insertData.id)

    return NextResponse.json({
      success: true,
      message: 'Service role key works correctly',
      testInsertId: insertData.id,
      environmentCheck: {
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 