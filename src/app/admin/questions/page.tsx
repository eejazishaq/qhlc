'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { HelpCircle, Plus, Search, Edit, Trash2, Eye, FileText, CheckCircle, X, Save, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Exam {
  id: string
  title: string
  description: string
  exam_type: 'mock' | 'regular' | 'final'
  status: 'draft' | 'active' | 'inactive'
}

interface Question {
  id: string
  exam_id: string
  question_text: string
  type: 'mcq' | 'truefalse' | 'text'
  marks: number
  options?: string[]
  correct_answer?: string
  order_number: number
  created_at: string
  updated_at: string
}

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  question?: Question | null
  onSave: (question: Partial<Question>) => Promise<void>
  loading: boolean
  exams: Exam[]
}

function QuestionModal({ isOpen, onClose, question, onSave, loading, exams }: QuestionModalProps) {
  const [formData, setFormData] = useState<Partial<Question>>({
    exam_id: '',
    question_text: '',
    type: 'mcq',
    marks: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    order_number: 1
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (question) {
      setFormData({
        ...question,
        options: question.options || ['', '', '', '']
      })
    } else {
      setFormData({
        exam_id: '',
        question_text: '',
        type: 'mcq',
        marks: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        order_number: 1
      })
    }
    setErrors({})
  }, [question])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    console.log('Validating form data:', formData)

    if (!formData.exam_id?.trim()) {
      newErrors.exam_id = 'Exam is required'
      console.log('Missing exam_id')
    }

    if (!formData.question_text?.trim()) {
      newErrors.question_text = 'Question text is required'
      console.log('Missing question_text')
    }

    if (!formData.marks || formData.marks < 1) {
      newErrors.marks = 'Marks must be at least 1'
      console.log('Invalid marks')
    }

    if (!formData.order_number || formData.order_number < 1) {
      newErrors.order_number = 'Order number must be at least 1'
      console.log('Invalid order_number')
    }

    if (formData.type === 'mcq') {
      if (!formData.options || formData.options.filter(opt => opt.trim()).length < 2) {
        newErrors.options = 'At least 2 options are required for MCQ'
        console.log('Invalid MCQ options')
      }
      if (!formData.correct_answer?.trim()) {
        newErrors.correct_answer = 'Correct answer is required for MCQ'
        console.log('Missing MCQ correct_answer')
      }
    }

    if (formData.type === 'truefalse') {
      if (!formData.correct_answer) {
        newErrors.correct_answer = 'Correct answer is required for True/False'
        console.log('Missing truefalse correct_answer')
      }
    }

    // Text questions don't need correct_answer as they are manually evaluated

    console.log('Validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted, validating...')
    console.log('Current form data:', formData)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    console.log('Form validation passed, calling onSave with:', formData)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving question:', error)
    }
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }))
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam *
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => setFormData(prev => ({ ...prev, exam_id: e.target.value }))}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exam_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.exam_type})
                </option>
              ))}
            </select>
            {errors.exam_id && (
              <p className="text-red-500 text-sm mt-1">{errors.exam_id}</p>
            )}
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.question_text ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Enter your question here..."
            />
            {errors.question_text && (
              <p className="text-red-500 text-sm mt-1">{errors.question_text}</p>
            )}
          </div>

          {/* Question Type and Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as Question['type'],
                  correct_answer: '',
                  options: e.target.value === 'mcq' ? ['', '', '', ''] : []
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="truefalse">True/False</option>
                <option value="text">Text Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number *
              </label>
              <input
                type="number"
                min="1"
                value={formData.order_number}
                onChange={(e) => setFormData(prev => ({ ...prev, order_number: parseInt(e.target.value) || 1 }))}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.order_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.order_number && (
                <p className="text-red-500 text-sm mt-1">{errors.order_number}</p>
              )}
            </div>
          </div>

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marks *
            </label>
            <input
              type="number"
              min="1"
              value={formData.marks}
              onChange={(e) => setFormData(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.marks ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.marks && (
              <p className="text-red-500 text-sm mt-1">{errors.marks}</p>
            )}
          </div>

          {/* MCQ Options */}
          {formData.type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              {formData.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className={`flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.options ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                    disabled={formData.options?.length === 2}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Option
              </button>
              {errors.options && (
                <p className="text-red-500 text-sm mt-1">{errors.options}</p>
              )}
            </div>
          )}

          {/* True/False Options */}
          {formData.type === 'truefalse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <select
                value={formData.correct_answer}
                onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select correct answer</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
              {errors.correct_answer && (
                <p className="text-red-500 text-sm mt-1">{errors.correct_answer}</p>
              )}
            </div>
          )}

          {/* MCQ Correct Answer */}
          {formData.type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <select
                value={formData.correct_answer}
                onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.correct_answer ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select correct answer</option>
                {formData.options?.map((option, index) => (
                  option.trim() && (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  )
                ))}
              </select>
              {errors.correct_answer && (
                <p className="text-red-500 text-sm mt-1">{errors.correct_answer}</p>
              )}
            </div>
          )}

          {/* Text Question Note */}
          {formData.type === 'text' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Text Question
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Text questions are manually evaluated by administrators. No correct answer is required.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {question ? 'Update Question' : 'Create Question'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminQuestionsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [loadingExams, setLoadingExams] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterExam, setFilterExam] = useState('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

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
      fetchExams()
      fetchQuestions()
    }
  }, [user, profile])

  const fetchExams = async () => {
    try {
      setLoadingExams(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      } else {
        console.error('Failed to fetch exams')
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoadingExams(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/questions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        console.error('Failed to fetch questions')
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleSaveQuestion = async (questionData: Partial<Question>) => {
    try {
      setModalLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const url = selectedQuestion 
        ? `/api/questions/${selectedQuestion.id}`
        : '/api/questions'
      
      const method = selectedQuestion ? 'PUT' : 'POST'
      
      // Debug: Log the data being sent
      console.log('Sending question data:', questionData)
      console.log('Required fields check:', {
        exam_id: questionData.exam_id,
        question_text: questionData.question_text,
        correct_answer: questionData.correct_answer
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(questionData)
      })

      if (response.ok) {
        await fetchQuestions()
        setIsModalOpen(false)
        setSelectedQuestion(null)
      } else {
        const error = await response.json()
        console.error('API Error Response:', error)
        throw new Error(error.error || error.message || 'Failed to save question')
      }
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Failed to save question. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      setDeleteLoading(questionId)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        await fetchQuestions()
      } else {
        console.error('Failed to delete question')
        alert('Failed to delete question. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question. Please try again.')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setIsModalOpen(true)
  }

  const handleAddQuestion = () => {
    setSelectedQuestion(null)
    setIsModalOpen(true)
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || question.type === filterType
    const matchesExam = filterExam === 'all' || question.exam_id === filterExam
    
    return matchesSearch && matchesType && matchesExam
  })

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'MCQ'
      case 'truefalse': return 'True/False'
      case 'text': return 'Text'
      default: return type
    }
  }

  const getExamTitle = (examId: string) => {
    const exam = exams.find(e => e.id === examId)
    return exam ? exam.title : 'Unknown Exam'
  }

  const getExamType = (examId: string) => {
    const exam = exams.find(e => e.id === examId)
    return exam ? exam.exam_type : 'unknown'
  }

  const mcqCount = questions.filter(q => q.type === 'mcq').length
  const textCount = questions.filter(q => q.type === 'text').length
  const trueFalseCount = questions.filter(q => q.type === 'truefalse').length
  const examCount = [...new Set(questions.map(q => q.exam_id))].length

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">Create and manage exam questions</p>
        </div>
        <button 
          onClick={handleAddQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">MCQ Questions</p>
              <p className="text-2xl font-bold text-gray-900">{mcqCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Text Questions</p>
              <p className="text-2xl font-bold text-gray-900">{textCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exams</p>
              <p className="text-2xl font-bold text-gray-900">{examCount}</p>
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
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="truefalse">True/False</option>
                <option value="text">Text</option>
              </select>
              <select 
                value={filterExam}
                onChange={(e) => setFilterExam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Exams</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Questions ({filteredQuestions.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingQuestions ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No questions found</p>
                    <p className="text-sm">Create your first question to get started</p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {question.question_text}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getExamTitle(question.exam_id)}</p>
                        <p className="text-xs text-gray-500 capitalize">{getExamType(question.exam_id)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{question.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{question.marks}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit question"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteLoading === question.id}
                          className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                          title="Delete question"
                        >
                          {deleteLoading === question.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bulk Import</h3>
              <p className="text-gray-600">Import questions from CSV</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Question Preview</h3>
              <p className="text-gray-600">Preview questions in exam format</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exam Management</h3>
              <p className="text-gray-600">Manage exams and schedules</p>
            </div>
            <HelpCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
        }}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
        loading={modalLoading}
        exams={exams}
      />
    </div>
  )
} 