import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get certificate details
    console.log('Looking for certificate with ID:', id)
    console.log('User ID:', user.id)
    
    // Get certificate with exam details
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select(`
        *,
        exam:exams(
          id,
          title,
          description,
          exam_type,
          total_marks,
          passing_marks
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (certError) {
      console.error('Certificate query error:', certError)
      return NextResponse.json({ error: 'Certificate query failed', details: certError.message }, { status: 500 })
    }
    
    if (!certificate) {
      console.error('Certificate not found for ID:', id)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }
    
    console.log('Certificate found:', certificate.id)
    
    // Get user profile information
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, mobile')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile query error:', profileError)
      // Continue without profile data
    }
    
    // Combine certificate and profile data
    const certificateWithProfile = {
      ...certificate,
      user_profile: userProfile || null
    }

    // Update download count - simplified for current schema
    // Note: download_count and last_downloaded fields don't exist yet
    console.log('Download requested for certificate:', id)
    // TODO: Enable download tracking after database schema update

    // Return certificate data for PDF generation
    return NextResponse.json({
      success: true,
      certificate: certificateWithProfile
    })

  } catch (error) {
    console.error('Error in GET /api/certificates/[id]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 