import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fetch only active banners ordered by display_order
    const { data: banners, error } = await supabase
      .from('banners')
      .select('id, title, description, image_url, link_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching active banners:', error)
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
    }

    console.log('Public banners API - Found banners:', banners?.length || 0)
    console.log('Banners data:', banners)

    return NextResponse.json({ banners: banners || [] })
  } catch (error) {
    console.error('Error in banners GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 