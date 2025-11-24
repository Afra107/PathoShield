import { forwardRef } from 'react'
import PropTypes from 'prop-types'

const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : helperId}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-all duration-200
          focus-ring
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-neutral-300 focus:border-primary-500'
          }
          ${disabled 
            ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' 
            : 'bg-white text-neutral-900'
          }
          placeholder:text-neutral-400
          ${className}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
}

export default Input

