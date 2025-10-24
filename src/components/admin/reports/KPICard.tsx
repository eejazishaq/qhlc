import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  gradient?: string
  isLoading?: boolean
}

export function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  gradient = 'from-blue-500 to-blue-600',
  isLoading = false 
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50"></div>
        <div className="animate-pulse relative z-10">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return '↗'
    if (trend === 'down') return '↘'
    return '→'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center">
          <div className={`p-4 rounded-2xl shadow-lg bg-gradient-to-br ${iconBgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${iconColor} drop-shadow-sm`} />
          </div>
          <div className="ml-5 flex-1">
            <p className="text-sm font-semibold text-gray-600 mb-2 tracking-wide uppercase">{title}</p>
            <div className="flex items-baseline space-x-3">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {change && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTrendColor(change.trend)} ${
                  change.trend === 'up' ? 'bg-green-50' : change.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <span className="mr-1">{getTrendIcon(change.trend)}</span>
                  {Math.abs(change.value)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
