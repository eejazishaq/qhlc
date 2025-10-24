'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PerformanceData {
  name: string
  score: number
  total: number
  color?: string
}

interface PerformanceChartProps {
  data: PerformanceData[]
  isLoading?: boolean
}

export function PerformanceChart({ data, isLoading = false }: PerformanceChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Average Score: {data.score}%
          </p>
          <p className="text-sm text-gray-600">
            Total Exams: {data.total.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="score" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            name="Average Score (%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
