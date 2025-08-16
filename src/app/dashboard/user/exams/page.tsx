'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Award, Play, CheckCircle, XCircle, AlertCircle, Calendar, Users, FileText } from 'lucide-react'
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
  results_published: boolean
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
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'published' | 'abandoned'
  started_at: string
  submitted_at?: string
  total_score: number
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
  const [refreshing, setRefreshing] = useState(false)
  const [showRefreshNotification, setShowRefreshNotification] = useState(false)

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

  // Add a refresh mechanism when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible, refreshing data...')
        fetchAvailableExams()
        fetchUserExams()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  // Add focus event listener to refresh data when user returns to the tab
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, refreshing data...')
        fetchAvailableExams()
        fetchUserExams()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

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

      console.log('Fetching user exams with token:', session.access_token.substring(0, 20) + '...')

      const response = await fetch('/api/user-exams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('===User Exams Response Status===', response.status)
      console.log('===User Exams Response Headers===', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error('Failed to fetch user exams')
      }

      const data = await response.json()
      console.log('===User Exams Response Data===', data)
      console.log('===User Exams Array===', data.userExams)
      console.log('===User Exams Length===', data.userExams?.length || 0)
      
      setUserExams(data.userExams || [])
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

  const refreshData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([fetchAvailableExams(), fetchUserExams()])
      setShowRefreshNotification(true)
      setTimeout(() => setShowRefreshNotification(false), 3000)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
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
      case 'evaluated': return 'bg-blue-100 text-blue-800'
      case 'published': return 'bg-purple-100 text-purple-800'
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
  
  console.log('===User Exams===', userExams)
  
  const completedExams = userExams.filter(ue => ue.status === 'completed')
  const averageScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((sum, ue) => sum + ue.total_score, 0) / completedExams.length)
    : 0

  // Debug logging
  console.log('===Statistics Calculation===', {
    totalUserExams: userExams.length,
    userExams: userExams.map(ue => ({
      id: ue.id,
      status: ue.status,
      total_score: ue.total_score,
      exam_title: ue.exam?.title
    })),
    completedExams: completedExams.length,
    completedExamsDetails: completedExams.map(ue => ({
      id: ue.id,
      status: ue.status,
      total_score: ue.total_score,
      exam_title: ue.exam?.title
    })),
    averageScore
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Exams</h1>
              <p className="text-sm sm:text-base text-gray-600">Take exams and track your progress</p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Notification */}
      {showRefreshNotification && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-green-500 text-white px-4 py-3 rounded-md shadow-lg z-50">
          <div className="flex items-center justify-center sm:justify-start">
            <CheckCircle className="w-4 h-4 mr-2" />
            Data refreshed successfully!
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Available Exams</p>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {loadingExams ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-6 sm:h-8 sm:w-8 rounded"></div>
                    ) : (
                      availableExams.filter(exam => exam.completed_attempts.length === 0).length
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {refreshing ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-6 sm:h-8 sm:w-8 rounded"></div>
                  ) : (
                    completedExams.length
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {userExams.filter(ue => 
                    ue.status === 'published' || 
                    (ue.status === 'completed' && ue.exam?.results_published) ||
                    (ue.status === 'evaluated' && ue.exam?.results_published)
                  ).length} with results
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Results Available</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {refreshing ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-6 sm:h-8 sm:w-8 rounded"></div>
                  ) : (
                    userExams.filter(ue => 
                      ue.status === 'published' || 
                      (ue.status === 'completed' && ue.exam?.results_published) ||
                      (ue.status === 'evaluated' && ue.exam?.results_published)
                    ).length
                  )}
                </p>
                <p className="text-xs text-gray-500">Published results</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {refreshing ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-6 sm:h-8 sm:w-8 rounded"></div>
                  ) : (
                    `${averageScore}%`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Available Exams</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="mock">Mock Exams</option>
                  <option value="regular">Regular Exams</option>
                  <option value="final">Final Exams</option>
                </select>
                <Button
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="w-full sm:w-auto"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loadingExams ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableExams.filter(exam => exam.completed_attempts.length === 0).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No exams available</p>
                <p className="text-sm">Check back later for new exams</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {availableExams
                  .filter(exam => exam.completed_attempts.length === 0) // Filter out completed exams
                  .map((exam) => (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
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
                    
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{exam.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatDuration(exam.duration)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{exam.question_count} questions</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{exam.total_marks} marks</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Until {formatDate(exam.end_date)}</span>
                      </div>
                    </div>

                    {exam.best_score !== null && (
                      <div className="mb-4 p-3 bg-green-50 rounded-md">
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                          <span className="text-green-800">
                            Best Score: {exam.best_score}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => startExam(exam.id)}
                      disabled={!exam.can_take || startingExam === exam.id}
                      className="w-full py-2 sm:py-3"
                    >
                      {startingExam === exam.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
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

        {/* Completed Exams with Published Results */}
        {availableExams.filter(exam => exam.completed_attempts.length > 0 && exam.results_published).length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Completed Exams - Results Available</h3>
              <p className="text-sm text-gray-600 mt-1">View your results for these completed exams</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {availableExams
                  .filter(exam => exam.completed_attempts.length > 0 && exam.results_published)
                  .map((exam) => {
                    const completedAttempt = exam.completed_attempts[0] // Get the first completed attempt
                    return (
                      <div key={exam.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExamTypeColor(exam.exam_type)}`}>
                            {getExamTypeLabel(exam.exam_type)}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Results Available
                          </span>
                        </div>
                        
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{exam.title}</h4>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Award className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Score: {completedAttempt.total_score}%</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Completed: {formatDate(completedAttempt.submitted_at)}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            // Find the user exam ID for this completed attempt
                            const userExam = userExams.find(ue => ue.exam_id === exam.id && ue.status === 'completed')
                            if (userExam) {
                              router.push(`/dashboard/user/exams/${userExam.id}/results`)
                            }
                          }}
                          variant="outline"
                          className="w-full py-2 sm:py-3"
                        >
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            View Results
                          </div>
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Exams */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Exams</h3>
          </div>
          <div className="p-4 sm:p-6">
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
              <div className="space-y-3 sm:space-y-4">
                {userExams.slice(0, 5).map((userExam) => {
                  console.log('===Rendering Recent Exam===', {
                    id: userExam.id,
                    exam_title: userExam.exam?.title,
                    status: userExam.status,
                    started_at: userExam.started_at,
                    submitted_at: userExam.submitted_at,
                    total_score: userExam.total_score,
                    exam_object: userExam.exam
                  })
                  
                  return (
                    <div key={userExam.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 space-y-1 sm:space-y-0">
                            <h4 className="font-semibold text-gray-900 truncate">{userExam.exam?.title || 'Unknown Exam'}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userExam.status)} self-start sm:self-auto`}>
                              {userExam.status === 'in_progress' ? 'In Progress' : 
                               userExam.status === 'evaluated' ? 'Evaluated' :
                               userExam.status === 'published' ? 'Results Available' :
                               userExam.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 space-y-1 sm:space-y-0">
                            <span className="truncate">Started: {userExam.started_at ? formatDate(userExam.started_at) : 'Unknown'}</span>
                            {userExam.submitted_at && (
                              <span className="truncate">Submitted: {formatDate(userExam.submitted_at)}</span>
                            )}
                            {userExam.total_score > 0 && (
                              <span>Score: {userExam.total_score}%</span>
                            )}
                            {(userExam.status === 'published' || 
                              (userExam.status === 'completed' && userExam.exam?.results_published) ||
                              (userExam.status === 'evaluated' && userExam.exam?.results_published)) && (
                              <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Results Available
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 self-start sm:self-auto">
                          {(userExam.status === 'published' || 
                            (userExam.status === 'completed' && userExam.exam?.results_published) ||
                            (userExam.status === 'evaluated' && userExam.exam?.results_published)) && (
                            <Button
                              onClick={() => router.push(`/dashboard/user/exams/${userExam.id}/results`)}
                              variant="outline"
                              size="sm"
                              className="text-xs px-3 py-2"
                            >
                              View Results
                            </Button>
                          )}
                          {['pending', 'in_progress'].includes(userExam.status) && (
                            <Button
                              onClick={() => router.push(`/dashboard/user/exams/${userExam.id}`)}
                              size="sm"
                              className="text-xs px-3 py-2"
                            >
                              Continue
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 