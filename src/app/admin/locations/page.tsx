'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'
import { 
  Building2, 
  Globe, 
  MapPin, 
  Users, 
  Plus,
  Eye,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LocationStats {
  countries: number
  regions: number
  areas: number
  centers: number
  totalCapacity: number
  activeCenters: number
}

export default function LocationsDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<LocationStats>({
    countries: 0,
    regions: 0,
    areas: 0,
    centers: 0,
    totalCapacity: 0,
    activeCenters: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.user_type === 'admin' || profile?.user_type === 'super_admin') {
      fetchStats()
    }
  }, [profile])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch countries count
      const countriesResponse = await authenticatedFetch('/api/admin/locations/countries?limit=1')
      const countriesData = await countriesResponse.json()
      
      // Fetch regions count
      const regionsResponse = await authenticatedFetch('/api/admin/locations/regions?limit=1')
      const regionsData = await regionsResponse.json()
      
      // Fetch areas count
      const areasResponse = await authenticatedFetch('/api/admin/locations/areas?limit=1')
      const areasData = await areasResponse.json()
      
      // Fetch all centers to calculate capacity and active count
      const centersResponse = await authenticatedFetch('/api/admin/locations/centers?limit=1000')
      const centersData = await centersResponse.json()
      
      setStats({
        countries: countriesData.pagination?.total || 0,
        regions: regionsData.pagination?.total || 0,
        areas: areasData.pagination?.total || 0,
        centers: centersData.pagination?.total || 0,
        totalCapacity: centersData.centers?.reduce((sum: number, center: any) => sum + (center.capacity || 0), 0) || 0,
        activeCenters: centersData.centers?.filter((center: any) => center.is_active).length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
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

  const quickActions = [
    {
      title: 'Manage Countries',
      description: 'Add, edit, or remove countries',
      icon: Globe,
      href: '/admin/locations/countries',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Manage Regions',
      description: 'Organize regions within countries',
      icon: MapPin,
      href: '/admin/locations/regions',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Manage Areas',
      description: 'Set up areas within regions',
      icon: Building2,
      href: '/admin/locations/areas',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Manage Exam Centers',
      description: 'Configure exam centers and capacity',
      icon: Users,
      href: '/admin/locations/centers',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const statCards = [
    {
      title: 'Countries',
      value: stats.countries,
      icon: Globe,
      color: 'bg-blue-500'
    },
    {
      title: 'Regions',
      value: stats.regions,
      icon: MapPin,
      color: 'bg-green-500'
    },
    {
      title: 'Areas',
      value: stats.areas,
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: 'Exam Centers',
      value: stats.centers,
      icon: Users,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Location Management</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Manage countries, regions, areas, and exam centers
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchStats}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto justify-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Refresh Stats</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-md ${stat.color}`}>
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Capacity Overview */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Capacity Overview</h3>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalCapacity}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.activeCenters}</p>
              <p className="text-xs sm:text-sm text-gray-600">Active Centers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {stats.centers > 0 ? Math.round((stats.activeCenters / stats.centers) * 100) : 0}%
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Active Rate</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(action.href)}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-md ${action.color}`}>
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                  {action.description}
                </p>
                <button
                  className={`w-full ${action.color} text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors`}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Manage</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Quick Access</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/admin/locations/hierarchy')}
                className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-3 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">View Hierarchy</p>
                  <p className="text-xs sm:text-sm text-gray-600">See complete location structure</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-3 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Manage Users</p>
                  <p className="text-xs sm:text-sm text-gray-600">Assign users to locations</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
