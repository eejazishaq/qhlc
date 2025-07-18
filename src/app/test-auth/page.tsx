'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const { user, session, loading, error } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [apiDebug, setApiDebug] = useState<any>(null)

  useEffect(() => {
    // Test direct Supabase calls
    const testSupabase = async () => {
      try {
        const { data: { session: directSession } } = await supabase.auth.getSession()
        const { data: { user: directUser } } = await supabase.auth.getUser()
        
        setDebugInfo({
          directSession: directSession ? {
            access_token: directSession.access_token ? 'present' : 'missing',
            refresh_token: directSession.refresh_token ? 'present' : 'missing',
            expires_at: directSession.expires_at,
            user_id: directSession.user?.id
          } : null,
          directUser: directUser ? {
            id: directUser.id,
            email: directUser.email
          } : null
        })
      } catch (error) {
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    // Test API route
    const testAPI = async () => {
      try {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setApiDebug({ error: 'No authentication token available' })
          return
        }

        const response = await fetch('/api/test-auth', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const data = await response.json()
        setApiDebug(data)
      } catch (error) {
        setApiDebug({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    testSupabase()
    testAPI()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* useAuth Hook State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">useAuth Hook State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>User:</strong> {user ? user.email : 'None'}</p>
            <p><strong>Session:</strong> {session ? 'Present' : 'None'}</p>
            {user && (
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Created:</strong> {user.created_at}</p>
              </div>
            )}
          </div>
        </div>

        {/* Direct Supabase Calls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Supabase Calls</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* API Route Test */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Route Test</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(apiDebug, null, 2)}
          </pre>
        </div>

        {/* Environment Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>

        {/* LocalStorage Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Check</h2>
          <div className="space-y-2">
            <p><strong>sb-kgangiolfxkwqkvbiwdb-auth-token:</strong> {typeof window !== 'undefined' && localStorage.getItem('sb-kgangiolfxkwqkvbiwdb-auth-token') ? 'Present' : 'Missing'}</p>
            <p><strong>qhlc-auth:</strong> {typeof window !== 'undefined' && localStorage.getItem('qhlc-auth') ? 'Present' : 'Missing'}</p>
            <p><strong>supabase.auth.token:</strong> {typeof window !== 'undefined' && localStorage.getItem('supabase.auth.token') ? 'Present' : 'Missing'}</p>
            <p><strong>All localStorage keys:</strong></p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
              {typeof window !== 'undefined' ? 
                Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('supabase')).join(', ') : 
                'Not available'
              }
            </pre>
          </div>
        </div>
      </div>

      {/* Test Login Form */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Login</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="test-email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="test-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={async () => {
              const email = (document.getElementById('test-email') as HTMLInputElement).value
              const password = (document.getElementById('test-password') as HTMLInputElement).value
              
              if (!email || !password) {
                alert('Please enter email and password')
                return
              }

              // Test direct Supabase login
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
              })
              console.log('Direct Supabase login result:', { data, error })
              
              // Test API login
              try {
                const response = await fetch('/api/test-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                })
                const apiResult = await response.json()
                console.log('API login result:', apiResult)
                
                alert(error ? `Direct Error: ${error.message}` : 
                     apiResult.success ? 'Both login methods successful' : 
                     `API Error: ${apiResult.error}`)
              } catch (apiError) {
                console.error('API test error:', apiError)
                alert(error ? `Direct Error: ${error.message}` : 'Direct login successful, API failed')
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/clear-session', {
                  method: 'POST'
                })
                const result = await response.json()
                
                if (result.success) {
                  alert('Session cleared successfully. Please refresh the page.')
                  window.location.reload()
                } else {
                  alert(`Error clearing session: ${result.error}`)
                }
              } catch (error) {
                console.error('Clear session error:', error)
                alert('Failed to clear session')
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
          >
            Clear Session
          </button>
        </div>
      </div>
    </div>
  )
} 