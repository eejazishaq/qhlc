'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Users, CheckCircle, XCircle, Clock, Plus, Filter } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Student {
  id: string
  full_name: string
  serial_number: string
}

interface Attendance {
  id: string
  user_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  remarks?: string
  marked_by: string
  created_at: string
  profiles?: {
    full_name: string
    serial_number: string
  }
}

export default function AttendancePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingAttendance, setLoadingAttendance] = useState(true)
  
  // UI states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false)
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({})
  const [submittingAttendance, setSubmittingAttendance] = useState(false)

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
      fetchAttendanceRecords()
    }
  }, [user, profile, selectedDate])

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

  const fetchAttendanceRecords = async () => {
    try {
      setLoadingAttendance(true)
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id(full_name, serial_number)
        `)
        .eq('center_id', profile?.center_id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching attendance:', error)
        return
      }

      setAttendanceRecords(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const handleMarkAttendance = async () => {
    try {
      setSubmittingAttendance(true)
      
      const attendanceEntries = Object.entries(attendanceData).map(([userId, status]) => ({
        user_id: userId,
        center_id: profile?.center_id,
        date: selectedDate,
        status: status as 'present' | 'absent' | 'late',
        marked_by: user?.id,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceEntries, {
          onConflict: 'user_id,center_id,date'
        })

      if (error) {
        console.error('Error marking attendance:', error)
        alert('Failed to mark attendance. Please try again.')
        return
      }

      alert('Attendance marked successfully!')
      setShowMarkAttendanceModal(false)
      setAttendanceData({})
      fetchAttendanceRecords()
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Failed to mark attendance. Please try again.')
    } finally {
      setSubmittingAttendance(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const present = attendanceRecords.filter(record => record.status === 'present').length
    const absent = attendanceRecords.filter(record => record.status === 'absent').length
    const late = attendanceRecords.filter(record => record.status === 'late').length
    const notMarked = total - attendanceRecords.length
    
    return { total, present, absent, late, notMarked }
  }

  const stats = getAttendanceStats()

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
              Attendance Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mark and track student attendance
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => setShowMarkAttendanceModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
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
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Present</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.present}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Absent</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.absent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Late</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.late}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Filter className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Not Marked</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.notMarked}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Attendance Records for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              View attendance records for the selected date
            </p>
          </div>

          {loadingAttendance ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading attendance records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
              <p className="mt-1 text-sm text-gray-500">
                No attendance has been marked for this date yet.
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            record.status === 'present' ? 'success' :
                            record.status === 'absent' ? 'danger' : 'warning'
                          }
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mark Attendance Modal */}
        <Modal
          isOpen={showMarkAttendanceModal}
          onClose={() => setShowMarkAttendanceModal(false)}
          title="Mark Attendance"
          size="lg"
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Date: <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span></p>
              <p>Center: <span className="font-medium">Your Center</span></p>
            </div>

            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                    <div className="text-sm text-gray-500">{student.serial_number}</div>
                  </div>
                  <select
                    value={attendanceData[student.id] || 'present'}
                    onChange={(e) => setAttendanceData({
                      ...attendanceData,
                      [student.id]: e.target.value
                    })}
                    className="block w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowMarkAttendanceModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAttendance}
                disabled={submittingAttendance}
              >
                {submittingAttendance ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
