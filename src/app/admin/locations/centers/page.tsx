'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw,
  Users,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExamCenter {
  id: string
  name: string
  address: string | null
  area_id: string
  capacity: number
  contact_person: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  areas: {
    name: string
    code: string
    regions: {
      name: string
      code: string
      countries: {
        name: string
        code: string
      }
    }
  }
}

interface Area {
  id: string
  name: string
  code: string
  region_id: string
  regions: {
    name: string
    code: string
    countries: {
      name: string
      code: string
    }
  }
}

interface ExamCenterFormData {
  name: string
  address: string
  area_id: string
  capacity: number
  contact_person: string
  contact_phone: string
  is_active: boolean
}

export default function ExamCentersPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [centers, setCenters] = useState<ExamCenter[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingCenter, setEditingCenter] = useState<ExamCenter | null>(null)
  const [formData, setFormData] = useState<ExamCenterFormData>({
    name: '',
    address: '',
    area_id: '',
    capacity: 50,
    contact_person: '',
    contact_phone: '',
    is_active: true
  })

  useEffect(() => {
    if (profile?.user_type === 'admin' || profile?.user_type === 'super_admin') {
      fetchAreas()
      fetchCenters()
    }
  }, [profile, currentPage, searchTerm, areaFilter, statusFilter])

  const fetchAreas = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/locations/areas?limit=1000')

      if (!response.ok) {
        throw new Error('Failed to fetch areas')
      }

      const data = await response.json()
      setAreas(data.areas || [])
    } catch (error) {
      console.error('Error fetching areas:', error)
    }
  }

  const fetchCenters = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(areaFilter && { areaId: areaFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await authenticatedFetch(`/api/admin/locations/centers?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch exam centers')
      }

      const data = await response.json()
      setCenters(data.centers || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching exam centers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCenter 
        ? `/api/admin/locations/centers/${editingCenter.id}`
        : '/api/admin/locations/centers'
      
      const method = editingCenter ? 'PUT' : 'POST'

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save exam center')
      }

      setShowModal(false)
      setEditingCenter(null)
      setFormData({
        name: '',
        address: '',
        area_id: '',
        capacity: 50,
        contact_person: '',
        contact_phone: '',
        is_active: true
      })
      fetchCenters()
    } catch (error) {
      console.error('Error saving exam center:', error)
      alert(error instanceof Error ? error.message : 'Failed to save exam center')
    }
  }

  const handleEdit = (center: ExamCenter) => {
    setEditingCenter(center)
    setFormData({
      name: center.name,
      address: center.address || '',
      area_id: center.area_id,
      capacity: center.capacity,
      contact_person: center.contact_person || '',
      contact_phone: center.contact_phone || '',
      is_active: center.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (center: ExamCenter) => {
    if (!confirm(`Are you sure you want to delete "${center.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/locations/centers/${center.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete exam center')
      }

      fetchCenters()
    } catch (error) {
      console.error('Error deleting exam center:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete exam center')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      area_id: '',
      capacity: 50,
      contact_person: '',
      contact_phone: '',
      is_active: true
    })
    setEditingCenter(null)
  }

  if (profile?.user_type !== 'admin' && profile?.user_type !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-md"
                >
                  ← Back
                </button>
                <Users className="w-8 h-8 text-orange-600 mr-3" />
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Exam Centers Management</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Manage exam centers and their capacity</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Exam Center</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search exam centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Areas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code}) - {area.regions?.countries?.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={fetchCenters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Exam Centers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading exam centers...
                    </td>
                  </tr>
                ) : centers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No exam centers found
                    </td>
                  </tr>
                ) : (
                  centers.map((center) => (
                    <tr key={center.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {center.name}
                            </div>
                            {center.address && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {center.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            {center.areas?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {center.areas?.regions?.name}, {center.areas?.regions?.countries?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {center.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {center.contact_person && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              {center.contact_person}
                            </div>
                          )}
                          {center.contact_phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {center.contact_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          center.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {center.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(center.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(center)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(center)}
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

          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading exam centers...
              </div>
            ) : centers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No exam centers found
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {centers.map((center) => (
                  <div key={center.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-orange-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {center.name}
                          </div>
                          {center.address && (
                            <div className="text-xs text-gray-500 truncate">
                              {center.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleEdit(center)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(center)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        center.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {center.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="font-medium mr-2 w-16 flex-shrink-0">Area:</span>
                        <span className="truncate">{center.areas?.name} ({center.areas?.code})</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2 w-16 flex-shrink-0">Capacity:</span>
                        <span className="truncate">{center.capacity} seats</span>
                      </div>
                      {center.contact_person && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2 w-16 flex-shrink-0">Contact:</span>
                          <span className="truncate">{center.contact_person}</span>
                        </div>
                      )}
                      {center.contact_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{center.contact_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2 w-20 flex-shrink-0">Created:</span>
                        <span className="truncate">{new Date(center.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCenter ? 'Edit Exam Center' : 'Add New Exam Center'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter exam center name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area *
                  </label>
                  <select
                    required
                    value={formData.area_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, area_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select an area</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name} ({area.code}) - {area.regions?.countries?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="1000"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter capacity (1-1000)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter phone number"
                  />
                </div>


                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    {editingCenter ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
