'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { authenticatedFetch } from '@/lib/utils/api'
import { 
  BarChart3, 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp, 
  PieChart,
  RefreshCw,
  Filter,
  Activity
} from 'lucide-react'

// Import custom components
import { ChartCard } from '@/components/admin/reports/ChartCard'
import { KPICard } from '@/components/admin/reports/KPICard'
import { UserGrowthChart } from '@/components/admin/reports/UserGrowthChart'
import { UserDistributionChart } from '@/components/admin/reports/UserDistributionChart'
import { PerformanceChart } from '@/components/admin/reports/PerformanceChart'

interface AnalyticsData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    usersByType: Record<string, number>
  }
  examStats: {
    totalExams: number
    activeExams: number
    totalUserExams: number
    completedExams: number
    completionRate: number
    averageScore: number
  }
  locationStats: {
    totalCenters: number
    activeCenters: number
    usersByLocation: any[]
  }
  performanceStats: {
    performanceByType: Record<string, number>
    totalPerformances: number
  }
  trends: {
    dailyData: Array<{
      date: string
      users: number
      exams: number
    }>
  }
}

export default function AdminReportsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [locationFilter, setLocationFilter] = useState({
    locationId: '',
    locationType: '',
    userType: ''
  })
  const [locations, setLocations] = useState({
    countries: [] as any[],
    regions: [] as any[],
    areas: [] as any[],
    centers: [] as any[]
  })

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

  const fetchLocations = async () => {
    try {
      const [countriesRes, regionsRes, areasRes, centersRes] = await Promise.all([
        authenticatedFetch('/api/admin/locations/countries'),
        authenticatedFetch('/api/admin/locations/regions'),
        authenticatedFetch('/api/admin/locations/areas'),
        authenticatedFetch('/api/admin/locations/centers')
      ])

      const [countries, regions, areas, centers] = await Promise.all([
        countriesRes.ok ? countriesRes.json() : { data: [] },
        regionsRes.ok ? regionsRes.json() : { data: [] },
        areasRes.ok ? areasRes.json() : { data: [] },
        centersRes.ok ? centersRes.json() : { data: [] }
      ])

      setLocations({
        countries: countries.data || [],
        regions: regions.data || [],
        areas: areas.data || [],
        centers: centers.data || []
      })
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoadingData(true)
      const url = new URL('/api/admin/reports/analytics', window.location.origin)
      
      // Add date filters
      if (dateRange.startDate) url.searchParams.set('startDate', dateRange.startDate)
      if (dateRange.endDate) url.searchParams.set('endDate', dateRange.endDate)
      
      // Add location filters
      if (locationFilter.locationId && locationFilter.locationType) {
        url.searchParams.set('locationId', locationFilter.locationId)
        url.searchParams.set('locationType', locationFilter.locationType)
      }
      
      // Add user type filter
      if (locationFilter.userType) {
        url.searchParams.set('userType', locationFilter.userType)
      }

      const response = await authenticatedFetch(url.toString())
      
      if (response.ok) {
        const result = await response.json()
        setAnalyticsData(result.data)
      } else {
        console.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoadingData(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '')) {
      fetchLocations() // Fetch locations first
      fetchAnalyticsData()
    }
  }, [user, profile, dateRange, locationFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalyticsData()
  }

  const handleExport = async (type: string) => {
    try {
      const url = new URL('/api/admin/reports/export', window.location.origin)
      url.searchParams.set('type', type)
      
      // Add current filters
      if (dateRange.startDate) url.searchParams.set('startDate', dateRange.startDate)
      if (dateRange.endDate) url.searchParams.set('endDate', dateRange.endDate)
      if (locationFilter.locationId && locationFilter.locationType) {
        url.searchParams.set('locationId', locationFilter.locationId)
        url.searchParams.set('locationType', locationFilter.locationType)
      }
      if (locationFilter.userType) {
        url.searchParams.set('userType', locationFilter.userType)
      }

      const response = await authenticatedFetch(url.toString())
      
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        console.error('Export failed')
        alert('Export failed. Please try again.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
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

  // Prepare chart data
  const userDistributionData = analyticsData ? Object.entries(analyticsData.userStats.usersByType).map(([type, count], index) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: [
      '#3b82f6', // blue
      '#10b981', // green  
      '#f59e0b', // yellow
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4'  // cyan
    ][index % 6]
  })) : []

  // Fix performance data - ensure we handle cases where performanceByType might be empty
  const performanceData = analyticsData && analyticsData.performanceStats.performanceByType ? 
    Object.entries(analyticsData.performanceStats.performanceByType)
      .filter(([type, score]) => score > 0) // Only include types with actual scores
      .map(([type, score], index) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          score: Math.round(score),
          total: analyticsData.performanceStats.totalPerformances,
          color: colors[index % colors.length]
        }
      }) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your QHLC platform</p>
            </div>
            <div className="flex items-center flex-wrap gap-4">
              {/* Date Filters */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location Filters */}
              <select
                value={locationFilter.locationType}
                onChange={(e) => {
                  setLocationFilter(prev => ({ 
                    ...prev, 
                    locationType: e.target.value,
                    locationId: '' // Reset location ID when type changes
                  }))
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                <option value="country_id">Country</option>
                <option value="region_id">Region</option>
                <option value="area_id">Area</option>
                <option value="center_id">Center</option>
              </select>

              {/* Location Selection */}
              {locationFilter.locationType && (
                <select
                  value={locationFilter.locationId}
                  onChange={(e) => setLocationFilter(prev => ({ ...prev, locationId: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select {locationFilter.locationType.replace('_id', '').replace('_', ' ')}</option>
                  {(locationFilter.locationType === 'country_id' ? locations.countries :
                    locationFilter.locationType === 'region_id' ? locations.regions :
                    locationFilter.locationType === 'area_id' ? locations.areas :
                    locationFilter.locationType === 'center_id' ? locations.centers : []).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              )}

              {/* User Type Filter */}
              <select
                value={locationFilter.userType}
                onChange={(e) => setLocationFilter(prev => ({ ...prev, userType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All User Types</option>
                <option value="user">Students</option>
                <option value="coordinator">Coordinators</option>
                <option value="convener">Conveners</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Users"
            value={analyticsData?.userStats.totalUsers || 0}
            change={{ value: 12, trend: 'up' }}
            icon={Users}
            iconColor="text-white"
            iconBgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            gradient="from-blue-500 to-blue-600"
            isLoading={loadingData}
          />
          <KPICard
            title="Active Users"
            value={analyticsData?.userStats.activeUsers || 0}
            change={{ value: 8, trend: 'up' }}
            icon={Activity}
            iconColor="text-white"
            iconBgColor="bg-gradient-to-br from-green-500 to-green-600"
            gradient="from-green-500 to-green-600"
            isLoading={loadingData}
          />
          <KPICard
            title="Exam Completions"
            value={`${analyticsData?.examStats.completionRate || 0}%`}
            change={{ value: 5, trend: 'up' }}
            icon={TrendingUp}
            iconColor="text-white"
            iconBgColor="bg-gradient-to-br from-yellow-500 to-orange-500"
            gradient="from-yellow-500 to-orange-500"
            isLoading={loadingData}
          />
          <KPICard
            title="Average Score"
            value={`${analyticsData?.examStats.averageScore || 0}%`}
            change={{ value: 3, trend: 'up' }}
            icon={BarChart3}
            iconColor="text-white"
            iconBgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            gradient="from-purple-500 to-purple-600"
            isLoading={loadingData}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <ChartCard
            title="User Growth & Exam Trends"
            description="Daily user registrations and exam completions over the last 30 days"
            onRefresh={handleRefresh}
            onExport={() => handleExport('trends')}
            isLoading={loadingData}
          >
            <UserGrowthChart 
              data={analyticsData?.trends.dailyData || []} 
              isLoading={loadingData}
            />
          </ChartCard>

          {/* User Distribution Chart */}
          <ChartCard
            title="User Distribution by Type"
            description="Distribution of users across different roles and types"
            onRefresh={handleRefresh}
            onExport={() => handleExport('user-distribution')}
            isLoading={loadingData}
          >
            <UserDistributionChart 
              data={userDistributionData} 
              isLoading={loadingData}
            />
          </ChartCard>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance by Exam Type */}
          <ChartCard
            title="Performance by Exam Type"
            description="Average scores across different exam types"
            onRefresh={handleRefresh}
            onExport={() => handleExport('performance')}
            isLoading={loadingData}
          >
            <PerformanceChart 
              data={performanceData} 
              isLoading={loadingData}
            />
          </ChartCard>

          {/* Additional Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
              <p className="text-sm text-gray-600 mt-1">Key system metrics and statistics</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Exam Centers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.locationStats.totalCenters || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Active Centers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData?.locationStats.activeCenters || 0}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Exams Taken</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData?.examStats.totalUserExams || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData?.examStats.completedExams || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Users (30 days)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData?.userStats.newUsers || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                      <p className="text-2xl font-bold text-green-600">+12%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Report Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Reports</h3>
            <p className="text-gray-600 mb-4">Registration, activity, and profile reports</p>
            <button 
              onClick={() => handleExport('users')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Reports</h3>
            <p className="text-gray-600 mb-4">Performance, results, and participation reports</p>
            <button 
              onClick={() => handleExport('exams')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Reports</h3>
            <p className="text-gray-600 mb-4">Create custom reports with advanced filters</p>
            <button 
              onClick={() => handleExport('custom')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Create Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 