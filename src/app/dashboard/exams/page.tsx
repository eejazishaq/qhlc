'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard/user/exams')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
} 