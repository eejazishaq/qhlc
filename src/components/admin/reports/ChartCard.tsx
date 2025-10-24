import { ReactNode } from 'react'
import { Download, RefreshCw } from 'lucide-react'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  isLoading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  className?: string
}

export function ChartCard({ 
  title, 
  description, 
  children, 
  isLoading = false, 
  onRefresh, 
  onExport,
  className = '' 
}: ChartCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
