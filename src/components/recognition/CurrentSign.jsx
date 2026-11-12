export default function CurrentSign({ currentSign, confidence, topPreds, hasHands }) {
  const pct = Math.round((confidence || 0) * 100)

  return (
    <div className="current-sign-panel">
      <div className={`recognized-word${hasHands ? ' recognized-word--active' : ''}`}>
        {currentSign || '…'}
      </div>

      <div className="confidence-bar-wrap">
        <div className="confidence-bar">
          <div
            className="confidence-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="confidence-pct">{pct}%</span>
      </div>

      {topPreds && topPreds.length > 0 && (
        <div className="top-preds">
          {topPreds.map((p, i) => (
            <div key={i} className="top-pred-item">
              <span className="top-pred-label">{p.label}</span>
              <span className="top-pred-score">{Math.round(p.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

