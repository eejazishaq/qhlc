'use client'

import { useState, useEffect } from 'react'
import { User, Camera, X } from 'lucide-react'
import { FileUpload, FilePreview } from '../ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authenticatedFetch } from '@/lib/utils/api'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  onImageUpdate: (url: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

interface ProfileImageWithFallbackProps {
  imageUrl: string
  supabase: SupabaseClient
}

function ProfileImageWithFallback({ imageUrl, supabase }: ProfileImageWithFallbackProps) {
  const [currentUrl, setCurrentUrl] = useState(imageUrl)
  const [hasError, setHasError] = useState(false)
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState(false)

  // Extract the file path from URL for signed URL fallback
  const getFilePathFromUrl = (url: string) => {
    try {
      // Extract path after /storage/v1/object/public/profiles/
      const match = url.match(/\/storage\/v1\/object\/public\/profiles\/(.+)$/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  const handleImageError = async () => {
    console.error('Image load error for URL:', currentUrl)
    
    if (!isLoadingSignedUrl && !hasError) {
      setHasError(true)
      setIsLoadingSignedUrl(true)
      
      try {
        // First try to fix bucket access
        console.log('Attempting to fix bucket access for profiles bucket')
        const fixResponse = await authenticatedFetch('/api/test-storage', {
          method: 'POST',
          body: JSON.stringify({ action: 'fix-bucket-access' })
        })
        
        if (fixResponse.ok) {
          const fixResult = await fixResponse.json()
          console.log('Bucket access fix result:', fixResult)
        }
      } catch (error) {
        console.error('Error fixing bucket access:', error)
      }
      
      // Try to get a signed URL as fallback
      const filePath = getFilePathFromUrl(imageUrl)
      if (filePath) {
        try {
          console.log('Attempting to get signed URL for:', filePath)
          const { data, error } = await supabase.storage
            .from('profiles')
            .createSignedUrl(filePath, 3600) // 1 hour expiry
          
          if (!error && data?.signedUrl) {
            console.log('Got signed URL:', data.signedUrl)
            setCurrentUrl(data.signedUrl)
            setHasError(false)
            // Try to preload the signed URL to make sure it works
            const testImg = new Image()
            testImg.onload = () => {
              console.log('Signed URL image loaded successfully')
            }
            testImg.onerror = () => {
              console.error('Signed URL also failed to load')
            }
            testImg.src = data.signedUrl
          } else {
            console.error('Failed to get signed URL:', error)
          }
        } catch (error) {
          console.error('Error getting signed URL:', error)
        }
      }
      
      setIsLoadingSignedUrl(false)
    }
  }

  const handleImageLoad = () => {
    console.log('Image loaded successfully for URL:', currentUrl)
    setHasError(false)
  }

  // Reset error state when imageUrl changes
  useEffect(() => {
    setCurrentUrl(imageUrl)
    setHasError(false)
  }, [imageUrl])

  if (hasError && !isLoadingSignedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <User className="w-16 h-16 text-gray-400 mb-2" />
        <span className="text-xs text-gray-500 px-2">Image unavailable</span>
      </div>
    )
  }

  return (
    <img
      src={currentUrl}
      alt="Profile"
      className="w-full h-full object-cover"
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  )
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
    try {
      // Clean the URL if it has issues
      let cleanUrl = url
      if (cleanUrl.startsWith('@')) {
        cleanUrl = cleanUrl.substring(1)
        console.warn('Removed @ prefix from ProfileImageUpload URL:', cleanUrl)
      }
      
      console.log('ProfileImageUpload received URL:', cleanUrl)
      
      // Just update the parent component with the new URL
      // Let the parent handle the database update
      onImageUpdate(cleanUrl)
      setShowUpload(false)
    } catch (error) {
      console.error('Error updating profile image:', error)
      onError?.('Failed to update profile image')
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    try {
      // Just update the parent component with empty string
      // Let the parent handle the database update
      onImageUpdate('')
    } catch (error) {
      console.error('Error removing profile image:', error)
      onError?.('Failed to remove profile image')
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Profile Image Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {currentImageUrl ? (
            <ProfileImageWithFallback 
              imageUrl={currentImageUrl}
              supabase={supabase}
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