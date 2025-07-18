'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Image, Star, Trash2, Edit, Eye, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { FileUpload, FilePreview } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  category: 'events' | 'activities' | 'other'
  is_featured: boolean
  uploaded_by: string
  created_at: string
}

export default function AdminGalleryPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'events' as 'events' | 'activities' | 'other',
    is_featured: false
  })
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string; type?: string } | null>(null)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)

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
      fetchGalleryItems()
    }
  }, [profile])

  const fetchGalleryItems = async () => {
    try {
      const response = await fetch('/api/gallery')
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items')
      }
      const result = await response.json()
      setGalleryItems(result.data || [])
    } catch (error) {
      console.error('Error fetching gallery items:', error)
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
    setUploadedFile({ url, filename, type: 'image/jpeg' }) // Since we only accept images
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadedFile) {
      alert('Please upload an image first')
      return
    }

    if (!profile?.id) {
      alert('User profile not found. Please try logging in again.')
      return
    }

    setUploading(true)
    try {
      const galleryData = {
        ...formData,
        image_url: uploadedFile.url
      }

      console.log('Attempting to insert gallery data:', galleryData)

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Determine if we're editing or creating
      const isEditing = editingItem !== null
      const url = isEditing ? `/api/gallery/${editingItem.id}` : '/api/gallery'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(galleryData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save gallery item')
      }

      const result = await response.json()
      console.log(`Gallery item ${isEditing ? 'updated' : 'created'} successfully:`, result)

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'events',
        is_featured: false
      })
      setUploadedFile(null)
      setEditingItem(null)
      setShowUpload(false)
      
      // Refresh gallery list
      fetchGalleryItems()
    } catch (error) {
      console.error('Error saving gallery item:', error)
      alert(`Failed to save gallery item: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      is_featured: item.is_featured
    })
    setUploadedFile({ url: item.image_url, filename: item.title, type: 'image/jpeg' })
    setShowUpload(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/gallery/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete gallery item')
      }

      fetchGalleryItems()
    } catch (error) {
      console.error('Error deleting gallery item:', error)
      alert('Failed to delete gallery item')
    }
  }

  const toggleFeatured = async (itemId: string, currentFeatured: boolean) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`/api/gallery/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_featured: !currentFeatured })
      })

      if (!response.ok) {
        throw new Error('Failed to update featured status')
      }

      fetchGalleryItems()
    } catch (error) {
      console.error('Error updating featured status:', error)
      alert('Failed to update featured status')
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
              <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
              <p className="text-gray-600">Upload and manage gallery images</p>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
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
                {editingItem ? 'Edit Gallery Item' : 'Add New Image'}
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
                      <option value="events">Events</option>
                      <option value="activities">Activities</option>
                      <option value="other">Other</option>
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
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Feature this image on the homepage
                  </label>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <FileUpload
                    bucket="gallery"
                    onUpload={handleFileUpload}
                    onError={(error) => alert(error)}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    maxSize={5 * 1024 * 1024} // 5MB
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
                    {uploading ? 'Saving...' : (editingItem ? 'Update Image' : 'Add Image')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUpload(false)
                      setEditingItem(null)
                      setFormData({
                        title: '',
                        description: '',
                        category: 'events',
                        is_featured: false
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

        {/* Gallery Grid */}
        <Card>
          <CardHeader>
            <CardTitle>All Images ({galleryItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {galleryItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No images uploaded yet. Click "Add Image" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {galleryItems.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Featured Badge */}
                      {item.is_featured && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => toggleFeatured(item.id, item.is_featured)}
                          className={`p-1 rounded-full ${
                            item.is_featured 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-white text-gray-600 hover:text-yellow-600'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 bg-white text-gray-600 rounded-full hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 bg-white text-gray-600 rounded-full hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 capitalize">
                          {item.category}
                        </span>
                        <div className="flex space-x-1">
                          <a
                            href={item.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={item.image_url}
                            download
                            className="p-1 text-gray-400 hover:text-green-600"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
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