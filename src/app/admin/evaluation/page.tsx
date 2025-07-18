'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Users, Star, Search, Eye, Check, X, FileText, User, Calendar, AlertTriangle, Edit3, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Submission {
  id: string
  user_exam_id: string
  user: {
    full_name: string
    email: string
  }
  exam: {
    title: string
    total_marks: number
    passing_marks: number
  }
  status: string
  submitted_at: string
  total_score: number
  answers: Answer[]
}

interface Answer {
  id: string
  question_id: string
  question_text: string
  question_type: string
  answer_text: string
  is_correct: boolean | null
  score_awarded: number
  max_score: number
  needs_evaluation: boolean
}

export default function AdminEvaluationPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [examFilter, setExamFilter] = useState('all')
  const [exams, setExams] = useState<any[]>([])

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
      fetchSubmissions()
      fetchExams()
    }
  }, [user, profile])

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/admin/evaluations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const fetchExams = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return
      }

      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  const evaluateSubmission = async (submissionId: string, evaluations: any[]) => {
    try {
      setEvaluating(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/evaluations/${submissionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ evaluations })
      })

      if (response.ok) {
        alert('✅ Evaluation completed successfully!')
        setShowEvaluationModal(false)
        setSelectedSubmission(null)
        fetchSubmissions() // Refresh the list
      } else {
        throw new Error('Failed to submit evaluation')
      }
    } catch (error) {
      console.error('Error evaluating submission:', error)
      alert('Failed to submit evaluation. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.exam.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    const matchesExam = examFilter === 'all' || submission.exam.title === examFilter
    
    return matchesSearch && matchesStatus && matchesExam
  })

  const stats = {
    pending: submissions.filter(s => s.status === 'pending').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    evaluated: submissions.filter(s => s.status === 'evaluated').length,
    averageScore: submissions.length > 0 
      ? Math.round(submissions.reduce((sum, s) => sum + s.total_score, 0) / submissions.length)
      : 0
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exam Evaluation</h1>
        <p className="text-gray-600">Review and grade exam submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Evaluated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.evaluated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by student name or exam title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="evaluated">Evaluated</option>
              </select>
              <select 
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Exams</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.title}>{exam.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Exam Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingSubmissions ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No submissions found</p>
                    <p className="text-sm">Students will appear here once they submit exams</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.exam.title}</div>
                      <div className="text-sm text-gray-500">
                        {submission.exam.total_marks} marks
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.total_score}/{submission.exam.total_marks} 
                      ({Math.round((submission.total_score / submission.exam.total_marks) * 100)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setShowEvaluationModal(true)
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Evaluate
                        </Button>
                        <Button
                          onClick={() => router.push(`/dashboard/user/exams/${submission.user_exam_id}/results`)}
                          size="sm"
                          variant="outline"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Evaluate Submission</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSubmission.user.full_name} - {selectedSubmission.exam.title}
                  </p>
                </div>
                <Button
                  onClick={() => setShowEvaluationModal(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {selectedSubmission.answers
                  .filter(answer => answer.needs_evaluation)
                  .map((answer, index) => (
                    <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">
                          Question {index + 1} ({answer.max_score} marks)
                        </h4>
                        <span className="text-sm text-gray-500">
                          {answer.question_type.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 mb-2">{answer.question_text}</p>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-600">Student's Answer:</p>
                          <p className="text-gray-900 mt-1">{answer.answer_text || 'No answer provided'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Score (0 - {answer.max_score})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={answer.max_score}
                            defaultValue={answer.score_awarded || 0}
                            onChange={(e) => {
                              const newAnswers = [...selectedSubmission.answers]
                              const answerIndex = newAnswers.findIndex(a => a.id === answer.id)
                              if (answerIndex !== -1) {
                                newAnswers[answerIndex] = {
                                  ...newAnswers[answerIndex],
                                  score_awarded: parseInt(e.target.value) || 0,
                                  is_correct: parseInt(e.target.value) > 0
                                }
                                setSelectedSubmission({
                                  ...selectedSubmission,
                                  answers: newAnswers
                                })
                              }
                            }}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Evaluation
                          </label>
                          <select
                            defaultValue={answer.is_correct === null ? '' : answer.is_correct ? 'correct' : 'incorrect'}
                            onChange={(e) => {
                              const newAnswers = [...selectedSubmission.answers]
                              const answerIndex = newAnswers.findIndex(a => a.id === answer.id)
                              if (answerIndex !== -1) {
                                newAnswers[answerIndex] = {
                                  ...newAnswers[answerIndex],
                                  is_correct: e.target.value === 'correct'
                                }
                                setSelectedSubmission({
                                  ...selectedSubmission,
                                  answers: newAnswers
                                })
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select evaluation</option>
                            <option value="correct">Correct</option>
                            <option value="incorrect">Incorrect</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {selectedSubmission.answers.filter(answer => answer.needs_evaluation).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No questions require manual evaluation</p>
                  <p className="text-sm text-gray-500">All questions have been auto-graded</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total Score: {selectedSubmission.answers.reduce((sum, a) => sum + (a.score_awarded || 0), 0)}/{selectedSubmission.exam.total_marks}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowEvaluationModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => evaluateSubmission(selectedSubmission.id, selectedSubmission.answers)}
                    disabled={evaluating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {evaluating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Evaluating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-4 h-4 mr-2" />
                        Submit Evaluation
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 