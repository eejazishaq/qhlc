'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { FileText, Clock, Users, Calendar, Plus, Search, Edit, Trash2, Eye, Play, Pause } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Exam {
  id: string
  title: string
  description: string
  exam_type: string
  status: string
  duration: number
  total_marks: number
  passing_marks: number
  start_date: string
  end_date: string
  created_at: string
  created_by: {
    full_name: string
  }
  questions: any[]
  user_exams: any[]
}

export default function AdminExamsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const handleCreateExam = () => {
    router.push('/admin/exams/create')
  }

  const handleEditExam = (examId: string) => {
    router.push(`/admin/exams/${examId}/edit`)
  }

  const handleViewExam = (examId: string) => {
    router.push(`/admin/exams/${examId}`)
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        alert('Exam deleted successfully')
        fetchExams() // Refresh the list
      } else {
        throw new Error('Failed to delete exam')
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Failed to delete exam. Please try again.')
    }
  }

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || exam.exam_type === typeFilter
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: exams.length,
    active: exams.filter(e => e.status === 'active').length,
    participants: exams.reduce((sum, exam) => sum + (exam.user_exams?.length || 0), 0),
    avgDuration: exams.length > 0 ? Math.round(exams.reduce((sum, exam) => sum + exam.duration, 0) / exams.length) : 0
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600">Create and manage exams for students</p>
        </div>
        <Button
          onClick={handleCreateExam}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 lg:p-3 rounded-full">
              <Play className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 lg:p-3 rounded-full">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.participants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 lg:p-3 rounded-full">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Avg. Duration</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.avgDuration} min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="mock">Mock</option>
                <option value="regular">Regular</option>
                <option value="final">Final</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Exams List - Mobile Cards / Desktop Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Exams</h3>
        </div>
        
        {loadingExams ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No exams found</p>
            <p className="text-sm">Create your first exam to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              <div className="p-4 space-y-4">
                {filteredExams.map((exam) => (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{exam.title}</h4>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{exam.description}</p>
                        <div className="text-xs text-gray-400">
                          Created by {exam.created_by?.full_name || 'Unknown'} on {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exam.exam_type === 'mock' ? 'bg-blue-100 text-blue-800' :
                        exam.exam_type === 'regular' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {exam.exam_type.toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exam.status === 'active' ? 'bg-green-100 text-green-800' :
                        exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exam.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>Duration: {exam.duration} min</span>
                      <span>Participants: {exam.user_exams?.length || 0}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewExam(exam.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleEditExam(exam.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteExam(exam.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                          <div className="text-sm text-gray-500">{exam.description}</div>
                          <div className="text-xs text-gray-400">
                            Created by {exam.created_by?.full_name || 'Unknown'} on {new Date(exam.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          exam.exam_type === 'mock' ? 'bg-blue-100 text-blue-800' :
                          exam.exam_type === 'regular' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {exam.exam_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          exam.status === 'active' ? 'bg-green-100 text-green-800' :
                          exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exam.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exam.user_exams?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleViewExam(exam.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleEditExam(exam.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteExam(exam.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Question Bank</h3>
              <p className="text-sm lg:text-base text-gray-600">Manage exam questions</p>
            </div>
            <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Exam Schedule</h3>
              <p className="text-sm lg:text-base text-gray-600">Schedule upcoming exams</p>
            </div>
            <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Results</h3>
              <p className="text-sm lg:text-base text-gray-600">View exam results</p>
            </div>
            <Eye className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
} 