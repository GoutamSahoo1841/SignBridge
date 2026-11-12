export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}
