'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Award, 
  Download, 
  Eye, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Plus,
  Search,
  Filter,
  RefreshCw,
  Shield,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react'
import { 
  Certificate, 
  CertificateStatistics,
  AvailableCertificate 
} from '@/lib/types/certificates'
import { 
  formatCertificateNumber,
  formatVerificationCode,
  formatPercentage,
  formatScore,
  getCertificateStatusColor,
  getCertificateStatusLabel,
  getExamTypeColor,
  getExamTypeLabel,
  formatDate,
  getCertificateValidityStatus,
  generateCertificatePreview
} from '@/lib/utils/certificateUtils'

export default function CertificatesPage() {
  const { user, profile, session, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // State for certificates
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [availableCertificates, setAvailableCertificates] = useState<AvailableCertificate[]>([])
  const [statistics, setStatistics] = useState<CertificateStatistics>({
    totalCertificates: 0,
    activeCertificates: 0,
    totalDownloads: 0
  })
  
  // Loading states
  const [loadingCertificates, setLoadingCertificates] = useState(true)
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null)
  
  // UI states
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [examTypeFilter, setExamTypeFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCertificates()
      fetchAvailableCertificates()
    }
  }, [user])

  const fetchCertificates = async () => {
    try {
      setLoadingCertificates(true)
      const token = session?.access_token
      
      if (!token) {
        console.error('No access token available')
        setLoadingCertificates(false)
        return
      }
      
      const response = await fetch('/api/certificates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
        setStatistics(data.statistics || {})
      } else {
        console.error('Failed to fetch certificates')
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoadingCertificates(false)
    }
  }

  const fetchAvailableCertificates = async () => {
    try {
      setLoadingAvailable(true)
      const token = session?.access_token
      
      if (!token) {
        console.error('No access token available')
        setLoadingAvailable(false)
        return
      }
      
      const response = await fetch('/api/certificates/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableCertificates(data.availableCertificates || [])
      } else {
        console.error('Failed to fetch available certificates')
      }
    } catch (error) {
      console.error('Error fetching available certificates:', error)
    } finally {
      setLoadingAvailable(false)
    }
  }

  const generateCertificate = async (examId: string) => {
    try {
      setGeneratingCertificate(examId)
      const token = session?.access_token
      
      if (!token) {
        alert('No access token available. Please log in again.')
        setGeneratingCertificate(null)
        return
      }
      
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: examId,
          action: 'generate'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh certificates after generation
        await fetchCertificates()
        await fetchAvailableCertificates()
        alert('Certificate generated successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to generate certificate')
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Failed to generate certificate')
    } finally {
      setGeneratingCertificate(null)
    }
  }

  const downloadCertificate = async (certificateId: string) => {
    try {
      const token = session?.access_token
      
      if (!token) {
        alert('No access token available. Please log in again.')
        return
      }
      
      console.log('Downloading certificate with ID:', certificateId)
      
      // First, get the certificate details to find the exam_id
      const certificate = certificates.find(c => c.id === certificateId)
      if (!certificate) {
        alert('Certificate not found')
        return
      }
      
      console.log('Certificate found:', certificate)
      
      const response = await fetch(`/api/certificates/${certificateId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Generate PDF certificate
        try {
          const { generateCertificatePDFDirect } = await import('@/lib/utils/pdfGenerator')
          
          // Prepare certificate data for PDF generation
          const certificateData = {
            id: certificate.id,
            user_id: certificate.user_id,
            exam_id: certificate.exam_id,
            issued_date: certificate.issued_date,
            exam: {
              title: data.certificate.exam?.title || 'Unknown Exam',
              exam_type: data.certificate.exam?.exam_type || 'General',
              total_marks: data.certificate.exam?.total_marks || 0,
              passing_marks: data.certificate.exam?.passing_marks || 0
            },
            user: {
              full_name: data.certificate.user_profile?.full_name || profile?.full_name || 'Student',
              mobile: data.certificate.user_profile?.mobile || profile?.mobile || ''
            }
          }
          
          // Generate PDF
          const pdfBlob = generateCertificatePDFDirect(certificateData)
          
          // Create download link
          const url = URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `QHLC_Certificate_${certificateData.exam.title.replace(/\s+/g, '_')}_${certificateData.user.full_name.replace(/\s+/g, '_')}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          // Track download
          await fetch('/api/certificates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              exam_id: data.certificate.exam_id,
              action: 'download'
            })
          })
          
          // Refresh certificates to update download count
          await fetchCertificates()
          
          alert('Certificate downloaded successfully!')
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError)
          alert('Certificate generated but PDF creation failed. Please try again.')
          
          // Fallback: show certificate preview
          setSelectedCertificate(data.certificate)
          setShowCertificateModal(true)
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to download certificate: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Failed to download certificate')
    }
  }

  const verifyCertificate = async () => {
    if (!verificationCode.trim()) {
      alert('Please enter a verification code')
      return
    }

    // Note: Verification is disabled until database schema is updated
    setVerificationResult({ 
      error: 'Certificate verification is temporarily disabled. Database schema update required.' 
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const refreshData = () => {
    fetchCertificates()
    fetchAvailableCertificates()
  }

  const clearFilters = () => {
    setStatusFilter('')
    setExamTypeFilter('')
    setSearchTerm('')
  }

  // Filter certificates - simplified for current schema
  const filteredCertificates = certificates.filter(cert => {
    // Note: status filtering is disabled until database schema is updated
    if (examTypeFilter && cert.exam?.exam_type !== examTypeFilter) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        cert.exam?.title?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    return true
  })

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
              <p className="text-gray-600">View, generate, and download your earned certificates</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowVerificationModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                disabled
                title="Verification disabled until database schema is updated"
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify Certificate
              </button>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalCertificates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeCertificates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Exams</p>
                <p className="text-2xl font-bold text-gray-900">{availableCertificates.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Can Generate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableCertificates.filter(cert => cert.can_generate).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Status Summary */}
        {availableCertificates.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Exam Status Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {availableCertificates.filter(cert => cert.passed).length}
                  </div>
                  <div className="text-sm text-green-700">Passed Exams</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {availableCertificates.filter(cert => !cert.passed).length}
                  </div>
                  <div className="text-sm text-red-700">Failed Exams</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {availableCertificates.filter(cert => cert.can_generate).length}
                  </div>
                  <div className="text-sm text-blue-700">Can Generate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {availableCertificates.filter(cert => cert.existing_certificate).length}
                  </div>
                  <div className="text-sm text-yellow-700">Already Generated</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Certificates Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Exam Results & Certificate Eligibility</h3>
              <button
                onClick={refreshData}
                className="text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {loadingAvailable ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableCertificates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No completed exams found</p>
                <p className="text-sm">Complete exams to see results and certificate eligibility</p>
              </div>
            ) : (
              <div className="space-y-4">
                                {availableCertificates.map((cert) => (
                  <div key={cert.exam_id} className={`border rounded-lg p-4 ${
                    cert.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{cert.exam_title}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExamTypeColor(cert.exam_type)}`}>
                            {getExamTypeLabel(cert.exam_type)}
                          </span>
                          <span>Score: {cert.score}/{cert.total_marks}</span>
                          <span>Percentage: {cert.percentage}%</span>
                          {cert.passed ? (
                            <span className="text-green-600 font-medium">✓ Passed</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Failed</span>
                          )}
                        </div>
                        
                        {/* Status and eligibility information */}
                        <div className="mt-3 text-sm">
                          {cert.passed ? (
                            cert.can_generate ? (
                              <div className="text-green-700">
                                <span className="font-medium">✓ Eligible for certificate generation</span>
                                <p className="text-green-600">You passed this exam and can generate a certificate</p>
                              </div>
                            ) : cert.existing_certificate ? (
                              <div className="text-blue-700">
                                <span className="font-medium">✓ Certificate already generated</span>
                                <p className="text-blue-600">You already have a certificate for this exam</p>
                              </div>
                            ) : (
                              <div className="text-yellow-700">
                                <span className="font-medium">⚠ Certificate generation pending</span>
                                <p className="text-yellow-600">Contact administrator for certificate generation</p>
                              </div>
                            )
                          ) : (
                            <div className="text-red-700">
                              <span className="font-medium">✗ Not eligible for certificate</span>
                              <p className="text-red-600">
                                You need {cert.total_marks - cert.score} more points to pass (passing mark: {cert.total_marks * 0.6})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action button */}
                      {cert.passed && cert.can_generate ? (
                        <button
                          onClick={() => generateCertificate(cert.exam_id)}
                          disabled={generatingCertificate === cert.exam_id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {generatingCertificate === cert.exam_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Generate Certificate
                        </button>
                      ) : cert.passed && cert.existing_certificate ? (
                        <button
                          disabled
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Certificate Generated
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Not Eligible
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Your Certificates</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
                <button
                  onClick={refreshData}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="revoked">Revoked</option>
                    <option value="expired">Expired</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Status filtering disabled until database schema is updated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="final">Final Exam</option>
                    <option value="midterm">Midterm</option>
                    <option value="quiz">Quiz</option>
                    <option value="regular">Regular Exam</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Certificates Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Certificates</h3>
          </div>
          <div className="p-6">
            {loadingCertificates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No certificates found</p>
                <p className="text-sm">
                  {searchTerm || statusFilter || examTypeFilter 
                    ? 'Try adjusting your filters' 
                    : 'Complete exams to earn certificates'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCertificates.map((certificate) => {
                  const validityStatus = getCertificateValidityStatus(certificate)
                  return (
                    <div key={certificate.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${validityStatus.color}`}>
                          {validityStatus.status}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getExamTypeColor(certificate.exam?.exam_type || '')}`}>
                          {getExamTypeLabel(certificate.exam?.exam_type || '')}
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {certificate.exam?.title || 'Untitled Exam'}
                      </h4>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>Issued:</span>
                          <span>{formatDate(certificate.issued_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-medium text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Note:</span>
                          <span className="text-xs text-gray-500">Score details require schema update</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        <div className="flex justify-between">
                          <span>Certificate #:</span>
                          <span className="font-mono">ID: {certificate.id?.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verify Code:</span>
                          <span className="font-mono">N/A - Schema Update Required</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadCertificate(certificate.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCertificate(certificate)
                            setShowCertificateModal(true)
                          }}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Certificate Information */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">About QHLC Certificates</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">How to Earn Certificates</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Complete exams with passing scores</li>
                  <li>• Achieve required minimum marks</li>
                  <li>• Finish exams within time limits</li>
                  <li>• Wait for results to be published by instructors</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Certificate Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Official QHLC branding</li>
                  <li>• Unique certificate numbers</li>
                  <li>• Digital download available</li>
                  <li>• Verifiable authenticity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate View Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Certificate Details</h3>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">{generateCertificatePreview(selectedCertificate)}</pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium">Certificate #:</span>
                  <div className="flex items-center mt-1">
                                            <span className="font-mono">ID: {selectedCertificate.id?.slice(0, 8)}...</span>
                        <button
                          onClick={() => copyToClipboard(selectedCertificate.id || '')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Verification Code:</span>
                  <div className="flex items-center mt-1">
                                            <span className="font-mono">N/A - Schema Update Required</span>
                        <button
                          onClick={() => copyToClipboard('Schema update required')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => downloadCertificate(selectedCertificate.id)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Verify Certificate Authenticity</h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code or Certificate Number
                </label>
                <input
                  type="text"
                  placeholder="Enter verification code or certificate number..."
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mb-4">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyCertificate}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Verify
                </button>
              </div>

              {verificationResult && (
                <div className={`p-4 rounded-lg ${
                  verificationResult.verified 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {verificationResult.verified ? (
                    <div>
                      <div className="flex items-center text-green-800 mb-2">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Certificate Verified Successfully!</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <p><strong>Student:</strong> {verificationResult.certificate.student.name}</p>
                        <p><strong>Exam:</strong> {verificationResult.certificate.exam.title}</p>
                        <p><strong>Score:</strong> {verificationResult.certificate.performance.score}/{verificationResult.certificate.performance.total_marks}</p>
                        <p><strong>Percentage:</strong> {verificationResult.certificate.performance.percentage}%</p>
                        <p><strong>Issued:</strong> {formatDate(verificationResult.certificate.issued_date)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-800">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span>{verificationResult.error || 'Certificate verification failed'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 