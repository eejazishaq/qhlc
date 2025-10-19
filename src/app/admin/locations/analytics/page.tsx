'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Globe, 
  Building2, 
  Download,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react'

interface LocationAnalytics {
  locationStats: {
    total: {
      countries: number
      regions: number
      areas: number
      centers: number
      users: number
      totalCapacity: number
    }
    active: {
      countries: number
      regions: number
      areas: number
      centers: number
      users: number
    }
  }
  capacityUtilization: Array<{
    id: string
    name: string
    capacity: number
    areaName: string
    regionName: string
    countryName: string
    utilization: number
    utilizationPercentage: number
  }>
  usersByLocation: {
    byCountry: Record<string, number>
    byRegion: Record<string, number>
    byArea: Record<string, number>
    byCenter: Record<string, number>
    byUserType: Record<string, number>
  }
  examPerformance: {
    byCountry: Record<string, { total: number; sum: number; avg: number }>
    byRegion: Record<string, { total: number; sum: number; avg: number }>
    byArea: Record<string, { total: number; sum: number; avg: number }>
    byCenter: Record<string, { total: number; sum: number; avg: number }>
  }
  recentActivity: {
    newUsers: number
    newCenters: number
    newExams: number
  }
}

export default function LocationAnalyticsPage() {
  const { user, profile } = useAuth()
  const [analytics, setAnalytics] = useState<LocationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'capacity' | 'users' | 'performance'>('overview')

  useEffect(() => {
    if (profile?.user_type === 'admin' || profile?.user_type === 'super_admin') {
      fetchAnalytics()
    }
  }, [profile])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/locations/analytics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    if (!analytics) return

    const exportData = {
      generatedAt: new Date().toISOString(),
      locationStats: analytics.locationStats,
      capacityUtilization: analytics.capacityUtilization,
      usersByLocation: analytics.usersByLocation,
      examPerformance: analytics.examPerformance,
      recentActivity: analytics.recentActivity
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `location-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
    title: string
    value: number | string
    subtitle?: string
    icon: any
    color: string
    trend?: { value: number; isPositive: boolean }
  }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 sm:p-3 rounded-md ${color}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Location Analytics</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Comprehensive analytics and insights for location management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleExportData}
                disabled={!analytics}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'capacity', name: 'Capacity', icon: Building2 },
                { id: 'users', name: 'Users', icon: Users },
                { id: 'performance', name: 'Performance', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedView(tab.id as any)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      selectedView === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : analytics ? (
          <>
            {/* Overview Tab */}
            {selectedView === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <StatCard
                    title="Total Countries"
                    value={analytics.locationStats.total.countries}
                    icon={Globe}
                    color="bg-blue-500"
                    subtitle={`${analytics.locationStats.active.countries} active`}
                  />
                  <StatCard
                    title="Total Regions"
                    value={analytics.locationStats.total.regions}
                    icon={MapPin}
                    color="bg-green-500"
                    subtitle={`${analytics.locationStats.active.regions} active`}
                  />
                  <StatCard
                    title="Total Areas"
                    value={analytics.locationStats.total.areas}
                    icon={Building2}
                    color="bg-purple-500"
                    subtitle={`${analytics.locationStats.active.areas} active`}
                  />
                  <StatCard
                    title="Exam Centers"
                    value={analytics.locationStats.total.centers}
                    icon={Users}
                    color="bg-orange-500"
                    subtitle={`${analytics.locationStats.total.totalCapacity} total capacity`}
                  />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 30 Days)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics.recentActivity.newUsers}</div>
                      <div className="text-sm text-gray-600">New Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.recentActivity.newCenters}</div>
                      <div className="text-sm text-gray-600">New Centers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.recentActivity.newExams}</div>
                      <div className="text-sm text-gray-600">New Exams</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Capacity Tab */}
            {selectedView === 'capacity' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Utilization</h3>
                  <div className="overflow-x-auto">
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
                            Utilization
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.capacityUtilization.map((center) => (
                          <tr key={center.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {center.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {center.areaName}, {center.regionName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {center.capacity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {center.utilization}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      center.utilizationPercentage >= 90 
                                        ? 'bg-red-500' 
                                        : center.utilizationPercentage >= 70 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(center.utilizationPercentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">{center.utilizationPercentage}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {selectedView === 'users' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Users by Country */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Country</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.usersByLocation.byCountry)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([country, count]) => (
                        <div key={country} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{country}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users by Type */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Type</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.usersByLocation.byUserType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {selectedView === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance by Country */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Performance by Country</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.examPerformance.byCountry)
                        .filter(([, data]) => data.total > 0)
                        .sort(([,a], [,b]) => b.avg - a.avg)
                        .slice(0, 10)
                        .map(([country, data]) => (
                        <div key={country} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-600">{country}</span>
                            <div className="text-xs text-gray-500">{data.total} exams</div>
                          </div>
                          <span className="font-semibold text-gray-900">{data.avg}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance by Region */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Performance by Region</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.examPerformance.byRegion)
                        .filter(([, data]) => data.total > 0)
                        .sort(([,a], [,b]) => b.avg - a.avg)
                        .slice(0, 10)
                        .map(([region, data]) => (
                        <div key={region} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-600">{region}</span>
                            <div className="text-xs text-gray-500">{data.total} exams</div>
                          </div>
                          <span className="font-semibold text-gray-900">{data.avg}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
            <p className="mt-1 text-sm text-gray-500">Unable to load analytics data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
