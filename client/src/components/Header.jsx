import { Link, useLocation } from 'react-router-dom'
import IconButton from './IconButton'

const Header = () => {
  const location = useLocation()

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
            <span>AMR Prediction</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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

