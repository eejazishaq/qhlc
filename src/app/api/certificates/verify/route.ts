import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const body = await request.json()
    const { verification_code, certificate_number } = body

    if (!verification_code && !certificate_number) {
      return NextResponse.json({ 
        error: 'Either verification code or certificate number is required' 
      }, { status: 400 })
    }

    // Build query based on provided parameters
    let query = supabase
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
        ),
        user:profiles(
          id,
          full_name,
          mobile
        )
      `)

    if (verification_code) {
      query = query.eq('verification_code', verification_code)
    } else if (certificate_number) {
      query = query.eq('certificate_number', certificate_number)
    }

    const { data: certificate, error } = await query.single()

    if (error || !certificate) {
      return NextResponse.json({ 
        error: 'Certificate not found or invalid verification code',
        verified: false
      }, { status: 404 })
    }

    // Check if certificate is active
    if (certificate.status !== 'active') {
      return NextResponse.json({ 
        error: 'Certificate is not active',
        verified: false,
        certificate: {
          id: certificate.id,
          status: certificate.status,
          reason: 'Certificate has been revoked or is inactive'
        }
      }, { status: 400 })
    }

    // Return verified certificate information
    return NextResponse.json({
      verified: true,
      certificate: {
        id: certificate.id,
        certificate_number: certificate.certificate_number,
        verification_code: certificate.verification_code,
        issued_date: certificate.issued_date,
        status: certificate.status,
        exam: {
          title: certificate.exam?.title,
          exam_type: certificate.exam?.exam_type,
          total_marks: certificate.exam?.total_marks,
          passing_marks: certificate.exam?.passing_marks
        },
        student: {
          name: certificate.user?.full_name,
          mobile: certificate.user?.mobile
        },
        performance: {
          score: certificate.score,
          total_marks: certificate.total_marks,
          percentage: certificate.percentage
        }
      }
    })

  } catch (error) {
    console.error('Error in POST /api/certificates/verify:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 