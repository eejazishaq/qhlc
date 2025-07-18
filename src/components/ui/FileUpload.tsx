'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Video, Music } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface FileUploadProps {
  bucket: 'profiles' | 'gallery' | 'resources' | 'certificates'
  folder?: string
  onUpload: (url: string, filename: string) => void
  onError?: (error: string) => void
  accept?: string
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
  multiple?: boolean
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
  if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />
  if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileUpload({
  bucket,
  folder = '',
  onUpload,
  onError,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  disabled = false,
  multiple = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Using the imported supabase client

  const handleUpload = async (files: FileList) => {
    if (disabled || uploading) return

    setUploading(true)
    const uploadedFiles: { url: string; filename: string }[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size
        if (file.size > maxSize) {
          const error = `File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`
          onError?.(error)
          continue
        }

        // Validate file type
        if (accept && !accept.split(',').some(type => {
          const trimmedType = type.trim()
          if (trimmedType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(trimmedType)
          }
          return file.type.match(new RegExp(trimmedType.replace('*', '.*')))
        })) {
          const error = `File ${file.name} is not an accepted file type`
          onError?.(error)
          continue
        }

        // Generate unique filename
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const filename = `${folder ? folder + '/' : ''}${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`

        console.log('Uploading file to bucket:', bucket, 'filename:', filename)


        const {
            data: { user },
          } = await supabase.auth.getUser();

          console.log("------- Role:", user); 

          
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          
          // If bucket doesn't exist, try to create it
          if (error.message.includes('bucket') || error.message.includes('not found')) {
            try {
              console.log('Attempting to create bucket:', bucket)
              await supabase.storage.createBucket(bucket, {
                public: true,
                fileSizeLimit: 20971520, // 20MB
                allowedMimeTypes: ['*/*']
              })
              
              // Retry upload
              const { data: retryData, error: retryError } = await supabase.storage
                .from(bucket)
                .upload(filename, file, {
                  cacheControl: '3600',
                  upsert: false
                })
                
              if (retryError) {
                onError?.(`Failed to upload ${file.name}: ${retryError.message}`)
                continue
              }
            } catch (createError) {
              onError?.(`Failed to create bucket and upload ${file.name}: ${error.message}`)
              continue
            }
          } else {
            onError?.(`Failed to upload ${file.name}: ${error.message}`)
            continue
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filename)

        console.log('File uploaded successfully:', urlData.publicUrl)

        uploadedFiles.push({
          url: urlData.publicUrl,
          filename: file.name
        })
      }

      // Call onUpload for each successful upload
      uploadedFiles.forEach(file => {
        onUpload(file.url, file.filename)
      })

    } catch (error) {
      console.error('Upload error:', error)
      onError?.('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          
          <div className="text-sm text-gray-600">
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>
                {' '}or drag and drop
              </>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            {accept && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
          </p>
        </div>
      </div>

      {uploading && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Please wait while your file uploads...
        </div>
      )}
    </div>
  )
}

// FilePreview component moved to separate file 