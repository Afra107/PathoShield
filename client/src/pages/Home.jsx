import { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Home = () => {
  const [healthStatus, setHealthStatus] = useState('Checking...')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check backend health
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
  }, [])

  const features = [
    {
      icon: '🔬',
      title: 'AMR Prediction',
      description: 'Predict antimicrobial resistance based on genomic data and clinical information.',
      link: '/prediction',
      color: 'primary',
    },
    {
      icon: '📊',
      title: 'Surveillance',
      description: 'Monitor resistance patterns and trends across different regions and time periods.',
      link: '/surveillance',
      color: 'secondary',
    },
    {
      icon: '📈',
      title: 'Analytics',
      description: 'Analyze resistance data and generate comprehensive reports for research.',
      link: '/surveillance',
      color: 'accent',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
            Antimicrobial Resistance
            <span className="block text-primary-600">Prediction & Surveillance</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 leading-relaxed">
            Advanced platform for predicting and monitoring antimicrobial resistance patterns
            to support clinical decision-making and public health surveillance.
          </p>
          
          {/* Status Card */}
          <Card variant="elevated" padding="md" className="max-w-md mx-auto mb-12">
            <div className="flex items-center justify-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} aria-hidden="true" />
              <span className="text-sm font-medium text-neutral-700">
                {healthStatus}
              </span>
            </div>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              to="/prediction"
              variant="primary"
              size="lg"
              className="text-lg"
            >
              Start Prediction
            </Button>
            <Button
              to="/surveillance"
              variant="outline"
              size="lg"
              className="text-lg"
            >
              View Surveillance
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              variant="elevated"
              padding="lg"
              className="text-center hover:scale-105 transition-transform duration-200"
            >
              <div className="text-5xl mb-4" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              <Button
                to={feature.link}
                variant={feature.color}
                fullWidth
              >
                Learn More
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-t border-neutral-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                100+
              </div>
              <div className="text-sm text-neutral-600">Predictions</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary-600 mb-2">
                50+
              </div>
              <div className="text-sm text-neutral-600">Organisms</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent-600 mb-2">
                24/7
              </div>
              <div className="text-sm text-neutral-600">Monitoring</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                99%
              </div>
              <div className="text-sm text-neutral-600">Accuracy</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

