'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

interface TrendData {
  date: string
  users: number
  exams: number
}

interface UserGrowthChartProps {
  data: TrendData[]
  isLoading?: boolean
}

export function UserGrowthChart({ data, isLoading = false }: UserGrowthChartProps) {
  if (isLoading || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd')
    } catch {
      return dateStr
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            name="New Users"
          />
          <Line 
            type="monotone" 
            dataKey="exams" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            name="Completed Exams"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
