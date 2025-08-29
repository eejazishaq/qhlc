'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { authenticatedFetch } from '@/lib/utils/api'
import { Users, ArrowRight, Search, MapPin, Building, User, AlertCircle, CheckCircle, X } from 'lucide-react'

interface TransferData {
  stats: {
    users: {
      totalUsers: number
      usersWithCenters: number
      usersWithoutCenters: number
    }
    centers: {
      totalCenters: number
      activeCenters: number
    }
    areas: {
      totalAreas: number
      activeAreas: number
    }
    transfers: {
      transfersThisMonth: number
    }
  }
  users: Array<{
    id: string
    full_name: string
    mobile: string
    user_type: string
    center_id: string | null
    area_id: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    center_name: string | null
    area_name: string | null
  }>
  centers: Array<{
    id: string
    name: string
    address: string | null
    capacity: number | null
    area_id: string
    area_name: string | null
  }>
  areas: Array<{
    id: string
    name: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminTransferPage() {
  const { user, profile, loading, session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [transferData, setTransferData] = useState<TransferData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Transfer form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCenterId, setSelectedCenterId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('')
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('')
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
      fetchTransferData()
    }
  }, [user, session, currentPage, selectedCenterFilter, selectedAreaFilter])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1) // Reset to first page when searching
        fetchTransferData()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchTransferData = async () => {
    try {
      setLoadingData(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCenterFilter) params.append('centerId', selectedCenterFilter)
      if (selectedAreaFilter) params.append('areaId', selectedAreaFilter)
      
      const response = await authenticatedFetch(`/api/admin/transfer?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('Frontend - Transfer data received:', result.data)
        console.log('Frontend - Users count:', result.data.users?.length || 0)
        console.log('Frontend - Centers count:', result.data.centers?.length || 0)
        console.log('Frontend - Areas count:', result.data.areas?.length || 0)
        setTransferData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch transfer data')
      }
    } catch (err) {
      console.error('Error fetching transfer data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transfer data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedUserId || !selectedCenterId) {
      setError('Please select both a user and a center')
      return
    }

    try {
      setTransferring(true)
      setError(null)
      setTransferSuccess(null)
      
      const response = await authenticatedFetch('/api/admin/transfer', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUserId,
          newCenterId: selectedCenterId,
          reason: transferReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transfer failed')
      }

      const result = await response.json()
      
      if (result.success) {
        setTransferSuccess('User transferred successfully!')
        setSelectedUserId('')
        setSelectedCenterId('')
        setTransferReason('')
        
        // Refresh data
        await fetchTransferData()
        
        // Clear success message after 3 seconds
        setTimeout(() => setTransferSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error transferring user:', err)
      setError(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setTransferring(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Transfer Tool</h1>
          <p className="text-gray-600">Move users between exam centers</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchTransferData}
            disabled={loadingData}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {loadingData ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </button>
          <button
            onClick={async () => {
              try {
                const response = await authenticatedFetch('/api/admin/transfer/test')
                const result = await response.json()
                console.log('Test API result:', result)
                if (result.success) {
                  alert('Test successful! Check console for details.')
                } else {
                  alert(`Test failed: ${result.error}`)
                }
              } catch (err) {
                console.error('Test API error:', err)
                alert('Test API error - check console')
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test API
          </button>
          <button
            onClick={async () => {
              try {
                const response = await authenticatedFetch('/api/admin/transfer/simple-test')
                const result = await response.json()
                console.log('Simple test result:', result)
                if (result.success) {
                  alert(`Simple test successful! Found ${result.data.totalProfiles} profiles. Check console for details.`)
                } else {
                  alert(`Simple test failed: ${result.error}`)
                }
              } catch (err) {
                console.error('Simple test error:', err)
                alert('Simple test error - check console')
              }
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Simple Test
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Display */}
      {transferSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-800">{transferSuccess}</p>
            </div>
            <button
              onClick={() => setTransferSuccess(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingData ? '...' : transferData?.stats.users.totalUsers || 0}
              </p>
              {transferData && (
                <p className="text-xs text-gray-600">
                  {transferData.stats.users.usersWithCenters} with centers
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exam Centers</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingData ? '...' : transferData?.stats.centers.activeCenters || 0}
              </p>
              {transferData && (
                <p className="text-xs text-gray-600">
                  {transferData.stats.centers.totalCenters} total
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <ArrowRight className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transfers This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingData ? '...' : transferData?.stats.transfers.transfersThisMonth || 0}
              </p>
              {transferData && (
                <p className="text-xs text-gray-600">
                  Profile updates
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Areas</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingData ? '...' : transferData?.stats.areas.activeAreas || 0}
              </p>
              {transferData && (
                <p className="text-xs text-gray-600">
                  {transferData.stats.areas.totalAreas} total
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer User</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a user...</option>
                {transferData?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} - {user.center_name || 'No Center'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Center
              </label>
              <select 
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a center...</option>
                {transferData?.centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name} - {center.area_name || 'No Area'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Transfer reason..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleTransfer}
              disabled={transferring || !selectedUserId || !selectedCenterId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {transferring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{transferring ? 'Transferring...' : 'Transfer User'}</span>
            </button>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name, mobile, or serial number..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {loadingData && searchTerm && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedCenterFilter}
                onChange={(e) => setSelectedCenterFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Centers</option>
                {transferData?.centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name} - {center.area_name || 'No Area'}
                  </option>
                ))}
              </select>
              <select 
                value={selectedAreaFilter}
                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Areas</option>
                {transferData?.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
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
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : transferData?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found</p>
                    <p className="text-sm">Users will appear here once they register</p>
                  </td>
                </tr>
              ) : (
                transferData?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.mobile}</div>
                          <div className="text-xs text-gray-400">{user.user_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.center_name ? (
                          <span className="text-green-600 font-medium">{user.center_name}</span>
                        ) : (
                          <span className="text-red-500 italic">No Center Assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.area_name ? (
                          <span className="text-green-600 font-medium">{user.area_name}</span>
                        ) : (
                          <span className="text-red-500 italic">No Area Assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setSelectedCenterId('')
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {transferData && transferData.pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {transferData.pagination.page} of {transferData.pagination.pages} 
                ({transferData.pagination.total} total users)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(transferData.pagination.pages, currentPage + 1))}
                  disabled={currentPage === transferData.pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

      

        
      </div>
    </div>
  )
} 