'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Clock, Users, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Exam {
  id: string
  title: string
  description: string
  exam_type: string
  status: string
  duration: number
  total_marks: number
  passing_marks: number
  start_date: string
  end_date: string
  created_at: string
  created_by: {
    full_name: string
  }
  questions: Question[]
  user_exams: any[]
}

interface Question {
  id: string
  question_text: string
  type: 'mcq' | 'truefalse' | 'text'
  options?: string[]
  correct_answer: string
  marks: number
  order_number: number
}

export default function ViewExamPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [loadingExam, setLoadingExam] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // Check if user has admin role
    if (!loading && profile && !['admin', 'super_admin'].includes(profile.user_type)) {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '')) {
      fetchExam()
    }
  }, [user, profile, params.id])

  const fetchExam = async () => {
    try {
      setLoadingExam(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/exams/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExam(data.exam)
      } else {
        console.error('Failed to fetch exam')
        router.push('/admin/exams')
      }
    } catch (error) {
      console.error('Error fetching exam:', error)
      router.push('/admin/exams')
    } finally {
      setLoadingExam(false)
    }
  }

  const handleEditExam = () => {
    router.push(`/admin/exams/${params.id}/edit`)
  }

  const handleDeleteExam = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/exams/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        alert('Exam deleted successfully')
        router.push('/admin/exams')
      } else {
        throw new Error('Failed to delete exam')
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Failed to delete exam. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'MCQ'
      case 'truefalse': return 'True/False'
      case 'text': return 'Text'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'draft': return 'text-yellow-600 bg-yellow-100'
      case 'inactive': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
    return null
  }

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">The exam you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/exams')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">Exam Details</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => router.push(`/admin/exams/${params.id}/evaluation`)}
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <FileText className="w-4 h-4 mr-2" />
                Evaluate
              </Button>
              <Button
                onClick={handleEditExam}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Exam
              </Button>
              <Button
                onClick={handleDeleteExam}
                disabled={deleting}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Exam Details */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Exam Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-sm text-gray-900">{exam.exam_type.charAt(0).toUpperCase() + exam.exam_type.slice(1)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-sm text-gray-900">{exam.duration} minutes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                  <p className="text-sm text-gray-900">{exam.total_marks}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
                  <p className="text-sm text-gray-900">{exam.passing_marks}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-sm text-gray-900">{formatDate(exam.start_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-sm text-gray-900">{formatDate(exam.end_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <p className="text-sm text-gray-900">{exam.created_by?.full_name || 'Unknown'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-sm text-gray-900">{formatDate(exam.created_at)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Questions</span>
                    <span className="text-sm font-medium text-gray-900">{exam.questions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Participants</span>
                    <span className="text-sm font-medium text-gray-900">{exam.user_exams?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Questions ({exam.questions?.length || 0})</h2>
              </div>
              
              <div className="p-4 sm:p-6">
                {exam.questions && exam.questions.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {exam.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Q{index + 1}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              question.type === 'mcq' ? 'bg-purple-100 text-purple-800' :
                              question.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {getQuestionTypeLabel(question.type)}
                            </span>
                            <span className="text-sm text-gray-500">{question.marks} marks</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-900 mb-3">{question.question_text}</p>
                        
                        {question.type === 'mcq' && question.options && (
                          <div className="space-y-2 mb-3">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-start space-x-2">
                                <span className="text-sm text-gray-500 mt-0.5">{String.fromCharCode(65 + optIndex)}.</span>
                                <span className={`text-sm ${
                                  option === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-700'
                                }`}>
                                  {option}
                                  {option === question.correct_answer && (
                                    <CheckCircle className="inline w-4 h-4 ml-1" />
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'truefalse' && (
                          <div className="mb-3">
                            <span className={`text-sm font-medium ${
                              question.correct_answer === 'true' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Correct Answer: {question.correct_answer === 'true' ? 'True' : 'False'}
                            </span>
                          </div>
                        )}
                        
                        {question.type === 'text' && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-600">
                              Text question - requires manual evaluation
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                    <p className="mt-1 text-sm text-gray-500">This exam doesn't have any questions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 