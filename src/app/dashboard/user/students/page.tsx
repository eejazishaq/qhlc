'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Users, Search, Plus, Filter, Eye, UserCheck, Calendar, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Student {
  id: string
  full_name: string
  mobile: string
  gender: 'Male' | 'Female'
  serial_number: string
  is_active: boolean
  created_at: string
  father_name?: string
  dob?: string
  iqama_number?: string
  areas?: { name: string } | null
  centers?: { name: string } | null
}

export default function StudentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // Check if user has coordinator role
    if (!loading && profile && profile.user_type !== 'coordinator') {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.user_type === 'coordinator') {
      fetchStudents()
    }
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      
      // Get students from the same center as the coordinator
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          mobile,
          gender,
          serial_number,
          is_active,
          created_at,
          father_name,
          dob,
          iqama_number,
          area_id,
          center_id
        `)
        .eq('center_id', profile?.center_id)
        .eq('user_type', 'user')
        .order('created_at', { ascending: false })

      // Fetch areas and centers separately
      const areaIds = [...new Set(data?.map(student => student.area_id).filter(Boolean))]
      const centerIds = [...new Set(data?.map(student => student.center_id).filter(Boolean))]

      const { data: areas } = await supabase
        .from('areas')
        .select('id, name')
        .in('id', areaIds)

      const { data: centers } = await supabase
        .from('exam_centers')
        .select('id, name')
        .in('id', centerIds)

      // Create lookup maps
      const areasMap = new Map(areas?.map(area => [area.id, area]) || [])
      const centersMap = new Map(centers?.map(center => [center.id, center]) || [])

      // Merge the data
      const studentsWithLocations = data?.map(student => ({
        ...student,
        areas: areasMap.get(student.area_id) || null,
        centers: centersMap.get(student.center_id) || null
      })) || []

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(studentsWithLocations)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.mobile.includes(searchTerm) ||
                         student.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && student.is_active) ||
                         (statusFilter === 'inactive' && !student.is_active)
    
    return matchesSearch && matchesStatus
  })

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

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
              My Students
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage students in your center
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Badge variant="info">
              {students.length} Total Students
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Students</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-1" />
              {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          {loadingStudents ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No students are registered in your center yet.'}
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {student.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.mobile}</div>
                        <div className="text-sm text-gray-500">{student.centers?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.serial_number}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={student.is_active ? 'success' : 'danger'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
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

        {/* Student Details Modal */}
        <Modal
          isOpen={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          title="Student Details"
          size="lg"
        >
          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.full_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Mobile</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.mobile}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedStudent.serial_number}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
                  <dl className="space-y-3">
                    {selectedStudent.father_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Father's Name</dt>
                        <dd className="text-sm text-gray-900">{selectedStudent.father_name}</dd>
                      </div>
                    )}
                    {selectedStudent.dob && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedStudent.dob).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {selectedStudent.iqama_number && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Iqama Number</dt>
                        <dd className="text-sm text-gray-900">{selectedStudent.iqama_number}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedStudent.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Location Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Area</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.areas?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exam Center</dt>
                    <dd className="text-sm text-gray-900">{selectedStudent.centers?.name || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
