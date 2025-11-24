import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import FileDrop from '../components/FileDrop'

const Prediction = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [formData, setFormData] = useState({
    organism: '',
    patientAge: '',
    patientGender: '',
    region: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)

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
    
    // Placeholder for prediction logic
    setTimeout(() => {
      setIsProcessing(false)
      alert('Prediction feature will be implemented soon!')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
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

