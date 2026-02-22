import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import FileDrop from '../components/FileDrop'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Prediction = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const topRef = useRef(null)
  const eprescriptionRef = useRef(null)
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [formData, setFormData] = useState({
    organism: '',
    patientAge: '',
    patientGender: '',
    region: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [predictionResults, setPredictionResults] = useState(null)
  const [error, setError] = useState(null)

  // Handle scroll to anchor on mount
  useEffect(() => {
    if (location.hash === '#eprescription') {
      setTimeout(() => {
        const element = document.getElementById('eprescription')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else if (location.hash === '#top' && topRef.current) {
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [location.hash])

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    console.log('File selected:', file)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.organism.trim()) {
      setError('Organism is required')
      return
    }
    
    if (!selectedFile) {
      setError('Please upload a mass spectrometry data file')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Prepare FormData for multipart/form-data request
      const formDataToSend = new FormData()
      formDataToSend.append('file', selectedFile)
      formDataToSend.append('organism', formData.organism)
      if (formData.patientAge) {
        formDataToSend.append('patientAge', formData.patientAge)
      }
      if (formData.patientGender) {
        formDataToSend.append('patientGender', formData.patientGender)
      }
      if (formData.region) {
        formDataToSend.append('region', formData.region)
      }
      
      // Call backend API
      const response = await fetch(`${API_URL}/api/prediction/run`, {
        method: 'POST',
        body: formDataToSend,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to run prediction' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setPredictionResults(result)
    } catch (err) {
      console.error('Prediction error:', err)
      setError(err.message || 'Failed to run prediction. Please try again.')
      setPredictionResults(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNavigateToEPrescription = () => {
    if (predictionResults) {
      navigate('/eprescription', {
        state: {
          predictionData: predictionResults,
        },
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Page Header */}
        <div ref={topRef} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            AMR Prediction
          </h1>
          <p className="text-lg text-neutral-600">
            Upload mass spectrometry data and enter clinical information to predict antimicrobial resistance.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* File Upload Section */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Upload Mass Spectrometry Data
              </h2>
              <FileDrop
                onFileSelect={handleFileSelect}
                accept=".txt,.csv"
                maxSize={10 * 1024 * 1024} // 10MB
              />
              {selectedFile && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    <strong>Selected:</strong> {selectedFile.name || selectedFile[0]?.name}
                  </p>
                </div>
              )}
            </Card>

            {/* Clinical Information Section */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                Clinical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Organism"
                  name="organism"
                  value={formData.organism}
                  onChange={handleInputChange}
                  placeholder="e.g., E. coli, S. aureus"
                  helperText="Enter the bacterial species or strain"
                  required
                />
                <Input
                  label="Region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="e.g., North America, Europe, Asia"
                  helperText="Geographic region of the sample"
                />
                <Input
                  label="Patient Age"
                  name="patientAge"
                  type="number"
                  value={formData.patientAge}
                  onChange={handleInputChange}
                  placeholder="Age in years"
                  min="0"
                  max="120"
                />
                <Input
                  label="Patient Gender"
                  name="patientGender"
                  value={formData.patientGender}
                  onChange={handleInputChange}
                  placeholder="Male, Female, Other"
                />
              </div>
            </Card>

            {/* Error Message */}
            {error && (
              <Card variant="filled" padding="md" className="bg-red-50 border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedFile(null)
                  setFormData({
                    organism: '',
                    patientAge: '',
                    patientGender: '',
                    region: '',
                  })
                  setError(null)
                  setPredictionResults(null)
                }}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isProcessing}
                className="min-w-[150px]"
              >
                {isProcessing ? 'Processing...' : 'Run Prediction'}
              </Button>
            </div>
          </div>
        </form>

        {/* Prediction Results Section */}
        {predictionResults && (
          <Card ref={eprescriptionRef} variant="elevated" padding="lg" className="mt-8" id="eprescription">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Prediction Results
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Bacterial Species</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {predictionResults.bacterialSpecies}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600 mb-2">Susceptible Antibiotics</p>
                  <div className="space-y-2">
                    {predictionResults.susceptibleAntibiotics.map((ab) => {
                      const detail = predictionResults.antibioticDetails?.find(d => d.name === ab)
                      const confidence = detail?.confidence || 0
                      return (
                        <div key={ab} className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-200">
                          <span className="text-sm font-medium text-green-700">{ab}</span>
                          {detail && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600">
                                {confidence.toFixed(0)}% confidence
                              </span>
                              <div className="w-16 h-1.5 bg-green-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600 transition-all"
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-2">Resistant Antibiotics</p>
                  <div className="space-y-2">
                    {predictionResults.resistantAntibiotics.map((ab) => {
                      const detail = predictionResults.antibioticDetails?.find(d => d.name === ab)
                      const confidence = detail?.confidence || 0
                      return (
                        <div key={ab} className="flex items-center justify-between bg-red-50 rounded-lg p-2 border border-red-200">
                          <span className="text-sm font-medium text-red-700">{ab}</span>
                          {detail && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600">
                                {confidence.toFixed(0)}% confidence
                              </span>
                              <div className="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-600 transition-all"
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              {predictionResults.confidence && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-neutral-600">Overall Model Confidence</p>
                    <div className="group relative">
                      <svg className="w-4 h-4 text-neutral-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Overall confidence is calculated from the average uncertainty across all antibiotic predictions. Higher confidence (lower uncertainty) indicates more reliable predictions.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          predictionResults.confidence >= 80 ? 'bg-green-600' :
                          predictionResults.confidence >= 60 ? 'bg-yellow-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${predictionResults.confidence}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold min-w-[3rem] text-right ${
                      predictionResults.confidence >= 80 ? 'text-green-700' :
                      predictionResults.confidence >= 60 ? 'text-yellow-700' : 'text-orange-700'
                    }`}>
                      {predictionResults.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Based on Bayesian uncertainty estimation across {predictionResults.antibioticDetails?.length || 0} antibiotics
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleNavigateToEPrescription}
              className="w-full sm:w-auto"
            >
              Generate E-Prescription →
            </Button>
          </Card>
        )}

        {/* E-Prescription Module Section */}
        {!predictionResults && (
          <Card ref={eprescriptionRef} variant="elevated" padding="lg" className="mt-8" id="eprescription">
            <div className="flex items-start gap-4">
              <div className="text-4xl" aria-hidden="true">💊</div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  E-Prescription Module
                </h2>
                <p className="text-neutral-600 mb-4">
                  After running a prediction, you can generate an E-Prescription based on the 
                  AMR prediction results. The system will recommend susceptible antibiotics and 
                  help you create a complete prescription with dosage, duration, and instructions.
                </p>
                <p className="text-sm text-neutral-500">
                  Run a prediction above to access the E-Prescription module.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card variant="filled" padding="md" className="mt-8">
          <div className="flex gap-3">
            <div className="text-2xl" aria-hidden="true">ℹ️</div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                Prediction Information
              </h3>
              <p className="text-sm text-neutral-600">
                The prediction model analyzes mass spectrometry data (6000-dimensional spectrum vectors)
                along with bacterial species and region information to provide resistance predictions
                for various antimicrobial agents. Results are typically available within a few minutes.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Prediction

