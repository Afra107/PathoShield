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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:bg-white print:static print:p-0 print:block">
      <Card variant="elevated" padding="lg" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-0 print:max-h-none print:overflow-visible print:p-4 print:w-full">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 print:text-xl">E-Prescription</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors print:hidden"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 print:space-y-3">
          {/* Header Section */}
          <div className="border-b border-neutral-200 pb-4 print:pb-1 print:border-b-2 print:mb-2">
            <div className="flex items-center gap-2 mb-2 print:mb-0.5">
              <span className="text-3xl print:text-xl">🧬</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary-600 print:text-base print:mb-0">PathoShield</h3>
                <p className="text-sm text-neutral-600 print:text-[10px] print:leading-tight">AMR Prediction & E-Prescription System</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-neutral-600 print:mt-1 print:text-[10px] print:grid print:grid-cols-2 print:gap-x-4 print:leading-tight">
              <p><strong>Date:</strong> {formatDate(prescription.date)}</p>
              <p><strong>Prescription ID:</strong> {prescription.prescriptionId}</p>
            </div>
          </div>

          {/* Patient and Clinical Information - Side by side in print */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2 print:mb-2">
            {/* Patient Information */}
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-0.5 print:text-xs">Patient Information</h4>
              <div className="bg-neutral-50 rounded-lg p-4 print:bg-transparent print:p-1.5 print:border print:border-neutral-300 print:rounded">
                <p className="text-sm text-neutral-700 print:text-[10px] print:leading-tight">
                  <strong>Patient ID:</strong> {prescription.patientId}
                </p>
              </div>
            </div>

            {/* Clinical Information */}
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-0.5 print:text-xs">Clinical Information</h4>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2 print:bg-transparent print:p-1.5 print:border print:border-neutral-300 print:space-y-0.5 print:rounded">
                <p className="text-sm text-neutral-700 print:text-[10px] print:leading-tight">
                  <strong>Bacterial Species:</strong> {prescription.bacterialSpecies}
                </p>
                {prescription.region && (
                  <p className="text-sm text-neutral-700 print:text-[10px] print:leading-tight">
                    <strong>Region:</strong> {prescription.region}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="print:mb-1">
            <h4 className="font-semibold text-neutral-900 mb-2 print:mb-0.5 print:text-xs">Prescription</h4>
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 print:bg-transparent print:p-1.5 print:border-2 print:border-neutral-900 print:rounded">
              <div className="space-y-3 print:space-y-0.5 print:grid print:grid-cols-2 print:gap-x-2 print:gap-y-0.5">
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0 print:text-[10px] print:text-neutral-700 print:leading-tight">Antibiotic</p>
                  <p className="text-lg font-bold text-primary-900 print:text-xs print:text-neutral-900 print:leading-tight">{prescription.antibiotic}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0 print:text-[10px] print:text-neutral-700 print:leading-tight">Dosage</p>
                  <p className="text-base text-primary-900 print:text-xs print:text-neutral-900 print:leading-tight">{prescription.dosage}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0 print:text-[10px] print:text-neutral-700 print:leading-tight">Duration</p>
                  <p className="text-base text-primary-900 print:text-xs print:text-neutral-900 print:leading-tight">{prescription.duration}</p>
                </div>
                {prescription.instructions && (
                  <div className="print:col-span-2 print:mt-0.5">
                    <p className="text-sm font-medium text-primary-700 mb-1 print:mb-0 print:text-[10px] print:text-neutral-700 print:leading-tight">Instructions</p>
                    <p className="text-base text-primary-900 whitespace-pre-wrap print:text-[10px] print:text-neutral-900 print:leading-tight">{prescription.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prediction Confidence */}
          {prescription.confidence && (
            <div className="print:mb-1">
              <h4 className="font-semibold text-neutral-900 mb-2 print:mb-0.5 print:text-xs">Prediction Confidence</h4>
              <div className="bg-neutral-50 rounded-lg p-4 print:bg-transparent print:p-1 print:border print:border-neutral-300 print:rounded">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-200 rounded-full h-2 print:h-1">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all print:h-1"
                      style={{ width: `${prescription.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 print:text-[10px] print:leading-tight">
                    {prescription.confidence}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-neutral-200 pt-4 print:pt-1 print:border-t print:mt-1">
            <p className="text-xs text-neutral-500 text-center print:text-[9px] print:leading-tight">
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

