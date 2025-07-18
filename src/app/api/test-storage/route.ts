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
    
    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test storage buckets
    const buckets = ['resources', 'gallery', 'profiles', 'certificates']
    const results: any = {}

    for (const bucket of buckets) {
      try {
        // Check if bucket exists
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket)
        
        if (bucketError) {
          results[bucket] = { exists: false, error: bucketError.message }
        } else {
          results[bucket] = { exists: true, data: bucketData }
        }
      } catch (error) {
        results[bucket] = { exists: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    // Test file upload to resources bucket
    let uploadTest = null
    try {
      // Create a simple test file
      const testContent = 'This is a test file for QHLC storage'
      const testFile = new Blob([testContent], { type: 'text/plain' })
      const testFileName = `test_${Date.now()}.txt`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(testFileName, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        uploadTest = { success: false, error: uploadError.message }
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resources')
          .getPublicUrl(testFileName)

        uploadTest = { 
          success: true, 
          file: uploadData, 
          url: urlData.publicUrl 
        }

        // Clean up test file
        await supabase.storage
          .from('resources')
          .remove([testFileName])
      }
    } catch (error) {
      uploadTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    return NextResponse.json({
      message: 'Storage test completed',
      buckets: results,
      uploadTest
    })
  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create-buckets') {
      // Create storage buckets if they don't exist
      const buckets = [
        {
          id: 'resources',
          name: 'resources',
          public: true,
          fileSizeLimit: 20971520, // 20MB
          allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'audio/mpeg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
        },
        {
          id: 'gallery',
          name: 'gallery',
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        },
        {
          id: 'profiles',
          name: 'profiles',
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        },
        {
          id: 'certificates',
          name: 'certificates',
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
        }
      ]

      const results = []
      for (const bucket of buckets) {
        try {
          const { data, error } = await supabase.storage.createBucket(bucket.id, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes
          })

          if (error) {
            results.push({ bucket: bucket.id, success: false, error: error.message })
          } else {
            results.push({ bucket: bucket.id, success: true, data })
          }
        } catch (error) {
          results.push({ bucket: bucket.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

    return NextResponse.json({
        message: 'Bucket creation completed',
        results
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Storage setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 