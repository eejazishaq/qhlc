'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'

export default function TestDebugPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDebug = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await authenticatedFetch('/api/debug-users')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Debug test failed:', error)
      setDebugData({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(profile?.user_type || '')) {
      testDebug()
    }
  }, [user, profile])

  if (authLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Users Database</h1>
      
      {debugData ? (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold">Database Summary:</h2>
            <p>Total Count: {debugData.totalCount}</p>
            <p>All Profiles (with RLS): {debugData.allProfiles}</p>
            <p>Service Profiles (bypass RLS): {debugData.serviceProfiles}</p>
            <p>Auth Users: {debugData.authUsers}</p>
            <p>Users Without Profiles: {debugData.usersWithoutProfiles}</p>
          </div>

          {debugData.countError && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">Count Error:</h3>
              <p className="text-red-700">{debugData.countError}</p>
            </div>
          )}

          {debugData.allError && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">All Profiles Error:</h3>
              <p className="text-red-700">{debugData.allError}</p>
            </div>
          )}

          {debugData.serviceError && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">Service Role Error:</h3>
              <p className="text-red-700">{debugData.serviceError}</p>
            </div>
          )}

          {debugData.authError && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">Auth Users Error:</h3>
              <p className="text-red-700">{debugData.authError}</p>
            </div>
          )}

          {debugData.usersError && (
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-semibold text-red-800">Users Without Profiles Error:</h3>
              <p className="text-red-700">{debugData.usersError}</p>
            </div>
          )}

          {debugData.authUsersData && debugData.authUsersData.length > 0 && (
            <div className="bg-yellow-100 p-4 rounded">
              <h3 className="font-semibold text-yellow-800">Auth Users ({debugData.authUsersData.length}):</h3>
              <div className="mt-2 space-y-2">
                {debugData.authUsersData.map((authUser: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded text-sm">
                    <p><strong>ID:</strong> {authUser.id}</p>
                    <p><strong>Email:</strong> {authUser.email}</p>
                    <p><strong>Created:</strong> {new Date(authUser.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debugData.usersWithoutProfilesData && debugData.usersWithoutProfilesData.length > 0 && (
            <div className="bg-orange-100 p-4 rounded">
              <h3 className="font-semibold text-orange-800">Users Without Profiles ({debugData.usersWithoutProfilesData.length}):</h3>
              <div className="mt-2 space-y-2">
                {debugData.usersWithoutProfilesData.map((user: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded text-sm">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debugData.profiles && debugData.profiles.length > 0 && (
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-semibold text-green-800">Profiles Found ({debugData.profiles.length}):</h3>
              <div className="mt-2 space-y-2">
                {debugData.profiles.map((profile: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded text-sm">
                    <p><strong>ID:</strong> {profile.id}</p>
                    <p><strong>Name:</strong> {profile.full_name}</p>
                    <p><strong>Type:</strong> {profile.user_type}</p>
                    <p><strong>Active:</strong> {profile.is_active ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-semibold text-blue-800">Current User Profile:</h3>
            <pre className="text-sm mt-2">{JSON.stringify(debugData.currentProfile, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div>No debug data available</div>
      )}
    </div>
  )
} 