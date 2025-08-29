'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  User, 
  FileText, 
  BarChart3, 
  Award, 
  BookOpen, 
  BookMarked,
  Users, 
  Upload, 
  LogOut, 
  Menu, 
  X, 
  FileCheck,
  Building2,
  ClipboardList
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const getNavigation = () => {
    const userType = profile?.user_type || 'user'
    
    switch (userType) {
      case 'coordinator':
        return [
          {
            name: 'Dashboard',
            href: '/dashboard/coordinator',
            icon: Home,
            current: pathname === '/dashboard/coordinator'
          },
          {
            name: 'Attendance',
            href: '/dashboard/coordinator/attendance',
            icon: ClipboardList,
            current: pathname.startsWith('/dashboard/coordinator/attendance')
          },
          {
            name: 'Progress',
            href: '/dashboard/coordinator/progress',
            icon: BarChart3,
            current: pathname.startsWith('/dashboard/coordinator/progress')
          },
          {
            name: 'Books',
            href: '/dashboard/coordinator/books',
            icon: BookOpen,
            current: pathname.startsWith('/dashboard/coordinator/books')
          }
        ]
      
      case 'convener':
        return [
          {
            name: 'Dashboard',
            href: '/dashboard/convener',
            icon: Home,
            current: pathname === '/dashboard/convener'
          },
          {
            name: 'Centers',
            href: '/dashboard/convener/centers',
            icon: Building2,
            current: pathname.startsWith('/dashboard/convener/centers')
          },
          {
            name: 'Reports',
            href: '/dashboard/convener/reports',
            icon: FileText,
            current: pathname.startsWith('/dashboard/convener/reports')
          }
        ]
      
      case 'admin':
      case 'super_admin':
        return [
          {
            name: 'Dashboard',
            href: '/admin',
            icon: Home,
            current: pathname === '/admin'
          },
          {
            name: 'Users',
            href: '/admin/users',
            icon: Users,
            current: pathname.startsWith('/admin/users')
          },
          {
            name: 'Exams',
            href: '/admin/exams',
            icon: BookOpen,
            current: pathname.startsWith('/admin/exams')
          },
          {
            name: 'Questions',
            href: '/admin/questions',
            icon: FileText,
            current: pathname.startsWith('/admin/questions')
          },
          {
            name: 'Evaluation',
            href: '/admin/evaluation',
            icon: Award,
            current: pathname.startsWith('/admin/evaluation')
          },
          {
            name: 'Resources',
            href: '/admin/resources',
            icon: Upload,
            current: pathname.startsWith('/admin/resources')
          },
          {
            name: 'Reports',
            href: '/admin/reports',
            icon: BarChart3,
            current: pathname.startsWith('/admin/reports')
          }
        ]
      
      default: // user
        return [
          {
            name: 'Dashboard',
            href: '/dashboard/user',
            icon: Home,
            current: pathname === '/dashboard/user'
          },
          {
            name: 'Profile',
            href: '/dashboard/user/profile',
            icon: User,
            current: pathname.startsWith('/dashboard/user/profile')
          },
          {
            name: 'Exams',
            href: '/dashboard/user/exams',
            icon: FileText,
            current: pathname.startsWith('/dashboard/user/exams')
          },
          // {
          //   name: 'Mock Exams',
          //   href: '/dashboard/user/mock-exams',
          //   icon: BookMarked,
          //   current: pathname.startsWith('/dashboard/user/mock-exams')
          // },
          {
            name: 'History',
            href: '/dashboard/user/history',
            icon: BarChart3,
            current: pathname.startsWith('/dashboard/user/history')
          },
          {
            name: 'Certificates',
            href: '/dashboard/user/certificates',
            icon: Award,
            current: pathname.startsWith('/dashboard/user/certificates')
          }
        ]
    }
  }

  const navigation = getNavigation()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">QHLC</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {profile?.user_type || 'user'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <div className="relative">
                  <FileCheck className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </div>
              </button>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 