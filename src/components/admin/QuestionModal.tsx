'use client'

import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, HelpCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Question {
  id?: string
  exam_id: string
  question_text: string
  options?: string[]
  correct_answer?: string
  type: 'mcq' | 'truefalse' | 'text'
  marks: number
  order_number?: number
}

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  question?: Question | null
  examId: string
  onSave: (question: Question) => void
  loading?: boolean
}

export default function QuestionModal({ 
  isOpen, 
  onClose, 
  question, 
  examId, 
  onSave, 
  loading = false 
}: QuestionModalProps) {
  const [formData, setFormData] = useState<Question>({
    exam_id: examId,
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    type: 'mcq',
    marks: 1,
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
        exam_id: examId,
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        type: 'mcq',
        marks: 1,
        order_number: 1
      })
    }
    setErrors({})
  }, [question, examId, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    console.log('Validating form data:', formData)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted, validating...')
    console.log('Current form data:', formData)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    console.log('Form validation passed, calling onSave with:', formData)
    onSave(formData)
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

  const handleTypeChange = (type: 'mcq' | 'truefalse' | 'text') => {
    setFormData(prev => ({
      ...prev,
      type,
      correct_answer: '',
      options: type === 'mcq' ? ['', '', '', ''] : []
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder="Enter your question here..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.question_text ? 'border-red-500' : 'border-gray-300'
              }`}
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
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    <Trash2 size={16} />
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{question ? 'Update Question' : 'Add Question'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 