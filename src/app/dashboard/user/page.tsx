'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Calendar, Award, Clock, User, BarChart3, TrendingUp, CheckCircle, AlertCircle, GraduationCap, RefreshCw } from 'lucide-react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { authenticatedFetch } from '@/lib/utils/api'

export default function UserDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Dashboard stats state
  const [stats, setStats] = useState({
    totalExams: null as number | null,
    completedExams: null as number | null,
    certificates: null as number | null,
    studyHours: null as number | null,
    progress: null as number | null,
    averageScore: null as number | null,
    lastExamDate: null as string | null,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch dashboard stats and recent activity
  useEffect(() => {
    if (!user) return
    
    const fetchDashboardData = async () => {
      setStatsLoading(true)
      setActivityLoading(true)
      setStatsError(null)

      try {
        // Fetch stats and recent activity in parallel
        const [statsPromise, activityPromise] = await Promise.allSettled([
          fetchDashboardStats(),
          fetchRecentActivity()
        ])

        if (statsPromise.status === 'fulfilled') {
          setStats(statsPromise.value)
        }

        if (activityPromise.status === 'fulfilled') {
          setRecentActivity(activityPromise.value)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setStatsError('Failed to load dashboard data')
      } finally {
        setStatsLoading(false)
        setActivityLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const handleRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    try {
      const [statsPromise, activityPromise] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchRecentActivity()
      ])

      if (statsPromise.status === 'fulfilled') {
        setStats(statsPromise.value)
      }

      if (activityPromise.status === 'fulfilled') {
        setRecentActivity(activityPromise.value)
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const fetchDashboardStats = async () => {
    const supabase = createClientComponentClient()

    const [
      totalExamsRes,
      completedExamsRes, 
      certificatesRes,
      studyHoursRes,
      progressRes,
      averageScoreRes,
      lastExamRes
    ] = await Promise.all([
      // Total Exams
      supabase
        .from('user_exams')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      // Completed Exams
      supabase
        .from('user_exams')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'completed'),
      // Certificates
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      // Study Hours
      supabase
        .from('user_exams')
        .select('exam_id, exams(duration)')
        .eq('user_id', user!.id)
        .eq('status', 'completed'),
      // Progress
      supabase
        .from('progress')
        .select('id, status')
        .eq('user_id', user!.id),
      // Average Score
      supabase
        .from('user_exams')
        .select('total_score, exams(total_marks)')
        .eq('user_id', user!.id)
        .not('total_score', 'is', null)
        .eq('status', 'completed'),
      // Last Exam Date
      supabase
        .from('user_exams')
        .select('submitted_at')
        .eq('user_id', user!.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(1)
    ])

    // Calculate stats
    const totalExams = totalExamsRes.count ?? 0
    const completedExams = completedExamsRes.count ?? 0
    const certificates = certificatesRes.count ?? 0

    // Study Hours calculation
    let studyHours = 0
    if (studyHoursRes.data && Array.isArray(studyHoursRes.data)) {
      studyHours = studyHoursRes.data.reduce((sum, row) => {
        if (row.exams && Array.isArray(row.exams) && row.exams.length > 0) {
          return sum + (row.exams[0].duration || 0)
        }
        return sum
      }, 0)
    }

    // Progress calculation
    let progress = 0
    if (progressRes.data && progressRes.data.length > 0) {
      const memorized = progressRes.data.filter(p => p.status === 'memorized').length
      progress = Math.round((memorized / progressRes.data.length) * 100)
    }

    // Average Score calculation
    let averageScore = 0
    if (averageScoreRes.data && averageScoreRes.data.length > 0) {
      const totalScore = averageScoreRes.data.reduce((sum, exam) => {
        if (exam.total_score && exam.exams && exam.exams.length > 0) {
          const percentage = (exam.total_score / exam.exams[0].total_marks) * 100
          return sum + percentage
        }
        return sum
      }, 0)
      averageScore = Math.round(totalScore / averageScoreRes.data.length)
    }

    // Last Exam Date
    const lastExamDate = lastExamRes.data && lastExamRes.data.length > 0 
      ? lastExamRes.data[0].submitted_at 
      : null

    return {
      totalExams,
      completedExams,
      certificates,
      studyHours: Math.round(studyHours / 60), // Convert minutes to hours
      progress,
      averageScore,
      lastExamDate
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const activities: any[] = []

      try {
        // Fetch recent user exams
        const userExamsResponse = await authenticatedFetch('/api/user-exams?limit=5')
        if (userExamsResponse.ok) {
          const userExamsData = await userExamsResponse.json()
          
          // Process recent exams
          if (userExamsData.userExams && Array.isArray(userExamsData.userExams)) {
            userExamsData.userExams.forEach((exam: any) => {
              if (exam.exam && exam.exam.title) {
                activities.push({
                  id: exam.id,
                  type: 'exam',
                  title: exam.exam.title,
                  description: `Exam ${exam.status === 'completed' ? 'completed' : exam.status}`,
                  date: exam.submitted_at || exam.started_at || exam.created_at,
                  status: exam.status,
                  score: exam.total_score,
                  icon: exam.status === 'completed' ? CheckCircle : AlertCircle,
                  color: exam.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                })
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user exams for activity:', error)
      }

      try {
        // Fetch recent certificates
        const certificatesResponse = await authenticatedFetch('/api/certificates?limit=5')
        if (certificatesResponse.ok) {
          const certificatesData = await certificatesResponse.json()
          
          // Process recent certificates
          if (certificatesData.certificates && Array.isArray(certificatesData.certificates)) {
            certificatesData.certificates.forEach((cert: any) => {
              if (cert.title) {
                activities.push({
                  id: cert.id,
                  type: 'certificate',
                  title: cert.title,
                  description: 'Certificate earned',
                  date: cert.issued_at || cert.created_at,
                  status: 'earned',
                  icon: Award,
                  color: 'text-yellow-600'
                })
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching certificates for activity:', error)
      }

      // Sort by date and take the 5 most recent
      return activities
        .filter(activity => activity.date) // Filter out activities without dates
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Welcome back, {profile?.full_name || 'User'}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage your Quranic learning journey
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {statsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{statsError}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex items-center justify-center">
                <Logo width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Exams</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : (
                    stats.totalExams ?? 0
                  )}
                </p>
                {stats.completedExams !== null && !statsLoading && (
                  <p className="text-xs text-gray-500">
                    {stats.completedExams} completed
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Average Score</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    `${stats.averageScore ?? 0}%`
                  )}
                </p>
                {stats.lastExamDate && !statsLoading && (
                  <p className="text-xs text-gray-500">
                    Last: {new Date(stats.lastExamDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Certificates</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : (
                    stats.certificates ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500">Earned</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    `${stats.progress ?? 0}%`
                  )}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.progress ?? 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Link href="/dashboard/user/exams" className="block">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Take Exam
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Start a new exam or continue existing one</p>
                </div>
                <Logo width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ml-3" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/user/history" className="block">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    Exam History
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">View your exam results and performance</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-3" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/user/profile" className="block">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Profile
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Update your personal information</p>
                </div>
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-3" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/user/certificates" className="block">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    Certificates
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">View and download your certificates</p>
                </div>
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0 ml-3" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
              {recentActivity.length > 0 && (
                <Link 
                  href="/dashboard/user/history" 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View all
                  <Calendar className="w-4 h-4 ml-1" />
                </Link>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="bg-gray-200 rounded-full h-8 w-8"></div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                      <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const IconComponent = activity.icon
                  return (
                    <div 
                      key={activity.id || index} 
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className={`flex-shrink-0 p-2 rounded-full ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <IconComponent className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.description}
                        </p>
                        {activity.score !== null && activity.score !== undefined && (
                          <p className="text-xs text-gray-400 mt-1">
                            Score: {activity.score}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium mb-1">No recent activity</p>
                <p className="text-xs text-gray-400 mb-4">Start your learning journey by taking an exam</p>
                <Link 
                  href="/dashboard/user/exams"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Logo width={16} height={16} className="w-4 h-4 mr-2" />
                  Take an Exam
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 