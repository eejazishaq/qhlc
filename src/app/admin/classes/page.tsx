'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
// import { supabase } from '@/lib/supabase/client'
import { authenticatedFetch } from '@/lib/utils/api'
import { Plus, Search, X, Edit, Trash2, MapPin, Phone, Mail, FileText, MapPin as MapPinIcon, ExternalLink, AlertCircle } from 'lucide-react'

interface Class {
  id: string
  title: string
  description: string | null
  subject: string | null
  teacher_name: string
  area_id: string
  center_id: string
  address: string
  google_map_link: string | null
  contact_number: string
  email: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  area: { id: string; name: string } | null
  center: { id: string; name: string } | null
}

interface Area {
  id: string
  name: string
}

interface Center {
  id: string
  name: string
  area_id: string
}

interface ClassFormData {
  title: string
  description: string
  subject: string
  teacher_name: string
  area_id: string
  center_id: string
  address: string
  google_map_link: string
  contact_number: string
  email: string
  status: 'active' | 'inactive'
}

export default function AdminClassesPage() {
  const { user, profile, loading, session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // UI states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<ClassFormData>({
    title: '',
    description: '',
    subject: '',
    teacher_name: '',
    area_id: '',
    center_id: '',
    address: '',
    google_map_link: '',
    contact_number: '',
    email: '',
    status: 'active'
  })
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('')
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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
    if (user && session?.access_token) {
      fetchClasses()
      fetchLocations()
    }
  }, [user, session, currentPage, searchTerm, selectedAreaFilter, selectedCenterFilter, selectedStatusFilter])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1) // Reset to first page when searching
        fetchClasses()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchClasses = async () => {
    try {
      setLoadingData(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedAreaFilter) params.append('areaId', selectedAreaFilter)
      if (selectedCenterFilter) params.append('centerId', selectedCenterFilter)
      if (selectedStatusFilter) params.append('status', selectedStatusFilter)
      
      const response = await authenticatedFetch(`/api/admin/classes?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setClasses(result.data.classes)
      } else {
        throw new Error(result.error || 'Failed to fetch classes')
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchLocations = async () => {
    try {
      // Fetch all areas and centers for admin dropdowns
      const [areasResponse, centersResponse] = await Promise.all([
        authenticatedFetch('/api/admin/locations/areas?limit=1000'),
        authenticatedFetch('/api/admin/locations/centers?limit=1000')
      ])

      if (areasResponse.ok && centersResponse.ok) {
        const areasData = await areasResponse.json()
        const centersData = await centersResponse.json()
        setAreas(areasData.areas || [])
        setCenters(centersData.centers || [])
      } else {
        console.error('Failed to fetch locations')
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleAddClass = async () => {
    try {
      setFormLoading(true)
      
      const response = await authenticatedFetch('/api/admin/classes', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create class')
      }

      const result = await response.json()
      
      if (result.success) {
        setShowAddModal(false)
        resetForm()
        fetchClasses()
        alert('Class created successfully!')
      }
    } catch (err) {
      console.error('Error creating class:', err)
      alert(err instanceof Error ? err.message : 'Failed to create class')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditClass = async () => {
    if (!selectedClass) return
    
    try {
      setFormLoading(true)
      
      const response = await authenticatedFetch('/api/admin/classes', {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedClass.id,
          ...formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update class')
      }

      const result = await response.json()
      
      if (result.success) {
        setShowEditModal(false)
        setSelectedClass(null)
        resetForm()
        fetchClasses()
        alert('Class updated successfully!')
      }
    } catch (err) {
      console.error('Error updating class:', err)
      alert(err instanceof Error ? err.message : 'Failed to update class')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return
    
    try {
      setDeleteLoading(true)
      
      const response = await authenticatedFetch(`/api/admin/classes?id=${selectedClass.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete class')
      }

      const result = await response.json()
      
      if (result.success) {
        setShowDeleteModal(false)
        setSelectedClass(null)
        fetchClasses()
        alert('Class deleted successfully!')
      }
    } catch (err) {
      console.error('Error deleting class:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete class')
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      teacher_name: '',
      area_id: '',
      center_id: '',
      address: '',
      google_map_link: '',
      contact_number: '',
      email: '',
      status: 'active'
    })
  }

  const openEditModal = (classItem: Class) => {
    setSelectedClass(classItem)
    setFormData({
      title: classItem.title,
      description: classItem.description || '',
      subject: classItem.subject || '',
      teacher_name: classItem.teacher_name,
      area_id: classItem.area_id,
      center_id: classItem.center_id,
      address: classItem.address,
      google_map_link: classItem.google_map_link || '',
      contact_number: classItem.contact_number,
      email: classItem.email || '',
      status: classItem.status
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (classItem: Class) => {
    setSelectedClass(classItem)
    setShowDeleteModal(true)
  }

  const getFilteredCenters = () => {
    if (!selectedAreaFilter) return centers
    return centers.filter(center => center.area_id === selectedAreaFilter)
  }

  // Helper functions to get area and center names
  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId)
    return area?.name || 'Unknown Area'
  }

  const getCenterName = (centerId: string) => {
    const center = centers.find(c => c.id === centerId)
    return center?.name || 'Unknown Center'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage QHLC classes across different areas and centers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search classes by title, description, or teacher..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select 
                value={selectedAreaFilter}
                onChange={(e) => {
                  setSelectedAreaFilter(e.target.value)
                  setSelectedCenterFilter('') // Reset center when area changes
                }}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedCenterFilter}
                onChange={(e) => setSelectedCenterFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Centers</option>
                {getFilteredCenters().map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Classes</h3>
        </div>
        
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          {loadingData ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No classes found</p>
              <p className="text-xs text-gray-500">Classes will appear here once they are created</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {classes.map((classItem) => (
                <div key={classItem.id} className="bg-gray-50 rounded-lg p-4 border">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{classItem.title}</div>
                        <div className="text-xs text-gray-500">{classItem.subject || 'No subject'}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      classItem.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {classItem.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Teacher:</span> {classItem.teacher_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Location:</span> {classItem.address}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Contact:</span> {classItem.contact_number}
                    </div>
                    {classItem.email && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Email:</span> {classItem.email}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(classItem)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(classItem)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {classItem.google_map_link && (
                      <a
                        href={classItem.google_map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Map
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No classes found</p>
                    <p className="text-sm">Classes will appear here once they are created</p>
                  </td>
                </tr>
              ) : (
                classes.map((classItem) => (
                  <tr key={classItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{classItem.title}</div>
                          <div className="text-sm text-gray-500">{classItem.description || 'No description'}</div>
                          <div className="text-xs text-gray-400">{classItem.subject || 'No subject'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{classItem.teacher_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{classItem.area?.name || getAreaName(classItem.area_id)}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <span>{classItem.center?.name || getCenterName(classItem.center_id)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{classItem.address}</div>
                        {classItem.google_map_link && (
                          <a
                            href={classItem.google_map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on Map
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{classItem.contact_number}</span>
                        </div>
                        {classItem.email && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-xs">{classItem.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        classItem.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {classItem.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(classItem)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(classItem)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Class</h3>
              <ClassForm
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                centers={centers}
                onSubmit={handleAddClass}
                onCancel={() => setShowAddModal(false)}
                loading={formLoading}
                submitText="Create Class"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Class</h3>
              <ClassForm
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                centers={centers}
                onSubmit={handleEditClass}
                onCancel={() => setShowEditModal(false)}
                loading={formLoading}
                submitText="Update Class"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Class</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete &quot;{selectedClass?.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClass}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Class Form Component
interface ClassFormProps {
  formData: ClassFormData
  setFormData: (data: ClassFormData) => void
  areas: Area[]
  centers: Center[]
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
  submitText: string
}

function ClassForm({ 
  formData, 
  setFormData, 
  areas, 
  centers, 
  onSubmit, 
  onCancel, 
  loading, 
  submitText 
}: ClassFormProps) {
  const getFilteredCenters = () => {
    if (!formData.area_id) return centers
    return centers.filter(center => center.area_id === formData.area_id)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name *</label>
        <input
          type="text"
          value={formData.teacher_name}
          onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
          <select
            value={formData.area_id}
            onChange={(e) => setFormData({ ...formData, area_id: e.target.value, center_id: '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Center *</label>
          <select
            value={formData.center_id}
            onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Center</option>
            {getFilteredCenters().map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
        <input
          type="url"
          value={formData.google_map_link}
          onChange={(e) => setFormData({ ...formData, google_map_link: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://maps.google.com/..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
          <input
            type="tel"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
  )
} 