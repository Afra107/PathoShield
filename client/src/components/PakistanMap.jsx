import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import PropTypes from 'prop-types'

// Fix for default marker icons in React-Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Component to re-center map to Pakistan
const RecenterButton = ({ center, zoom }) => {
  const map = useMap()

  const handleRecenter = () => {
    map.setView(center, zoom, {
      animate: true,
      duration: 1.0,
    })
  }

  return (
    <button
      onClick={handleRecenter}
      className="absolute top-4 right-4 z-[1000] bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-lg p-2.5 transition-all duration-200 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
      title="Re-center map to Pakistan"
      aria-label="Re-center map to Pakistan"
    >
      <svg
        className="w-5 h-5 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      <span className="hidden sm:inline">Re-center</span>
    </button>
  )
}

RecenterButton.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
}

// Custom red marker icon for resistance cases
const createRedMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-red-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #dc2626;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })
}


const PakistanMap = ({ regionData = [], isLoading = false, onMarkerClick }) => {
  const [isClient, setIsClient] = useState(false)
  
  // Pakistan center coordinates and default zoom
  const pakistanCenter = [30.3753, 69.3451]
  const defaultZoom = 6

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return 'text-red-600 bg-red-50'
      case 'decreasing':
        return 'text-green-600 bg-green-50'
      case 'stable':
        return 'text-neutral-600 bg-neutral-50'
      default:
        return 'text-neutral-600 bg-neutral-50'
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
        <div className="text-center">
          <p className="text-neutral-600">Initializing map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-neutral-200" style={{ minHeight: '500px' }}>
      <MapContainer
        center={pakistanCenter}
        zoom={defaultZoom}
        minZoom={5.5}
        maxZoom={7}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Re-center button */}
        <RecenterButton center={pakistanCenter} zoom={defaultZoom} />

        {regionData.map((region, index) => {
          if (!region.lat || !region.lng || region.cases === 0) return null

          return (
            <Marker
              key={index}
              position={[region.lat, region.lng]}
              icon={createRedMarkerIcon()}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(region)
                  }
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg text-neutral-900 mb-2">
                    {region.region}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Cases:</span>
                      <span className="font-semibold text-neutral-900">{region.cases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Resistance Rate:</span>
                      <span className="font-semibold text-neutral-900">
                        {(region.avg_resistance_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Trend:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(region.trend)}`}>
                        <span>{getTrendIcon(region.trend)}</span>
                        <span className="capitalize">{region.trend}</span>
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                      <span className="text-neutral-600 text-xs">Organisms:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {region.organisms?.slice(0, 3).map((org, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded"
                          >
                            {org}
                          </span>
                        ))}
                        {region.organisms?.length > 3 && (
                          <span className="px-2 py-0.5 text-neutral-500 text-xs">
                            +{region.organisms.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-neutral-200">
        <div className="text-xs font-semibold text-neutral-700 mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-neutral-600">Resistance Cases</span>
        </div>
      </div>
    </div>
  )
}

PakistanMap.propTypes = {
  regionData: PropTypes.arrayOf(
    PropTypes.shape({
      region: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      cases: PropTypes.number.isRequired,
      avg_resistance_rate: PropTypes.number.isRequired,
      organisms: PropTypes.arrayOf(PropTypes.string).isRequired,
      trend: PropTypes.oneOf(['increasing', 'decreasing', 'stable']).isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  onMarkerClick: PropTypes.func,
}

export default PakistanMap
