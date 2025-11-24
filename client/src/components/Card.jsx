import PropTypes from 'prop-types'

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-xl shadow-sm border transition-all duration-200'
  
  const variants = {
    default: 'bg-white border-neutral-200',
    elevated: 'bg-white border-neutral-200 shadow-md hover:shadow-lg',
    outlined: 'bg-transparent border-2 border-neutral-300',
    filled: 'bg-neutral-50 border-neutral-200',
  }
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const interactiveStyles = onClick ? 'cursor-pointer hover:shadow-md' : ''
  
  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'filled']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  className: PropTypes.string,
  onClick: PropTypes.func,
}

export default Card

