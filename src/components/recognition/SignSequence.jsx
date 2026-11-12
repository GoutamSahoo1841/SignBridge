export default function SignSequence({ words, onRemove }) {
  if (!words || words.length === 0) {
    return (
      <div className="sign-sequence sign-sequence--empty">
        <span>Recognized signs appear here…</span>
      </div>
    )
  }

  return (
    <div className="sign-sequence">
      {words.map((w, i) => (
        <span
          key={i}
          className="sign-chip"
          onClick={() => onRemove && onRemove(i)}
          title="Click to remove"
        >
          {w}
          {onRemove && <span className="sign-chip-x">×</span>}
        </span>
      ))}
    </div>
  )
}

