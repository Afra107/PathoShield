import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ResistanceTrendChart = () => {
  const [trendData, setTrendData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/api/surveillance/trends`)
        if (!response.ok) {
          throw new Error('Failed to fetch trend data')
        }
        const data = await response.json()
        setTrendData(data.trends || [])
      } catch (err) {
        console.error('Error fetching trend data:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendData()
  }, [])

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-neutral-500">Loading trend data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-red-600">Error loading trend data: {error}</p>
      </div>
    )
  }

  if (trendData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-neutral-500">No trend data available</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = trendData.map(item => ({
    month: item.month,
    'Resistance Rate': (item.resistance_rate * 100).toFixed(1),
    'Cases': item.cases,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'Resistance Rate (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={(value, name) => {
            if (name === 'Resistance Rate') {
              return [`${value}%`, 'Resistance Rate']
            }
            return [value, name]
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="Resistance Rate"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ fill: '#dc2626', r: 4 }}
          activeDot={{ r: 6 }}
          name="Resistance Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

ResistanceTrendChart.propTypes = {}

export default ResistanceTrendChart

