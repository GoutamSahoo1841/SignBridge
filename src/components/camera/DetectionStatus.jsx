export default function DetectionStatus({ status }) {
  if (!status) return null

  const items = [
    { key: 'face', label: 'Face' },
    { key: 'pose', label: 'Pose' },
    { key: 'lh', label: 'Left Hand' },
    { key: 'rh', label: 'Right Hand' },
  ]

  return (
    <div className="detection-status">
      {items.map(({ key, label }) => (
        <div key={key} className="detection-item">
          <span className={`dot dot--${status[key] ? 'teal' : 'slate'}`} />
          <span className="detection-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

