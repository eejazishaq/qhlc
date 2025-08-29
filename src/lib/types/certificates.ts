export interface Certificate {
  id: string
  user_id: string
  exam_id: string
  certificate_url: string
  issued_date: string
  issued_by: string
  created_at: string
  certificate_number: string
  verification_code: string
  status: 'active' | 'revoked' | 'expired'
  score: number
  total_marks: number
  percentage: number
  certificate_type: string
  expiry_date?: string
  download_count: number
  last_downloaded?: string
  metadata?: Record<string, any>
  exam?: {
    id: string
    title: string
    description: string
    exam_type: string
    total_marks: number
    passing_marks: number
  }
  user?: {
    id: string
    full_name: string
    mobile: string
  }
}

export interface CertificateStatistics {
  totalCertificates: number
  activeCertificates: number
  totalDownloads: number
}

export interface CertificateGenerationRequest {
  exam_id: string
  action: 'generate'
}

export interface CertificateDownloadRequest {
  exam_id: string
  action: 'download'
}

export interface CertificateVerificationRequest {
  verification_code?: string
  certificate_number?: string
}

export interface CertificateVerificationResponse {
  verified: boolean
  certificate?: {
    id: string
    certificate_number: string
    verification_code: string
    issued_date: string
    status: string
    exam: {
      title: string
      exam_type: string
      total_marks: number
      passing_marks: number
    }
    student: {
      name: string
      mobile: string
    }
    performance: {
      score: number
      total_marks: number
      percentage: number
    }
  }
  error?: string
}

export interface AvailableCertificate {
  exam_id: string
  exam_title: string
  exam_type: string
  score: number
  total_marks: number
  percentage: number
  passed: boolean
  can_generate: boolean
  existing_certificate?: Certificate
} 