import { Certificate, AvailableCertificate } from '@/lib/types/certificates'

export function checkCertificateEligibility(
  userExam: any,
  exam: any
): { eligible: boolean; reason?: string } {
  if (!userExam || !exam) {
    return { eligible: false, reason: 'Exam data not found' }
  }

  if (!exam.results_published) {
    return { eligible: false, reason: 'Results not yet published' }
  }

  if (userExam.status !== 'completed' && userExam.status !== 'evaluated' && userExam.status !== 'published') {
    return { eligible: false, reason: 'Exam not completed' }
  }

  if (userExam.total_score < exam.passing_marks) {
    return { eligible: false, reason: 'Did not achieve passing score' }
  }

  return { eligible: true }
}

export function formatCertificateNumber(certificateNumber: string): string {
  if (!certificateNumber) return 'N/A'
  
  // Format: QHLC-CERT-2025-00001 -> QHLC-CERT-2025-00001
  return certificateNumber
}

export function formatVerificationCode(verificationCode: string): string {
  if (!verificationCode) return 'N/A'
  
  // Format: VERIFY-abc123def456 -> VERIFY-abc123def456
  return verificationCode
}

export function formatPercentage(percentage: number): string {
  if (percentage === null || percentage === undefined) return 'N/A'
  return `${percentage.toFixed(1)}%`
}

export function formatScore(score: number, totalMarks: number): string {
  if (score === null || score === undefined || totalMarks === null || totalMarks === undefined) {
    return 'N/A'
  }
  return `${score}/${totalMarks}`
}

export function getCertificateStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'revoked':
      return 'text-red-600 bg-red-100'
    case 'expired':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getCertificateStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'revoked':
      return 'Revoked'
    case 'expired':
      return 'Expired'
    default:
      return 'Unknown'
  }
}

export function getExamTypeColor(examType: string): string {
  switch (examType) {
    case 'final':
      return 'text-purple-600 bg-purple-100'
    case 'midterm':
      return 'text-blue-600 bg-blue-100'
    case 'quiz':
      return 'text-green-600 bg-green-100'
    case 'regular':
      return 'text-orange-600 bg-orange-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getExamTypeLabel(examType: string): string {
  switch (examType) {
    case 'final':
      return 'Final Exam'
    case 'midterm':
      return 'Midterm'
    case 'quiz':
      return 'Quiz'
    case 'regular':
      return 'Regular Exam'
    default:
      return examType.charAt(0).toUpperCase() + examType.slice(1)
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid Date'
  }
}

export function isCertificateExpired(certificate: Certificate): boolean {
  if (!certificate.expiry_date) return false
  
  try {
    const expiryDate = new Date(certificate.expiry_date)
    const currentDate = new Date()
    return currentDate > expiryDate
  } catch (error) {
    return false
  }
}

export function getCertificateValidityStatus(certificate: Certificate): {
  valid: boolean
  status: string
  color: string
} {
  if (certificate.status !== 'active') {
    return {
      valid: false,
      status: getCertificateStatusLabel(certificate.status),
      color: getCertificateStatusColor(certificate.status)
    }
  }

  if (isCertificateExpired(certificate)) {
    return {
      valid: false,
      status: 'Expired',
      color: 'text-yellow-600 bg-yellow-100'
    }
  }

  return {
    valid: true,
    status: 'Valid',
    color: 'text-green-600 bg-green-100'
  }
}

export function generateCertificatePreview(certificate: Certificate): string {
  return `
Certificate of Completion

This is to certify that
${certificate.user?.full_name || 'Student Name'}

has successfully completed the
${certificate.exam?.title || 'Exam Title'}

with a score of ${formatScore(certificate.score, certificate.total_marks)}
(${formatPercentage(certificate.percentage)})

Certificate Number: ${formatCertificateNumber(certificate.certificate_number)}
Verification Code: ${formatVerificationCode(certificate.verification_code)}
Issued Date: ${formatDate(certificate.issued_date)}

QHLC - Quran & Hadith Learning Center
  `.trim()
} 