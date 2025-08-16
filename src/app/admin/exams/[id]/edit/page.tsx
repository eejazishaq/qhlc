'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Question {
  id?: string
  question_text: string
  type: 'mcq' | 'truefalse' | 'text'
  options?: string[]
  correct_answer: string
  marks: number
  order_number: number
}

export default function EditExamPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingExam, setLoadingExam] = useState(true)
  
  // Exam details
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 60,
    total_marks: 100,
    passing_marks: 50,
    exam_type: 'mock',
    status: 'draft',
    start_date: '',
    end_date: '',
    shuffle_questions: false
  })

  // Questions
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
    order_number: 1
  })

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
      fetchExam()
    }
  }, [user, profile, params.id])

  const fetchExam = async () => {
    try {
      setLoadingExam(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/exams/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const exam = data.exam
        
        setExamData({
          title: exam.title,
          description: exam.description || '',
          duration: exam.duration,
          total_marks: exam.total_marks,
          passing_marks: exam.passing_marks,
          exam_type: exam.exam_type,
          status: exam.status,
          start_date: exam.start_date.split('T')[0],
          end_date: exam.end_date.split('T')[0],
          shuffle_questions: exam.shuffle_questions || false
        })
        
        setQuestions(exam.questions || [])
      } else {
        console.error('Failed to fetch exam')
        router.push('/admin/exams')
      }
    } catch (error) {
      console.error('Error fetching exam:', error)
      router.push('/admin/exams')
    } finally {
      setLoadingExam(false)
    }
  }

  const handleExamDataChange = (field: string, value: any) => {
    setExamData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])]
    newOptions[index] = value
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }))
  }

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Please enter a question text')
      return
    }

    if (currentQuestion.type === 'mcq' && (!currentQuestion.options || currentQuestion.options.some(opt => !opt.trim()))) {
      alert('Please fill all MCQ options')
      return
    }

    // Only require correct answer for MCQ and True/False questions
    if (currentQuestion.type !== 'text' && !currentQuestion.correct_answer.trim()) {
      alert('Please enter a correct answer')
      return
    }

    const newQuestion: Question = {
      ...currentQuestion,
      order_number: questions.length + 1
    }

    setQuestions(prev => [...prev, newQuestion])
    
    // Reset current question
    setCurrentQuestion({
      question_text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
      order_number: questions.length + 2
    })
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => {
      const newQuestions = prev.filter((_, i) => i !== index)
      // Update order numbers
      return newQuestions.map((q, i) => ({ ...q, order_number: i + 1 }))
    })
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    setQuestions(prev => {
      const newQuestions = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      // Swap questions using temporary variable
      const temp = newQuestions[index]
      newQuestions[index] = newQuestions[targetIndex]
      newQuestions[targetIndex] = temp
      
      // Update order numbers
      return newQuestions.map((q, i) => ({ ...q, order_number: i + 1 }))
    })
  }

  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0)
  }

  const saveExam = async () => {
    try {
      setSaving(true)

      // Validate exam data
      if (!examData.title.trim()) {
        alert('Please enter an exam title')
        return
      }

      if (!examData.start_date || !examData.end_date) {
        alert('Please select start and end dates')
        return
      }

      if (new Date(examData.start_date) >= new Date(examData.end_date)) {
        alert('End date must be after start date')
        return
      }

      if (questions.length === 0) {
        alert('Please add at least one question')
        return
      }

      const totalMarks = calculateTotalMarks()
      if (totalMarks !== examData.total_marks) {
        if (!confirm(`Total marks from questions (${totalMarks}) doesn't match exam total marks (${examData.total_marks}). Update exam total marks to ${totalMarks}?`)) {
          return
        }
        setExamData(prev => ({ ...prev, total_marks: totalMarks }))
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Update exam
      const examResponse = await fetch(`/api/exams/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...examData,
          total_marks: totalMarks
        })
      })

      if (!examResponse.ok) {
        const errorData = await examResponse.json()
        throw new Error(errorData.error || 'Failed to update exam')
      }

      // Update questions
      for (const question of questions) {
        if (question.id) {
          // Update existing question
          const questionResponse = await fetch(`/api/questions/${question.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              question_text: question.question_text,
              type: question.type,
              options: question.type === 'mcq' ? question.options : null,
              correct_answer: question.correct_answer,
              marks: question.marks,
              order_number: question.order_number
            })
          })

          if (!questionResponse.ok) {
            throw new Error('Failed to update question')
          }
        } else {
          // Create new question
          const questionResponse = await fetch('/api/questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              exam_id: params.id,
              question_text: question.question_text,
              type: question.type,
              options: question.type === 'mcq' ? question.options : null,
              correct_answer: question.correct_answer,
              marks: question.marks,
              order_number: question.order_number
            })
          })

          if (!questionResponse.ok) {
            throw new Error('Failed to create question')
          }
        }
      }

      alert('Exam updated successfully!')
      router.push(`/admin/exams/${params.id}`)

    } catch (error) {
      console.error('Error updating exam:', error)
      alert(error instanceof Error ? error.message : 'Failed to update exam')
    } finally {
      setSaving(false)
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

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <h1 className="text-lg font-semibold text-gray-900">Edit Exam</h1>
                <p className="text-sm text-gray-600">Update exam details and questions</p>
              </div>
            </div>
            
            <Button
              onClick={saveExam}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Exam Details */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={examData.title}
                    onChange={(e) => handleExamDataChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter exam title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={examData.description}
                    onChange={(e) => handleExamDataChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter exam description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Type *
                  </label>
                  <select
                    value={examData.exam_type}
                    onChange={(e) => handleExamDataChange('exam_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="mock">Mock Exam</option>
                    <option value="regular">Regular Exam</option>
                    <option value="final">Final Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={examData.status}
                    onChange={(e) => handleExamDataChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={examData.duration}
                    onChange={(e) => handleExamDataChange('duration', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={examData.total_marks}
                    onChange={(e) => handleExamDataChange('total_marks', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    value={examData.passing_marks}
                    onChange={(e) => handleExamDataChange('passing_marks', parseInt(e.target.value))}
                    min="1"
                    max={examData.total_marks}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={examData.start_date}
                    onChange={(e) => handleExamDataChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={examData.end_date}
                    onChange={(e) => handleExamDataChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shuffle Questions
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={examData.shuffle_questions}
                      onChange={(e) => handleExamDataChange('shuffle_questions', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Shuffle questions order for students
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h2>
                <Button
                  onClick={addQuestion}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {/* Current Question Form */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Add New Question</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      value={currentQuestion.question_text}
                      onChange={(e) => handleQuestionChange('question_text', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your question"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type *
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => handleQuestionChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="truefalse">True/False</option>
                      <option value="text">Text</option>
                    </select>
                  </div>

                  {currentQuestion.type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options *
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 w-6">{String.fromCharCode(65 + index)}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer *
                    </label>
                    {currentQuestion.type === 'truefalse' ? (
                      <select
                        value={currentQuestion.correct_answer}
                        onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select answer</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : currentQuestion.type === 'mcq' ? (
                      <select
                        value={currentQuestion.correct_answer}
                        onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select correct option</option>
                        {currentQuestion.options?.map((option, index) => (
                          <option key={index} value={option}>
                            {String.fromCharCode(65 + index)}. {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={currentQuestion.correct_answer}
                        onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter correct answer (for reference)"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks *
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.marks}
                      onChange={(e) => handleQuestionChange('marks', parseInt(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Existing Questions */}
              {questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Existing Questions</h3>
                  {questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Q{index + 1}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.type === 'mcq' ? 'bg-purple-100 text-purple-800' :
                            question.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {question.type === 'mcq' ? 'MCQ' : question.type === 'truefalse' ? 'True/False' : 'Text'}
                          </span>
                          <span className="text-sm text-gray-500">{question.marks} marks</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === questions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-900 mb-3">{question.question_text}</p>
                      
                      {question.type === 'mcq' && question.options && (
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{String.fromCharCode(65 + optIndex)}.</span>
                              <span className={`text-sm ${
                                option === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-700'
                              }`}>
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'truefalse' && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-green-600">
                            Correct Answer: {question.correct_answer === 'true' ? 'True' : 'False'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 