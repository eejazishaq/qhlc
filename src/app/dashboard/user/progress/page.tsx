'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { TrendingUp, Calendar, User, Plus, Edit, Eye } from 'lucide-react'
import { Logo } from '@/components/Logo'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Student {
  id: string
  full_name: string
  serial_number: string
}

interface Progress {
  id: string
  user_id: string
  surah_number: number
  ayah_start: number
  ayah_end: number
  status: 'memorized' | 'reviewing' | 'learning'
  notes?: string
  updated_at: string
  updated_by: string
  profiles?: {
    full_name: string
    serial_number: string
  }
}

export default function ProgressPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [progressRecords, setProgressRecords] = useState<Progress[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(true)
  
  // UI states
  const [showAddProgressModal, setShowAddProgressModal] = useState(false)
  const [showEditProgressModal, setShowEditProgressModal] = useState(false)
  const [selectedProgress, setSelectedProgress] = useState<Progress | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Form states
  const [progressForm, setProgressForm] = useState({
    studentId: '',
    surah_number: '',
    ayah_start: '',
    ayah_end: '',
    status: 'learning' as 'memorized' | 'reviewing' | 'learning',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && profile && profile.user_type !== 'coordinator') {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.user_type === 'coordinator') {
      fetchStudents()
      fetchProgressRecords()
    }
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, serial_number')
        .eq('center_id', profile?.center_id)
        .eq('user_type', 'user')
        .eq('is_active', true)
        .order('full_name')

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchProgressRecords = async () => {
    try {
      setLoadingProgress(true)
      
      const { data, error } = await supabase
        .from('progress')
        .select(`
          *,
          profiles:user_id(full_name, serial_number)
        `)
        .in('user_id', students.map(s => s.id))
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching progress records:', error)
        return
      }

      setProgressRecords(data || [])
    } catch (error) {
      console.error('Error fetching progress records:', error)
    } finally {
      setLoadingProgress(false)
    }
  }

  // Refetch progress when students change
  useEffect(() => {
    if (students.length > 0) {
      fetchProgressRecords()
    }
  }, [students])

  const handleAddProgress = async () => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('progress')
        .insert({
          user_id: progressForm.studentId,
          surah_number: parseInt(progressForm.surah_number),
          ayah_start: parseInt(progressForm.ayah_start),
          ayah_end: parseInt(progressForm.ayah_end),
          status: progressForm.status,
          notes: progressForm.notes || null,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error adding progress:', error)
        alert('Failed to add progress record. Please try again.')
        return
      }

      alert('Progress record added successfully!')
      setShowAddProgressModal(false)
      setProgressForm({
        studentId: '',
        surah_number: '',
        ayah_start: '',
        ayah_end: '',
        status: 'learning',
        notes: ''
      })
      fetchProgressRecords()
    } catch (error) {
      console.error('Error adding progress:', error)
      alert('Failed to add progress record. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getProgressStats = () => {
    const memorized = progressRecords.filter(record => record.status === 'memorized').length
    const reviewing = progressRecords.filter(record => record.status === 'reviewing').length
    const learning = progressRecords.filter(record => record.status === 'learning').length
    const total = progressRecords.length
    
    return { memorized, reviewing, learning, total }
  }

  const stats = getProgressStats()

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || profile?.user_type !== 'coordinator') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Progress Tracking
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track Quran memorization progress of your students
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => setShowAddProgressModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Progress
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Logo width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Memorized</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.memorized}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Logo width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Reviewing</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.reviewing}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Learning</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.learning}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Records */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Progress Records
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Track and manage student progress
            </p>
          </div>

          {loadingProgress ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading progress records...</p>
            </div>
          ) : progressRecords.length === 0 ? (
            <div className="p-6 text-center">
              <div className="flex justify-center">
                <Logo width={48} height={48} className="h-12 w-12 opacity-40" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress records</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking student progress by adding records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progressRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.profiles?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.profiles?.serial_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Surah {record.surah_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.ayah_start} - {record.ayah_end}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            record.status === 'memorized' ? 'success' :
                            record.status === 'reviewing' ? 'warning' : 'info'
                          }
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedProgress(record)
                            setShowEditProgressModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProgress(record)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Progress Modal */}
        <Modal
          isOpen={showAddProgressModal}
          onClose={() => setShowAddProgressModal(false)}
          title="Add Progress Record"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={progressForm.studentId}
                onChange={(e) => setProgressForm({...progressForm, studentId: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.serial_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surah Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="114"
                  value={progressForm.surah_number}
                  onChange={(e) => setProgressForm({...progressForm, surah_number: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  value={progressForm.ayah_start}
                  onChange={(e) => setProgressForm({...progressForm, ayah_start: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  value={progressForm.ayah_end}
                  onChange={(e) => setProgressForm({...progressForm, ayah_end: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={progressForm.status}
                onChange={(e) => setProgressForm({...progressForm, status: e.target.value as any})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="learning">Learning</option>
                <option value="reviewing">Reviewing</option>
                <option value="memorized">Memorized</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={progressForm.notes}
                onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowAddProgressModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProgress}
                disabled={submitting || !progressForm.studentId || !progressForm.surah_number}
              >
                {submitting ? 'Adding...' : 'Add Progress'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
