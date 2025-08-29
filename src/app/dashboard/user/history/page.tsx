'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Link from 'next/link'

interface ExamHistory {
  id: string
  exam_id: string
  status: 'completed' | 'evaluated' | 'published'
  started_at: string
  submitted_at?: string
  total_score: number
  exam: {
    id: string
    title: string
    description: string
    duration: number
    total_marks: number
    passing_marks: number
    exam_type: string
    results_published: boolean
  }
}

interface Statistics {
  totalExams: number
  passedExams: number
  failedExams: number
  averageScore: number
  passRate: number
}

interface PerformanceTrend {
  month: string
  averageScore: number
  examCount: number
}

export default function ExamHistoryPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    averageScore: 0,
    passRate: 0
  })
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    examType: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)

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
      fetchExamHistory()
    }
  }, [user, filters])

  const fetchExamHistory = async () => {
    try {
      setLoadingHistory(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Build query parameters
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.examType) params.append('exam_type', filters.examType)
      if (filters.startDate) params.append('start_date', filters.startDate)
      if (filters.endDate) params.append('end_date', filters.endDate)

      const response = await fetch(`/api/exam-history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch exam history')
      }

      const data = await response.json()
      setExamHistory(data.userExams || [])
      setStatistics(data.statistics || {})
      setPerformanceTrend(data.performanceTrend || [])
    } catch (error) {
      console.error('Error fetching exam history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      await fetchExamHistory()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      examType: '',
      startDate: '',
      endDate: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-yellow-100 text-yellow-800'
      case 'evaluated': return 'bg-blue-100 text-blue-800'
      case 'published': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'mock': return 'Mock Exam'
      case 'regular': return 'Regular Exam'
      case 'final': return 'Final Exam'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getPassFailStatus = (score: number, passingMarks: number) => {
    return score >= passingMarks ? 'Pass' : 'Fail'
  }

  const getPassFailColor = (score: number, passingMarks: number) => {
    return score >= passingMarks ? 'text-green-600' : 'text-red-600'
  }

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exam History</h1>
              <p className="text-sm sm:text-base text-gray-600">View your past exam results and performance</p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1">Only shows results that have been published by instructors</p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <div className="bg-purple-100 p-2 rounded-full">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Published Results</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {loadingHistory ? '...' : statistics.totalExams}
                </p>
                <p className="text-xs text-gray-500">Only published results</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Passed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {loadingHistory ? '...' : statistics.passedExams}
                </p>
                <p className="text-xs text-gray-500">
                  {statistics.passRate}% pass rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Failed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {loadingHistory ? '...' : statistics.failedExams}
                </p>
                <p className="text-xs text-gray-500">Published results only</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {loadingHistory ? '...' : `${statistics.averageScore}%`}
                </p>
                <p className="text-xs text-gray-500">Published results only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
                <p className="text-sm text-gray-600">Filter published exam results</p>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="evaluated">Evaluated</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={filters.examType}
                    onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="mock">Mock Exam</option>
                    <option value="regular">Regular Exam</option>
                    <option value="final">Final Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Exam History Table */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Published Exam Results</h3>
            <p className="text-sm text-gray-600 mt-1">
              {examHistory.length} published result{examHistory.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : examHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8 px-4">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No published results found</p>
                <p className="text-sm">Your exam results will appear here once they are published by the instructor</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Results are only visible after they have been evaluated and published by an administrator.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {examHistory.map((exam) => (
                  <div key={exam.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {exam.exam?.title || 'Unknown Exam'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          Duration: {formatDuration(exam.exam?.duration || 0)}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExamTypeColor(exam.exam?.exam_type || '')}`}>
                            {getExamTypeLabel(exam.exam?.exam_type || '')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                            {exam.status === 'evaluated' ? 'Evaluated' :
                             exam.status === 'published' ? 'Results Available' :
                             exam.status === 'completed' ? 'Completed' : exam.status}
                          </span>
                        </div>
                      </div>
                      {(exam.status === 'published' || 
                        (exam.status === 'completed' && exam.exam?.results_published) ||
                        (exam.status === 'evaluated' && exam.exam?.results_published)) && (
                        <Link
                          href={`/dashboard/user/exams/${exam.id}/results`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    {(exam.status === 'published' || 
                      (exam.status === 'completed' && exam.exam?.results_published) ||
                      (exam.status === 'evaluated' && exam.exam?.results_published)) ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Score:</span>
                          <div className="text-gray-900 font-medium">
                            {exam.total_score}/{exam.exam?.total_marks || 0}
                          </div>
                          <div className="text-gray-500">
                            {exam.exam?.total_marks ? Math.round((exam.total_score / exam.exam.total_marks) * 100) : 0}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Result:</span>
                          <div className={`font-medium ${getPassFailColor(exam.total_score, exam.exam?.passing_marks || 0)}`}>
                            {getPassFailStatus(exam.total_score, exam.exam?.passing_marks || 0)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Results not yet published
                      </div>
                    )}
                    
                    <div className="mt-3 text-sm text-gray-500">
                      Completed: {exam.submitted_at ? formatDate(exam.submitted_at) : 'Not submitted'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : examHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No published results found</p>
                <p className="text-sm">Your exam results will appear here once they are published by the instructor</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Results are only visible after they have been evaluated and published by an administrator.
                  </p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {examHistory.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exam.exam?.title || 'Unknown Exam'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Duration: {formatDuration(exam.exam?.duration || 0)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExamTypeColor(exam.exam?.exam_type || '')}`}>
                          {getExamTypeLabel(exam.exam?.exam_type || '')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                          {exam.status === 'evaluated' ? 'Evaluated' :
                           exam.status === 'published' ? 'Results Available' :
                           exam.status === 'completed' ? 'Completed' : exam.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {(exam.status === 'published' || 
                          (exam.status === 'completed' && exam.exam?.results_published) ||
                          (exam.status === 'evaluated' && exam.exam?.results_published)) ? (
                          <>
                            <div className="text-sm text-gray-900">
                              {exam.total_score}/{exam.exam?.total_marks || 0}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exam.exam?.total_marks ? Math.round((exam.total_score / exam.exam.total_marks) * 100) : 0}%
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Results not yet published
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {(exam.status === 'published' || 
                          (exam.status === 'completed' && exam.exam?.results_published) ||
                          (exam.status === 'evaluated' && exam.exam?.results_published)) ? (
                          <span className={`text-sm font-medium ${getPassFailColor(exam.total_score, exam.exam?.passing_marks || 0)}`}>
                            {getPassFailStatus(exam.total_score, exam.exam?.passing_marks || 0)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exam.submitted_at ? formatDate(exam.submitted_at) : 'Not submitted'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(exam.status === 'published' || 
                          (exam.status === 'completed' && exam.exam?.results_published) ||
                          (exam.status === 'evaluated' && exam.exam?.results_published)) && (
                          <Link
                            href={`/dashboard/user/exams/${exam.id}/results`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Trend (Last 6 Months)</h3>
            <p className="text-sm text-gray-600 mt-1">Your average score progression over time</p>
          </div>
          <div className="p-4 sm:p-6">
            {performanceTrend.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No performance data</p>
                <p className="text-sm">Performance trends will appear here once you have published exam results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {performanceTrend.map((trend, index) => (
                  <div key={trend.month} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(trend.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {trend.examCount} exam{trend.examCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {trend.averageScore}%
                      </span>
                      {index > 0 && (
                        <div className={`flex items-center text-sm ${
                          trend.averageScore > performanceTrend[index - 1].averageScore 
                            ? 'text-green-600' 
                            : trend.averageScore < performanceTrend[index - 1].averageScore 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {trend.averageScore > performanceTrend[index - 1].averageScore ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : trend.averageScore < performanceTrend[index - 1].averageScore ? (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          ) : null}
                          {trend.averageScore > performanceTrend[index - 1].averageScore 
                            ? `+${trend.averageScore - performanceTrend[index - 1].averageScore}%`
                            : trend.averageScore < performanceTrend[index - 1].averageScore 
                            ? `${trend.averageScore - performanceTrend[index - 1].averageScore}%`
                            : 'No change'
                          }
                        </div>
                      )}
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