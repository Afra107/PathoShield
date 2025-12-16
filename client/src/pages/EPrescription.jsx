import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import AntibioticSuggestionList from '../components/AntibioticSuggestionList'
import PrescriptionForm from '../components/PrescriptionForm'
import PrescriptionSummary from '../components/PrescriptionSummary'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const EPrescription = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get prediction data from navigation state
  const predictionData = location.state?.predictionData || null

  const [selectedAntibiotic, setSelectedAntibiotic] = useState('')
  const [dosage, setDosage] = useState('')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prescription, setPrescription] = useState(null)
  const [error, setError] = useState(null)

  // If no prediction data, show error or redirect
  useEffect(() => {
    if (!predictionData) {
      // Optionally redirect to prediction page
      // navigate('/prediction')
    }
  }, [predictionData, navigate])

  const handleSelectAntibiotic = (antibiotic) => {
    setSelectedAntibiotic(antibiotic)
    // Reset form when selecting a different antibiotic
    if (selectedAntibiotic !== antibiotic) {
      setDosage('')
      setDuration('')
      setInstructions('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!predictionData) {
      setError('Prediction data is missing')
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare prescription payload
      const payload = {
        patientId: predictionData.patientId,
        bacterialSpecies: predictionData.bacterialSpecies,
        region: predictionData.region || null,
        antibiotic: selectedAntibiotic,
        dosage: dosage,
        duration: duration,
        instructions: instructions || null,
        confidence: predictionData.confidence || null,
      }
      
      // Call backend API
      const response = await fetch(`${API_URL}/api/eprescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create prescription' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }
      
      const prescriptionData = await response.json()
      // Convert date string to ISO string format for PrescriptionSummary component
      prescriptionData.date = prescriptionData.date
      setPrescription(prescriptionData)
    } catch (err) {
      console.error('Prescription creation error:', err)
      setError(err.message || 'Failed to create prescription. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCloseSummary = () => {
    setPrescription(null)
  }

  if (!predictionData) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card variant="elevated" padding="lg">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                No Prediction Data Available
              </h2>
              <p className="text-neutral-600 mb-6">
                Please run a prediction first to generate an E-Prescription.
              </p>
              <Button variant="primary" onClick={() => navigate('/prediction')}>
                Go to AMR Prediction
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const { bacterialSpecies, susceptibleAntibiotics, resistantAntibiotics, region } = predictionData

  return (
    <>
      <div className="min-h-screen bg-neutral-50 py-8 print:hidden no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
                E-Prescription Module
              </h1>
              <p className="text-lg text-neutral-600">
                Generate prescriptions based on AMR prediction results.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/prediction')}>
              ← Back to Prediction
            </Button>
          </div>
        </div>

        {/* Prediction Summary Card */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Prediction Results Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Bacterial Species</p>
              <p className="text-lg font-semibold text-neutral-900">{bacterialSpecies}</p>
            </div>
            {region && (
              <div>
                <p className="text-sm text-neutral-600 mb-1">Region</p>
                <p className="text-lg font-semibold text-neutral-900">{region}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-neutral-600 mb-1">Susceptible Antibiotics</p>
              <p className="text-lg font-semibold text-green-600">
                {susceptibleAntibiotics?.length || 0} available
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Resistant Antibiotics</p>
              <p className="text-lg font-semibold text-red-600">
                {resistantAntibiotics?.length || 0} detected
              </p>
            </div>
          </div>
        </Card>

        {/* Antibiotic Recommendations */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <AntibioticSuggestionList
            susceptibleAntibiotics={susceptibleAntibiotics || []}
            resistantAntibiotics={resistantAntibiotics || []}
            onSelectAntibiotic={handleSelectAntibiotic}
            selectedAntibiotic={selectedAntibiotic}
          />
        </Card>

        {/* Prescription Form */}
        <PrescriptionForm
          selectedAntibiotic={selectedAntibiotic}
          dosage={dosage}
          duration={duration}
          instructions={instructions}
          onDosageChange={setDosage}
          onDurationChange={setDuration}
          onInstructionsChange={setInstructions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Error Message */}
        {error && (
          <Card variant="filled" padding="md" className="mt-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {/* Info Card */}
        <Card variant="filled" padding="md" className="mt-8">
          <div className="flex gap-3">
            <div className="text-2xl" aria-hidden="true">ℹ️</div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                E-Prescription Information
              </h3>
              <p className="text-sm text-neutral-600">
                This prescription is generated based on AMR prediction results. 
                Please review all information carefully and verify patient-specific 
                considerations before finalizing the prescription. Always follow 
                clinical guidelines and local regulations.
              </p>
            </div>
          </div>
        </Card>

        </div>
      </div>

      {/* Prescription Summary Modal - Rendered outside print:hidden container */}
      {prescription && (
        <PrescriptionSummary
          prescription={prescription}
          onClose={handleCloseSummary}
          onPrint={handlePrint}
        />
      )}
    </>
  )
}

export default EPrescription

