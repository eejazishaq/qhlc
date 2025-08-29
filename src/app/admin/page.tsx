'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  BookOpen, 
  FileText, 
  Award, 
  Settings, 
  BarChart3, 
  Building2, 
  Upload, 
  PieChart, 
  TrendingUp,
  Shield,
  Database,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  stats: {
    users: {
      totalUsers: number
      activeUsers: number
      newThisMonth: number
      roleStats: Record<string, number>
    }
    exams: {
      totalExams: number
      activeExams: number
      totalUserExams: number
      completedExams: number
      pendingEvaluation: number
    }
    questions: {
      totalQuestions: number
      activeQuestions: number
    }
    centers: {
      totalCenters: number
      activeCenters: number
    }
  }
  analytics: {
    userGrowth: number
    examCompletionRate: number
    systemUsage: number
  }
  recentActivity: {
    recentUsers: Array<{
      id: string
      full_name: string
      user_type: string
      created_at: string
    }>
    recentExams: Array<{
      id: string
      status: string
      completed_at: string
      user: { full_name: string }
      exam: { title: string }
    }>
  }
  systemHealth: {
    databaseStatus: string
    storageUsage: string
    activeSessions: number
  }
}

export default function AdminDashboard() {
  const { user, profile, loading, session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      fetchDashboardData()
    }
  }, [user, session])

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true)
      setError(null)
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoadingData(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System administration and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                disabled={loadingData}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {loadingData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>Refresh</span>
              </button>
              <div className="bg-red-100 p-2 rounded-full">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData?.stats.users.totalUsers || 0}
                </p>
                {dashboardData && (
                  <p className="text-xs text-green-600">
                    +{dashboardData.stats.users.newThisMonth} this month
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData?.stats.exams.activeExams || 0}
                </p>
                {dashboardData && (
                  <p className="text-xs text-gray-600">
                    {dashboardData.stats.exams.totalExams} total
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Building2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exam Centers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData?.stats.centers.activeCenters || 0}
                </p>
                {dashboardData && (
                  <p className="text-xs text-gray-600">
                    {dashboardData.stats.centers.totalCenters} total
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData?.stats.questions.activeQuestions || 0}
                </p>
                {dashboardData && (
                  <p className="text-xs text-gray-600">
                    {dashboardData.stats.questions.totalQuestions} total
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Evaluation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData?.stats.exams.pendingEvaluation || 0}
                </p>
                {dashboardData && (
                  <p className="text-xs text-gray-600">
                    {dashboardData.stats.exams.completedExams} completed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/users" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Users</h3>
                  <p className="text-gray-600">Add, edit, and manage user accounts</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/exams" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Exam Management</h3>
                  <p className="text-gray-600">Create and manage exams</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/questions" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
                  <p className="text-gray-600">Manage exam questions and answers</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/evaluation" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Evaluation</h3>
                  <p className="text-gray-600">Review and grade exam submissions</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/resources" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                  <p className="text-gray-600">Upload and manage learning resources</p>
                </div>
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/reports" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
                  <p className="text-gray-600">Generate system-wide reports</p>
                </div>
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/banners" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Banner Management</h3>
                  <p className="text-gray-600">Manage website banners and announcements</p>
                </div>
                <div className="w-8 h-8 text-orange-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dashboardData?.systemHealth.databaseStatus === 'Healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {loadingData ? '...' : dashboardData?.systemHealth.databaseStatus || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm font-medium text-gray-900">
                    {loadingData ? '...' : dashboardData?.systemHealth.storageUsage || '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {loadingData ? '...' : dashboardData?.systemHealth.activeSessions || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              {loadingData ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading recent activity...</p>
                </div>
              ) : !dashboardData?.recentActivity.recentUsers || 
                 !dashboardData?.recentActivity.recentExams ||
                 (dashboardData.recentActivity.recentUsers.length === 0 && 
                  dashboardData.recentActivity.recentExams.length === 0) ? (
                <div className="text-center text-gray-500 py-8">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start managing the system to see activity here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recent Users */}
                  {dashboardData?.recentActivity.recentUsers && dashboardData.recentActivity.recentUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Users</h4>
                      <div className="space-y-2">
                        {dashboardData.recentActivity.recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-blue-500 mr-2" />
                              <span className="font-medium">{user.full_name}</span>
                              <span className="text-gray-500 ml-2">({user.user_type})</span>
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recent Exams */}
                  {dashboardData?.recentActivity.recentExams && dashboardData.recentActivity.recentExams.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Exam Completions</h4>
                      <div className="space-y-2">
                        {dashboardData.recentActivity.recentExams.map((exam) => (
                          <div key={exam.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <span className="font-medium">{exam.user.full_name}</span>
                              <span className="text-gray-500 ml-2">- {exam.exam.title}</span>
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(exam.completed_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">User Growth</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {loadingData ? '...' : dashboardData?.analytics.userGrowth || 0}%
                </p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Exam Completion</h4>
                <p className="text-3xl font-bold text-green-600">
                  {loadingData ? '...' : dashboardData?.analytics.examCompletionRate || 0}%
                </p>
                <p className="text-sm text-gray-500">Success rate</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">System Usage</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {loadingData ? '...' : dashboardData?.analytics.systemUsage || 0}%
                </p>
                <p className="text-sm text-gray-500">Daily active users</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}