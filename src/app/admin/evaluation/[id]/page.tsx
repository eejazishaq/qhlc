'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Calendar, Award, CheckCircle, XCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface AdminExamResult {
  id: string
  user_exam_id: string
  user: {
    full_name: string
  }
  exam: {
    title: string
    total_marks: number
    passing_marks: number
  }
  status: string
  submitted_at: string
  total_score: number
  answers: AdminAnswer[]
}

interface AdminAnswer {
  id: string
  question_id: string
  question_text: string
  question_type: string
  answer_text: string
  is_correct: boolean | null
  score_awarded: number
  max_score: number
  needs_evaluation: boolean
  correct_answer: string
  options: any[]
}

export default function AdminExamResultPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [examResult, setExamResult] = useState<AdminExamResult | null>(null)
  const [loadingResult, setLoadingResult] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && profile && !['admin', 'super_admin'].includes(profile.user_type)) {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '') && params.id) {
      fetchExamResult()
    }
  }, [user, profile, params.id])

  const fetchExamResult = async () => {
    try {
      setLoadingResult(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/admin/evaluations`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('===Admin Exam Result API Response===', data)
        const result = data.submissions?.find((s: any) => s.id === params.id)
        console.log('===Found Result===', result)
        if (result) {
          console.log('===Result Answers===', result.answers)
          const transformedResult: AdminExamResult = {
            id: result.id,
            user_exam_id: result.user_exam_id,
            user: {
              full_name: result.user?.full_name || 'Unknown User'
            },
            exam: {
              title: result.exam?.title || 'Unknown Exam',
              total_marks: result.exam?.total_marks || 0,
              passing_marks: result.exam?.passing_marks || 0
            },
            status: result.status,
            submitted_at: result.submitted_at,
            total_score: result.total_score || 0,
            answers: result.answers?.map((answer: any) => ({
              id: answer.id,
              question_id: answer.question_id,
              question_text: answer.question_text,
              question_type: answer.question_type,
              answer_text: answer.answer_text,
              is_correct: answer.is_correct,
              score_awarded: answer.score_awarded,
              max_score: answer.max_score,
              needs_evaluation: answer.needs_evaluation,
              correct_answer: answer.correct_answer,
              options: answer.options || []
            })) || []
          }
          console.log('===Transformed Result===', transformedResult)
          console.log('===Transformed Answers===', transformedResult.answers)
          setExamResult(transformedResult)
        } else {
          throw new Error('Exam result not found')
        }
      } else {
        throw new Error('Failed to fetch exam result')
      }
    } catch (error) {
      console.error('Error fetching exam result:', error)
      alert('Failed to load exam result. Please try again.')
      router.push('/admin/evaluation')
    } finally {
      setLoadingResult(false)
    }
  }

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'mcq': return 'bg-blue-100 text-blue-800'
      case 'truefalse': return 'bg-green-100 text-green-800'
      case 'text': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice'
      case 'truefalse': return 'True/False'
      case 'text': return 'Text Answer'
      default: return type.toUpperCase()
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
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

  if (loadingResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam result...</p>
        </div>
      </div>
    )
  }

  if (!examResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Exam result not found</p>
          <Button
            onClick={() => router.push('/admin/evaluation')}
            className="mt-4"
          >
            Back to Evaluation
          </Button>
        </div>
      </div>
    )
  }

  const totalScore = examResult.answers.reduce((sum, answer) => sum + (answer.score_awarded || 0), 0)
  const percentage = Math.round((totalScore / examResult.exam.total_marks) * 100)
  const isPassed = totalScore >= examResult.exam.passing_marks

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/evaluation')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evaluation
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exam Result</h1>
                <p className="text-gray-600">Detailed view of exam submission</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Student</p>
                  <p className="text-lg font-semibold text-gray-900">{examResult.user.full_name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exam</p>
                  <p className="text-lg font-semibold text-gray-900">{examResult.exam.title}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(examResult.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Score</p>
                  <p className={`text-lg font-semibold ${getScoreColor(totalScore, examResult.exam.total_marks)}`}>
                    {totalScore}/{examResult.exam.total_marks} ({percentage}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Result Status</h3>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isPassed ? 'PASSED' : 'FAILED'}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  examResult.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  examResult.status === 'evaluated' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {examResult.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Passing Score:</span>
                  <span className="ml-2 font-semibold">{examResult.exam.passing_marks} marks</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="ml-2 font-semibold">{examResult.answers.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Submission Time:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(examResult.submitted_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Question Details</h2>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {examResult.answers.map((answer, index) => (
                <div key={answer.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Question {index + 1}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionTypeColor(answer.question_type)}`}>
                        {getQuestionTypeLabel(answer.question_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getScoreColor(answer.score_awarded, answer.max_score)}`}>
                        {answer.score_awarded}/{answer.max_score} marks
                      </div>
                      <div className="flex items-center justify-center mt-1">
                        {answer.is_correct ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{answer.question_text}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Student's Answer:</h4>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-gray-900">{answer.answer_text || 'No answer provided'}</p>
                      </div>
                    </div>

                    {answer.question_type !== 'text' && answer.correct_answer && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <p className="text-gray-900">{answer.correct_answer}</p>
                        </div>
                      </div>
                    )}

                    {answer.question_type === 'text' && (
                      <div className={`p-3 rounded border-l-4 ${
                        answer.needs_evaluation 
                          ? 'bg-yellow-50 border-yellow-400' 
                          : 'bg-green-50 border-green-400'
                      }`}>
                        <p className={`text-sm ${
                          answer.needs_evaluation ? 'text-yellow-800' : 'text-green-800'
                        }`}>
                          <>
                            {answer.needs_evaluation ? (
                              <><strong>Note:</strong> This question requires manual evaluation by an instructor.</>
                            ) : (
                              <><strong>Evaluation Complete:</strong> This question has been manually evaluated. </>
                            )}
                          </>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>


        
      </div>
    </div>
  )
}