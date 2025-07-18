'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Award, Play, CheckCircle, XCircle, AlertCircle, Calendar, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Exam {
  id: string
  title: string
  description: string
  duration: number
  total_marks: number
  passing_marks: number
  exam_type: 'mock' | 'regular' | 'final'
  status: 'draft' | 'active' | 'inactive'
  start_date: string
  end_date: string
  created_by: { full_name: string }
  question_count: number
  user_attempts: Array<{
    id: string
    status: string
    total_score: number
    submitted_at: string
  }>
  completed_attempts: Array<{
    id: string
    status: string
    total_score: number
    submitted_at: string
  }>
  active_attempts: Array<{
    id: string
    status: string
    total_score: number
    submitted_at: string
  }>
  can_take: boolean
  best_score: number | null
}

interface UserExam {
  id: string
  exam_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned'
  start_time: string
  end_time?: string
  total_score: number
  submitted_at?: string
  exam: Exam
}

export default function UserExamsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [availableExams, setAvailableExams] = useState<Exam[]>([])
  const [userExams, setUserExams] = useState<UserExam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [loadingUserExams, setLoadingUserExams] = useState(true)
  const [startingExam, setStartingExam] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')

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
      fetchAvailableExams()
      fetchUserExams()
    }
  }, [user, filterType])

  const fetchAvailableExams = async () => {
    try {
      setLoadingExams(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const params = new URLSearchParams()
      if (filterType) params.append('type', filterType)

      const response = await fetch(`/api/available-exams?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available exams')
      }

      const data = await response.json()
      console.log('Available exams response:', data)
      setAvailableExams(data.exams || [])
    } catch (error) {
      console.error('Error fetching available exams:', error)
    } finally {
      setLoadingExams(false)
    }
  }

  const fetchUserExams = async () => {
    try {
      setLoadingUserExams(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/user-exams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user exams')
      }

      const data = await response.json()
      console.log('User exams response:', data)
      setUserExams(data.user_exams || [])
    } catch (error) {
      console.error('Error fetching user exams:', error)
    } finally {
      setLoadingUserExams(false)
    }
  }

  const startExam = async (examId: string) => {
    try {
      setStartingExam(examId)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/user-exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exam_id: examId })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.userExam) {
          // User already has an active attempt, redirect to it
          router.push(`/dashboard/user/exams/${data.userExam.id}`)
          return
        }
        throw new Error(data.error || 'Failed to start exam')
      }

      // Redirect to the exam taking interface
      router.push(`/dashboard/user/exams/${data.userExam.id}`)
    } catch (error) {
      console.error('Error starting exam:', error)
      alert(error instanceof Error ? error.message : 'Failed to start exam')
    } finally {
      setStartingExam(null)
    }
  }

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'mock': return 'Mock Exam'
      case 'regular': return 'Regular Exam'
      case 'final': return 'Final Exam'
      default: return type
    }
  }

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'mock': return 'bg-yellow-100 text-yellow-800'
      case 'regular': return 'bg-blue-100 text-blue-800'
      case 'final': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'abandoned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const completedExams = userExams.filter(ue => ue.status === 'completed')
  const averageScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((sum, ue) => sum + ue.total_score, 0) / completedExams.length)
    : 0

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
              <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
              <p className="text-gray-600">Take exams and track your progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Exams</p>
                <p className="text-2xl font-bold text-gray-900">{availableExams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedExams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Available Exams</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="mock">Mock Exams</option>
                  <option value="regular">Regular Exams</option>
                  <option value="final">Final Exams</option>
                </select>
                <Button
                  onClick={fetchAvailableExams}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loadingExams ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableExams.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No exams available</p>
                <p className="text-sm">Check back later for new exams</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map((exam) => (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExamTypeColor(exam.exam_type)}`}>
                        {getExamTypeLabel(exam.exam_type)}
                      </span>
                      {!exam.can_take && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          In Progress
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatDuration(exam.duration)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>{exam.question_count} questions</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="w-4 h-4 mr-2" />
                        <span>{exam.total_marks} marks</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Until {formatDate(exam.end_date)}</span>
                      </div>
                    </div>

                    {exam.best_score !== null && (
                      <div className="mb-4 p-3 bg-green-50 rounded-md">
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-green-800">
                            Best Score: {exam.best_score}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => startExam(exam.id)}
                      disabled={!exam.can_take || startingExam === exam.id}
                      className="w-full"
                    >
                      {startingExam === exam.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Play className="w-4 h-4 mr-2" />
                          {exam.can_take ? 'Start Exam' : 'Continue Exam'}
                        </div>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Exams</h3>
          </div>
          <div className="p-6">
            {loadingUserExams ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : userExams.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent exams</p>
                <p className="text-sm">Start your first exam to see your history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userExams.slice(0, 5).map((userExam) => (
                  <div key={userExam.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{userExam.exam.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userExam.status)}`}>
                            {userExam.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Started: {formatDate(userExam.start_time)}</span>
                          {userExam.submitted_at && (
                            <span>Submitted: {formatDate(userExam.submitted_at)}</span>
                          )}
                          {userExam.total_score > 0 && (
                            <span>Score: {userExam.total_score}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {userExam.status === 'completed' && (
                          <Button
                            onClick={() => router.push(`/dashboard/user/exams/${userExam.id}/results`)}
                            variant="outline"
                            size="sm"
                          >
                            View Results
                          </Button>
                        )}
                        {['pending', 'in_progress'].includes(userExam.status) && (
                          <Button
                            onClick={() => router.push(`/dashboard/user/exams/${userExam.id}`)}
                            size="sm"
                          >
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 