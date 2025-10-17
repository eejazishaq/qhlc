'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  FileText, 
  HelpCircle, 
  BarChart3, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  Settings,
  LogOut,
  Menu,
  X,
  Image,
  ImageIcon,
  BookOpen,
  Home,
  Award,
  GraduationCap
} from 'lucide-react'

export default function AdminLayout({
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
    // Check if user has admin role
    if (!loading && profile && !['admin', 'super_admin'].includes(profile.user_type)) {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/admin', icon: Home }
      ]
    },
    {
      group: 'User Management',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Transfer Tool', href: '/admin/transfer', icon: ArrowRight }
      ]
    },
    {
      group: 'Exam Management',
      items: [
        { name: 'Exams', href: '/admin/exams', icon: FileText },
        { name: 'Questions', href: '/admin/questions', icon: HelpCircle },
        { name: 'Evaluation', href: '/admin/evaluation', icon: CheckCircle }
      ]
    },
    {
      group: 'Course Management',
      items: [
        { name: 'Classes', href: '/admin/classes', icon: GraduationCap },
        { name: 'Books', href: '/admin/books', icon: BookOpen }
      ]
    },
    {
      group: 'Content Management',
      items: [
        { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
        { name: 'Resources', href: '/admin/resources', icon: Upload },
        { name: 'Gallery', href: '/admin/gallery', icon: Image }
      ]
    },
    {
      group: 'Analytics & Reports',
      items: [
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 }
      ]
    }
  ]

  // if (loading || !mounted) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   )
  // }

  if (!user || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
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
                <span className="text-white font-semibold text-lg">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {profile?.user_type || 'admin'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 mt-6 px-3 overflow-y-auto">
            <div className="space-y-6">
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.group}>
                  {/* Group Header */}
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.group}
                    </h3>
                  </div>
                  
                  {/* Group Items */}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`} />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                  
                  {/* Separator (not for last group) */}
                  {groupIndex < navigationGroups.length - 1 && (
                    <div className="mt-4 border-t border-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
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
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome back, {profile?.full_name || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 