'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Video, Music, Image, Download, Trash2, Edit, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { FileUpload, FilePreview } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabase/client'

interface Resource {
  id: string
  title: string
  description: string
  file_url: string
  file_type: 'pdf' | 'video' | 'audio' | 'image'
  file_size: number
  category: 'study' | 'exam' | 'certificate'
  is_public: boolean
  download_count: number
  uploaded_by: string
  created_at: string
}

export default function AdminResourcesPage() {
  const { user, profile, loading, session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'study' as 'study' | 'exam' | 'certificate',
    is_public: true
  })
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string; type?: string } | null>(null)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  // const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && (!profile || !['admin', 'super_admin'].includes(profile.user_type))) {
      router.push('/login')
    }
  }, [profile, loading, router])

  useEffect(() => {
    if (profile && ['admin', 'super_admin'].includes(profile.user_type)) {
      fetchResources()
    }
  }, [profile])

  // Debug authentication state
  useEffect(() => {
    const debugAuth = async () => {
      if (user && profile) {
        console.log('Auth state:', {
          user: user.id,
          email: user.email,
          profile: profile.user_type,
          isAdmin: ['admin', 'super_admin'].includes(profile.user_type)
        })
        
        // Check session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current session:', {
          hasSession: !!session,
          hasToken: !!session?.access_token,
          expiresAt: session?.expires_at
        })
      }
    }
    
    debugAuth()
  }, [user, profile])

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources')
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      
      const data = await response.json()
      setResources(data.resources || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleFileUpload = (url: string, filename: string) => {
    // Determine file type based on filename extension
    const extension = filename.split('.').pop()?.toLowerCase()
    let type = 'application/octet-stream' // default
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      type = 'image/' + extension
    } else if (extension === 'pdf') {
      type = 'application/pdf'
    } else if (['mp4', 'avi', 'mov'].includes(extension || '')) {
      type = 'video/' + extension
    } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      type = 'audio/' + extension
    }
    
    setUploadedFile({ url, filename, type })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadedFile) {
      alert('Please upload a file first')
      return
    }

    setUploading(true)
    try {
      const fileType = getFileType(uploadedFile.filename)
      const fileSize = await getFileSize(uploadedFile.url)

      const resourceData = {
        ...formData,
        file_url: uploadedFile.url,
        file_type: fileType,
        file_size: fileSize
      }


      
      // Get the current session token - try multiple sources
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      
      // If no session from direct call, try to use the session from us

      if (editingResource) {
        console.log('TESTING');
        // Update existing resource
        const response = await fetch('/api/resources', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            id: editingResource.id,
            ...resourceData
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Resource update error:', errorData)
          alert(`Failed to update resource: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`)
          return
        }
      } else {
        // Create new resource
        console.log('Creating resource with data:', resourceData)
        console.log('TESTING');
        const response = await fetch('/api/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(resourceData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Resource creation error:', errorData)
          alert(`Failed to create resource: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`)
          return
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'study',
        is_public: true
      })
      setUploadedFile(null)
      setEditingResource(null)
      setShowUpload(false)
      
      // Refresh resources list
      fetchResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      is_public: resource.is_public
    })
    setUploadedFile({ url: resource.file_url, filename: resource.title })
    setShowUpload(true)
  }

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      // Get the current session token
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Delete - Session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        sessionError: sessionError?.message
      })
      
      if (!session?.access_token) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        console.log('Delete - Session refresh attempt:', { 
          success: !!refreshedSession, 
          error: refreshError?.message 
        })
        
        if (!refreshedSession?.access_token) {
          throw new Error(`No authentication token available. Please log in again. Session error: ${sessionError?.message || 'Unknown'}`)
        }
        
        // Use the refreshed session
        session = refreshedSession
      }

      const response = await fetch(`/api/resources?id=${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to delete resource: ${errorData.error}`)
        return
      }

      fetchResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource')
    }
  }

  const getFileType = (filename: string): 'pdf' | 'video' | 'audio' | 'image' => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return 'video'
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio'
    return 'pdf'
  }

  const getFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return parseInt(response.headers.get('content-length') || '0')
    } catch {
      return 0
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      case 'image': return <Image className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || !['admin', 'super_admin'].includes(profile.user_type)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resources Management</h1>
              <p className="text-gray-600">Upload and manage educational resources</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowUpload(true)}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Form */}
        {showUpload && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="study">Study Material</option>
                      <option value="exam">Exam Material</option>
                      <option value="certificate">Certificate</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Make this resource publicly accessible
                  </label>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <FileUpload
                    bucket="resources"
                    onUpload={handleFileUpload}
                    onError={(error) => alert(error)}
                    accept=".pdf,.doc,.docx,.mp4,.mp3,.jpg,.jpeg,.png,.gif,.webp"
                    maxSize={20 * 1024 * 1024} // 20MB
                    disabled={uploading}
                  />
                  
                  {uploadedFile && (
                    <div className="mt-4">
                      <FilePreview file={uploadedFile} />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" disabled={uploading || !uploadedFile}>
                    {uploading ? 'Saving...' : (editingResource ? 'Update Resource' : 'Add Resource')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUpload(false)
                      setEditingResource(null)
                      setFormData({
                        title: '',
                        description: '',
                        category: 'study',
                        is_public: true
                      })
                      setUploadedFile(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle>All Resources ({resources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No resources uploaded yet. Click "Add Resource" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(resource.file_type)}
                        <span className="text-sm font-medium text-gray-900">
                          {resource.title}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="capitalize">{resource.category}</span>
                      <span>{formatFileSize(resource.file_size)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {resource.download_count} downloads
                      </span>
                      <div className="flex space-x-2">
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={resource.file_url}
                          download
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {!resource.is_public && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Private
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 