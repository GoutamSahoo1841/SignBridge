export default function Toggle({ checked, onChange, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-label={ariaLabel}
    >
      <span />
    </button>
  )
}
