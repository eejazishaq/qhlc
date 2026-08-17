'use client'

import { useState, useEffect, useRef } from 'react'
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
  Flag,
  Eye,
  EyeOff,
  Check,
  X,
  FileText,
  User,
  Calendar,
  Timer,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
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
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'published'
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
    shuffle_questions: boolean
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
  const [loadingExam, setLoadingExam] = useState(true)
  const [saving, setSaving] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const [warningShown, setWarningShown] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const lastSavedRef = useRef<Record<string, string>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<Record<string, boolean>>({})
  const [savingAnswer, setSavingAnswer] = useState(false)

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

  /** Same order every time for this attempt (so resume does not reshuffle questions). */
  const orderQuestionsForUser = (list: Question[], userExamId: string, shuffle: boolean) => {
    if (!list.length) return list
    const copy = [...list]
    if (!shuffle) {
      return copy.sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
    }
    let seed = 0
    for (let i = 0; i < userExamId.length; i++) seed = (Math.imul(31, seed) + userExamId.charCodeAt(i)) | 0
    const hash = (qId: string) => {
      let h = seed
      for (let i = 0; i < qId.length; i++) h = (Math.imul(31, h) + qId.charCodeAt(i)) | 0
      return h
    }
    return copy.sort((a, b) => hash(a.id) - hash(b.id))
  }

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

      if (['completed', 'evaluated', 'published'].includes(userExamData.status)) {
        router.push(`/dashboard/user/exams/${userExamData.id}/results`)
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
      let fetchedQuestions = questionsData.questions || []
      fetchedQuestions = orderQuestionsForUser(
        fetchedQuestions,
        userExamData.id,
        !!userExamData.exam.shuffle_questions
      )
      setQuestions(fetchedQuestions)

      // Load existing answers (skip server re-grading while exam is in progress)
      const answersRes = await fetch(
        `/api/user-answers?user_exam_id=${id}&skip_grading=true`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      )
      if (answersRes.ok) {
        const data = await answersRes.json()
        const existingAnswers: Record<string, string> = {}
        ;(data.user_answers || []).forEach((answer: { question_id: string; answer_text: string | null }) => {
          if (answer.answer_text != null && String(answer.answer_text).trim() !== '') {
            existingAnswers[answer.question_id] = String(answer.answer_text)
          }
        })
        lastSavedRef.current = { ...existingAnswers }
        setAnswers(existingAnswers)
      } else {
        const errText = await answersRes.text().catch(() => '')
        console.error(
          'Failed to load saved answers:',
          answersRes.status,
          errText || answersRes.statusText
        )
      }

    } catch (error) {
      console.error('Error fetching exam data:', error)
      alert('Failed to load exam. Please try again.')
      router.push('/dashboard/user/exams')
    } finally {
      setLoadingExam(false)
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

  const persistToServer = async (questionId: string, rawValue: string) => {
    const trimmed = (rawValue ?? '').trim()
    const prev = lastSavedRef.current[questionId] ?? ''
    if (trimmed === prev) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const response = await fetch('/api/user-answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        user_exam_id: id,
        question_id: questionId,
        answer: trimmed
      })
    })

    if (!response.ok) {
      console.error('Failed to persist answer')
      return
    }

    if (trimmed === '') {
      delete lastSavedRef.current[questionId]
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    } else {
      lastSavedRef.current[questionId] = trimmed
      setAnswers((prev) => ({ ...prev, [questionId]: trimmed }))
    }
  }

  const scheduleDebouncedSave = (questionId: string, value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      void persistToServer(questionId, value)
    }, 450)
  }

  const saveCurrentIfDirty = async () => {
    const q = questions[currentQuestionIndex]
    if (!q) return
    const current = (answers[q.id] ?? '').trim()
    const last = (lastSavedRef.current[q.id] ?? '').trim()
    if (current === last) return
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    await persistToServer(q.id, answers[q.id] ?? '')
  }

  const goToNextQuestion = async () => {
    await saveCurrentIfDirty()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPreviousQuestion = async () => {
    await saveCurrentIfDirty()
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToQuestion = async (index: number) => {
    await saveCurrentIfDirty()
    setCurrentQuestionIndex(index)
  }

  const saveAllDirtyAnswers = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    for (const q of questions) {
      const current = (answers[q.id] ?? '').trim()
      const last = (lastSavedRef.current[q.id] ?? '').trim()
      if (current !== last) {
        await persistToServer(q.id, answers[q.id] ?? '')
      }
    }
  }

  const handleAutoSubmit = async () => {
    alert('⏰ Time is up! Your exam will be submitted automatically.')
    await submitExam()
  }

  const submitExam = async () => {
    try {
      setSaving(true)
      
      await saveAllDirtyAnswers()
      
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
      
      // Show success message and redirect to main exams page
      alert('✅ Exam submitted successfully!\n\nYour exam has been submitted and is now being evaluated by instructors. Results will be available on the main exams page once they are published.\n\nYou will be redirected to the exams page.')
      router.push('/dashboard/user/exams')
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

  const hasAnswerFor = (questionId: string) => {
    return (answers[questionId] ?? '').trim().length > 0
  }

  const getAnsweredQuestions = () => {
    return questions.filter((q) => hasAnswerFor(q.id)).length
  }

  const getProgressPercentage = () => {
    return questions.length > 0 ? (getAnsweredQuestions() / questions.length) * 100 : 0
  }

  useEffect(() => {
    const q = questions[currentQuestionIndex]
    if (!q) return
    setVisitedQuestionIds((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: true }))
  }, [currentQuestionIndex, questions])

  const handleExit = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = async () => {
    await saveAllDirtyAnswers()
    await updateExamStatus('pending')
    setShowExitConfirm(false)
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

  const name = profile?.full_name?.trim()
  const serial = profile?.serial_number?.trim()
  const studentDisplayName =
    name && serial ? `${name} (${serial})` : name || serial || ''

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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-2 sm:mr-3" />
              <h3 className="text-base sm:text-lg font-semibold">Exam Instructions</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4 text-sm">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Important Instructions:</h4>
                <ul className="space-y-1 sm:space-y-2 text-blue-800 text-xs sm:text-sm">
                  <li>• You can navigate between questions freely — choices save when you pick them; text saves after you pause typing or when you leave the question</li>
                  <li>• You can change your answers at any time during the exam</li>
                  <li>• Text questions require manual evaluation by instructors</li>
                  <li>• Answers save when you change them (text fields debounce briefly)</li>
                  <li>• The exam will auto-submit when time expires</li>
                  <li>• Do not refresh the page or close the browser during the exam</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Warning:</h4>
                <p className="text-yellow-800 text-xs sm:text-sm">
                  Any attempt to cheat, copy, or use unauthorized materials will result in immediate disqualification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600">
                <div>
                  <p><strong>Exam:</strong> {userExam.exam.title}</p>
                  <p><strong>Duration:</strong> {userExam.exam.duration} minutes</p>
                  <p><strong>Total Marks:</strong> {userExam.exam.total_marks}</p>
                </div>
                <div>
                  <p><strong>Student:</strong> {studentDisplayName || '—'}</p>
                  <p><strong>Started:</strong> {new Date(userExam.started_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 sm:mt-6">
              <Button
                onClick={() => setShowInstructions(false)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 space-y-3 sm:space-y-0">
            {/* Left Section */}
            <div className="flex items-center justify-between sm:justify-start space-x-3 sm:space-x-4">
              <Button
                onClick={handleExit}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exit Exam</span>
                <span className="sm:hidden">Exit</span>
              </Button>
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{userExam.exam.title}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Q{currentQuestionIndex + 1} of {questions.length}</p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
              {/* Mobile Progress */}
              <div className="sm:hidden">
                <div className="flex items-center space-x-1">
                  <Logo width={12} height={12} className="w-3 h-3" />
                  <span className="text-xs text-gray-600">
                    {getAnsweredQuestions()}/{questions.length}
                  </span>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-green-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(getAnsweredQuestions() / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Student Info - Desktop */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 min-w-0 max-w-[14rem] lg:max-w-xs">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate" title={studentDisplayName}>
                  {studentDisplayName || '—'}
                </span>
              </div>

              {/* Progress - Desktop */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <Logo width={16} height={16} className="w-4 h-4" />
                  <span className="text-sm text-gray-600">
                    {getAnsweredQuestions()}/{questions.length} answered
                  </span>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(getAnsweredQuestions() / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-mono font-semibold ${
                timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Fullscreen Toggle */}
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                {fullscreenMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              {/* Submit Button */}
              <Button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Submit Exam</span>
                    <span className="sm:hidden">Submit</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Question Navigation - Mobile Bottom Sheet / Desktop Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:sticky lg:top-24">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Question Navigation</h3>
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1 sm:gap-2">
                {questions.map((question, index) => {
                  const answered = hasAnswerFor(question.id)
                  const visited = !!visitedQuestionIds[question.id]
                  const isCurrent = index === currentQuestionIndex
                  let palette =
                    'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  if (isCurrent) {
                    palette = 'bg-blue-600 text-white border-blue-600'
                  } else if (answered) {
                    palette = 'bg-green-100 text-green-800 border-green-300'
                  } else if (visited) {
                    palette = 'bg-amber-100 text-amber-900 border-amber-300'
                  }
                  const title = answered
                    ? `Question ${index + 1} (answered)`
                    : visited
                      ? `Question ${index + 1} (skipped)`
                      : `Question ${index + 1} (not visited)`
                  return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`p-1 sm:p-2 text-xs font-medium rounded border transition-colors ${palette}`}
                    title={title}
                  >
                    {index + 1}
                  </button>
                  )
                })}
              </div>
              
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold">{getAnsweredQuestions()}/{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-semibold">{Math.round(getProgressPercentage())}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6">
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Question {currentQuestion.order_number}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                        currentQuestion.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {currentQuestion.type.toUpperCase()}
                      </span>
                      <span className="flex items-center">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {currentQuestion.marks} marks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-gray-900 text-base sm:text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 sm:space-y-4">
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <div className="space-y-2 sm:space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                            onChange={(e) => {
                              const v = e.target.value
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))
                              void persistToServer(currentQuestion.id, v)
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900 text-sm sm:text-base">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'truefalse' && (
                    <div className="space-y-2 sm:space-y-3">
                      {['true', 'false'].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                            onChange={(e) => {
                              const v = e.target.value
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))
                              void persistToServer(currentQuestion.id, v)
                            }}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900 text-sm sm:text-base capitalize">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <div>
                      <textarea
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))
                          scheduleDebouncedSave(currentQuestion.id, v)
                        }}
                        placeholder="Type your answer here..."
                        rows={6}
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        This question requires manual evaluation by an instructor.
                      </p>
                    </div>
                  )}
                </div>

                {/* Question Submit Button */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span>
                        MCQ and true/false save when you pick an option; text saves after you pause typing. Unsaved text is flushed when you move to another question or exit.
                      </span>
                    </div>
                    
                    <Button
                      onClick={async () => {
                        setSavingAnswer(true)
                        try {
                          await saveCurrentIfDirty()
                        } finally {
                          setSavingAnswer(false)
                        }
                      }}
                      disabled={
                        savingAnswer ||
                        (answers[currentQuestion.id] ?? '').trim() ===
                          (lastSavedRef.current[currentQuestion.id] ?? '').trim()
                      }
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {savingAnswer ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                          <span className="text-xs sm:text-sm">Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Save Answer</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <Button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <Button
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Next
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mr-2 sm:mr-3" />
              <h3 className="text-base sm:text-lg font-semibold">Submit Exam</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Are you sure you want to submit your exam? You won't be able to make changes after submission.
            </p>
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Answered Questions:</strong> {getAnsweredQuestions()}/{questions.length}
              </p>
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Total Questions:</strong> {questions.length}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => setShowConfirmSubmit(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={submitExam}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-2 sm:mr-3" />
              <h3 className="text-base sm:text-lg font-semibold">Exit Exam</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Your answers will be saved. You can continue later from the exams page (exam stays in progress).
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmExit}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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