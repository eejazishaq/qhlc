'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Star,
  Award,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface UserExam {
  id: string
  exam_id: string
  status: 'pending' | 'completed' | 'evaluated' | 'published'
  started_at: string
  submitted_at?: string
  total_score: number
  evaluator_id?: string
  remarks?: string
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

interface UserAnswer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean | null
  score_awarded: number
  question: {
    id: string
    question_text: string
    type: 'mcq' | 'truefalse' | 'text'
    options?: string[]
    correct_answer: string
    marks: number
  }
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userExam, setUserExam] = useState<UserExam | null>(null)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [showDetailedResults, setShowDetailedResults] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) {
      fetchResults()
    }
  }, [user, id])

  const fetchResults = async () => {
    try {
      setLoadingResults(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Fetch user exam data
      const examResponse = await fetch(`/api/user-exams/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!examResponse.ok) {
        throw new Error('Failed to fetch exam data')
      }

      const examData = await examResponse.json()
      setUserExam(examData.userExam)

      // Fetch user answers
      const answersResponse = await fetch(`/api/user-answers?user_exam_id=${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (answersResponse.ok) {
        const answersData = await answersResponse.json()
        setUserAnswers(answersData.user_answers || [])
      }

    } catch (error) {
      console.error('Error fetching results:', error)
      alert('Failed to load results. Please try again.')
      router.push('/dashboard/user/exams')
    } finally {
      setLoadingResults(false)
    }
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

  if (loadingResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!userExam || !userAnswers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Results not found</p>
          <Button
            onClick={() => router.push('/dashboard/user/exams')}
            className="mt-4"
          >
            Back to Exams
          </Button>
        </div>
      </div>
    )
  }

  // Check if results are published
  if (!userExam.exam.results_published && userExam.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Results Not Yet Available</h3>
          <p className="text-gray-600 mb-4">
            Your exam has been submitted successfully. Results will be available after evaluation and publication by the instructor.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {userExam.status === 'completed' ? 'Submitted' : userExam.status}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Submitted:</strong> {new Date(userExam.submitted_at || '').toLocaleDateString()}
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/user/exams')}
            className="mt-4"
          >
            Back to Exams
          </Button>
        </div>
      </div>
    )
  }

  const totalQuestions = userAnswers.length
  const correctAnswers = userAnswers.filter(a => a.is_correct === true).length
  const incorrectAnswers = userAnswers.filter(a => a.is_correct === false).length
  const pendingEvaluation = userAnswers.filter(a => a.is_correct === null).length
  const totalScore = userAnswers.reduce((sum, a) => sum + (a.score_awarded || 0), 0)
  const percentage = userExam.exam.total_marks > 0 ? (totalScore / userExam.exam.total_marks) * 100 : 0
  const passed = totalScore >= userExam.exam.passing_marks

  const startTime = new Date(userExam.started_at)
  const submitTime = userExam.submitted_at ? new Date(userExam.submitted_at) : new Date()
  const timeTaken = (submitTime.getTime() - startTime.getTime()) / 1000 / 60 // minutes

  const getStatusIcon = () => {
    if (userExam.status === 'published') {
      return <CheckCircle className="w-6 h-6 text-green-600" />
    } else if (userExam.status === 'evaluated') {
      return <CheckCircle className="w-6 h-6 text-blue-600" />
    } else if (userExam.status === 'completed') {
      return <Clock className="w-6 h-6 text-yellow-600" />
    } else {
      return <AlertTriangle className="w-6 h-6 text-red-600" />
    }
  }

  const getStatusText = () => {
    if (userExam.status === 'published') {
      return 'Results Published'
    } else if (userExam.status === 'evaluated') {
      return 'Evaluated (Not Published)'
    } else if (userExam.status === 'completed') {
      return pendingEvaluation > 0 ? 'Pending Manual Evaluation' : 'Auto-Graded'
    } else {
      return 'In Progress'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard/user/exams')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Exam Results</h1>
                <p className="text-sm text-gray-600">{userExam.exam.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Exam Status</h2>
                  <p className="text-sm text-gray-600">{getStatusText()}</p>
                </div>
              </div>
              
              {userExam.status === 'evaluated' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(percentage)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {totalScore}/{userExam.exam.total_marks} marks
                  </div>
                </div>
              )}
            </div>

            {pendingEvaluation > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Manual Evaluation Required
                    </p>
                    <p className="text-sm text-yellow-700">
                      {pendingEvaluation} text question{pendingEvaluation > 1 ? 's' : ''} require{''} manual evaluation by an instructor. 
                      Your final score will be updated once evaluation is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalScore}/{userExam.exam.total_marks}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round(percentage)}% achieved
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-gray-900">{correctAnswers}</p>
                <p className="text-sm text-gray-500">
                  out of {totalQuestions} questions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Taken</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(timeTaken)}m
                </p>
                <p className="text-sm text-gray-500">
                  out of {userExam.exam.duration}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pass/Fail Status */}
        {userExam.status === 'evaluated' && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <div className="flex items-center justify-center">
                {passed ? (
                  <div className="text-center">
                    <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                      <Award className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Congratulations!</h3>
                    <p className="text-green-700">You have passed the exam with {Math.round(percentage)}%</p>
                    <p className="text-sm text-green-600 mt-1">
                      Passing mark: {userExam.exam.passing_marks}/{userExam.exam.total_marks}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-red-800 mb-2">Not Passed</h3>
                    <p className="text-red-700">You scored {Math.round(percentage)}% but needed {Math.round((userExam.exam.passing_marks / userExam.exam.total_marks) * 100)}% to pass</p>
                    <p className="text-sm text-red-600 mt-1">
                      Passing mark: {userExam.exam.passing_marks}/{userExam.exam.total_marks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Toggle */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Question Details</h3>
                <p className="text-sm text-gray-600">
                  View your answers and scores for each question
                </p>
              </div>
              <Button
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showDetailedResults ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        {showDetailedResults && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Question-by-Question Results</h3>
              
              <div className="space-y-6">
                {userAnswers.map((answer, index) => (
                  <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Question {index + 1} ({answer.question.marks} marks)
                        </h4>
                        <p className="text-gray-700 mb-3">{answer.question.question_text}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          answer.question.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                          answer.question.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {answer.question.type.toUpperCase()}
                        </span>
                        {answer.is_correct === true && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {answer.is_correct === false && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        {answer.is_correct === null && (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Your Answer:</span>
                        <p className="text-gray-900 mt-1">{answer.answer_text || 'No answer provided'}</p>
                      </div>

                      {answer.question.type === 'mcq' && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Correct Answer:</span>
                          <p className="text-green-700 mt-1">{answer.question.correct_answer}</p>
                        </div>
                      )}

                      {answer.question.type === 'text' && answer.is_correct === null && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⏳ This question requires manual evaluation by an instructor.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Score: {answer.score_awarded || 0}/{answer.question.marks}
                        </div>
                        {answer.is_correct !== null && (
                          <div className={`text-sm font-medium ${
                            answer.is_correct ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exam Information */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam Title:</span>
                  <span className="font-medium">{userExam.exam.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam Type:</span>
                  <span className="font-medium">{userExam.exam.exam_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{userExam.exam.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="font-medium">{startTime.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{userExam.exam.total_marks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passing Marks:</span>
                  <span className="font-medium">{userExam.exam.passing_marks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">{submitTime.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 