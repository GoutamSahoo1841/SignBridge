import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

const ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  ok: CheckCircle,
}

export default function Alert({ variant = 'info', children, className = '' }) {
  const Icon = ICONS[variant] || Info
  return (
    <div className={`alert alert--${variant} ${className}`.trim()}>
      <Icon size={16} className="alert-icon" />
      <span>{children}</span>
    </div>
  )
}

