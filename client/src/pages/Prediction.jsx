import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import FileDrop from '../components/FileDrop'

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
    setIsProcessing(true)
    
    // Mock prediction logic - replace with actual API call
    setTimeout(() => {
      // Mock prediction results
      const mockResults = {
        bacterialSpecies: formData.organism || 'E. coli',
        susceptibleAntibiotics: [
          'Amoxicillin',
          'Amoxicillin-Clavulanate',
          'Ceftriaxone',
          'Cefazolin',
          'Trimethoprim-Sulfamethoxazole',
          'Azithromycin',
        ],
        resistantAntibiotics: [
          'Ciprofloxacin',
          'Levofloxacin',
          'Gentamicin',
        ],
        region: formData.region || null,
        confidence: 87.5,
        patientId: 'PAT-00001',
      }
      
      setPredictionResults(mockResults)
      setIsProcessing(false)
    }, 2000)
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
                  <div className="flex flex-wrap gap-2">
                    {predictionResults.susceptibleAntibiotics.map((ab) => (
                      <span
                        key={ab}
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full"
                      >
                        {ab}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 mb-2">Resistant Antibiotics</p>
                  <div className="flex flex-wrap gap-2">
                    {predictionResults.resistantAntibiotics.map((ab) => (
                      <span
                        key={ab}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full"
                      >
                        {ab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {predictionResults.confidence && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Prediction Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${predictionResults.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">
                      {predictionResults.confidence}%
                    </span>
                  </div>
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

