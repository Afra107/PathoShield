import PropTypes from 'prop-types'
import Card from './Card'
import Button from './Button'

const PrescriptionSummary = ({ prescription, onClose, onPrint }) => {
  if (!prescription) return null

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:bg-white print:static print:p-0 print:block print:inset-auto">
      <Card variant="elevated" padding="lg" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-0 print:max-h-none print:overflow-visible print:p-6 print:w-full print:bg-white">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-neutral-900">E-Prescription</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 print:space-y-4">
          {/* Header Section with Logo */}
          <div className="border-b-2 border-neutral-300 pb-4 print:pb-3 print:mb-4 print:border-neutral-400">
            <div className="flex items-center gap-3 mb-3 print:mb-2">
              <span className="text-4xl print:text-3xl">🧬</span>
              <div>
                <h3 className="text-2xl font-bold text-primary-600 print:text-xl print:text-primary-600">PathoShield</h3>
                <p className="text-sm text-neutral-600 print:text-xs print:text-neutral-600">AMR Prediction & E-Prescription System</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-neutral-600 print:mt-2 print:text-xs print:grid print:grid-cols-2 print:gap-x-6 print:text-neutral-600">
              <p><strong>Date:</strong> {formatDate(prescription.date)}</p>
              <p><strong>Prescription ID:</strong> {prescription.prescriptionId}</p>
            </div>
          </div>

          {/* Patient and Clinical Information - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:mb-3">
            {/* Patient Information */}
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-1.5 print:text-sm">Patient Information</h4>
              <div className="bg-neutral-50 rounded-lg p-4 print:bg-neutral-50 print:p-3 print:border print:border-neutral-300 print:rounded">
                <p className="text-sm text-neutral-700 print:text-sm">
                  <strong>Patient ID:</strong> {prescription.patientId}
                </p>
              </div>
            </div>

            {/* Clinical Information */}
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-1.5 print:text-sm">Clinical Information</h4>
              <div className="bg-neutral-50 rounded-lg p-4 print:bg-neutral-50 print:p-3 print:border print:border-neutral-300 print:rounded">
                <p className="text-sm text-neutral-700 print:text-sm">
                  <strong>Bacterial Species:</strong> {prescription.bacterialSpecies}
                </p>
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="print:mb-3">
            <h4 className="font-semibold text-neutral-900 mb-2 print:mb-1.5 print:text-sm">Prescription</h4>
            <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200 print:bg-primary-50 print:p-4 print:border-2 print:border-primary-300 print:rounded">
              <div className="space-y-3 print:space-y-2 print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-2">
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0.5 print:text-xs print:text-primary-600">Antibiotic</p>
                  <p className="text-lg font-bold text-primary-900 print:text-base print:text-neutral-900">{prescription.antibiotic}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0.5 print:text-xs print:text-primary-600">Dosage</p>
                  <p className="text-base text-primary-900 print:text-sm print:text-neutral-900">{prescription.dosage}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0.5 print:text-xs print:text-primary-600">Duration</p>
                  <p className="text-base text-primary-900 print:text-sm print:text-neutral-900">{prescription.duration}</p>
                </div>
                {prescription.instructions && (
                  <div className="print:col-span-2">
                    <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0.5 print:text-xs print:text-primary-600">Instructions</p>
                    <p className="text-base text-primary-900 whitespace-pre-wrap print:text-sm print:text-neutral-900">{prescription.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prediction Confidence */}
          {prescription.confidence && (
            <div className="print:mb-3">
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-1.5 print:text-sm">Prediction Confidence</h4>
              <div className="bg-neutral-50 rounded-lg p-4 print:bg-neutral-50 print:p-3 print:rounded">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-neutral-200 rounded-full h-3 print:h-3 print:border print:border-neutral-400" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all print:h-3 print:bg-primary-600"
                      style={{ 
                        width: `${prescription.confidence}%`,
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact',
                        backgroundColor: '#005cb3' // primary-600 color fallback
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 print:text-sm print:min-w-[3rem]">
                    {prescription.confidence}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-neutral-300 pt-4 print:pt-3 print:mt-4 print:border-neutral-400">
            <p className="text-xs text-neutral-500 text-center print:text-xs print:text-neutral-600">
              This prescription is generated based on AMR prediction results. 
              Please review and verify all information before prescribing.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-neutral-200 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onPrint}>
              Print / Save PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

PrescriptionSummary.propTypes = {
  prescription: PropTypes.shape({
    prescriptionId: PropTypes.string.isRequired,
    patientId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    bacterialSpecies: PropTypes.string.isRequired,
    region: PropTypes.string,
    antibiotic: PropTypes.string.isRequired,
    dosage: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    instructions: PropTypes.string,
    confidence: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
}

export default PrescriptionSummary

