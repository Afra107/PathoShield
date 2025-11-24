import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import IconButton from './IconButton'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Header = () => {
  const location = useLocation()
  const [healthStatus, setHealthStatus] = useState('Checking...')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check backend health
    const checkHealth = () => {
      fetch(`${API_URL}/health`)
        .then(res => res.json())
        .then(data => {
          setHealthStatus(data.message || 'Backend is healthy')
          setIsConnected(true)
        })
        .catch(err => {
          setHealthStatus('Backend connection failed')
          setIsConnected(false)
          console.error('Health check failed:', err)
        })
    }

    // Initial check
    checkHealth()

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/prediction', label: 'AMR Prediction', icon: '🔬' },
    { path: '/surveillance', label: 'Surveillance', icon: '📊' },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            aria-label="AMR Prediction Home"
          >
            <span className="text-2xl" aria-hidden="true">🧬</span>
            <span>PathoShield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                    }
                  `}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <span className="mr-2" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Health Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
              <div 
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                aria-hidden="true"
                title={healthStatus}
              />
              <span className="text-xs font-medium text-neutral-700 hidden lg:inline">
                {healthStatus}
              </span>
              <span className="text-xs font-medium text-neutral-700 lg:hidden" title={healthStatus}>
                {isConnected ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Mobile Menu Button and Health Status */}
          <div className="md:hidden flex items-center gap-3">
            {/* Health Status Indicator - Mobile */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-50 border border-neutral-200">
              <div 
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                aria-hidden="true"
                title={healthStatus}
              />
              <span className="text-xs text-neutral-600" title={healthStatus}>
                {isConnected ? '✓' : '✗'}
              </span>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              ariaLabel="Toggle menu"
              onClick={() => {
                // Mobile menu toggle can be added here
                console.log('Mobile menu toggle')
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </IconButton>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header

