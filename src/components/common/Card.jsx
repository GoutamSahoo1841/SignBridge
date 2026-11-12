export default function Card({ children, heading, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {heading && <div className="card-heading">{heading}</div>}
      {children}
    </div>
  )
}

