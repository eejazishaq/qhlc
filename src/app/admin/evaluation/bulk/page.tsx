'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle, FileText, Loader2, X, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

type Exam = {
  id: string
  title: string
  questions?: Question[]
}

type Question = {
  id: string
  question_text: string
  type: 'mcq' | 'truefalse' | 'text'
  marks: number
  order_number: number
}

type Answer = {
  id: string
  answer_text: string
  is_correct: boolean | null
  score_awarded: number | null
  user_exam_id: string
  user: {
    id: string
    full_name: string
    mobile: string | null
    serial_number: string | null
  }
}

export default function BulkEvaluationPage() {
  const { user, profile, loading } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [decisions, setDecisions] = useState<Record<string, boolean>>({})
  const [loadingExams, setLoadingExams] = useState(true)
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId]
  )
  const questions = selectedExam?.questions ?? []
  const selectedCount = Object.keys(decisions).length

  useEffect(() => {
    if (!loading && user && !['admin', 'super_admin'].includes(profile?.user_type ?? '')) {
      window.location.assign('/dashboard/user')
    }
  }, [loading, profile?.user_type, user])

  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(profile?.user_type ?? '')) return

    const loadExams = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('No authentication token available')

        const response = await fetch('/api/exams', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load exams')

        setExams(data.exams ?? [])
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load exams')
      } finally {
        setLoadingExams(false)
      }
    }

    void loadExams()
  }, [profile?.user_type, user])

  useEffect(() => {
    setSelectedQuestionId('')
    setQuestion(null)
    setAnswers([])
    setDecisions({})
    setMessage(null)
  }, [selectedExamId])

  useEffect(() => {
    if (!selectedExamId || !selectedQuestionId) return

    const loadAnswers = async () => {
      try {
        setLoadingAnswers(true)
        setError(null)
        setMessage(null)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('No authentication token available')

        const response = await fetch(
          `/api/admin/evaluations/bulk?exam_id=${encodeURIComponent(selectedExamId)}&question_id=${encodeURIComponent(selectedQuestionId)}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load answers')

        const loadedAnswers = data.answers ?? []
        setQuestion(data.question)
        setAnswers(loadedAnswers)
        setDecisions(
          Object.fromEntries(
            loadedAnswers
              .filter((answer: Answer) => answer.is_correct !== null)
              .map((answer: Answer) => [answer.id, answer.is_correct])
          )
        )
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load answers')
      } finally {
        setLoadingAnswers(false)
      }
    }

    void loadAnswers()
  }, [selectedExamId, selectedQuestionId])

  const setDecision = (answerId: string, isCorrect: boolean) => {
    setDecisions((current) => ({ ...current, [answerId]: isCorrect }))
    setMessage(null)
  }

  const submitEvaluations = async () => {
    if (!selectedExamId || !selectedQuestionId || !question) return

    const evaluations = answers
      .filter((answer) => Object.hasOwn(decisions, answer.id))
      .map((answer) => ({
        user_answer_id: answer.id,
        is_correct: decisions[answer.id],
      }))

    if (evaluations.length === 0) {
      setError('Select Correct or Incorrect for at least one answer before submitting.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No authentication token available')

      const response = await fetch('/api/admin/evaluations/bulk', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_id: selectedExamId,
          question_id: selectedQuestionId,
          evaluations,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save evaluations')

      setAnswers((current) => current.map((answer) => (
        Object.hasOwn(decisions, answer.id)
          ? {
              ...answer,
              is_correct: decisions[answer.id],
              score_awarded: decisions[answer.id] ? question.marks : 0,
            }
          : answer
      )))
      setMessage(data.message ?? 'Evaluations saved successfully.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save evaluations')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingExams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user || !['admin', 'super_admin'].includes(profile?.user_type ?? '')) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Evaluation</h1>
        <p className="text-gray-600 mt-1">
          Select an exam and question, then grade all submitted answers in one submission.
        </p>
      </div>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <select
              id="exam"
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an exam</option>
              {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">Question</label>
            <select
              id="question"
              value={selectedQuestionId}
              onChange={(event) => setSelectedQuestionId(event.target.value)}
              disabled={!selectedExamId}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a question</option>
              {questions.map((item) => (
                <option key={item.id} value={item.id}>
                  Q{item.order_number}: {item.question_text}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}
      {message && <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700">{message}</div>}

      {loadingAnswers && (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading submitted answers...</p>
        </div>
      )}

      {!loadingAnswers && question && (
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Question {question.order_number} · {question.marks} marks</p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1">{question.question_text}</h2>
              </div>
              <Button onClick={submitEvaluations} disabled={saving || selectedCount === 0}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Submit {selectedCount} Evaluation{selectedCount === 1 ? '' : 's'}
              </Button>
            </div>
          </div>

          {answers.length === 0 ? (
            <div className="p-10 text-center text-gray-600">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              No submitted answers exist for this question.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {answers.map((answer) => {
                const hasDecision = Object.hasOwn(decisions, answer.id)
                const decision = decisions[answer.id]
                const isCorrect = hasDecision && decision === true
                const isIncorrect = hasDecision && decision === false

                return (
                  <div
                    key={answer.id}
                    className={`p-5 ${
                      isCorrect ? 'bg-green-50' : isIncorrect ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{answer.user.full_name}</p>
                          {isCorrect && (
                            <span className="inline-flex items-center rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Selected: Correct ({question.marks} marks)
                            </span>
                          )}
                          {isIncorrect && (
                            <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Selected: Incorrect (0 marks)
                            </span>
                          )}
                          {!hasDecision && (
                            <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                              Not selected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {answer.user.serial_number || 'No registration number'} · {answer.user.mobile || 'No mobile'}
                        </p>
                        <p className="mt-3 text-sm text-gray-500">Student answer</p>
                        <p className="mt-1 p-3 rounded border border-gray-200 bg-white text-gray-900 whitespace-pre-wrap">
                          {answer.answer_text || 'No answer provided'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mark as</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDecision(answer.id, true)}
                            aria-pressed={isCorrect}
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors ${
                              isCorrect
                                ? 'bg-green-600 border-green-700 text-white ring-2 ring-green-300 ring-offset-1'
                                : 'bg-white border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            Correct
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision(answer.id, false)}
                            aria-pressed={isIncorrect}
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors ${
                              isIncorrect
                                ? 'bg-red-600 border-red-700 text-white ring-2 ring-red-300 ring-offset-1'
                                : 'bg-white border-red-300 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Incorrect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
