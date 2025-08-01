import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test 1: Check if we can read from banners
    const { data: banners, error: readError } = await supabase
      .from('banners')
      .select('*')
      .limit(5)

    if (readError) {
      console.error('Read error:', readError)
      return NextResponse.json({ 
        error: 'Read failed', 
        details: readError 
      }, { status: 500 })
    }

    // Test 2: Check if we can insert into banners
    const { data: insertData, error: insertError } = await supabase
      .from('banners')
      .insert({
        title: 'API Test Banner',
        description: 'Testing API permissions',
        image_url: 'https://via.placeholder.com/1200x400/1e40af/ffffff?text=API+Test',
        link_url: '/test',
        is_active: true,
        display_order: 9999
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        error: 'Insert failed', 
        details: insertError,
        readSuccess: true,
        banners: banners
      }, { status: 500 })
    }

    // Test 3: Check if we can update the banner
    const { data: updateData, error: updateError } = await supabase
      .from('banners')
      .update({ title: 'Updated API Test Banner' })
      .eq('id', insertData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Update failed', 
        details: updateError,
        readSuccess: true,
        insertSuccess: true,
        banners: banners,
        insertedBanner: insertData
      }, { status: 500 })
    }

    // Test 4: Delete the test banner
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', insertData.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Delete failed', 
        details: deleteError,
        readSuccess: true,
        insertSuccess: true,
        updateSuccess: true,
        banners: banners,
        insertedBanner: insertData,
        updatedBanner: updateData
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All banner operations successful',
      readSuccess: true,
      insertSuccess: true,
      updateSuccess: true,
      deleteSuccess: true,
      banners: banners,
      testBanner: updateData
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error 
    }, { status: 500 })
  }
} 