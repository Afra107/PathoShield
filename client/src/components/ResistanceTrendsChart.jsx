import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const ResistanceTrendsChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-neutral-500">Loading trends data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
        <p className="text-neutral-500">No trend data available</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    month: item.month || item.date || 'N/A',
    'Resistance Rate (%)': item.resistance_rate ? (item.resistance_rate * 100).toFixed(1) : 0,
    'Cases': item.cases || 0,
  }))

  return (
    <div 
      className="w-full" 
      style={{ 
        height: '256px', 
        outline: 'none',
        border: 'none',
        boxShadow: 'none'
      }} 
      tabIndex={-1}
      onFocus={(e) => e.target.blur()}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
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
          yAxisId="left"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ 
            value: 'Resistance Rate (%)', 
            angle: -90, 
            position: 'insideLeft', 
            style: { 
              fontSize: '12px',
              textAnchor: 'middle'
            } 
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ 
            value: 'Cases', 
            angle: 90, 
            position: 'insideRight', 
            style: { 
              fontSize: '12px',
              textAnchor: 'middle'
            } 
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
          }}
          formatter={(value, name) => {
            if (name === 'Resistance Rate (%)') {
              return [`${value}%`, name]
            }
            return [value, name]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Resistance Rate (%)"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ fill: '#dc2626', r: 4 }}
          activeDot={{ r: 6 }}
          name="Resistance Rate (%)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Cases"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Cases"
        />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

ResistanceTrendsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string,
      date: PropTypes.string,
      resistance_rate: PropTypes.number,
      cases: PropTypes.number,
    })
  ),
  isLoading: PropTypes.bool,
}

export default ResistanceTrendsChart

