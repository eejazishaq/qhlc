'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Building2, Users, Search, Filter, Eye, MapPin, Phone, Calendar, User, BarChart3, RefreshCw } from 'lucide-react'

interface Center {
  id: string
  name: string
  address?: string
  contact_person?: string
  contact_phone?: string
  capacity: number
  is_active: boolean
  created_at: string
  area_id: string
  areas?: { name: string } | null
  student_count?: number
  coordinator_count?: number
}

export default function CentersPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [centers, setCenters] = useState<Center[]>([])
  const [loadingCenters, setLoadingCenters] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // Check if user has appropriate role
    if (!loading && profile && !['coordinator', 'convener'].includes(profile.user_type)) {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile && ['coordinator', 'convener'].includes(profile.user_type)) {
      fetchCenters()
    }
  }, [user, profile])

  const fetchCenters = async () => {
    try {
      setLoadingCenters(true)
      
      let query = supabase
        .from('exam_centers')
        .select(`
          id,
          name,
          address,
          contact_person,
          contact_phone,
          capacity,
          is_active,
          created_at,
          area_id
        `)
        .order('created_at', { ascending: false })

      // Filter based on user role
      if (profile?.user_type === 'convener') {
        // Conveners see centers in their area
        query = query.eq('area_id', profile?.area_id)
      }
      // Coordinators don't see this page (they work with one center)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching centers:', error)
        return
      }

      // Fetch areas data
      const areaIds = [...new Set(data?.map(c => c.area_id).filter(Boolean) || [])]
      let areasMap: Record<string, { name: string }> = {}

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

      // Get student and coordinator counts for each center
      const centersWithCounts = await Promise.all(
        data?.map(async (center) => {
          // Count students in this center
          const { count: studentCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('center_id', center.id)
            .eq('user_type', 'user')

          // Count coordinators in this center
          const { count: coordinatorCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('center_id', center.id)
            .eq('user_type', 'coordinator')

          return {
            ...center,
            areas: areasMap[center.area_id] || null,
            student_count: studentCount || 0,
            coordinator_count: coordinatorCount || 0
          }
        }) || []
      )

      setCenters(centersWithCounts)
    } catch (error) {
      console.error('Error fetching centers:', error)
    } finally {
      setLoadingCenters(false)
    }
  }

  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (center.address && center.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (center.contact_person && center.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterActive === null || center.is_active === filterActive
    
    return matchesSearch && matchesFilter
  })

  const handleViewCenter = (center: Center) => {
    setSelectedCenter(center)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedCenter(null)
    setShowModal(false)
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !['coordinator', 'convener'].includes(profile?.user_type || '')) {
    return null
  }

  // Only conveners should see this page
  if (profile?.user_type === 'coordinator') {
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
              <h1 className="text-2xl font-bold text-gray-900">Exam Centers</h1>
              <p className="text-gray-600">Area Level Center Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Building2 className="w-6 h-6 text-blue-600" />
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
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Centers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{centers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 md:p-3 rounded-full">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Active Centers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {centers.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 md:p-3 rounded-full">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {centers.reduce((sum, center) => sum + (center.student_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                <User className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Coordinators</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {centers.reduce((sum, center) => sum + (center.coordinator_count || 0), 0)}
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
                  placeholder="Search centers by name, address, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm md:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={filterActive === null ? 'all' : filterActive.toString()}
                    onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Centers</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>
                
                <button
                  onClick={fetchCenters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Centers Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Centers ({filteredCenters.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loadingCenters ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCenters.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No centers found</p>
                <p className="text-sm">
                  {searchTerm || filterActive !== null 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No centers are currently registered in your area'
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
                          Center
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinators
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
                      {filteredCenters.map((center) => (
                        <tr key={center.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {center.name}
                                </div>
                                {center.address && (
                                  <div className="text-sm text-gray-500">
                                    {center.address}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              {center.areas?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {center.contact_person && (
                              <div className="text-sm text-gray-900">
                                {center.contact_person}
                              </div>
                            )}
                            {center.contact_phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {center.contact_phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {center.capacity} seats
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {center.student_count || 0}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {center.capacity > 0 ? 
                                `${Math.round(((center.student_count || 0) / center.capacity) * 100)}% capacity` : 
                                'N/A'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {center.coordinator_count || 0}
                              </span>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleViewCenter(center)}
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
                    {filteredCenters.map((center) => (
                      <div key={center.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {center.name}
                              </div>
                              {center.address && (
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  {center.address}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleViewCenter(center)}
                            className="text-blue-600 hover:text-blue-900 flex items-center text-sm flex-shrink-0 ml-2"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </button>
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
                            <span className="truncate">{center.areas?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium mr-2 w-16 flex-shrink-0">Capacity:</span>
                            <span className="truncate">{center.capacity} seats</span>
                          </div>
                          <div className="flex items-start text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">Students:</span>
                              <span className="ml-1">{center.student_count || 0}</span>
                              {center.capacity > 0 && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({Math.round(((center.student_count || 0) / center.capacity) * 100)}% capacity)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="font-medium mr-2 w-20 flex-shrink-0">Coordinators:</span>
                            <span className="truncate">{center.coordinator_count || 0}</span>
                          </div>
                          {center.contact_person && (
                            <div className="flex items-start text-sm text-gray-600">
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Performance Overview */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Center Performance</h3>
            </div>
            <div className="p-4 md:p-6">
              {centers.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {centers.slice(0, 3).map((center) => (
                    <div key={center.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{center.name}</p>
                        <p className="text-xs text-gray-500">
                          {center.student_count || 0} students
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        <div className="w-12 md:w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${center.capacity > 0 ? 
                                Math.min(((center.student_count || 0) / center.capacity) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {center.capacity > 0 ? 
                            `${Math.round(((center.student_count || 0) / center.capacity) * 100)}%` : 
                            '0%'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6 md:py-8">
                  <BarChart3 className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" />
                  <p className="text-sm md:text-base">No performance data available</p>
                  <p className="text-xs md:text-sm">Add centers to see performance metrics</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Area Overview</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Centers</span>
                  <span className="text-sm font-medium text-gray-900">{centers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Centers</span>
                  <span className="text-sm font-medium text-gray-900">
                    {centers.filter(c => c.is_active).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="text-sm font-medium text-gray-900">
                    {centers.reduce((sum, center) => sum + (center.student_count || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Coordinators</span>
                  <span className="text-sm font-medium text-gray-900">
                    {centers.reduce((sum, center) => sum + (center.coordinator_count || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Capacity</span>
                  <span className="text-sm font-medium text-gray-900">
                    {centers.length > 0 ? 
                      Math.round(centers.reduce((sum, center) => sum + center.capacity, 0) / centers.length) : 
                      0
                    } seats
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Details Modal */}
      {showModal && selectedCenter && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Center Details
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
                {/* Center Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedCenter.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedCenter.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCenter.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Center Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCenter.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Area</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedCenter.areas?.name || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCenter.address || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCenter.capacity} seats</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCenter.contact_person || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedCenter.contact_phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Students</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedCenter.student_count || 0}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Coordinators</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedCenter.coordinator_count || 0}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity Utilization</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCenter.capacity > 0 ? 
                        `${Math.round(((selectedCenter.student_count || 0) / selectedCenter.capacity) * 100)}%` : 
                        'N/A'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(selectedCenter.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Capacity Bar */}
                {selectedCenter.capacity > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity Overview</label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(((selectedCenter.student_count || 0) / selectedCenter.capacity) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{selectedCenter.student_count || 0} students</span>
                      <span>{selectedCenter.capacity} total capacity</span>
                    </div>
                  </div>
                )}
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
