'use client'

import React from 'react'
import { File, Image, FileText, Video, Music, X } from 'lucide-react'

interface FilePreviewProps {
  file: {
    url: string
    filename: string
    type?: string
  }
  onRemove?: () => void
  className?: string
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
  if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />
  if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

export default function FilePreview({ file, onRemove, className = '' }: FilePreviewProps) {
  const isImage = file.type?.startsWith('image/') || 
                  file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  console.log('FilePreview props:', { file, isImage, type: file.type })

  return (
    <div className={`relative inline-block p-2 border rounded-lg bg-gray-50 ${className}`}>
      {isImage ? (
        <div className="w-16 h-16 rounded overflow-hidden">
          <img 
            src={file.url} 
            alt={file.filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', file.url)
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded hidden">
            <Image className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded">
          {getFileIcon(file.type || '')}
        </div>
      )}
      
      <div className="mt-1 text-xs text-gray-600 max-w-16 truncate">
        {file.filename}
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
} 