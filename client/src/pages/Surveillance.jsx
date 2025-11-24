import Card from '../components/Card'
import Button from '../components/Button'

const Surveillance = () => {
  const surveillanceData = [
    {
      region: 'Punjab',
      resistanceRate: '23.5%',
      trend: 'up',
      organisms: 12,
      lastUpdated: '2024-01-15',
    },
    {
      region: 'Sindh',
      resistanceRate: '18.2%',
      trend: 'down',
      organisms: 15,
      lastUpdated: '2024-01-14',
    },
    {
      region: 'KPK',
      resistanceRate: '31.8%',
      trend: 'up',
      organisms: 18,
      lastUpdated: '2024-01-15',
    },
    {
      region: 'Balochistan',
      resistanceRate: '27.3%',
      trend: 'stable',
      organisms: 10,
      lastUpdated: '2024-01-13',
    },
  ]

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      case 'stable':
        return '➡️'
      default:
        return '➡️'
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-red-600 bg-red-50'
      case 'down':
        return 'text-green-600 bg-green-50'
      case 'stable':
        return 'text-neutral-600 bg-neutral-50'
      default:
        return 'text-neutral-600 bg-neutral-50'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            Surveillance Dashboard
          </h1>
          <p className="text-lg text-neutral-600">
            Monitor antimicrobial resistance patterns and trends across different regions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-primary-600 mb-1">1,234</div>
            <div className="text-sm text-neutral-600">Total Cases</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-secondary-600 mb-1">55</div>
            <div className="text-sm text-neutral-600">Organisms Tracked</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-accent-600 mb-1">24.2%</div>
            <div className="text-sm text-neutral-600">Avg Resistance Rate</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-neutral-600 mb-1">6</div>
            <div className="text-sm text-neutral-600">Active Regions</div>
          </Card>
        </div>

        {/* Regional Data */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Regional Resistance Rates
            </h2>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Regional resistance data">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                    Region
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                    Resistance Rate
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                    Trend
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                    Organisms
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {surveillanceData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-neutral-900">
                      {item.region}
                    </td>
                    <td className="py-4 px-4 text-sm text-neutral-700">
                      {item.resistanceRate}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(
                          item.trend
                        )}`}
                      >
                        <span aria-hidden="true">{getTrendIcon(item.trend)}</span>
                        <span className="capitalize">{item.trend}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-neutral-700">
                      {item.organisms}
                    </td>
                    <td className="py-4 px-4 text-sm text-neutral-500">
                      {item.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Placeholder for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" padding="lg">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Resistance Trends Over Time
            </h3>
            <div className="h-64 flex items-center justify-center bg-neutral-100 rounded-lg">
              <p className="text-neutral-500">Chart visualization coming soon</p>
            </div>
          </Card>
          <Card variant="elevated" padding="lg">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Organism Distribution
            </h3>
            <div className="h-64 flex items-center justify-center bg-neutral-100 rounded-lg">
              <p className="text-neutral-500">Chart visualization coming soon</p>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card variant="filled" padding="md" className="mt-8">
          <div className="flex gap-3">
            <div className="text-2xl" aria-hidden="true">ℹ️</div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                Surveillance Information
              </h3>
              <p className="text-sm text-neutral-600">
                This dashboard provides real-time monitoring of antimicrobial resistance patterns.
                Data is updated regularly from various surveillance networks and clinical laboratories.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Surveillance

