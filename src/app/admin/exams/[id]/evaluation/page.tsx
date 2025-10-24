'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, FileText, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface UserExam {
  id: string
  user_id: string
  exam_id: string
  status: 'completed' | 'evaluated' | 'published'
  submitted_at: string
  total_score: number
  user: {
    id: string
    full_name: string
    mobile: string
    user_type: string
  }
  user_answers: UserAnswer[]
  evaluation_stats: {
    total_questions: number
    evaluated_questions: number
    auto_evaluated: number
    manual_evaluation_needed: number
    fully_evaluated: boolean
  }
}

interface UserAnswer {
  id: string
  answer_text: string
  is_correct: boolean | null
  score_awarded: number | null
  question: {
    id: string
    question_text: string
    type: 'mcq' | 'truefalse' | 'text'
    correct_answer: string
    marks: number
    order_number: number
  }
}

interface Exam {
  id: string
  title: string
  description: string
  total_marks: number
  passing_marks: number
  results_published: boolean
}

export default async function ExamEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <ExamEvaluationPageClient params={resolvedParams} />
}

function ExamEvaluationPageClient({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [userExams, setUserExams] = useState<UserExam[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedUserExam, setSelectedUserExam] = useState<UserExam | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [publishing, setPublishing] = useState(false)

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
      fetchEvaluationData()
    }
  }, [user, profile, params.id])

  const fetchEvaluationData = async () => {
    try {
      setLoadingData(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/exams/${params.id}/evaluation`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch evaluation data')
      }

      const data = await response.json()
      setExam(data.exam)
      setUserExams(data.userExams || [])
    } catch (error) {
      console.error('Error fetching evaluation data:', error)
      alert('Failed to load evaluation data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  const evaluateAnswer = async (userAnswerId: string, isCorrect: boolean, scoreAwarded: number, remarks?: string) => {
    try {
      setEvaluating(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/exams/${params.id}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_answer_id: userAnswerId,
          is_correct: isCorrect,
          score_awarded: scoreAwarded,
          remarks
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      // Refresh data
      await fetchEvaluationData()
      alert('Answer evaluated successfully!')
    } catch (error) {
      console.error('Error evaluating answer:', error)
      alert('Failed to evaluate answer. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  const publishResults = async () => {
    if (!confirm('Are you sure you want to publish the results? This will make them visible to all users.')) {
      return
    }

    try {
      setPublishing(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/exams/${params.id}/evaluation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'publish_results'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to publish results')
      }

      await fetchEvaluationData()
      alert('Results published successfully!')
    } catch (error) {
      console.error('Error publishing results:', error)
      alert('Failed to publish results. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-yellow-100 text-yellow-800'
      case 'evaluated': return 'bg-blue-100 text-blue-800'
      case 'published': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push(`/admin/exams/${params.id}`)}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exam
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Exam Evaluation</h1>
                <p className="text-sm text-gray-600">{exam?.title}</p>
              </div>
            </div>
            
            {exam && !exam.results_published && (
              <Button
                onClick={publishResults}
                disabled={publishing || userExams.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {publishing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish Results
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">User Submissions</h2>
                <p className="text-sm text-gray-600 mt-1">{userExams.length} submissions</p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {userExams.map((userExam) => (
                  <div
                    key={userExam.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedUserExam?.id === userExam.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedUserExam(userExam)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{userExam.user.full_name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userExam.status)}`}>
                        {userExam.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{userExam.user.mobile}</p>
                      <p>Submitted: {new Date(userExam.submitted_at).toLocaleDateString()}</p>
                      <p>Score: {userExam.total_score}/{exam?.total_marks}</p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {userExam.evaluation_stats.evaluated_questions}/{userExam.evaluation_stats.total_questions} evaluated
                        </span>
                        {userExam.evaluation_stats.manual_evaluation_needed > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {userExam.evaluation_stats.manual_evaluation_needed} need review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Answers Detail */}
          <div className="lg:col-span-2">
            {selectedUserExam ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedUserExam.user.full_name}&apos;s Answers
                      </h2>
                      <p className="text-sm text-gray-600">{selectedUserExam.user.mobile}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedUserExam.total_score}/{exam?.total_marks}
                      </p>
                      <p className="text-sm text-gray-600">Total Score</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {selectedUserExam.user_answers.map((answer) => (
                    <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          Question {answer.question.order_number}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            answer.question.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                            answer.question.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {answer.question.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">{answer.question.marks} marks</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-900 mb-2">{answer.question.question_text}</p>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600 mb-1">Student&apos;s Answer:</p>
                          <p className="text-gray-900">{answer.answer_text || 'No answer provided'}</p>
                        </div>
                      </div>
                      
                      {answer.question.type === 'text' && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Evaluation:</p>
                            {answer.is_correct !== null && (
                              <span className={`inline-flex items-center text-sm ${
                                answer.is_correct ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {answer.is_correct ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                {answer.score_awarded}/{answer.question.marks} marks
                              </span>
                            )}
                          </div>
                          
                          {answer.is_correct === null ? (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => evaluateAnswer(answer.id, true, answer.question.marks)}
                                disabled={evaluating}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Correct ({answer.question.marks} marks)
                              </Button>
                              <Button
                                onClick={() => evaluateAnswer(answer.id, false, 0)}
                                disabled={evaluating}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Incorrect (0 marks)
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <p>Evaluated: {answer.is_correct ? 'Correct' : 'Incorrect'}</p>
                              <p>Score: {answer.score_awarded}/{answer.question.marks}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {(answer.question.type === 'mcq' || answer.question.type === 'truefalse') && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Auto-evaluated</p>
                            <span className={`inline-flex items-center text-sm ${
                              answer.is_correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {answer.is_correct ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                              {answer.score_awarded}/{answer.question.marks} marks
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Correct answer: {answer.question.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
                  <p className="text-gray-600">Choose a user from the list to view their answers and evaluate them.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 