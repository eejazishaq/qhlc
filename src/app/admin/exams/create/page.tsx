'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react'
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

export default function CreateExamPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  
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
    end_date: ''
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

      // Create exam
      const examResponse = await fetch('/api/exams', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create exam')
      }

      const examResponseData = await examResponse.json()
      const examId = examResponseData.exam.id

      // Create questions
      for (const question of questions) {
        const questionResponse = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            exam_id: examId,
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

      alert('Exam created successfully!')
      router.push('/admin/exams')

    } catch (error) {
      console.error('Error creating exam:', error)
      alert(error instanceof Error ? error.message : 'Failed to create exam')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/exams')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exams
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create New Exam</h1>
                <p className="text-sm text-gray-600">Set up exam details and questions</p>
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
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Create Exam
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

                <div className="grid grid-cols-2 gap-4">
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
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={examData.total_marks}
                      onChange={(e) => handleExamDataChange('total_marks', parseInt(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Questions total: {calculateTotalMarks()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Marks
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
                    Status
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
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
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
                    type="datetime-local"
                    value={examData.end_date}
                    onChange={(e) => handleExamDataChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Add Question Form */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Question</h3>
                
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

                  <div className="grid grid-cols-2 gap-4">
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
                        <option value="text">Text Answer</option>
                      </select>
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

                  {currentQuestion.type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options *
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="correct_answer"
                              value={option}
                              checked={currentQuestion.correct_answer === option}
                              onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'truefalse' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <div className="space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="correct_answer"
                            value="true"
                            checked={currentQuestion.correct_answer === 'true'}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2">True</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="correct_answer"
                            value="false"
                            checked={currentQuestion.correct_answer === 'false'}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2">False</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Answer (for reference)
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.correct_answer}
                        onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a sample correct answer"
                      />
                    </div>
                  )}

                  <Button
                    onClick={addQuestion}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Questions ({questions.length})
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {questions.map((question, index) => (
                      <div key={index} className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Q{question.order_number}.
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                question.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                                question.type === 'truefalse' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {question.type.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {question.marks} mark{question.marks > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-gray-900">{question.question_text}</p>
                            
                            {question.type === 'mcq' && question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      option === question.correct_answer ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>
                                    <span className={`text-sm ${
                                      option === question.correct_answer ? 'text-green-700 font-medium' : 'text-gray-600'
                                    }`}>
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.type === 'truefalse' && (
                              <div className="mt-2">
                                <span className="text-sm text-green-700 font-medium">
                                  Correct Answer: {question.correct_answer}
                                </span>
                              </div>
                            )}

                            {question.type === 'text' && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">
                                  Sample Answer: {question.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <Button
                              onClick={() => moveQuestion(index, 'up')}
                              disabled={index === 0}
                              size="sm"
                              variant="outline"
                            >
                              ↑
                            </Button>
                            <Button
                              onClick={() => moveQuestion(index, 'down')}
                              disabled={index === questions.length - 1}
                              size="sm"
                              variant="outline"
                            >
                              ↓
                            </Button>
                            <Button
                              onClick={() => removeQuestion(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 