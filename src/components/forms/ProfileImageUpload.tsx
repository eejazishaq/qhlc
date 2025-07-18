'use client'

import { useState } from 'react'
import { User, Camera, X } from 'lucide-react'
import { FileUpload, FilePreview } from '../ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  onImageUpdate: (url: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
  onError,
  className = '',
  disabled = false
}: ProfileImageUploadProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient()

  const handleUpload = async (url: string, filename: string) => {
    setUploading(true)
    try {
      // Update the user's profile with the new image URL
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ profile_image: url })
          .eq('id', user.id)

        if (error) {
          console.error('Error updating profile image:', error)
          onError?.('Failed to update profile image')
          return
        }

        onImageUpdate(url)
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Error updating profile image:', error)
      onError?.('Failed to update profile image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Remove the image URL from the profile
        const { error } = await supabase
          .from('profiles')
          .update({ profile_image: null })
          .eq('id', user.id)

        if (error) {
          console.error('Error removing profile image:', error)
          onError?.('Failed to remove profile image')
          return
        }

        onImageUpdate('')
      }
    } catch (error) {
      console.error('Error removing profile image:', error)
      onError?.('Failed to remove profile image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Profile Image Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload/Edit Button */}
        <button
          onClick={() => setShowUpload(!showUpload)}
          disabled={disabled || uploading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Remove Button (only show if image exists) */}
        {currentImageUrl && (
          <button
            onClick={handleRemoveImage}
            disabled={disabled || uploading}
            className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="w-full max-w-md">
          <FileUpload
            bucket="profiles"
            folder="avatars"
            onUpload={handleUpload}
            onError={onError}
            accept="image/jpeg,image/png,image/webp"
            maxSize={2 * 1024 * 1024} // 2MB
            disabled={disabled || uploading}
            className="w-full"
          />
          
          <button
            onClick={() => setShowUpload(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="text-sm text-blue-600">
          {currentImageUrl ? 'Updating profile image...' : 'Uploading image...'}
        </div>
      )}

      {/* Instructions */}
      {!showUpload && !currentImageUrl && (
        <div className="text-center text-sm text-gray-500">
          <p>Click the camera icon to upload a profile picture</p>
          <p className="text-xs mt-1">JPG, PNG, or WebP up to 2MB</p>
        </div>
      )}
    </div>
  )
} 