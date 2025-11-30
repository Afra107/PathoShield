import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PropTypes from 'prop-types'

const OrganismDistributionChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-neutral-500">Loading distribution data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
        <p className="text-neutral-500">No distribution data available</p>
      </div>
    )
  }

  // Color palette for organisms
  const colors = [
    '#dc2626', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ]

  // Format data for chart (only show the 4 specified organisms)
  const allowedOrganisms = ['E. coli', 'K. pneumoniae', 'S. aureus', 'P. aeruginosa']
  const chartData = data
    .filter(item => allowedOrganisms.includes(item.organism))
    .map((item, index) => ({
      organism: item.organism || 'Unknown',
      cases: item.cases || 0,
      percentage: item.percentage || 0,
      color: colors[index % colors.length],
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
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 70, bottom: 60 }}
        >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="organism"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
          label={{ value: 'Organism', position: 'insideBottom', offset: -5, style: { fontSize: '12px', textAnchor: 'middle' } }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ 
            value: 'Number of Cases', 
            angle: -90, 
            position: 'insideLeft', 
            offset: 10, 
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
          formatter={(value, name, props) => {
            if (name === 'cases') {
              return [
                `${value} cases (${props.payload.percentage}%)`,
                'Cases'
              ]
            }
            return [value, name]
          }}
        />
        <Bar
          dataKey="cases"
          name="Cases"
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

OrganismDistributionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      organism: PropTypes.string.isRequired,
      cases: PropTypes.number.isRequired,
      percentage: PropTypes.number,
    })
  ),
  isLoading: PropTypes.bool,
}

export default OrganismDistributionChart
