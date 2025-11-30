import PropTypes from 'prop-types'
import Card from './Card'
import Input from './Input'
import Button from './Button'

const PrescriptionForm = ({
  selectedAntibiotic,
  dosage,
  duration,
  instructions,
  onDosageChange,
  onDurationChange,
  onInstructionsChange,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!selectedAntibiotic) {
    return (
      <Card variant="filled" padding="md">
        <p className="text-neutral-600 text-center">
          Please select an antibiotic from the recommendations above to create a prescription.
        </p>
      </Card>
    )
  }

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="text-xl font-semibold text-neutral-900 mb-6">
        Prescription Details
      </h3>
      
      <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-sm text-primary-700 mb-1">
          <span className="font-semibold">Selected Antibiotic:</span>
        </p>
        <p className="text-lg font-bold text-primary-900">{selectedAntibiotic}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Dosage"
            name="dosage"
            value={dosage}
            onChange={(e) => onDosageChange(e.target.value)}
            placeholder="e.g., 500mg, 250mg twice daily"
            helperText="Enter the antibiotic dosage"
            required
          />
          <Input
            label="Duration"
            name="duration"
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            placeholder="e.g., 7 days, 10 days, 2 weeks"
            helperText="Enter the treatment duration"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Instructions / Notes
          </label>
          <textarea
            name="instructions"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="Enter additional instructions, notes, or special considerations..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 placeholder:text-neutral-400 resize-none"
          />
          <p className="mt-1.5 text-sm text-neutral-500">
            Add any special instructions, contraindications, or patient-specific notes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onDosageChange('')
              onDurationChange('')
              onInstructionsChange('')
            }}
            disabled={isSubmitting}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!dosage || !duration || isSubmitting}
            className="min-w-[180px]"
          >
            {isSubmitting ? 'Generating...' : 'Generate Prescription'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

PrescriptionForm.propTypes = {
  selectedAntibiotic: PropTypes.string,
  dosage: PropTypes.string,
  duration: PropTypes.string,
  instructions: PropTypes.string,
  onDosageChange: PropTypes.func.isRequired,
  onDurationChange: PropTypes.func.isRequired,
  onInstructionsChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
}

export default PrescriptionForm

