'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Users, Search, Filter, Eye, MapPin, Phone, Calendar, User, RefreshCw, UserCheck } from 'lucide-react'

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
  user_type: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
  areas?: { name: string } | null
  centers?: { name: string } | null
}

export default function StudentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [filterUserType, setFilterUserType] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // Check if user has appropriate role
    if (!loading && profile && !['user', 'coordinator', 'convener'].includes(profile.user_type)) {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile && ['user', 'coordinator', 'convener'].includes(profile.user_type)) {
      fetchStudents()
    }
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      
      let query = supabase
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
          user_type,
          area_id,
          center_id
        `)
        .in('user_type', ['user', 'coordinator'])
        .order('created_at', { ascending: false })

      // Filter based on user role
      if (profile?.user_type === 'coordinator') {
        // Coordinators see students in their center
        query = query.eq('center_id', profile?.center_id)
      } else if (profile?.user_type === 'convener') {
        // Conveners see students in their area
        query = query.eq('area_id', profile?.area_id)
      }
      // Regular users don't see any students (this page shouldn't be accessible to them)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      // Fetch areas and centers data
      const areaIds = [...new Set(data?.map(s => s.area_id).filter(Boolean) || [])]
      const centerIds = [...new Set(data?.map(s => s.center_id).filter(Boolean) || [])]

      let areasMap: Record<string, { name: string }> = {}
      let centersMap: Record<string, { name: string }> = {}

      if (areaIds.length > 0) {
        const { data: areasData } = await supabase
          .from('areas')
          .select('id, name')
          .in('id', areaIds)
        
        areasMap = areasData?.reduce((acc, area) => ({
          ...acc,
          [area.id]: { name: area.name }
        }), {}) || {}
      }

      if (centerIds.length > 0) {
        const { data: centersData } = await supabase
          .from('exam_centers')
          .select('id, name')
          .in('id', centerIds)
        
        centersMap = centersData?.reduce((acc, center) => ({
          ...acc,
          [center.id]: { name: center.name }
        }), {}) || {}
      }

      // Merge the data
      const studentsWithLocations = data?.map(student => ({
        ...student,
        areas: student.area_id ? areasMap[student.area_id] || null : null,
        centers: student.center_id ? centersMap[student.center_id] || null : null
      })) || []

      setStudents(studentsWithLocations)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.mobile.includes(searchTerm)
    
    const matchesFilter = filterActive === null || student.is_active === filterActive
    
    const matchesUserType = filterUserType === 'all' || student.user_type === filterUserType
    
    return matchesSearch && matchesFilter && matchesUserType
  })

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedStudent(null)
    setShowModal(false)
  }

  const getRoleTitle = () => {
    if (profile?.user_type === 'coordinator') return 'Center'
    if (profile?.user_type === 'convener') return 'Area'
    return 'Students'
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !['user', 'coordinator', 'convener'].includes(profile?.user_type || '')) {
    return null
  }

  // Regular users shouldn't see this page
  if (profile?.user_type === 'user') {
    router.push('/dashboard/user')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
              <p className="text-gray-600">
                {profile?.user_type === 'convener' ? 'Area' : 'Center'} Level Student Management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 md:p-3 rounded-full">
                <User className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Students</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {students.filter(s => s.user_type === 'user').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 md:p-3 rounded-full">
                <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Coordinators</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {students.filter(s => s.user_type === 'coordinator').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">{getRoleTitle()}</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">
                  {profile?.user_type === 'convener' ? 
                    (students.length > 0 ? students[0]?.areas?.name || 'Your Area' : 'Your Area') :
                    (students.length > 0 ? students[0]?.centers?.name || 'Your Center' : 'Your Center')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, serial number, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm md:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={filterUserType}
                    onChange={(e) => setFilterUserType(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="user">Students Only</option>
                    <option value="coordinator">Coordinators Only</option>
                  </select>
                  
                  <select
                    value={filterActive === null ? 'all' : filterActive.toString()}
                    onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>
                
                <button
                  onClick={fetchStudents}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({filteredStudents.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
                <p className="text-sm">
                  {searchTerm || filterActive !== null || filterUserType !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No users are currently registered in your area/center'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Serial Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
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
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {student.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.father_name && `Son of ${student.father_name}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.user_type === 'coordinator' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {student.user_type === 'coordinator' ? 'Coordinator' : 'Student'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {student.serial_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Phone className="w-4 h-4 mr-1 text-gray-400" />
                              {student.mobile}
                            </div>
                            {student.iqama_number && (
                              <div className="text-xs text-gray-500">
                                IQAMA: {student.iqama_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.areas?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.centers?.name || 'No Center'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleViewStudent(student)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
                  <div className="p-4 space-y-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {student.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {student.full_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {student.father_name && `Son of ${student.father_name}`}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleViewStudent(student)}
                            className="text-blue-600 hover:text-blue-900 flex items-center text-sm flex-shrink-0 ml-2"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                        
                        {/* Badges Section */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.user_type === 'coordinator' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {student.user_type === 'coordinator' ? 'Coordinator' : 'Student'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {/* Details Section */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium mr-2 w-16 flex-shrink-0">Serial:</span>
                            <span className="font-mono text-xs sm:text-sm truncate">{student.serial_number}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{student.mobile}</span>
                          </div>
                          <div className="flex items-start text-sm text-gray-600">
                            <span className="font-medium mr-2 w-16 flex-shrink-0">Area:</span>
                            <span className="truncate">{student.areas?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-start text-sm text-gray-600">
                            <span className="font-medium mr-2 w-16 flex-shrink-0">Center:</span>
                            <span className="truncate">{student.centers?.name || 'No Center'}</span>
                          </div>
                          {student.iqama_number && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium mr-2 w-16 flex-shrink-0">IQAMA:</span>
                              <span className="truncate">{student.iqama_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {selectedStudent.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedStudent.full_name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedStudent.user_type === 'coordinator' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedStudent.user_type === 'coordinator' ? 'Coordinator' : 'Student'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedStudent.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStudent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedStudent.serial_number}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedStudent.mobile}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.gender}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.father_name || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">IQAMA Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.iqama_number || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Area</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedStudent.areas?.name || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Center</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudent.centers?.name || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(selectedStudent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
