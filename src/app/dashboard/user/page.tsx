'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { BookOpen, Calendar, Award, Clock, User, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function UserDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Dashboard stats state
  const [stats, setStats] = useState({
    totalExams: null as number | null,
    certificates: null as number | null,
    studyHours: null as number | null,
    progress: null as number | null,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch dashboard stats from Supabase
  useEffect(() => {
    if (!user) return
    const supabase = createClientComponentClient()
    setStatsLoading(true)
    setStatsError(null)

    Promise.all([
      // Total Exams
      supabase
        .from('user_exams')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      // Certificates
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      // Study Hours (sum of exam durations for completed exams)
      supabase
        .from('user_exams')
        .select('exam_id, exams(duration)', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      // Progress (percentage memorized)
      supabase
        .from('progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'memorized'),
      supabase
        .from('progress')
        .select('id')
        .eq('user_id', user.id),
    ])
      .then(async ([examsRes, certsRes, studyRes, memorizedRes, allProgressRes]) => {
        // Total Exams
        const totalExams = examsRes.count ?? 0
        // Certificates
        const certificates = certsRes.count ?? 0
        // Study Hours
        let studyHours = 0
        if (studyRes.data && Array.isArray(studyRes.data)) {
          // Each row: { duration } or { exams: [{ duration }] }
          studyHours = studyRes.data.reduce((sum, row) => {
            if (typeof row.duration === 'number') return sum + row.duration
            if (Array.isArray(row.exams) && row.exams.length > 0 && typeof row.exams[0].duration === 'number') {
              return sum + row.exams[0].duration
            }
            return sum
          }, 0)
        }
        // Progress
        const memorized = memorizedRes.data?.length ?? 0
        const allProgress = allProgressRes.data?.length ?? 0
        const progress = allProgress > 0 ? Math.round((memorized / allProgress) * 100) : 0
        setStats({ totalExams, certificates, studyHours, progress })
        setStatsLoading(false)
      })
      .catch((err) => {
        setStatsError('Failed to load stats')
        setStatsLoading(false)
      })
  }, [user])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name || 'User'}!</h1>
              <p className="text-gray-600">Manage your Quranic learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.totalExams ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.certificates ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.studyHours ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `${stats.progress ?? 0}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/user/exams" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Take Exam</h3>
                  <p className="text-gray-600">Start a new exam or continue existing one</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/user/mock-exams" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mock Exams</h3>
                  <p className="text-gray-600">Practice with mock exams</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/user/profile" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                  <p className="text-gray-600">Update your personal information</p>
                </div>
                <User className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Start your learning journey by taking an exam</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 