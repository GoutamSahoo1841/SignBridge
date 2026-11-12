export default function StatusPill({ tone = 'teal', children }) {
  return (
    <span className={`status-pill ${tone}`}>
      <span className="pill-dot" />
      {children}
    </span>
  )
}
