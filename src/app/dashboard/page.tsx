'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on user role
        if (profile?.user_type === 'coordinator') {
          router.push('/dashboard/coordinator')
        } else if (profile?.user_type === 'convener') {
          router.push('/dashboard/convener')
        } else if (['admin', 'super_admin'].includes(profile?.user_type || '')) {
          router.push('/admin')
        } else {
          // Default to user dashboard
          router.push('/dashboard/user')
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }
  }, [user, profile, loading, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
} 