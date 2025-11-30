import { useEffect } from 'react'
import PropTypes from 'prop-types'
import Card from './Card'
import Button from './Button'

const RegionDetailsPanel = ({ region, data, isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'decreasing':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'stable':
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return '📈'
      case 'decreasing':
        return '📉'
      case 'stable':
        return '➡️'
      default:
        return '➡️'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
    >
      <Card
        variant="elevated"
        padding="lg"
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
          <div>
            <h2 id="panel-title" className="text-2xl font-bold text-neutral-900 mb-1">
              {region} - Surveillance Data
            </h2>
            <p className="text-sm text-neutral-500">Antimicrobial Resistance Monitoring</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-neutral-400 hover:text-neutral-700 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {data.cases || 'N/A'}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Total Cases</div>
          </div>
          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-4 rounded-lg border border-secondary-200">
            <div className="text-3xl font-bold text-secondary-600 mb-1">
              {data.avg_resistance_rate ? `${(data.avg_resistance_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Resistance Rate</div>
          </div>
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-4 rounded-lg border border-accent-200">
            <div className="text-3xl font-bold text-accent-600 mb-1">
              {data.organisms?.length || 'N/A'}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Organisms Tracked</div>
          </div>
          <div className={`p-4 rounded-lg border ${getTrendColor(data.trend)}`}>
            <div className="text-3xl font-bold mb-1 flex items-center justify-center">
              {getTrendIcon(data.trend)}
            </div>
            <div className="text-sm font-medium text-center capitalize">{data.trend || 'N/A'}</div>
          </div>
        </div>

        {/* Organisms List */}
        {data.organisms && data.organisms.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <span className="text-xl">🦠</span>
              Tracked Organisms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.organisms.map((organism, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                    {organism}
                  </span>
                  <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Trend Analysis
          </h3>
          <div className={`p-4 rounded-lg border ${getTrendColor(data.trend)}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getTrendIcon(data.trend)}</span>
              <div>
                <p className="font-semibold text-neutral-900 capitalize">
                  Trend: {data.trend || 'Unknown'}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  {data.trend === 'increasing' && 'Resistance rates are showing an upward trend. Immediate attention recommended.'}
                  {data.trend === 'decreasing' && 'Resistance rates are declining. Current interventions appear effective.'}
                  {data.trend === 'stable' && 'Resistance rates have remained stable. Continued monitoring recommended.'}
                  {!data.trend && 'No trend data available.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

RegionDetailsPanel.propTypes = {
  region: PropTypes.string,
  data: PropTypes.shape({
    cases: PropTypes.number,
    avg_resistance_rate: PropTypes.number,
    organisms: PropTypes.arrayOf(PropTypes.string),
    trend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']),
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default RegionDetailsPanel

