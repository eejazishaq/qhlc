'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface UserDistributionData {
  name: string
  value: number
  color: string
}

interface UserDistributionChartProps {
  data: UserDistributionData[]
  isLoading?: boolean
}

export function UserDistributionChart({ data, isLoading = false }: UserDistributionChartProps) {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Users: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {((data.value / data.total * 100) || 0).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
