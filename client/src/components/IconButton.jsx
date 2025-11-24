import PropTypes from 'prop-types'

const IconButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center'
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  }
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
  
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

IconButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default IconButton

