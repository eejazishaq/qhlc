'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'

export default function DebugPage() {
  const { user, profile } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await authenticatedFetch('/api/debug')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch debug data')
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      console.error('Error fetching debug data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '')) {
      fetchDebugData()
    }
  }, [user, profile])

  if (!user || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Debug</h1>
        
        <div className="mb-6">
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Debug Data'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {debugData && (
          <div className="space-y-6">
            {/* Areas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas Table</h2>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Count: {debugData.areas.count}</span>
                {debugData.areas.error && (
                  <span className="text-sm text-red-600 ml-4">Error: {debugData.areas.error.message}</span>
                )}
              </div>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugData.areas.data, null, 2)}
              </pre>
            </div>

            {/* Centers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Centers Table</h2>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Count: {debugData.centers.count}</span>
                {debugData.centers.error && (
                  <span className="text-sm text-red-600 ml-4">Error: {debugData.centers.error.message}</span>
                )}
              </div>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugData.centers.data, null, 2)}
              </pre>
            </div>

            {/* Profiles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profiles Table</h2>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Count: {debugData.profiles.count}</span>
                {debugData.profiles.error && (
                  <span className="text-sm text-red-600 ml-4">Error: {debugData.profiles.error.message}</span>
                )}
              </div>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugData.profiles.data, null, 2)}
              </pre>
            </div>

            {/* Joined Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Joined Query (Profiles + Areas + Centers)</h2>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Count: {debugData.joinedData.count}</span>
                {debugData.joinedData.error && (
                  <span className="text-sm text-red-600 ml-4">Error: {debugData.joinedData.error.message}</span>
                )}
              </div>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugData.joinedData.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 