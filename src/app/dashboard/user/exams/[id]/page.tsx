'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  AlertTriangle,
  BookOpen,
  Flag,
  Eye,
  EyeOff,
  Check,
  X,
  FileText,
  User,
  Calendar,
  Timer
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Question {
  id: string
  question_text: string
  type: 'mcq' | 'truefalse' | 'text'
  options?: string[]
  marks: number
  order_number: number
}

interface UserExam {
  id: string
  exam_id: string
  status: 'pending' | 'completed' | 'evaluated'
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
  }
}

interface UserAnswer {
  question_id: string
  answer: string
  is_correct?: boolean
  marks_obtained?: number
  submitted?: boolean
}

export default function ExamTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userExam, setUserExam] = useState<UserExam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({})
  const [loadingExam, setLoadingExam] = useState(true)
  const [saving, setSaving] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const [warningShown, setWarningShown] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null)

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
      fetchExamData()
    }
  }, [user, id])

  useEffect(() => {
    if (userExam) {
      const endTime = new Date(userExam.started_at).getTime() + (userExam.exam.duration * 60 * 1000)
      const now = new Date().getTime()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeLeft(remaining)

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [userExam])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (userExam && Object.keys(answers).length > 0) {
      const interval = setInterval(() => {
        saveAllAnswers()
      }, 30000) // 30 seconds

      setAutoSaveInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [userExam, answers])

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('click', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [])

  // Warning when time is running low
  useEffect(() => {
    if (timeLeft <= 300 && timeLeft > 0 && !warningShown) { // 5 minutes
      setWarningShown(true)
      alert('⚠️ Warning: You have less than 5 minutes remaining! Please submit your exam soon.')
    }
  }, [timeLeft, warningShown])

  const fetchExamData = async () => {
    try {
      setLoadingExam(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Fetch user exam data using the correct endpoint
      const examResponse = await fetch(`/api/user-exams/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!examResponse.ok) {
        throw new Error('Failed to fetch exam data')
      }

      const examData = await examResponse.json()
      const userExamData = examData.userExam

      if (!userExamData) {
        router.push('/dashboard/user/exams')
        return
      }

      setUserExam(userExamData)

      // Fetch questions
      const questionsResponse = await fetch(`/api/questions?exam_id=${userExamData.exam_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions')
      }

      const questionsData = await questionsResponse.json()
      setQuestions(questionsData.questions || [])

      // Load existing answers
      await loadExistingAnswers()

    } catch (error) {
      console.error('Error fetching exam data:', error)
      alert('Failed to load exam. Please try again.')
      router.push('/dashboard/user/exams')
    } finally {
      setLoadingExam(false)
    }
  }

  const loadExistingAnswers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return
      }

      const response = await fetch(`/api/user-answers?user_exam_id=${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const existingAnswers: Record<string, string> = {}
        const submittedAnswersMap: Record<string, boolean> = {}
        
        data.user_answers.forEach((answer: any) => {
          existingAnswers[answer.question_id] = answer.answer_text
          submittedAnswersMap[answer.question_id] = true // If answer exists, it's submitted
        })
        
        setAnswers(existingAnswers)
        setSubmittedAnswers(submittedAnswersMap)
      }
    } catch (error) {
      console.error('Error loading existing answers:', error)
    }
  }

  const updateExamStatus = async (status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return
      }

      await fetch(`/api/user-exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status })
      })
    } catch (error) {
      console.error('Error updating exam status:', error)
    }
  }

  const saveAnswer = async (questionId: string, answer: string) => {
    try {
      setAnswers(prev => ({ ...prev, [questionId]: answer }))
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return
      }

      await fetch('/api/user-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_exam_id: id,
          question_id: questionId,
          answer
        })
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const submitQuestion = async (questionId: string) => {
    try {
      const answer = answers[questionId]
      if (!answer || answer.trim() === '') {
        alert('Please provide an answer before submitting this question.')
        return
      }

      setSaving(true)
      
      // Save the answer first
      await saveAnswer(questionId, answer)
      
      // Mark as submitted
      setSubmittedAnswers(prev => ({ ...prev, [questionId]: true }))
      
      // Show success message
      alert('✅ Question submitted successfully!')
      
    } catch (error) {
      console.error('Error submitting question:', error)
      alert('Failed to submit question. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save all answers
  const saveAllAnswers = async () => {
    try {
      const promises = Object.entries(answers).map(([questionId, answer]) => 
        saveAnswer(questionId, answer)
      )
      
      await Promise.all(promises)
      console.log('Auto-saved all answers')
    } catch (error) {
      console.error('Error auto-saving answers:', error)
    }
  }

  const handleAutoSubmit = async () => {
    alert('⏰ Time is up! Your exam will be submitted automatically.')
    await submitExam()
  }

  const submitExam = async () => {
    try {
      setSaving(true)
      
      // First, save all pending answers
      await saveAllAnswers()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Submit exam
      const response = await fetch(`/api/user-exams/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to submit exam')
      }

      const data = await response.json()
      
      // Redirect to results page
      router.push(`/dashboard/user/exams/${id}/results`)
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Failed to submit exam. Please try again.')
    } finally {
      setSaving(false)
      setShowConfirmSubmit(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredQuestions = () => {
    return Object.keys(answers).length
  }

  const getSubmittedQuestions = () => {
    return Object.keys(submittedAnswers).length
  }

  const getProgressPercentage = () => {
    return questions.length > 0 ? (getAnsweredQuestions() / questions.length) * 100 : 0
  }

  const handleExit = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = async () => {
    // Save all answers before exiting
    await saveAllAnswers()
    // Update to completed status when exiting
    await updateExamStatus('completed')
    router.push('/dashboard/user/exams')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreenMode(true)
    } else {
      document.exitFullscreen()
      setFullscreenMode(false)
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

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!userExam || !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Exam not found or no questions available</p>
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

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold">Exam Instructions</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Important Instructions:</h4>
                <ul className="space-y-2 text-blue-800">
                  <li>• Each question has its own submit button - click it when you're satisfied with your answer</li>
                  <li>• You can review and change answers before submitting the entire exam</li>
                  <li>• Text questions require manual evaluation by instructors</li>
                  <li>• Your answers are auto-saved every 30 seconds</li>
                  <li>• The exam will auto-submit when time expires</li>
                  <li>• Do not refresh the page or close the browser during the exam</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Warning:</h4>
                <p className="text-yellow-800">
                  Any attempt to cheat, copy, or use unauthorized materials will result in immediate disqualification.
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <p><strong>Exam:</strong> {userExam.exam.title}</p>
                  <p><strong>Duration:</strong> {userExam.exam.duration} minutes</p>
                  <p><strong>Total Marks:</strong> {userExam.exam.total_marks}</p>
                </div>
                <div>
                  <p><strong>Student:</strong> {profile?.full_name}</p>
                  <p><strong>Started:</strong> {new Date(userExam.started_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setShowInstructions(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                I Understand, Start Exam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleExit}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Exam
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{userExam.exam.title}</h1>
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Student Info */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{profile?.full_name}</span>
              </div>

              {/* Progress */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {getSubmittedQuestions()}/{questions.length} submitted
                  </span>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(getSubmittedQuestions() / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
              </div>

              {/* Fullscreen Toggle */}
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
              >
                {fullscreenMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              {/* Submit Button */}
              <Button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Exam
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigation</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`p-2 text-xs font-medium rounded border transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white border-blue-600'
                        : submittedAnswers[question.id]
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : answers[question.id]
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    title={`Question ${index + 1}${submittedAnswers[question.id] ? ' (Submitted)' : answers[question.id] ? ' (Answered)' : ' (Not answered)'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold">{getAnsweredQuestions()}/{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-semibold text-green-600">{getSubmittedQuestions()}/{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-semibold">{Math.round(getProgressPercentage())}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Question Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Question {currentQuestion.order_number}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                        currentQuestion.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {currentQuestion.type.toUpperCase()}
                      </span>
                      <span>{currentQuestion.marks} marks</span>
                      {submittedAnswers[currentQuestion.id] && (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                </div>

                {/* Answer Options */}
                <div className="space-y-4">
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={answers[currentQuestion.id] === option}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                            className="sr-only"
                            disabled={submittedAnswers[currentQuestion.id]}
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'truefalse' && (
                    <div className="space-y-3">
                      {['true', 'false'].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={answers[currentQuestion.id] === option}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                            className="sr-only"
                            disabled={submittedAnswers[currentQuestion.id]}
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900 capitalize">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <div>
                      <textarea
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        placeholder="Type your answer here..."
                        rows={8}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={submittedAnswers[currentQuestion.id]}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        This question requires manual evaluation by an instructor.
                      </p>
                    </div>
                  )}
                </div>

                {/* Question Submit Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {submittedAnswers[currentQuestion.id] ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Question submitted successfully
                        </span>
                      ) : (
                        <span>Click submit when you're satisfied with your answer</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => submitQuestion(currentQuestion.id)}
                      disabled={saving || submittedAnswers[currentQuestion.id] || !answers[currentQuestion.id]}
                      className={`${
                        submittedAnswers[currentQuestion.id] 
                          ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : submittedAnswers[currentQuestion.id] ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submitted
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Submit Question
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="outline"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold">Submit Exam</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit your exam? You won't be able to make changes after submission.
            </p>
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Submitted Questions:</strong> {getSubmittedQuestions()}/{questions.length}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Answered Questions:</strong> {getAnsweredQuestions()}/{questions.length}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowConfirmSubmit(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={submitExam}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold">Exit Exam</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit the exam? Your progress will be saved, but the exam will be marked as abandoned.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmExit}
                className="bg-red-600 hover:bg-red-700"
              >
                Exit Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 