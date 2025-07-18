'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import FileUpload from '@/components/ui/FileUpload'
import Button from '@/components/ui/Button'

export default function TestStoragePage() {
  const { user, profile, loading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [authResults, setAuthResults] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const testStorage = async () => {
    setTesting(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setTestResults({ error: 'No authentication token available' })
        return
      }

      const response = await fetch('/api/test-storage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Storage test failed:', error)
      setTestResults({ error: 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

  const createBuckets = async () => {
    setTesting(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setTestResults({ error: 'No authentication token available' })
        return
      }

      const response = await fetch('/api/test-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'create-buckets' })
      })
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Bucket creation failed:', error)
      setTestResults({ error: 'Bucket creation failed' })
    } finally {
      setTesting(false)
    }
  }

  const testAuth = async () => {
    setTesting(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setAuthResults({ error: 'No authentication token available' })
        return
      }

      const response = await fetch('/api/test-auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      setAuthResults(data)
    } catch (error) {
      console.error('Auth test failed:', error)
      setAuthResults({ error: 'Auth test failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleFileUpload = (url: string, filename: string) => {
    setUploadedFile({ url, filename })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to test storage functionality.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Storage Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Storage Bucket Tests</h2>
          
          <div className="flex space-x-4 mb-6">
            <Button
              onClick={testStorage}
              disabled={testing}
              className="flex items-center"
            >
              {testing ? 'Testing...' : 'Test Storage'}
            </Button>
            
            <Button
              onClick={createBuckets}
              disabled={testing}
              variant="outline"
              className="flex items-center"
            >
              {testing ? 'Creating...' : 'Create Buckets'}
            </Button>

            <Button
              onClick={testAuth}
              disabled={testing}
              variant="outline"
              className="flex items-center"
            >
              {testing ? 'Testing...' : 'Test Auth'}
            </Button>
          </div>

          {testResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Storage Test Results:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}

          {authResults && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-semibold mb-2">Auth Test Results:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(authResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">File Upload Test</h2>
          
          <FileUpload
            bucket="resources"
            onUpload={handleFileUpload}
            onError={(error: string) => alert(error)}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            maxSize={10 * 1024 * 1024} // 10MB
          />
          
          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">File Uploaded Successfully!</h3>
              <p className="text-green-700 text-sm">Filename: {uploadedFile.filename}</p>
              <p className="text-green-700 text-sm">URL: {uploadedFile.url}</p>
              <a 
                href={uploadedFile.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View File
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User ID:</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email:</p>
              <p className="font-mono text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User Type:</p>
              <p className="font-mono text-sm">{profile.user_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Full Name:</p>
              <p className="font-mono text-sm">{profile.full_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 