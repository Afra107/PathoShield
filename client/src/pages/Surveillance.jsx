import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import PakistanMap from '../components/PakistanMap'
import RegionDetailsPanel from '../components/RegionDetailsPanel'
import ResistanceTrendsChart from '../components/ResistanceTrendsChart'
import OrganismDistributionChart from '../components/OrganismDistributionChart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Surveillance = () => {
  const location = useLocation()
  const topRef = useRef(null)
  const chartsRef = useRef(null)
  
  const [regionData, setRegionData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [trendsData, setTrendsData] = useState([])
  const [isTrendsLoading, setIsTrendsLoading] = useState(true)
  const [organismData, setOrganismData] = useState([])
  const [isOrganismLoading, setIsOrganismLoading] = useState(true)

  // Fetch surveillance data from backend
  useEffect(() => {
    const fetchSurveillanceData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/api/surveillance/regions`)
        if (!response.ok) {
          throw new Error('Failed to fetch surveillance data')
        }
        const data = await response.json()
        setRegionData(data.regions || data || [])
      } catch (error) {
        console.error('Error fetching surveillance data:', error)
        // Fallback to empty array on error
        setRegionData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurveillanceData()
  }, [])

  // Fetch resistance trends data
  useEffect(() => {
    const fetchTrendsData = async () => {
      try {
        setIsTrendsLoading(true)
        const response = await fetch(`${API_URL}/api/surveillance/trends`)
        if (!response.ok) {
          throw new Error('Failed to fetch trends data')
        }
        const data = await response.json()
        setTrendsData(data.trends || [])
      } catch (error) {
        console.error('Error fetching trends data:', error)
        setTrendsData([])
      } finally {
        setIsTrendsLoading(false)
      }
    }

    fetchTrendsData()
  }, [])

  // Fetch organism distribution data
  useEffect(() => {
    const fetchOrganismData = async () => {
      try {
        setIsOrganismLoading(true)
        const response = await fetch(`${API_URL}/api/surveillance/organisms`)
        if (!response.ok) {
          throw new Error('Failed to fetch organism distribution data')
        }
        const data = await response.json()
        setOrganismData(data.distribution || [])
      } catch (error) {
        console.error('Error fetching organism distribution data:', error)
        setOrganismData([])
      } finally {
        setIsOrganismLoading(false)
      }
    }

    fetchOrganismData()
  }, [])

  // Handle scroll to anchor on mount
  useEffect(() => {
    if (location.hash === '#charts' && chartsRef.current) {
      setTimeout(() => {
        chartsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else if (location.hash === '#top' && topRef.current) {
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [location.hash])

  const handleMarkerClick = (region) => {
    setSelectedRegion(region)
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedRegion(null)
  }

  // Calculate summary statistics
  const totalCases = regionData.reduce((sum, region) => sum + (region.cases || 0), 0)
  const totalOrganisms = new Set(regionData.flatMap(region => region.organisms || [])).size
  const avgResistanceRate = regionData.length > 0
    ? regionData.reduce((sum, region) => sum + (region.avg_resistance_rate || 0), 0) / regionData.length
    : 0
  const activeRegions = regionData.filter(region => region.cases > 0).length

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
      case 'up':
        return '📈'
      case 'decreasing':
      case 'down':
        return '📉'
      case 'stable':
        return '➡️'
      default:
        return '➡️'
    }
  }

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
      case 'up':
        return 'text-red-600 bg-red-50'
      case 'decreasing':
      case 'down':
        return 'text-green-600 bg-green-50'
      case 'stable':
        return 'text-neutral-600 bg-neutral-50'
      default:
        return 'text-neutral-600 bg-neutral-50'
    }
  }

  // Debug: Log current state
  console.log('Surveillance page render:', { regionData, isLoading, regionDataLength: regionData.length })

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div ref={topRef} className="mb-8" id="top">
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
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {totalCases.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-600">Total Cases</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-secondary-600 mb-1">{totalOrganisms}</div>
            <div className="text-sm text-neutral-600">Organisms Tracked</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {(avgResistanceRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-600">Avg Resistance Rate</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-2xl font-bold text-neutral-600 mb-1">{activeRegions}</div>
            <div className="text-sm text-neutral-600">Active Regions</div>
          </Card>
        </div>

        {/* Pakistan Map */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Regional Resistance Map
            </h2>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
          <div style={{ height: '600px', width: '100%', position: 'relative' }}>
            {regionData.length > 0 || isLoading ? (
              <PakistanMap
                regionData={regionData}
                isLoading={isLoading}
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <p className="text-neutral-600 mb-2">No surveillance data available</p>
                  <p className="text-sm text-neutral-500">Please check the API connection</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm"></div>
              <span>Regions with resistance cases</span>
            </div>
            <span className="text-neutral-400">•</span>
            <span>Click on markers to view detailed information</span>
          </div>
        </Card>

        {/* Regional Data Table */}
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
                    Cases
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
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-500">
                      Loading data...
                    </td>
                  </tr>
                ) : regionData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-500">
                      No surveillance data available
                    </td>
                  </tr>
                ) : (
                  regionData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => handleMarkerClick(item)}
                    >
                      <td className="py-4 px-4 text-sm font-medium text-neutral-900">
                        {item.region}
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-700">
                        {item.cases || 0}
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-700">
                        {item.avg_resistance_rate
                          ? `${(item.avg_resistance_rate * 100).toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(
                            item.trend
                          )}`}
                        >
                          <span aria-hidden="true">{getTrendIcon(item.trend)}</span>
                          <span className="capitalize">{item.trend || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-700">
                        {item.organisms?.length || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts */}
        <div ref={chartsRef} id="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Resistance Trends Over Time
              </h3>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
            <ResistanceTrendsChart data={trendsData} isLoading={isTrendsLoading} />
          </Card>
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Organism Distribution
              </h3>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
            <OrganismDistributionChart data={organismData} isLoading={isOrganismLoading} />
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

        {/* Region Details Panel */}
        <RegionDetailsPanel
          region={selectedRegion?.region}
          data={selectedRegion}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  )
}

export default Surveillance

