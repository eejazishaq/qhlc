'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { BarChart3, Download, FileText, Users, Calendar, TrendingUp, PieChart } from 'lucide-react'

export default function AdminReportsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(true)

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
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '')) {
      // TODO: Fetch reports from Supabase
      setLoadingReports(false)
    }
  }, [user, profile])

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view system reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Score</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Reports</h3>
          <p className="text-gray-600 mb-4">Registration, activity, and profile reports</p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Reports</h3>
          <p className="text-gray-600 mb-4">Performance, results, and participation reports</p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600 mb-4">Trends, patterns, and insights</p>
          <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Center Reports</h3>
          <p className="text-gray-600 mb-4">Center-wise performance and statistics</p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Reports</h3>
          <p className="text-gray-600 mb-4">Attendance tracking and patterns</p>
          <button className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Reports</h3>
          <p className="text-gray-600 mb-4">Create custom reports with filters</p>
          <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Create Report
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        <div className="p-6">
          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 