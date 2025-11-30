import PropTypes from 'prop-types'
import Card from './Card'

const AntibioticSuggestionList = ({ 
  susceptibleAntibiotics = [], 
  resistantAntibiotics = [],
  onSelectAntibiotic,
  selectedAntibiotic 
}) => {
  // Antibiotic metadata for sorting and display
  const antibioticMetadata = {
    'Amoxicillin': { firstLine: true, safety: 'high', common: true },
    'Amoxicillin-Clavulanate': { firstLine: true, safety: 'high', common: true },
    'Ciprofloxacin': { firstLine: false, safety: 'medium', common: true },
    'Levofloxacin': { firstLine: false, safety: 'medium', common: true },
    'Ceftriaxone': { firstLine: true, safety: 'high', common: true },
    'Cefazolin': { firstLine: true, safety: 'high', common: true },
    'Azithromycin': { firstLine: true, safety: 'high', common: true },
    'Clarithromycin': { firstLine: true, safety: 'high', common: true },
    'Vancomycin': { firstLine: false, safety: 'medium', common: false },
    'Meropenem': { firstLine: false, safety: 'medium', common: false },
    'Imipenem': { firstLine: false, safety: 'medium', common: false },
    'Gentamicin': { firstLine: false, safety: 'medium', common: true },
    'Tobramycin': { firstLine: false, safety: 'medium', common: false },
    'Trimethoprim-Sulfamethoxazole': { firstLine: true, safety: 'high', common: true },
    'Doxycycline': { firstLine: true, safety: 'high', common: true },
    'Tetracycline': { firstLine: true, safety: 'high', common: true },
  }

  // Sort susceptible antibiotics by priority
  const sortedSusceptible = [...susceptibleAntibiotics].sort((a, b) => {
    const metaA = antibioticMetadata[a] || { firstLine: false, safety: 'low', common: false }
    const metaB = antibioticMetadata[b] || { firstLine: false, safety: 'low', common: false }
    
    // First-line > non-first-line
    if (metaA.firstLine !== metaB.firstLine) {
      return metaB.firstLine ? 1 : -1
    }
    
    // High safety > medium > low
    const safetyOrder = { high: 3, medium: 2, low: 1 }
    if (safetyOrder[metaA.safety] !== safetyOrder[metaB.safety]) {
      return safetyOrder[metaB.safety] - safetyOrder[metaA.safety]
    }
    
    // Common > uncommon
    if (metaA.common !== metaB.common) {
      return metaB.common ? 1 : -1
    }
    
    return a.localeCompare(b)
  })

  const getAntibioticBadge = (antibiotic) => {
    const meta = antibioticMetadata[antibiotic] || {}
    const badges = []
    
    if (meta.firstLine) {
      badges.push(
        <span key="first-line" className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
          First-Line
        </span>
      )
    }
    if (meta.safety === 'high') {
      badges.push(
        <span key="safety" className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          High Safety
        </span>
      )
    }
    if (meta.common) {
      badges.push(
        <span key="common" className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded">
          Common
        </span>
      )
    }
    
    return badges
  }

  return (
    <div className="space-y-4">
      {/* Susceptible Antibiotics */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">
          Recommended Antibiotics (Susceptible)
        </h3>
        {sortedSusceptible.length === 0 ? (
          <Card variant="filled" padding="md">
            <p className="text-neutral-600 text-sm">No susceptible antibiotics available.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedSusceptible.map((antibiotic) => (
              <Card
                key={antibiotic}
                variant={selectedAntibiotic === antibiotic ? 'elevated' : 'outlined'}
                padding="md"
                onClick={() => onSelectAntibiotic(antibiotic)}
                className={`cursor-pointer transition-all ${
                  selectedAntibiotic === antibiotic
                    ? 'ring-2 ring-primary-500 border-primary-500'
                    : 'hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 mb-2">{antibiotic}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {getAntibioticBadge(antibiotic)}
                    </div>
                    <p className="text-xs text-green-600 font-medium">✓ Susceptible</p>
                  </div>
                  {selectedAntibiotic === antibiotic && (
                    <div className="ml-2 text-primary-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resistant Antibiotics */}
      {resistantAntibiotics.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-3 text-red-600">
            Not Recommended (Resistant)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resistantAntibiotics.map((antibiotic) => (
              <Card
                key={antibiotic}
                variant="filled"
                padding="md"
                className="opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-neutral-700 line-through">{antibiotic}</h4>
                    <p className="text-xs text-red-600 font-medium mt-1">✗ Resistant</p>
                  </div>
                  <div className="text-red-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

AntibioticSuggestionList.propTypes = {
  susceptibleAntibiotics: PropTypes.arrayOf(PropTypes.string),
  resistantAntibiotics: PropTypes.arrayOf(PropTypes.string),
  onSelectAntibiotic: PropTypes.func.isRequired,
  selectedAntibiotic: PropTypes.string,
}

export default AntibioticSuggestionList

